/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Models } from "appwrite"
import { getDatabases, getEnvIds, getStorage, Permission, Role } from "@/lib/appwrite"

export type MessageRecord = {
  userId: string
  cashierId: string
  paymentId: string
  subject: string
  message: string
  proofBucketId: string
  proofFileId: string
  proofFileName: string
  status: "Queued" | "Sent" | "Answered" | "Closed"
  createdAt: string
  respondedAt: string
  responseMessage: string
  responseBucketId: string
  responseFileId: string
  responseFileName: string
}

export type MessageDoc = Models.Document & MessageRecord

function ids() {
  const { DB_ID } = getEnvIds()
  const MESSAGES_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID as string
  if (!DB_ID || !MESSAGES_COL_ID) {
    throw new Error("Missing NEXT_PUBLIC_APPWRITE_DATABASE_ID or NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID")
  }
  return { DB_ID, MESSAGES_COL_ID }
}

export async function createMessage(data: Omit<MessageRecord, "status" | "createdAt" | "respondedAt" | "responseMessage" | "responseBucketId" | "responseFileId" | "responseFileName">): Promise<MessageDoc> {
  const { DB_ID, MESSAGES_COL_ID } = ids()
  const db = getDatabases()
  const now = new Date().toISOString()

  const full: MessageRecord = {
    ...data,
    status: "Queued",
    createdAt: now,
    respondedAt: "",
    responseMessage: "",
    responseBucketId: "",
    responseFileId: "",
    responseFileName: "",
  }

  const res = await db.createDocument<MessageDoc>({
    databaseId: DB_ID,
    collectionId: MESSAGES_COL_ID,
    documentId: "unique()",
    data: full,
    permissions: [
      Permission.read(Role.user(full.userId)),
      Permission.read(Role.user(full.cashierId)),
      Permission.update(Role.user(full.cashierId)),
    ],
  })
  return res
}

export async function listMessagesForStudent(userId: string): Promise<MessageDoc[]> {
  const { DB_ID, MESSAGES_COL_ID } = ids()
  const db = getDatabases()
  const res = await db.listDocuments<MessageDoc>({
    databaseId: DB_ID,
    collectionId: MESSAGES_COL_ID,
    queries: [
      (window as any).Appwrite?.Query?.equal?.("userId", [userId]) ?? `userId=${userId}`,
      // Fallback: newer SDKs accept Query.* imported; keeping compatibility in caller pages
    ],
  }).catch(async () => {
    // Fallback to standard query builder if available via import
    const { Query } = await import("@/lib/appwrite")
    return db.listDocuments<MessageDoc>({
      databaseId: DB_ID,
      collectionId: MESSAGES_COL_ID,
      queries: [Query.equal("userId", userId), Query.orderDesc("$createdAt"), Query.limit(100)],
    })
  })

  const docs = (res?.documents ?? []) as MessageDoc[]
  return docs
}

export async function listMessagesForCashier(cashierId: string): Promise<MessageDoc[]> {
  const { DB_ID, MESSAGES_COL_ID } = ids()
  const db = getDatabases()
  const { Query } = await import("@/lib/appwrite")
  const res = await db.listDocuments<MessageDoc>({
    databaseId: DB_ID,
    collectionId: MESSAGES_COL_ID,
    queries: [Query.equal("cashierId", cashierId), Query.orderDesc("$createdAt"), Query.limit(200)],
  })
  return (res.documents ?? []) as MessageDoc[]
}

export async function replyToMessage(opts: {
  messageId: string
  cashierId: string
  responseMessage: string
  responseBucketId: string
  responseFileId: string
  responseFileName: string
}): Promise<MessageDoc> {
  const { DB_ID, MESSAGES_COL_ID } = ids()
  const db = getDatabases()
  const now = new Date().toISOString()

  const res = await db.updateDocument<MessageDoc>({
    databaseId: DB_ID,
    collectionId: MESSAGES_COL_ID,
    documentId: opts.messageId,
    data: {
      respondedAt: now,
      responseMessage: opts.responseMessage,
      responseBucketId: opts.responseBucketId,
      responseFileId: opts.responseFileId,
      responseFileName: opts.responseFileName,
      status: "Answered",
    },
  })
  return res
}

export async function updateMessageStatus(messageId: string, status: MessageRecord["status"]): Promise<MessageDoc> {
  const { DB_ID, MESSAGES_COL_ID } = ids()
  const db = getDatabases()
  const res = await db.updateDocument<MessageDoc>({
    databaseId: DB_ID,
    collectionId: MESSAGES_COL_ID,
    documentId: messageId,
    data: { status },
  })
  return res
}

export function fileViewUrl(bucketId: string, fileId: string): string | null {
  if (!bucketId || !fileId) return null
  try {
    const storage = getStorage()
    return (storage.getFileView(bucketId, fileId) as unknown as string) ?? null
  } catch {
    return null
  }
}
