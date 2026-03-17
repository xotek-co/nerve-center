import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "nc_session";
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const ALLOWED_EMAIL = "daniyalijaz922@gmail.com";
export const ALLOWED_PASSWORD = "daniyal123456";

const FALLBACK_SECRET = "nerve-center-dev-secret-min-16-chars";

function getSecret(required = false): string {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (required) {
    throw new Error("AUTH_SECRET must be set and at least 16 characters (add to .env.local)");
  }
  return FALLBACK_SECRET;
}

export async function createSignedToken(): Promise<string> {
  const secret = new TextEncoder().encode(getSecret(true));
  return await new SignJWT({ v: 1 })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(Math.floor((Date.now() + TOKEN_TTL_MS) / 1000))
    .sign(secret);
}

export async function verifySignedToken(token: string): Promise<boolean> {
  try {
    const secret = new TextEncoder().encode(getSecret());
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export function getAuthCookieName(): string {
  return COOKIE_NAME;
}

export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: TOKEN_TTL_MS / 1000,
    path: "/",
  };
}
