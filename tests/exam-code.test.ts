import { describe, expect, it } from "vitest";
import { generateSixDigitCode, hashExamCode, verifyExamCode } from "@/lib/exam-code";

describe("exam code", () => {
  it("generates a six digit numeric code", () => {
    expect(generateSixDigitCode()).toMatch(/^\d{6}$/);
  });

  it("hashes and verifies codes", async () => {
    const hash = await hashExamCode("482731");
    await expect(verifyExamCode("482731", hash)).resolves.toBe(true);
    await expect(verifyExamCode("111111", hash)).resolves.toBe(false);
  });
});
