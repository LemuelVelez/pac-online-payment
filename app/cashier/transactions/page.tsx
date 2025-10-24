/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { PaymentReceipt } from "@/components/payment/payment-receipt"
import { DateRangePicker } from "@/components/admin/date-range-picker"
import { Search, RefreshCw, Filter, Eye, Loader2, Reply, Paperclip } from "lucide-react"
import { getDatabases, getEnvIds, Query, getStorage, getCurrentUserSafe } from "@/lib/appwrite"
import type { PaymentDoc } from "@/lib/appwrite-payments"
import type { UserProfileDoc } from "@/lib/appwrite-cashier"
import { toast } from "sonner"
import {
  listMessagesForCashier,
  markMessageRead,
  replyToMessage,
  type MessageDoc,
} from "@/lib/appwrite-messages"

type ReceiptData = {
  receiptNumber: string
  date: string
  studentId: string
  studentName: string
  paymentMethod: string
  items: { description: string; amount: string }[]
  total: string
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

export default function CashierTransactionsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all")
  const [loading, setLoading] = useState(false)

  const [allPayments, setAllPayments] = useState<PaymentDoc[]>([])
  const [studentsById, setStudentsById] = useState<Record<string, UserProfileDoc>>({})

  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)

  // messages state
  const [meId, setMeId] = useState<string>("")
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [messages, setMessages] = useState<MessageDoc[]>([])
  const [selectedMessage, setSelectedMessage] = useState<MessageDoc | null>(null)
  const [replyText, setReplyText] = useState("")
  const [sendingReply, setSendingReply] = useState(false)

  /* ================= Loaders ================= */

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { DB_ID, USERS_COL_ID } = getEnvIds()
      const PAYMENTS_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_PAYMENTS_COLLECTION_ID as string | undefined

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
    ;(async () => {
      const me = await getCurrentUserSafe()
      if (me) setMeId(me.$id)
    })()
  }, [])

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

  /* ================= Receipt view ================= */

  const handleViewReceipt = async (payment: PaymentDoc) => {
    setIsReceiptDialogOpen(true)
    setReceiptData(null)
    toast.info("Preparing receipt…")

    try {
      const { DB_ID, USERS_COL_ID } = getEnvIds()
      const RECEIPTS_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_RECEIPTS_COLLECTION_ID as string | undefined
      const RECEIPT_ITEMS_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_RECEIPT_ITEMS_COLLECTION_ID as string | undefined

      if (!DB_ID || !USERS_COL_ID || !RECEIPTS_COL_ID) {
        throw new Error("Missing Appwrite IDs for receipts. Set NEXT_PUBLIC_* env vars accordingly.")
      }

      const db = getDatabases()

      // ensure student profile
      let student = studentsById[payment.userId]
      if (!student && payment.userId) {
        const userRes = await db.getDocument<UserProfileDoc>(DB_ID, USERS_COL_ID, payment.userId).catch(() => null)
        if (userRes) student = userRes as unknown as UserProfileDoc
      }

      // find receipt for this payment
      const rres = await db
        .listDocuments<any>(DB_ID, RECEIPTS_COL_ID, [Query.equal("paymentId", payment.$id), Query.limit(1)])
        .catch(() => null)
      const rec = rres?.documents?.[0]

      if (rec) {
        // fetch line items
        let lineItems: { description: string; amount: string }[] = []
        if (RECEIPT_ITEMS_COL_ID) {
          const itemsRes = await db
            .listDocuments<any>(DB_ID, RECEIPT_ITEMS_COL_ID, [Query.equal("receiptRef", rec.$id), Query.limit(100)])
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
          receiptNumber: rec.$id,
          date: new Date(rec.issuedAt ?? payment.$createdAt).toISOString().split("T")[0],
          studentId: student?.studentId ?? student?.$id ?? "—",
          studentName: student?.fullName ?? "—",
          paymentMethod: rec.method ?? methodLabel(payment.method),
          items: lineItems.length ? lineItems : [],
          total: `₱${Number(rec.total || payment.amount || 0).toLocaleString()}`,
        })
        return
      }

      // fallback from payment
      const amount = Number(payment.amount) || 0
      const fees = Array.isArray(payment.fees) && payment.fees.length ? payment.fees : ["miscellaneous"]
      const share = fees.length ? amount / fees.length : amount
      setReceiptData({
        receiptNumber: payment.reference || payment.$id,
        date: new Date(payment.$createdAt).toISOString().split("T")[0],
        studentId: student?.studentId ?? student?.$id ?? "—",
        studentName: student?.fullName ?? "—",
        paymentMethod: methodLabel(payment.method),
        items: fees.map((f) => ({ description: f[0].toUpperCase() + f.slice(1), amount: `₱${Number(share).toLocaleString()}` })),
        total: `₱${amount.toLocaleString()}`,
      })
    } catch (e: any) {
      toast.error("Unable to open receipt", { description: e?.message ?? "Please try again." })
    }
  }

  const renderTable = (rows: PaymentDoc[]) => (
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
                const desc = Array.isArray(t.fees) && t.fees.length > 0 ? `Fees: ${t.fees.join(", ")}` : t.planId ? "Fee Plan Payment" : "Payment"
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
                      {t.status === "Pending" && <span className="inline-flex rounded-full bg-yellow-500/20 px-2 py-1 text-xs font-medium text-yellow-300">Pending</span>}
                      {(t.status === "Completed" || t.status === "Succeeded") && (
                        <span className="inline-flex rounded-full bg-green-500/20 px-2 py-1 text-xs font-medium text-green-300">Completed</span>
                      )}
                      {(t.status === "Failed" || t.status === "Cancelled") && (
                        <span className="inline-flex rounded-full bg-red-500/20 px-2 py-1 text-xs font-medium text-red-300">{t.status}</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-slate-600 text-white hover:bg-slate-700"
                        onClick={() => handleViewReceipt(t)}
                        title="View receipt"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
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
  )

  /* ================= Messages ================= */

  const openMessage = async (msg: MessageDoc) => {
    try {
      const me = (await getCurrentUserSafe())!
      const cashierId = me.$id

      // Try to persist "read" in DB; if it fails, keep local state so it won't flip back
      let updatedFromServer: MessageDoc | null = null
      try {
        updatedFromServer = await markMessageRead(msg.$id)
      } catch (e: any) {
        toast.warning("Couldn’t mark as read on server", { description: e?.message ?? "Using local state instead." })
      }

      // Update local read set to prevent reverting to "new" on refresh
      const set = getLocalReadSet(cashierId)
      set.add(msg.$id)
      saveLocalReadSet(cashierId, set)

      // Update UI immediately
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

  const sendReply = async () => {
    if (!selectedMessage) return
    if (!replyText.trim()) {
      toast.error("Reply cannot be empty")
      return
    }
    setSendingReply(true)
    try {
      const updated = await replyToMessage(selectedMessage.$id, replyText.trim())
      // Persist reply and reflect in UI
      setMessages((prev) => prev.map((m) => (m.$id === updated.$id ? updated : m)))
      setSelectedMessage(updated)
      toast.success("Reply sent", { description: "The student can now see your response." })
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

        {/* Receipt Dialog */}
        <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader className="sr-only">
              <DialogTitle>Payment Receipt</DialogTitle>
              <DialogDescription>Details of the selected payment receipt.</DialogDescription>
            </DialogHeader>

            {!receiptData ? (
              <div className="flex items-center justify-center py-12 text-gray-300">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Preparing receipt…
              </div>
            ) : (
              <PaymentReceipt
                receiptNumber={receiptData.receiptNumber}
                date={receiptData.date}
                studentId={receiptData.studentId}
                studentName={receiptData.studentName}
                paymentMethod={receiptData.paymentMethod}
                items={receiptData.items}
                total={receiptData.total}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Message View/Reply Dialog — responsive width & vertical scroll */}
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
                      className="min-h-[120px] w-full rounded-md border border-slate-700 bg-slate-900 p-3 text-sm text-gray-100 outline-none focus:ring-2 focus:ring-primary/60"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply here…"
                    />
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
}
