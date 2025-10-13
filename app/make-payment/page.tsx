/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useMemo, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { CreditCard, Landmark, Wallet, ExternalLink, AlertCircle, GraduationCap, BadgeCheck } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createPaymentLink } from "@/lib/paymongo-api"
import { getCurrentUserSafe, getDatabases, getEnvIds } from "@/lib/appwrite"
import { createPayment, getPaidTotal, type PaymentRecord } from "@/lib/appwrite-payments"
import type { Models } from "appwrite"

type FeeKey = "tuition" | "laboratory" | "library" | "miscellaneous"
type FeePlan = Partial<Record<FeeKey | "total", number>>

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

export default function MakePaymentPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [courseId, setCourseId] = useState<UserProfileDoc["courseId"]>()
  const [yearId, setYearId] = useState<UserProfileDoc["yearId"]>()
  const [feePlan, setFeePlan] = useState<FeePlan | null>(null)
  const [paidTotal, setPaidTotal] = useState(0)

  const [paymentMethod, setPaymentMethod] = useState<"credit-card" | "e-wallet" | "online-banking">("credit-card")
  const [selectedFees, setSelectedFees] = useState<FeeKey[]>([])
  const [amount, setAmount] = useState("")
  const [showPaymongoDialog, setShowPaymongoDialog] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    ; (async () => {
      setLoading(true)
      setError("")
      try {
        const me = await getCurrentUserSafe()
        if (!me) {
          setError("No active session.")
          setLoading(false)
          return
        }

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
        const plan: FeePlan | null =
          doc.feePlan && Object.keys(doc.feePlan).length > 0
            ? doc.feePlan
            : typeof doc.totalFees === "number"
              ? { total: doc.totalFees }
              : null

        setCourseId(normalizedCourse)
        setYearId(normalizedYear)
        setFeePlan(plan ?? null)

        if (plan) {
          const keys = (["tuition", "laboratory", "library", "miscellaneous"] as FeeKey[]).filter(
            (k) => typeof plan[k] === "number"
          )
          setSelectedFees(keys)
        }

        let paid = 0
        if (normalizedCourse && normalizedYear) {
          paid = await getPaidTotal(me.$id, normalizedCourse, normalizedYear)
        }
        setPaidTotal(paid)
      } catch (e: any) {
        setError(e?.message ?? "Failed to load payment data.")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

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

  const selectedFeesTotal = useMemo(() => {
    if (!feePlan) return 0
    return selectedFees.reduce((sum, k) => sum + (feePlan[k] ?? 0), 0)
  }, [feePlan, selectedFees])

  const totalFees = typeof feePlan?.total === "number" ? feePlan!.total! : undefined
  const currentBalance = typeof totalFees === "number" ? Math.max(0, totalFees - paidTotal) : undefined
  const remainingAfterPayment =
    typeof currentBalance === "number" ? Math.max(0, currentBalance - (Number.parseFloat(amount) || 0)) : undefined

  const handleFeeToggle = (fee: FeeKey) => {
    setSelectedFees((prev) => (prev.includes(fee) ? prev.filter((f) => f !== fee) : [...prev, fee]))
  }

  const fillSelectedTotal = () => {
    setAmount(selectedFeesTotal ? String(selectedFeesTotal) : "")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowPaymongoDialog(true)
  }

  const handlePaymongoRedirect = async () => {
    try {
      setIsRedirecting(true)
      const me = await getCurrentUserSafe()
      if (!me) throw new Error("No active session.")
      if (!courseId || !yearId) throw new Error("Missing course or year information on your profile.")

      const amt = Number.parseFloat(amount)
      if (!Number.isFinite(amt) || amt <= 0) throw new Error("Please enter a valid amount.")

      const description = `${courseLabel} • Year: ${yearLabel}`
      const remarks = selectedFees.length > 0 ? `Fees: ${selectedFees.join(", ")}` : "Tuition / School Fees"

      const link = await createPaymentLink({
        amount: amt,
        description,
        remarks,
        metadata: { userId: me.$id, courseId, yearId, fees: selectedFees, method: paymentMethod },
      })

      const rec: PaymentRecord = {
        userId: me.$id,
        courseId,
        yearId,
        amount: amt,
        fees: selectedFees,
        method: paymentMethod,
        status: "Pending",
        reference: link.id,
      }
      await createPayment(rec)

      window.open(link.checkoutUrl, "_blank", "noopener,noreferrer")
      setShowPaymongoDialog(false)
    } catch (err: any) {
      alert(err?.message ?? "Failed to start payment. Please try again.")
    } finally {
      setIsRedirecting(false)
    }
  }

  const hasBreakdown =
    !!feePlan &&
    (typeof feePlan.tuition === "number" ||
      typeof feePlan.laboratory === "number" ||
      typeof feePlan.library === "number" ||
      typeof feePlan.miscellaneous === "number")

  return (
    <DashboardLayout>
      <div className="mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-white">Make a Payment</h1>
          <p className="text-gray-300">Pay your fees securely online via PayMongo</p>
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

        {loading ? (
          <Card className="bg-slate-800/60 border-slate-700 text-white">
            <CardContent className="p-6">Loading…</CardContent>
          </Card>
        ) : error ? (
          <Alert className="mb-6 bg-red-500/20 border-red-500/50 text-red-200">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit}>
                {hasBreakdown ? (
                  <Card className="mb-8 bg-slate-800/60 border-slate-700 text-white">
                    <CardHeader>
                      <CardTitle>Select Fees to Pay</CardTitle>
                      <CardDescription className="text-gray-300">
                        Choose which fees you want to pay now (based on your profile’s fee plan)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
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
                            typeof feePlan?.[item.key] === "number" && (
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
                                  <p className="text-sm text-gray-400">₱{feePlan![item.key]!.toLocaleString()}</p>
                                </div>
                              </div>
                            )
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex items-center justify-between">
                      <div className="text-sm text-gray-400">
                        Selected fees total: ₱{selectedFeesTotal.toLocaleString()}
                      </div>
                      <Button type="button" variant="outline" className="border-slate-600" onClick={fillSelectedTotal}>
                        Use selected total
                      </Button>
                    </CardFooter>
                  </Card>
                ) : (
                  <Card className="mb-8 bg-slate-800/60 border-slate-700 text-white">
                    <CardHeader>
                      <CardTitle>No Fee Breakdown Found</CardTitle>
                      <CardDescription className="text-gray-300">
                        Your profile doesn’t have a detailed fee plan. You can still enter a custom amount below.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                )}

                <Card className="mb-8 bg-slate-800/60 border-slate-700 text-white">
                  <CardHeader>
                    <CardTitle>Payment Method</CardTitle>
                    <CardDescription className="text-gray-300">
                      All payments are processed securely through PayMongo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Alert className="bg-blue-500/20 border-blue-500/50 text-blue-200 mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        You will be redirected to PayMongo&apos;s secure payment page to complete your transaction.
                      </AlertDescription>
                    </Alert>

                    <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)} className="space-y-4">
                      <div className="flex items-center space-x-2 rounded-lg border border-slate-700 p-4 hover:bg-slate-700/50">
                        <RadioGroupItem value="credit-card" id="credit-card" className="cursor-pointer" />
                        <Label htmlFor="credit-card" className="flex items-center gap-3 cursor-pointer">
                          <CreditCard className="h-5 w-5" />
                          <div>
                            <p className="font-medium">Credit/Debit Card</p>
                            <p className="text-sm text-gray-400">Pay with Visa, Mastercard, or other cards</p>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 rounded-lg border border-slate-700 p-4 hover:bg-slate-700/50">
                        <RadioGroupItem value="e-wallet" id="e-wallet" className="cursor-pointer" />
                        <Label htmlFor="e-wallet" className="flex items-center gap-3 cursor-pointer">
                          <Wallet className="h-5 w-5" />
                          <div>
                            <p className="font-medium">E-Wallet</p>
                            <p className="text-sm text-gray-400">Pay with GCash, Maya, or GrabPay</p>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 rounded-lg border border-slate-700 p-4 hover:bg-slate-700/50">
                        <RadioGroupItem value="online-banking" id="online-banking" className="cursor-pointer" />
                        <Label htmlFor="online-banking" className="flex items-center gap-3 cursor-pointer">
                          <Landmark className="h-5 w-5" />
                          <div>
                            <p className="font-medium">Online Banking</p>
                            <p className="text-sm text-gray-400">Pay directly from your bank account</p>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/60 lg:mb-8 border-slate-700 text-white">
                  <CardHeader>
                    <CardTitle>Payment Amount</CardTitle>
                    <CardDescription className="text-gray-300">Enter the amount you want to pay</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount (₱)</Label>
                        <Input
                          id="amount"
                          type="number"
                          placeholder="Enter amount"
                          className="bg-slate-700 border-slate-600"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="text-sm text-gray-400 space-y-1">
                        {hasBreakdown && (
                          <p>
                            Selected fees total: <span className="text-white">₱{selectedFeesTotal.toLocaleString()}</span>
                          </p>
                        )}
                        {typeof totalFees === "number" && (
                          <>
                            <p>
                              Total fees: <span className="text-white">₱{totalFees.toLocaleString()}</span>
                            </p>
                            <p>
                              Previously paid: <span className="text-white">₱{paidTotal.toLocaleString()}</span>
                            </p>
                            <p>
                              Current balance:{" "}
                              <span className="text-white">
                                ₱{Math.max(0, totalFees - paidTotal).toLocaleString()}
                              </span>
                            </p>
                            <p>
                              Remaining after this payment:{" "}
                              <span className="text-white">
                                ₱{(remainingAfterPayment ?? 0).toLocaleString()}
                              </span>
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full" disabled={!amount || Number.parseFloat(amount) <= 0}>
                      Proceed to Payment
                    </Button>
                  </CardFooter>
                </Card>
              </form>
            </div>

            <div>
              <Card className="sticky mb-8 top-8 bg-slate-800/60 border-slate-700 text-white">
                <CardHeader>
                  <CardTitle>Payment Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Course:</span>
                      <span>{courseLabel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Year Level:</span>
                      <span>{yearLabel}</span>
                    </div>
                    <div className="border-t border-slate-700 my-2" />
                    {hasBreakdown &&
                      (["tuition", "laboratory", "library", "miscellaneous"] as FeeKey[]).map(
                        (k) =>
                          selectedFees.includes(k) &&
                          typeof feePlan?.[k] === "number" && (
                            <div className="flex justify-between" key={k}>
                              <span className="text-gray-300">
                                {k === "tuition"
                                  ? "Tuition Fee"
                                  : k === "laboratory"
                                    ? "Laboratory Fee"
                                    : k === "library"
                                      ? "Library Fee"
                                      : "Miscellaneous (Other Fees)"}
                              </span>
                              <span>₱{feePlan![k]!.toLocaleString()}</span>
                            </div>
                          )
                      )}
                    {hasBreakdown && (
                      <>
                        <div className="border-t border-slate-700 my-2" />
                        <div className="flex justify-between font-medium">
                          <span>Selected Fees Total:</span>
                          <span>₱{selectedFeesTotal.toLocaleString()}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-300">Amount to Pay:</span>
                      <span>₱{amount ? Number.parseFloat(amount).toLocaleString() : "0.00"}</span>
                    </div>
                    {typeof totalFees === "number" && (
                      <>
                        <div className="border-t border-slate-700 my-2" />
                        <div className="flex justify-between">
                          <span className="text-gray-300">Total Fees:</span>
                          <span>₱{totalFees.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Previously Paid:</span>
                          <span>₱{paidTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span>Current Balance:</span>
                          <span>₱{(currentBalance ?? 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-primary font-medium">
                          <span>Remaining After Payment:</span>
                          <span>₱{(remainingAfterPayment ?? 0).toLocaleString()}</span>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        <Dialog open={showPaymongoDialog} onOpenChange={setShowPaymongoDialog}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>Redirecting to PayMongo</DialogTitle>
              <DialogDescription className="text-gray-300">
                You are about to be redirected to PayMongo&apos;s secure payment page to complete your transaction.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="rounded-lg bg-slate-900 p-4">
                <div className="mb-2 text-sm font-medium text-gray-300">Payment Details</div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Amount:</span>
                    <span>₱{amount ? Number.parseFloat(amount).toLocaleString() : "0.00"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Payment Method:</span>
                    <span>
                      {paymentMethod === "credit-card"
                        ? "Credit/Debit Card"
                        : paymentMethod === "e-wallet"
                          ? "E-Wallet"
                          : "Online Banking"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Course / Year:</span>
                    <span>
                      {courseLabel} – {yearLabel}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center rounded-lg bg-blue-500/20 p-4 text-blue-200">
                <AlertCircle className="mr-2 h-5 w-5" />
                <div className="text-sm">
                  For security reasons, do not close your browser during the payment process. You will be redirected back
                  after completing your payment.
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPaymongoDialog(false)} className="border-slate-600">
                Cancel
              </Button>
              <Button onClick={handlePaymongoRedirect} className="bg-primary hover:bg-primary/90" disabled={isRedirecting}>
                {isRedirecting ? (
                  <span className="flex items-center">
                    <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Opening new tab…
                  </span>
                ) : (
                  <span className="flex items-center">
                    Proceed to PayMongo <ExternalLink className="ml-2 h-4 w-4" />
                  </span>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
