/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useMemo, useState, useCallback, useRef } from "react"
import Link from "next/link"
import {
  CalendarIcon,
  FileText,
  Loader2,
  RefreshCw,
  CheckCircle,
  Paperclip,
  Send,
  AlertCircle,
  Mail,
  Eye,
  Pencil,
  Trash2,
  Save,
} from "lucide-react"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

import {
  getCurrentUserSafe,
  getDatabases,
  getEnvIds,
  getStorage,
  ID,
  Query,
} from "@/lib/appwrite"
import { listRecentPayments, type PaymentDoc } from "@/lib/appwrite-payments"
import type { Models } from "appwrite"
import { toast } from "sonner"
import { createMessage, listMessagesForUser, type MessageDoc } from "@/lib/appwrite-messages"
import { PaymentReceipt } from "@/components/payment/payment-receipt"
import { getFeePlan, type FeePlanDoc, computeTotals } from "@/lib/fee-plan"
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

type PaymentWithExtras = PaymentDoc & {
  receiptUrl?: string | null
  receiptLink?: string | null

  // legacy request flags (left for backward-compat display if ever present)
  receiptRequestStatus?: "Queued" | "Pending" | "Sent" | "Completed" | "Cancelled" | string | null
  receiptRequestTo?: string | null
  receiptRequestToName?: string | null
  receiptRequestMessage?: string | null
  receiptRequestedAt?: string | null

  receiptProofBucketId?: string | null
  receiptProofFileId?: string | null
  receiptProofFileName?: string | null
}

type UserProfileDoc = Models.Document & {
  fullName?: string
  email?: string
  role?: string
  studentId?: string
}

const COMPLETED_STATES = new Set<PaymentDoc["status"]>(["Completed", "Succeeded"])
const PROOF_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_RECEIPT_PROOF_BUCKET_ID as string | undefined
const MESSAGES_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID as string | undefined
const RECEIPTS_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_RECEIPTS_COLLECTION_ID as string | undefined
const RECEIPT_ITEMS_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_RECEIPT_ITEMS_COLLECTION_ID as string | undefined

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

function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" })
}

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

export default function PaymentHistoryPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [notice, setNotice] = useState<string>("")
  const [payments, setPayments] = useState<PaymentWithExtras[]>([])

  const [cashiers, setCashiers] = useState<UserProfileDoc[]>([])
  const [cashiersLoading, setCashiersLoading] = useState(true)

  const [askDialogFor, setAskDialogFor] = useState<PaymentWithExtras | null>(null)
  const [selectedCashierId, setSelectedCashierId] = useState<string>("")
  const [message, setMessage] = useState<string>("")
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [sending, setSending] = useState(false)

  // NEW: messages from cashier
  const [msgsLoading, setMsgsLoading] = useState(true)
  const [myMessages, setMyMessages] = useState<MessageDoc[]>([])

  // NEW: edit/delete state for student's own messages
  const [editMsg, setEditMsg] = useState<MessageDoc | null>(null)
  const [editSubject, setEditSubject] = useState("")
  const [editBody, setEditBody] = useState("")
  const [savingEdit, setSavingEdit] = useState(false)

  const [deleteMsg, setDeleteMsg] = useState<MessageDoc | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Receipt dialog (student view)
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const receiptRef = useRef<HTMLDivElement>(null)

  // Prefetched receipts mapping (paymentId -> receiptId)
  const [receiptsByPaymentId, setReceiptsByPaymentId] = useState<Record<string, string>>({})

  // Current student's profile (for name/id on receipt)
  const [meProfile, setMeProfile] = useState<UserProfileDoc | null>(null)

  const totalPaid = useMemo(
    () =>
      payments
        .filter((p) => COMPLETED_STATES.has(p.status))
        .reduce((s, p) => s + (Number(p.amount) || 0), 0),
    [payments]
  )

  const loadPayments = async (opts?: { silent?: boolean }) => {
    setLoading(true)
    setError("")
    try {
      const me = await getCurrentUserSafe()
      if (!me) {
        const msg = "You need to sign in to view your payment history."
        setError(msg)
        setPayments([])
        toast.error("Not signed in", { description: msg })
        return
      }
      const docs = await listRecentPayments(me.$id, 100)
      setPayments(docs as PaymentWithExtras[])

      // Prefetch which of these have a receipt doc
      if (RECEIPTS_COL_ID) {
        const { DB_ID } = getEnvIds()
        const db = getDatabases()
        const ids = docs.map((d) => d.$id)
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

      if (!opts?.silent) {
        toast.success("Payments refreshed", { description: `${docs.length} record(s) loaded` })
      }
    } catch (e: any) {
      const msg = e?.message ?? "Failed to load payment history."
      setError(msg)
      toast.error("Failed to load payments", { description: msg })
    } finally {
      setLoading(false)
    }
  }

  const loadCashiers = async () => {
    setCashiersLoading(true)
    try {
      const { DB_ID, USERS_COL_ID } = getEnvIds()
      const db = getDatabases()
      const res = await db.listDocuments<UserProfileDoc>({
        databaseId: DB_ID,
        collectionId: USERS_COL_ID,
        queries: [Query.equal("role", ["cashier", "business-office", "business_office", "businessoffice"]), Query.limit(100)],
      })
      setCashiers((res.documents as unknown as UserProfileDoc[]) ?? [])
    } catch (e: any) {
      setCashiers([])
      toast.error("Failed to load cashiers", { description: e?.message ?? "Please try again." })
    } finally {
      setCashiersLoading(false)
    }
  }

  const loadMyProfile = async () => {
    try {
      const me = await getCurrentUserSafe()
      if (!me) return
      const { DB_ID, USERS_COL_ID } = getEnvIds()
      const db = getDatabases()
      const doc = await db.getDocument<UserProfileDoc>({ databaseId: DB_ID, collectionId: USERS_COL_ID, documentId: me.$id })
      setMeProfile(doc)
    } catch {
      setMeProfile(null)
    }
  }

  const loadMyMessages = async (opts?: { silent?: boolean }) => {
    setMsgsLoading(true)
    try {
      const me = await getCurrentUserSafe()
      if (!me) throw new Error("Not signed in.")
      const docs = await listMessagesForUser(me.$id, 200)
      setMyMessages(docs)
      if (!opts?.silent) {
        const replied = docs.filter((d) => (d.status ?? "").toLowerCase() === "replied").length
        toast.success("Messages refreshed", { description: `${docs.length} total • ${replied} replied` })
      }
    } catch (e: any) {
      toast.error("Failed to load messages", { description: e?.message ?? "Please try again." })
    } finally {
      setMsgsLoading(false)
    }
  }

  useEffect(() => {
    loadPayments({ silent: true })
    loadCashiers()
    loadMyMessages({ silent: true })
    loadMyProfile()
  }, [])

  // Include Student ID in the prefilled message
  useEffect(() => {
    if (!askDialogFor) return
    const p = askDialogFor
    const studentId = meProfile?.studentId ?? meProfile?.$id ?? "—"
    const prefilled = `Hello Cashier Team,

May I request the official receipt for my payment?

• Student ID: ${studentId}
• Reference: ${p.reference || p.$id}
• Date: ${formatDate(p.$createdAt)}
• Amount: ${peso(p.amount)}
• Method: ${p.method}

Thank you!`
    setMessage(prefilled)
    setSelectedCashierId("")
    setProofFile(null)
  }, [askDialogFor, meProfile])

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setProofFile(f)
    toast.success("Attachment added", { description: f.name })
  }

  const handleSend = async () => {
    if (!MESSAGES_COL_ID) {
      toast.error("Messages collection not configured", { description: "Set NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID" })
      return
    }
    if (!askDialogFor) return
    if (!selectedCashierId) {
      toast.error("Please choose a cashier")
      return
    }
    if (!PROOF_BUCKET_ID) {
      toast.error("Upload bucket not configured", {
        description: "Set NEXT_PUBLIC_APPWRITE_RECEIPT_PROOF_BUCKET_ID in your environment.",
      })
      return
    }

    setSending(true)
    try {
      const me = await getCurrentUserSafe()
      if (!me) throw new Error("Not signed in.")

      let uploaded:
        | { bucketId: string; fileId: string; fileName: string }
        | null = null

      if (proofFile) {
        const storage = getStorage()
        const created: any = await storage.createFile(PROOF_BUCKET_ID, ID.unique(), proofFile)
        uploaded = { bucketId: PROOF_BUCKET_ID, fileId: created?.$id, fileName: proofFile.name }
      } else {
        uploaded = { bucketId: "", fileId: "", fileName: "" }
      }

      await createMessage({
        userId: me.$id,
        cashierId: selectedCashierId,
        paymentId: askDialogFor.$id,
        subject: `Receipt request: ${askDialogFor.reference || askDialogFor.$id}`,
        message,
        proofBucketId: uploaded.bucketId,
        proofFileId: uploaded.fileId,
        proofFileName: uploaded.fileName,
      })

      setAskDialogFor(null)
      const msg = "Your message was sent to the cashier."
      setNotice(msg)
      toast.success("Message sent", { description: msg })
      setTimeout(() => setNotice(""), 5000)
      loadMyMessages({ silent: true })
    } catch (e: any) {
      toast.error("Failed to send message", { description: e?.message ?? "Please try again." })
    } finally {
      setSending(false)
    }
  }

  /* ====== NEW: edit/delete message handlers (student side) ====== */

  const openEditMyMessage = (m: MessageDoc) => {
    setEditMsg(m)
    setEditSubject(m.subject || "")
    setEditBody(m.message || "")
  }

  const saveMyMessage = async () => {
    if (!editMsg) return
    if (!editSubject.trim() || !editBody.trim()) {
      toast.error("Subject and message are required")
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
      setMyMessages((prev) => prev.map((x) => (x.$id === editMsg.$id ? updated : x)))
      toast.success("Message updated")
      setEditMsg(null)
    } catch (e: any) {
      toast.error("Failed to update", { description: e?.message ?? "Please try again." })
    } finally {
      setSavingEdit(false)
    }
  }

  const confirmDeleteMyMessage = async () => {
    if (!deleteMsg) return
    setDeleting(true)
    try {
      const { DB_ID } = getEnvIds()
      if (!DB_ID || !MESSAGES_COL_ID) throw new Error("Messages collection not configured.")
      const db = getDatabases()
      await db.deleteDocument(DB_ID, MESSAGES_COL_ID, deleteMsg.$id)
      setMyMessages((prev) => prev.filter((x) => x.$id !== deleteMsg.$id))
      toast.success("Message deleted")
      setDeleteMsg(null)
    } catch (e: any) {
      toast.error("Failed to delete", { description: e?.message ?? "Please try again." })
    } finally {
      setDeleting(false)
    }
  }

  /* ============== Receipt dialog (student) ============== */

  const buildSummaryAndPlan = (payment: PaymentWithExtras, feePlan?: FeePlanDoc | null) => {
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
      payments
        .filter((p) => p.userId === payment.userId && COMPLETED_STATES.has(p.status))
        .reduce((s, p) => s + (Number(p.amount) || 0), 0) - (COMPLETED_STATES.has(payment.status) ? amountPaidNow : 0)
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

  const handleViewReceipt = async (payment: PaymentWithExtras) => {
    setIsReceiptDialogOpen(true)
    setReceiptData(null)

    try {
      const { DB_ID } = getEnvIds()
      const db = getDatabases()

      // try to fetch fee plan
      let feePlanDoc: FeePlanDoc | null = null
      if (payment.planId) {
        try {
          feePlanDoc = await getFeePlan(payment.planId)
        } catch {
          feePlanDoc = null
        }
      }
      const { plan, summary } = buildSummaryAndPlan(payment, feePlanDoc)

      // try to find the receipt record for this payment
      let rec: any | null = null
      if (RECEIPTS_COL_ID) {
        const rres = await db
          .listDocuments<any>(DB_ID, RECEIPTS_COL_ID, [Query.equal("paymentId", payment.$id), Query.limit(1)])
          .catch(() => null)
        rec = rres?.documents?.[0] ?? null
      }

      // fetch line items if we have a receipt
      let lineItems: { description: string; amount: string }[] = []
      if (rec && RECEIPT_ITEMS_COL_ID) {
        const itemsRes = await db
          .listDocuments<any>(DB_ID, RECEIPT_ITEMS_COL_ID, [Query.equal("receipts", rec.$id), Query.limit(100)])
          .catch(() => null)
        lineItems = (itemsRes?.documents ?? []).map((i: any) => {
          const qty = Number(i.quantity ?? 1) || 1
          const subtotal = Number(i.amount || 0) * qty
          return {
            description: qty > 1 ? `${i.label} × ${qty}` : i.label,
            amount: `₱${subtotal.toLocaleString()}`,
          }
        })
      }

      setReceiptData({
        receiptNumber: (rec?.$id as string) || (payment.reference || payment.$id),
        date: new Date((rec?.issuedAt as string) || payment.$createdAt).toISOString().split("T")[0],
        studentId: meProfile?.studentId ?? meProfile?.$id ?? "—",
        studentName: meProfile?.fullName ?? "—",
        paymentMethod: methodLabel(rec?.method || payment.method),
        items: lineItems.length ? lineItems : undefined,
        total: `₱${Number((rec?.total as number) || payment.amount || 0).toLocaleString()}`,
        downloadUrl: payment.receiptUrl || payment.receiptLink || null,
        plan,
        summary,
      })
    } catch (e: any) {
      toast.error("Unable to open receipt", { description: e?.message ?? "Please try again." })
    }
  }

  const downloadReceiptPng = useCallback(async () => {
    if (!receiptRef.current || !receiptData) {
      toast.error("Nothing to download yet.")
      return
    }
    try {
      const { toPng } = await import("html-to-image")
      const dataUrl = await toPng(receiptRef.current, {
        cacheBust: true,
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      })
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

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Payment History</h1>
            <p className="text-gray-300">View your payments and download receipts</p>
          </div>
          <Button
            variant="outline"
            className="border-slate-600"
            onClick={() => {
              loadPayments()
              loadMyMessages({ silent: true })
            }}
            disabled={loading}
            title="Refresh your payment list & messages"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        </div>

        {error ? (
          <Alert className="mb-6 bg-red-500/20 border-red-500/50 text-red-200">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {notice ? (
          <Alert className="mb-6 bg-green-500/20 border-green-500/50 text-green-200">
            <AlertDescription className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" /> {notice}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-800/60 text-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/50 text-left text-sm font-medium text-gray-300">
                  <th className="px-6 py-3">Reference</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-300">
                      <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                      Loading your payments…
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-300">
                      No payments yet.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => {
                    const completed = COMPLETED_STATES.has(p.status)
                    const receiptUrl = (p.receiptUrl || p.receiptLink) ?? null
                    const hasReceiptDoc = !!receiptsByPaymentId[p.$id]

                    const desc =
                      Array.isArray(p.fees) && p.fees.length > 0
                        ? `Fees: ${p.fees.join(", ")}`
                        : p.planId
                          ? "Fee Plan Payment"
                          : "Payment"

                    return (
                      <tr key={p.$id} className="text-sm text-gray-2 00">
                        <td className="whitespace-nowrap px-6 py-4 font-medium">{p.reference || p.$id}</td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                            {formatDate(p.$createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span>{desc}</span>
                            <span className="text-xs text-gray-400">Method: {methodLabel(p.method)}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right font-semibold">{peso(p.amount)}</td>
                        <td className="whitespace-nowrap px-6 py-4">
                          {p.status === "Pending" && (
                            <span className="inline-flex rounded-full bg-yellow-500/20 px-2 py-1 text-xs font-medium text-yellow-300">
                              Pending
                            </span>
                          )}
                          {(p.status === "Completed" || p.status === "Succeeded") && (
                            <span className="inline-flex rounded-full bg-green-500/20 px-2 py-1 text-xs font-medium text-green-300">
                              Completed
                            </span>
                          )}
                          {(p.status === "Failed" || p.status === "Cancelled") && (
                            <span className="inline-flex rounded-full bg-red-500/20 px-2 py-1 text-xs font-medium text-red-300">
                              {p.status}
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex flex-wrap gap-2 items-center">
                            {/* If PENDING → Ask Cashier for Receipt */}
                            {p.status === "Pending" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-slate-600"
                                onClick={() => setAskDialogFor(p)}
                              >
                                Ask Cashier for Receipt
                              </Button>
                            ) : null}

                            {/* If COMPLETED/SUCCEEDED → View Receipt */}
                            {completed ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-slate-600"
                                onClick={() => handleViewReceipt(p)}
                                title={
                                  hasReceiptDoc
                                    ? "View receipt with fee plan & balance"
                                    : "View payment details and summary"
                                }
                              >
                                <Eye className="mr-1 h-4 w-4" />
                                View Receipt
                              </Button>
                            ) : null}

                            {/* Optional: keep original download link if provided on the payment */}
                            {completed && receiptUrl ? (
                              <a
                                href={receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-blue-300 hover:text-blue-200 text-sm"
                                onClick={() => toast.info("Opening receipt…")}
                              >
                                <FileText className="mr-1 h-4 w-4" />
                                Download
                              </a>
                            ) : null}

                            {/* If neither applies (e.g., Failed/Cancelled) show dash */}
                            {!completed && p.status !== "Pending" ? (
                              <span className="text-gray-400 text-xs">—</span>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
              {!loading && payments.length > 0 && (
                <tfoot>
                  <tr className="border-t border-slate-700 bg-slate-900/40 text-sm">
                    <td className="px-6 py-3 font-medium text-gray-300" colSpan={3}>
                      Total Completed Payments
                    </td>
                    <td className="px-6 py-3 text-right font-semibold">{peso(totalPaid)}</td>
                    <td className="px-6 py-3" colSpan={2} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* NEW: Replies & receipts from cashier + student controls */}
        <div className="mt-10">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
            <Mail className="h-5 w-5" /> Messages from Cashier
          </h2>
          <div className="rounded-lg border border-slate-700 bg-slate-800/60 text-white">
            {msgsLoading ? (
              <div className="px-6 py-8 text-center text-gray-300">
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                Loading messages…
              </div>
            ) : myMessages.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-300">No messages yet.</div>
            ) : (
              <div className="divide-y divide-slate-700">
                {myMessages.map((m) => {
                  const replied = (m.status ?? "").toLowerCase() === "replied"
                  const storage = getStorage()
                  const respUrl =
                    m.responseBucketId && m.responseFileId
                      ? ((storage.getFileView(m.responseBucketId, m.responseFileId) as unknown as string) || null)
                      : null
                  return (
                    <div key={m.$id} className="px-6 py-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="font-medium">{m.subject}</div>
                            <div className="text-xs text-gray-400">{formatDate(m.$createdAt)}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-slate-600 cursor-pointer"
                            onClick={() => openEditMyMessage(m)}
                            title="Edit your message"
                          >
                            <Pencil className="mr-1 h-4 w-4" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeleteMsg(m)}
                            title="Delete this message"
                            className="cursor-pointer"
                          >
                            <Trash2 className="mr-1 h-4 w-4" /> Delete
                          </Button>
                        </div>
                      </div>

                      <div className="mt-2 text-sm text-gray-200 whitespace-pre-wrap">{m.message}</div>

                      {replied ? (
                        <div className="mt-3 rounded-md border border-emerald-700/40 bg-emerald-900/20 p-3">
                          <div className="text-xs uppercase tracking-wide text-emerald-300">Cashier reply</div>
                          <div className="mt-1 text-sm whitespace-pre-wrap">{m.responseMessage || "—"}</div>
                          {respUrl ? (
                            <a
                              href={respUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center text-emerald-300 hover:text-emerald-200 text-sm"
                            >
                              <Paperclip className="mr-2 h-4 w-4" />
                              {m.responseFileName || "Receipt attachment"}
                            </a>
                          ) : null}
                          <div className="mt-1 text-xs text-gray-400">
                            {m.respondedAt ? `Responded: ${new Date(m.respondedAt).toLocaleString()}` : "Responded"}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 text-xs text-gray-400">Status: {m.status ?? "new"}</div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Link href="/dashboard">
            <Button variant="outline" className="border-slate-600">
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Send-to-Cashier Dialog -> writes to messages table */}
        <Dialog open={!!askDialogFor} onOpenChange={(o) => !o && setAskDialogFor(null)}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>Send message to cashier</DialogTitle>
              <DialogDescription className="text-gray-300">
                Choose a cashier, (optionally) attach a proof file, and send your request.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-2 space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-200">Cashier</Label>
                {cashiersLoading ? (
                  <div className="inline-flex items-center text-sm text-gray-300">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading cashiers…
                  </div>
                ) : cashiers.length === 0 ? (
                  <div className="text-sm text-amber-200 inline-flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    No cashier accounts found. (role: <code>cashier</code>)
                  </div>
                ) : (
                  <Select value={selectedCashierId} onValueChange={(v) => setSelectedCashierId(v)}>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue placeholder="Select a cashier…" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      {cashiers.map((c) => (
                        <SelectItem key={c.$id} value={c.$id} className="cursor-pointer">
                          {(c.fullName || c.email || "Cashier") + (c.email && c.fullName ? ` — ${c.email}` : "")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="msg" className="text-gray-200">
                  Message
                </Label>
                <textarea
                  id="msg"
                  className="min-h-[140px] w-full rounded-md border border-slate-700 bg-slate-900 p-3 text-sm text-gray-100 outline-none focus:ring-2 focus:ring-primary/60"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-200">Attach proof (PDF or image)</Label>
                {!PROOF_BUCKET_ID ? (
                  <div className="text-sm text-amber-200 inline-flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Missing <code>NEXT_PUBLIC_APPWRITE_RECEIPT_PROOF_BUCKET_ID</code> in env. Upload will fail.
                  </div>
                ) : null}
                <div className="flex items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-600 bg-slate-700/40 px-3 py-2 text-sm hover:bg-slate-700/70">
                    <Paperclip className="h-4 w-4" />
                    <span>{proofFile ? "Replace file" : "Choose file"}</span>
                    <input type="file" accept="application/pdf,image/*" className="hidden" onChange={handleFilePick} />
                  </label>
                  {proofFile ? (
                    <span className="text-xs text-gray-300 truncate max-w:[60%]">
                      {proofFile.name} • {(proofFile.size / 1024).toFixed(0)} KB
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">Optional attachment.</span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" className="border-slate-600" onClick={() => setAskDialogFor(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSend} disabled={sending || cashiersLoading || cashiers.length === 0} className="cursor-pointer">
                  {sending ? (
                    <span className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending…
                    </span>
                  ) : (
                    <span className="flex items-center">
                      Send message <Send className="ml-2 h-4 w-4" />
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* NEW: Edit My Message dialog */}
        <Dialog open={!!editMsg} onOpenChange={(o) => !o && setEditMsg(null)}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>Edit your message</DialogTitle>
              <DialogDescription className="text-gray-300">
                Update the subject and contents of your message to the cashier.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-gray-200">Subject</Label>
                <input
                  className="w-full rounded-md border border-slate-700 bg-slate-900 p-2 text-sm text-gray-100 outline-none focus:ring-2 focus:ring-primary/60"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-gray-200">Message</Label>
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
              <Button onClick={saveMyMessage} disabled={savingEdit || !editSubject.trim() || !editBody.trim()}>
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

        {/* NEW: Delete confirmation */}
        <AlertDialog open={!!deleteMsg} onOpenChange={(o) => !o && setDeleteMsg(null)}>
          <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this message?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-300">
                This action cannot be undone. The message <b>{deleteMsg?.subject}</b> will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-slate-600">Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={confirmDeleteMyMessage}
                disabled={deleting}
              >
                {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* View Receipt dialog (with plan & summary) */}
        <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
          <DialogContent
            className="
              bg-slate-800 border-slate-700 text-white
              p-0
              w-[95vw] sm:w-auto
              max-w-[95vw] sm:max-w-[90vw] md:max-w-[720px] lg:max-w-[820px]
              max-h-[70vh]
              overflow-hidden
              flex flex-col
            "
          >
            <DialogHeader className="px-5 pt-5 pb-3">
              <DialogTitle>Your Receipt</DialogTitle>
              <DialogDescription className="text-gray-300">
                View details of your payment, fee plan, and current balance.
              </DialogDescription>
            </DialogHeader>

            <div className="px-5 pb-5 overflow-y-auto flex-1">
              {!receiptData ? (
                <div className="flex items-center justify-center py-12 text-gray-300">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Preparing receipt…
                </div>
              ) : (
                <>
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
      </div>
    </DashboardLayout>
  )
}
