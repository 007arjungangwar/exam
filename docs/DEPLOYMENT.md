# Deployment

## Local Development

1. Copy `.env.example` to `.env`.
2. Start PostgreSQL: `docker compose up -d postgres`.
3. Build the sandbox image: `docker build -t exam-python-sandbox:latest sandbox/python`.
4. Install dependencies: `npm install`.
5. Generate Prisma: `npm run db:generate`.
6. Apply schema: `npm run db:migrate`.
7. Seed demo data: `npm run db:seed`.
8. Start the web app: `npm run dev`.
9. Start the worker in another terminal: `npm run worker`.

Seeded admin:

- Email: value of `ADMIN_EMAIL`, default `professor@college.edu`
- Password: value of `ADMIN_PASSWORD`, default `change-me-before-use`

Seeded exam code: `482731`

## Production

Use separate Development, Staging and Production environments. Each environment needs its own database, JWT secret, admin account and sandbox worker deployment.

Recommended low-cost first deployment:

- Web: Vercel or a small container host
- Database: Supabase PostgreSQL, Neon or managed PostgreSQL
- Worker: small VM/container runner with Docker available
- Queue: PostgreSQL table initially; move to Redis/SQS when execution volume grows

Before a real exam:

- Run migrations against staging.
- Run worker concurrency tests with realistic questions.
- Run k6 at 10, 30, 60 and 120 concurrent users.
- Confirm network restrictions on sandbox containers.
- Confirm backups, monitoring and professor emergency controls.
