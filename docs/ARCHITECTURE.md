# Architecture

The platform separates normal web traffic from untrusted code execution.

Student flow:

1. Student submits PRN, email and six-digit code.
2. The API validates the active exam, student record, activation, code hash and active session.
3. The server creates an exam attempt, question attempts, deadline and one active session.
4. Autosave writes code to the database; local storage is only secondary recovery.
5. Run and submit create queued execution jobs.
6. Worker containers evaluate public or hidden tests and update submissions/results.

Execution flow:

`Student -> Next.js API -> PostgreSQL execution_jobs -> Worker -> Docker sandbox -> PostgreSQL -> UI`

The Next.js server never calls `exec`, `eval` or a local subprocess for student code. The worker runs submissions in a restricted Docker container with a read-only root filesystem, disabled networking, memory limits, CPU quota, pid limit, timeout cleanup and no production database credentials.

For production, run multiple worker replicas on separate compute from the web app. Use a managed PostgreSQL instance, enforce HTTPS, rotate secrets, enable database backups and run a full load test before examination day.
