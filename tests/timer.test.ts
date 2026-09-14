import { describe, expect, it } from "vitest";
import { deadlineFrom, formatRemaining, isAttemptOpen } from "@/lib/time";

describe("server-side timer", () => {
  it("derives deadline from server start time", () => {
    const start = new Date("2026-09-15T10:00:00.000Z");
    expect(deadlineFrom(start, 120).toISOString()).toBe("2026-09-15T12:00:00.000Z");
  });

  it("rejects submissions after the deadline", () => {
    const deadline = new Date("2026-09-15T12:00:00.000Z");
    expect(isAttemptOpen(deadline, new Date("2026-09-15T11:59:59.000Z"))).toBe(true);
    expect(isAttemptOpen(deadline, new Date("2026-09-15T12:00:01.000Z"))).toBe(false);
  });

  it("formats remaining time", () => {
    expect(formatRemaining(new Date("2026-09-15T12:00:00.000Z"), new Date("2026-09-15T10:01:39.000Z"))).toBe("01:58:21");
  });
});
