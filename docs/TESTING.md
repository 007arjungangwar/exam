# Testing

Automated tests cover exam code hashing, server-side timer behavior and scoring. Expand integration tests against a disposable PostgreSQL database for:

- student verification
- incorrect PRN/email
- incorrect exam code
- inactive student
- unauthorized student
- duplicate active session
- expired exam
- submission after deadline
- autosave
- reconnect
- admin authorization
- Python/Pandas execution
- SQL execution once the SQL worker adapter is enabled

Load test plan:

1. 10 concurrent students for smoke validation.
2. 30 concurrent students with autosave and run-code traffic.
3. 60 concurrent students with mixed public and hidden submissions.
4. 120 concurrent students with worker replicas sized to expected code execution load.

Use `BASE_URL=http://localhost:3000 k6 run load/k6-exam-flow.js` for the included smoke load script.
