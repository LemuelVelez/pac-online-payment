import type { Models } from "appwrite"
import { getDatabases, getEnvIds, ID, Query } from "@/lib/appwrite"

/* ===== Types that mirror your Messages collection schema ===== */

export type MessageRecord = {
  userId: string
  cashierId: string
  paymentId: string
  subject: string
  message: string
  proofBucketId: string
  proofFileId: string
  proofFileName: string
  status: string

  // Response-related columns that exist in your collection:
  respondedAt?: string | null
  responseMessage?: string | null
  responseBucketId?: string | null
  responseFileId?: string | null
  responseFileName?: string | null
}

export type MessageDoc = Models.Document & MessageRecord

/* ===== Create (student → cashier) ===== */

export type CreateMessageInput = {
  userId: string
  cashierId: string
  paymentId: string
  subject: string
  message: string
  proofBucketId?: string
  proofFileId?: string
  proofFileName?: string
}

export async function createMessage(input: CreateMessageInput) {
  const { DB_ID } = getEnvIds()
  const MESSAGES_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID
  if (!DB_ID) throw new Error("Appwrite DB_ID not configured.")
  if (!MESSAGES_COL_ID) throw new Error("Messages collection not configured.")

  const db = getDatabases()

  const data: MessageRecord = {
    userId: input.userId,
    cashierId: input.cashierId,
    paymentId: input.paymentId,
    subject: input.subject,
    message: input.message,
    proofBucketId: input.proofBucketId || "",
    proofFileId: input.proofFileId || "",
    proofFileName: input.proofFileName || "",
    status: "new",
    respondedAt: null,
    responseMessage: null,
    responseBucketId: null,
    responseFileId: null,
    responseFileName: null,
  }

  // NOTE: do not pass explicit permissions; use collection defaults
  const doc = (await db.createDocument({
    databaseId: DB_ID,
    collectionId: MESSAGES_COL_ID,
    documentId: ID.unique(),
    data,
  })) as unknown as MessageDoc

  return doc
}

/* ===== Read (cashier inbox) ===== */

export async function listMessagesForCashier(
  cashierId: string,
  limit = 200
): Promise<MessageDoc[]> {
  const { DB_ID } = getEnvIds()
  const MESSAGES_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID
  if (!DB_ID || !MESSAGES_COL_ID) throw new Error("Messages collection not configured.")

  const db = getDatabases()
  const res = await db.listDocuments<MessageDoc>({
    databaseId: DB_ID,
    collectionId: MESSAGES_COL_ID,
    queries: [Query.equal("cashierId", cashierId), Query.orderDesc("$createdAt"), Query.limit(limit)],
  })

  return (res.documents ?? []) as MessageDoc[]
}

/* ===== Update helpers (cashier actions) ===== */

/** Mark a message as read. */
export async function markMessageRead(messageId: string): Promise<MessageDoc> {
  const { DB_ID } = getEnvIds()
  const MESSAGES_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID
  if (!DB_ID || !MESSAGES_COL_ID) throw new Error("Messages collection not configured.")

  const db = getDatabases()
  const updated = (await db.updateDocument({
    databaseId: DB_ID,
    collectionId: MESSAGES_COL_ID,
    documentId: messageId,
    data: { status: "read" },
  })) as unknown as MessageDoc

  return updated
}

/** Send a reply and set status to "replied". */
export async function replyToMessage(
  messageId: string,
  responseMessage: string,
  opts?: {
    responseBucketId?: string | null
    responseFileId?: string | null
    responseFileName?: string | null
  }
): Promise<MessageDoc> {
  const { DB_ID } = getEnvIds()
  const MESSAGES_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID
  if (!DB_ID || !MESSAGES_COL_ID) throw new Error("Messages collection not configured.")

  const db = getDatabases()
  const updated = (await db.updateDocument({
    databaseId: DB_ID,
    collectionId: MESSAGES_COL_ID,
    documentId: messageId,
    data: {
      status: "replied",
      respondedAt: new Date().toISOString(),
      responseMessage,
      responseBucketId: opts?.responseBucketId ?? null,
      responseFileId: opts?.responseFileId ?? null,
      responseFileName: opts?.responseFileName ?? null,
    },
  })) as unknown as MessageDoc

  return updated
}
