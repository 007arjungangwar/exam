import { describe, expect, it } from "vitest";
import { evaluateSubmissionResult } from "../worker/scoring";

describe("scoring", () => {
  it("scores weighted test cases", () => {
    const result = evaluateSubmissionResult(
      JSON.stringify({ status: "FAILED", results: [{ passed: true }, { passed: false }, { passed: true }] }),
      [{ weight: 1 }, { weight: 2 }, { weight: 3 }],
      12
    );

    expect(result.passed).toBe(2);
    expect(result.total).toBe(3);
    expect(result.score).toBe(8);
  });
});
