"use client"

import type React from "react"

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Course options
const courses = [
  { id: "bscs", name: "BS Computer Science" },
  { id: "bsit", name: "BS Information Technology" },
  { id: "bsece", name: "BS Electronics Engineering" },
  { id: "bsba", name: "BS Business Administration" },
  { id: "bsed", name: "BS Education" },
]

// Year levels
const yearLevels = [
  { id: "1", name: "First Year" },
  { id: "2", name: "Second Year" },
  { id: "3", name: "Third Year" },
  { id: "4", name: "Fourth Year" },
]

// Payment data by course and year
const paymentData = {
  bscs: {
    "1": {
      tuition: 25000,
      laboratory: 5000,
      library: 1500,
      miscellaneous: 3500,
      total: 35000,
      paid: 10000,
    },
    "2": {
      tuition: 27000,
      laboratory: 6000,
      library: 1500,
      miscellaneous: 3500,
      total: 38000,
      paid: 15000,
    },
    "3": {
      tuition: 29000,
      laboratory: 7000,
      library: 1500,
      miscellaneous: 3500,
      total: 41000,
      paid: 0,
    },
    "4": {
      tuition: 31000,
      laboratory: 8000,
      library: 1500,
      miscellaneous: 3500,
      total: 44000,
      paid: 0,
    },
  },
  bsit: {
    "1": {
      tuition: 23000,
      laboratory: 4500,
      library: 1500,
      miscellaneous: 3000,
      total: 32000,
      paid: 8000,
    },
    "2": {
      tuition: 25000,
      laboratory: 5500,
      library: 1500,
      miscellaneous: 3000,
      total: 35000,
      paid: 0,
    },
    "3": {
      tuition: 27000,
      laboratory: 6500,
      library: 1500,
      miscellaneous: 3000,
      total: 38000,
      paid: 0,
    },
    "4": {
      tuition: 29000,
      laboratory: 7500,
      library: 1500,
      miscellaneous: 3000,
      total: 41000,
      paid: 0,
    },
  },
  // Other courses data...
}

export default function MakePaymentPage() {
  const [selectedCourse, setSelectedCourse] = useState("bscs")
  const [selectedYear, setSelectedYear] = useState("1")
  const [paymentMethod, setPaymentMethod] = useState("credit-card")
  const [selectedFees, setSelectedFees] = useState<string[]>([])
  const [currentPaymentData, setCurrentPaymentData] = useState(paymentData.bscs["1"])
  const [amount, setAmount] = useState("")
  const [showPaymongoDialog, setShowPaymongoDialog] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Update payment data when course or year changes
  const handleCourseChange = (value: string) => {
    setSelectedCourse(value)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    if (paymentData[value] && paymentData[value][selectedYear]) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      setCurrentPaymentData(paymentData[value][selectedYear])
      setSelectedFees([])
      setAmount("")
    }
  }

  const handleYearChange = (value: string) => {
    setSelectedYear(value)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (paymentData[selectedCourse] && paymentData[selectedCourse][value]) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      setCurrentPaymentData(paymentData[selectedCourse][value])
      setSelectedFees([])
      setAmount("")
    }
  }

  const handleFeeSelection = (fee: string) => {
    setSelectedFees((prev) => {
      if (prev.includes(fee)) {
        return prev.filter((item) => item !== fee)
      } else {
        return [...prev, fee]
      }
    })
  }

  // Calculate total amount based on selected fees
  const calculateTotal = () => {
    let total = 0
    if (selectedFees.includes("tuition")) total += currentPaymentData.tuition
    if (selectedFees.includes("laboratory")) total += currentPaymentData.laboratory
    if (selectedFees.includes("library")) total += currentPaymentData.library
    if (selectedFees.includes("miscellaneous")) total += currentPaymentData.miscellaneous
    return total
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Show the Paymongo dialog
    setShowPaymongoDialog(true)
  }

  const handlePaymongoRedirect = () => {
    setIsRedirecting(true)
    // Simulate redirect to Paymongo
    setTimeout(() => {
      // In a real implementation, this would redirect to Paymongo
      window.alert("In a real implementation, you would be redirected to Paymongo to complete your payment.")
      setIsRedirecting(false)
      setShowPaymongoDialog(false)
    }, 2000)
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 max-h-full">
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
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="course" className="text-sm font-medium">
                        Course
                      </label>
                      <Select value={selectedCourse} onValueChange={handleCourseChange}>
                        <SelectTrigger id="course" className="bg-slate-700 border-slate-600">
                          <SelectValue placeholder="Select course" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600 text-white">
                          {courses.map((course) => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.name}
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
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="tuition"
                        checked={selectedFees.includes("tuition")}
                        onCheckedChange={() => handleFeeSelection("tuition")}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor="tuition"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Tuition Fee
                        </label>
                        <p className="text-sm text-gray-400">₱{currentPaymentData.tuition.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="laboratory"
                        checked={selectedFees.includes("laboratory")}
                        onCheckedChange={() => handleFeeSelection("laboratory")}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor="laboratory"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Laboratory Fee
                        </label>
                        <p className="text-sm text-gray-400">₱{currentPaymentData.laboratory.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="library"
                        checked={selectedFees.includes("library")}
                        onCheckedChange={() => handleFeeSelection("library")}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor="library"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Library Fee
                        </label>
                        <p className="text-sm text-gray-400">₱{currentPaymentData.library.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="miscellaneous"
                        checked={selectedFees.includes("miscellaneous")}
                        onCheckedChange={() => handleFeeSelection("miscellaneous")}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor="miscellaneous"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Miscellaneous Fee
                        </label>
                        <p className="text-sm text-gray-400">₱{currentPaymentData.miscellaneous.toLocaleString()}</p>
                      </div>
                    </div>
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
                      <RadioGroupItem value="credit-card" id="credit-card" />
                      <Label htmlFor="credit-card" className="flex items-center gap-3 cursor-pointer">
                        <CreditCard className="h-5 w-5" />
                        <div>
                          <p className="font-medium">Credit/Debit Card</p>
                          <p className="text-sm text-gray-400">Pay with Visa, Mastercard, or other cards</p>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 rounded-lg border border-slate-700 p-4 hover:bg-slate-700/50">
                      <RadioGroupItem value="e-wallet" id="e-wallet" />
                      <Label htmlFor="e-wallet" className="flex items-center gap-3 cursor-pointer">
                        <Wallet className="h-5 w-5" />
                        <div>
                          <p className="font-medium">E-Wallet</p>
                          <p className="text-sm text-gray-400">Pay with GCash, Maya, or GrabPay</p>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 rounded-lg border border-slate-700 p-4 hover:bg-slate-700/50">
                      <RadioGroupItem value="online-banking" id="online-banking" />
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
                    <span>{courses.find((c) => c.id === selectedCourse)?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Year Level:</span>
                    <span>{yearLevels.find((y) => y.id === selectedYear)?.name}</span>
                  </div>
                  <div className="border-t border-slate-700 my-2"></div>
                  {selectedFees.includes("tuition") && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">Tuition Fee:</span>
                      <span>₱{currentPaymentData.tuition.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedFees.includes("laboratory") && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">Laboratory Fee:</span>
                      <span>₱{currentPaymentData.laboratory.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedFees.includes("library") && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">Library Fee:</span>
                      <span>₱{currentPaymentData.library.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedFees.includes("miscellaneous") && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">Miscellaneous Fee:</span>
                      <span>₱{currentPaymentData.miscellaneous.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-700 my-2"></div>
                  <div className="flex justify-between font-medium">
                    <span>Selected Fees Total:</span>
                    <span>₱{calculateTotal().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Amount to Pay:</span>
                    <span>₱{amount ? Number.parseFloat(amount).toLocaleString() : "0.00"}</span>
                  </div>
                  <div className="border-t border-slate-700 my-2"></div>
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
                    <span className="text-gray-400">Reference:</span>
                    <span>PAY-{Math.floor(Math.random() * 1000000)}</span>
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
              <Button
                onClick={handlePaymongoRedirect}
                className="bg-primary hover:bg-primary/90"
                disabled={isRedirecting}
              >
                {isRedirecting ? (
                  <span className="flex items-center">
                    <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Redirecting...
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
