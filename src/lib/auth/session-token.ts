import { SignJWT, jwtVerify } from "jose";

const ALG = "HS256";
const MIN_SECRET = 32;

export function getAuthSecret() {
  return process.env.AUTH_SECRET || "";
}

export function isAuthSecretStrong(secret = getAuthSecret()) {
  return secret.length >= MIN_SECRET && !/^replace-with|^changeme|^secret$/i.test(secret);
}

export function authSecretKey(secret = getAuthSecret()) {
  const value = secret || "dev-insecure-auth-secret";
  return new TextEncoder().encode(value);
}

export async function signSessionJwt(input: { userId: string; expiresAt: Date; sessionId: string }) {
  return new SignJWT({ uid: input.userId, sid: input.sessionId })
    .setProtectedHeader({ alg: ALG })
    .setSubject(input.userId)
    .setJti(input.sessionId)
    .setIssuedAt()
    .setExpirationTime(input.expiresAt)
    .sign(authSecretKey());
}

export async function verifySessionJwt(token: string) {
  try {
    const { payload } = await jwtVerify(token, authSecretKey());
    return {
      userId: String(payload.uid || payload.sub || ""),
      sessionId: String(payload.sid || payload.jti || ""),
    };
  } catch {
    return null;
  }
}
