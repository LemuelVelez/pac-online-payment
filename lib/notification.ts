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
  const { DB_ID } = getEnvIds()
  const NOTIFS_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATION_COLLECTION_ID as string
  const PAYMENTS_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_PAYMENTS_COLLECTION_ID as string | undefined
  const MESSAGES_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID as string | undefined
  if (!DB_ID || !NOTIFS_COL_ID) {
    console.warn("[notification] Missing DB/Notifications collection env IDs.")
  }
  return { DB_ID, NOTIFS_COL_ID, PAYMENTS_COL_ID, MESSAGES_COL_ID }
}

/* ----------------------- Link encoding/decoding (no new columns) ----------------------- */

const HREF_TAG_PREFIX = "[@href:"
const HREF_TAG_RE = /\s*\[@href:([^\]]+)\]\s*$/ // captures trailing [@href:/route]

/** Attach an href marker at the end of the text, e.g. "Cashier replied [@href:/payment-history]". */
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
    // Fetch once to confirm status
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

/* ----------------------------- Realtime feed ---------------------------- */

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

/* -------- Bridge: Payments & Cashier Replies → Notifications (userId) -------- */

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
      createNotification(userId, msg, "/payment-history").catch(() => {})
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
        createNotification(userId, msg, "/payment-history").catch(() => {})
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
