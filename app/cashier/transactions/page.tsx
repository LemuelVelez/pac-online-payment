/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useMemo, useState, useCallback, useRef } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PaymentReceipt } from "@/components/payment/payment-receipt"
import { DateRangePicker } from "@/components/admin/date-range-picker"
import { Search, RefreshCw, Filter, Eye, Loader2, Reply, Paperclip, CheckCircle, Pencil, Trash2, Save, XCircle, Ban } from "lucide-react"
import { getDatabases, getEnvIds, Query, getStorage, getCurrentUserSafe, ID } from "@/lib/appwrite"
import type { PaymentDoc } from "@/lib/appwrite-payments"
import type { UserProfileDoc } from "@/lib/appwrite-cashier"
import { toast } from "sonner"
import {
  listMessagesForCashier,
  markMessageRead,
  replyToMessage,
  type MessageDoc,
} from "@/lib/appwrite-messages"
import { verifyPendingPaymentAndIssueReceipt } from "@/lib/appwrite-cashier"
import { getFeePlan, type FeePlanDoc, computeTotals } from "@/lib/fee-plan"
import { createUniqueNotification } from "@/lib/notification" // <-- existing notif helper
import { updatePayment } from "@/lib/appwrite-payments"       // <-- NEW import

type ReceiptData = {
  receiptNumber: string
  date: string
  studentId: string
  studentName: string
  paymentMethod: string
  items?: { description: string; amount: string }[]
  total: string
  downloadUrl?: string | null
  plan?: {
    program: string
    units: number
    tuitionPerUnit: number
    registrationFee: number
    feeItems: { name: string; amount: number }[]
    planTotal?: number
  } | null
  summary?: {
    totalFees?: number
    previouslyPaid?: number
    amountPaidNow?: number
    balanceAfter?: number
  }
}

function peso(n: number | string) {
  const v = typeof n === "string" ? Number(n || 0) : n
  return `₱${(v || 0).toLocaleString()}`
}
function methodLabel(m?: string) {
  if (!m) return "—"
  if (m === "credit-card") return "Credit/Debit Card"
  if (m === "e-wallet") return "E-Wallet"
  if (m === "online-banking") return "Bank Transfer"
  if (m === "card") return "Credit/Debit Card"
  if (m === "cash") return "Cash"
  return m
}
const COMPLETED = new Set(["Completed", "Succeeded"])

/* ---------- Local “read” persistence (UI-only safety net) ---------- */
function readKey(cashierId: string) {
  return `cashier_read_msgs_${cashierId}`
}
function getLocalReadSet(cashierId: string): Set<string> {
  if (typeof window === "undefined" || !cashierId) return new Set()
  try {
    const raw = localStorage.getItem(readKey(cashierId))
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as string[]
    return new Set(arr)
  } catch {
    return new Set()
  }
}
function saveLocalReadSet(cashierId: string, set: Set<string>) {
  if (typeof window === "undefined" || !cashierId) return
  try {
    localStorage.setItem(readKey(cashierId), JSON.stringify(Array.from(set)))
  } catch {
    /* noop */
  }
}

const REPLY_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_RECEIPTS_BUCKET_ID as string | undefined
const RECEIPTS_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_RECEIPTS_COLLECTION_ID as string | undefined
const RECEIPT_ITEMS_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_RECEIPT_ITEMS_COLLECTION_ID as string | undefined
const PAYMENTS_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_PAYMENTS_COLLECTION_ID as string | undefined
const MESSAGES_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID as string | undefined

export default function CashierTransactionsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all")
  const [loading, setLoading] = useState(false)

  const [allPayments, setAllPayments] = useState<PaymentDoc[]>([])
  const [studentsById, setStudentsById] = useState<Record<string, UserProfileDoc>>({})

  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<PaymentDoc | null>(null)
  const [verifying, setVerifying] = useState(false)

  // NEW: cancel/fail confirmations
  const [cancelTarget, setCancelTarget] = useState<PaymentDoc | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [failTarget, setFailTarget] = useState<PaymentDoc | null>(null)
  const [failing, setFailing] = useState(false)

  // messages state
  const [meId, setMeId] = useState<string>("")
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [messages, setMessages] = useState<MessageDoc[]>([])
  const [selectedMessage, setSelectedMessage] = useState<MessageDoc | null>(null)
  const [replyText, setReplyText] = useState("")
  const [replyFile, setReplyFile] = useState<File | null>(null)
  const [sendingReply, setSendingReply] = useState(false)

  // NEW: edit/delete state (cashier can edit or delete the student's message)
  const [editMsg, setEditMsg] = useState<MessageDoc | null>(null)
  const [editSubject, setEditSubject] = useState("")
  const [editBody, setEditBody] = useState("")
  const [savingEdit, setSavingEdit] = useState(false)

  const [deleteMsg, setDeleteMsg] = useState<MessageDoc | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Ref to capture the receipt as PNG
  const receiptRef = useRef<HTMLDivElement>(null)

  // Track which payments have a receipt doc so we can hide/show the View button
  const [receiptsByPaymentId, setReceiptsByPaymentId] = useState<Record<string, string>>({})

  // For inline “Pending Online Payments” list verification
  const [verifyingRowId, setVerifyingRowId] = useState<string | null>(null)
  const [failingRowId, setFailingRowId] = useState<string | null>(null)   // NEW
  const [cancellingRowId, setCancellingRowId] = useState<string | null>(null) // NEW

  // Prevent duplicate side effects in React Strict Mode (dev)
  const didInitRef = useRef(false)

  // --- Toast helper to prevent duplicates (keyed toasts) ---
  const T = useMemo(
    () => ({
      ok: (id: string, msg: string, opts?: any) => toast.success(msg, { id, ...opts }),
      info: (id: string, msg: string, opts?: any) => toast.info(msg, { id, ...opts }),
      err: (id: string, msg: string, opts?: any) => toast.error(msg, { id, ...opts }),
      warn: (id: string, msg: string, opts?: any) => toast.warning?.(msg, { id, ...opts }),
    }),
    []
  )

  // Helper: download current receipt as PNG
  const downloadReceiptPng = useCallback(async () => {
    if (!receiptRef.current || !receiptData) {
      T.err("dl-none", "Nothing to download yet.")
      return
    }
    try {
      // Prefer html-to-image, fall back to dom-to-image-more
      let dataUrl: string | null = null
      try {
        const { toPng } = await import("html-to-image")
        dataUrl = await toPng(receiptRef.current, {
          cacheBust: true,
          backgroundColor: "#ffffff",
          pixelRatio: 2,
        })
      } catch {
        const mod = await import("dom-to-image-more")
        const domtoimage = ((mod as any).default ?? mod) as {
          toPng(node: HTMLElement, options?: { cacheBust?: boolean; bgcolor?: string; quality?: number }): Promise<string>
        }
        dataUrl = await domtoimage.toPng(receiptRef.current, {
          cacheBust: true,
          bgcolor: "#ffffff",
          quality: 1,
        })
      }

      if (!dataUrl) throw new Error("Failed to render image.")

      const safeName = (s: string) => s.replace(/[^\w\-]+/g, "_")
      const fileName = `receipt_${safeName(receiptData.receiptNumber)}.png`

      const link = document.createElement("a")
      link.download = fileName
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      T.ok("dl-ok", "Receipt downloaded", { description: fileName })
    } catch (e: any) {
      T.err("dl-err", "Download failed", { description: e?.message ?? "Could not generate image." })
    }
  }, [receiptData, T])

  /* ================= Loaders ================= */

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { DB_ID, USERS_COL_ID } = getEnvIds()

      if (!DB_ID || !USERS_COL_ID || !PAYMENTS_COL_ID) {
        throw new Error("Missing Appwrite IDs: DB_ID / USERS_COL_ID / PAYMENTS_COL_ID. Check your env.")
      }

      const db = getDatabases()
      const res = await db.listDocuments<PaymentDoc>(DB_ID, PAYMENTS_COL_ID, [
        Query.orderDesc("$createdAt"),
        Query.limit(200),
      ])
      const payments = (res.documents ?? []) as PaymentDoc[]
      setAllPayments(payments)

      const userIds = Array.from(new Set(payments.map((p) => p.userId).filter(Boolean)))
      const map: Record<string, UserProfileDoc> = {}

      for (let i = 0; i < userIds.length; i += 100) {
        const slice = userIds.slice(i, i + 100)
        const usersRes = await db
          .listDocuments<UserProfileDoc>(DB_ID, USERS_COL_ID, [Query.equal("$id", slice), Query.limit(slice.length)])
          .catch(() => null)
        usersRes?.documents?.forEach((u) => {
          map[u.$id] = u as unknown as UserProfileDoc
        })
      }

      setStudentsById(map)

      // Prefetch which payments have a receipt doc
      if (RECEIPTS_COL_ID) {
        const ids = payments.map((p) => p.$id)
        const byPayment: Record<string, string> = {}
        for (let i = 0; i < ids.length; i += 100) {
          const slice = ids.slice(i, i + 100)
          const rres = await db
            .listDocuments<any>(DB_ID, RECEIPTS_COL_ID, [Query.equal("paymentId", slice), Query.limit(slice.length)])
            .catch(() => null)
          rres?.documents?.forEach((r: any) => {
            if (r.paymentId) byPayment[r.paymentId] = r.$id
          })
        }
        setReceiptsByPaymentId(byPayment)
      }

      T.ok("load-ok", "Transactions loaded", { description: `${payments.length} record(s)` })
    } catch (e: any) {
      T.err("load-err", "Failed to load transactions", { description: e?.message ?? "Please try again." })
    } finally {
      setLoading(false)
    }
  }, [T])

  const loadMessages = useCallback(async (opts?: { silent?: boolean }) => {
    setMessagesLoading(true)
    try {
      const me = await getCurrentUserSafe()
      if (!me) throw new Error("No cashier session.")
      if (!meId) setMeId(me.$id)

      const docs = await listMessagesForCashier(me.$id, 200)

      // Overlay local "read" memory
      const localRead = getLocalReadSet(me.$id)
      const normalized = docs.map((m) =>
        (m.status ?? "new").toLowerCase() === "new" && localRead.has(m.$id) ? { ...m, status: "read" as any } : m
      )

      setMessages(normalized)
      if (!opts?.silent) {
        const unread = normalized.filter((m) => (m.status ?? "new") === "new").length
        T.ok("msg-ok", "Messages refreshed", { description: `${normalized.length} total • ${unread} new` })
      }
    } catch (e: any) {
      T.err("msg-err", "Failed to load messages", { description: e?.message ?? "Please try again." })
    } finally {
      setMessagesLoading(false)
    }
  }, [meId, T])

  useEffect(() => {
    if (didInitRef.current) return
    didInitRef.current = true
    load()
    loadMessages({ silent: true })
  }, [load, loadMessages])

  useEffect(() => {
    ; (async () => {
      const me = await getCurrentUserSafe()
      if (me) setMeId(me.$id)
    })()
  }, [])

  /* ================= Helpers (plan + summary + items fallback) ================= */

  function buildSummaryAndPlan(payment: PaymentDoc, feePlan?: FeePlanDoc | null) {
    const plan =
      feePlan
        ? {
          program: feePlan.program,
          units: feePlan.units,
          tuitionPerUnit: feePlan.tuitionPerUnit,
          registrationFee: feePlan.registrationFee,
          feeItems: (feePlan.feeItems ?? []).map((f) => ({ name: f.name, amount: f.amount })),
          planTotal: computeTotals({
            units: feePlan.units,
            tuitionPerUnit: feePlan.tuitionPerUnit,
            registrationFee: feePlan.registrationFee,
            feeItems: feePlan.feeItems ?? [],
          }).total,
        }
        : null

    const planTotal = plan?.planTotal ?? 0
    const amountPaidNow = Number(payment.amount) || 0

    const previouslyPaid =
      (allPayments || [])
        .filter((p) => p.userId === payment.userId && COMPLETED.has(p.status))
        .reduce((s, p) => s + (Number(p.amount) || 0), 0) -
      (COMPLETED.has(payment.status) ? amountPaidNow : 0)

    const balanceAfter = Math.max(0, planTotal - (previouslyPaid + amountPaidNow))

    return {
      plan,
      summary: {
        totalFees: planTotal,
        previouslyPaid,
        amountPaidNow,
        balanceAfter,
      },
    }
  }

  function buildItemsFromPlan(plan?: FeePlanDoc | null): { description: string; amount: string }[] {
    if (!plan) return []
    const totals = computeTotals({
      units: plan.units,
      tuitionPerUnit: plan.tuitionPerUnit,
      registrationFee: plan.registrationFee,
      feeItems: plan.feeItems ?? [],
    })
    const items: { description: string; amount: string }[] = []
    items.push({
      description: "Registration Fee",
      amount: `₱${Number(plan.registrationFee || 0).toLocaleString()}`,
    })
    items.push({
      description: `Tuition Per Unit × Units (${plan.units} × ₱${Number(plan.tuitionPerUnit || 0).toLocaleString()})`,
      amount: `₱${Number(totals.tuition || 0).toLocaleString()}`,
    })
    for (const f of plan.feeItems ?? []) {
      items.push({
        description: f.name,
        amount: `₱${Number(f.amount || 0).toLocaleString()}`,
      })
    }
    return items
  }

  function preferPlanItemsIfGeneric(stored: { description: string; amount: string }[], plan?: FeePlanDoc | null) {
    const generic =
      !stored?.length ||
      (stored.length === 1 && typeof stored[0]?.description === "string" && stored[0].description.toLowerCase() === "payment")
    if (generic) {
      const fromPlan = buildItemsFromPlan(plan)
      return fromPlan.length ? fromPlan : stored
    }
    return stored
  }

  /* ================= Filters ================= */

  const normalizedMethodFilter = (
    paymentMethodFilter === "bank-transfer" ? "online-banking" : paymentMethodFilter
  ).toLowerCase()

  const filteredTransactions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return (allPayments ?? []).filter((t) => {
      const student = studentsById[t.userId]
      const matchesSearch =
        !term ||
        (t.reference ?? "").toLowerCase().includes(term) ||
        (t.$id ?? "").toLowerCase().includes(term) ||
        (student?.fullName ?? "").toLowerCase().includes(term) ||
        (student?.studentId ?? "").toLowerCase().includes(term)

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "completed" && COMPLETED.has(t.status)) ||
        (statusFilter === "pending" && t.status === "Pending") ||
        (statusFilter === "failed" && (t.status === "Failed" || t.status === "Cancelled"))

      const method = (t.method ?? "").toLowerCase()
      const matchesMethod = normalizedMethodFilter === "all" || method === normalizedMethodFilter

      return matchesSearch && matchesStatus && matchesMethod
    })
  }, [allPayments, studentsById, searchTerm, statusFilter, normalizedMethodFilter])

  const todaysTransactions = useMemo(() => {
    const today = new Date()
    const y = today.getFullYear()
    const m = today.getMonth()
    const d = today.getDate()
    return filteredTransactions.filter((t) => {
      const dt = new Date(t.$createdAt)
      return dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d
    })
  }, [filteredTransactions])

  const myLikeTransactions = useMemo(
    () => filteredTransactions.filter((t) => ["cash", "card"].includes((t.method || "").toLowerCase())),
    [filteredTransactions]
  )

  const pendingOnlinePayments = useMemo(
    () =>
      (allPayments ?? []).filter(
        (p) => p.status === "Pending" && !["cash", "card"].includes((p.method || "").toLowerCase())
      ),
    [allPayments]
  )

  // === NEW: derived counts for cashier notifications ===
  const pendingAllCount = useMemo(
    () => (allPayments ?? []).filter((p) => p.status === "Pending").length,
    [allPayments]
  )
  const pendingTodayCount = useMemo(() => {
    const t = new Date()
    const y = t.getFullYear()
    const m = t.getMonth()
    const d = t.getDate()
    return (allPayments ?? []).filter((p) => {
      if (p.status !== "Pending") return false
      const dt = new Date(p.$createdAt)
      return dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d
    }).length
  }, [allPayments])
  const unreadMsgCount = useMemo(
    () => (messages || []).filter((m) => (m.status ?? "new").toLowerCase() === "new").length,
    [messages]
  )

  // === NEW: push cashier notifications (deduped) based on counts
  useEffect(() => {
    if (!meId) return
    const tasks: Array<Promise<any>> = []

    const online = pendingOnlinePayments.length
    if (online > 0) {
      tasks.push(
        createUniqueNotification(
          meId,
          `Pending Online Payments: ${online}`,
          "/cashier/transactions?tab=all&method=online"
        )
      )
    }
    if (pendingAllCount > 0) {
      tasks.push(
        createUniqueNotification(
          meId,
          `Pending (All Transactions): ${pendingAllCount}`,
          "/cashier/transactions?tab=all&status=pending"
        )
      )
    }
    if (pendingTodayCount > 0) {
      tasks.push(
        createUniqueNotification(
          meId,
          `Pending Today: ${pendingTodayCount}`,
          "/cashier/transactions?tab=today&status=pending"
        )
      )
    }
    if (unreadMsgCount > 0) {
      tasks.push(
        createUniqueNotification(
          meId,
          `Unread student messages: ${unreadMsgCount}`,
          "/cashier/transactions?tab=messages"
        )
      )
    }

    if (tasks.length) {
      Promise.allSettled(tasks).catch(() => { })
    }
  }, [meId, pendingOnlinePayments.length, pendingAllCount, pendingTodayCount, unreadMsgCount])
  // === END new notifications ===

  /* ================= Receipt view & verification ================= */

  const handleViewReceipt = async (payment: PaymentDoc) => {
    setIsReceiptDialogOpen(true)
    setReceiptData(null)
    setSelectedPayment(payment)
    T.info("prep-receipt", "Preparing receipt…")

    try {
      const { DB_ID, USERS_COL_ID } = getEnvIds()
      if (!DB_ID || !USERS_COL_ID) {
        throw new Error("Missing Appwrite IDs for receipts. Set NEXT_PUBLIC_* env vars accordingly.")
      }
      const db = getDatabases()

      let student = studentsById[payment.userId]
      if (!student && payment.userId) {
        const userRes = await db.getDocument<UserProfileDoc>(DB_ID, USERS_COL_ID, payment.userId).catch(() => null)
        if (userRes) student = userRes as unknown as UserProfileDoc
      }

      let rec: any = null
      if (RECEIPTS_COL_ID) {
        const rres = await db
          .listDocuments<any>(DB_ID, RECEIPTS_COL_ID, [Query.equal("paymentId", payment.$id), Query.limit(1)])
          .catch(() => null)
        rec = rres?.documents?.[0] ?? null
      }

      const planId: string | null = rec?.planId ?? payment.planId ?? null

      let feePlanDoc: FeePlanDoc | null = null
      if (planId) {
        try {
          feePlanDoc = await getFeePlan(planId)
        } catch {
          feePlanDoc = null
        }
      }

      const { plan, summary } = buildSummaryAndPlan(payment, feePlanDoc)

      let lineItems: { description: string; amount: string }[] = []
      if (rec && RECEIPT_ITEMS_COL_ID) {
        const itemsRes = await db
          .listDocuments<any>(DB_ID, RECEIPT_ITEMS_COL_ID, [Query.equal("receipts", rec.$id), Query.limit(100)])
          .catch(() => null)
        lineItems =
          (itemsRes?.documents ?? []).map((i: any) => {
            const qty = Number(i.quantity ?? 1) || 1
            const subtotal = Number(i.amount || 0) * qty
            return {
              description: qty > 1 ? `${i.label} × ${qty}` : i.label,
              amount: `₱${subtotal.toLocaleString()}`,
            }
          }) ?? []
      }

      const items = preferPlanItemsIfGeneric(lineItems, feePlanDoc)

      if (rec) {
        setReceiptData({
          receiptNumber: rec.$id,
          date: new Date(rec.issuedAt ?? payment.$createdAt).toISOString().split("T")[0],
          studentId: student?.studentId ?? student?.$id ?? "—",
          studentName: student?.fullName ?? "—",
          paymentMethod: rec.method ?? methodLabel(payment.method),
          items: items.length ? items : undefined,
          total: `₱${Number(rec.total || payment.amount || 0).toLocaleString()}`,
          plan,
          summary,
        })
        return
      }

      const planItems = buildItemsFromPlan(feePlanDoc)
      setReceiptData({
        receiptNumber: payment.reference || payment.$id,
        date: new Date(payment.$createdAt).toISOString().split("T")[0],
        studentId: student?.studentId ?? student?.$id ?? "—",
        studentName: student?.fullName ?? "—",
        paymentMethod: methodLabel(payment.method),
        items: planItems.length ? planItems : undefined,
        total: `₱${Number(payment.amount || 0).toLocaleString()}`,
        plan,
        summary,
      })
    } catch (e: any) {
      T.err("view-err", "Unable to open receipt", { description: e?.message ?? "Please try again." })
    }
  }

  const verifyFromList = async (payment: PaymentDoc) => {
    if (payment.status !== "Pending") return
    setVerifyingRowId(payment.$id)
    try {
      const result = await verifyPendingPaymentAndIssueReceipt(payment.$id)
      const receipt = result.receipt as any

      setAllPayments((prev) => prev.map((p) => (p.$id === payment.$id ? result.payment : p)))
      setReceiptsByPaymentId((prev) => ({ ...prev, [payment.$id]: receipt.$id }))

      T.ok("verify-ok", "Payment verified", {
        description: result.receiptUrl ? "Receipt sent to student." : "Receipt issued.",
      })

      await handleViewReceipt(result.payment)
    } catch (e: any) {
      T.err("verify-err", "Verification failed", { description: e?.message ?? "Please try again." })
    } finally {
      setVerifyingRowId(null)
    }
  }

  const verifyFromDialog = async () => {
    if (!selectedPayment || selectedPayment.status !== "Pending") return
    setVerifying(true)
    try {
      const result = await verifyPendingPaymentAndIssueReceipt(selectedPayment.$id)
      const receipt = result.receipt as any
      const { DB_ID } = getEnvIds()
      let verifiedItems: { description: string; amount: string }[] = []

      if (DB_ID && RECEIPT_ITEMS_COL_ID) {
        try {
          const db = getDatabases()
          const itemsRes = await db.listDocuments<any>(DB_ID, RECEIPT_ITEMS_COL_ID, [
            Query.equal("receipts", receipt.$id),
            Query.limit(100),
          ])
          verifiedItems = (itemsRes?.documents ?? []).map((i: any) => {
            const qty = Number(i.quantity ?? 1) || 1
            const subtotal = Number(i.amount || 0) * qty
            return {
              description: qty > 1 ? `${i.label} × ${qty}` : i.label,
              amount: `₱${subtotal.toLocaleString()}`,
            }
          })
        } catch {
          /* ignore */
        }
      }

      let feePlanDoc: FeePlanDoc | null = null
      const planId = receipt?.planId ?? selectedPayment.planId ?? null
      if (planId) {
        try {
          feePlanDoc = await getFeePlan(planId)
        } catch {
          feePlanDoc = null
        }
      }

      const { plan, summary } = buildSummaryAndPlan(
        { ...selectedPayment, status: "Completed" },
        feePlanDoc
      )

      const items = preferPlanItemsIfGeneric(verifiedItems, feePlanDoc)

      setAllPayments((prev) => prev.map((p) => (p.$id === selectedPayment.$id ? result.payment : p)))
      setReceiptsByPaymentId((prev) => ({ ...prev, [selectedPayment.$id]: receipt.$id }))

      setReceiptData({
        receiptNumber: receipt.$id,
        date: new Date(receipt.issuedAt).toISOString().split("T")[0],
        studentId: receiptData?.studentId ?? "—",
        studentName: receiptData?.studentName ?? "—",
        paymentMethod: "Online",
        items: items.length ? items : undefined,
        total: `₱${Number(receipt.total || 0).toLocaleString()}`,
        downloadUrl: result.receiptUrl ?? null,
        plan,
        summary,
      })
      setSelectedPayment({ ...selectedPayment, status: "Completed" })
      T.ok("verify-ok", "Payment verified", { description: "Receipt issued successfully." })
    } catch (e: any) {
      T.err("verify-err", "Verification failed", { description: e?.message ?? "Please try again." })
    } finally {
      setVerifying(false)
    }
  }

  /* ================= NEW: Cancel / Fail handlers ================= */

  const openCancel = (p: PaymentDoc) => {
    if (p.status !== "Pending") {
      T.warn?.("cancel-na", "Only pending payments can be cancelled.")
      return
    }
    setCancelTarget(p)
  }

  const openFail = (p: PaymentDoc) => {
    if (p.status !== "Pending") {
      T.warn?.("fail-na", "Only pending payments can be marked as failed.")
      return
    }
    setFailTarget(p)
  }

  const doCancel = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      const updated = await updatePayment(cancelTarget.$id, { status: "Cancelled" })
      setAllPayments((prev) => prev.map((x) => (x.$id === updated.$id ? updated : x)))
      if (selectedPayment?.$id === updated.$id) setSelectedPayment(updated)
      T.ok("cancel-ok", "Payment cancelled")
    } catch (e: any) {
      T.err("cancel-err", "Failed to cancel", { description: e?.message ?? "Please try again." })
    } finally {
      setCancelling(false)
      setCancelTarget(null)
    }
  }

  const doFail = async () => {
    if (!failTarget) return
    setFailing(true)
    try {
      const updated = await updatePayment(failTarget.$id, { status: "Failed" })
      setAllPayments((prev) => prev.map((x) => (x.$id === updated.$id ? updated : x)))
      if (selectedPayment?.$id === updated.$id) setSelectedPayment(updated)
      T.ok("fail-ok", "Payment marked as Failed")
    } catch (e: any) {
      T.err("fail-err", "Failed to mark as Failed", { description: e?.message ?? "Please try again." })
    } finally {
      setFailing(false)
      setFailTarget(null)
    }
  }

  // Row-level quick actions (open confirm + show loading on that row)
  const cancelFromList = (p: PaymentDoc) => {
    setCancellingRowId(p.$id)
    openCancel(p)
  }
  const failFromList = (p: PaymentDoc) => {
    setFailingRowId(p.$id)
    openFail(p)
  }
  // Reset per-row loaders when dialogs close
  useEffect(() => {
    if (!cancelTarget) setCancellingRowId(null)
  }, [cancelTarget])
  useEffect(() => {
    if (!failTarget) setFailingRowId(null)
  }, [failTarget])

  /* ================= Messages ================= */

  const openMessage = async (msg: MessageDoc) => {
    try {
      const me = (await getCurrentUserSafe())!
      const cashierId = me.$id

      let updatedFromServer: MessageDoc | null = null
      try {
        updatedFromServer = await markMessageRead(msg.$id)
      } catch (e: any) {
        T.warn?.("mark-read-warn", "Couldn’t mark as read on server", {
          description: e?.message ?? "Using local state instead.",
        })
      }

      const set = getLocalReadSet(cashierId)
      set.add(msg.$id)
      saveLocalReadSet(cashierId, set)

      setMessages((prev) =>
        prev.map((m) => (m.$id === msg.$id ? (updatedFromServer ?? { ...m, status: "read" as any }) : m))
      )

      const { DB_ID, USERS_COL_ID } = getEnvIds()
      const db = getDatabases()
      if (!studentsById[msg.userId]) {
        const doc = await db.getDocument<UserProfileDoc>(DB_ID, USERS_COL_ID, msg.userId).catch(() => null)
        if (doc) setStudentsById((prev) => ({ ...prev, [doc.$id]: doc as unknown as UserProfileDoc }))
      }

      const student = studentsById[msg.userId]
      const defaultReply = `Hello ${student?.fullName ?? "student"},\n\nWe received your message about ${msg.subject}.\nWe'll review your request and get back to you shortly.\n\n— Cashier`
      setReplyText(msg.responseMessage ?? defaultReply)
      setReplyFile(null)

      setSelectedMessage(updatedFromServer ?? { ...msg, status: "read" as any })
    } catch (e: any) {
      T.err("open-msg-err", "Unable to open message", { description: e?.message ?? "Please try again." })
    }
  }

  const attachmentUrl = (m?: MessageDoc | null) => {
    if (!m?.proofBucketId || !m?.proofFileId) return null
    try {
      const storage = getStorage()
      return (storage.getFileView(m.proofBucketId, m.proofFileId) as unknown as string) || null
    } catch {
      return null
    }
  }

  const responseUrl = (m?: MessageDoc | null) => {
    if (!m?.responseBucketId || !m?.responseFileId) return null
    try {
      const storage = getStorage()
      return (storage.getFileView(m.responseBucketId, m.responseFileId) as unknown as string) || null
    } catch {
      return null
    }
  }

  const sendReply = async () => {
    if (!selectedMessage) return
    if (!replyText.trim()) {
      T.err("reply-empty", "Reply cannot be empty")
      return
    }
    setSendingReply(true)
    try {
      let uploaded:
        | { bucketId: string | null; fileId: string | null; fileName: string | null }
        | null = null

      if (replyFile && REPLY_BUCKET_ID) {
        const storage = getStorage()
        const created: any = await storage.createFile(REPLY_BUCKET_ID, ID.unique(), replyFile)
        uploaded = { bucketId: REPLY_BUCKET_ID, fileId: created?.$id, fileName: replyFile.name }
      } else {
        uploaded = { bucketId: null, fileId: null, fileName: null }
      }

      const updated = await replyToMessage(selectedMessage.$id, replyText.trim(), {
        responseBucketId: uploaded.bucketId,
        responseFileId: uploaded.fileId,
        responseFileName: uploaded.fileName,
      })

      setMessages((prev) => prev.map((m) => (m.$id === updated.$id ? updated : m)))
      setSelectedMessage(updated)
      T.ok("reply-ok", "Reply sent", {
        description: uploaded?.fileId ? "Receipt attached for the student." : "The student can now see your response.",
      })
    } catch (e: any) {
      T.err("reply-err", "Failed to send reply", { description: e?.message ?? "Please try again." })
    } finally {
      setSendingReply(false)
    }
  }

  /* ====== NEW: edit/delete message handlers (cashier side) ====== */

  const openEditMessage = (m: MessageDoc) => {
    setEditMsg(m)
    setEditSubject(m.subject || "")
    setEditBody(m.message || "")
  }

  const saveMessageEdits = async () => {
    if (!editMsg) return
    if (!editSubject.trim() || !editBody.trim()) {
      T.err("edit-empty", "Subject and message cannot be empty")
      return
    }
    setSavingEdit(true)
    try {
      const { DB_ID } = getEnvIds()
      if (!DB_ID || !MESSAGES_COL_ID) throw new Error("Messages collection not configured.")
      const db = getDatabases()
      const updated = await db.updateDocument<MessageDoc>(
        DB_ID,
        MESSAGES_COL_ID,
        editMsg.$id,
        { subject: editSubject.trim(), message: editBody.trim() }
      )
      setMessages((prev) => prev.map((x) => (x.$id === updated.$id ? updated : x)))
      T.ok("edit-ok", "Message updated")
      setEditMsg(null)
    } catch (e: any) {
      T.err("edit-err", "Failed to update", { description: e?.message ?? "Please try again." })
    } finally {
      setSavingEdit(false)
    }
  }

  const confirmDeleteMessage = async () => {
    if (!deleteMsg) return
    setDeleting(true)
    try {
      const { DB_ID } = getEnvIds()
      if (!DB_ID || !MESSAGES_COL_ID) throw new Error("Messages collection not configured.")
      const db = getDatabases()
      await db.deleteDocument(DB_ID, MESSAGES_COL_ID, deleteMsg.$id)
      setMessages((prev) => prev.filter((x) => x.$id !== deleteMsg.$id))
      T.ok("del-ok", "Message deleted")
      setDeleteMsg(null)
    } catch (e: any) {
      T.err("del-err", "Failed to delete", { description: e?.message ?? "Please try again." })
    } finally {
      setDeleting(false)
    }
  }

  /* ================= Render ================= */

  return (
    <DashboardLayout allowedRoles={["cashier"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Transaction History</h1>
            <p className="text-gray-300">View and manage all payment transactions (linked to students)</p>
          </div>
          <div className="mt-4 flex flex-col overflow-x-auto space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 md:mt-0">
            <DateRangePicker />
            <Button
              variant="outline"
              className="border-slate-600 text-white hover:bg-slate-700"
              onClick={() => load()}
              disabled={loading}
              title="Reload transactions"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {loading ? "Loading…" : "Reload"}
            </Button>
            <Button
              variant="outline"
              className="border-slate-600 text-white hover:bg-slate-700"
              onClick={() => loadMessages()}
              disabled={messagesLoading}
              title="Refresh messages"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {messagesLoading ? "Refreshing…" : "Refresh Messages"}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-slate-800/60 border-slate-700 text-white mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by reference, student name, or ID…"
                  className="pl-10 bg-slate-700 border-slate-600"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex space-x-4">
                <div className="w=[150px] md:w-[150px]">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <div className="flex items-center">
                        <Filter className="mr-2 h-4 w-4 text-gray-400" />
                        <span className="truncate">Status</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600 text-white">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed / Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w=[180px] md:w-[180px]">
                  <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <div className="flex items-center">
                        <Filter className="mr-2 h-4 w-4 text-gray-400" />
                        <span className="truncate">Payment Method</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600 text-white">
                      <SelectItem value="all">All Methods</SelectItem>
                      <SelectItem value="credit-card">Credit/Debit Card</SelectItem>
                      <SelectItem value="e-wallet">E-Wallet</SelectItem>
                      <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cash">Cash (OTC)</SelectItem>
                      <SelectItem value="card">Card (OTC)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* NEW: Pending Online Payments quick actions */}
        {pendingOnlinePayments.length > 0 && (
          <Card className="bg-slate-800/60 border-slate-700 text-white mb-8">
            <CardHeader>
              <CardTitle>Pending Online Payments</CardTitle>
              <CardDescription className="text-gray-300">Verify, fail, or cancel requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingOnlinePayments.map((p) => (
                  <div
                    key={p.$id}
                    className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-lg border border-slate-700 p-3"
                  >
                    <div>
                      <div className="font-medium">
                        {Array.isArray(p.fees) && p.fees.length ? p.fees.join(", ") : "Payment"} — {peso(p.amount)}
                      </div>
                      <div className="text-xs text-gray-400">
                        Ref: {p.reference || p.$id} • {new Date(p.$createdAt).toLocaleString()} • Method:{" "}
                        {methodLabel(p.method)}
                      </div>
                      {p.planId ? (
                        <div className="text-xs text-gray-400 mt-1">Plan: {p.planId}</div>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        className="border-slate-600"
                        size="sm"
                        onClick={() => handleViewReceipt(p)}
                        title="Preview receipt details"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </Button>
                      <Button
                        onClick={() => verifyFromList(p)}
                        disabled={verifyingRowId === p.$id}
                        title="Verify payment and issue receipt"
                        size="sm"
                      >
                        {verifyingRowId === p.$id ? (
                          <span className="flex items-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying…
                          </span>
                        ) : (
                          "Verify & Issue"
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="cursor-pointer"
                        onClick={() => failFromList(p)}
                        disabled={failingRowId === p.$id}
                        title="Mark as Failed"
                      >
                        {failingRowId === p.$id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="mr-2 h-4 w-4" />
                        )}
                        Fail
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-600 text-red-400 hover:bg-red-600/10"
                        onClick={() => cancelFromList(p)}
                        disabled={cancellingRowId === p.$id}
                        title="Cancel payment"
                      >
                        {cancellingRowId === p.$id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Ban className="mr-2 h-4 w-4" />
                        )}
                        Cancel
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-slate-800 border-slate-700 mb-8 grid w-full grid-cols-4 lg:max-w-[800px]">
            <TabsTrigger value="all" className="cursor-pointer">All Transactions</TabsTrigger>
            <TabsTrigger value="today" className="cursor-pointer">Today</TabsTrigger>
            <TabsTrigger value="my-transactions" className="cursor-pointer">Over-the-Counter</TabsTrigger>
            <TabsTrigger value="messages" className="cursor-pointer">Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <Card className="bg-slate-800/60 border-slate-700 text-white">
              <CardHeader>
                <CardTitle>All Transactions</CardTitle>
                <CardDescription className="text-gray-300">Showing {filteredTransactions.length} transaction(s)</CardDescription>
              </CardHeader>
              <CardContent>{renderTable(filteredTransactions)}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="today">
            <Card className="bg-slate-800/60 border-slate-700 text-white">
              <CardHeader>
                <CardTitle>Today&apos;s Transactions</CardTitle>
                <CardDescription className="text-gray-300">Transactions processed today</CardDescription>
              </CardHeader>
              <CardContent>{renderTable(todaysTransactions)}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="my-transactions">
            <Card className="bg-slate-800/60 border-slate-700 text-white">
              <CardHeader>
                <CardTitle>Over-the-Counter</CardTitle>
                <CardDescription className="text-gray-300">Cash/Card transactions (recorded by cashiers)</CardDescription>
              </CardHeader>
              <CardContent>{renderTable(myLikeTransactions)}</CardContent>
            </Card>
          </TabsContent>

          {/* Messages tab */}
          <TabsContent value="messages">
            <Card className="bg-slate-800/60 border-slate-700 text-white">
              <CardHeader>
                <CardTitle>Student Messages</CardTitle>
                <CardDescription className="text-gray-300">
                  Read, reply, edit, or delete student messages. {messagesLoading ? "Loading…" : `(${messages.length})`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-slate-700">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-700 bg-slate-900/50 text-left text-sm font-medium text-gray-300">
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3">Date</th>
                          <th className="px-6 py-3">From</th>
                          <th className="px-6 py-3">Subject</th>
                          <th className="px-6 py-3">Payment</th>
                          <th className="px-6 py-3">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        {messagesLoading ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-gray-300">
                              <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading messages…
                            </td>
                          </tr>
                        ) : messages.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-gray-300">No messages.</td>
                          </tr>
                        ) : (
                          messages.map((m) => {
                            const student = studentsById[m.userId]
                            const status = (m.status ?? "new").toLowerCase()
                            return (
                              <tr key={m.$id} className="text-sm">
                                <td className="whitespace-nowrap px-6 py-4">
                                  {status === "new" && <span className="inline-flex rounded-full bg-blue-500/20 px-2 py-1 text-xs font-medium text-blue-300">New</span>}
                                  {status === "read" && <span className="inline-flex rounded-full bg-amber-500/20 px-2 py-1 text-xs font-medium text-amber-300">Read</span>}
                                  {status === "replied" && <span className="inline-flex rounded-full bg-green-500/20 px-2 py-1 text-xs font-medium text-green-300">Replied</span>}
                                  {status !== "new" && status !== "read" && status !== "replied" && (
                                    <span className="inline-flex rounded-full bg-slate-500/20 px-2 py-1 text-xs font-medium text-slate-300">{m.status}</span>
                                  )}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4">{new Date(m.$createdAt).toLocaleString()}</td>
                                <td className="px-6 py-4">
                                  <div>
                                    <p className="font-medium">{student?.fullName ?? "—"}</p>
                                    <p className="text-xs text-gray-400">{student?.studentId ?? m.userId}</p>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="line-clamp-2">{m.subject}</div>
                                  <div className="text-xs text-gray-400 line-clamp-1">{m.message}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-xs text-gray-300">{m.paymentId ? m.paymentId : "—"}</div>
                                </td>
                                <td className="whitespace-nowrap px-6 py-4">
                                  <div className="flex flex-wrap gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="cursor-pointer border-slate-600 text-white hover:bg-slate-700"
                                      onClick={() => openMessage(m)}
                                      title="Open and reply"
                                    >
                                      <Reply className="mr-2 h-4 w-4" /> Open
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="cursor-pointer border-slate-600"
                                      onClick={() => openEditMessage(m)}
                                      title="Edit message"
                                    >
                                      <Pencil className="mr-2 h-4 w-4" /> Edit
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => setDeleteMsg(m)}
                                      title="Delete message"
                                      className="cursor-pointer"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Receipt Dialog (view, verify, fail, cancel) */}
        <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
          <DialogContent
            className="
              bg-slate-800 border-slate-700 text-white
              p-0
              w-[95vw] sm:w-auto
              max-w-[95vw] sm:max-w-[90vw] md:max-w-[720px] lg:max-w-[820px]
              max-h-[65vh] sm:max-h-[60vh]
              overflow-hidden
              flex flex-col
            "
          >
            <DialogHeader className="px-5 pt-5 pb-3">
              <DialogTitle>Payment Receipt</DialogTitle>
            </DialogHeader>

            {/* Scrollable body */}
            <div className="px-5 pb-5 overflow-y-auto flex-1">
              {!receiptData ? (
                <div className="flex items-center justify-center py-12 text-gray-300">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Preparing receipt…
                </div>
              ) : (
                <>
                  {selectedPayment?.status === "Pending" && (
                    <div className="mb-3 rounded-md bg-amber-500/15 border border-amber-400/40 p-3 text-sm text-amber-100">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          This payment is still <b>Pending</b>. Choose an action:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button onClick={verifyFromDialog} disabled={verifying}>
                            {verifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Verify & Issue Receipt
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => selectedPayment && openFail(selectedPayment)}
                            className="cursor-pointer"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Mark Failed
                          </Button>
                          <Button
                            variant="outline"
                            className="border-red-600 text-red-400 hover:bg-red-600/10"
                            onClick={() => selectedPayment && openCancel(selectedPayment)}
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Capture-only area for PNG download */}
                  <div ref={receiptRef}>
                    <PaymentReceipt
                      receiptNumber={receiptData.receiptNumber}
                      date={receiptData.date}
                      studentId={receiptData.studentId}
                      studentName={receiptData.studentName}
                      paymentMethod={receiptData.paymentMethod}
                      items={receiptData.items}
                      total={receiptData.total}
                      plan={receiptData.plan ?? null}
                      summary={receiptData.summary}
                    />
                  </div>

                  {/* Actions: Download PNG */}
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      className="border-slate-600"
                      onClick={downloadReceiptPng}
                      title="Download this receipt as PNG"
                    >
                      Download PNG
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Message View/Reply Dialog */}
        <Dialog open={!!selectedMessage} onOpenChange={(o) => !o && setSelectedMessage(null)}>
          <DialogContent
            className="
              bg-slate-800 border-slate-700 text-white
              p-0
              w-[95vw] sm:w-auto
              max-w-[95vw] sm:max-w-[90vw] md:max-w-[720px] lg:max-w-[820px]
              max-h-[70vh] sm:max-h-[65vh] md:max-h-[60vh]
              overflow-hidden
              flex flex-col
            "
          >
            <DialogHeader className="px-5 pt-5 pb-3">
              <DialogTitle>Student Message</DialogTitle>
              <DialogDescription className="text-gray-300">
                Read and reply to the student. Attachments open in a new tab.
              </DialogDescription>
            </DialogHeader>

            {/* Scrollable body */}
            <div className="px-5 pb-4 overflow-y-auto flex-1">
              {selectedMessage ? (
                <div className="space-y-4">
                  <div className="rounded-md border border-slate-700 p-3">
                    <div className="text-sm text-gray-400 mb-1">
                      Message ID: <span className="text-gray-200">{selectedMessage.$id}</span>
                    </div>
                    <div className="font-medium">{selectedMessage.subject}</div>
                    <div className="mt-2 whitespace-pre-wrap text-gray-200">{selectedMessage.message}</div>

                    {selectedMessage.proofBucketId && selectedMessage.proofFileId ? (
                      <a
                        href={attachmentUrl(selectedMessage) ?? undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center text-blue-300 hover:text-blue-200 text-sm"
                      >
                        <Paperclip className="mr-2 h-4 w-4" />
                        {selectedMessage.proofFileName || "Attachment"}
                      </a>
                    ) : null}

                    {selectedMessage.responseBucketId && selectedMessage.responseFileId ? (
                      <div className="mt-2">
                        <a
                          href={responseUrl(selectedMessage) ?? undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-emerald-300 hover:text-emerald-200 text-sm"
                        >
                          <Paperclip className="mr-2 h-4 w-4" />
                          {selectedMessage.responseFileName || "Receipt attachment"}
                        </a>
                      </div>
                    ) : null}
                    <div className="mt-3 text-xs text-gray-400">
                      From: {studentsById[selectedMessage.userId]?.fullName ?? selectedMessage.userId} •{" "}
                      {new Date(selectedMessage.$createdAt).toLocaleString()}
                    </div>
                    {selectedMessage.paymentId ? (
                      <div className="text-xs text-gray-400">Payment: {selectedMessage.paymentId}</div>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-gray-200">Your Reply</label>
                    <textarea
                      className="min-h[110px] w-full rounded-md border border-slate-700 bg-slate-900 p-3 text-sm text-gray-100 outline-none focus:ring-2 focus:ring-primary/60"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply here…"
                      style={{ minHeight: 110 }}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-gray-200">Attach receipt (optional)</label>
                    {!REPLY_BUCKET_ID ? (
                      <div className="text-xs text-amber-200">
                        Missing <code>NEXT_PUBLIC_APPWRITE_RECEIPTS_BUCKET_ID</code> in env — file upload disabled.
                      </div>
                    ) : null}
                    <div className="flex items-center gap-3">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-600 bg-slate-700/40 px-3 py-2 text-sm hover:bg-slate-700/70">
                        <Paperclip className="h-4 w-4" />
                        <span>{replyFile ? "Replace file" : "Choose file"}</span>
                        <input
                          type="file"
                          accept="application/pdf,image/*"
                          className="hidden"
                          onChange={(e) => setReplyFile(e.target.files?.[0] ?? null)}
                        />
                      </label>
                      {replyFile ? (
                        <span className="text-xs text-gray-300 truncate max-w-[60%]">
                          {replyFile.name} • {(replyFile.size / 1024).toFixed(0)} KB
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Optional PDF or image.</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Sticky footer */}
            <div className="px-5 py-4 border-t border-slate-700 bg-slate-800 flex flex-wrap justify-end gap-2">
              <Button variant="outline" className="border-slate-600" onClick={() => setSelectedMessage(null)}>
                Close
              </Button>
              <Button onClick={sendReply} disabled={sendingReply || !replyText.trim()} title="Send reply to student">
                {sendingReply ? (
                  <span className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Reply className="mr-2 h-4 w-4" /> Send Reply
                  </span>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* NEW: Edit Message dialog (cashier edits student's original message) */}
        <Dialog open={!!editMsg} onOpenChange={(o) => !o && setEditMsg(null)}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>Edit student message</DialogTitle>
              <DialogDescription className="text-gray-300">
                Update the subject and message (use with care).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm text-gray-200">Subject</label>
                <input
                  className="w-full rounded-md border border-slate-700 bg-slate-900 p-2 text-sm text-gray-100 outline-none focus:ring-2 focus:ring-primary/60"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-gray-200">Message</label>
                <textarea
                  className="min-h-[140px] w-full rounded-md border border-slate-700 bg-slate-900 p-3 text-sm text-gray-100 outline-none focus:ring-2 focus:ring-primary/60"
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" className="border-slate-600" onClick={() => setEditMsg(null)}>
                Cancel
              </Button>
              <Button onClick={saveMessageEdits} disabled={savingEdit || !editSubject.trim() || !editBody.trim()}>
                {savingEdit ? (
                  <span className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Save className="mr-2 h-4 w-4" /> Save
                  </span>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* NEW: Delete confirmation (cashier) */}
        <AlertDialog open={!!deleteMsg} onOpenChange={(o) => !o && setDeleteMsg(null)}>
          <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this message?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-300">
                This will permanently remove <b>{deleteMsg?.subject}</b> from the inbox.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-slate-600">Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={confirmDeleteMessage}
                disabled={deleting}
              >
                {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* NEW: Confirm Cancel */}
        <AlertDialog open={!!cancelTarget} onOpenChange={(o) => !o && setCancelTarget(null)}>
          <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel this payment?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-300">
                The status will change to <b>Cancelled</b>. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-slate-600">No</AlertDialogCancel>
              <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={doCancel} disabled={cancelling}>
                {cancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ban className="mr-2 h-4 w-4" />}
                Yes, Cancel
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* NEW: Confirm Fail */}
        <AlertDialog open={!!failTarget} onOpenChange={(o) => !o && setFailTarget(null)}>
          <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Mark this payment as Failed?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-300">
                The status will change to <b>Failed</b>. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-slate-600">No</AlertDialogCancel>
              <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={doFail} disabled={failing}>
                {failing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                Yes, Mark Failed
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  )

  function renderTable(rows: PaymentDoc[]) {
    return (
      <div className="rounded-lg border border-slate-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/50 text-left text-sm font-medium text-gray-300">
                <th className="px-6 py-3">Reference ID</th>
                <th className="px-6 py-3">Date &amp; Time</th>
                <th className="px-6 py-3">Student</th>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3 text-right">Amount</th>
                <th className="px-6 py-3">Payment Method</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-300">
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-300">No transactions found.</td>
                </tr>
              ) : (
                rows.map((t) => {
                  const s = studentsById[t.userId]
                  const desc =
                    Array.isArray(t.fees) && t.fees.length > 0
                      ? `Fees: ${t.fees.join(", ")}`
                      : t.planId
                        ? "Fee Plan Payment"
                        : "Payment"
                  const hasReceipt = !!receiptsByPaymentId[t.$id]
                  const isPending = t.status === "Pending"
                  const isOnline = !["cash", "card"].includes((t.method || "").toLowerCase())
                  return (
                    <tr key={t.$id} className="text-sm">
                      <td className="whitespace-nowrap px-6 py-4 font-medium">{t.reference || t.$id}</td>
                      <td className="whitespace-nowrap px-6 py-4">{new Date(t.$createdAt).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium">{s?.fullName ?? "—"}</p>
                          <p className="text-xs text-gray-400">{s?.studentId ?? t.userId}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">{desc}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">{peso(t.amount)}</td>
                      <td className="px-6 py-4">{methodLabel(t.method)}</td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {isPending && (
                          <span className="inline-flex rounded-full bg-yellow-500/20 px-2 py-1 text-xs font-medium text-yellow-300">
                            Pending
                          </span>
                        )}
                        {COMPLETED.has(t.status) && (
                          <span className="inline-flex rounded-full bg-green-500/20 px-2 py-1 text-xs font-medium text-green-300">
                            Completed
                          </span>
                        )}
                        {(t.status === "Failed" || t.status === "Cancelled") && (
                          <span className="inline-flex rounded-full bg-red-500/20 px-2 py-1 text-xs font-medium text-red-300">
                            {t.status}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {hasReceipt ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-slate-600 text-white hover:bg-slate-700"
                            onClick={() => handleViewReceipt(t)}
                            title="View receipt"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Receipt
                          </Button>
                        ) : isPending && isOnline ? (
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              onClick={() => verifyFromList(t)}
                              disabled={verifyingRowId === t.$id}
                              title="Verify payment and issue receipt"
                            >
                              {verifyingRowId === t.$id ? (
                                <span className="flex items-center">
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Verifying…
                                </span>
                              ) : (
                                "Verify & Issue"
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="cursor-pointer"
                              onClick={() => failFromList(t)}
                              disabled={failingRowId === t.$id}
                              title="Mark as Failed"
                            >
                              {failingRowId === t.$id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="mr-2 h-4 w-4" />
                              )}
                              Fail
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-600 text-red-400 hover:bg-red-600/10"
                              onClick={() => cancelFromList(t)}
                              disabled={cancellingRowId === t.$id}
                              title="Cancel payment"
                            >
                              {cancellingRowId === t.$id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Ban className="mr-2 h-4 w-4" />
                              )}
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No receipt yet</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }
}
