/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useMemo, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw } from "lucide-react"

import { getDatabases, Query } from "@/lib/appwrite"
import type { PaymentDoc } from "@/lib/appwrite-payments"

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
    return `₱${(Number(n) || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`
}
function dateKeyLocal(iso: string) {
    const dt = new Date(iso)
    const y = dt.getFullYear()
    const m = String(dt.getMonth() + 1).padStart(2, "0")
    const d = String(dt.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
}

/* ---------------------------------- page ---------------------------------- */

export default function BusinessOfficeDashboardPage() {
    // date range (default: last 30 days)
    const [startDate, setStartDate] = useState(() => {
        const d = new Date()
        d.setDate(d.getDate() - 30)
        return d.toISOString().slice(0, 10)
    })
    const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10))

    // data
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string>("")
    const [payments, setPayments] = useState<PaymentDoc[]>([])

    const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID as string | undefined
    const PAYMENTS_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_PAYMENTS_COLLECTION_ID as string | undefined

    const startIso = useMemo(() => startOfDayIso(new Date(startDate)), [startDate])
    const endIso = useMemo(() => endOfDayIso(new Date(endDate)), [endDate])

    async function fetchAllInRange() {
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

                const res = await db.listDocuments<PaymentDoc>(DB_ID, PAYMENTS_COL_ID, queries)
                const page = res.documents ?? []
                docs.push(...page)

                if (page.length < pageLimit) break
                cursor = page[page.length - 1].$id
            }

            setPayments(docs)
        } catch (e: any) {
            setError(e?.message || "Failed to load dashboard data.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAllInRange().catch(() => { })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startIso, endIso])

    /* ------------------------------ aggregations ------------------------------ */

    const {
        totalTx,
        pendingTx,
        completedTx,
        succeededTx,
        failedTx,
        collectedAmount,
        pendingAmount,
        perDayRows,
        recent,
    } = useMemo(() => {
        const rows = payments || []

        const totalTx = rows.length
        let pendingTx = 0
        let completedTx = 0
        let succeededTx = 0
        let failedTx = 0
        let collectedAmount = 0
        let pendingAmount = 0

        const dailyMap: Record<string, { collected: number; pending: number; count: number }> = {}

        for (const p of rows) {
            const status = String(p.status || "")
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

            const key = dateKeyLocal(p.$createdAt)
            if (!dailyMap[key]) dailyMap[key] = { collected: 0, pending: 0, count: 0 }
            dailyMap[key].count += 1
            if (status === "Completed" || status === "Succeeded") {
                dailyMap[key].collected += amt
            } else if (status === "Pending") {
                dailyMap[key].pending += amt
            }
        }

        const perDayRows = Object.entries(dailyMap)
            .map(([d, v]) => ({ date: d, collected: v.collected, pending: v.pending, count: v.count }))
            .sort((a, b) => a.date.localeCompare(b.date))

        // keep 25 most recent records for the table
        const recent = [...rows].sort((a, b) => (a.$createdAt < b.$createdAt ? 1 : -1)).slice(0, 25)

        return {
            totalTx,
            pendingTx,
            completedTx,
            succeededTx,
            failedTx,
            collectedAmount,
            pendingAmount,
            perDayRows,
            recent,
        }
    }, [payments])

    return (
        <DashboardLayout allowedRoles={["business-office", "admin"]}>
            <div className="mx-auto max-w-none px-2 md:px-4 py-8">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Business Office Dashboard</h1>
                        <p className="text-slate-300">Live collections overview from Appwrite</p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:gap-2 sm:items-center sm:justify-end w-full sm:w-auto">
                        <Button
                            className="group w-full sm:w-auto"
                            onClick={() => fetchAllInRange()}
                            disabled={loading}
                            aria-busy={loading}
                        >
                            <RefreshCw
                                className={`mr-2 h-4 w-4 transition-transform duration-300 ${loading ? "animate-spin" : "group-hover:rotate-180"
                                    }`}
                            />
                            {loading ? "Refreshing…" : "Refresh"}
                        </Button>
                    </div>
                </div>

                {/* Minimal filters */}
                <Card className="bg-slate-900/60 border-slate-700 text-white mb-6">
                    <CardContent className="pt-6">
                        <div className="flex flex-wrap items-end gap-4">
                            <div className="space-y-2 shrink-0">
                                <Label htmlFor="start" className="mb-1 block">Start date</Label>
                                <Input
                                    id="start"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-slate-800 border-slate-700 text-white w-44 sm:w-52"
                                />
                            </div>
                            <div className="space-y-2 shrink-0">
                                <Label htmlFor="end" className="mb-1 block">End date</Label>
                                <Input
                                    id="end"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-slate-800 border-slate-700 text-white w-44 sm:w-52"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {error && (
                    <Alert className="mb-6 bg-red-500/15 border-red-500/30 text-red-200">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* KPIs (no fancy UI) */}
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

                {/* Per-day totals (small table instead of charts) */}
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
                                            <td colSpan={4} className="px-4 py-6 text-center text-slate-400">Loading…</td>
                                        </tr>
                                    )}
                                    {!loading && perDayRows.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-6 text-center text-slate-400">No data.</td>
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

                {/* Recent payments (simple) */}
                <Card className="bg-slate-900/60 border-slate-700 text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Recent Payments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full overflow-x-auto rounded-md border border-slate-700">
                            <table className="min-w-[900px] w-full text-sm">
                                <thead className="bg-slate-900/70 text-slate-300">
                                    <tr>
                                        <th className="px-4 py-2 text-left whitespace-nowrap">Created</th>
                                        <th className="px-4 py-2 text-left whitespace-nowrap">Payment ID / Ref</th>
                                        <th className="px-4 py-2 text-left whitespace-nowrap">Method</th>
                                        <th className="px-4 py-2 text-left whitespace-nowrap">Status</th>
                                        <th className="px-4 py-2 text-right whitespace-nowrap">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {loading && recent.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-6 text-center text-slate-400">Loading…</td>
                                        </tr>
                                    )}
                                    {!loading && recent.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-6 text-center text-slate-400">No records.</td>
                                        </tr>
                                    )}
                                    {recent.map((p) => (
                                        <tr key={p.$id}>
                                            <td className="px-4 py-2 whitespace-nowrap">{new Date(p.$createdAt).toLocaleString()}</td>
                                            <td className="px-4 py-2">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{p.$id}</span>
                                                    <span className="text-xs text-slate-400">{p.reference || "—"}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap">{String(p.method || "").toLowerCase() || "—"}</td>
                                            <td className="px-4 py-2 whitespace-nowrap">{p.status}</td>
                                            <td className="px-4 py-2 text-right whitespace-nowrap">{fmtPeso(Number(p.amount) || 0)}</td>
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
