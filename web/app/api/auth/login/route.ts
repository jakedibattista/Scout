import { createHash } from "crypto";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function POST(request: Request) {
  try {
    const { identifier, password } = await request.json();
    if (!identifier || !password) {
      return Response.json(
        { ok: false, error: "Missing credentials." },
        { status: 400 }
      );
    }

    let userDoc = null;
    if (String(identifier).includes("@")) {
      const snapshot = await getDocs(
        query(collection(db, "users"), where("email", "==", identifier))
      );
      userDoc = snapshot.docs[0] ?? null;
    } else {
      const snapshot = await getDoc(doc(db, "users", String(identifier)));
      userDoc = snapshot.exists() ? snapshot : null;
    }

    if (!userDoc) {
      return Response.json(
        { ok: false, error: "Invalid credentials." },
        { status: 401 }
      );
    }

    const data = userDoc.data();
    const passwordHash = createHash("sha256")
      .update(String(password))
      .digest("hex");

    if (data.passwordHash !== passwordHash) {
      return Response.json(
        { ok: false, error: "Invalid credentials." },
        { status: 401 }
      );
    }

    return Response.json({
      ok: true,
      user: { username: data.username, role: data.role, email: data.email },
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: "Invalid JSON payload" },
      { status: 400 }
    );
  }
}
