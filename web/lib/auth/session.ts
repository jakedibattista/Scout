import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export type Role = "athlete" | "scout";

export type Session = {
  username: string;
  role: Role;
  exp: number;
};

const COOKIE_NAME = "scout_session";
const MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
  // dev fallback keeps local runs working; set SESSION_SECRET in any real deploy.
  return (
    process.env.SESSION_SECRET ??
    process.env.FIREBASE_PROJECT_ID ??
    "dev-insecure-session-secret"
  );
}

function sign(data: string): string {
  return createHmac("sha256", getSecret()).update(data).digest("base64url");
}

function encodeSession(payload: Session): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decodeSession(token: string | undefined): Session | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;

  const expected = sign(body);
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString()
    ) as Session;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

/** Issue a signed, HttpOnly session cookie for the given user. */
export async function createSession(username: string, role: Role): Promise<void> {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC;
  const token = encodeSession({ username, role, exp });
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
}

/** Read and verify the current session, or null if absent/invalid/expired. */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return decodeSession(store.get(COOKIE_NAME)?.value);
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export function unauthorized(error = "Authentication required.") {
  return Response.json({ ok: false, error }, { status: 401 });
}

export function forbidden(error = "You do not have access to this resource.") {
  return Response.json({ ok: false, error }, { status: 403 });
}
