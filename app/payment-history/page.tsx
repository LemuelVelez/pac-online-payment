/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useMemo, useState } from "react"
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
} from "lucide-react"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

import { getCurrentUserSafe, getDatabases, getEnvIds, getStorage, ID, Query } from "@/lib/appwrite"
import { listRecentPayments, type PaymentDoc } from "@/lib/appwrite-payments"
import type { Models } from "appwrite"
import { toast } from "sonner"
import { createMessage } from "@/lib/appwrite-messages"

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
}

const COMPLETED_STATES = new Set<PaymentDoc["status"]>(["Completed", "Succeeded"])
const PROOF_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_RECEIPT_PROOF_BUCKET_ID as string | undefined
const MESSAGES_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID as string | undefined

function peso(n: number | string) {
  const v = typeof n === "string" ? Number(n || 0) : n
  return `₱${(v || 0).toLocaleString()}`
}

function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" })
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

  useEffect(() => {
    loadPayments({ silent: true })
    loadCashiers()
  }, [])

  useEffect(() => {
    if (!askDialogFor) return
    const p = askDialogFor
    const prefilled = `Hello Cashier Team,

May I request the official receipt for my completed payment?

• Reference: ${p.reference || p.$id}
• Date: ${formatDate(p.$createdAt)}
• Amount: ${peso(p.amount)}
• Method: ${p.method}

Thank you!`
    setMessage(prefilled)
    setSelectedCashierId("")
    setProofFile(null)
  }, [askDialogFor])

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
    } catch (e: any) {
      toast.error("Failed to send message", { description: e?.message ?? "Please try again." })
    } finally {
      setSending(false)
    }
  }

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
            onClick={() => loadPayments()}
            disabled={loading}
            title="Refresh your payment list"
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
                    const showDownload = completed && !!receiptUrl

                    const desc =
                      Array.isArray(p.fees) && p.fees.length > 0
                        ? `Fees: ${p.fees.join(", ")}`
                        : p.planId
                          ? "Fee Plan Payment"
                          : "Payment"

                    return (
                      <tr key={p.$id} className="text-sm text-gray-200">
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
                            <span className="text-xs text-gray-400">
                              Method: {p.method}
                            </span>
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
                          {showDownload ? (
                            <a
                              href={receiptUrl!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-blue-300 hover:text-blue-200"
                              onClick={() => toast.info("Opening receipt…")}
                            >
                              <FileText className="mr-1 h-4 w-4" />
                              Download
                            </a>
                          ) : completed ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-slate-600"
                              onClick={() => setAskDialogFor(p)}
                            >
                              Ask Cashier for Receipt
                            </Button>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
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

        <div className="mt-6 flex justify-end">
          <Link href="/dashboard">
            <Button variant="outline" className="border-slate-600">
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Send-to-Cashier Dialog -> now writes to messages table */}
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
                    <span className="text-xs text-gray-300 truncate max-w-[60%]">
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
      </div>
    </DashboardLayout>
  )
}
