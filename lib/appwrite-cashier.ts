/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Models } from "appwrite"
import { getDatabases, ID, Query, Permission, Role, getEnvIds, getStorage } from "@/lib/appwrite"
import type { PaymentDoc, PaymentRecord } from "@/lib/appwrite-payments"

/** ===== User profile (Users collection) ===== */
export type FeePlan = {
  tuition?: number
  laboratory?: number
  library?: number
  miscellaneous?: number
  /** When only an overall total is known (no per-key breakdown). */
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

/** ===== Receipts ===== */
type ReceiptMethod = "cash" | "card" | "credit-card" | "e-wallet" | "online-banking"

export type ReceiptDoc = Models.Document & {
  userId: string
  paymentId?: string | null
  issuedAt: string
  total: number
  method: ReceiptMethod
  cashierId?: string | null
}

/** ===== Receipt Items (separate collection) ===== */
export type ReceiptItem = { label: string; amount: number; quantity?: number }
export type ReceiptItemDoc = Models.Document & {
  receipts: string // relation to receipt document id
  label: string
  amount: number
  quantity: number
}

function ids() {
  const { DB_ID, USERS_COL_ID } = getEnvIds()
  const PAYMENTS_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_PAYMENTS_COLLECTION_ID as string
  const RECEIPTS_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_RECEIPTS_COLLECTION_ID as string
  const RECEIPT_ITEMS_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_RECEIPT_ITEMS_COLLECTION_ID as string | undefined
  const RECEIPTS_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_RECEIPTS_BUCKET_ID as string | undefined
  return { DB_ID, USERS_COL_ID, PAYMENTS_COL_ID, RECEIPTS_COL_ID, RECEIPT_ITEMS_COL_ID, RECEIPTS_BUCKET_ID }
}

/** Normalize receipt method to match the Appwrite enum exactly. */
const RECEIPT_ALLOWED = new Set<ReceiptMethod>([
  "cash",
  "card",
  "credit-card",
  "e-wallet",
  "online-banking",
])
function normalizeReceiptMethod(value: unknown): ReceiptMethod {
  const v = String(value ?? "").toLowerCase().trim()
  if (RECEIPT_ALLOWED.has(v as ReceiptMethod)) return v as ReceiptMethod
  if (v.includes("cash")) return "cash"
  if (v.includes("wallet") || v.includes("gcash") || v.includes("maya") || v.includes("grab")) return "e-wallet"
  if (v.includes("bank")) return "online-banking"
  if (v.includes("credit") || v.includes("debit")) return "credit-card"
  if (v.includes("card")) return "card"
  // default fallback
  return "card"
}

/** Utility: start and end of the current local day as ISO strings */
function getTodayBounds() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  return { startIso: start.toISOString(), endIso: end.toISOString() }
}

/** Peso formatter (numeric) */
function peso(n: number) {
  return `₱${(n || 0).toLocaleString()}`
}

/** Render a simple printable HTML receipt to be uploaded as a file. */
function buildReceiptHtml(opts: {
  receipt: ReceiptDoc
  student?: Pick<UserProfileDoc, "fullName" | "studentId"> | null
  items: Array<{ label: string; amount: number; quantity?: number }>
}): string {
  const { receipt, student } = opts
  const rows = (opts.items || [])
    .map((i) => {
      const qty = Number(i.quantity ?? 1) || 1
      const label = qty > 1 ? `${i.label} × ${qty}` : i.label
      return `<tr>
  <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${label}</td>
  <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">${peso(Number(i.amount || 0) * qty)}</td>
</tr>`
    })
    .join("")
  const date = new Date(receipt.issuedAt || Date.now()).toLocaleString()

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Receipt ${receipt.$id}</title>
</head>
<body style="font-family: ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;background:#0f172a;color:#0b1220;padding:24px;">
  <div style="max-width:720px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 10px 25px rgba(2,6,23,.15);">
    <div style="background:#16a34a;color:#ffffff;padding:24px;">
      <h1 style="margin:0;font-size:20px;line-height:1.2;">Official Receipt</h1>
      <div style="opacity:.9;margin-top:4px;">Receipt ID: ${receipt.$id}</div>
    </div>

    <div style="padding:24px;">
      <div style="display:flex;gap:24px;flex-wrap:wrap;margin-bottom:16px;">
        <div><div style="font-size:12px;color:#6b7280;">Student Name</div><div style="font-weight:600">${student?.fullName ?? "—"}</div></div>
        <div><div style="font-size:12px;color:#6b7280;">Student ID</div><div style="font-weight:600">${student?.studentId ?? "—"}</div></div>
        <div><div style="font-size:12px;color:#6b7280;">Issued At</div><div style="font-weight:600">${date}</div></div>
        <div><div style="font-size:12px;color:#6b7280;">Method</div><div style="font-weight:600">${receipt.method || "—"}</div></div>
      </div>

      <table style="width:100%;border-collapse:collapse;border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;margin:8px 0;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="text-align:left;padding:8px;">Description</th>
            <th style="text-align:right;padding:8px;">Amount</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr>
            <td style="padding:8px;text-align:right;font-weight:700;">TOTAL</td>
            <td style="padding:8px;text-align:right;font-weight:700;">${peso(Number(receipt.total || 0))}</td>
          </tr>
        </tfoot>
      </table>

      <p style="font-size:12px;color:#6b7280;margin-top:16px;">This is a system-generated receipt. No signature required.</p>
    </div>
  </div>
</body>
</html>`
}

/** Uploads the rendered receipt HTML to Storage and returns a view URL, if bucket is configured. */
async function attachReceiptFile(
  receipt: ReceiptDoc,
  payment: PaymentDoc
): Promise<string | null> {
  const { RECEIPTS_BUCKET_ID, DB_ID, USERS_COL_ID, RECEIPT_ITEMS_COL_ID } = ids()
  if (!RECEIPTS_BUCKET_ID) return null

  const storage = getStorage()
  const db = getDatabases()

  // fetch student (for name/id on the downloaded receipt)
  let student: UserProfileDoc | null = null
  if (payment.userId) {
    student = await db.getDocument<UserProfileDoc>(DB_ID, USERS_COL_ID, payment.userId).catch(() => null)
  }

  // fetch line items from the RECEIPT_ITEMS collection, fall back to a single "Payment" line if not present
  let items: ReceiptItem[] = []
  if (RECEIPT_ITEMS_COL_ID) {
    const itemsRes = await db
      .listDocuments<ReceiptItemDoc>(DB_ID, RECEIPT_ITEMS_COL_ID, [Query.equal("receipts", receipt.$id), Query.limit(100)])
      .catch(() => null)
    if (itemsRes?.documents?.length) {
      items = itemsRes.documents.map((i) => ({
        label: i.label,
        amount: Number(i.amount || 0),
        quantity: Number(i.quantity || 1) || 1,
      }))
    }
  }

  if (!items.length) {
    // No saved breakdown — do NOT fabricate equal splits; show the single total line
    items = [{ label: "Payment", amount: Number(payment.amount) || 0, quantity: 1 }]
  }

  const html = buildReceiptHtml({
    receipt,
    student: student ? { fullName: student.fullName, studentId: student.studentId } : null,
    items,
  })
  const fileName = `receipt-${receipt.$id}.html`

  const fileLike =
    typeof File !== "undefined"
      ? new File([html], fileName, { type: "text/html" })
      : (new Blob([html], { type: "text/html" }) as unknown as File)

  const created: any = await storage.createFile(RECEIPTS_BUCKET_ID, ID.unique(), fileLike)
  const fileId: string = created?.$id
  const viewUrl = (storage.getFileView(RECEIPTS_BUCKET_ID, fileId) as unknown as string) || null

  // NOTE: Your collections don't have fields to store file URLs, so we only return the URL.
  return viewUrl
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
  const keys: (keyof FeePlan)[] = ["tuition", "laboratory", "library", "miscellaneous"]

  // Compute per-key targets if present
  const targets: Record<string, number> = {}
  let totalPlan = 0
  for (const k of keys) {
    const v = Number(plan[k] ?? 0)
    targets[k as string] = v
    totalPlan += v
  }

  // Fallback: if no per-key breakdown but we have an overall total, apply it to "miscellaneous"
  if (totalPlan === 0 && typeof plan.total === "number" && plan.total > 0) {
    targets.tuition = 0
    targets.laboratory = 0
    targets.library = 0
    targets.miscellaneous = Number(plan.total || 0)
    totalPlan = targets.miscellaneous
  }

  const balances: Record<string, number> = {}
  for (const k of keys) {
    const target = Number(targets[k as string] || 0)
    const paid = Number(paidByFee[k as string] || 0)
    balances[k as string] = Math.max(0, target - paid)
  }

  const balanceTotal = Math.max(0, totalPlan - paidTotal)

  return {
    paidTotal,
    balanceTotal,
    paidByFee,
    balances,
  }
}

/**
 * Verify a pending online payment and issue a receipt.
 * Also generates & attaches a downloadable receipt file (if bucket env is set).
 *
 * NOTE: Your Receipts collection does NOT have an `items` attribute.
 * Line items are saved into NEXT_PUBLIC_APPWRITE_RECEIPT_ITEMS_COLLECTION_ID.
 */
export async function verifyPendingPaymentAndIssueReceipt(
  paymentId: string
): Promise<{ payment: PaymentDoc; receipt: ReceiptDoc; receiptUrl?: string | null }> {
  const db = getDatabases()
  const { DB_ID, PAYMENTS_COL_ID, RECEIPTS_COL_ID, RECEIPT_ITEMS_COL_ID } = ids()

  const payment = await db.getDocument<PaymentDoc>(DB_ID, PAYMENTS_COL_ID, paymentId)

  const updated = await db.updateDocument<PaymentDoc>(DB_ID, PAYMENTS_COL_ID, payment.$id, { status: "Completed" })

  const amount = Number(updated.amount) || 0
  const fees = Array.isArray(updated.fees) && updated.fees.length ? updated.fees : ["miscellaneous"]
  const share = fees.length ? amount / fees.length : amount

  // 1) Create receipt with normalized method to satisfy the enum on Receipts collection
  const receipt = await db.createDocument<ReceiptDoc>(
    DB_ID,
    RECEIPTS_COL_ID,
    ID.unique(),
    {
      userId: updated.userId,
      paymentId: updated.$id,
      issuedAt: new Date().toISOString(),
      total: amount,
      method: normalizeReceiptMethod(updated.method),
    },
    [Permission.read(Role.any()), Permission.update(Role.any()), Permission.delete(Role.any())]
  )

  // 2) Create receipt item rows in the separate collection (if configured)
  if (RECEIPT_ITEMS_COL_ID) {
    const items: ReceiptItem[] = fees.map((f) => ({ label: f[0].toUpperCase() + f.slice(1), amount: share, quantity: 1 }))
    await Promise.all(
      items.map((it) =>
        db.createDocument(DB_ID, RECEIPT_ITEMS_COL_ID, ID.unique(), {
          receipts: receipt.$id, // relation to the receipt doc
          label: it.label,
          amount: it.amount,
          quantity: it.quantity ?? 1,
        })
      )
    ).catch(() => null)
  }

  // 3) Try to create & attach a downloadable file for the student (no DB updates)
  const url = await attachReceiptFile(receipt, updated).catch(() => null)

  return { payment: updated, receipt, receiptUrl: url ?? undefined }
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

/**
 * Record an over-the-counter payment and issue a receipt.
 * Also generates & attaches a downloadable receipt file (if bucket env is set).
 *
 * NOTE: No `items` field is written to the receipt document.
 */
export async function recordCounterPaymentAndReceipt(
  rec: Pick<PaymentRecord, "userId" | "courseId" | "yearId" | "amount" | "fees" | "method">
): Promise<{ payment: PaymentDoc; receipt: ReceiptDoc; receiptUrl?: string | null }> {
  const db = getDatabases()
  const { DB_ID, PAYMENTS_COL_ID, RECEIPTS_COL_ID, RECEIPT_ITEMS_COL_ID } = ids()

  const payment = await db.createDocument<PaymentDoc>(DB_ID, PAYMENTS_COL_ID, ID.unique(), {
    ...rec,
    status: "Completed",
    reference: `${Date.now()}`,
  })

  const amount = Number(payment.amount) || 0
  const fees = Array.isArray(payment.fees) && payment.fees.length ? payment.fees : ["miscellaneous"]
  const share = fees.length ? amount / fees.length : amount

  const receipt = await db.createDocument<ReceiptDoc>(
    DB_ID,
    RECEIPTS_COL_ID,
    ID.unique(),
    {
      userId: payment.userId,
      paymentId: payment.$id,
      issuedAt: new Date().toISOString(),
      total: amount,
      method: normalizeReceiptMethod(rec.method),
    },
    [Permission.read(Role.any()), Permission.update(Role.any()), Permission.delete(Role.any())]
  )

  // Create receipt items in the dedicated collection
  if (RECEIPT_ITEMS_COL_ID) {
    const items: ReceiptItem[] = fees.map((f) => ({ label: f[0].toUpperCase() + f.slice(1), amount: share, quantity: 1 }))
    await Promise.all(
      items.map((it) =>
        db.createDocument(DB_ID, RECEIPT_ITEMS_COL_ID, ID.unique(), {
          receipts: receipt.$id,
          label: it.label,
          amount: it.amount,
          quantity: it.quantity ?? 1,
        })
      )
    ).catch(() => null)
  }

  const url = await attachReceiptFile(receipt, payment).catch(() => null)

  return { payment, receipt, receiptUrl: url ?? undefined }
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
