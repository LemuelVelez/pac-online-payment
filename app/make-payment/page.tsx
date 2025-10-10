/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { CreditCard, Landmark, Wallet, ExternalLink, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createPaymentLink } from "@/lib/paymongo-api"

// ──────────────────────────────────────────────────────────────────────────────
// Types
type YearId = "1" | "2" | "3" | "4"
type CourseId = "bsed" | "bscs" | "bssw" | "bsit"
type FeeKey = "tuition" | "laboratory" | "library" | "miscellaneous"
type FeeBreakdown = {
  tuition: number
  laboratory: number
  library: number
  miscellaneous: number
  total: number
  paid: number
}
type CourseConfig = Record<YearId, FeeBreakdown>
type PaymentData = Record<CourseId, CourseConfig>

// ──────────────────────────────────────────────────────────────────────────────
// Constants (from the provided fee slips)
const PER_UNIT = 206.0
const LIB_FEE = 157.65
const OTHER_FEES = 5682.72

// 18-unit slip (BSED, BSCS, BSSW)
const UNITS_18 = 18
const TUITION_18 = PER_UNIT * UNITS_18 // 3708.00
const LAB_18 = 630.6
const TOTAL_18 = 10178.97

// 24-unit slip (BSIT)
const UNITS_24 = 24
const TUITION_24 = PER_UNIT * UNITS_24 // 4944.00
const LAB_24 = 1260.6
const TOTAL_24 = 12044.97

// Course options (use acronyms for display)
const courses: { id: CourseId; code: string; name: string }[] = [
  { id: "bsed", code: "BSED", name: "BACHELOR OF SCIENCE IN EDUCATION" },
  { id: "bscs", code: "BSCS", name: "BACHELOR OF SCIENCE IN COMPUTER SCIENCE" },
  { id: "bssw", code: "BSSW", name: "BACHELOR OF SCIENCE IN SOCIAL WORK" },
  { id: "bsit", code: "BSIT", name: "BACHELOR OF SCIENCE IN INFORMATION TECHNOLOGY" },
] as const

// Year levels
const yearLevels: { id: YearId; name: string }[] = [
  { id: "1", name: "First Year" },
  { id: "2", name: "Second Year" },
  { id: "3", name: "Third Year" },
  { id: "4", name: "Fourth Year" },
] as const

// Base fee templates
const base18: FeeBreakdown = {
  tuition: TUITION_18,
  laboratory: LAB_18,
  library: LIB_FEE,
  miscellaneous: OTHER_FEES,
  total: TOTAL_18,
  paid: 0,
}

const base24: FeeBreakdown = {
  tuition: TUITION_24,
  laboratory: LAB_24,
  library: LIB_FEE,
  miscellaneous: OTHER_FEES,
  total: TOTAL_24,
  paid: 0,
}

// Payment data by course and year
const paymentData: PaymentData = {
  bsed: { "1": { ...base18 }, "2": { ...base18 }, "3": { ...base18 }, "4": { ...base18 } },
  bscs: { "1": { ...base18 }, "2": { ...base18 }, "3": { ...base18 }, "4": { ...base18 } },
  bssw: { "1": { ...base18 }, "2": { ...base18 }, "3": { ...base18 }, "4": { ...base18 } },
  bsit: { "1": { ...base24 }, "2": { ...base24 }, "3": { ...base24 }, "4": { ...base24 } },
}

// For displaying the “units” note beside tuition
const UNITS_BY_COURSE: Record<CourseId, number> = {
  bsed: UNITS_18,
  bscs: UNITS_18,
  bssw: UNITS_18,
  bsit: UNITS_24,
}

// ──────────────────────────────────────────────────────────────────────────────

export default function MakePaymentPage() {
  const [selectedCourse, setSelectedCourse] = useState<CourseId>("bsed")
  const [selectedYear, setSelectedYear] = useState<YearId>("1")
  const [paymentMethod, setPaymentMethod] = useState("credit-card")
  const [selectedFees, setSelectedFees] = useState<FeeKey[]>([])
  const [currentPaymentData, setCurrentPaymentData] = useState<FeeBreakdown>(paymentData.bsed["1"])
  const [amount, setAmount] = useState("")
  const [showPaymongoDialog, setShowPaymongoDialog] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Update payment data when course or year changes
  const handleCourseChange = (value: string) => {
    const v = value as CourseId
    setSelectedCourse(v)
    setCurrentPaymentData(paymentData[v][selectedYear])
    setSelectedFees([])
    setAmount("")
  }

  const handleYearChange = (value: string) => {
    const v = value as YearId
    setSelectedYear(v)
    setCurrentPaymentData(paymentData[selectedCourse][v])
    setSelectedFees([])
    setAmount("")
  }

  const handleFeeSelection = (fee: FeeKey) => {
    setSelectedFees((prev) => (prev.includes(fee) ? prev.filter((f) => f !== fee) : [...prev, fee]))
  }

  // Calculate total amount based on selected fees
  const calculateTotal = () => selectedFees.reduce((acc, key) => acc + currentPaymentData[key], 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowPaymongoDialog(true)
  }

  /** Create a PayMongo payment link and open it in a new tab (target=_blank). */
  const handlePaymongoRedirect = async () => {
    try {
      setIsRedirecting(true)

      const amt = Number.parseFloat(amount) || 0
      const description = `${courses.find((c) => c.id === selectedCourse)?.code} – ${yearLevels.find((y) => y.id === selectedYear)?.name}`
      const remarks = selectedFees.length ? `Fees: ${selectedFees.join(", ")}` : "Custom payment"

      const link = await createPaymentLink({
        amount: amt,
        description,
        remarks,
        metadata: {
          courseId: selectedCourse,
          yearId: selectedYear,
          fees: selectedFees,
          method: paymentMethod,
        },
      })

      // Open PayMongo hosted checkout in a NEW TAB
      window.open(link.checkoutUrl, "_blank", "noopener,noreferrer")

      // Close dialog and reset redirecting state
      setShowPaymongoDialog(false)
      setIsRedirecting(false)
    } catch (err: any) {
      console.error(err)
      alert(err?.message ?? "Failed to start payment. Please try again.")
      setIsRedirecting(false)
    }
  }

  const unitsNote = UNITS_BY_COURSE[selectedCourse]

  return (
    <DashboardLayout>
      <div className="mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Make a Payment</h1>
          <p className="text-gray-300">Pay your fees securely online via Paymongo</p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit}>
              <Card className="mb-8 bg-slate-800/60 border-slate-700 text-white">
                <CardHeader>
                  <CardTitle>Course and Year Selection</CardTitle>
                  <CardDescription className="text-gray-300">
                    Select your course and year to view applicable fees
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* VERTICAL LAYOUT */}
                  <div className="flex flex-col gap-4">
                    <div className="space-y-2">
                      <label htmlFor="course" className="text-sm font-medium">
                        Course (Acronym)
                      </label>
                      <Select value={selectedCourse} onValueChange={handleCourseChange}>
                        <SelectTrigger id="course" className="bg-slate-700 border-slate-600">
                          <SelectValue placeholder="Select course (BSED/BSCS/BSSW/BSIT)" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600 text-white">
                          {courses.map((course) => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="year" className="text-sm font-medium">
                        Year Level
                      </label>
                      <Select value={selectedYear} onValueChange={handleYearChange}>
                        <SelectTrigger id="year" className="bg-slate-700 border-slate-600">
                          <SelectValue placeholder="Select year level" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600 text-white">
                          {yearLevels.map((year) => (
                            <SelectItem key={year.id} value={year.id}>
                              {year.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mb-8 bg-slate-800/60 border-slate-700 text-white">
                <CardHeader>
                  <CardTitle>Select Fees to Pay</CardTitle>
                  <CardDescription className="text-gray-300">Choose which fees you want to pay</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {([
                      { key: "tuition", label: `Tuition Fee (₱${PER_UNIT.toFixed(2)} × ${unitsNote} units)` },
                      { key: "laboratory", label: "Laboratory Fee" },
                      { key: "library", label: "Library Fee" },
                      { key: "miscellaneous", label: "Miscellaneous (Other Fees)" },
                    ] as { key: FeeKey; label: string }[]).map((item) => (
                      <div className="flex items-center space-x-2" key={item.key}>
                        <Checkbox
                          id={item.key}
                          checked={selectedFees.includes(item.key)}
                          onCheckedChange={() => handleFeeSelection(item.key)}
                          className="cursor-pointer"
                        />
                        <div className="grid gap-1.5 leading-none">
                          <label
                            htmlFor={item.key}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {item.label}
                          </label>
                          <p className="text-sm text-gray-400">₱{currentPaymentData[item.key].toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="mb-8 bg-slate-800/60 border-slate-700 text-white">
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                  <CardDescription className="text-gray-300">
                    All payments are processed securely through Paymongo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert className="bg-blue-500/20 border-blue-500/50 text-blue-200 mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      You will be redirected to Paymongo&apos;s secure payment page to complete your transaction.
                    </AlertDescription>
                  </Alert>

                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-4">
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
                    <div className="text-sm text-gray-400">
                      <p>Selected fees total: ₱{calculateTotal().toLocaleString()}</p>
                      <p>
                        Remaining balance after this payment: ₱
                        {(
                          currentPaymentData.total -
                          currentPaymentData.paid -
                          (Number.parseFloat(amount) || 0)
                        ).toLocaleString()}
                      </p>
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
                    <span>{courses.find((c) => c.id === selectedCourse)?.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Year Level:</span>
                    <span>{yearLevels.find((y) => y.id === selectedYear)?.name}</span>
                  </div>
                  <div className="border-t border-slate-700 my-2" />
                  {(["tuition", "laboratory", "library", "miscellaneous"] as FeeKey[]).map(
                    (k) =>
                      selectedFees.includes(k) && (
                        <div className="flex justify-between" key={k}>
                          <span className="text-gray-300">
                            {k === "tuition"
                              ? `Tuition Fee (₱${PER_UNIT.toFixed(2)} × ${UNITS_BY_COURSE[selectedCourse]} units)`
                              : k === "laboratory"
                                ? "Laboratory Fee"
                                : k === "library"
                                  ? "Library Fee"
                                  : "Miscellaneous (Other Fees)"}
                          </span>
                          <span>₱{currentPaymentData[k].toLocaleString()}</span>
                        </div>
                      )
                  )}
                  <div className="border-t border-slate-700 my-2" />
                  <div className="flex justify-between font-medium">
                    <span>Selected Fees Total:</span>
                    <span>₱{calculateTotal().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Amount to Pay:</span>
                    <span>₱{amount ? Number.parseFloat(amount).toLocaleString() : "0.00"}</span>
                  </div>
                  <div className="border-t border-slate-700 my-2" />
                  <div className="flex justify-between">
                    <span className="text-gray-300">Total Fees:</span>
                    <span>₱{currentPaymentData.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Previously Paid:</span>
                    <span>₱{currentPaymentData.paid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Current Balance:</span>
                    <span>₱{(currentPaymentData.total - currentPaymentData.paid).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-primary font-medium">
                    <span>Remaining After Payment:</span>
                    <span>
                      ₱
                      {(
                        currentPaymentData.total -
                        currentPaymentData.paid -
                        (Number.parseFloat(amount) || 0)
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Paymongo Redirect Dialog */}
        <Dialog open={showPaymongoDialog} onOpenChange={setShowPaymongoDialog}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>Redirecting to Paymongo</DialogTitle>
              <DialogDescription className="text-gray-300">
                You are about to be redirected to Paymongo&apos;s secure payment page to complete your transaction.
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
                      {courses.find((c) => c.id === selectedCourse)?.code} – {yearLevels.find((y) => y.id === selectedYear)?.name}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center rounded-lg bg-blue-500/20 p-4 text-blue-200">
                <AlertCircle className="mr-2 h-5 w-5" />
                <div className="text-sm">
                  For security reasons, do not close your browser during the payment process. You will be redirected
                  back to this page after completing your payment.
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
                    Proceed to Paymongo <ExternalLink className="ml-2 h-4 w-4" />
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
