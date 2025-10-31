/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useMemo, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, Download } from "lucide-react"

import { getDatabases, Query, getEnvIds } from "@/lib/appwrite"
import type { PaymentDoc } from "@/lib/appwrite-payments"
import type { UserProfileDoc } from "@/lib/profile"

/* ----------------------------- helpers ----------------------------- */

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
    const headers = Object.keys(rows[0] || {})
    const esc = (v: any) => {
        const s = String(v ?? "")
        if (/[,"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
        return s
    }
    const lines = [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))]
    return lines.join("\n")
}

/* ----------------------------- page ----------------------------- */

type MethodFilter = "all" | "cash" | "card" | "credit-card" | "e-wallet" | "online-banking"
type StatusFilter = "all" | "finalized" | "pending"

export default function BusinessOfficeCollectionsPage() {
    // filters
    const [startDate, setStartDate] = useState(() => {
        const d = new Date()
        d.setDate(d.getDate() - 30) // last 30 days by default
        return d.toISOString().slice(0, 10)
    })
    const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10))
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
    const [methodFilter, setMethodFilter] = useState<MethodFilter>("all")
    const [search, setSearch] = useState("")

    // data
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string>("")
    const [payments, setPayments] = useState<PaymentDoc[]>([])
    const [usersById, setUsersById] = useState<Record<string, Pick<UserProfileDoc, "fullName" | "studentId" | "course">>>({})
    const [nextCursor, setNextCursor] = useState<string | undefined>(undefined)

    const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID as string
    const PAYMENTS_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_PAYMENTS_COLLECTION_ID as string

    const startIso = useMemo(() => startOfDayIso(new Date(startDate)), [startDate])
    const endIso = useMemo(() => endOfDayIso(new Date(endDate)), [endDate])

    async function fetchPage(opts?: { cursorAfter?: string; replace?: boolean }) {
        if (!DB_ID || !PAYMENTS_COL_ID) {
            setError("Missing Appwrite Database/Payments collection env IDs.")
            return
        }
        setLoading(true)
        setError("")

        try {
            const db = getDatabases()
            const queries: string[] = [
                Query.greaterThanEqual("$createdAt", startIso),
                Query.lessThan("$createdAt", endIso),
                Query.orderDesc("$createdAt"),
                Query.limit(50),
            ]

            if (opts?.cursorAfter) queries.push(Query.cursorAfter(opts.cursorAfter))
            if (statusFilter === "finalized") queries.push(Query.equal("status", ["Completed", "Succeeded"]))
            if (statusFilter === "pending") queries.push(Query.equal("status", "Pending"))
            if (methodFilter !== "all") queries.push(Query.equal("method", methodFilter))

            const res = await db.listDocuments<PaymentDoc>(DB_ID, PAYMENTS_COL_ID, queries)
            const docs = res.documents ?? []

            // join with users (names/studentId/course)
            const userIds = Array.from(new Set(docs.map((d) => d.userId).filter(Boolean)))
            const joined: Record<string, Pick<UserProfileDoc, "fullName" | "studentId" | "course">> = {}

            if (userIds.length) {
                const { USERS_COL_ID } = getEnvIds()
                try {
                    const usersRes = await db.listDocuments<UserProfileDoc>(DB_ID, USERS_COL_ID, [
                        Query.equal("$id", userIds),
                        Query.limit(Math.max(100, userIds.length)),
                    ])
                    for (const u of usersRes.documents ?? []) {
                        joined[u.$id] = { fullName: u.fullName, studentId: u.studentId, course: u.course }
                    }
                } catch {
                    /* no-op, keep names blank if users fetch fails */
                }
            }

            setUsersById((prev) => ({ ...prev, ...joined }))
            setPayments((prev) => (opts?.replace ? docs : [...prev, ...docs]))
            setNextCursor(docs.length === 50 ? docs[docs.length - 1].$id : undefined)
        } catch (e: any) {
            setError(e?.message || "Failed to load collections.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        // on filter change, reload from scratch
        setPayments([])
        setUsersById({})
        setNextCursor(undefined)
        fetchPage({ replace: true }).catch(() => { })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startIso, endIso, statusFilter, methodFilter])

    // client-side search
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return payments
        return payments.filter((p) => {
            const u = usersById[p.userId] || {}
            return (
                String(p.$id).toLowerCase().includes(q) ||
                String(p.reference || "").toLowerCase().includes(q) ||
                String(u.studentId || "").toLowerCase().includes(q) ||
                String(u.fullName || "").toLowerCase().includes(q)
            )
        })
    }, [payments, search, usersById])

    const totalOnPage = useMemo(
        () =>
            filtered
                .filter((p) => p.status === "Completed" || p.status === "Succeeded")
                .reduce((s, p) => s + (Number(p.amount) || 0), 0),
        [filtered]
    )

    function downloadCsv() {
        if (!filtered.length) return
        const rows = filtered.map((p) => {
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
                course: u.course || "",
            }
        })
        const csv = toCsv(rows)
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `collections_${startDate}_${endDate}.csv`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
    }

    return (
        <DashboardLayout allowedRoles={["business-office", "admin"]}>
            {/* Full-width container + responsive padding */}
            <div className="mx-auto max-w-none px-2 md:px-4 py-8">
                {/* Header & actions (vertical on mobile) */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Collections</h1>
                        <p className="text-slate-300">Payments within a date range. Live data from Appwrite.</p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:gap-2 sm:items-center sm:justify-end w-full sm:w-auto">
                        {/* Animated Refresh button: spins while loading; subtle rotate on hover when idle */}
                        <Button
                            className="group w-full sm:w-auto"
                            onClick={() => fetchPage({ replace: true })}
                            disabled={loading}
                            aria-busy={loading}
                        >
                            <RefreshCw
                                className={`mr-2 h-4 w-4 transition-transform duration-300 ${loading ? "animate-spin" : "group-hover:rotate-180"
                                    }`}
                            />
                            {loading ? "Refreshing…" : "Refresh"}
                        </Button>

                        <Button
                            className="w-full sm:w-auto"
                            variant="outline"
                            onClick={downloadCsv}
                            disabled={!filtered.length}
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Export CSV
                        </Button>
                    </div>
                </div>

                {/* Filters (vertical on mobile, added spacing between label & select/input) */}
                <Card className="bg-slate-900/60 border-slate-700 text-white mb-6">
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                            <div className="lg:col-span-1 space-y-2">
                                <Label htmlFor="start" className="mb-1 block">Start date</Label>
                                <Input
                                    id="start"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-slate-800 border-slate-700 text-white"
                                />
                            </div>
                            <div className="lg:col-span-1 space-y-2">
                                <Label htmlFor="end" className="mb-1 block">End date</Label>
                                <Input
                                    id="end"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-slate-800 border-slate-700 text-white"
                                />
                            </div>
                            <div className="lg:col-span-1 space-y-2">
                                <Label className="mb-1 block">Status</Label>
                                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                                    <SelectTrigger className="bg-slate-800 border-slate-700 mt-1">
                                        <SelectValue placeholder="All" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="finalized">Completed/Succeeded</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="lg:col-span-1 space-y-2">
                                <Label className="mb-1 block">Method</Label>
                                <Select value={methodFilter} onValueChange={(v) => setMethodFilter(v as MethodFilter)}>
                                    <SelectTrigger className="bg-slate-800 border-slate-700 mt-1">
                                        <SelectValue placeholder="All" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="card">Card</SelectItem>
                                        <SelectItem value="credit-card">Credit Card</SelectItem>
                                        <SelectItem value="e-wallet">E-Wallet</SelectItem>
                                        <SelectItem value="online-banking">Online Banking</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="lg:col-span-2 space-y-2">
                                <Label htmlFor="search" className="mb-1 block">Search (ID / Ref / Student)</Label>
                                <Input
                                    id="search"
                                    placeholder="e.g. COL-... / reference / student name or ID"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="bg-slate-800 border-slate-700 text-white"
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

                <div className="mb-3 text-sm text-slate-300">
                    Showing <span className="font-semibold">{filtered.length}</span> payments
                    {statusFilter === "finalized" && (
                        <>
                            {" "}
                            • Finalized total on page: <span className="font-semibold">{fmtPeso(totalOnPage)}</span>
                        </>
                    )}
                </div>

                {/* Table with full-width & horizontal scrollbar */}
                <Card className="bg-slate-900/60 border-slate-700 text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Recent Payments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full overflow-x-auto rounded-md border border-slate-700">
                            <table className="min-w-[1100px] w-full text-sm">
                                <thead className="bg-slate-900/70 text-slate-300">
                                    <tr>
                                        <th className="px-4 py-2 text-left whitespace-nowrap">Created</th>
                                        <th className="px-4 py-2 text-left whitespace-nowrap">Payment / Ref</th>
                                        <th className="px-4 py-2 text-left whitespace-nowrap">Student</th>
                                        <th className="px-4 py-2 text-left whitespace-nowrap">Course</th>
                                        <th className="px-4 py-2 text-left whitespace-nowrap">Method</th>
                                        <th className="px-4 py-2 text-left whitespace-nowrap">Status</th>
                                        <th className="px-4 py-2 text-right whitespace-nowrap">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {loading && payments.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                                                Loading…
                                            </td>
                                        </tr>
                                    )}
                                    {!loading && filtered.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                                                No records.
                                            </td>
                                        </tr>
                                    )}
                                    {filtered.map((p) => {
                                        const u = usersById[p.userId] || {}
                                        const name = u.fullName || "—"
                                        const sid = u.studentId ? ` • ${u.studentId}` : ""
                                        return (
                                            <tr key={p.$id}>
                                                <td className="px-4 py-2 whitespace-nowrap">{new Date(p.$createdAt).toLocaleString()}</td>
                                                <td className="px-4 py-2">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{p.$id}</span>
                                                        <span className="text-xs text-slate-400">{p.reference || "—"}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap">{name}{sid}</td>
                                                <td className="px-4 py-2 whitespace-nowrap">{u.course || "—"}</td>
                                                <td className="px-4 py-2 whitespace-nowrap">{String(p.method || "").toLowerCase() || "—"}</td>
                                                <td className="px-4 py-2 whitespace-nowrap">{p.status}</td>
                                                <td className="px-4 py-2 text-right whitespace-nowrap">{fmtPeso(Number(p.amount) || 0)}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-xs text-slate-400">
                                Loaded {payments.length} item(s)
                                {nextCursor ? "" : " • End of results"}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => fetchPage({ cursorAfter: payments[payments.length - 1]?.$id })}
                                    disabled={loading || !nextCursor}
                                    className="border-slate-600 w-full sm:w-auto"
                                >
                                    Load more
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
