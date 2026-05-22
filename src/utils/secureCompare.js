import { timingSafeEqual } from "crypto";

export function secureCompare(value, expected) {
  if (typeof value !== "string" || typeof expected !== "string") {
    return false;
  }

  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);

  if (valueBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(valueBuffer, expectedBuffer);
}
