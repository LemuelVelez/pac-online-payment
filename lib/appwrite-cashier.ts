import type { Models } from "appwrite"
import { getDatabases, ID, Query, Permission, Role, getEnvIds } from "@/lib/appwrite"
import type { PaymentDoc, PaymentRecord } from "@/lib/appwrite-payments"

/** ===== User profile (Users collection) ===== */
export type FeePlan = {
  tuition?: number
  laboratory?: number
  library?: number
  miscellaneous?: number
  total?: number
}

export type UserProfileDoc = Models.Document & {
  userId: string
  email?: string
  fullName?: string
  role?: string
  status?: string
  studentId?: string
  course?: string
  courseId?: "bsed" | "bscs" | "bssw" | "bsit"
  yearLevel?: string
  yearId?: "1" | "2" | "3" | "4"
  feePlan?: FeePlan
  totalFees?: number
}

/** ===== Receipts collection ===== */
export type ReceiptItem = { label: string; amount: number }

export type ReceiptRecord = {
  userId: string
  paymentId?: string | null
  issuedAt: string
  items: ReceiptItem[]
  total: number
  method: string
  cashierId?: string | null
}

export type ReceiptDoc = Models.Document & ReceiptRecord

function ids() {
  const { DB_ID, USERS_COL_ID } = getEnvIds()
  const PAYMENTS_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_PAYMENTS_COLLECTION_ID as string
  const RECEIPTS_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_RECEIPTS_COLLECTION_ID as string
  return { DB_ID, USERS_COL_ID, PAYMENTS_COL_ID, RECEIPTS_COL_ID }
}

/** Utility: start and end of the current local day as ISO strings */
function getTodayBounds() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  return { startIso: start.toISOString(), endIso: end.toISOString() }
}

/** Get student by studentId (falls back to $id) */
export async function getStudentByStudentId(studentIdOrUserId: string): Promise<UserProfileDoc | null> {
  const db = getDatabases()
  const { DB_ID, USERS_COL_ID } = ids()

  // Try by studentId first
  const res = await db
    .listDocuments<UserProfileDoc>(DB_ID, USERS_COL_ID, [Query.equal("studentId", studentIdOrUserId), Query.limit(1)])
    .catch(() => null)

  if (res && res.documents && res.documents[0]) return res.documents[0]

  // Fallback by $id
  try {
    const doc = await db.getDocument<UserProfileDoc>(DB_ID, USERS_COL_ID, studentIdOrUserId)
    return doc
  } catch {
    return null
  }
}

/** List payments for a user filtered by statuses */
export async function listUserPayments(userId: string, statuses?: string[]): Promise<PaymentDoc[]> {
  const db = getDatabases()
  const { DB_ID, PAYMENTS_COL_ID } = ids()

  const queries: string[] = [Query.equal("userId", userId), Query.orderDesc("$createdAt"), Query.limit(100)]
  if (statuses && statuses.length) queries.push(Query.equal("status", statuses))
  const res = await db.listDocuments<PaymentDoc>(DB_ID, PAYMENTS_COL_ID, queries)
  return res.documents ?? []
}

/** NEW: List all payments created today (local day), paginated */
export async function listTodayPayments(): Promise<PaymentDoc[]> {
  const db = getDatabases()
  const { DB_ID, PAYMENTS_COL_ID } = ids()
  const { startIso, endIso } = getTodayBounds()

  const out: PaymentDoc[] = []
  let cursor: string | undefined

  for (;;) {
    const queries: string[] = [
      Query.greaterThanEqual("$createdAt", startIso),
      Query.lessThan("$createdAt", endIso),
      Query.orderDesc("$createdAt"),
      Query.limit(100),
    ]
    if (cursor) queries.push(Query.cursorAfter(cursor))

    const res = await db.listDocuments<PaymentDoc>(DB_ID, PAYMENTS_COL_ID, queries)
    const docs = res.documents ?? []
    out.push(...docs)

    if (docs.length < 100) break
    cursor = docs[docs.length - 1].$id
  }

  return out
}

/** Compute totals and balances for a student */
export async function computeStudentTotals(
  userId: string,
  feePlan?: FeePlan
): Promise<{
  paidTotal: number
  balanceTotal: number
  paidByFee: Partial<Record<keyof FeePlan, number>>
  balances: Partial<Record<keyof FeePlan, number>>
}> {
  const completed = await listUserPayments(userId, ["Completed", "Succeeded"])

  const paidByFee: Record<string, number> = {}
  let paidTotal = 0

  for (const p of completed) {
    const amt = Number(p.amount) || 0
    paidTotal += amt
    const fees = Array.isArray(p.fees) && p.fees.length ? p.fees : ["miscellaneous"]
    const share = fees.length ? amt / fees.length : amt
    for (const key of fees) {
      paidByFee[key] = (paidByFee[key] || 0) + share
    }
  }

  const plan = feePlan ?? {}
  const balances: Record<string, number> = {}
  const keys: (keyof FeePlan)[] = ["tuition", "laboratory", "library", "miscellaneous"]
  let totalPlan = 0
  for (const k of keys) {
    const target = Number(plan[k] ?? 0)
    const paid = Number(paidByFee[k as string] ?? 0)
    balances[k] = Math.max(0, target - paid)
    totalPlan += target
  }

  return {
    paidTotal,
    balanceTotal: Math.max(0, totalPlan - paidTotal),
    paidByFee,
    balances,
  }
}

/** Verify a pending online payment and issue a receipt */
export async function verifyPendingPaymentAndIssueReceipt(
  paymentId: string
): Promise<{ payment: PaymentDoc; receipt: ReceiptDoc }> {
  const db = getDatabases()
  const { DB_ID, PAYMENTS_COL_ID, RECEIPTS_COL_ID } = ids()

  const payment = await db.getDocument<PaymentDoc>(DB_ID, PAYMENTS_COL_ID, paymentId)

  const updated = await db.updateDocument<PaymentDoc>(DB_ID, PAYMENTS_COL_ID, payment.$id, { status: "Completed" })

  const amount = Number(updated.amount) || 0
  const fees = Array.isArray(updated.fees) && updated.fees.length ? updated.fees : ["miscellaneous"]
  const share = fees.length ? amount / fees.length : amount

  const items: ReceiptItem[] = fees.map((f) => ({ label: f[0].toUpperCase() + f.slice(1), amount: share }))

  const receipt = await db.createDocument<ReceiptDoc>(
    DB_ID,
    RECEIPTS_COL_ID,
    ID.unique(),
    {
      userId: updated.userId,
      paymentId: updated.$id,
      issuedAt: new Date().toISOString(),
      items,
      total: amount,
      method: updated.method || "Online",
    },
    [Permission.read(Role.any()), Permission.update(Role.any()), Permission.delete(Role.any())]
  )

  return { payment: updated, receipt }
}

/** Update a single student's fee plan */
export async function updateStudentFeePlan(
  userDocId: string,
  partial: { tuition?: number; laboratory?: number; library?: number; miscellaneous?: number }
): Promise<UserProfileDoc> {
  const db = getDatabases()
  const { DB_ID, USERS_COL_ID } = ids()

  const total =
    (partial.tuition ?? 0) + (partial.laboratory ?? 0) + (partial.library ?? 0) + (partial.miscellaneous ?? 0)

  const doc = await db.updateDocument<UserProfileDoc>(DB_ID, USERS_COL_ID, userDocId, {
    feePlan: { ...partial, total },
    totalFees: total,
  })

  return doc
}

/** Record an over-the-counter payment and issue a receipt */
export async function recordCounterPaymentAndReceipt(
  rec: Pick<PaymentRecord, "userId" | "courseId" | "yearId" | "amount" | "fees" | "method">
): Promise<{ payment: PaymentDoc; receipt: ReceiptDoc }> {
  const db = getDatabases()
  const { DB_ID, PAYMENTS_COL_ID, RECEIPTS_COL_ID } = ids()

  const payment = await db.createDocument<PaymentDoc>(DB_ID, PAYMENTS_COL_ID, ID.unique(), {
    ...rec,
    status: "Completed",
    reference: `CTR-${Date.now()}`,
  })

  const amount = Number(payment.amount) || 0
  const fees = Array.isArray(payment.fees) && payment.fees.length ? payment.fees : ["miscellaneous"]
  const share = fees.length ? amount / fees.length : amount
  const items: ReceiptItem[] = fees.map((f) => ({ label: f[0].toUpperCase() + f.slice(1), amount: share }))

  const receipt = await db.createDocument<ReceiptDoc>(
    DB_ID,
    RECEIPTS_COL_ID,
    ID.unique(),
    {
      userId: payment.userId,
      paymentId: payment.$id,
      issuedAt: new Date().toISOString(),
      items,
      total: amount,
      method: rec.method === "card" ? "Card" : "Cash",
    },
    [Permission.read(Role.any()), Permission.update(Role.any()), Permission.delete(Role.any())]
  )

  return { payment, receipt }
}

/** List ALL pending payments with attached student info (for data table) */
export async function listPendingPaymentsWithStudentInfo(): Promise<
  Array<{ payment: PaymentDoc; student: UserProfileDoc | null }>
> {
  const db = getDatabases()
  const { DB_ID, PAYMENTS_COL_ID, USERS_COL_ID } = ids()

  const out: Array<{ payment: PaymentDoc; student: UserProfileDoc | null }> = []
  let cursor: string | undefined

  for (;;) {
    const queries: string[] = [Query.equal("status", "Pending"), Query.orderDesc("$createdAt"), Query.limit(100)]
    if (cursor) queries.push(Query.cursorAfter(cursor))

    const res = await db.listDocuments<PaymentDoc>(DB_ID, PAYMENTS_COL_ID, queries)
    const docs = res.documents ?? []
    if (!docs.length) break

    const userIds = Array.from(new Set(docs.map((d) => d.userId).filter(Boolean)))
    let usersById: Record<string, UserProfileDoc> = {}
    if (userIds.length) {
      const usersRes = await db
        .listDocuments<UserProfileDoc>(DB_ID, USERS_COL_ID, [Query.equal("$id", userIds), Query.limit(userIds.length)])
        .catch(() => null)
      if (usersRes?.documents) {
        usersById = Object.fromEntries(usersRes.documents.map((u) => [u.$id, u]))
      }
    }

    for (const p of docs) {
      out.push({ payment: p, student: usersById[p.userId] ?? null })
    }

    if (docs.length < 100) break
    cursor = docs[docs.length - 1].$id
  }

  return out
}

/** Bulk: apply the same fee plan to ALL students (cashier tool) */
export async function applyFeePlanToAllStudents(plan: {
  tuition: number
  laboratory: number
  library: number
  miscellaneous: number
}): Promise<{ updated: number }> {
  const db = getDatabases()
  const { DB_ID, USERS_COL_ID } = ids()

  let updated = 0
  let cursor: string | undefined

  for (;;) {
    const queries: string[] = [Query.equal("role", "student"), Query.limit(100)]
    if (cursor) queries.push(Query.cursorAfter(cursor))

    const res = await db.listDocuments<UserProfileDoc>(DB_ID, USERS_COL_ID, queries)
    const docs = res.documents ?? []
    if (!docs.length) break

    const total = (plan.tuition || 0) + (plan.laboratory || 0) + (plan.library || 0) + (plan.miscellaneous || 0)

    await Promise.all(
      docs.map((u) =>
        db
          .updateDocument(DB_ID, USERS_COL_ID, u.$id, {
            feePlan: { ...plan, total },
            totalFees: total,
          })
          .then(() => updated++)
          .catch(() => null)
      )
    )

    if (docs.length < 100) break
    cursor = docs[docs.length - 1].$id
  }

  return { updated }
}

/** NEW: Transform payments into a 24-hour series for charts */
export function paymentsToHourlySeries(payments: PaymentDoc[]) {
  const buckets = Array.from({ length: 24 }, () => ({ amount: 0, count: 0 }))

  for (const p of payments || []) {
    const dt = new Date(p.$createdAt)
    const h = dt.getHours()
    const amt = Number(p.amount) || 0
    // Count every transaction; sum amounts for Completed/Succeeded (adjust if you want to include Pending)
    buckets[h].count += 1
    if (p.status === "Completed" || p.status === "Succeeded") {
      buckets[h].amount += amt
    }
  }

  return buckets.map((b, h) => {
    const label = `${String(h).padStart(2, "0")}:00`
    const rounded = Math.round(b.amount * 100) / 100
    return {
      hour: h,           // 0-23
      label,             // "00:00"
      time: label,       // common axis key
      name: label,       // recharts' default X key in some setups
      amount: rounded,   // total amount this hour
      value: rounded,    // duplicate for chart configs using `value`
      count: b.count,    // number of txns this hour
    }
  })
}
