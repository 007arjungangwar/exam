# University Coding Examination Platform

A production-oriented Next.js/TypeScript starter for supervised Python, Pandas and SQL coding examinations.

Included:

- Student PRN/email/code verification
- Professor dashboard and admin authentication
- Six-digit exam code generation with hashed storage
- Individual student activation
- One active session per student
- Server-side attempt timer
- Autosave and submission APIs
- PostgreSQL/Prisma schema with indexes and audit logs
- Queued execution worker with Docker sandbox hooks
- Seed data, docs, tests and k6 load script

Start locally:

```bash
cp .env.example .env
docker compose up -d postgres
docker build -t exam-python-sandbox:latest sandbox/python
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

In a second terminal:

```bash
npm run worker
```

See `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/DEPLOYMENT.md` and `docs/TESTING.md` before using this for a real examination.
