import bcrypt from "bcryptjs";
import { randomInt } from "crypto";

export function generateSixDigitCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashExamCode(code: string) {
  return bcrypt.hash(code, 12);
}

export function verifyExamCode(code: string, hash: string) {
  return bcrypt.compare(code, hash);
}
