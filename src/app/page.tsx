import { ShieldCheck } from "lucide-react";
import { StudentEntryForm } from "@/components/student-entry-form";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#eef1f4]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-10">
        <section className="grid w-full gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded bg-white px-3 py-2 text-sm font-medium text-brand shadow-sm">
              <ShieldCheck className="h-4 w-4" />
              Supervised laboratory assessment
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-normal text-ink md:text-5xl">
              University Coding Examination Platform
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Students enter only after professor activation, a live exam code check, and server-side session validation.
            </p>
          </div>
          <StudentEntryForm />
        </section>
      </div>
    </main>
  );
}
