/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getDatabases, getEnvIds, Query } from "@/lib/appwrite"
import type { PaymentDoc } from "@/lib/appwrite-payments"

/* ========================= Env & IDs ========================= */

function ids() {
    const { DB_ID, USERS_COL_ID } = getEnvIds()
    const PAYMENTS_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_PAYMENTS_COLLECTION_ID as string
    if (!DB_ID || !USERS_COL_ID || !PAYMENTS_COL_ID) {
        console.warn("[admin-dashboard] Missing Appwrite env IDs.")
    }
    return { DB_ID, USERS_COL_ID, PAYMENTS_COL_ID }
}

/* ========================= Time Helpers ========================= */

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
function startOfMonthISO(d: Date) {
    const x = new Date(d.getFullYear(), d.getMonth(), 1)
    x.setHours(0, 0, 0, 0)
    return x.toISOString()
}
function endOfMonthISO(d: Date) {
    const x = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    x.setHours(23, 59, 59, 999)
    return x.toISOString()
}

function formatPeso(n: number) {
    try {
        return n.toLocaleString("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 2 })
    } catch {
        return `₱${(n || 0).toLocaleString()}`
    }
}

/* ========================= Backend Loaders ========================= */

async function countAllUsers(): Promise<number> {
    const db = getDatabases()
    const { DB_ID, USERS_COL_ID } = ids()

    let total = 0
    let cursor: string | undefined
    for (; ;) {
        const queries: string[] = [Query.orderDesc("$createdAt"), Query.limit(100)]
        if (cursor) queries.push(Query.cursorAfter(cursor))
        const res = await db.listDocuments(DB_ID, USERS_COL_ID, queries)
        const docs = res.documents ?? []
        total += docs.length
        if (docs.length < 100) break
        cursor = docs[docs.length - 1].$id
    }
    return total
}

async function countPendingPayments(): Promise<number> {
    const db = getDatabases()
    const { DB_ID, PAYMENTS_COL_ID } = ids()

    let total = 0
    let cursor: string | undefined
    for (; ;) {
        const queries: string[] = [Query.equal("status", "Pending"), Query.orderDesc("$createdAt"), Query.limit(100)]
        if (cursor) queries.push(Query.cursorAfter(cursor))
        const res = await db.listDocuments<PaymentDoc>(DB_ID, PAYMENTS_COL_ID, queries)
        const docs = res.documents ?? []
        total += docs.length
        if (docs.length < 100) break
        cursor = docs[docs.length - 1].$id
    }
    return total
}

async function sumCompletedBetween(startIso: string, endIso: string): Promise<number> {
    const db = getDatabases()
    const { DB_ID, PAYMENTS_COL_ID } = ids()

    let sum = 0
    let cursor: string | undefined
    for (; ;) {
        const queries: string[] = [
            Query.greaterThanEqual("$createdAt", startIso),
            Query.lessThan("$createdAt", endIso),
            Query.equal("status", ["Completed", "Succeeded"]),
            Query.orderDesc("$createdAt"),
            Query.limit(100),
        ]
        if (cursor) queries.push(Query.cursorAfter(cursor))
        const res = await db.listDocuments<PaymentDoc>(DB_ID, PAYMENTS_COL_ID, queries)
        const docs = res.documents ?? []
        for (const p of docs) sum += Number(p.amount) || 0
        if (docs.length < 100) break
        cursor = docs[docs.length - 1].$id
    }
    return sum
}

/* ========================= Page ========================= */

export default function AdminDashboardPage() {
    const [{ loading, error, stats }, setState] = useState<{
        loading: boolean
        error: string | null
        stats: {
            totalUsers: number
            revenueToday: number
            revenueThisMonth: number
            pendingPayments: number
            refreshedAt?: string
        }
    }>({
        loading: true,
        error: null,
        stats: { totalUsers: 0, revenueToday: 0, revenueThisMonth: 0, pendingPayments: 0, refreshedAt: "" },
    })

    async function load() {
        try {
            setState((s) => ({ ...s, loading: true, error: null }))
            const now = new Date()

            const [users, pending, todaySum, monthSum] = await Promise.all([
                countAllUsers(),
                countPendingPayments(),
                sumCompletedBetween(startOfDayISO(now), endOfDayISO(now)),
                sumCompletedBetween(startOfMonthISO(now), endOfMonthISO(now)),
            ])

            setState({
                loading: false,
                error: null,
                stats: {
                    totalUsers: users,
                    pendingPayments: pending,
                    revenueToday: todaySum,
                    revenueThisMonth: monthSum,
                    refreshedAt: new Date().toLocaleString(),
                },
            })
        } catch (e: any) {
            setState((s) => ({ ...s, loading: false, error: e?.message || "Failed to load dashboard data." }))
        }
    }

    useEffect(() => {
        load()
    }, [])

    return (
        <DashboardLayout allowedRoles={["admin"]}>
            <div className="container mx-auto px-4 py-8 space-y-8">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                    <p className="text-gray-300">Live KPIs from Appwrite</p>
                </div>

                {/* Errors */}
                {error ? (
                    <Card className="bg-red-950/40 border-red-800 text-red-200">
                        <CardContent className="py-3 text-sm">{error}</CardContent>
                    </Card>
                ) : null}

                {/* KPI Grid (minimal UI) */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader className="pb-2">
                            <CardTitle>Total Users</CardTitle>
                            <CardDescription className="text-gray-400">All roles</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="text-3xl font-semibold">{loading ? "…" : stats.totalUsers}</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader className="pb-2">
                            <CardTitle>Revenue Today</CardTitle>
                            <CardDescription className="text-gray-400">Completed / Succeeded</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="text-3xl font-semibold">{loading ? "…" : formatPeso(stats.revenueToday)}</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader className="pb-2">
                            <CardTitle>Revenue This Month</CardTitle>
                            <CardDescription className="text-gray-400">Completed / Succeeded</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="text-3xl font-semibold">{loading ? "…" : formatPeso(stats.revenueThisMonth)}</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader className="pb-2">
                            <CardTitle>Pending Payments</CardTitle>
                            <CardDescription className="text-gray-400">Awaiting action</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="text-3xl font-semibold">{loading ? "…" : stats.pendingPayments}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button className="w-full sm:w-auto" onClick={load} disabled={loading}>
                        {loading ? "Refreshing…" : "Refresh"}
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full sm:w-auto border-slate-600 text-white"
                        asChild
                    >
                        <a href="/admin/reports">Open Reports</a>
                    </Button>
                </div>

                {/* System Status (source of truth is Appwrite Status page) */}
                <Card className="bg-slate-800/60 border-slate-700 text-white">
                    <CardHeader className="pb-2 flex flex-col gap-1">
                        <CardTitle>System Status</CardTitle>
                        <CardDescription className="text-gray-300">
                            Current system health and performance are tracked on the official Appwrite status page.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                className="w-full sm:w-auto"
                                asChild
                            >
                                <a href="https://status.appwrite.online/" target="_blank" rel="noreferrer">
                                    View Live Appwrite Status
                                </a>
                            </Button>
                            <div className="text-xs text-gray-400 self-center sm:self-auto">
                                {stats.refreshedAt ? `Data refreshed: ${stats.refreshedAt}` : null}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
