import type { Models } from "appwrite"
import {
  Client,
  Account,
  Databases,
  Storage,
  Avatars,
  ID,
  Query,
  Permission,
  Role,
} from "appwrite"

export { ID, Query, Permission, Role }

let _client: Client | null = null

export function getClient() {
  if (_client) return _client
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
  const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID

  if (!endpoint || (!project && process.env.NODE_ENV !== "production")) {
    console.warn("[Appwrite] Missing NEXT_PUBLIC_APPWRITE_ENDPOINT or NEXT_PUBLIC_APPWRITE_PROJECT_ID")
  }

  _client = new Client().setEndpoint(endpoint ?? "").setProject(project ?? "")
  return _client
}

export function getAccount() {
  return new Account(getClient())
}

export function getDatabases() {
  return new Databases(getClient())
}

export function getStorage() {
  return new Storage(getClient())
}

export function getAvatars() {
  return new Avatars(getClient())
}

/** Convenience helpers for env IDs used in user profile lookups */
export function getEnvIds() {
  const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID as string
  const USERS_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID as string
  return { DB_ID, USERS_COL_ID }
}

/** Map role -> dashboard route */
export function roleToDashboard(role: string | null | undefined) {
  switch ((role ?? "").toLowerCase()) {
    case "admin":
      return "/admin/dashboard"
    case "cashier":
      return "/cashier/dashboard"
    case "business-office":
    case "business_office":
    case "businessoffice":
      return "/business-office/dashboard"
    case "student":
    default:
      return "/dashboard"
  }
}

type UserProfileDoc = Models.Document & {
  role?: string
  userId?: string
  email?: string
  fullName?: string
  status?: string
  studentId?: string
  lastLogin?: string
}

/** Create or read the user's profile doc; returns role. Seeds lastLogin on first create. */
export async function getOrCreateUserRole(userId: string, email?: string, fullName?: string) {
  const { DB_ID, USERS_COL_ID } = getEnvIds()
  const databases = getDatabases()

  try {
    const doc = await databases.getDocument<UserProfileDoc>({
      databaseId: DB_ID,
      collectionId: USERS_COL_ID,
      documentId: userId,
    })
    return (doc.role as string) ?? "student"
  } catch {
    try {
      await databases.createDocument<UserProfileDoc>({
        databaseId: DB_ID,
        collectionId: USERS_COL_ID,
        documentId: userId,
        data: {
          userId,
          email: email ?? "",
          fullName: fullName ?? "",
          role: "student",
          status: "active",
          lastLogin: new Date().toISOString(),
        },
        permissions: [
          Permission.read(Role.user(userId)),
          Permission.update(Role.user(userId)),
          Permission.delete(Role.user(userId)),
        ],
      })
    } catch {
      /* noop */
    }
    return "student"
  }
}

/* ========================= Session helpers & redirect ========================= */

const LAST_LOGIN_TOUCH_KEY = "app_last_login_touch_ms"

/** Safely get the current session user; also (throttled) update lastLogin on the profile doc. */
export async function getCurrentUserSafe() {
  try {
    const me = await getAccount().get()
    if (typeof window !== "undefined") {
      const lastTouch = Number(localStorage.getItem(LAST_LOGIN_TOUCH_KEY) || 0)
      const now = Date.now()
      if (now - lastTouch > 10 * 60 * 1000) {
        updateMyLastLogin().catch(() => {})
        localStorage.setItem(LAST_LOGIN_TOUCH_KEY, String(now))
      }
    }
    return me
  } catch {
    return null
  }
}

export async function getCurrentRole(): Promise<string | null> {
  const me = await getCurrentUserSafe()
  if (!me) return null
  const role = await getOrCreateUserRole(me.$id, me.email, me.name)
  return role ?? null
}

export async function redirectIfActiveStudent(target: string = "/dashboard") {
  const me = await getCurrentUserSafe()
  if (!me) return false
  if (!me.emailVerification) return false

  const role = await getOrCreateUserRole(me.$id, me.email, me.name)
  if ((role ?? "").toLowerCase() === "student") {
    if (typeof window !== "undefined") {
      window.location.replace(target)
    }
    return true
  }
  return false
}

/* ========================= Sign-out helpers ========================= */

export async function signOutCurrentSession(): Promise<void> {
  const account = getAccount()
  try {
    await account.deleteSession("current")
  } catch {
    try {
      await account.deleteSessions()
    } catch {
      /* noop */
    }
  }
}

export async function signOutAllSessions(): Promise<void> {
  const account = getAccount()
  await account.deleteSessions()
}

/* ========================= Student ID uniqueness check ========================= */

export async function isStudentIdAvailable(studentId: string): Promise<boolean> {
  const { DB_ID, USERS_COL_ID } = getEnvIds()
  const databases = getDatabases()
  try {
    const res = await databases.listDocuments<UserProfileDoc>({
      databaseId: DB_ID,
      collectionId: USERS_COL_ID,
      queries: [Query.equal("studentId", studentId), Query.limit(1)],
    })
    const total =
      (res.total as number | undefined) ??
      (Array.isArray(res.documents) ? res.documents.length : 0)
    return total === 0
  } catch (e) {
    throw e
  }
}

/* ========================= Last-login updater (profile doc) ========================= */

export async function updateMyLastLogin(): Promise<void> {
  const me = await getAccount().get().catch(() => null)
  if (!me) return
  const { DB_ID, USERS_COL_ID } = getEnvIds()
  const databases = getDatabases()
  try {
    await databases.updateDocument<UserProfileDoc>({
      databaseId: DB_ID,
      collectionId: USERS_COL_ID,
      documentId: me.$id,
      data: { lastLogin: new Date().toISOString() },
    })
  } catch {
    /* noop */
  }
}
