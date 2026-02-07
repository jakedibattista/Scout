import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

type AdminInit = {
  app: ReturnType<typeof initializeApp>;
  db: ReturnType<typeof getFirestore>;
  storage: ReturnType<typeof getStorage>;
};

function getServiceAccountCredentials() {
  const raw =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ??
    process.env.FIREBASE_ADMIN_CREDENTIALS;

  if (!raw) {
    return null;
  }

  try {
    return cert(JSON.parse(raw));
  } catch (error) {
    throw new Error(
      "Invalid FIREBASE_SERVICE_ACCOUNT_JSON. Expected valid JSON."
    );
  }
}

function initAdmin(): AdminInit {
  const existing = getApps()[0];
  if (existing) {
    return {
      app: existing,
      db: getFirestore(existing),
      storage: getStorage(existing),
    };
  }

  const credential =
    getServiceAccountCredentials() ?? applicationDefault();
  const projectId =
    process.env.FIREBASE_PROJECT_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket =
    process.env.FIREBASE_STORAGE_BUCKET ??
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  const app = initializeApp({
    credential,
    projectId,
    storageBucket,
  });

  return {
    app,
    db: getFirestore(app),
    storage: getStorage(app),
  };
}

const adminInit = initAdmin();

export const adminDb = adminInit.db;
export const adminStorage = adminInit.storage;
export const adminFieldValue = FieldValue;
