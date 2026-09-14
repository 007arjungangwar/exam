import type { SubmissionStatus } from "@prisma/client";

type WorkerResult = {
  status?: SubmissionStatus;
  stdout?: string;
  stderr?: string;
  executionTime?: number;
  results?: Array<{ passed: boolean; weight?: number }>;
};

export function evaluateSubmissionResult(raw: string, tests: Array<{ weight: number }>, marks: number) {
  let parsed: WorkerResult;
  try {
    const jsonStart = raw.indexOf("{");
    parsed = JSON.parse(jsonStart >= 0 ? raw.slice(jsonStart) : raw) as WorkerResult;
  } catch {
    parsed = { status: "ERROR", stderr: raw, results: [] };
  }

  const totalWeight = tests.reduce((sum, test) => sum + test.weight, 0) || 1;
  const passedWeight = (parsed.results ?? []).reduce((sum, result, index) => sum + (result.passed ? tests[index]?.weight ?? result.weight ?? 1 : 0), 0);
  const score = Math.round((marks * passedWeight * 100) / totalWeight) / 100;
  const passed = (parsed.results ?? []).filter((result) => result.passed).length;
  const total = tests.length;
  const status = parsed.status ?? (passed === total ? "PASSED" : "FAILED");

  return {
    status,
    score,
    passed,
    total,
    stdout: parsed.stdout ?? "",
    stderr: parsed.stderr ?? "",
    executionTime: parsed.executionTime ?? null
  };
}
