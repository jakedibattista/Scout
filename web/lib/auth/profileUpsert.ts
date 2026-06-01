import { adminDb, adminFieldValue } from "@/lib/firebaseAdmin";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, getSession, type Role } from "@/lib/auth/session";

type UpsertInput = {
  role: Role;
  username: string;
  password?: string;
  email?: string;
  profile: Record<string, unknown>;
  profileCollection: string;
};

export type UpsertResult =
  | { ok: true; created: boolean }
  | { ok: false; status: number; error: string };

/**
 * Create or update a user account and its profile using the Admin SDK.
 *
 * - New accounts require a password.
 * - Updating an existing account requires either a valid session for that user
 *   or the correct password.
 * - A fresh HttpOnly session cookie is issued on success.
 */
export async function upsertProfile(input: UpsertInput): Promise<UpsertResult> {
  const { role, username, password, profileCollection } = input;
  if (!username) {
    return { ok: false, status: 400, error: "Missing username." };
  }

  const userRef = adminDb.collection("users").doc(username);
  const existing = await userRef.get();

  if (existing.exists) {
    const session = await getSession();
    let authorized = session?.username === username;
    if (!authorized) {
      if (!password) {
        return {
          ok: false,
          status: 401,
          error: "Sign in or provide your password to update this account.",
        };
      }
      const { valid } = verifyPassword(password, existing.data()?.passwordHash);
      if (!valid) {
        return {
          ok: false,
          status: 409,
          error:
            "This username already exists. If this is your account, go to the login page and use your original password.",
        };
      }
      authorized = true;
    }
  } else if (!password) {
    return {
      ok: false,
      status: 400,
      error: "Password required to create account.",
    };
  }

  const passwordHash = password ? hashPassword(password) : undefined;

  await userRef.set(
    {
      username,
      email: String(input.email ?? ""),
      role,
      ...(passwordHash ? { passwordHash } : {}),
      createdAt: adminFieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  await adminDb
    .collection(profileCollection)
    .doc(username)
    .set(
      {
        ...input.profile,
        username,
        updatedAt: adminFieldValue.serverTimestamp(),
      },
      { merge: true }
    );

  await createSession(username, role);
  return { ok: true, created: !existing.exists };
}
