import Docker from "dockerode";
import { prisma } from "../src/lib/prisma";
import { evaluateSubmissionResult } from "./scoring";

const docker = new Docker();
const pollInterval = Number(process.env.WORKER_POLL_INTERVAL_MS ?? 1200);
const image = process.env.SANDBOX_DOCKER_IMAGE ?? "exam-python-sandbox:latest";

async function claimJob() {
  const job = await prisma.executionJob.findFirst({
    where: { status: "QUEUED" },
    orderBy: { createdAt: "asc" }
  });

  if (!job) return null;

  const claimed = await prisma.executionJob.updateMany({
    where: { id: job.id, status: "QUEUED" },
    data: { status: "RUNNING", lockedAt: new Date(), startedAt: new Date() }
  });

  if (claimed.count === 0) return null;

  await prisma.submission.update({ where: { id: job.submissionId }, data: { status: "RUNNING" } });

  return prisma.executionJob.findUnique({
    where: { id: job.id },
    include: {
      submission: {
        include: {
          question: { include: { testCases: true, datasets: true } }
        }
      }
    }
  });
}

async function runPythonContainer(payload: unknown, timeoutMs: number, memoryMb: number) {
  const input = Buffer.from(JSON.stringify(payload)).toString("base64");
  const container = await docker.createContainer({
    Image: image,
    Cmd: ["python", "/runner/evaluate.py", input],
    AttachStdout: true,
    AttachStderr: true,
    NetworkDisabled: true,
    HostConfig: {
      AutoRemove: true,
      Memory: memoryMb * 1024 * 1024,
      NanoCpus: 1_000_000_000,
      ReadonlyRootfs: true,
      PidsLimit: 64,
      SecurityOpt: ["no-new-privileges"]
    }
  });

  const stream = await container.attach({ stream: true, stdout: true, stderr: true });
  await container.start();

  const chunks: Buffer[] = [];
  stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));

  const timeout = setTimeout(() => {
    container.kill().catch(() => undefined);
  }, timeoutMs + 1000);

  await container.wait();
  clearTimeout(timeout);
  return Buffer.concat(chunks).toString("utf8");
}

async function processJob() {
  const job = await claimJob();
  if (!job) return;

  try {
    const question = job.submission.question;
    const tests = question.testCases.filter((test) => test.public || job.runHidden);
    const payload = {
      type: question.type,
      code: job.submission.code,
      tests,
      datasets: question.datasets
    };

    const raw = await runPythonContainer(payload, question.timeLimitMs, question.memoryLimitMb);

    const result = evaluateSubmissionResult(raw, tests, question.marks);

    await prisma.$transaction([
      prisma.submission.update({
        where: { id: job.submissionId },
        data: {
          status: result.status,
          score: result.score,
          passedTests: result.passed,
          totalTests: result.total,
          stdout: result.stdout,
          stderr: result.stderr,
          executionTime: result.executionTime
        }
      }),
      prisma.questionAttempt.update({
        where: { attemptId_questionId: { attemptId: job.attemptId, questionId: question.id } },
        data: { score: result.score, passedTests: result.passed, totalTests: result.total, status: "SUBMITTED" }
      }),
      prisma.executionJob.update({ where: { id: job.id }, data: { status: result.status, finishedAt: new Date(), error: result.stderr } })
    ]);

    const attempts = await prisma.questionAttempt.findMany({ where: { attemptId: job.attemptId } });
    await prisma.examAttempt.update({
      where: { id: job.attemptId },
      data: { totalScore: attempts.reduce((sum, item) => sum + item.score, 0) }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown worker error";
    await prisma.executionJob.update({ where: { id: job.id }, data: { status: "ERROR", finishedAt: new Date(), error: message } });
    await prisma.submission.update({ where: { id: job.submissionId }, data: { status: "ERROR", stderr: message } });
  }
}

async function loop() {
  for (;;) {
    await processJob();
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }
}

loop().catch((error) => {
  console.error(error);
  process.exit(1);
});
