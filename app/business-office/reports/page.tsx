/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useMemo, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, Download } from "lucide-react"

import { getDatabases, Query, getEnvIds } from "@/lib/appwrite"
import type { PaymentDoc } from "@/lib/appwrite-payments"
import type { UserProfileDoc } from "@/lib/profile"

/* -------------------------------- helpers -------------------------------- */

function startOfDayIso(d: Date) {
    const x = new Date(d)
    x.setHours(0, 0, 0, 0)
    return x.toISOString()
}
function endOfDayIso(d: Date) {
    const x = new Date(d)
    x.setHours(23, 59, 59, 999)
    return x.toISOString()
}
function fmtPeso(n: number) {
    return `₱${(Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function toCsv(rows: Array<Record<string, any>>) {
    if (!rows.length) return ""
    const headers = Object.keys(rows[0] || {})
    const esc = (v: any) => {
        const s = String(v ?? "")
        if (/[,"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
        return s
    }
    const lines = [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))]
    return lines.join("\n")
}
function dateKeyLocal(iso: string) {
    const dt = new Date(iso)
    const y = dt.getFullYear()
    const m = String(dt.getMonth() + 1).padStart(2, "0")
    const d = String(dt.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
}

/* ---------------------------------- page ---------------------------------- */

type MethodFilter = "all" | "cash" | "card" | "credit-card" | "e-wallet" | "online-banking"
type StatusFilter = "all" | "finalized" | "pending"

export default function BusinessOfficeReportsPage() {
    // filters
    const [startDate, setStartDate] = useState(() => {
        const d = new Date()
        d.setDate(d.getDate() - 30)
        return d.toISOString().slice(0, 10)
    })
    const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10))
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("finalized")
    const [methodFilter, setMethodFilter] = useState<MethodFilter>("all")

    // data
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string>("")
    const [payments, setPayments] = useState<PaymentDoc[]>([])
    const [usersById, setUsersById] = useState<Record<string, Pick<UserProfileDoc, "fullName" | "studentId">>>({})

    const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID as string
    const PAYMENTS_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_PAYMENTS_COLLECTION_ID as string

    const startIso = useMemo(() => startOfDayIso(new Date(startDate)), [startDate])
    const endIso = useMemo(() => endOfDayIso(new Date(endDate)), [endDate])

    async function fetchAllPaymentsInRange() {
        if (!DB_ID || !PAYMENTS_COL_ID) {
            setError("Missing Appwrite Database or Payments collection env IDs.")
            return
        }
        setLoading(true)
        setError("")
        try {
            const db = getDatabases()
            const pageLimit = 200
            const docs: PaymentDoc[] = []
            let cursor: string | undefined

            for (; ;) {
                const queries: string[] = [
                    Query.greaterThanEqual("$createdAt", startIso),
                    Query.lessThan("$createdAt", endIso),
                    Query.orderDesc("$createdAt"),
                    Query.limit(pageLimit),
                ]
                if (cursor) queries.push(Query.cursorAfter(cursor))
                if (statusFilter === "finalized") queries.push(Query.equal("status", ["Completed", "Succeeded"]))
                if (statusFilter === "pending") queries.push(Query.equal("status", "Pending"))
                if (methodFilter !== "all") queries.push(Query.equal("method", methodFilter))

                const res = await db.listDocuments<PaymentDoc>(DB_ID, PAYMENTS_COL_ID, queries)
                const page = res.documents ?? []
                docs.push(...page)

                if (page.length < pageLimit) break
                cursor = page[page.length - 1].$id
            }

            setPayments(docs)

            // Join minimal student info (for CSV)
            const ids = Array.from(new Set(docs.map((d) => d.userId).filter(Boolean)))
            if (ids.length) {
                const { USERS_COL_ID } = getEnvIds()
                const chunk = <T,>(arr: T[], size = 100) =>
                    Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size))

                const db2 = getDatabases()
                const out: Record<string, Pick<UserProfileDoc, "fullName" | "studentId">> = {}
                for (const batch of chunk(ids, 100)) {
                    try {
                        const usersRes = await db2.listDocuments<UserProfileDoc>(DB_ID, USERS_COL_ID, [
                            Query.equal("$id", batch),
                            Query.limit(Math.max(100, batch.length)),
                        ])
                        for (const u of usersRes.documents ?? []) {
                            out[u.$id] = { fullName: u.fullName, studentId: u.studentId }
                        }
                    } catch {
                        /* ignore */
                    }
                }
                setUsersById(out)
            } else {
                setUsersById({})
            }
        } catch (e: any) {
            setError(e?.message || "Failed to load reports.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAllPaymentsInRange().catch(() => { })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startIso, endIso, statusFilter, methodFilter])

    /* ------------------------------ aggregations ------------------------------ */

    const {
        totalTx,
        pendingTx,
        completedTx,
        succeededTx,
        failedTx,
        collectedAmount,
        pendingAmount,
        methodRows,
        perDayRows,
    } = useMemo(() => {
        const rows = payments || []

        const totalTx = rows.length
        let pendingTx = 0
        let completedTx = 0
        let succeededTx = 0
        let failedTx = 0
        let collectedAmount = 0
        let pendingAmount = 0

        const methodMap: Record<string, { count: number; collected: number }> = {}
        const dailyMap: Record<string, { collected: number; pending: number; count: number }> = {}

        for (const p of rows) {
            const status = String(p.status || "")
            const method = String(p.method || "").toLowerCase()
            const amt = Number(p.amount) || 0

            if (status === "Pending") {
                pendingTx += 1
                pendingAmount += amt
            } else if (status === "Completed") {
                completedTx += 1
                collectedAmount += amt
            } else if (status === "Succeeded") {
                succeededTx += 1
                collectedAmount += amt
            } else if (status === "Failed") {
                failedTx += 1
            }

            // method breakdown: count every txn; collected only for finalized
            if (!methodMap[method]) methodMap[method] = { count: 0, collected: 0 }
            methodMap[method].count += 1
            if (status === "Completed" || status === "Succeeded") {
                methodMap[method].collected += amt
            }

            // per-day
            const key = dateKeyLocal(p.$createdAt)
            if (!dailyMap[key]) dailyMap[key] = { collected: 0, pending: 0, count: 0 }
            dailyMap[key].count += 1
            if (status === "Completed" || status === "Succeeded") {
                dailyMap[key].collected += amt
            } else if (status === "Pending") {
                dailyMap[key].pending += amt
            }
        }

        const methodRows = Object.entries(methodMap)
            .map(([m, v]) => ({ method: m || "—", count: v.count, collected: v.collected }))
            .sort((a, b) => b.collected - a.collected)

        const perDayRows = Object.entries(dailyMap)
            .map(([d, v]) => ({ date: d, collected: v.collected, pending: v.pending, count: v.count }))
            .sort((a, b) => a.date.localeCompare(b.date))

        return {
            totalTx,
            pendingTx,
            completedTx,
            succeededTx,
            failedTx,
            collectedAmount,
            pendingAmount,
            methodRows,
            perDayRows,
        }
    }, [payments])

    function downloadCsv() {
        if (!payments.length) return
        const rows = payments.map((p) => {
            const u = usersById[p.userId] || {}
            return {
                createdAt: p.$createdAt,
                paymentId: p.$id,
                reference: p.reference || "",
                status: p.status,
                method: p.method,
                amount: Number(p.amount) || 0,
                userId: p.userId,
                studentId: u.studentId || "",
                fullName: u.fullName || "",
            }
        })
        const csv = toCsv(rows)
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `reports_${startDate}_${endDate}.csv`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
    }

    return (
        <DashboardLayout allowedRoles={["business-office", "admin"]}>
            <div className="mx-auto max-w-none px-2 md:px-4 py-8">
                {/* Header & minimal actions */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Reports</h1>
                        <p className="text-slate-300">Aggregated collections from Appwrite within a date range.</p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:gap-2 sm:items-center sm:justify-end w-full sm:w-auto">
                        <Button
                            className="group w-full sm:w-auto"
                            onClick={() => fetchAllPaymentsInRange()}
                            disabled={loading}
                            aria-busy={loading}
                        >
                            <RefreshCw
                                className={`mr-2 h-4 w-4 transition-transform duration-300 ${loading ? "animate-spin" : "group-hover:rotate-180"
                                    }`}
                            />
                            {loading ? "Refreshing…" : "Refresh"}
                        </Button>
                        <Button className="w-full sm:w-auto" variant="outline" onClick={downloadCsv} disabled={!payments.length}>
                            <Download className="mr-2 h-4 w-4" />
                            Export CSV
                        </Button>
                    </div>
                </div>

                {/* Minimal filters with compact date inputs */}
                <Card className="bg-slate-900/60 border-slate-700 text-white mb-6">
                    <CardContent className="pt-6">
                        {/* Switched from grid to flex so small controls don't stretch */}
                        <div className="flex flex-wrap items-end gap-4">
                            <div className="space-y-2 shrink-0">
                                <Label htmlFor="start" className="mb-1 block">
                                    Start date
                                </Label>
                                <Input
                                    id="start"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-slate-800 border-slate-700 text-white w-44 sm:w-52"
                                />
                            </div>

                            <div className="space-y-2 shrink-0">
                                <Label htmlFor="end" className="mb-1 block">
                                    End date
                                </Label>
                                <Input
                                    id="end"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-slate-800 border-slate-700 text-white w-44 sm:w-52"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="mb-1 block">Status</Label>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant={statusFilter === "finalized" ? "default" : "outline"}
                                        className="flex-1"
                                        onClick={() => setStatusFilter("finalized")}
                                    >
                                        Finalized
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={statusFilter === "pending" ? "default" : "outline"}
                                        className="flex-1"
                                        onClick={() => setStatusFilter("pending")}
                                    >
                                        Pending
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={statusFilter === "all" ? "default" : "outline"}
                                        className="flex-1"
                                        onClick={() => setStatusFilter("all")}
                                    >
                                        All
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="mb-1 block">Method</Label>
                                <div className="flex flex-wrap gap-2">
                                    {(["all", "cash", "card", "credit-card", "e-wallet", "online-banking"] as MethodFilter[]).map((m) => (
                                        <Button
                                            key={m}
                                            type="button"
                                            size="sm"
                                            variant={methodFilter === m ? "default" : "outline"}
                                            onClick={() => setMethodFilter(m)}
                                        >
                                            {m.replace("-", " ")}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {error && (
                    <Alert className="mb-6 bg-red-500/15 border-red-500/30 text-red-200">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* KPI summary (no fancy UI) */}
                <Card className="bg-slate-900/60 border-slate-700 text-white mb-6">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                            <div className="rounded-lg border border-slate-700 p-3">
                                <div className="text-slate-400">Transactions</div>
                                <div className="text-lg font-semibold">{totalTx}</div>
                            </div>
                            <div className="rounded-lg border border-slate-700 p-3">
                                <div className="text-slate-400">Collected</div>
                                <div className="text-lg font-semibold">{fmtPeso(collectedAmount)}</div>
                            </div>
                            <div className="rounded-lg border border-slate-700 p-3">
                                <div className="text-slate-400">Pending Amount</div>
                                <div className="text-lg font-semibold">{fmtPeso(pendingAmount)}</div>
                            </div>
                            <div className="rounded-lg border border-slate-700 p-3">
                                <div className="text-slate-400">Pending</div>
                                <div className="text-lg font-semibold">{pendingTx}</div>
                            </div>
                            <div className="rounded-lg border border-slate-700 p-3">
                                <div className="text-slate-400">Completed</div>
                                <div className="text-lg font-semibold">{completedTx}</div>
                            </div>
                            <div className="rounded-lg border border-slate-700 p-3">
                                <div className="text-slate-400">Succeeded</div>
                                <div className="text-lg font-semibold">{succeededTx}</div>
                            </div>
                            <div className="rounded-lg border border-slate-700 p-3">
                                <div className="text-slate-400">Failed</div>
                                <div className="text-lg font-semibold">{failedTx}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Per-day totals */}
                <Card className="bg-slate-900/60 border-slate-700 text-white mb-6">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Per-day totals</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full overflow-x-auto rounded-md border border-slate-700">
                            <table className="min-w-[640px] w-full text-sm">
                                <thead className="bg-slate-900/70 text-slate-300">
                                    <tr>
                                        <th className="px-4 py-2 text-left whitespace-nowrap">Date</th>
                                        <th className="px-4 py-2 text-right whitespace-nowrap">Collected</th>
                                        <th className="px-4 py-2 text-right whitespace-nowrap">Pending</th>
                                        <th className="px-4 py-2 text-right whitespace-nowrap">Transactions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {loading && perDayRows.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                                                Loading…
                                            </td>
                                        </tr>
                                    )}
                                    {!loading && perDayRows.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                                                No data.
                                            </td>
                                        </tr>
                                    )}
                                    {perDayRows.map((r) => (
                                        <tr key={r.date}>
                                            <td className="px-4 py-2 whitespace-nowrap">{r.date}</td>
                                            <td className="px-4 py-2 text-right whitespace-nowrap">{fmtPeso(r.collected)}</td>
                                            <td className="px-4 py-2 text-right whitespace-nowrap">{fmtPeso(r.pending)}</td>
                                            <td className="px-4 py-2 text-right whitespace-nowrap">{r.count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Method breakdown */}
                <Card className="bg-slate-900/60 border-slate-700 text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Method breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full overflow-x-auto rounded-md border border-slate-700">
                            <table className="min-w-[520px] w-full text-sm">
                                <thead className="bg-slate-900/70 text-slate-300">
                                    <tr>
                                        <th className="px-4 py-2 text-left whitespace-nowrap">Method</th>
                                        <th className="px-4 py-2 text-right whitespace-nowrap">Transactions</th>
                                        <th className="px-4 py-2 text-right whitespace-nowrap">Collected (Finalized)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {loading && methodRows.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                                                Loading…
                                            </td>
                                        </tr>
                                    )}
                                    {!loading && methodRows.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                                                No data.
                                            </td>
                                        </tr>
                                    )}
                                    {methodRows.map((m) => (
                                        <tr key={m.method}>
                                            <td className="px-4 py-2 whitespace-nowrap">{m.method}</td>
                                            <td className="px-4 py-2 text-right whitespace-nowrap">{m.count}</td>
                                            <td className="px-4 py-2 text-right whitespace-nowrap">{fmtPeso(m.collected)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
