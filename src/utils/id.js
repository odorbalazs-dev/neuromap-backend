import crypto from "crypto";

export function createId() {
  return crypto.randomUUID();
}