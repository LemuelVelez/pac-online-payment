/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Models } from "appwrite";
import { getDatabases, ID, Query, getEnvIds } from "@/lib/appwrite";

export type BalanceDoc = Models.Document & {
  userId: string;
  /** hyphenated key exactly as defined in Appwrite */
  ["fee-plan"]?: string;
  /** stored as string (e.g., "16522.98") */
  balance?: string;
};

function ids() {
  const { DB_ID } = getEnvIds();
  const BALANCE_COL_ID = process.env
    .NEXT_PUBLIC_APPWRITE_BALANCE_COLLECTION_ID as string | undefined;

  if (!DB_ID || !BALANCE_COL_ID) {
    console.warn(
      "[balance] Missing DB_ID or NEXT_PUBLIC_APPWRITE_BALANCE_COLLECTION_ID."
    );
  }
  return { DB_ID: DB_ID || "", BALANCE_COL_ID: BALANCE_COL_ID || "" };
}

/**
 * Create/update the balance document for a user.
 * Use this if you're working directly inside lib or want options object API.
 */
export async function upsertBalanceRecord(opts: {
  userId: string;
  feePlanLabel: string;
  balance: number | string;
}): Promise<BalanceDoc | null> {
  const { userId, feePlanLabel } = opts;
  const balStr =
    typeof opts.balance === "number"
      ? (Number.isFinite(opts.balance) ? opts.balance : 0).toFixed(2)
      : String(opts.balance ?? "");

  const { DB_ID, BALANCE_COL_ID } = ids();
  if (!DB_ID || !BALANCE_COL_ID) return null;

  const db = getDatabases();

  // Look for an existing row for this user
  const existing = await db.listDocuments<BalanceDoc>(DB_ID, BALANCE_COL_ID, [
    Query.equal("userId", userId),
    Query.limit(1),
  ]);

  if (existing.documents && existing.documents.length > 0) {
    const doc = existing.documents[0];
    const updated = await db.updateDocument<BalanceDoc>(
      DB_ID,
      BALANCE_COL_ID,
      doc.$id,
      {
        userId,
        ["fee-plan"]: feePlanLabel ?? "",
        balance: balStr,
      } as any
    );
    return updated;
  }

  // Create if none
  const created = await db.createDocument<BalanceDoc>(
    DB_ID,
    BALANCE_COL_ID,
    ID.unique(),
    {
      userId,
      ["fee-plan"]: feePlanLabel ?? "",
      balance: balStr,
    } as any
  );
  return created;
}

/**
 * 🔧 Back-compat wrapper exported for existing pages:
 * Signature matches your import usage:
 *   await upsertUserBalance(userId, planLabelOrId, balanceAfter)
 */
export async function upsertUserBalance(
  userId: string,
  feePlanLabel: string,
  balance: number | string
): Promise<BalanceDoc | null> {
  return upsertBalanceRecord({ userId, feePlanLabel, balance });
}

/** Get the latest balance record for a user (by $updatedAt desc). */
export async function getBalanceRecord(
  userId: string
): Promise<BalanceDoc | null> {
  const { DB_ID, BALANCE_COL_ID } = ids();
  if (!DB_ID || !BALANCE_COL_ID) return null;
  const db = getDatabases();
  const res = await db.listDocuments<BalanceDoc>(DB_ID, BALANCE_COL_ID, [
    Query.equal("userId", userId),
    Query.orderDesc("$updatedAt"),
    Query.limit(1),
  ]);
  return res.documents?.[0] ?? null;
}

/** Parse a BalanceDoc.balance into a finite number (or null). */
export function parseBalanceNumber(
  doc?: BalanceDoc | null
): number | null {
  if (!doc?.balance) return null;
  const n = Number(String(doc.balance).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}
