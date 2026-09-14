import { createHash, randomBytes } from "crypto";

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function randomToken() {
  return randomBytes(32).toString("hex");
}

export function genericVerificationError() {
  return "Unable to verify examination access. Please confirm your details with the invigilator.";
}
