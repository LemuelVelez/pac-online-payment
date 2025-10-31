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
import { Badge } from "@/components/ui/badge"
import type { UserRole } from "@/components/auth/auth-provider"

import { getCurrentUserSafe, getDatabases, getEnvIds, Query } from "@/lib/appwrite"
import { getPaidTotal, type PaymentDoc } from "@/lib/appwrite-payments"
import { listAllFeePlans, computeTotals, type FeePlanDoc } from "@/lib/fee-plan"
import type { Models } from "appwrite"

type FeeKey = "tuition" | "laboratory" | "library" | "miscellaneous"
type FeePlanLegacy = Partial<Record<FeeKey | "total", number>>

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
    feePlan?: FeePlanLegacy
    totalFees?: number

    /** NEW: persisted selection set from Make Payment */
    selectedPlanId?: string | null
    selectedPlanProgram?: string | null
    selectedPlanUpdatedAt?: string | null
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

function StatusBadge({ status }: { status: string }) {
    const s = (status || "").toLowerCase()

    let classes = "bg-slate-600/30 text-slate-200 border-slate-500/40"
    if (s.includes("success") || s.includes("complete") || s.includes("paid")) {
        classes = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
    } else if (s.includes("pend") || s.includes("process") || s.includes("await") || s.includes("incomplete")) {
        classes = "bg-amber-500/20 text-amber-200 border-amber-500/30"
    } else if (s.includes("fail") || s.includes("declin") || s.includes("cancel") || s.includes("expire") || s.includes("void")) {
        classes = "bg-red-500/20 text-red-200 border-red-500/30"
    } else if (s.includes("refund") || s.includes("reverse") || s.includes("chargeback")) {
        classes = "bg-indigo-500/20 text-indigo-200 border-indigo-500/30"
    }

    return <Badge className={`px-2.5 py-1 text-xs font-medium border ${classes}`}>{status}</Badge>
}

export default function DashboardPage() {
    // UI / Errors
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string>("")

    // Profile-derived info
    const [courseId, setCourseId] = useState<UserProfileDoc["courseId"]>()
    const [yearId, setYearId] = useState<UserProfileDoc["yearId"]>()

    // Payment and plan data (now driven by persisted selection)
    const [paidTotal, setPaidTotal] = useState(0)
    const [activePlans, setActivePlans] = useState<FeePlanDoc[]>([])
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)

    // Legacy fallback (if profile had feePlan/totalFees)
    const [feePlanLegacy, setFeePlanLegacy] = useState<FeePlanLegacy | null>(null)

    // History / charts
    const [paymentHistory, setPaymentHistory] = useState<MonthPoint[]>([])
    const [transactions, setTransactions] = useState<TxnRow[]>([])

    // Keep in sync if user changes plan in another tab
    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === "selectedPlanId") setSelectedPlanId(e.newValue || null)
        }
        if (typeof window !== "undefined") {
            window.addEventListener("storage", onStorage)
            return () => window.removeEventListener("storage", onStorage)
        }
    }, [])

    useEffect(() => {
        ; (async () => {
            try {
                setLoading(true)
                setError("")

                const me = await getCurrentUserSafe()
                if (!me) {
                    setError("No active session.")
                    setLoading(false)
                    return
                }

                // --- Fetch profile for course/year and previously saved selection ---
                const { DB_ID, USERS_COL_ID } = getEnvIds()
                const db = getDatabases()
                const doc = await db.getDocument<UserProfileDoc>(DB_ID, USERS_COL_ID, me.$id).catch(() => null)

                if (!doc) {
                    setError("User profile not found in Appwrite.")
                    setLoading(false)
                    return
                }

                const normalizedCourse = doc.courseId ?? normalizeCourseId(doc.course)
                const normalizedYear = doc.yearId ?? normalizeYearId(doc.yearLevel)
                setCourseId(normalizedCourse)
                setYearId(normalizedYear)

                // Legacy fallback (if present in profile)
                const legacy: FeePlanLegacy | null =
                    doc.feePlan && Object.keys(doc.feePlan).length > 0
                        ? doc.feePlan
                        : typeof doc.totalFees === "number"
                            ? { total: doc.totalFees }
                            : null
                setFeePlanLegacy(legacy)

                // --- Paid total (used in balance+progress) ---
                let paid = 0
                if (normalizedCourse && normalizedYear) {
                    paid = await getPaidTotal(me.$id, normalizedCourse, normalizedYear)
                }
                setPaidTotal(paid)

                // --- Load active fee plans ---
                const allPlans = await listAllFeePlans()
                const onlyActive = allPlans.filter((p) => p.isActive !== false)
                setActivePlans(onlyActive)

                // Determine final selected plan:
                // 1) persisted on profile, 2) localStorage, 3) preferred by course, 4) only active if single
                const courseCodeMap: Record<NonNullable<UserProfileDoc["courseId"]>, string> = {
                    bsed: "BSED",
                    bscs: "BSCS",
                    bssw: "BSSW",
                    bsit: "BSIT",
                }
                const courseLabel = normalizedCourse ? courseCodeMap[normalizedCourse] : undefined
                const preferred = courseLabel
                    ? onlyActive.filter((p) => p.program?.toLowerCase().includes(courseLabel.toLowerCase()))
                    : onlyActive

                const lsId = typeof window !== "undefined" ? window.localStorage.getItem("selectedPlanId") : null
                const persistedId = doc.selectedPlanId || lsId

                let finalId: string | null = null
                if (persistedId && onlyActive.some((p) => p.$id === persistedId)) {
                    finalId = persistedId
                } else if (preferred.length > 0) {
                    finalId = preferred[0].$id
                } else if (onlyActive.length === 1) {
                    finalId = onlyActive[0].$id
                }
                setSelectedPlanId(finalId)

                // --- Pull recent payments for charts and transactions ---
                const paymentsResp = await db.listDocuments<PaymentDoc>(DB_ID, PAYMENTS_COL_ID, [
                    Query.equal("userId", me.$id),
                    Query.orderDesc("$createdAt"),
                    Query.limit(200),
                ])

                const allPayments = paymentsResp.documents
                // Basic transactions table
                const prettyDescription = (p: PaymentDoc) => {
                    const base = p.reference ? `Ref: ${p.reference}` : "Payment"
                    const plan = (p as any).planProgram ? ` • ${String((p as any).planProgram)}` : ""
                    return `${base}${plan}`
                }
                const mapped: TxnRow[] = allPayments.map((d) => ({
                    id: d.reference || d.$id,
                    date: new Date(d.$createdAt).toLocaleDateString(),
                    description: prettyDescription(d),
                    amount: Number(d.amount) || 0,
                    status: d.status,
                }))
                setTransactions(mapped)

                // Current-year monthly totals (Completed/Succeeded)
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
            } finally {
                setLoading(false)
            }
        })()
    }, [])

    // Labels
    const courseLabel = useMemo(() => {
        const map: Record<NonNullable<UserProfileDoc["courseId"]>, string> = {
            bsed: "BSED",
            bscs: "BSCS",
            bssw: "BSSW",
            bsit: "BSIT",
        }
        return courseId ? map[courseId] : "—"
    }, [courseId])

    const yearLabel = useMemo(() => {
        if (!yearId) return "—"
        return ({ "1": "1st", "2": "2nd", "3": "3rd", "4": "4th" } as const)[yearId]
    }, [yearId])

    // Selected plan + totals (primary); legacy fallback
    const selectedPlan = useMemo(
        () => activePlans.find((p) => p.$id === selectedPlanId) ?? null,
        [activePlans, selectedPlanId]
    )

    const selectedPlanTotals = useMemo(() => {
        if (!selectedPlan) return null
        return computeTotals({
            units: selectedPlan.units,
            tuitionPerUnit: selectedPlan.tuitionPerUnit,
            registrationFee: selectedPlan.registrationFee,
            feeItems: selectedPlan.feeItems,
        })
    }, [selectedPlan])

    const totalFees: number | undefined =
        typeof selectedPlanTotals?.total === "number"
            ? selectedPlanTotals.total
            : typeof feePlanLegacy?.total === "number"
                ? feePlanLegacy.total!
                : undefined

    const balance =
        typeof totalFees === "number" ? Math.max(0, totalFees - (isFinite(paidTotal) ? paidTotal : 0)) : undefined
    const progressPct =
        typeof totalFees === "number" && totalFees > 0
            ? Math.min(100, Math.round(((isFinite(paidTotal) ? paidTotal : 0) / totalFees) * 100))
            : undefined

    // Pie data (plan-first, then legacy)
    const pieChartData = useMemo(() => {
        if (selectedPlan && selectedPlanTotals) {
            const rows: { name: string; value: number }[] = []
            rows.push({ name: "Registration", value: Number(selectedPlan.registrationFee || 0) })
            rows.push({ name: "Tuition", value: Number(selectedPlanTotals.tuition || 0) })
            for (const f of selectedPlan.feeItems) {
                rows.push({ name: f.name || "Fee", value: Number(f.amount || 0) })
            }
            return rows.filter((r) => r.value > 0)
        }

        if (feePlanLegacy) {
            const entries = [
                ["Tuition", feePlanLegacy.tuition],
                ["Laboratory", feePlanLegacy.laboratory],
                ["Library", feePlanLegacy.library],
                ["Miscellaneous", feePlanLegacy.miscellaneous],
            ] as const
            return entries
                .filter(([, v]) => typeof v === "number")
                .map(([name, value]) => ({ name, value: Number(value) }))
        }
        return []
    }, [selectedPlan, selectedPlanTotals, feePlanLegacy])

    // Loading gate
    if (loading) {
        return (
            <DashboardLayout allowedRoles={["student"] as UserRole[]}>
                <div className="container mx-auto px-4 py-8">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-white">Student Payment Dashboard</h1>
                        <p className="text-gray-300">Loading dashboard…</p>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

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

                {/* Top metrics */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader>
                            <CardTitle className="text-lg">Total Fees</CardTitle>
                            <CardDescription className="text-gray-300">
                                Uses your plan selection from <span className="font-medium text-white">Make Payment</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center">
                                <div className="mr-4 rounded-lg bg-emerald-500/20 p-3">
                                    <Wallet className="size-6 text-emerald-500" />
                                </div>
                                {/* Allow the text column to actually shrink so the inner scroller can work */}
                                <div className="min-w-0">
                                    {/* H-scroll for long currency */}
                                    <div className="overflow-x-auto max-w-full">
                                        <div className="whitespace-nowrap text-3xl font-bold">
                                            {typeof totalFees === "number" ? `₱${totalFees.toLocaleString()}` : "—"}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-300">
                                        Selected plan total {selectedPlan ? `(${selectedPlan.program})` : ""}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader>
                            <CardTitle className="text-lg">Paid</CardTitle>
                            <CardDescription className="text-gray-300">All completed online/OTC payments</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center">
                                <div className="mr-4 rounded-lg bg-blue-500/20 p-3">
                                    <BookOpen className="size-6 text-blue-400" />
                                </div>
                                {/* Allow shrink so scroller appears on small widths */}
                                <div className="min-w-0">
                                    <div className="overflow-x-auto max-w-full">
                                        <div className="whitespace-nowrap text-3xl font-bold">₱{paidTotal.toLocaleString()}</div>
                                    </div>
                                    <p className="text-sm text-gray-300">
                                        {typeof totalFees === "number" ? `${progressPct ?? 0}% of total` : "—"}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader>
                            <CardTitle className="text-lg">Balance Due</CardTitle>
                            <CardDescription className="text-gray-300">Total minus paid</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center">
                                <div className="mr-4 rounded-lg bg-red-500/20 p-3">
                                    <CreditCard className="size-6 text-red-500" />
                                </div>
                                {/* Fix: min-w-0 enables the inner overflow-x container to take effect */}
                                <div className="min-w-0">
                                    <div className="overflow-x-auto max-w-full">
                                        <div className="whitespace-nowrap text-3xl font-bold">
                                            {typeof balance === "number" ? `₱${balance.toLocaleString()}` : "—"}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-300">
                                        {typeof progressPct === "number" ? `${Math.max(0, 100 - progressPct)}% remaining` : "—"}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions with vertical buttons */}
                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader>
                            <CardTitle className="text-lg">Actions</CardTitle>
                            <CardDescription className="text-gray-300">Make a payment or review receipts</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2">
                            <Button asChild className="w-full cursor-pointer">
                                <Link href="/make-payment">Go to Make Payment</Link>
                            </Button>
                            <Button asChild variant="outline" className="w-full border-slate-600 cursor-pointer">
                                <Link href="/payment-history">View Payment History</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Progress */}
                <Card className="mt-8 mb-8 bg-slate-800/60 border-slate-700 text-white">
                    <CardHeader>
                        <CardTitle>Payment Progress</CardTitle>
                        <CardDescription className="text-gray-300">
                            {typeof progressPct === "number"
                                ? "Track your payment progress for the current semester"
                                : "Pick an active fee plan in Make Payment to enable progress tracking"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Overall Progress</span>
                                <span className="text-sm font-medium">
                                    {typeof progressPct === "number" ? `${progressPct}%` : "—"}
                                </span>
                            </div>
                            <Progress value={progressPct ?? 0} className="h-2 bg-slate-700" />
                            {typeof balance === "number" && balance > 0 && (
                                <Alert className="mt-4 bg-amber-500/20 border-amber-500/50 text-amber-200">
                                    <AlertDescription>
                                        You have a remaining balance of ₱{balance.toLocaleString()}. Please settle your
                                        payments before the deadline.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    {/* Fee Breakdown */}
                    {pieChartData.length > 0 ? (
                        <Card className="bg-slate-800/60 border-slate-700 text-white">
                            <CardHeader>
                                <CardTitle>Fee Breakdown</CardTitle>
                                <CardDescription className="text-gray-300">
                                    {selectedPlan ? `Active plan: ${selectedPlan.program}` : "Legacy fees loaded from profile (fallback)"}
                                </CardDescription>
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
                                <CardDescription className="text-gray-300">
                                    No active fee plan yet. Go to <span className="font-medium text-white">Make Payment</span> to choose one.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80 flex items-center justify-center text-gray-400">
                                    <Button asChild className="cursor-pointer">
                                        <Link href="/make-payment">Choose a Fee Plan</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Payment History */}
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

                {/* Recent Transactions with status badges */}
                <Card className="mt-8 bg-slate-800/60 border-slate-700 text-white">
                    <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                        <CardDescription className="text-gray-300">Latest online / over-the-counter payments</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-hidden overflow-x-auto rounded-lg border border-slate-700">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-700 bg-slate-900/40 text-left text-sm text-gray-300">
                                        <th className="px-4 py-2">Date</th>
                                        <th className="px-4 py-2">Description</th>
                                        <th className="px-4 py-2 text-right">Amount</th>
                                        <th className="px-4 py-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.slice(0, 10).map((t) => (
                                        <tr key={t.id} className="border-b border-slate-800/60">
                                            <td className="px-4 py-2">{t.date}</td>
                                            <td className="px-4 py-2">{t.description}</td>
                                            <td className="px-4 py-2 text-right">₱{t.amount.toLocaleString()}</td>
                                            <td className="px-4 py-2">
                                                <StatusBadge status={t.status} />
                                            </td>
                                        </tr>
                                    ))}
                                    {transactions.length === 0 && (
                                        <tr>
                                            <td className="px-4 py-6 text-center text-gray-400" colSpan={4}>
                                                No transactions yet.
                                            </td>
                                        </tr>
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
