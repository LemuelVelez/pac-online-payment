/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Models } from "appwrite"
import { getAccount, getDatabases, getStorage, getEnvIds, ID, Query, Permission, Role } from "@/lib/appwrite"

export type UserProfileDoc = Models.Document & {
  userId: string
  email?: string
  fullName?: string
  role?: string
  status?: string
  studentId?: string
  course?: string
  yearLevel?: string
  photoBucketId?: string | null
  photoFileId?: string | null
  photoUrl?: string | null
  photoUpdatedAt?: string | null
}

type UpdateInput = Partial<Pick<UserProfileDoc,
  "fullName" | "email" | "studentId" | "course" | "yearLevel" |
  "photoBucketId" | "photoFileId" | "photoUrl" | "photoUpdatedAt"
>>

/** Safe env gather: never throw if public envs are missing on the client */
function ids() {
  const { DB_ID, USERS_COL_ID } = getEnvIds()
  const PROFILE_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID as string | undefined

  const rawEndpoint = (process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "") as string
  const ENDPOINT = rawEndpoint ? rawEndpoint.replace(/\/+$/, "") : ""

  const PROJECT =
    (process.env.NEXT_PUBLIC_APPWRITE_PROJECT as string | undefined) ||
    (process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID as string | undefined) ||
    ""

  return { DB_ID, USERS_COL_ID, PROFILE_BUCKET_ID, ENDPOINT, PROJECT }
}

function codeOf(err: any): number | undefined {
  return err?.code ?? err?.response?.code ?? err?.status
}
function isNotFound(err: any) {
  const c = codeOf(err)
  return c === 404 || /not\s*found/i.test(String(err?.message || err))
}
function isConflict(err: any) {
  const c = codeOf(err)
  return c === 409 || /already exists|same id/i.test(String(err?.message || err))
}
function isForbidden(err: any) {
  const c = codeOf(err)
  return c === 401 || c === 403 || /forbidden|unauthoriz/i.test(String(err?.message || err))
}
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))
const normalizeEmail = (e?: string) => (e || "").trim().toLowerCase()

/** Build a public(view) URL for a file, fallback to null if envs absent. */
export function getPhotoUrl(args: { directUrl?: string | null; bucketId?: string | null; fileId?: string | null }): string | null {
  const { ENDPOINT, PROJECT } = ids()
  if (args.directUrl) return args.directUrl
  if (args.bucketId && args.fileId && ENDPOINT && PROJECT) {
    return `${ENDPOINT}/v1/storage/buckets/${args.bucketId}/files/${args.fileId}/view?project=${encodeURIComponent(PROJECT)}`
  }
  return null
}

/** Cache latest photo URL so header/avatar update instantly. */
export function rememberProfilePhotoUrl(url: string) {
  try {
    localStorage.setItem("profile_photo_url", url)
    window.dispatchEvent(new CustomEvent("profile-photo-changed", { detail: { url } }))
  } catch {
    /* ignore */
  }
}
export function getCachedProfilePhoto(): string | null {
  try {
    return localStorage.getItem("profile_photo_url")
  } catch {
    return null
  }
}

/** Fetch current user's profile document. */
export async function getUserProfile(): Promise<UserProfileDoc | null> {
  const account = getAccount()
  const db = getDatabases()
  const { DB_ID, USERS_COL_ID } = ids()

  const me = await account.get()
  const uid = me.$id

  try {
    const doc = await db.getDocument<UserProfileDoc>(DB_ID, USERS_COL_ID, uid)
    if (doc?.photoUrl) rememberProfilePhotoUrl(doc.photoUrl)
    return doc
  } catch {
    const byUid = await db
      .listDocuments<UserProfileDoc>(DB_ID, USERS_COL_ID, [Query.equal("userId", uid), Query.limit(1)])
      .catch(() => null)
    if (byUid?.documents?.[0]) {
      const d = byUid.documents[0]
      if (d?.photoUrl) rememberProfilePhotoUrl(d.photoUrl!)
      return d
    }
    const meEmail = (await account.get()).email
    const byEmail = await db
      .listDocuments<UserProfileDoc>(DB_ID, USERS_COL_ID, [Query.equal("email", meEmail), Query.limit(1)])
      .catch(() => null)
    if (byEmail?.documents?.[0]) {
      const d = byEmail.documents[0]
      if (d?.photoUrl) rememberProfilePhotoUrl(d.photoUrl!)
      return d
    }
    return null
  }
}

/**
 * Update BOTH:
 *  1) Database profile document (docId = userId). Create only if truly missing.
 *  2) Appwrite Accounts (name/email) via admin API.
 *
 * Conflict-safe: never throws a 409 to the UI if the final state exists.
 */
export async function updateUserProfile(input: UpdateInput): Promise<void> {
  const account = getAccount()
  const db = getDatabases()
  const { DB_ID, USERS_COL_ID } = ids()

  const me = await account.get()
  const uid = me.$id

  const data: Record<string, any> = {}
  if (typeof input.fullName === "string") data.fullName = input.fullName.trim()
  if (typeof input.email === "string") data.email = input.email.trim()
  if (typeof input.studentId === "string") data.studentId = input.studentId.trim()
  if (typeof input.course === "string") data.course = input.course.trim()
  if (typeof input.yearLevel === "string") data.yearLevel = input.yearLevel
  if (typeof input.photoBucketId !== "undefined") data.photoBucketId = input.photoBucketId ?? null
  if (typeof input.photoFileId !== "undefined") data.photoFileId = input.photoFileId ?? null
  if (typeof input.photoUrl !== "undefined") data.photoUrl = input.photoUrl ?? null
  if (typeof input.photoUpdatedAt !== "undefined") data.photoUpdatedAt = input.photoUpdatedAt ?? null

  // --- 1) Update-first upsert with conflict handling
  let updatedOk = false
  try {
    await db.updateDocument<UserProfileDoc>(DB_ID, USERS_COL_ID, uid, data)
    updatedOk = true
  } catch (err: any) {
    if (isNotFound(err)) {
      try {
        await db.createDocument<UserProfileDoc>(
          DB_ID,
          USERS_COL_ID,
          uid,
          { userId: uid, email: me.email, fullName: me.name, ...data },
          [
            Permission.read(Role.user(uid)),
            Permission.update(Role.user(uid)),
            Permission.delete(Role.user(uid)),
          ]
        )
        updatedOk = true
      } catch (createErr: any) {
        if (isConflict(createErr)) {
          // Another writer created it first; wait briefly, then update.
          await delay(120)
          try {
            await db.updateDocument<UserProfileDoc>(DB_ID, USERS_COL_ID, uid, data)
            updatedOk = true
          } catch (retryErr: any) {
            const exists = await db.getDocument<UserProfileDoc>(DB_ID, USERS_COL_ID, uid).catch(() => null)
            if (exists) updatedOk = true
            else throw retryErr
          }
        } else if (isForbidden(createErr)) {
          const exists = await db.getDocument<UserProfileDoc>(DB_ID, USERS_COL_ID, uid).catch(() => null)
          if (exists) {
            await db.updateDocument<UserProfileDoc>(DB_ID, USERS_COL_ID, uid, data)
            updatedOk = true
          } else {
            throw createErr
          }
        } else {
          throw createErr
        }
      }
    } else if (isForbidden(err)) {
      const exists = await db.getDocument<UserProfileDoc>(DB_ID, USERS_COL_ID, uid).catch(() => null)
      if (exists) {
        await db.updateDocument<UserProfileDoc>(DB_ID, USERS_COL_ID, uid, data)
        updatedOk = true
      } else {
        throw err
      }
    } else {
      throw err
    }
  }

  if (!updatedOk) {
    const exists = await db.getDocument<UserProfileDoc>(DB_ID, USERS_COL_ID, uid).catch(() => null)
    if (!exists) throw new Error("Failed to save profile (final verification)")
  }

  // --- 2) Update Appwrite Accounts (name/email) via admin route
  // Only patch fields that actually changed to avoid noisy conflicts.
  const desiredName = typeof input.fullName === "string" ? input.fullName.trim() : undefined
  const desiredEmail = typeof input.email === "string" ? input.email.trim() : undefined
  const nameChanged = typeof desiredName === "string" && desiredName !== me.name
  const emailChanged = typeof desiredEmail === "string" && normalizeEmail(desiredEmail) !== normalizeEmail(me.email)

  const accountPatch: Record<string, string> = {}
  if (nameChanged) accountPatch.fullName = desiredName!
  if (emailChanged) accountPatch.email = desiredEmail!

  if (Object.keys(accountPatch).length > 0) {
    const res = await fetch(`/api/admin/users/${uid}/account`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(accountPatch),
    })

    if (!res.ok) {
      // Try to extract message safely (route may return text OR JSON)
      const status = res.status
      let msg = ""
      try {
        const text = await res.text()
        try {
          const j = JSON.parse(text)
          msg = j?.error || j?.message || text
        } catch {
          msg = text
        }
      } catch {
        /* ignore */
      }

      // If it's a conflict, verify actual final state and treat as success if already applied / unchanged.
      if (status === 409 || /already exists|same id/i.test(msg)) {
        const now = await account.get().catch(() => null)
        const emailOk = accountPatch.email ? normalizeEmail(now?.email) === normalizeEmail(accountPatch.email) : true
        const nameOk = accountPatch.fullName ? now?.name === accountPatch.fullName : true

        if (emailOk && nameOk) {
          // Final state is what we want — treat as success.
        } else if (accountPatch.email) {
          // Real conflict: user tried to change to an email already used by another account.
          throw new Error("That email is already in use. Please choose another email address.")
        } else {
          // Name-only conflict is harmless; treat as success.
        }
      } else {
        // Non-conflict failure
        throw new Error(msg || "Failed to update Appwrite Account")
      }
    }
  }

  if (typeof input.photoUrl === "string" && input.photoUrl) {
    rememberProfilePhotoUrl(input.photoUrl)
  }
}

/** Upload profile photo to Storage and return its identifiers and a direct view URL (no envs needed). */
export async function uploadProfilePhoto(file: File): Promise<{ bucketId: string; fileId: string; url: string }> {
  const storage = getStorage()
  const { PROFILE_BUCKET_ID } = ids()
  if (!PROFILE_BUCKET_ID) throw new Error("Missing NEXT_PUBLIC_APPWRITE_BUCKET_ID")

  const created: any = await storage.createFile(PROFILE_BUCKET_ID, ID.unique(), file, [
    Permission.read(Role.any()),
    Permission.update(Role.any()),
    Permission.delete(Role.any()),
  ])

  const fileId: string = created?.$id || created?.id
  if (!fileId) throw new Error("Failed to create file")

  const sdkUrl = (storage.getFileView(PROFILE_BUCKET_ID, fileId) as unknown as string) || ""
  const url = sdkUrl || getPhotoUrl({ bucketId: PROFILE_BUCKET_ID, fileId }) || ""
  if (!url) throw new Error("Could not compute photo URL")

  return { bucketId: PROFILE_BUCKET_ID, fileId, url }
}
