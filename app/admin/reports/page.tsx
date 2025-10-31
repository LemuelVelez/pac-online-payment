/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useMemo, useState } from "react"
import type { Models } from "appwrite"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, RefreshCcw } from "lucide-react"

import { getDatabases, getEnvIds, Query } from "@/lib/appwrite"
import type { PaymentDoc } from "@/lib/appwrite-payments"
import { computeStudentTotals } from "@/lib/appwrite-cashier"

/* ========================= Types ========================= */

type UserProfileDoc = Models.Document & {
    userId?: string
    email?: string
    fullName?: string
    role?: string
    status?: string
    studentId?: string
    feePlan?: {
        tuition?: number
        laboratory?: number
        library?: number
        miscellaneous?: number
        total?: number
    }
    totalFees?: number
}

/* ========================= Env & IDs ========================= */

function ids() {
    const { DB_ID, USERS_COL_ID } = getEnvIds()
    const PAYMENTS_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_PAYMENTS_COLLECTION_ID as string
    if (!DB_ID || !USERS_COL_ID || !PAYMENTS_COL_ID) {
        console.warn("[reports] Missing Appwrite env IDs.")
    }
    return { DB_ID, USERS_COL_ID, PAYMENTS_COL_ID }
}

/* ========================= Helpers ========================= */

function startOfDayISO(d: Date) {
    const x = new Date(d)
    x.setHours(0, 0, 0, 0)
    return x.toISOString()
}
function endOfDayISO(d: Date) {
    const x = new Date(d)
    x.setHours(23, 59, 59, 999)
    return x.toISOString()
}
function parseYmdLocal(s: string): Date {
    // yyyy-mm-dd -> Date in local tz
    const [y, m, d] = s.split("-").map((n) => parseInt(n, 10))
    const dt = new Date()
    dt.setFullYear(y, (m || 1) - 1, d || 1)
    dt.setHours(12, 0, 0, 0) // avoid DST edges
    return dt
}
function formatPeso(n: number) {
    try {
        return n.toLocaleString("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 2 })
    } catch {
        return `₱${(n || 0).toLocaleString()}`
    }
}
function chunk<T>(arr: T[], size = 100) {
    const out: T[][] = []
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
    return out
}

/* ========================= Backend Loaders ========================= */

async function listPaymentsBetween(startIso: string, endIso: string) {
    const db = getDatabases()
    const { DB_ID, PAYMENTS_COL_ID } = ids()

    const out: PaymentDoc[] = []
    let cursor: string | undefined

    for (; ;) {
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

async function getUsersByIds(userIds: string[]): Promise<Record<string, UserProfileDoc>> {
    const db = getDatabases()
    const { DB_ID, USERS_COL_ID } = ids()
    const uniq = Array.from(new Set(userIds.filter(Boolean)))
    const byId: Record<string, UserProfileDoc> = {}

    for (const group of chunk(uniq, 90)) {
        const res = await db
            .listDocuments<UserProfileDoc>(DB_ID, USERS_COL_ID, [Query.equal("$id", group), Query.limit(group.length)])
            .catch(() => null)
        for (const u of res?.documents ?? []) byId[u.$id] = u
    }
    return byId
}

async function listStudents(limit = 500) {
    const db = getDatabases()
    const { DB_ID, USERS_COL_ID } = ids()
    const out: UserProfileDoc[] = []
    let cursor: string | undefined

    for (; ;) {
        const queries: string[] = [Query.equal("role", "student"), Query.orderDesc("$updatedAt"), Query.limit(100)]
        if (cursor) queries.push(Query.cursorAfter(cursor))
        const res = await db.listDocuments<UserProfileDoc>(DB_ID, USERS_COL_ID, queries)
        const docs = res.documents ?? []
        out.push(...docs)
        if (docs.length < 100 || out.length >= limit) break
        cursor = docs[docs.length - 1].$id
    }
    return out.slice(0, limit)
}

/* ========================= CSV ========================= */

function toCsv(rows: Array<Record<string, any>>) {
    if (!rows.length) return ""
    const headers = Object.keys(rows[0])
    const esc = (v: any) => {
        const s = v == null ? "" : String(v)
        if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
        return s
    }
    const lines = [headers.join(",")]
    for (const r of rows) lines.push(headers.map((h) => esc(r[h])).join(","))
    return lines.join("\n")
}

function downloadCsv(filename: string, csv: string) {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
}

/* ========================= UI ========================= */

export default function AdminReportsPage() {
    // Date range: default last 30 days
    const today = new Date()
    const last30 = new Date()
    last30.setDate(today.getDate() - 29)

    const [dateFrom, setDateFrom] = useState(() => new Date(last30.getTime()).toISOString().slice(0, 10))
    const [dateTo, setDateTo] = useState(() => new Date(today.getTime()).toISOString().slice(0, 10))

    const [statusFilter, setStatusFilter] = useState<"all" | "Pending" | "Completed" | "Succeeded" | "Failed" | "Cancelled">("all")
    const [methodFilter, setMethodFilter] = useState<"all" | "cash" | "card" | "credit-card" | "e-wallet" | "online-banking">("all")
    const [search, setSearch] = useState("")

    const [{ loading, error, payments, usersById }, setState] = useState<{
        loading: boolean
        error: string | null
        payments: PaymentDoc[]
        usersById: Record<string, UserProfileDoc>
    }>({ loading: true, error: null, payments: [], usersById: {} })

    // Outstanding balances (lazy loaded to avoid N+1 on mount)
    const [{ obLoading, obError, outstanding }, setOb] = useState<{
        obLoading: boolean
        obError: string | null
        outstanding: Array<{
            studentId?: string
            fullName?: string
            totalFees?: number
            paidTotal: number
            balanceTotal: number
        }>
    }>({ obLoading: false, obError: null, outstanding: [] })

    async function load() {
        try {
            setState((s) => ({ ...s, loading: true, error: null }))
            const startIso = startOfDayISO(parseYmdLocal(dateFrom))
            const endIso = endOfDayISO(parseYmdLocal(dateTo))

            const data = await listPaymentsBetween(startIso, endIso)
            const map = await getUsersByIds(data.map((p) => p.userId))
            setState({ loading: false, error: null, payments: data, usersById: map })
        } catch (e: any) {
            setState((s) => ({ ...s, loading: false, error: e?.message || "Failed to load payments." }))
        }
    }

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const filtered = useMemo(() => {
        return (payments || []).filter((p) => {
            if (statusFilter !== "all" && p.status !== statusFilter) return false
            if (methodFilter !== "all" && String(p.method || "") !== methodFilter) return false

            if (search.trim()) {
                const u = usersById[p.userId]
                const hay = [
                    p.$id,
                    p.reference,
                    p.userId,
                    p.status,
                    p.method,
                    u?.fullName,
                    u?.studentId,
                    u?.email,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase()
                if (!hay.includes(search.toLowerCase())) return false
            }
            return true
        })
    }, [payments, usersById, statusFilter, methodFilter, search])

    const summary = useMemo(() => {
        let totalAmount = 0
        let completedAmount = 0
        let pendingCount = 0
        for (const p of filtered) {
            const amt = Number(p.amount) || 0
            totalAmount += amt
            if (p.status === "Completed" || p.status === "Succeeded") completedAmount += amt
            if (p.status === "Pending") pendingCount += 1
        }
        return {
            transactions: filtered.length,
            grossAmount: totalAmount,
            recognizedRevenue: completedAmount,
            pendingCount,
        }
    }, [filtered])

    function exportPaymentsCsv() {
        const rows = filtered.map((p) => {
            const u = usersById[p.userId]
            return {
                transaction_id: p.$id,
                reference: p.reference || "",
                created_at: new Date(p.$createdAt).toLocaleString(),
                student_name: u?.fullName || "",
                student_id: u?.studentId || "",
                amount: Number(p.amount) || 0,
                method: p.method || "",
                status: p.status || "",
                fees: Array.isArray(p.fees) ? p.fees.join("|") : "",
                courseId: p.courseId || "",
                yearId: p.yearId || "",
            }
        })
        const csv = toCsv(rows)
        downloadCsv(`payments_${dateFrom}_to_${dateTo}.csv`, csv)
    }

    async function loadOutstandingBalances() {
        try {
            setOb((s) => ({ ...s, obLoading: true, obError: null }))
            // Load a reasonable slice of students to keep the page snappy
            const students = await listStudents(300) // adjust if needed
            const results: Array<{
                studentId?: string
                fullName?: string
                totalFees?: number
                paidTotal: number
                balanceTotal: number
            }> = []

            // Do in small batches to avoid flooding
            const batches = chunk(students, 12)
            for (const group of batches) {
                const chunked = await Promise.all(
                    group.map(async (s) => {
                        const t = await computeStudentTotals(s.$id, s.feePlan)
                        return {
                            studentId: s.studentId,
                            fullName: s.fullName,
                            totalFees: typeof s.totalFees === "number" ? s.totalFees : s.feePlan?.total,
                            paidTotal: t.paidTotal,
                            balanceTotal: t.balanceTotal,
                        }
                    })
                )
                results.push(...chunked)
            }

            // Only show those with a real outstanding balance (> 0.01)
            const nonZero = results
                .filter((r) => (r.balanceTotal || 0) > 0.009)
                .sort((a, b) => (b.balanceTotal || 0) - (a.balanceTotal || 0))

            setOb({ obLoading: false, obError: null, outstanding: nonZero })
        } catch (e: any) {
            setOb((s) => ({ ...s, obLoading: false, obError: e?.message || "Failed to compute outstanding balances." }))
        }
    }

    function exportOutstandingCsv() {
        const rows = outstanding.map((r) => ({
            student_id: r.studentId || "",
            student_name: r.fullName || "",
            total_fees: r.totalFees ?? "",
            paid_total: r.paidTotal,
            balance_total: r.balanceTotal,
        }))
        const csv = toCsv(rows)
        downloadCsv(`outstanding_${new Date().toISOString().slice(0, 10)}.csv`, csv)
    }

    return (
        <DashboardLayout allowedRoles={["admin"]}>
            <div className="container mx-auto px-4 py-8 space-y-8">
                {/* Header & Controls */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Reports</h1>
                        <p className="text-gray-300">Accurate, live data from Appwrite</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 w-full lg:w-auto">
                        <div className="col-span-1 sm:col-span-1 lg:col-span-2">
                            <label className="block text-xs text-gray-400 mb-1">From</label>
                            <Input
                                type="date"
                                className="bg-slate-800 border-slate-700 text-white"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                        </div>
                        <div className="col-span-1 sm:col-span-1 lg:col-span-2">
                            <label className="block text-xs text-gray-400 mb-1">To</label>
                            <Input
                                type="date"
                                className="bg-slate-800 border-slate-700 text-white"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                        </div>
                        <Button
                            className="col-span-1 sm:col-span-1 lg:col-span-1 bg-primary hover:bg-primary/90"
                            onClick={load}
                            disabled={loading}
                        >
                            <RefreshCcw className="mr-2 h-4 w-4" />
                            Reload
                        </Button>
                        <Button
                            variant="outline"
                            className="col-span-1 sm:col-span-1 lg:col-span-1 border-slate-600 text-white"
                            onClick={exportPaymentsCsv}
                            disabled={loading || filtered.length === 0}
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Export CSV
                        </Button>
                    </div>
                </div>

                {/* Summary */}
                <Card className="bg-slate-800/60 border-slate-700 text-white">
                    <CardContent className="py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                            <div className="text-xs text-gray-400">Transactions</div>
                            <div className="text-xl font-semibold">{loading ? "…" : summary.transactions}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-400">Gross Amount (any status)</div>
                            <div className="text-xl font-semibold">{loading ? "…" : formatPeso(summary.grossAmount)}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-400">Recognized Revenue</div>
                            <div className="text-xl font-semibold">{loading ? "…" : formatPeso(summary.recognizedRevenue)}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-400">Pending Count</div>
                            <div className="text-xl font-semibold">{loading ? "…" : summary.pendingCount}</div>
                        </div>
                    </CardContent>
                </Card>

                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input
                        placeholder="Search student, ID, reference, status, method…"
                        className="bg-slate-800 border-slate-700 text-white"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700 text-white">
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Succeeded">Succeeded</SelectItem>
                            <SelectItem value="Failed">Failed</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={methodFilter} onValueChange={(v: any) => setMethodFilter(v)}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                            <SelectValue placeholder="Method" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700 text-white">
                            <SelectItem value="all">All Methods</SelectItem>
                            <SelectItem value="cash">cash</SelectItem>
                            <SelectItem value="card">card</SelectItem>
                            <SelectItem value="credit-card">credit-card</SelectItem>
                            <SelectItem value="e-wallet">e-wallet</SelectItem>
                            <SelectItem value="online-banking">online-banking</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Errors */}
                {error ? (
                    <Card className="bg-red-950/40 border-red-800 text-red-200">
                        <CardContent className="py-3 text-sm">{error}</CardContent>
                    </Card>
                ) : null}

                {/* Payments Table */}
                <Card className="bg-slate-800/60 border-slate-700 text-white">
                    <CardHeader className="pb-2">
                        <CardTitle>Payments ({filtered.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="rounded-lg border border-slate-700 overflow-x-auto">
                            <table className="w-full min-w-[900px]">
                                <thead>
                                    <tr className="bg-slate-900/60 border-b border-slate-700 text-left text-xs text-gray-300">
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Reference</th>
                                        <th className="px-4 py-3">Student</th>
                                        <th className="px-4 py-3">Student ID</th>
                                        <th className="px-4 py-3">Method</th>
                                        <th className="px-4 py-3">Amount</th>
                                        <th className="px-4 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {loading ? (
                                        <tr>
                                            <td className="px-4 py-4 text-sm text-gray-400" colSpan={7}>
                                                Loading…
                                            </td>
                                        </tr>
                                    ) : filtered.length === 0 ? (
                                        <tr>
                                            <td className="px-4 py-4 text-sm text-gray-400" colSpan={7}>
                                                No records for the selected range.
                                            </td>
                                        </tr>
                                    ) : (
                                        filtered.map((p) => {
                                            const u = usersById[p.userId]
                                            return (
                                                <tr key={p.$id} className="text-sm">
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        {new Date(p.$createdAt).toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-3">{p.reference || p.$id}</td>
                                                    <td className="px-4 py-3">{u?.fullName || "—"}</td>
                                                    <td className="px-4 py-3">{u?.studentId || "—"}</td>
                                                    <td className="px-4 py-3">{p.method || "—"}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap">{formatPeso(Number(p.amount) || 0)}</td>
                                                    <td className="px-4 py-3">{p.status}</td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Outstanding Balances (minimal, optional) */}
                <Card className="bg-slate-800/60 border-slate-700 text-white">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle>Outstanding Balances</CardTitle>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="border-slate-600 text-white"
                                onClick={exportOutstandingCsv}
                                disabled={outstanding.length === 0}
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Export CSV
                            </Button>
                            <Button onClick={loadOutstandingBalances} disabled={obLoading}>
                                {obLoading ? "Computing…" : "Compute"}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {obError ? (
                            <div className="mb-3 text-sm text-red-300">{obError}</div>
                        ) : null}
                        <div className="rounded-lg border border-slate-700 overflow-x-auto">
                            <table className="w-full min-w-[800px]">
                                <thead>
                                    <tr className="bg-slate-900/60 border-b border-slate-700 text-left text-xs text-gray-300">
                                        <th className="px-4 py-3">Student</th>
                                        <th className="px-4 py-3">Student ID</th>
                                        <th className="px-4 py-3">Total Fees</th>
                                        <th className="px-4 py-3">Paid Total</th>
                                        <th className="px-4 py-3">Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {obLoading ? (
                                        <tr>
                                            <td className="px-4 py-4 text-sm text-gray-400" colSpan={5}>
                                                Loading…
                                            </td>
                                        </tr>
                                    ) : outstanding.length === 0 ? (
                                        <tr>
                                            <td className="px-4 py-4 text-sm text-gray-400" colSpan={5}>
                                                {obError ? "Failed to load." : "No outstanding balances or not computed yet."}
                                            </td>
                                        </tr>
                                    ) : (
                                        outstanding.map((r, i) => (
                                            <tr key={`${r.studentId}-${i}`} className="text-sm">
                                                <td className="px-4 py-3">{r.fullName || "—"}</td>
                                                <td className="px-4 py-3">{r.studentId || "—"}</td>
                                                <td className="px-4 py-3 whitespace-nowrap">{typeof r.totalFees === "number" ? formatPeso(r.totalFees) : "—"}</td>
                                                <td className="px-4 py-3 whitespace-nowrap">{formatPeso(r.paidTotal)}</td>
                                                <td className="px-4 py-3 whitespace-nowrap">{formatPeso(r.balanceTotal)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
