import { ID, Query, getDatabases } from "@/lib/appwrite";
import type { Models } from "appwrite";

/** Allowed payment methods (must match Appwrite enum exactly) */
export const ALLOWED_PAYMENT_METHODS = [
  "cash",
  "card",
  "credit-card",
  "e-wallet",
  "online-banking",
] as const;

export type PaymentMethod = typeof ALLOWED_PAYMENT_METHODS[number];

/** Shape we persist in the Appwrite Payments collection */
export type PaymentRecord = {
  userId: string;
  courseId: "bsed" | "bscs" | "bssw" | "bsit";
  yearId: "1" | "2" | "3" | "4";
  amount: number;
  fees: Array<"tuition" | "laboratory" | "library" | "miscellaneous">;
  method: PaymentMethod; // strictly one of the allowed values
  status: "Pending" | "Completed" | "Succeeded" | "Failed" | "Cancelled";
  reference: string;

  /** New link to fee plan */
  planId?: string | null;   // flat string id for fast querying/exports
  planRef?: string | null;  // Appwrite relationship attribute → fee_plans
};

/** The document type returned by Appwrite (PaymentRecord + system fields). */
export type PaymentDoc = PaymentRecord & Models.Document;

function getIds() {
  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  const paymentsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_PAYMENTS_COLLECTION_ID;

  if (!databaseId || !paymentsCollectionId) {
    console.warn("[Appwrite Payments] Missing DB or Payments collection IDs in env.");
  }

  return {
    databaseId: databaseId ?? "",
    paymentsCollectionId: paymentsCollectionId ?? "",
  };
}

/** Normalize/Clamp method values to an allowed enum to avoid Appwrite validation errors. */
function normalizeMethod(value: unknown): PaymentMethod {
  const v = String(value ?? "").toLowerCase().trim();

  if ((ALLOWED_PAYMENT_METHODS as readonly string[]).includes(v)) {
    return v as PaymentMethod;
  }

  // Heuristic mappings for common aliases
  if (v.includes("cash")) return "cash";
  if (v.includes("wallet") || v.includes("gcash") || v.includes("maya") || v.includes("grab"))
    return "e-wallet";
  if (v.includes("bank")) return "online-banking";
  if (v.includes("credit") || v.includes("debit")) return "credit-card";
  if (v.includes("card")) return "card";

  // Safe default
  return "card";
}

/** Create a payment document (usually right before redirecting to PayMongo). */
export async function createPayment(rec: PaymentRecord): Promise<PaymentDoc> {
  const { databaseId, paymentsCollectionId } = getIds();
  const databases = getDatabases();

  const payload: PaymentRecord = {
    ...rec,
    method: normalizeMethod(rec.method),
  };

  const doc = await databases.createDocument<PaymentDoc>(
    databaseId,
    paymentsCollectionId,
    ID.unique(),
    payload
  );

  return doc;
}

/** Update a payment document (e.g., after webhook confirmation). */
export async function updatePayment(
  id: string,
  patch: Partial<PaymentRecord>
): Promise<PaymentDoc> {
  const { databaseId, paymentsCollectionId } = getIds();
  const databases = getDatabases();

  const patched = {
    ...patch,
    ...(patch.method ? { method: normalizeMethod(patch.method) } : {}),
  } as Partial<PaymentRecord>;

  const doc = await databases.updateDocument<PaymentDoc>(
    databaseId,
    paymentsCollectionId,
    id,
    patched
  );

  return doc;
}

/** Get a single payment by id. */
export async function getPayment(id: string): Promise<PaymentDoc> {
  const { databaseId, paymentsCollectionId } = getIds();
  const databases = getDatabases();

  const doc = await databases.getDocument<PaymentDoc>(
    databaseId,
    paymentsCollectionId,
    id
  );

  return doc;
}

/** List recent payments for a user (newest first). */
export async function listRecentPayments(
  userId: string,
  limit = 10
): Promise<PaymentDoc[]> {
  const { databaseId, paymentsCollectionId } = getIds();
  const databases = getDatabases();

  const res = await databases.listDocuments<PaymentDoc>(
    databaseId,
    paymentsCollectionId,
    [
      Query.equal("userId", userId),
      Query.orderDesc("$createdAt"),
      Query.limit(limit),
    ]
  );

  return res.documents ?? [];
}

/** Sum of completed/succeeded payments for a specific course/year for this user. */
export async function getPaidTotal(
  userId: string,
  courseId: PaymentRecord["courseId"],
  yearId: PaymentRecord["yearId"]
): Promise<number> {
  const { databaseId, paymentsCollectionId } = getIds();
  const databases = getDatabases();

  const res = await databases.listDocuments<PaymentDoc>(
    databaseId,
    paymentsCollectionId,
    [
      Query.equal("userId", userId),
      Query.equal("courseId", courseId),
      Query.equal("yearId", yearId),
      Query.equal("status", ["Completed", "Succeeded"]),
      Query.limit(100),
    ]
  );

  return (res.documents ?? []).reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
}

/** NEW: Sum of completed/succeeded payments for the user across all course/year. */
export async function getPaidTotalForUser(userId: string): Promise<number> {
  const { databaseId, paymentsCollectionId } = getIds();
  const databases = getDatabases();

  const res = await databases.listDocuments<PaymentDoc>(
    databaseId,
    paymentsCollectionId,
    [
      Query.equal("userId", userId),
      Query.equal("status", ["Completed", "Succeeded"]),
      Query.orderDesc("$createdAt"),
      Query.limit(100),
    ]
  );

  return (res.documents ?? []).reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
}
