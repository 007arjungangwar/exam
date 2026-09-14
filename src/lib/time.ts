export function deadlineFrom(startedAt: Date, durationMinutes: number) {
  return new Date(startedAt.getTime() + durationMinutes * 60 * 1000);
}

export function isAttemptOpen(deadline: Date, now = new Date()) {
  return now.getTime() <= deadline.getTime();
}

export function formatRemaining(deadline: Date, now = new Date()) {
  const seconds = Math.max(0, Math.floor((deadline.getTime() - now.getTime()) / 1000));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
