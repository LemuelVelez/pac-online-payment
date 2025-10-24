/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useMemo, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CreditCard, Wallet, Search, CheckCircle, Loader2, Download as DownloadIcon } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PaymentReceipt } from "@/components/payment/payment-receipt"
import {
    UserProfileDoc,
    getStudentByStudentId,
    listUserPayments,
    verifyPendingPaymentAndIssueReceipt,
    recordCounterPaymentAndReceipt,
} from "@/lib/appwrite-cashier"
import { getCurrentUserSafe, getDatabases, getEnvIds, Query } from "@/lib/appwrite"
import type { PaymentDoc } from "@/lib/appwrite-payments"
import { getPaidTotal } from "@/lib/appwrite-payments"
import { toast } from "sonner"

/** Fee plan selector & table (same as make-payment) */
import { listAllFeePlans, computeTotals, type FeePlanDoc } from "@/lib/fee-plan"
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"

type FeeKey = "tuition" | "laboratory" | "library" | "miscellaneous"
type FeePlanLegacy = Partial<Record<FeeKey | "total", number>>

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

export default function CashierPaymentsPage() {
    const [studentId, setStudentId] = useState("")
    const [student, setStudent] = useState<UserProfileDoc | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    /** Legacy per-fee plan from the student profile (same idea as make-payment) */
    const [feePlanLegacy, setFeePlanLegacy] = useState<FeePlanLegacy | null>(null)

    const [pending, setPending] = useState<PaymentDoc[]>([])
    const [selectedFees, setSelectedFees] = useState<FeeKey[]>([])
    /** IMPORTANT: restrict to allowed enum values for Appwrite */
    const [method, setMethod] = useState<"cash" | "credit-card">("cash")
    const [amount, setAmount] = useState("")

    const [processing, setProcessing] = useState(false)
    const [showReceipt, setShowReceipt] = useState(false)
    const [receiptData, setReceiptData] = useState<any>(null)

    /** Plan breakdown (mirrors make-payment) */
    const [activePlans, setActivePlans] = useState<FeePlanDoc[]>([])
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
    const [paidTotalAll, setPaidTotalAll] = useState(0) // total previously paid for (courseId, yearId)

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

    /** Prefer NEW plan total; fall back to legacy profile total if present */
    const legacyTotal = useMemo(() => {
        const legacy =
            student?.feePlan && Object.keys(student.feePlan).length > 0
                ? (student.feePlan as FeePlanLegacy)
                : typeof student?.totalFees === "number"
                    ? { total: student.totalFees }
                    : null
        return legacy?.total
    }, [student])

    const totalFees =
        typeof selectedPlanTotals?.total === "number"
            ? selectedPlanTotals.total
            : typeof legacyTotal === "number"
                ? legacyTotal
                : undefined

    const currentBalance =
        typeof totalFees === "number"
            ? Math.max(0, totalFees - (Number(paidTotalAll) || 0))
            : undefined

    const selectedFeesTotal = useMemo(() => {
        if (!feePlanLegacy) return 0
        return selectedFees.reduce((sum, k) => sum + (feePlanLegacy[k] ?? 0), 0)
    }, [feePlanLegacy, selectedFees])

    const showLegacyBreakdown =
        !selectedPlan &&
        !!feePlanLegacy &&
        (typeof feePlanLegacy.tuition === "number" ||
            typeof feePlanLegacy.laboratory === "number" ||
            typeof feePlanLegacy.library === "number" ||
            typeof feePlanLegacy.miscellaneous === "number")

    const lineItemsFromPayment = (p: PaymentDoc): { description: string; amount: string }[] => {
        const amount = Number(p.amount) || 0
        const fees = Array.isArray(p.fees) && p.fees.length ? p.fees : ["miscellaneous"]
        const share = fees.length ? amount / fees.length : amount
        return fees.map((f) => ({
            description: f[0].toUpperCase() + f.slice(1),
            amount: `₱${Number(share).toLocaleString()}`,
        }))
    }

    /** Load a student and hydrate plan data + paid totals */
    const loadStudent = async (id: string) => {
        setError("")
        setLoading(true)
        try {
            const s = await getStudentByStudentId(id.trim())
            setStudent(s)
            if (!s) {
                setFeePlanLegacy(null)
                setPending([])
                setActivePlans([])
                setSelectedPlanId(null)
                setPaidTotalAll(0)
                toast.error("Student not found", { description: `No record for "${id.trim()}"` })
                return
            }

            // Legacy per-fee plan for OTC (same concept as make-payment)
            const legacy: FeePlanLegacy | null =
                s.feePlan && Object.keys(s.feePlan).length > 0
                    ? (s.feePlan as FeePlanLegacy)
                    : typeof s.totalFees === "number"
                        ? { total: s.totalFees }
                        : null
            setFeePlanLegacy(legacy)

            const pend = await listUserPayments(s.$id, ["Pending"])
            setPending(pend)

            // Default selected fees (like make-payment): pick all legacy fee keys that exist
            if (legacy) {
                const keys = (["tuition", "laboratory", "library", "miscellaneous"] as FeeKey[]).filter(
                    (k) => typeof legacy[k] === "number"
                )
                setSelectedFees(keys)
            } else {
                setSelectedFees([])
            }

            setAmount("")

            // Hydrate plan data + paid totals (same as make-payment)
            const normCourse = normalizeCourseId(s.courseId ?? s.course)
            const normYear = normalizeYearId(s.yearId ?? s.yearLevel)
            if (normCourse && normYear) {
                const paid = await getPaidTotal(s.$id, normCourse, normYear)
                setPaidTotalAll(paid)
            } else {
                setPaidTotalAll(0)
            }

            const plans = await listAllFeePlans()
            const onlyActive = plans.filter((p) => p.isActive !== false)
            setActivePlans(onlyActive)

            // Prefer plans matching the student's course (BSED/BSCS/...) if any
            const courseCodeMap: Record<NonNullable<UserProfileDoc["courseId"]>, string> = {
                bsed: "BSED",
                bscs: "BSCS",
                bssw: "BSSW",
                bsit: "BSIT",
            }
            const courseLabel = normCourse ? courseCodeMap[normCourse] : undefined
            const preferred = courseLabel
                ? onlyActive.filter((p) => p.program?.toLowerCase().includes(courseLabel.toLowerCase()))
                : onlyActive

            if (preferred.length > 0) setSelectedPlanId(preferred[0].$id)
            else if (onlyActive.length === 1) setSelectedPlanId(onlyActive[0].$id)
            else setSelectedPlanId(null)

            toast.success("Student loaded", {
                description: `${s.fullName ?? "Student"} • ${s.studentId ?? s.$id}`,
            })
        } catch (e: any) {
            const msg = e?.message ?? "Lookup failed."
            setError(msg)
            toast.error("Lookup failed", { description: msg })
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = () => {
        if (!studentId.trim()) {
            toast.error("Enter a Student ID")
            return
        }
        void loadStudent(studentId)
    }

    /** Read receipt items from collection; fallback to payment fees */
    const loadReceiptItems = async (receiptId: string, fallbackPayment?: PaymentDoc) => {
        const RECEIPT_ITEMS_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_RECEIPT_ITEMS_COLLECTION_ID as
            | string
            | undefined
        try {
            const { DB_ID } = getEnvIds()
            if (!RECEIPT_ITEMS_COL_ID || !DB_ID) throw new Error("no-items-collection")
            const db = getDatabases()
            const itemsRes = await db.listDocuments<any>(DB_ID, RECEIPT_ITEMS_COL_ID, [
                Query.equal("receipts", receiptId),
                Query.limit(100),
            ])
            const items = (itemsRes?.documents ?? []).map((i: any) => {
                const qty = Number(i.quantity ?? 1) || 1
                const subtotal = Number(i.amount || 0) * qty
                return {
                    description: qty > 1 ? `${i.label} × ${qty}` : i.label,
                    amount: `₱${subtotal.toLocaleString()}`,
                }
            })
            if (items.length) return items
            throw new Error("empty-items")
        } catch {
            if (fallbackPayment) return lineItemsFromPayment(fallbackPayment)
            return []
        }
    }

    const onVerify = async (paymentId: string) => {
        setProcessing(true)
        setError("")
        try {
            const res = await verifyPendingPaymentAndIssueReceipt(paymentId)
            const items = await loadReceiptItems(res.receipt.$id, res.payment)

            setReceiptData({
                receiptNumber: res.receipt.$id,
                date: new Date(res.receipt.issuedAt).toISOString().split("T")[0],
                studentId: student?.studentId ?? student?.$id,
                studentName: student?.fullName ?? "",
                paymentMethod: "Online",
                items,
                total: `₱${Number(res.receipt.total || 0).toLocaleString()}`,
                downloadUrl: res.receiptUrl ?? null,
            })
            setShowReceipt(true)
            await loadStudent(studentId)
            toast.success("Payment verified", {
                description: res.receiptUrl ? "Receipt sent to student." : "Receipt issued.",
            })
        } catch (e: any) {
            const msg = e?.message ?? "Verification failed."
            setError(msg)
            toast.error("Verification failed", { description: msg })
        } finally {
            setProcessing(false)
        }
    }

    const onCounterPayment = async () => {
        if (!student || !amount) return
        setProcessing(true)
        setError("")
        try {
            const me = await getCurrentUserSafe()
            if (!me) throw new Error("No cashier session.")
            const amt = Number.parseFloat(amount)
            if (!Number.isFinite(amt) || amt <= 0) throw new Error("Enter a valid amount.")

            const cId = (student.courseId ?? normalizeCourseId(student.course)) as any
            const yId = (student.yearId ?? normalizeYearId(student.yearLevel)) as any
            if (!cId || !yId) throw new Error("Missing course/year on student profile.")

            // method is strictly "cash" or "credit-card" to satisfy Appwrite enum
            const methodToPersist = method

            const res = await recordCounterPaymentAndReceipt({
                userId: student.$id,
                courseId: cId,
                yearId: yId,
                amount: amt,
                // If a plan is in use (cashier used plan total/balance), tag all fees like online does
                fees: selectedPlan ? (["tuition", "laboratory", "library", "miscellaneous"] as any) : selectedFees,
                method: methodToPersist,
            })

            const items = await loadReceiptItems(res.receipt.$id, res.payment)

            setReceiptData({
                receiptNumber: res.receipt.$id,
                date: new Date(res.receipt.issuedAt).toISOString().split("T")[0],
                studentId: student.studentId ?? student.$id,
                studentName: student.fullName ?? "",
                paymentMethod: methodToPersist === "cash" ? "Cash" : "Credit/Debit Card",
                items,
                total: `₱${Number(res.receipt.total || 0).toLocaleString()}`,
                downloadUrl: res.receiptUrl ?? null,
            })
            setShowReceipt(true)
            await loadStudent(studentId)
            setAmount("")
            toast.success("Counter payment recorded", {
                description: res.receiptUrl ? "Receipt sent to student." : "Receipt issued.",
            })
        } catch (e: any) {
            const msg = e?.message ?? "Failed to record payment."
            setError(msg)
            toast.error("Recording failed", { description: msg })
        } finally {
            setProcessing(false)
        }
    }

    const handleFeeToggle = (fee: FeeKey) => {
        setSelectedFees((prev) => (prev.includes(fee) ? prev.filter((f) => f !== fee) : [...prev, fee]))
    }

    const fillSelectedTotal = () => {
        const val = selectedFeesTotal ? String(selectedFeesTotal) : ""
        setAmount(val)
        if (val) toast.info("Amount filled", { description: `Using selected fees total: ₱${selectedFeesTotal.toLocaleString()}` })
    }

    /** Helpers to fill amount from plan total or current balance */
    const usePlanTotal = () => {
        if (typeof totalFees === "number") {
            setAmount(String(totalFees))
            toast.info("Amount filled", { description: `Using plan total: ₱${totalFees.toLocaleString()}` })
        }
    }
    const usePlanBalance = () => {
        if (typeof currentBalance === "number") {
            setAmount(String(currentBalance))
            toast.info("Amount filled", { description: `Using current balance: ₱${currentBalance.toLocaleString()}` })
        }
    }

    const resetFlow = () => {
        setShowReceipt(false)
        setReceiptData(null)
    }

    return (
        <DashboardLayout allowedRoles={["cashier"]}>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white">Process Payment</h1>
                    <p className="text-gray-300">Accept, verify, and receipt student payments</p>
                </div>

                {error && (
                    <Alert className="mb-6 bg-red-500/20 border-red-500/50 text-red-200">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {!showReceipt ? (
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Student Information</CardTitle>
                                    <CardDescription className="text-gray-300">Search for student by Student ID or User ID</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex gap-2">
                                        <Input
                                            id="student-search"
                                            placeholder="Enter Student ID (e.g., 2025-00123)"
                                            value={studentId}
                                            onChange={(e) => setStudentId(e.target.value)}
                                            className="bg-slate-700 border-slate-600"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") handleSearch()
                                            }}
                                        />
                                        <Button onClick={handleSearch} disabled={!studentId || loading} className="bg-primary hover:bg-primary/90" title="Search">
                                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                        </Button>
                                    </div>

                                    {student && (
                                        <div className="mt-6 space-y-4">
                                            <Separator className="bg-slate-700" />
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm text-gray-400">Name</p>
                                                    <p className="font-medium">{student.fullName}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-400">Student ID</p>
                                                    <p className="font-medium">{student.studentId ?? student.$id}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-400">Course</p>
                                                    <p className="font-medium">{student.course ?? student.courseId?.toUpperCase()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-400">Year Level</p>
                                                    <p className="font-medium">
                                                        {student.yearLevel ?? (student.yearId ? `${student.yearId}th` : "—")}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Fee Plan & Balance (mirrors make-payment) */}
                            {student && (
                                <Card className="bg-slate-800/60 border-slate-700 text-white">
                                    <CardHeader>
                                        <CardTitle>Fee Plan &amp; Balance</CardTitle>
                                        <CardDescription className="text-gray-300">
                                            Choose an active fee plan to view the detailed breakdown and current balance.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {activePlans.length === 0 ? (
                                            <div className="text-sm text-gray-300">
                                                No active fee plans available. If the student has a legacy fee plan total, you can still proceed.
                                            </div>
                                        ) : (
                                            <>
                                                <div className="max-w-md">
                                                    <Label className="mb-1 block">Active plans</Label>
                                                    <Select
                                                        value={selectedPlanId ?? ""}
                                                        onValueChange={(v) => {
                                                            setSelectedPlanId(v)
                                                            const picked = activePlans.find((p) => p.$id === v)
                                                            if (picked) {
                                                                const t = computeTotals({
                                                                    units: picked.units,
                                                                    tuitionPerUnit: picked.tuitionPerUnit,
                                                                    registrationFee: picked.registrationFee,
                                                                    feeItems: picked.feeItems,
                                                                })
                                                                toast.success("Plan selected", {
                                                                    description: `${picked.program} • ₱${t.total.toLocaleString()}`,
                                                                })
                                                            }
                                                        }}
                                                    >
                                                        <SelectTrigger className="bg-slate-700 border-slate-600">
                                                            <SelectValue placeholder="Select a plan…" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                                            {activePlans.map((p) => {
                                                                const totals = computeTotals({
                                                                    units: p.units,
                                                                    tuitionPerUnit: p.tuitionPerUnit,
                                                                    registrationFee: p.registrationFee,
                                                                    feeItems: p.feeItems,
                                                                })
                                                                return (
                                                                    <SelectItem key={p.$id} value={p.$id} className="cursor-pointer">
                                                                        {p.program} — ₱{totals.total.toLocaleString()}
                                                                    </SelectItem>
                                                                )
                                                            })}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {selectedPlan && selectedPlanTotals && (
                                                    <div className="mt-4">
                                                        <div className="text-sm mb-2 text-gray-300">
                                                            Plan: <span className="font-medium text-white">{selectedPlan.program}</span>
                                                        </div>
                                                        <div className="overflow-hidden rounded-md border border-slate-700">
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow>
                                                                        <TableHead>Description</TableHead>
                                                                        <TableHead className="text-right">Amount</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    <TableRow>
                                                                        <TableCell>Registration Fee</TableCell>
                                                                        <TableCell className="text-right">
                                                                            ₱{selectedPlan.registrationFee.toLocaleString()}
                                                                        </TableCell>
                                                                    </TableRow>
                                                                    <TableRow>
                                                                        <TableCell>
                                                                            Tuition Per Unit × Units ({selectedPlan.units} × ₱{selectedPlan.tuitionPerUnit.toLocaleString()})
                                                                        </TableCell>
                                                                        <TableCell className="text-right">₱{selectedPlanTotals.tuition.toLocaleString()}</TableCell>
                                                                    </TableRow>
                                                                    {selectedPlan.feeItems.map((f) => (
                                                                        <TableRow key={f.id}>
                                                                            <TableCell>{f.name}</TableCell>
                                                                            <TableCell className="text-right">₱{Number(f.amount || 0).toLocaleString()}</TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                    <TableRow>
                                                                        <TableCell className="font-medium">TOTAL</TableCell>
                                                                        <TableCell className="text-right font-semibold">
                                                                            ₱{selectedPlanTotals.total.toLocaleString()}
                                                                        </TableCell>
                                                                    </TableRow>
                                                                </TableBody>
                                                            </Table>
                                                        </div>

                                                        {/* Balance facts from plan total vs paid */}
                                                        <div className="mt-3 text-sm text-gray-300 space-y-1">
                                                            <p>
                                                                Total fees:{" "}
                                                                <span className="text-white">
                                                                    ₱{(selectedPlanTotals.total ?? 0).toLocaleString()}
                                                                </span>
                                                            </p>
                                                            <p>
                                                                Previously paid:{" "}
                                                                <span className="text-white">₱{(paidTotalAll ?? 0).toLocaleString()}</span>
                                                            </p>
                                                            <p>
                                                                Current balance:{" "}
                                                                <span className="text-white">
                                                                    ₱{(currentBalance ?? 0).toLocaleString()}
                                                                </span>
                                                            </p>
                                                        </div>

                                                        <div className="mt-3 flex flex-wrap gap-2">
                                                            <Button variant="outline" className="border-slate-600" onClick={usePlanTotal}>
                                                                Use plan total
                                                            </Button>
                                                            {typeof currentBalance === "number" && (
                                                                <Button variant="outline" className="border-slate-600" onClick={usePlanBalance}>
                                                                    Use current balance
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Pending online payments */}
                            {student && pending.length > 0 && (
                                <Card className="bg-slate-800/60 border-slate-700 text-white">
                                    <CardHeader>
                                        <CardTitle>Pending Online Payments</CardTitle>
                                        <CardDescription className="text-gray-300">Verify and issue receipts</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {pending.map((p) => (
                                                <div key={p.$id} className="flex items-center justify-between rounded-lg border border-slate-700 p-3">
                                                    <div>
                                                        <div className="font-medium">
                                                            {Array.isArray(p.fees) && p.fees.length ? p.fees.join(", ") : "Payment"} — ₱
                                                            {Number(p.amount || 0).toLocaleString()}
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            Ref: {p.reference} • {new Date(p.$createdAt).toLocaleString()} • Method: {p.method}
                                                        </div>
                                                        {p.planId ? <div className="text-xs text-gray-400 mt-1">Plan: {p.planId}</div> : null}
                                                    </div>
                                                    <Button onClick={() => onVerify(p.$id)} disabled={processing} title="Verify payment and issue receipt">
                                                        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Issue Receipt"}
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Over-the-Counter payment (mirrors make-payment legacy flow) */}
                            {student && (
                                <Card className="bg-slate-800/60 border-slate-700 text-white">
                                    <CardHeader>
                                        <CardTitle>Over-the-Counter Payment</CardTitle>
                                        <CardDescription className="text-gray-300">
                                            Record cash/card payment and issue receipt
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {/* Show legacy per-fee selection only when no plan is selected and legacy has per-fee amounts */}
                                            {showLegacyBreakdown ? (
                                                <>
                                                    <div className="space-y-4">
                                                        {(
                                                            [
                                                                { key: "tuition", label: "Tuition Fee" },
                                                                { key: "laboratory", label: "Laboratory Fee" },
                                                                { key: "library", label: "Library Fee" },
                                                                { key: "miscellaneous", label: "Miscellaneous (Other Fees)" },
                                                            ] as { key: FeeKey; label: string }[]
                                                        ).map(
                                                            (item) =>
                                                                typeof feePlanLegacy?.[item.key] === "number" && (
                                                                    <div className="flex items-center space-x-2" key={item.key}>
                                                                        <Checkbox
                                                                            id={item.key}
                                                                            checked={selectedFees.includes(item.key)}
                                                                            onCheckedChange={() => handleFeeToggle(item.key)}
                                                                            className="cursor-pointer"
                                                                        />
                                                                        <div className="grid gap-1.5 leading-none">
                                                                            <label
                                                                                htmlFor={item.key}
                                                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                                            >
                                                                                {item.label}
                                                                            </label>
                                                                            <p className="text-sm text-gray-400">₱{feePlanLegacy![item.key]!.toLocaleString()}</p>
                                                                        </div>
                                                                    </div>
                                                                )
                                                        )}
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <div className="text-sm text-gray-400">
                                                            Selected fees total: ₱{selectedFeesTotal.toLocaleString()}
                                                        </div>
                                                        <Button type="button" variant="outline" className="border-slate-600" onClick={fillSelectedTotal}>
                                                            Use selected total
                                                        </Button>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="rounded-md border border-slate-700 bg-slate-900/50 p-3 text-sm text-gray-300">
                                                    {selectedPlan
                                                        ? (
                                                            <>
                                                                A fee plan is selected above. You can{" "}
                                                                <span className="font-medium text-white">Use plan total</span> or{" "}
                                                                <span className="font-medium text-white">Use current balance</span>, or enter a custom amount below.
                                                            </>
                                                        )
                                                        : "No per-fee breakdown is available. Enter a custom amount below."}
                                                </div>
                                            )}

                                            <div className="grid gap-3 md:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label>Amount (₱)</Label>
                                                    <Input
                                                        type="number"
                                                        className="bg-slate-700 border-slate-600"
                                                        value={amount}
                                                        onChange={(e) => setAmount(e.target.value)}
                                                        placeholder="Enter amount to apply"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Payment Method</Label>
                                                    <RadioGroup
                                                        value={method}
                                                        onValueChange={(v) => setMethod(v as "cash" | "credit-card")}
                                                        className="flex gap-4"
                                                    >
                                                        <div className="flex items-center space-x-2 rounded-lg border border-slate-700 p-3 hover:bg-slate-700/50">
                                                            <RadioGroupItem value="cash" id="cash" />
                                                            <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer">
                                                                <Wallet className="h-5 w-5" /> Cash
                                                            </Label>
                                                        </div>
                                                        <div className="flex items-center space-x-2 rounded-lg border border-slate-700 p-3 hover:bg-slate-700/50">
                                                            <RadioGroupItem value="credit-card" id="credit-card" />
                                                            <Label htmlFor="credit-card" className="flex items-center gap-2 cursor-pointer">
                                                                <CreditCard className="h-5 w-5" /> Credit/Debit Card
                                                            </Label>
                                                        </div>
                                                    </RadioGroup>
                                                </div>
                                            </div>

                                            <Button
                                                className="w-full bg-primary hover:bg-primary/90"
                                                onClick={onCounterPayment}
                                                disabled={processing || !amount || Number.parseFloat(amount) <= 0}
                                                title="Record payment and issue receipt"
                                            >
                                                {processing ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Recording…
                                                    </>
                                                ) : (
                                                    "Record Payment & Issue Receipt"
                                                )}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        <div>
                            <Card className="bg-slate-800/60 border-slate-700 text-white sticky top-4">
                                <CardHeader>
                                    <CardTitle>Receipt Preview</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {!showReceipt ? (
                                        <div className="text-gray-400">
                                            No receipt yet. Verify a pending payment or record a counter payment.
                                        </div>
                                    ) : (
                                        <Card className="bg-white text-slate-900">
                                            <CardContent className="p-0">
                                                <div className="bg-green-500 p-6 text-white text-center">
                                                    <CheckCircle className="h-12 w-12 mx-auto mb-2" />
                                                    <h2 className="text-xl font-bold">Receipt Issued</h2>
                                                    <p>
                                                        The receipt has been generated{receiptData?.downloadUrl ? " and sent to the student." : "."}
                                                    </p>
                                                </div>
                                                {receiptData && (
                                                    <div className="p-6">
                                                        <PaymentReceipt
                                                            receiptNumber={receiptData.receiptNumber}
                                                            date={receiptData.date}
                                                            studentId={receiptData.studentId}
                                                            studentName={receiptData.studentName}
                                                            paymentMethod={receiptData.paymentMethod}
                                                            items={receiptData.items}
                                                            total={receiptData.total}
                                                        />
                                                        <div className="mt-4 flex flex-wrap gap-3">
                                                            <Button variant="outline" className="border-slate-600" onClick={() => window.print()}>
                                                                Print
                                                            </Button>
                                                            {receiptData.downloadUrl ? (
                                                                <a
                                                                    href={receiptData.downloadUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex"
                                                                    title="Open/download the receipt file"
                                                                >
                                                                    <Button variant="outline" className="border-slate-600">
                                                                        <DownloadIcon className="mr-2 h-4 w-4" />
                                                                        Download
                                                                    </Button>
                                                                </a>
                                                            ) : null}
                                                            <Button onClick={resetFlow}>OK</Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                ) : null}
            </div>
        </DashboardLayout>
    )
}
