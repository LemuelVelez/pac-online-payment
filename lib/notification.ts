/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type { Models } from "appwrite"
import { getClient, getDatabases, getEnvIds, ID, Query } from "@/lib/appwrite"

/**
 * Notification storage schema (NEXT_PUBLIC_APPWRITE_NOTIFICATION_COLLECTION_ID)
 * Columns: $id (string), userId (string), notification (string),
 *          status (enum: "read" | "unread"), $createdAt, $updatedAt
 */

export type NotificationRecord = {
  userId: string
  notification: string
  status: "read" | "unread"
}

export type NotificationDoc = Models.Document & NotificationRecord

function ids() {
  const { DB_ID, USERS_COL_ID } = getEnvIds() // ⬅️ include USERS_COL_ID
  const NOTIFS_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATION_COLLECTION_ID as string
  const PAYMENTS_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_PAYMENTS_COLLECTION_ID as string | undefined
  const MESSAGES_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID as string | undefined
  if (!DB_ID || !NOTIFS_COL_ID) {
    console.warn("[notification] Missing DB/Notifications collection env IDs.")
  }
  return { DB_ID, USERS_COL_ID, NOTIFS_COL_ID, PAYMENTS_COL_ID, MESSAGES_COL_ID }
}

/* ----------------------- Link encoding/decoding (no new columns) ----------------------- */

const HREF_TAG_PREFIX = "[@href:"
const HREF_TAG_RE = /\s*\[@href:([^\]]+)\]\s*$/ // captures trailing [@href:/route]

/** Attach an href marker at the end of the text, e.g., "Cashier replied [@href:/payment-history]". */
export function encodeHref(text: string, href?: string): string {
  if (!href) return text
  return `${text} ${HREF_TAG_PREFIX}${href}]`
}

/** Parse a notification string and extract a clean text + href (if present). */
export function parseNotificationText(text: string): { clean: string; href?: string } {
  if (!text) return { clean: "" }
  const m = text.match(HREF_TAG_RE)
  if (!m) return { clean: text.trim() }
  const href = m[1]
  const clean = text.replace(HREF_TAG_RE, "").trim()
  return { clean, href }
}

/* ---------------------------- CRUD & Queries ---------------------------- */

export async function listUserNotifications(userId: string, limit = 50): Promise<NotificationDoc[]> {
  const db = getDatabases()
  const { DB_ID, NOTIFS_COL_ID } = ids()
  const res = await db.listDocuments<NotificationDoc>(
    DB_ID,
    NOTIFS_COL_ID,
    [Query.equal("userId", userId), Query.orderDesc("$createdAt"), Query.limit(limit)]
  )
  return res.documents ?? []
}

/** Create a notification with optional deep-link (encoded into the text). */
export async function createNotification(userId: string, text: string, href?: string): Promise<NotificationDoc> {
  const db = getDatabases()
  const { DB_ID, NOTIFS_COL_ID } = ids()
  const doc = await db.createDocument<NotificationDoc>(
    DB_ID,
    NOTIFS_COL_ID,
    ID.unique(),
    {
      userId,
      notification: encodeHref((text || "").trim(), href),
      status: "unread",
    }
  )
  return doc
}

/** Create only if an identical notification (same text+href) doesn't already exist for this user. */
export async function createUniqueNotification(
  userId: string,
  text: string,
  href?: string
): Promise<NotificationDoc> {
  const db = getDatabases()
  const { DB_ID, NOTIFS_COL_ID } = ids()
  const encoded = encodeHref((text || "").trim(), href)

  const existing = await db
    .listDocuments<NotificationDoc>(
      DB_ID,
      NOTIFS_COL_ID,
      [Query.equal("userId", userId), Query.equal("notification", encoded), Query.limit(1)]
    )
    .catch(() => null)

  const hit = existing?.documents?.[0]
  if (hit) return hit

  return createNotification(userId, text, href)
}

export async function markNotificationRead(id: string): Promise<NotificationDoc> {
  const db = getDatabases()
  const { DB_ID, NOTIFS_COL_ID } = ids()
  const updated = await db.updateDocument<NotificationDoc>(
    DB_ID,
    NOTIFS_COL_ID,
    id,
    { status: "read" }
  )
  return updated
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const unread = await listUnreadNotifications(userId, 100)
  const db = getDatabases()
  const { DB_ID, NOTIFS_COL_ID } = ids()

  for (const n of unread) {
    try {
      await db.updateDocument<NotificationDoc>(DB_ID, NOTIFS_COL_ID, n.$id, { status: "read" })
    } catch {
      /* ignore per-item failures */
    }
  }
}

export async function deleteNotification(id: string, opts?: { onlyIfRead?: boolean }): Promise<void> {
  const db = getDatabases()
  const { DB_ID, NOTIFS_COL_ID } = ids()
  if (opts?.onlyIfRead) {
    try {
      const doc = await db.getDocument<NotificationDoc>(DB_ID, NOTIFS_COL_ID, id)
      if ((doc.status as any) !== "read") {
        throw new Error("Only read notifications can be deleted.")
      }
    } catch (e: any) {
      throw new Error(e?.message || "Delete not allowed.")
    }
  }
  await db.deleteDocument(DB_ID, NOTIFS_COL_ID, id)
}

async function listUnreadNotifications(userId: string, limit = 100): Promise<NotificationDoc[]> {
  const db = getDatabases()
  const { DB_ID, NOTIFS_COL_ID } = ids()
  const res = await db.listDocuments<NotificationDoc>(
    DB_ID,
    NOTIFS_COL_ID,
    [Query.equal("userId", userId), Query.equal("status", "unread"), Query.orderDesc("$createdAt"), Query.limit(limit)]
  )
  return res.documents ?? []
}

/* ----------------------------- Realtime feed (notifications collection) ---------------------------- */

export function subscribeToNotificationFeed(
  userId: string,
  onCreate: (doc: NotificationDoc) => void,
  onUpdate: (doc: NotificationDoc) => void,
  onDelete: (id: string) => void
): () => void {
  const { DB_ID, NOTIFS_COL_ID } = ids()
  const client = getClient()

  const channel = `databases.${DB_ID}.collections.${NOTIFS_COL_ID}.documents`
  const unsub = client.subscribe(channel, (res: any) => {
    const payload = res?.payload as NotificationDoc | undefined
    if (!payload || (payload.userId as any) !== userId) return

    const events: string[] = Array.isArray(res?.events) ? res.events : []
    const isCreate = events.some((e) => e.endsWith(".create"))
    const isUpdate = events.some((e) => e.endsWith(".update"))
    const isDelete = events.some((e) => e.endsWith(".delete"))

    try {
      if (isCreate) onCreate(payload)
      else if (isUpdate) onUpdate(payload)
      else if (isDelete) onDelete((payload as any).$id)
    } catch {
      /* noop */
    }
  })

  return () => {
    try {
      unsub()
    } catch {
      /* noop */
    }
  }
}

/* -------- Student-side bridge: Payments & Cashier replies → student notifications -------- */

export function startPaymentAndMessageBridges(userId: string): () => void {
  const { DB_ID, PAYMENTS_COL_ID, MESSAGES_COL_ID } = ids()
  const client = getClient()
  const cleaners: Array<() => void> = []

  // Payments status → notification → /payment-history
  if (DB_ID && PAYMENTS_COL_ID) {
    const channel = `databases.${DB_ID}.collections.${PAYMENTS_COL_ID}.documents`
    const off = client.subscribe(channel, (res: any) => {
      const events: string[] = Array.isArray(res?.events) ? res.events : []
      const isUpdate = events.some((e) => e.endsWith(".update"))
      const p = res?.payload as any
      if (!isUpdate || !p) return
      if (String(p.userId) !== String(userId)) return

      const status = String(p.status || "")
      if (!status) return

      const ref = p.reference || p.$id
      const msg = `Payment ${ref} is now ${status}.`
      createUniqueNotification(userId, msg, "/payment-history").catch(() => {})
    })
    cleaners.push(() => {
      try { off() } catch {}
    })
  }

  // Cashier reply → notification → /payment-history
  if (DB_ID && MESSAGES_COL_ID) {
    const channel = `databases.${DB_ID}.collections.${MESSAGES_COL_ID}.documents`
    const off = client.subscribe(channel, (res: any) => {
      const events: string[] = Array.isArray(res?.events) ? res.events : []
      const isUpdate = events.some((e) => e.endsWith(".update"))
      const m = res?.payload as any
      if (!isUpdate || !m) return
      if (String(m.userId) !== String(userId)) return

      const replied =
        (m.status && String(m.status).toLowerCase() === "replied") ||
        (typeof m.responseMessage === "string" && m.responseMessage.trim().length > 0)

      if (replied) {
        const subject = m.subject ? `“${m.subject}”` : m.$id
        const msg = `Cashier replied to ${subject}.`
        createUniqueNotification(userId, msg, "/payment-history").catch(() => {})
      }
    })
    cleaners.push(() => {
      try { off() } catch {}
    })
  }

  return () => {
    for (const c of cleaners) {
      try { c() } catch {}
    }
  }
}

/* -------- Cashier-side global bridge (kept) -------- */

export function startCashierRealtimeBridge(cashierId: string): () => void {
  const { DB_ID, PAYMENTS_COL_ID, MESSAGES_COL_ID } = ids()
  const client = getClient()
  const cleaners: Array<() => void> = []

  async function countUnreadStudentMessages(cashierId: string): Promise<number> {
    const { DB_ID, MESSAGES_COL_ID } = ids()
    if (!DB_ID || !MESSAGES_COL_ID) return 0
    const db = getDatabases()

    // Try common schemas: assignedCashierId, cashierId, recipientId
    const fields = ["assignedCashierId", "cashierId", "recipientId"]
    const statuses = [
      ["status", "new"],
      ["status", "unread"],
    ] as Array<[string, string]>

    const collected: Record<string, any> = {}

    for (const f of fields) {
      try {
        const res = await db.listDocuments<any>(
          DB_ID,
          MESSAGES_COL_ID,
          [Query.equal(f, cashierId), Query.limit(500), Query.orderDesc("$createdAt")]
        )
        for (const m of res.documents ?? []) {
          collected[m.$id] = m
        }
      } catch { /* ignore */ }
    }

    const arr = Object.values(collected) as any[]
    if (!arr.length) return 0

    // Heuristic "unread": status=new|unread OR explicit isRead=false OR no response yet
    const unread = arr.filter((m: any) => {
      const st = String(m.status ?? "").toLowerCase()
      const hasResponse = typeof m.responseMessage === "string" && m.responseMessage.trim().length > 0
      const isRead = (m.isRead === true) || (String(m.read) === "true")
      const statusUnread = statuses.some(([k, v]) => String(m[k] ?? "").toLowerCase() === v)
      return !isRead && (!hasResponse || statusUnread || st === "open" || st === "pending")
    })

    return unread.length
  }

  async function recomputeAndEmit() {
    try {
      const { DB_ID, PAYMENTS_COL_ID } = ids()
      if (!DB_ID || !PAYMENTS_COL_ID) return
      const db = getDatabases()

      // Pull pending payments (reasonable limit) and compute aggregates
      const pendRes = await db.listDocuments<any>(
        DB_ID,
        PAYMENTS_COL_ID,
        [Query.equal("status", "Pending"), Query.orderDesc("$createdAt"), Query.limit(500)]
      )
      const pendingDocs = (pendRes?.documents ?? []) as any[]

      const onlinePending = pendingDocs.filter(
        (p) => !["cash", "card"].includes(String(p.method || "").toLowerCase())
      )
      const pendingOnlineCount = onlinePending.length
      const pendingAllCount = pendingDocs.length

      const now = new Date()
      const y = now.getFullYear()
      const m = now.getMonth()
      const d = now.getDate()
      const pendingTodayCount = pendingDocs.filter((p) => {
        const dt = new Date(p.$createdAt)
        return dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d
      }).length

      const unreadMsgCount = await countUnreadStudentMessages(cashierId)

      const tasks: Array<Promise<any>> = []
      if (pendingOnlineCount > 0) {
        tasks.push(
          createUniqueNotification(
            cashierId,
            `Pending Online Payments: ${pendingOnlineCount}`,
            "/cashier/transactions?tab=all&method=online"
          )
        )
      }
      if (pendingAllCount > 0) {
        tasks.push(
          createUniqueNotification(
            cashierId,
            `Pending (All Transactions): ${pendingAllCount}`,
            "/cashier/transactions?tab=all&status=pending"
          )
        )
      }
      if (pendingTodayCount > 0) {
        tasks.push(
          createUniqueNotification(
            cashierId,
            `Pending Today: ${pendingTodayCount}`,
            "/cashier/transactions?tab=today&status=pending"
          )
        )
      }
      if (unreadMsgCount > 0) {
        tasks.push(
          createUniqueNotification(
            cashierId,
            `Unread student messages: ${unreadMsgCount}`,
            "/cashier/transactions?tab=messages"
          )
        )
      }
      if (tasks.length) await Promise.allSettled(tasks)
    } catch {
      /* silent */
    }
  }

  // Payments: granular + aggregates
  if (DB_ID && PAYMENTS_COL_ID) {
    const channel = `databases.${DB_ID}.collections.${PAYMENTS_COL_ID}.documents`
    const off = client.subscribe(channel, (res: any) => {
      const events: string[] = Array.isArray(res?.events) ? res.events : []
      const isCreate = events.some((e) => e.endsWith(".create"))
      const isUpdate = events.some((e) => e.endsWith(".update"))
      const p = res?.payload as any
      if (!(isCreate || isUpdate) || !p) return

      const status = String(p.status || "")
      const method = String(p.method || "").toLowerCase()

      // Granular per-payment ping for new/updated ONLINE pending (dedup by ref)
      if (status === "Pending" && !["cash", "card"].includes(method)) {
        const ref = p.reference || p.$id
        createUniqueNotification(
          cashierId,
          `New online payment pending: ${ref}`,
          "/cashier/transactions?tab=all&method=online"
        ).catch(() => {})
      }

      // Update aggregate counters
      recomputeAndEmit()
    })
    cleaners.push(() => {
      try { off() } catch {}
    })
  }

  // Messages: new/updated items possibly for this cashier → recompute & granular
  if (DB_ID && MESSAGES_COL_ID) {
    const channel = `databases.${DB_ID}.collections.${MESSAGES_COL_ID}.documents`
    const off = client.subscribe(channel, (res: any) => {
      const events: string[] = Array.isArray(res?.events) ? res.events : []
      const isCreate = events.some((e) => e.endsWith(".create"))
      const isUpdate = events.some((e) => e.endsWith(".update"))
      const m = res?.payload as any
      if (!(isCreate || isUpdate) || !m) return

      // Best-effort filter: recognize common assignment fields
      const assignedFields = [m.cashierId, m.assignedCashierId, m.recipientId]
      const isForThisCashier = assignedFields.some((v) => String(v || "") === String(cashierId))
      if (isForThisCashier) {
        const subject = m.subject ? `“${m.subject}”` : m.$id
        createUniqueNotification(
          cashierId,
          `New / updated student message: ${subject}`,
          "/cashier/transactions?tab=messages"
        ).catch(() => {})
      }

      recomputeAndEmit()
    })
    cleaners.push(() => {
      try { off() } catch {}
    })
  }

  // Seed counts immediately
  recomputeAndEmit()

  return () => {
    for (const c of cleaners) {
      try { c() } catch {}
    }
  }
}

/* -------- NEW: Admin-side bridge — new user registrations → admin notifications -------- */

/**
 * Subscribes to the Users collection and, on every document creation,
 * creates a deep-linked notification for the current admin.
 * Link: /admin/users
 */
export function startAdminRealtimeBridge(adminId: string): () => void {
  const { DB_ID, USERS_COL_ID } = ids()
  const client = getClient()

  if (!DB_ID || !USERS_COL_ID) {
    return () => {}
  }

  const channel = `databases.${DB_ID}.collections.${USERS_COL_ID}.documents`
  const off = client.subscribe(channel, (res: any) => {
    const events: string[] = Array.isArray(res?.events) ? res.events : []
    const isCreate = events.some((e) => e.endsWith(".create"))
    if (!isCreate) return

    const u = res?.payload as any
    if (!u) return

    const name = (u.fullName || u.name || "").trim()
    const email = (u.email || "").trim()
    const who = name && email ? `${name} (${email})` : name || email || u.userId || u.$id
    const msg = `New user registered: ${who}.`

    // Deep-link straight to admin users page
    createUniqueNotification(adminId, msg, "/admin/users").catch(() => {})
  })

  return () => {
    try { off() } catch {}
  }
}
