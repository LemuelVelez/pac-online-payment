/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
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
} from "appwrite";

export { ID, Query, Permission, Role };

let _client: Client | null = null;

export function getClient() {
  if (_client) return _client;
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

  if (!endpoint || (!project && process.env.NODE_ENV !== "production")) {
    console.warn(
      "[Appwrite] Missing NEXT_PUBLIC_APPWRITE_ENDPOINT or NEXT_PUBLIC_APPWRITE_PROJECT_ID"
    );
  }

  _client = new Client().setEndpoint(endpoint ?? "").setProject(project ?? "");
  return _client;
}

export function getAccount() {
  return new Account(getClient());
}

export function getDatabases() {
  return new Databases(getClient());
}

export function getStorage() {
  return new Storage(getClient());
}

export function getAvatars() {
  return new Avatars(getClient());
}

/** Convenience helpers for env IDs used in user profile lookups */
export function getEnvIds() {
  const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID as string;
  const USERS_COL_ID = process.env
    .NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID as string;
  return { DB_ID, USERS_COL_ID };
}

/** Map role -> dashboard route */
export function roleToDashboard(role: string | null | undefined) {
  switch ((role ?? "").toLowerCase()) {
    case "admin":
      return "/admin/dashboard";
    case "cashier":
      return "/cashier/dashboard";
    case "business-office":
    case "business_office":
    case "businessoffice":
      return "/business-office/dashboard";
    case "student":
    default:
      return "/dashboard";
  }
}

/**
 * Get the user's role from the Users collection.
 * If the profile doc doesn't exist yet, create it with default role=student and safe user-scoped permissions.
 */
export async function getOrCreateUserRole(
  userId: string,
  email?: string,
  fullName?: string
) {
  const { DB_ID, USERS_COL_ID } = getEnvIds();
  const databases = getDatabases();

  try {
    const doc: any = await databases.getDocument(DB_ID, USERS_COL_ID, userId);
    return (doc?.role as string) ?? "student";
  } catch (err) {
    // Create a minimal profile doc if missing (404/403)
    try {
      await databases.createDocument(
        DB_ID,
        USERS_COL_ID,
        userId,
        {
          userId,
          email: email ?? "",
          fullName: fullName ?? "",
          role: "student",
          status: "active",
        },
        [
          Permission.read(Role.user(userId)),
          Permission.update(Role.user(userId)),
          Permission.delete(Role.user(userId)),
        ]
      );
    } catch {
      // ignore create errors; we'll still fall back to student
    }
    return "student";
  }
}

/* ========================= Session helpers & redirect ========================= */

/** Safely get the current session user; returns null if no active session */
export async function getCurrentUserSafe() {
  try {
    const me = await getAccount().get();
    return me;
  } catch {
    return null;
  }
}

/** Return the current session's role (or null if no session) */
export async function getCurrentRole(): Promise<string | null> {
  const me = await getCurrentUserSafe();
  if (!me) return null;
  const role = await getOrCreateUserRole(me.$id, me.email, me.name);
  return role ?? null;
}

/**
 * If there is an active session *and* the role is "student",
 * redirect the browser to the student dashboard (app/dashboard/page.tsx).
 *
 * @param target default "/dashboard"
 * @returns boolean indicating whether a redirect was initiated
 */
export async function redirectIfActiveStudent(target: string = "/dashboard") {
  const me = await getCurrentUserSafe();
  if (!me) return false;

  const role = await getOrCreateUserRole(me.$id, me.email, me.name);
  if ((role ?? "").toLowerCase() === "student") {
    if (typeof window !== "undefined") {
      window.location.replace(target);
    }
    return true;
  }
  return false;
}

/* ========================= NEW: Sign-out helpers (backend calls) ========================= */

/**
 * Sign out the *current* session using Appwrite.
 * Falls back to deleteSessions() if the current-session deletion fails.
 */
export async function signOutCurrentSession(): Promise<void> {
  const account = getAccount();
  try {
    await account.deleteSession("current");
  } catch {
    // Fallback: try to nuke all sessions if current cannot be found
    try {
      await account.deleteSessions();
    } catch {
      // swallow; we'll still clear local state in the UI
    }
  }
}

/** Sign out from *all devices* (delete all sessions for this user). */
export async function signOutAllSessions(): Promise<void> {
  const account = getAccount();
  await account.deleteSessions();
}
