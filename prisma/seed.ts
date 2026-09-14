import bcrypt from "bcryptjs";
import { PrismaClient, QuestionType } from "@prisma/client";
import { hashExamCode } from "../src/lib/exam-code";

const prisma = new PrismaClient();
const adminEmail = process.env.ADMIN_EMAIL ?? "arjungangwariitpkd@gmail.com";
const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";

async function main() {
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const admin = await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {
      name: "Professor Admin",
      passwordHash
    },
    create: {
      name: "Professor Admin",
      email: adminEmail,
      passwordHash
    }
  });

  const students = await Promise.all(
    [
      ["25SCDS001", "Student One", "student1@college.edu", "Sec 1", "A01"],
      ["25SCDS002", "Student Two", "student2@college.edu", "Sec 1", "A02"],
      ["25SCDS003", "Student Three", "student3@college.edu", "Sec 1", "A03"]
    ].map(([prn, name, email, section, seatNumber]) =>
      prisma.student.upsert({
        where: { prn },
        update: { name, email, section, seatNumber, active: true },
        create: { prn, name, email, section, seatNumber }
      })
    )
  );

  const exam = await prisma.exam.create({
    data: {
      title: "Python, SQL and Pandas Assessment",
      description: "Two hour assessment covering Python, Pandas and SQL.",
      durationMinutes: 120,
      totalMarks: 30,
      status: "ACTIVE",
      accessCodeHash: await hashExamCode("482731"),
      codeGeneratedAt: new Date(),
      questions: {
        create: [
          {
            type: QuestionType.PYTHON,
            title: "Maximum Value",
            description: "Write a function solve(values) that returns the maximum integer in values.",
            instructions: "Return only the maximum value. Do not print inside solve.",
            marks: 10,
            difficulty: "Easy",
            language: "python",
            starterCode: "def solve(values):\n    # TODO\n    return None\n",
            order: 1,
            testCases: {
              create: [
                { name: "sample", public: true, input: { args: [[1, 4, 2]] }, expectedOutput: { value: 4 }, weight: 1 },
                { name: "negative numbers", public: false, input: { args: [[-9, -3, -7]] }, expectedOutput: { value: -3 }, weight: 2 }
              ]
            }
          },
          {
            type: QuestionType.PANDAS,
            title: "Total Sales By Region",
            description: "Using sales.csv, return a DataFrame with columns region,total sorted by region.",
            instructions: "Implement solve() and return the resulting DataFrame.",
            marks: 10,
            difficulty: "Medium",
            language: "python",
            starterCode: "import pandas as pd\n\ndef solve():\n    df = pd.read_csv('sales.csv')\n    # TODO\n    return df\n",
            order: 2,
            datasets: {
              create: {
                filename: "sales.csv",
                public: true,
                content: "region,amount\nNorth,100\nSouth,75\nNorth,50\n"
              }
            },
            testCases: {
              create: [
                {
                  name: "sample aggregation",
                  public: true,
                  input: { files: ["sales.csv"] },
                  expectedOutput: { records: [{ region: "North", total: 150 }, { region: "South", total: 75 }] },
                  weight: 1
                }
              ]
            }
          },
          {
            type: QuestionType.SQL,
            title: "Employees By Department",
            description: "Return department names with employee counts.",
            instructions: "Output columns department_name and employee_count ordered by department_name.",
            marks: 10,
            difficulty: "Medium",
            language: "sql",
            starterCode: "select d.name as department_name, count(e.id) as employee_count\nfrom departments d\nleft join employees e on e.department_id = d.id\ngroup by d.name\norder by d.name;",
            order: 3,
            testCases: {
              create: {
                name: "sample schema",
                public: true,
                input: {
                  setupSql: [
                    "create table departments (id int primary key, name text);",
                    "create table employees (id int primary key, department_id int references departments(id));",
                    "insert into departments values (1, 'CS'), (2, 'Math');",
                    "insert into employees values (1, 1), (2, 1);"
                  ]
                },
                expectedOutput: { rows: [{ department_name: "CS", employee_count: 2 }, { department_name: "Math", employee_count: 0 }] },
                weight: 1
              }
            }
          }
        ]
      }
    },
    include: { questions: true }
  });

  await Promise.all(
    students.map((student) =>
      prisma.examStudent.upsert({
        where: { examId_studentId: { examId: exam.id, studentId: student.id } },
        update: { active: true, activatedBy: admin.id },
        create: { examId: exam.id, studentId: student.id, activatedBy: admin.id }
      })
    )
  );
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
