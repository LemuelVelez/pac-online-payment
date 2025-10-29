/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Models } from "appwrite"
import {
  ID,
  Permission,
  Role,
  getCurrentUserSafe,
  getDatabases,
  getEnvIds,
  getStorage,
} from "@/lib/appwrite"

/**
 * Use your ONE existing Appwrite bucket for profile photos.
 * We detect whichever env points at it.
 */
export function getProfileBucketId(): string {
  const id =
    process.env.NEXT_PUBLIC_APPWRITE_PROFILE_BUCKET_ID ||
    process.env.NEXT_PUBLIC_APPWRITE_PUBLIC_BUCKET_ID ||
    process.env.NEXT_PUBLIC_APPWRITE_RECEIPT_PROOF_BUCKET_ID ||
    process.env.NEXT_PUBLIC_APPWRITE_UPLOADS_BUCKET_ID ||
    process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID

  if (!id) {
    throw new Error(
      "Profile bucket ID is not configured. Set one of: " +
        "NEXT_PUBLIC_APPWRITE_PROFILE_BUCKET_ID / NEXT_PUBLIC_APPWRITE_PUBLIC_BUCKET_ID / " +
        "NEXT_PUBLIC_APPWRITE_RECEIPT_PROOF_BUCKET_ID / NEXT_PUBLIC_APPWRITE_UPLOADS_BUCKET_ID / NEXT_PUBLIC_APPWRITE_BUCKET_ID."
    )
  }
  return id
}

/**
 * Build a view URL using the Appwrite SDK (no public envs required).
 * Falls back to constructing from envs if available; never throws.
 */
function buildFileViewUrl(bucketId: string, fileId: string): string {
  const storage = getStorage()
  try {
    const url = (storage as any).getFileView({ bucketId, fileId })
    return (url && (url as any).toString) ? (url as any).toString() : String(url)
  } catch {
    // last-resort fallback if some SDKs don't expose object signature:
    const endpoint = (process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT || "").replace(/\/$/, "")
    const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT || process.env.APPWRITE_PROJECT || ""
    if (endpoint && project) {
      const base = `${endpoint}/storage/buckets/${encodeURIComponent(bucketId)}/files/${encodeURIComponent(fileId)}/view`
      const u = new URL(base)
      u.searchParams.set("project", project)
      return u.toString()
    }
    return "" // return empty; caller will handle nullish
  }
}

function withCacheBust(u: string): string {
  const t = `t=${Date.now()}`
  return u.includes("?") ? `${u}&${t}` : `${u}?${t}`
}

/** Preferred: use directUrl if present; else build from ids (SDK). */
export function getPhotoUrl(args: {
  directUrl?: string | null
  bucketId?: string | null
  fileId?: string | null
}): string | null {
  if (args.directUrl) return withCacheBust(args.directUrl)
  if (args.bucketId && args.fileId) {
    const built = buildFileViewUrl(args.bucketId, args.fileId)
    return built ? withCacheBust(built) : null
  }
  return null
}

export type UserProfileDoc = Models.Document & {
  userId?: string
  email?: string
  fullName?: string
  studentId?: string
  course?: string
  /** Expected: "1st" | "2nd" | "3rd" | "4th" */
  yearLevel?: string

  // Source of truth for avatar:
  photoUrl?: string | null

  // Optional for fallback/back-compat:
  photoBucketId?: string | null
  photoFileId?: string | null
  photoUpdatedAt?: string | null
}

async function ensureProfileDoc(meId: string): Promise<UserProfileDoc> {
  const { DB_ID, USERS_COL_ID } = getEnvIds()
  const db = getDatabases()

  try {
    const doc = await db.getDocument<UserProfileDoc>({
      databaseId: DB_ID,
      collectionId: USERS_COL_ID,
      documentId: meId,
    })
    return doc
  } catch {
    const created = await db.createDocument<UserProfileDoc>({
      databaseId: DB_ID,
      collectionId: USERS_COL_ID,
      documentId: meId,
      data: { userId: meId },
    })
    return created
  }
}

export async function getUserProfile(): Promise<UserProfileDoc | null> {
  const me = await getCurrentUserSafe()
  if (!me) return null
  try {
    const { DB_ID, USERS_COL_ID } = getEnvIds()
    const db = getDatabases()
    const doc = await db.getDocument<UserProfileDoc>({
      databaseId: DB_ID,
      collectionId: USERS_COL_ID,
      documentId: me.$id,
    })
    return doc
  } catch {
    return null
  }
}

type UpdatableProfileFields = Partial<
  Pick<
    UserProfileDoc,
    | "fullName"
    | "email"
    | "studentId"
    | "course"
    | "yearLevel"
    | "photoUrl"
    | "photoBucketId"
    | "photoFileId"
    | "photoUpdatedAt"
  >
>

export async function updateUserProfile(data: UpdatableProfileFields): Promise<UserProfileDoc> {
  const me = await getCurrentUserSafe()
  if (!me) throw new Error("No active session.")
  const { DB_ID, USERS_COL_ID } = getEnvIds()
  const db = getDatabases()

  await ensureProfileDoc(me.$id)

  const updated = await db.updateDocument<UserProfileDoc>({
    databaseId: DB_ID,
    collectionId: USERS_COL_ID,
    documentId: me.$id,
    data,
  })
  return updated
}

/**
 * Upload profile photo to your single bucket; return ids AND the final URL.
 * We set public read so the URL is immediately usable in <img>.
 */
export async function uploadProfilePhoto(file: File): Promise<{ fileId: string; bucketId: string; url: string }> {
  const me = await getCurrentUserSafe()
  if (!me) throw new Error("No active session.")
  const bucketId = getProfileBucketId()
  const storage = getStorage()

  // Keep only one latest photo (best-effort)
  try {
    const current = await getUserProfile()
    if (current?.photoBucketId && current?.photoFileId) {
      await storage.deleteFile(current.photoBucketId, current.photoFileId).catch(() => {})
    }
  } catch {
    // ignore cleanup errors
  }

  const created = await (storage as any).createFile({
    bucketId,
    fileId: ID.unique(),
    file,
    permissions: [
      Permission.read(Role.any()),             // public read so <img> works reliably
      Permission.update(Role.user(me.$id)),
      Permission.delete(Role.user(me.$id)),
    ],
  })

  const fileId = (created as any).$id as string
  const url = buildFileViewUrl(bucketId, fileId) // uses SDK; no NEXT_PUBLIC* required
  return { fileId, bucketId, url }
}
