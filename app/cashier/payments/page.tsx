/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useMemo, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CreditCard, Wallet, Search, CheckCircle, Loader2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PaymentReceipt } from "@/components/payment/payment-receipt"
import {
    UserProfileDoc,
    getStudentByStudentId,
    computeStudentTotals,
    listUserPayments,
    verifyPendingPaymentAndIssueReceipt,
    updateStudentFeePlan,
    recordCounterPaymentAndReceipt,
} from "@/lib/appwrite-cashier"
import { getCurrentUserSafe } from "@/lib/appwrite"
import type { PaymentDoc } from "@/lib/appwrite-payments"

type FeeKey = "tuition" | "laboratory" | "library" | "miscellaneous"

export default function CashierPaymentsPage() {
    const [studentId, setStudentId] = useState("")
    const [student, setStudent] = useState<UserProfileDoc | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const [summary, setSummary] = useState<{
        paidTotal: number
        balanceTotal: number
        paidByFee: Partial<Record<FeeKey, number>>
        balances: Partial<Record<FeeKey, number>>
    } | null>(null)

    const [pending, setPending] = useState<PaymentDoc[]>([])
    const [selectedFees, setSelectedFees] = useState<FeeKey[]>([])
    const [method, setMethod] = useState<"cash" | "card">("cash")
    const [amount, setAmount] = useState("")

    const [feePlanDraft, setFeePlanDraft] = useState<{ tuition?: number; laboratory?: number; library?: number; miscellaneous?: number }>({})
    const [savingPlan, setSavingPlan] = useState(false)

    const [processing, setProcessing] = useState(false)
    const [showReceipt, setShowReceipt] = useState(false)
    const [receiptData, setReceiptData] = useState<any>(null)

    useEffect(() => {
        if (!student) return
        setFeePlanDraft({
            tuition: student.feePlan?.tuition ?? undefined,
            laboratory: student.feePlan?.laboratory ?? undefined,
            library: student.feePlan?.library ?? undefined,
            miscellaneous: student.feePlan?.miscellaneous ?? undefined,
        })
    }, [student])

    const loadStudent = async (id: string) => {
        setError("")
        setLoading(true)
        try {
            const s = await getStudentByStudentId(id.trim())
            setStudent(s)
            if (!s) {
                setSummary(null)
                setPending([])
                return
            }
            const totals = await computeStudentTotals(s.$id, s.feePlan ?? (s.totalFees ? { total: Number(s.totalFees) } : undefined))
            setSummary({
                paidTotal: totals.paidTotal,
                balanceTotal: totals.balanceTotal,
                paidByFee: totals.paidByFee,
                balances: totals.balances,
            })
            const pend = await listUserPayments(s.$id, ["Pending"])
            setPending(pend)
            setSelectedFees((["tuition", "laboratory", "library", "miscellaneous"] as FeeKey[]).filter((k) => (totals.balances as any)[k] > 0))
            setAmount("")
        } catch (e: any) {
            setError(e?.message ?? "Lookup failed.")
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = () => {
        if (!studentId.trim()) return
        void loadStudent(studentId)
    }

    const feePlanTotal = useMemo(() => {
        const t = (feePlanDraft.tuition ?? 0) + (feePlanDraft.laboratory ?? 0) + (feePlanDraft.library ?? 0) + (feePlanDraft.miscellaneous ?? 0)
        return t || 0
    }, [feePlanDraft])

    const savePlan = async () => {
        if (!student) return
        setSavingPlan(true)
        setError("")
        try {
            await updateStudentFeePlan(student.$id, feePlanDraft)
            await loadStudent(student.studentId ?? student.$id)
        } catch (e: any) {
            setError(e?.message ?? "Failed to save fee plan.")
        } finally {
            setSavingPlan(false)
        }
    }

    const onVerify = async (paymentId: string) => {
        setProcessing(true)
        setError("")
        try {
            const res = await verifyPendingPaymentAndIssueReceipt(paymentId)
            setReceiptData({
                receiptNumber: res.receipt.$id,
                date: new Date(res.receipt.issuedAt).toISOString().split("T")[0],
                studentId: student?.studentId ?? student?.$id,
                studentName: student?.fullName ?? "",
                paymentMethod: "Online",
                items: (res.receipt.items as any[]).map((i) => ({ description: i.label, amount: `₱${Number(i.amount).toLocaleString()}` })),
                total: `₱${Number(res.receipt.total || 0).toLocaleString()}`,
            })
            setShowReceipt(true)
            await loadStudent(studentId)
        } catch (e: any) {
            setError(e?.message ?? "Verification failed.")
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

            const courseId = (student.courseId ?? undefined) as any
            const yearId = (student.yearId ?? undefined) as any
            if (!courseId || !yearId) throw new Error("Missing course/year on student profile.")

            const res = await recordCounterPaymentAndReceipt({
                userId: student.$id,
                courseId,
                yearId,
                amount: amt,
                fees: selectedFees,
                method,
            })

            setReceiptData({
                receiptNumber: res.receipt.$id,
                date: new Date(res.receipt.issuedAt).toISOString().split("T")[0],
                studentId: student.studentId ?? student.$id,
                studentName: student.fullName ?? "",
                paymentMethod: method === "cash" ? "Cash" : "Credit/Debit Card",
                items: (res.receipt.items as any[]).map((i) => ({ description: i.label, amount: `₱${Number(i.amount).toLocaleString()}` })),
                total: `₱${Number(res.receipt.total || 0).toLocaleString()}`,
            })
            setShowReceipt(true)
            await loadStudent(studentId)
            setAmount("")
        } catch (e: any) {
            setError(e?.message ?? "Failed to record payment.")
        } finally {
            setProcessing(false)
        }
    }

    const calculateSuggested = () => {
        if (!summary) return 0
        return selectedFees.reduce((s, k) => s + (Number(summary.balances?.[k] ?? 0) || 0), 0)
    }

    const setSuggested = () => {
        const v = calculateSuggested()
        setAmount(v ? String(v) : "")
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
                                        />
                                        <Button onClick={handleSearch} disabled={!studentId || loading} className="bg-primary hover:bg-primary/90">
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
                                                    <p className="font-medium">{student.yearLevel ?? (student.yearId ? `${student.yearId}th` : "—")}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {student && (
                                <Card className="bg-slate-800/60 border-slate-700 text-white">
                                    <CardHeader>
                                        <CardTitle>Fee Plan & Balances</CardTitle>
                                        <CardDescription className="text-gray-300">Set or update balances; totals derive from completed payments</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                            {(["tuition", "laboratory", "library", "miscellaneous"] as FeeKey[]).map((k) => (
                                                <div className="space-y-2" key={k}>
                                                    <Label className="capitalize">{k} (₱)</Label>
                                                    <Input
                                                        type="number"
                                                        className="bg-slate-700 border-slate-600"
                                                        value={feePlanDraft[k] ?? ""}
                                                        onChange={(e) => setFeePlanDraft((s) => ({ ...s, [k]: e.target.value ? Number(e.target.value) : undefined }))}
                                                    />
                                                    <div className="text-xs text-gray-400">
                                                        Paid: ₱{Number(summary?.paidByFee?.[k] ?? 0).toLocaleString()} — Balance: ₱
                                                        {Number(summary?.balances?.[k] ?? 0).toLocaleString()}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-4 flex items-center justify-between">
                                            <div className="text-sm text-gray-400">Plan Total: ₱{feePlanTotal.toLocaleString()}</div>
                                            <Button onClick={savePlan} disabled={savingPlan}>
                                                {savingPlan ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Fee Plan"}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

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
                                                            {Array.isArray(p.fees) && p.fees.length ? p.fees.join(", ") : "Payment"} — ₱{Number(p.amount || 0).toLocaleString()}
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            Ref: {p.reference} • {new Date(p.$createdAt).toLocaleString()} • Method: {p.method}
                                                        </div>
                                                    </div>
                                                    <Button onClick={() => onVerify(p.$id)} disabled={processing}>
                                                        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Issue Receipt"}
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {student && (
                                <Card className="bg-slate-800/60 border-slate-700 text-white">
                                    <CardHeader>
                                        <CardTitle>Over-the-Counter Payment</CardTitle>
                                        <CardDescription className="text-gray-300">Record cash/card payment and issue receipt</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                                                {(["tuition", "laboratory", "library", "miscellaneous"] as FeeKey[]).map((k) => (
                                                    <label key={k} className="flex items-center gap-2 rounded-md border border-slate-700 p-3 hover:bg-slate-700/40">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedFees.includes(k)}
                                                            onChange={(e) =>
                                                                setSelectedFees((prev) => (e.target.checked ? [...prev, k] : prev.filter((x) => x !== k)))
                                                            }
                                                            className="h-4 w-4"
                                                        />
                                                        <span className="capitalize">{k}</span>
                                                        <span className="ml-auto text-xs text-gray-400">
                                                            balance ₱{Number(summary?.balances?.[k] ?? 0).toLocaleString()}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>

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
                                                    <RadioGroup value={method} onValueChange={(v) => setMethod(v as "cash" | "card")} className="flex gap-4">
                                                        <div className="flex items-center space-x-2 rounded-lg border border-slate-700 p-3 hover:bg-slate-700/50">
                                                            <RadioGroupItem value="cash" id="cash" />
                                                            <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer">
                                                                <Wallet className="h-5 w-5" /> Cash
                                                            </Label>
                                                        </div>
                                                        <div className="flex items-center space-x-2 rounded-lg border border-slate-700 p-3 hover:bg-slate-700/50">
                                                            <RadioGroupItem value="card" id="card" />
                                                            <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer">
                                                                <CreditCard className="h-5 w-5" /> Credit/Debit Card
                                                            </Label>
                                                        </div>
                                                    </RadioGroup>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between text-sm text-gray-400">
                                                <div>
                                                    Suggested from selected fees:{" "}
                                                    <span className="text-white">₱{calculateSuggested().toLocaleString()}</span>
                                                </div>
                                                <Button variant="outline" className="border-slate-600" onClick={setSuggested}>
                                                    Use suggested
                                                </Button>
                                            </div>

                                            <Button
                                                className="w-full bg-primary hover:bg-primary/90"
                                                onClick={onCounterPayment}
                                                disabled={processing || !amount || Number.parseFloat(amount) <= 0 || selectedFees.length === 0}
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
                                        <div className="text-gray-400">No receipt yet. Verify a pending payment or record a counter payment.</div>
                                    ) : (
                                        <Card className="bg-white text-slate-900">
                                            <CardContent className="p-0">
                                                <div className="bg-green-500 p-6 text-white text-center">
                                                    <CheckCircle className="h-12 w-12 mx-auto mb-2" />
                                                    <h2 className="text-xl font-bold">Receipt Issued</h2>
                                                    <p>The receipt has been generated.</p>
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
                                                        <div className="mt-4 flex gap-3">
                                                            <Button variant="outline" className="border-slate-600" onClick={() => window.print()}>
                                                                Print
                                                            </Button>
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
