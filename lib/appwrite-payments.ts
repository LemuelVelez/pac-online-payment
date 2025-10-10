import { ID, Query, getDatabases } from "@/lib/appwrite";
import type { Models } from "appwrite";

/** Shape we persist in the Appwrite Payments collection */
export type PaymentRecord = {
  userId: string;
  courseId: "bsed" | "bscs" | "bssw" | "bsit";
  yearId: "1" | "2" | "3" | "4";
  amount: number;
  fees: Array<"tuition" | "laboratory" | "library" | "miscellaneous">;
  method: "credit-card" | "e-wallet" | "online-banking" | string;
  status: "Pending" | "Completed" | "Succeeded" | "Failed" | "Cancelled";
  reference: string;
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

/** Create a payment document (usually right before redirecting to PayMongo). */
export async function createPayment(rec: PaymentRecord): Promise<PaymentDoc> {
  const { databaseId, paymentsCollectionId } = getIds();
  const databases = getDatabases();

  // Generic is the *return type* (must extend Models.Document).
  // The data shape is inferred as Omit<PaymentDoc, keyof Models.Document> -> PaymentRecord.
  const doc = await databases.createDocument<PaymentDoc>(
    databaseId,
    paymentsCollectionId,
    ID.unique(),
    rec
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

  const doc = await databases.updateDocument<PaymentDoc>(
    databaseId,
    paymentsCollectionId,
    id,
    patch
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
