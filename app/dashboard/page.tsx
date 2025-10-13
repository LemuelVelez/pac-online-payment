/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { BadgeCheck, CreditCard, Wallet, BookOpen, GraduationCap } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { PaymentChart } from "@/components/dashboard/payment-chart"
import { PaymentPieChart } from "@/components/dashboard/payment-pie-chart"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { UserRole } from "@/components/auth/auth-provider"

import { getCurrentUserSafe, getDatabases, getEnvIds, Query } from "@/lib/appwrite"
import type { PaymentRecord, PaymentDoc } from "@/lib/appwrite-payments"
import type { Models } from "appwrite"

type FeePlan = {
    tuition?: number
    laboratory?: number
    library?: number
    miscellaneous?: number
    total?: number
}

type UserProfileDoc = Models.Document & {
    userId: string
    email?: string
    fullName?: string
    role?: string
    status?: string
    course?: string
    courseId?: "bsed" | "bscs" | "bssw" | "bsit"
    yearLevel?: "1st" | "2nd" | "3rd" | "4th" | string
    yearId?: "1" | "2" | "3" | "4"
    feePlan?: FeePlan
    totalFees?: number
}

type MonthPoint = { month: string; amount: number }
type TxnRow = { id: string; date: string; description: string; amount: number; status: string }

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const
const PAYMENTS_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_PAYMENTS_COLLECTION_ID as string

function normalizeCourseId(input?: string | null): UserProfileDoc["courseId"] | undefined {
    if (!input) return undefined
    const s = input.toLowerCase()
    if (s.includes("education")) return "bsed"
    if (s.includes("computer science")) return "bscs"
    if (s.includes("social work")) return "bssw"
    if (s.includes("information technology")) return "bsit"
    if (["bsed", "bscs", "bssw", "bsit"].includes(s)) return s as UserProfileDoc["courseId"]
    return undefined
}

function normalizeYearId(input?: string | null): UserProfileDoc["yearId"] | undefined {
    if (!input) return undefined
    const s = input.toLowerCase().trim()
    if (["1", "1st", "first"].includes(s)) return "1"
    if (["2", "2nd", "second"].includes(s)) return "2"
    if (["3", "3rd", "third"].includes(s)) return "3"
    if (["4", "4th", "fourth"].includes(s)) return "4"
    return undefined
}

export default function DashboardPage() {
    const [error, setError] = useState<string>("")
    const [profile, setProfile] = useState<UserProfileDoc | null>(null)

    const [paidTotal, setPaidTotal] = useState<number>(0)
    const [paymentHistory, setPaymentHistory] = useState<MonthPoint[]>([])
    const [transactions, setTransactions] = useState<TxnRow[]>([])

    const courseLabel = profile?.course ?? (profile?.courseId ? profile.courseId.toUpperCase() : "—")
    const yearLabel =
        profile?.yearLevel ?? (profile?.yearId ? ({ "1": "1st", "2": "2nd", "3": "3rd", "4": "4th" } as const)[profile.yearId] : "—")

    const feePlan: FeePlan | undefined = profile?.feePlan ?? (profile?.totalFees ? { total: profile.totalFees } : undefined)
    const totalFees = feePlan?.total
    const balance = totalFees != null ? Math.max(0, (totalFees || 0) - paidTotal) : undefined
    const progressPct = totalFees ? Math.min(100, Math.round((paidTotal / totalFees) * 100)) : undefined

    useEffect(() => {
        ; (async () => {
            setError("")
            try {
                const me = await getCurrentUserSafe()
                if (!me) {
                    setError("No active session.")
                    return
                }

                const { DB_ID, USERS_COL_ID } = getEnvIds()
                const db = getDatabases()
                const doc = await db.getDocument<UserProfileDoc>(DB_ID, USERS_COL_ID, me.$id).catch(() => null)

                const normalized: UserProfileDoc | null = doc
                    ? {
                        ...doc,
                        courseId: doc.courseId ?? normalizeCourseId(doc.course),
                        yearId: doc.yearId ?? normalizeYearId(doc.yearLevel),
                    }
                    : null

                setProfile(normalized)

                // Fetch ALL payments for this user (paginated, unlimited)
                const allPayments = await listAllPaymentsForUser(me.$id)

                // Compute paid total (Completed/Succeeded)
                const isOk = (s: string) => s === "Completed" || s === "Succeeded"
                const paid = normalized?.courseId && normalized?.yearId
                    ? allPayments
                        .filter((p) => p.courseId === normalized.courseId && p.yearId === normalized.yearId && isOk(p.status))
                        .reduce((sum, d) => sum + (Number(d.amount) || 0), 0)
                    : allPayments
                        .filter((p) => isOk(p.status))
                        .reduce((sum, d) => sum + (Number(d.amount) || 0), 0)
                setPaidTotal(paid)

                // Transactions table: show ALL (newest first already by query)
                const mapped: TxnRow[] = allPayments.map((d) => ({
                    id: d.reference || d.$id,
                    date: new Date(d.$createdAt).toLocaleDateString(),
                    description: prettyDescription(d),
                    amount: Number(d.amount) || 0,
                    status: d.status,
                }))
                setTransactions(mapped)

                // Payment history: current year monthly totals
                const now = new Date()
                const year = now.getFullYear()
                const monthly: number[] = Array(12).fill(0)
                for (const p of allPayments) {
                    const created = new Date(p.$createdAt)
                    if ((p.status === "Completed" || p.status === "Succeeded") && created.getFullYear() === year) {
                        monthly[created.getMonth()] += Number(p.amount) || 0
                    }
                }
                setPaymentHistory(MONTH_LABELS.map((m, i) => ({ month: m, amount: monthly[i] })))
            } catch (e: any) {
                setError(e?.message ?? "Failed to load dashboard data.")
            }
        })()
    }, [])

    const pieChartData = useMemo(() => {
        if (!feePlan) return []
        const entries = [
            ["Tuition", feePlan.tuition],
            ["Laboratory", feePlan.laboratory],
            ["Library", feePlan.library],
            ["Miscellaneous", feePlan.miscellaneous],
        ] as const
        return entries
            .filter(([, v]) => typeof v === "number")
            .map(([name, value]) => ({ name, value: value as number }))
    }, [feePlan])

    return (
        <DashboardLayout allowedRoles={["student"] as UserRole[]}>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-6 flex flex-col gap-2">
                    <h1 className="text-2xl font-bold text-white">Student Payment Dashboard</h1>
                    <p className="text-gray-300">Manage your payments and view your payment history</p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="inline-flex items-center gap-2 rounded-md bg-white/5 px-2.5 py-1 text-sm text-white">
                            <GraduationCap className="h-4 w-4" />
                            <span className="font-medium">{courseLabel}</span>
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-md bg-white/5 px-2.5 py-1 text-sm text-white">
                            <BadgeCheck className="h-4 w-4" />
                            <span className="font-medium">Year: {yearLabel}</span>
                        </span>
                    </div>
                </div>

                {error && (
                    <Alert className="mb-6 bg-red-500/20 border-red-500/50 text-red-200">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Total Fees</CardTitle>
                            <CardDescription className="text-gray-300">Configured in your profile</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center">
                                <div className="mr-4 rounded-lg bg-primary/20 p-3">
                                    <BookOpen className="size-6 text-primary" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold">
                                        {typeof totalFees === "number" ? `₱${totalFees.toLocaleString()}` : "Not set"}
                                    </p>
                                    <p className="text-sm text-gray-300">{courseLabel}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Amount Paid</CardTitle>
                            <CardDescription className="text-gray-300">From completed payments</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center">
                                <div className="mr-4 rounded-lg bg-green-500/20 p-3">
                                    <Wallet className="size-6 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold">₱{paidTotal.toLocaleString()}</p>
                                    <p className="text-sm text-gray-300">
                                        {typeof progressPct === "number" ? `${progressPct}% of total fees` : "Awaiting fee setup"}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Balance Due</CardTitle>
                            <CardDescription className="text-gray-300">Total minus paid</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center">
                                <div className="mr-4 rounded-lg bg-red-500/20 p-3">
                                    <CreditCard className="size-6 text-red-500" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold">
                                        {typeof balance === "number" ? `₱${balance.toLocaleString()}` : "—"}
                                    </p>
                                    <p className="text-sm text-gray-300">
                                        {typeof progressPct === "number" ? `${Math.max(0, 100 - progressPct)}% remaining` : "—"}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="mb-8 bg-slate-800/60 border-slate-700 text-white">
                    <CardHeader>
                        <CardTitle>Payment Progress</CardTitle>
                        <CardDescription className="text-gray-300">
                            {typeof progressPct === "number"
                                ? "Track your payment progress for the current semester"
                                : "Set your fee plan in the user profile to enable progress tracking"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Overall Progress</span>
                                <span className="text-sm font-medium">{typeof progressPct === "number" ? `${progressPct}%` : "—"}</span>
                            </div>
                            <Progress value={progressPct ?? 0} className="h-2 bg-slate-700" />
                            {typeof balance === "number" && balance > 0 && (
                                <Alert className="mt-4 bg-amber-500/20 border-amber-500/50 text-amber-200">
                                    <AlertDescription>
                                        You have a remaining balance of ₱{balance.toLocaleString()}. Please settle your payments before the
                                        deadline.
                                    </AlertDescription>
                                </Alert>
                            )}
                            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                                <Link href="/make-payment">
                                    <Button className="w-full bg-primary hover:bg-primary/90">Make a Payment</Button>
                                </Link>
                                <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                                    View Payment Schedule
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {pieChartData.length > 0 ? (
                        <Card className="bg-slate-800/60 border-slate-700 text-white">
                            <CardHeader>
                                <CardTitle>Fee Breakdown</CardTitle>
                                <CardDescription className="text-gray-300">Distribution of configured fees</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80">
                                    <PaymentPieChart data={pieChartData} />
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="bg-slate-800/60 border-slate-700 text-white">
                            <CardHeader>
                                <CardTitle>Fee Breakdown</CardTitle>
                                <CardDescription className="text-gray-300">No fee plan found on your profile.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80 flex items-center justify-center text-gray-400">
                                    Add a <code className="mx-1">feePlan</code> to your user profile to visualize breakdowns.
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader>
                            <CardTitle>Payment History</CardTitle>
                            <CardDescription className="text-gray-300">Monthly payment activity (this year)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80">
                                <PaymentChart data={paymentHistory} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {feePlan && typeof feePlan.total === "number" ? (
                    <Card className="mb-8 bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader>
                            <CardTitle>Fee Details</CardTitle>
                            <CardDescription className="text-gray-300">Breakdown of your configured fees</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-hidden overflow-x-auto rounded-lg border border-slate-700">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-700 bg-slate-900/50 text-left text-sm font-medium text-gray-300">
                                            <th className="px-6 py-3">Fee Type</th>
                                            <th className="px-6 py-3">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700 text-sm">
                                        {[
                                            ["Tuition Fee", feePlan.tuition],
                                            ["Laboratory Fee", feePlan.laboratory],
                                            ["Library Fee", feePlan.library],
                                            ["Miscellaneous (Other Fees)", feePlan.miscellaneous],
                                        ].map(([label, value]) =>
                                            typeof value === "number" ? (
                                                <tr key={label as string}>
                                                    <td className="px-6 py-4 font-medium">{label}</td>
                                                    <td className="px-6 py-4">₱{(value as number).toLocaleString()}</td>
                                                </tr>
                                            ) : null
                                        )}
                                        <tr className="bg-slate-900/30 text-sm font-semibold">
                                            <td className="px-6 py-4">Total</td>
                                            <td className="px-6 py-4">₱{feePlan.total!.toLocaleString()}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                ) : null}

                <Card className="bg-slate-800/60 border-slate-700 text-white">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Recent Transactions</CardTitle>
                            <CardDescription className="text-gray-300">Your payment activities</CardDescription>
                        </div>
                        <Link href="/payment-history" className="text-sm font-medium text-primary hover:underline">
                            View All
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-hidden overflow-x-auto rounded-lg border border-slate-700">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-700 bg-slate-900/50 text-left text-sm font-medium text-gray-300">
                                        <th className="px-6 py-3">Reference ID</th>
                                        <th className="px-6 py-3">Date</th>
                                        <th className="px-6 py-3">Description</th>
                                        <th className="px-6 py-3">Amount</th>
                                        <th className="px-6 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {transactions.length === 0 ? (
                                        <tr className="text-sm text-gray-400">
                                            <td className="px-6 py-4" colSpan={5}>
                                                No transactions yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        transactions.map((t) => (
                                            <tr key={t.id} className="text-sm text-gray-200">
                                                <td className="whitespace-nowrap px-6 py-4 font-medium">{t.id}</td>
                                                <td className="whitespace-nowrap px-6 py-4">{t.date}</td>
                                                <td className="px-6 py-4">{t.description}</td>
                                                <td className="whitespace-nowrap px-6 py-4 font-medium">₱{t.amount.toFixed(2)}</td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-500">
                                                        {t.status}
                                                    </span>
                                                </td>
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

async function listAllPaymentsForUser(userId: string): Promise<PaymentDoc[]> {
    const { DB_ID } = getEnvIds()
    const db = getDatabases()
    const out: PaymentDoc[] = []
    let cursor: string | undefined

    // Fetch in pages of 100 until exhausted
    for (; ;) {
        const queries = [Query.equal("userId", userId), Query.orderDesc("$createdAt"), Query.limit(100)]
        if (cursor) queries.push(Query.cursorAfter(cursor))

        const res = await db.listDocuments<PaymentDoc>(DB_ID, PAYMENTS_COL_ID, queries)
        const docs = res.documents ?? []
        out.push(...docs)
        if (docs.length < 100) break
        cursor = docs[docs.length - 1].$id
    }
    return out
}

/** Helper to make a user-friendly description from a payment record. */
function prettyDescription(d: PaymentRecord) {
    const parts: string[] = []
    if (Array.isArray(d.fees) && d.fees.length) parts.push(d.fees.join(", "))
    if (d.courseId) parts.push(d.courseId.toUpperCase())
    if (d.yearId) parts.push(`Y${d.yearId}`)
    return parts.join(" • ")
}
