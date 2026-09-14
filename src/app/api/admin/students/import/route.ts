import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type StudentCsv = {
  PRN: string;
  Name: string;
  Email: string;
  Section: string;
  Seat: string;
};

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, message: "CSV file is required." }, { status: 400 });
  }

  const rows = parse(await file.text(), { columns: true, skip_empty_lines: true, trim: true }) as StudentCsv[];
  const result = await prisma.$transaction(
    rows.map((row) =>
      prisma.student.upsert({
        where: { prn: row.PRN.toUpperCase() },
        update: {
          name: row.Name,
          email: row.Email.toLowerCase(),
          section: row.Section,
          seatNumber: row.Seat,
          active: true
        },
        create: {
          prn: row.PRN.toUpperCase(),
          name: row.Name,
          email: row.Email.toLowerCase(),
          section: row.Section,
          seatNumber: row.Seat
        }
      })
    )
  );

  return NextResponse.json({ ok: true, imported: result.length });
}
