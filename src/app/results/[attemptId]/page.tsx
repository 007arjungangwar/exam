import { notFound, redirect } from "next/navigation";
import { getAdminSession, getStudentSession } from "@/lib/auth";
import { getAttemptResults } from "@/lib/student-data";

export default async function ResultsPage({ params }: { params: { attemptId: string } }) {
  const [adminSession, studentSession] = await Promise.all([getAdminSession(), getStudentSession()]);

  if (!adminSession && studentSession?.attemptId !== params.attemptId) {
    redirect("/");
  }

  const result = await getAttemptResults(params.attemptId);

  if (!result) {
    notFound();
  }

  const percentage = result.totalMarks > 0 ? Math.round((result.totalScore / result.totalMarks) * 10000) / 100 : 0;

  return (
    <main className="min-h-screen bg-[#eef1f4] px-6 py-8">
      <section className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-semibold text-ink">Results</h1>
        <div className="mt-6 rounded border border-line bg-white p-6 shadow-soft">
          <p className="font-medium">{result.student.name}</p>
          <p className="text-sm text-slate-600">{result.student.prn} - {result.student.email}</p>
          <div className="mt-6 overflow-hidden rounded border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-panel">
                <tr>
                  <th className="px-4 py-3">Question</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Maximum</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Tests</th>
                </tr>
              </thead>
              <tbody>
                {result.questions.map((question) => (
                  <tr key={question.id} className="border-t border-line">
                    <td className="px-4 py-3">{question.title}</td>
                    <td className="px-4 py-3">{question.type}</td>
                    <td className="px-4 py-3">{question.marks}</td>
                    <td className="px-4 py-3">{question.score}</td>
                    <td className="px-4 py-3">{question.passedTests}/{question.totalTests}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex flex-wrap gap-6 text-lg font-semibold">
            <p>Total: {result.totalScore} / {result.totalMarks}</p>
            <p>Percentage: {percentage}%</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-6 text-sm text-slate-600">
            <p>Status: {result.attempt.status}</p>
            <p>Started: {new Date(result.attempt.startedAt).toLocaleString()}</p>
            <p>Completed: {result.attempt.completedAt ? new Date(result.attempt.completedAt).toLocaleString() : "-"}</p>
            <p>Duration used: {result.attempt.durationUsedSeconds ?? "-"} seconds</p>
          </div>
        </div>
      </section>
    </main>
  );
}
