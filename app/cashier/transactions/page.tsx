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
import { PaymentReceipt } from "@/components/payment/payment-receipt"
import { DateRangePicker } from "@/components/admin/date-range-picker"
import { Search, RefreshCw, Filter, Eye, Loader2, Reply, Paperclip, CheckCircle, FileText } from "lucide-react"
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

  // messages state
  const [meId, setMeId] = useState<string>("")
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [messages, setMessages] = useState<MessageDoc[]>([])
  const [selectedMessage, setSelectedMessage] = useState<MessageDoc | null>(null)
  const [replyText, setReplyText] = useState("")
  const [replyFile, setReplyFile] = useState<File | null>(null)
  const [sendingReply, setSendingReply] = useState(false)

  // Ref to capture the receipt as PNG
  const receiptRef = useRef<HTMLDivElement>(null)

  // Track which payments have a receipt doc so we can hide/show the View button
  const [receiptsByPaymentId, setReceiptsByPaymentId] = useState<Record<string, string>>({})

  // For inline “Pending Online Payments” list verification
  const [verifyingRowId, setVerifyingRowId] = useState<string | null>(null)

  // Helper: download current receipt as PNG
  const downloadReceiptPng = useCallback(async () => {
    if (!receiptRef.current || !receiptData) {
      toast.error("Nothing to download yet.")
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
      toast.success("Receipt downloaded", { description: fileName })
    } catch (e: any) {
      toast.error("Download failed", { description: e?.message ?? "Could not generate image." })
    }
  }, [receiptData])

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

      // Prefetch which payments have a receipt doc so we can hide/show the "View Receipt" button
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

      toast.success("Transactions loaded", { description: `${payments.length} record(s)` })
    } catch (e: any) {
      toast.error("Failed to load transactions", { description: e?.message ?? "Please try again." })
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMessages = useCallback(async (opts?: { silent?: boolean }) => {
    setMessagesLoading(true)
    try {
      const me = await getCurrentUserSafe()
      if (!me) throw new Error("No cashier session.")
      if (!meId) setMeId(me.$id)

      const docs = await listMessagesForCashier(me.$id, 200)

      // Overlay local "read" memory to prevent reverting to "new" after refresh
      const localRead = getLocalReadSet(me.$id)
      const normalized = docs.map((m) =>
        (m.status ?? "new").toLowerCase() === "new" && localRead.has(m.$id) ? { ...m, status: "read" as any } : m
      )

      setMessages(normalized)
      if (!opts?.silent) {
        const unread = normalized.filter((m) => (m.status ?? "new") === "new").length
        toast.success("Messages refreshed", { description: `${normalized.length} total • ${unread} new` })
      }
    } catch (e: any) {
      toast.error("Failed to load messages", { description: e?.message ?? "Please try again." })
    } finally {
      setMessagesLoading(false)
    }
  }, [meId])

  useEffect(() => {
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

    // Previously paid = sum of Completed/Succeeded for this user (exclude this one if it's already completed)
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

  /** Plan-based receipt items (used when no/poor stored items) */
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

  /** If stored items are empty or just a generic "Payment", prefer plan items to match Online Receipt style */
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

  // NEW: Pending Online Payments list (exclude OTC cash/card)
  const pendingOnlinePayments = useMemo(
    () =>
      (allPayments ?? []).filter(
        (p) => p.status === "Pending" && !["cash", "card"].includes((p.method || "").toLowerCase())
      ),
    [allPayments]
  )

  /* ================= Receipt view & verification ================= */

  const handleViewReceipt = async (payment: PaymentDoc) => {
    setIsReceiptDialogOpen(true)
    setReceiptData(null)
    setSelectedPayment(payment)
    toast.info("Preparing receipt…")

    try {
      const { DB_ID, USERS_COL_ID } = getEnvIds()
      if (!DB_ID || !USERS_COL_ID) {
        throw new Error("Missing Appwrite IDs for receipts. Set NEXT_PUBLIC_* env vars accordingly.")
      }
      const db = getDatabases()

      // ensure student profile
      let student = studentsById[payment.userId]
      if (!student && payment.userId) {
        const userRes = await db.getDocument<UserProfileDoc>(DB_ID, USERS_COL_ID, payment.userId).catch(() => null)
        if (userRes) student = userRes as unknown as UserProfileDoc
      }

      // --- Load receipt for this payment (to pick up planId from the receipt itself) ---
      let rec: any = null
      if (RECEIPTS_COL_ID) {
        const rres = await db
          .listDocuments<any>(DB_ID, RECEIPTS_COL_ID, [Query.equal("paymentId", payment.$id), Query.limit(1)])
          .catch(() => null)
        rec = rres?.documents?.[0] ?? null
      }

      // Determine planId (prefer receipt.planId, then payment.planId)
      const planId: string | null = rec?.planId ?? payment.planId ?? null

      // Fetch fee plan (if any)
      let feePlanDoc: FeePlanDoc | null = null
      if (planId) {
        try {
          feePlanDoc = await getFeePlan(planId)
        } catch {
          feePlanDoc = null
        }
      }

      // Build plan + summary FIRST so they're always present in the preview
      const { plan, summary } = buildSummaryAndPlan(payment, feePlanDoc)

      // Try to load stored line items
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

      // If stored items are empty or just "Payment", rebuild from plan to mirror Online Receipt
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

      // No receipt doc found — fallback preview from payment, but still show plan & plan-based items if available
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
      toast.error("Unable to open receipt", { description: e?.message ?? "Please try again." })
    }
  }

  // NEW: Verify directly from the Pending Online list, then open the receipt
  const verifyFromList = async (payment: PaymentDoc) => {
    if (payment.status !== "Pending") return
    setVerifyingRowId(payment.$id)
    try {
      const result = await verifyPendingPaymentAndIssueReceipt(payment.$id)
      const receipt = result.receipt as any

      // update table + mark receipt existence
      setAllPayments((prev) => prev.map((p) => (p.$id === payment.$id ? result.payment : p)))
      setReceiptsByPaymentId((prev) => ({ ...prev, [payment.$id]: receipt.$id }))

      toast.success("Payment verified", {
        description: result.receiptUrl ? "Receipt sent to student." : "Receipt issued.",
      })

      // open/refresh receipt dialog for this payment
      await handleViewReceipt(result.payment)
    } catch (e: any) {
      toast.error("Verification failed", { description: e?.message ?? "Please try again." })
    } finally {
      setVerifyingRowId(null)
    }
  }

  const verifyFromDialog = async () => {
    if (!selectedPayment || selectedPayment.status !== "Pending") return
    setVerifying(true)
    try {
      const result = await verifyPendingPaymentAndIssueReceipt(selectedPayment.$id)

      // After verification, prefer planId from the newly created receipt
      const receipt = result.receipt as any
      const { DB_ID } = getEnvIds()
      let verifiedItems: { description: string; amount: string }[] = []

      // Try loading stored items
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
          /* ignore; we’ll fallback to plan items below */
        }
      }

      // Fetch fee plan by receipt.planId (fallback to payment.planId)
      let feePlanDoc: FeePlanDoc | null = null
      const planId = receipt?.planId ?? selectedPayment.planId ?? null
      if (planId) {
        try {
          feePlanDoc = await getFeePlan(planId)
        } catch {
          feePlanDoc = null
        }
      }

      // Rebuild plan + summary after verification (mark this payment as completed for summary math)
      const { plan, summary } = buildSummaryAndPlan(
        { ...selectedPayment, status: "Completed" },
        feePlanDoc
      )

      // Prefer plan items if stored items are empty or generic
      const items = preferPlanItemsIfGeneric(verifiedItems, feePlanDoc)

      // Update table row
      setAllPayments((prev) => prev.map((p) => (p.$id === selectedPayment.$id ? result.payment : p)))
      // Mark that this payment now has a receipt so the “View Receipt” button can show
      setReceiptsByPaymentId((prev) => ({ ...prev, [selectedPayment.$id]: receipt.$id }))

      // Refresh receipt view right away
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
      toast.success("Payment verified", { description: "Receipt issued successfully." })
    } catch (e: any) {
      toast.error("Verification failed", { description: e?.message ?? "Please try again." })
    } finally {
      setVerifying(false)
    }
  }

  /* ================= Messages ================= */

  const openMessage = async (msg: MessageDoc) => {
    try {
      const me = (await getCurrentUserSafe())!
      const cashierId = me.$id

      // Try server mark-as-read, fall back to local flag
      let updatedFromServer: MessageDoc | null = null
      try {
        updatedFromServer = await markMessageRead(msg.$id)
      } catch (e: any) {
        toast.warning("Couldn’t mark as read on server", { description: e?.message ?? "Using local state instead." })
      }

      const set = getLocalReadSet(cashierId)
      set.add(msg.$id)
      saveLocalReadSet(cashierId, set)

      setMessages((prev) =>
        prev.map((m) => (m.$id === msg.$id ? (updatedFromServer ?? { ...m, status: "read" as any }) : m))
      )

      // ensure student profile is cached
      const { DB_ID, USERS_COL_ID } = getEnvIds()
      const db = getDatabases()
      if (!studentsById[msg.userId]) {
        const doc = await db.getDocument<UserProfileDoc>(DB_ID, USERS_COL_ID, msg.userId).catch(() => null)
        if (doc) setStudentsById((prev) => ({ ...prev, [doc.$id]: doc as unknown as UserProfileDoc }))
      }

      // prefill reply
      const student = studentsById[msg.userId]
      const defaultReply = `Hello ${student?.fullName ?? "student"},\n\nWe received your message about ${msg.subject}.\nWe'll review your request and get back to you shortly.\n\n— Cashier`
      setReplyText(msg.responseMessage ?? defaultReply)
      setReplyFile(null)

      setSelectedMessage(updatedFromServer ?? { ...msg, status: "read" as any })
    } catch (e: any) {
      toast.error("Unable to open message", { description: e?.message ?? "Please try again." })
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
      toast.error("Reply cannot be empty")
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
      toast.success("Reply sent", {
        description: uploaded?.fileId ? "Receipt attached for the student." : "The student can now see your response.",
      })
    } catch (e: any) {
      toast.error("Failed to send reply", { description: e?.message ?? "Please try again." })
    } finally {
      setSendingReply(false)
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
                <div className="w-[150px]">
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
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-[180px]">
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
              <CardDescription className="text-gray-300">Verify and issue receipts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingOnlinePayments.map((p) => (
                  <div
                    key={p.$id}
                    className="flex items-center justify-between rounded-lg border border-slate-700 p-3"
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
                    <div className="flex items-center gap-2">
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
                      >
                        {verifyingRowId === p.$id ? (
                          <span className="flex items-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying…
                          </span>
                        ) : (
                          "Verify & Issue Receipt"
                        )}
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
                  Read and reply to student messages. {messagesLoading ? "Loading…" : `(${messages.length})`}
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
                                  <Button size="sm" variant="outline" className="border-slate-600 text-white hover:bg-slate-700" onClick={() => openMessage(m)} title="Open and reply">
                                    <Reply className="mr-2 h-4 w-4" /> Open
                                  </Button>
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

        {/* Receipt Dialog (view + verify) — medium height & scrollable */}
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
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          This payment is still <b>Pending</b>. Verify to mark as Completed and send the receipt to the student.
                        </div>
                        <Button onClick={verifyFromDialog} disabled={verifying}>
                          {verifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Verify & Issue Receipt
                        </Button>
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

                  {/* Actions: Download PNG + (optional) server file */}
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      className="border-slate-600"
                      onClick={downloadReceiptPng}
                      title="Download this receipt as PNG"
                    >
                      Download PNG
                    </Button>

                    {receiptData.downloadUrl ? (
                      <a
                        href={receiptData.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex"
                        title="Open/download the original receipt file"
                      >
                        <Button variant="outline" className="border-slate-600">
                          <FileText className="mr-2 h-4 w-4" />
                          Open Original
                        </Button>
                      </a>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Message View/Reply Dialog — responsive width & vertical scroll + attachment */}
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

                    {/* If a previous reply had an attachment, show it too */}
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
            <div className="px-5 py-4 border-t border-slate-700 bg-slate-800 flex justify-end gap-2">
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
                        {t.status === "Pending" && (
                          <span className="inline-flex rounded-full bg-yellow-500/20 px-2 py-1 text-xs font-medium text-yellow-300">
                            Pending
                          </span>
                        )}
                        {(t.status === "Completed" || t.status === "Succeeded") && (
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
                        ) : t.status === "Pending" && !["cash", "card"].includes((t.method || "").toLowerCase()) ? (
                          // Offer inline verify for pending online items even in table
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
