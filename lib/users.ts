/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Models } from "appwrite"
import { getDatabases, ID, getEnvIds } from "@/lib/appwrite"

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

/* ====== Client-side non-admin helpers (still available if you need them elsewhere) ====== */

export async function createUserProfile(input: Omit<UserRecord, "createdAt" | "updatedAt">): Promise<UserDoc> {
  const db = getDatabases()
  const { DB_ID, USERS_COL_ID } = ids()
  const data = toStorage(input) as UserRecord
  const doc = await db.createDocument<UserDoc>(DB_ID, USERS_COL_ID, ID.unique(), data)
  return fromStorage(doc)
}

export async function createUserProfileWithId(
  userId: string,
  input: Omit<UserRecord, "createdAt" | "updatedAt" | "userId">
): Promise<UserDoc> {
  const db = getDatabases()
  const { DB_ID, USERS_COL_ID } = ids()
  const data = toStorage({ ...input, userId }) as UserRecord
  const doc = await db.createDocument<UserDoc>(DB_ID, USERS_COL_ID, userId, data)
  return fromStorage(doc)
}

/* ====== Admin operations now go through our server routes (API key) ====== */

export async function updateUserProfile(id: string, patch: Partial<UserRecord>): Promise<UserDoc> {
  const res = await fetch(`/api/admin/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toStorage(patch)),
    cache: "no-store",
  })
  if (!res.ok) {
    let msg = "Failed to update user profile"
    try {
      const j = (await res.json()) as any
      if (j?.error) msg = j.error
    } catch {}
    throw new Error(msg)
  }
  const j = (await res.json()) as any
  const doc = (j?.document ?? {}) as Models.Document & Partial<UserRecord>
  return fromStorage(doc)
}

export async function deleteUserProfile(id: string): Promise<void> {
  const res = await fetch(`/api/admin/users/${id}`, {
    method: "DELETE",
    cache: "no-store",
  })
  if (!res.ok) {
    let msg = "Failed to delete user profile"
    try {
      const j = (await res.json()) as any
      if (j?.error) msg = j.error
    } catch {}
    throw new Error(msg)
  }
}

export async function getUserProfile(id: string): Promise<UserDoc> {
  const db = getDatabases()
  const { DB_ID, USERS_COL_ID } = ids()
  const doc = await db.getDocument<UserDoc>({ databaseId: DB_ID, collectionId: USERS_COL_ID, documentId: id })
  return fromStorage(doc)
}

/** Server-paginated page via admin GET route */
export async function listUsersPage(limit = 100, cursorAfter?: string) {
  const usp = new URLSearchParams()
  usp.set("limit", String(Math.max(1, Math.min(100, limit))))
  if (cursorAfter) usp.set("cursor", cursorAfter)

  const res = await fetch(`/api/admin/users?${usp.toString()}`, { method: "GET", cache: "no-store" })
  if (!res.ok) {
    let msg = "Failed to list users"
    try {
      const j = (await res.json()) as any
      if (j?.error) msg = j.error
    } catch {}
    throw new Error(msg)
  }
  const j = (await res.json()) as any
  const docs = (j?.documents ?? []) as (Models.Document & Partial<UserRecord>)[]
  const mapped = docs.map(fromStorage)
  const nextCursor = j?.nextCursor as string | undefined
  return { docs: mapped, nextCursor }
}

export async function listAllUsers(): Promise<UserDoc[]> {
  const res = await fetch(`/api/admin/users?all=1`, { method: "GET", cache: "no-store" })
  if (!res.ok) {
    let msg = "Failed to list users"
    try {
      const j = (await res.json()) as any
      if (j?.error) msg = j.error
    } catch {}
    throw new Error(msg)
  }
  const j = (await res.json()) as any
  const docs = (j?.documents ?? []) as (Models.Document & Partial<UserRecord>)[]
  return docs.map(fromStorage)
}

/** Admin: create Appwrite Account (Users API) and the profile document via our API route */
export async function adminCreateUserAccount(input: {
  fullName: string
  email: string
  password?: string
  role?: UserRecord["role"]
  status?: UserRecord["status"]
  studentId?: string
}): Promise<any> {
  const res = await fetch(`/api/admin/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    cache: "no-store",
  })
  if (!res.ok) {
    let msg = "Failed to create Appwrite Account"
    try {
      const j = (await res.json()) as any
      if (j?.error) msg = j.error
    } catch {}
    throw new Error(msg)
  }
  return res.json()
}

export async function adminUpdateUserAccount(
  userId: string,
  patch: { fullName?: string; email?: string }
): Promise<any> {
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
    } catch {}
    throw new Error(msg)
  }
  // Return the server response (may include User payload on some deployments)
  try {
    return await res.json()
  } catch {
    return {}
  }
}
