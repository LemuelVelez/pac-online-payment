/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Models } from "appwrite"
import { getDatabases, ID, Query, Permission, Role, getEnvIds } from "@/lib/appwrite"

export type UserRecord = {
  userId?: string
  email: string
  fullName: string
  role: "student" | "cashier" | "business-office" | "admin"
  status: "active" | "inactive"
  studentId?: string
  lastLogin?: string
  createdAt?: string
  updatedAt?: string
}

export type UserDoc = Models.Document & UserRecord

function ids() {
  const { DB_ID, USERS_COL_ID } = getEnvIds()
  if (!DB_ID || !USERS_COL_ID) console.warn("[users] Missing DB / Users collection env IDs.")
  return { DB_ID, USERS_COL_ID }
}

function fromStorage(doc: Models.Document & Partial<UserRecord>): UserDoc {
  return {
    ...(doc as Models.Document),
    userId: doc.userId,
    email: doc.email ?? "",
    fullName: doc.fullName ?? "",
    role: (doc.role as UserRecord["role"]) ?? "student",
    status: (doc.status as UserRecord["status"]) ?? "active",
    studentId: doc.studentId,
    lastLogin: doc.lastLogin,
    createdAt: doc.$createdAt,
    updatedAt: doc.$updatedAt,
  } as UserDoc
}

function toStorage(input: Partial<UserRecord>) {
  const out: Partial<UserRecord> = {}
  if (input.userId !== undefined) out.userId = (input.userId ?? "").trim()
  if (input.email !== undefined) out.email = (input.email ?? "").trim()
  if (input.fullName !== undefined) out.fullName = (input.fullName ?? "").trim()
  if (input.role !== undefined) out.role = input.role
  if (input.status !== undefined) out.status = input.status
  if (input.studentId !== undefined) out.studentId = (input.studentId ?? "").trim()
  if (input.lastLogin !== undefined) out.lastLogin = input.lastLogin
  return out
}

export async function createUserProfile(input: Omit<UserRecord, "createdAt" | "updatedAt">): Promise<UserDoc> {
  const db = getDatabases()
  const { DB_ID, USERS_COL_ID } = ids()
  const data = toStorage(input) as UserRecord
  const doc = await db.createDocument<UserDoc>({
    databaseId: DB_ID,
    collectionId: USERS_COL_ID,
    documentId: ID.unique(),
    data,
    permissions: [Permission.read(Role.any()), Permission.update(Role.users()), Permission.delete(Role.users())],
  })
  return fromStorage(doc)
}

export async function updateUserProfile(id: string, patch: Partial<UserRecord>): Promise<UserDoc> {
  const db = getDatabases()
  const { DB_ID, USERS_COL_ID } = ids()
  const data = toStorage(patch)
  const doc = await db.updateDocument<UserDoc>({
    databaseId: DB_ID,
    collectionId: USERS_COL_ID,
    documentId: id,
    data,
  })
  return fromStorage(doc)
}

export async function deleteUserProfile(id: string): Promise<void> {
  const db = getDatabases()
  const { DB_ID, USERS_COL_ID } = ids()
  await db.deleteDocument({ databaseId: DB_ID, collectionId: USERS_COL_ID, documentId: id })
}

export async function getUserProfile(id: string): Promise<UserDoc> {
  const db = getDatabases()
  const { DB_ID, USERS_COL_ID } = ids()
  const doc = await db.getDocument<UserDoc>({ databaseId: DB_ID, collectionId: USERS_COL_ID, documentId: id })
  return fromStorage(doc)
}

export async function listUsersPage(limit = 100, cursorAfter?: string) {
  const db = getDatabases()
  const { DB_ID, USERS_COL_ID } = ids()
  const pageLimit = Math.max(1, Math.min(100, limit))
  const queries: string[] = [Query.orderDesc("$updatedAt"), Query.limit(pageLimit)]
  if (cursorAfter) queries.push(Query.cursorAfter(cursorAfter))
  const res = await db.listDocuments<UserDoc>({ databaseId: DB_ID, collectionId: USERS_COL_ID, queries })
  const docs = (res.documents ?? []).map(fromStorage)
  const nextCursor = docs.length === pageLimit ? docs[docs.length - 1].$id : undefined
  return { docs, nextCursor }
}

export async function listAllUsers(): Promise<UserDoc[]> {
  const all: UserDoc[] = []
  let cursor: string | undefined
  for (;;) {
    const { docs, nextCursor } = await listUsersPage(100, cursor)
    all.push(...docs)
    if (!nextCursor) break
    cursor = nextCursor
  }
  return all
}

/** Admin: update Appwrite Account (Users API) for a given userId. Updates name/email. */
export async function adminUpdateUserAccount(
  userId: string,
  patch: { fullName?: string; email?: string }
): Promise<void> {
  const res = await fetch(`/api/admin/users/${userId}/account`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
    cache: "no-store",
  })
  if (!res.ok) {
    let msg = "Failed to update Appwrite Account"
    try {
      const j = (await res.json()) as any
      if (j?.error) msg = j.error
    } catch {
      /* noop */
    }
    throw new Error(msg)
  }
}
