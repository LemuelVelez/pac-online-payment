/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useMemo, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { PaymentReceipt } from "@/components/payment/payment-receipt"
import { DateRangePicker } from "@/components/admin/date-range-picker"
import { Search, Download, Filter, Eye, Loader2 } from "lucide-react"
import { getDatabases, getEnvIds, Query } from "@/lib/appwrite"
import type { PaymentDoc } from "@/lib/appwrite-payments"
import type { UserProfileDoc } from "@/lib/appwrite-cashier"
import { toast } from "sonner"

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

export default function CashierTransactionsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all")
  const [loading, setLoading] = useState(false)

  const [allPayments, setAllPayments] = useState<PaymentDoc[]>([])
  const [studentsById, setStudentsById] = useState<Record<string, UserProfileDoc>>({})

  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const { DB_ID, USERS_COL_ID } = getEnvIds()
      const PAYMENTS_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_PAYMENTS_COLLECTION_ID as string
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
  }

  useEffect(() => {
    load()
  }, [])

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

  // Over-the-counter payments recorded by cashiers use method "cash" or "card"
  const myLikeTransactions = useMemo(
    () => filteredTransactions.filter((t) => ["cash", "card"].includes((t.method || "").toLowerCase())),
    [filteredTransactions]
  )

  const handleViewReceipt = async (payment: PaymentDoc) => {
    setIsReceiptDialogOpen(true)
    setReceiptData(null)
    toast.info("Preparing receipt…")

    try {
      const { DB_ID } = getEnvIds()
      const RECEIPTS_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_RECEIPTS_COLLECTION_ID as string
      const USERS_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID as string
      const db = getDatabases()

      // fetch student (ensure we have the freshest)
      let student = studentsById[payment.userId]
      if (!student) {
        const userRes = await db.getDocument<UserProfileDoc>(DB_ID, USERS_COL_ID, payment.userId).catch(() => null)
        if (userRes) student = userRes as unknown as UserProfileDoc
      }

      // try to find an issued receipt for this payment
      const rres = await db
        .listDocuments<any>(DB_ID, RECEIPTS_COL_ID, [Query.equal("paymentId", payment.$id), Query.limit(1)])
        .catch(() => null)
      const rec = rres?.documents?.[0]

      if (rec) {
        setReceiptData({
          receiptNumber: rec.$id,
          date: new Date(rec.issuedAt ?? payment.$createdAt).toISOString().split("T")[0],
          studentId: student?.studentId ?? student?.$id ?? "—",
          studentName: student?.fullName ?? "—",
          paymentMethod: rec.method ?? methodLabel(payment.method),
          items: (rec.items ?? []).map((i: any) => ({
            description: i.label,
            amount: `₱${Number(i.amount || 0).toLocaleString()}`,
          })),
          total: `₱${Number(rec.total || payment.amount || 0).toLocaleString()}`,
        })
        return
      }

      // fallback: synthesize from payment
      const amount = Number(payment.amount) || 0
      const fees = Array.isArray(payment.fees) && payment.fees.length ? payment.fees : ["miscellaneous"]
      const share = fees.length ? amount / fees.length : amount
      setReceiptData({
        receiptNumber: payment.reference || payment.$id,
        date: new Date(payment.$createdAt).toISOString().split("T")[0],
        studentId: student?.studentId ?? student?.$id ?? "—",
        studentName: student?.fullName ?? "—",
        paymentMethod: methodLabel(payment.method),
        items: fees.map((f) => ({
          description: f[0].toUpperCase() + f.slice(1),
          amount: `₱${Number(share).toLocaleString()}`,
        })),
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
                <td colSpan={8} className="px-6 py-8 text-center text-gray-300">
                  No transactions found.
                </td>
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

                return (
                  <tr key={t.$id} className="text-sm">
                    <td className="whitespace-nowrap px-6 py-4 font-medium">{t.reference || t.$id}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {new Date(t.$createdAt).toLocaleString()}
                    </td>
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
              <Download className="mr-2 h-4 w-4" />
              {loading ? "Loading…" : "Reload"}
            </Button>
          </div>
        </div>

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

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-slate-800 border-slate-700 mb-8 grid w-full grid-cols-3 lg:max-w-[600px]">
            <TabsTrigger value="all" className="cursor-pointer">
              All Transactions
            </TabsTrigger>
            <TabsTrigger value="today" className="cursor-pointer">
              Today
            </TabsTrigger>
            <TabsTrigger value="my-transactions" className="cursor-pointer">
              Over-the-Counter
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <Card className="bg-slate-800/60 border-slate-700 text-white">
              <CardHeader>
                <CardTitle>All Transactions</CardTitle>
                <CardDescription className="text-gray-300">
                  Showing {filteredTransactions.length} transaction(s)
                </CardDescription>
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
                <CardDescription className="text-gray-300">
                  Cash/Card transactions (recorded by cashiers)
                </CardDescription>
              </CardHeader>
              <CardContent>{renderTable(myLikeTransactions)}</CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Receipt Dialog */}
        <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
          <DialogContent>
            {receiptData && (
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
      </div>
    </DashboardLayout>
  )
}
