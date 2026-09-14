# Security Notes

- Students cannot enter without a matching PRN/email, active student status, active exam, professor activation, valid six-digit code and no existing active session.
- Verification failures return a generic message to reduce enumeration risk.
- Exam codes are cryptographically random and stored as bcrypt hashes.
- Timers are enforced server-side using `started_at`, `duration_seconds` and `deadline`.
- All submissions are checked against the server deadline.
- Admin and student sessions use HTTP-only cookies signed with `JWT_SECRET`.
- Admin routes require admin session validation.
- Student routes verify the attempt in the signed session and do not trust URL IDs alone.
- Code execution is queued and handled by a separate worker using Docker isolation.
- Browser controls such as focus logging or fullscreen are supplementary only; they are not treated as perfect anti-cheating controls.

Production hardening checklist:

- Use HTTPS and `SECURE_COOKIES=true`.
- Use long random secrets and rotate them per environment.
- Restrict worker access to only the queue database tables it needs.
- Put workers on isolated infrastructure without production application secrets.
- Disable outbound network access for sandbox containers.
- Keep Docker, Python, Node and database versions patched.
- Add centralized audit log retention.
- Load test with representative hidden tests and datasets.
