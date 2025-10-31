/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useMemo, useState } from "react"
import type { Models } from "appwrite"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PaymentChart } from "@/components/dashboard/payment-chart"
import { PaymentPieChart } from "@/components/dashboard/payment-pie-chart"

import { getDatabases, getEnvIds, Query } from "@/lib/appwrite"
import type { PaymentDoc } from "@/lib/appwrite-payments"
import { listTodayPayments, paymentsToHourlySeries } from "@/lib/appwrite-cashier"

/* ========================= Types & Env ========================= */

type UserDoc = Models.Document & {
    role?: "student" | "cashier" | "business-office" | "admin" | string
    status?: "active" | "inactive" | string
}

function getIds() {
    const { DB_ID, USERS_COL_ID } = getEnvIds()
    const PAYMENTS_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_PAYMENTS_COLLECTION_ID as string | undefined
    return { DB_ID, USERS_COL_ID, PAYMENTS_COL_ID }
}

/* ========================= Helpers ========================= */

const PAGE_LIMIT = 100

async function listAllUsers(): Promise<UserDoc[]> {
    const db = getDatabases()
    const { DB_ID, USERS_COL_ID } = getIds()
    const out: UserDoc[] = []
    let cursor: string | undefined

    for (; ;) {
        const queries: string[] = [Query.orderDesc("$createdAt"), Query.limit(PAGE_LIMIT)]
        if (cursor) queries.push(Query.cursorAfter(cursor))
        const res = await db.listDocuments<UserDoc>(DB_ID, USERS_COL_ID, queries)
        const docs = res.documents ?? []
        out.push(...docs)
        if (docs.length < PAGE_LIMIT) break
        cursor = docs[docs.length - 1].$id
    }
    return out
}

/** List payments since a given ISO date (inclusive). */
async function listPaymentsSince(startIso?: string): Promise<PaymentDoc[]> {
    const db = getDatabases()
    const { DB_ID, PAYMENTS_COL_ID } = getIds()
    const out: PaymentDoc[] = []
    let cursor: string | undefined

    for (; ;) {
        const queries: string[] = [Query.orderDesc("$createdAt"), Query.limit(PAGE_LIMIT)]
        if (startIso) queries.unshift(Query.greaterThanEqual("$createdAt", startIso))
        if (cursor) queries.push(Query.cursorAfter(cursor))

        const res = await db.listDocuments<PaymentDoc>(DB_ID!, PAYMENTS_COL_ID!, queries)
        const docs = res.documents ?? []
        out.push(...docs)
        if (docs.length < PAGE_LIMIT) break
        cursor = docs[docs.length - 1].$id
    }
    return out
}

function daysAgoISO(n: number) {
    const x = new Date()
    x.setDate(x.getDate() - n)
    x.setHours(0, 0, 0, 0)
    return x.toISOString()
}

function peso(n: number) {
    try {
        return n.toLocaleString("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 2 })
    } catch {
        return `₱${(n || 0).toLocaleString()}`
    }
}

function sumCompletedAmount(payments: PaymentDoc[]) {
    return payments.reduce((s, p) => {
        const ok = p.status === "Completed" || p.status === "Succeeded"
        return s + (ok ? Number(p.amount) || 0 : 0)
    }, 0)
}

function groupCount<T>(list: T[], by: (x: T) => string) {
    const m = new Map<string, number>()
    for (const it of list) {
        const k = by(it) || ""
        m.set(k, (m.get(k) || 0) + 1)
    }
    return Array.from(m.entries()).map(([name, value]) => ({ name, value }))
}

/** Compress the last N days into a day-by-day series for PaymentChart. Amounts include only Completed/Succeeded. */
function paymentsToDailyAmountSeries(payments: PaymentDoc[], days = 30) {
    // Build day buckets (local timezone)
    const buckets = new Map<string, number>() // key = YYYY-MM-DD, value = sum amount
    const labels: string[] = []

    for (let i = days - 1; i >= 0; i--) {
        const dt = new Date()
        dt.setDate(dt.getDate() - i)
        dt.setHours(0, 0, 0, 0)
        const key = dt.toISOString().slice(0, 10) // YYYY-MM-DD
        labels.push(key)
        buckets.set(key, 0)
    }

    for (const p of payments) {
        if (!(p.status === "Completed" || p.status === "Succeeded")) continue
        const dt = new Date(p.$createdAt)
        dt.setHours(0, 0, 0, 0)
        const key = dt.toISOString().slice(0, 10)
        if (buckets.has(key)) {
            buckets.set(key, (buckets.get(key) || 0) + (Number(p.amount) || 0))
        }
    }

    // PaymentChart expects items like { month: string, amount: number }
    return labels.map((key) => {
        const d = new Date(key)
        const label = d.toLocaleDateString(undefined, { month: "short", day: "2-digit" }) // e.g., "Oct 05"
        return { month: label, amount: Math.round((buckets.get(key) || 0) * 100) / 100 }
    })
}

/* ========================= Component ========================= */

export default function AdminAnalyticsPage() {
    const [{ loading, error, kpis, series30d, pieByMethod, pieByRole, todaySeries }, setState] = useState<{
        loading: boolean
        error: string | null
        kpis: {
            totalUsers: number
            activeUsers: number
            totalPayments: number
            revenue: number
            pending: number
        }
        series30d: Array<{ month: string; amount: number }>
        pieByMethod: Array<{ name: string; value: number }>
        pieByRole: Array<{ name: string; value: number }>
        todaySeries: Array<{ month: string; amount: number }>
    }>({
        loading: true,
        error: null,
        kpis: { totalUsers: 0, activeUsers: 0, totalPayments: 0, revenue: 0, pending: 0 },
        series30d: [],
        pieByMethod: [],
        pieByRole: [],
        todaySeries: [],
    })

    useEffect(() => {
        let alive = true

        async function load() {
            try {
                const { DB_ID, USERS_COL_ID, PAYMENTS_COL_ID } = getIds()
                if (!DB_ID || !USERS_COL_ID || !PAYMENTS_COL_ID) {
                    throw new Error("Missing Appwrite env IDs. Please set DB / USERS / PAYMENTS collection IDs.")
                }

                // Users
                const users = await listAllUsers()
                const totalUsers = users.length
                const activeUsers = users.filter((u) => String(u.status || "").toLowerCase() === "active").length

                const rolePie = groupCount(users, (u) => {
                    const r = String(u.role || "student")
                    if (r === "business_office" || r === "businessoffice") return "business-office"
                    return r
                }).map((x) => ({
                    name: x.name === "business-office" ? "Business Office" : x.name.charAt(0).toUpperCase() + x.name.slice(1),
                    value: x.value,
                }))

                // Payments (last 30d for charts + KPI totals from all returned)
                const since30 = daysAgoISO(29)
                const last30 = await listPaymentsSince(since30)

                // Today hourly series
                const today = await listTodayPayments()
                const hourly = paymentsToHourlySeries(today).map((h) => ({ month: h.label, amount: h.amount }))

                // KPI revenue & counts
                const revenue = sumCompletedAmount(last30) // last 30 days revenue
                const totalPayments = last30.length
                const pending = last30.filter((p) => p.status === "Pending").length

                // 30d daily amount series
                const series = paymentsToDailyAmountSeries(last30, 30)

                // Payment method distribution (counts in last 30d)
                const byMethod = groupCount(last30, (p) => {
                    const v = String(p.method || "").toLowerCase()
                    if (v.includes("gcash") || v.includes("maya") || v.includes("grab")) return "e-wallet"
                    if (v.includes("bank")) return "online-banking"
                    if (v.includes("credit") || v.includes("debit")) return "credit-card"
                    if (v.includes("card")) return "card"
                    if (v.includes("cash")) return "cash"
                    return v || "other"
                }).map(({ name, value }) => ({
                    name: name === "online-banking" ? "Online Banking" : name.replace(/\b\w/g, (m) => m.toUpperCase()),
                    value,
                }))

                if (!alive) return
                setState({
                    loading: false,
                    error: null,
                    kpis: { totalUsers, activeUsers, totalPayments, revenue, pending },
                    series30d: series,
                    pieByMethod: byMethod,
                    pieByRole: rolePie,
                    todaySeries: hourly,
                })
            } catch (e: any) {
                if (!alive) return
                setState((s) => ({ ...s, loading: false, error: e?.message || "Failed to load analytics." }))
            }
        }

        load()
        return () => {
            alive = false
        }
    }, [])

    const kpiCards = useMemo(
        () => [
            { label: "Total Users", value: `${kpis.totalUsers}` },
            { label: "Active Users", value: `${kpis.activeUsers}` },
            { label: "Payments (30d)", value: `${kpis.totalPayments}` },
            { label: "Revenue (30d)", value: `${peso(kpis.revenue)}` },
        ],
        [kpis]
    )

    return (
        <DashboardLayout allowedRoles={["admin"]}>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-white">Analytics</h1>
                    <p className="text-gray-300">Live metrics from Users & Payments</p>
                </div>

                {/* Errors / Loading */}
                {error ? (
                    <Card className="bg-red-950/40 border-red-800 text-red-200 mb-6">
                        <CardContent className="py-4 text-sm">{error}</CardContent>
                    </Card>
                ) : null}

                {/* KPIs */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                    {kpiCards.map((k) => (
                        <Card key={k.label} className="bg-slate-800/60 border-slate-700 text-white">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">{k.label}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{loading ? "…" : k.value}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader>
                            <CardTitle>Payments — Last 30 Days</CardTitle>
                            <CardDescription className="text-gray-300">Sum of Completed/Succeeded per day</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-72">
                                {loading ? (
                                    <div className="text-gray-400 text-sm">Loading…</div>
                                ) : (
                                    <PaymentChart data={series30d} />
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader>
                            <CardTitle>Payment Methods (30d)</CardTitle>
                            <CardDescription className="text-gray-300">Count by method</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-72">
                                {loading ? (
                                    <div className="text-gray-400 text-sm">Loading…</div>
                                ) : (
                                    <PaymentPieChart data={pieByMethod} />
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row 2 */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader>
                            <CardTitle>Users by Role</CardTitle>
                            <CardDescription className="text-gray-300">Distribution across roles</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-72">
                                {loading ? (
                                    <div className="text-gray-400 text-sm">Loading…</div>
                                ) : (
                                    <PaymentPieChart data={pieByRole} />
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader>
                            <CardTitle>Today — Hourly Amount</CardTitle>
                            <CardDescription className="text-gray-300">Completed/Succeeded totals per hour</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-72">
                                {loading ? (
                                    <div className="text-gray-400 text-sm">Loading…</div>
                                ) : (
                                    <PaymentChart data={todaySeries} />
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    )
}
