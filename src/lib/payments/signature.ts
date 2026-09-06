import { createHmac, timingSafeEqual } from "crypto";

export function hmacSha256Hex(secret: string, payload: string) {
  return createHmac("sha256", secret).update(payload, "utf8").digest("hex");
}

export function hmacSha256Base64(secret: string, payload: string) {
  return createHmac("sha256", secret).update(payload, "utf8").digest("base64");
}

export function signaturesMatch(expected: string, actual: string) {
  const left = Buffer.from(expected);
  const right = Buffer.from(actual);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function verifyStripeSignature(rawBody: string, header: string | null, secret: string) {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((item) => {
      const [key, ...rest] = item.split("=");
      return [key, rest.join("=")];
    }),
  );
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (age > 60 * 5) return false;
  const expected = hmacSha256Hex(secret, `${timestamp}.${rawBody}`);
  return signaturesMatch(expected, signature);
}

export function verifyPaystackSignature(rawBody: string, header: string | null, secret: string) {
  if (!header) return false;
  return signaturesMatch(hmacSha256Hex(secret, rawBody), header);
}

export function verifyFlutterwaveSignature(header: string | null, secret: string) {
  if (!header) return false;
  return signaturesMatch(secret, header);
}
