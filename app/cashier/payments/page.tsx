/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CreditCard, Wallet, Search, CheckCircle, Loader2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { PaymentReceipt } from "@/components/payment/payment-receipt"

export default function CashierPaymentsPage() {
    const [studentId, setStudentId] = useState("")
    const [studentData, setStudentData] = useState<any>(null)
    const [paymentMethod, setPaymentMethod] = useState("cash")
    const [selectedFees, setSelectedFees] = useState<string[]>([])
    const [showReceipt, setShowReceipt] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [receiptData, setReceiptData] = useState<any>(null)

    // Mock student data
    const mockStudentData = {
        id: "2023-0001",
        name: "John Smith",
        course: "BS Computer Science",
        year: "3rd Year",
        email: "john.smith@example.com",
        fees: {
            tuition: { amount: 25000, paid: 10000, balance: 15000 },
            laboratory: { amount: 5000, paid: 0, balance: 5000 },
            library: { amount: 1500, paid: 0, balance: 1500 },
            miscellaneous: { amount: 3500, paid: 0, balance: 3500 },
        },
        totalBalance: 25000,
    }

    const handleStudentSearch = () => {
        // Simulate API call
        if (studentId) {
            setStudentData(mockStudentData)
        }
    }

    const handleProcessPayment = () => {
        setIsProcessing(true)
        // Simulate payment processing
        setTimeout(() => {
            setIsProcessing(false)

            // Generate receipt data
            const items = selectedFees.map((fee) => ({
                description: `${fee.charAt(0).toUpperCase() + fee.slice(1)} Fee`,
                amount: `₱${studentData.fees[fee].balance.toLocaleString()}`,
            }))

            const total = calculateTotal()

            setReceiptData({
                receiptNumber: `PAY-${Math.floor(100000 + Math.random() * 900000)}`,
                date: new Date().toISOString().split("T")[0],
                studentId: studentData.id,
                studentName: studentData.name,
                paymentMethod: paymentMethod === "cash" ? "Cash" : "Credit/Debit Card",
                items,
                total: `₱${total.toLocaleString()}`,
            })

            setShowReceipt(true)
        }, 2000)
    }

    const calculateTotal = () => {
        let total = 0
        selectedFees.forEach((fee) => {
            if (studentData?.fees[fee]) {
                total += studentData.fees[fee].balance
            }
        })
        return total
    }

    const handleNewPayment = () => {
        setShowReceipt(false)
        setStudentData(null)
        setStudentId("")
        setSelectedFees([])
        setPaymentMethod("cash")
    }

    return (
        <DashboardLayout allowedRoles={["cashier"]}>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white">Process Payment</h1>
                    <p className="text-gray-300">Accept and process student payments</p>
                </div>

                {!showReceipt ? (
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                        <div className="lg:col-span-2 space-y-6">
                            {/* Student Search */}
                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Student Information</CardTitle>
                                    <CardDescription className="text-gray-300">Search for student by ID</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <Label htmlFor="student-search">Student ID</Label>
                                            <div className="flex gap-2 mt-2">
                                                <Input
                                                    id="student-search"
                                                    placeholder="Enter student ID"
                                                    value={studentId}
                                                    onChange={(e) => setStudentId(e.target.value)}
                                                    className="bg-slate-700 border-slate-600"
                                                />
                                                <Button onClick={handleStudentSearch} className="bg-primary hover:bg-primary/90">
                                                    <Search className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {studentData && (
                                        <div className="mt-6 space-y-4">
                                            <Separator className="bg-slate-700" />
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm text-gray-400">Name</p>
                                                    <p className="font-medium">{studentData.name}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-400">Student ID</p>
                                                    <p className="font-medium">{studentData.id}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-400">Course</p>
                                                    <p className="font-medium">{studentData.course}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-400">Year Level</p>
                                                    <p className="font-medium">{studentData.year}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Fee Selection */}
                            {studentData && (
                                <Card className="bg-slate-800/60 border-slate-700 text-white">
                                    <CardHeader>
                                        <CardTitle>Select Fees to Pay</CardTitle>
                                        <CardDescription className="text-gray-300">
                                            Choose which fees to include in this payment
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {Object.entries(studentData.fees).map(([key, fee]: [string, any]) => (
                                                <div key={key} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="checkbox"
                                                            id={key}
                                                            checked={selectedFees.includes(key)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedFees([...selectedFees, key])
                                                                } else {
                                                                    setSelectedFees(selectedFees.filter((f) => f !== key))
                                                                }
                                                            }}
                                                            className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                                        />
                                                        <label htmlFor={key} className="cursor-pointer">
                                                            <p className="font-medium capitalize">{key} Fee</p>
                                                            <p className="text-sm text-gray-400">
                                                                Total: ₱{fee.amount.toLocaleString()} | Paid: ₱{fee.paid.toLocaleString()}
                                                            </p>
                                                        </label>
                                                    </div>
                                                    <p className="font-medium">₱{fee.balance.toLocaleString()}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Payment Method */}
                            {studentData && selectedFees.length > 0 && (
                                <Card className="bg-slate-800/60 border-slate-700 text-white">
                                    <CardHeader>
                                        <CardTitle>Payment Method</CardTitle>
                                        <CardDescription className="text-gray-300">Select how the student will pay</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-4">
                                            <div className="flex items-center space-x-2 rounded-lg border border-slate-700 p-4 hover:bg-slate-700/50">
                                                <RadioGroupItem value="cash" id="cash" />
                                                <Label htmlFor="cash" className="flex items-center gap-3 cursor-pointer flex-1">
                                                    <Wallet className="h-5 w-5" />
                                                    <div>
                                                        <p className="font-medium">Cash</p>
                                                        <p className="text-sm text-gray-400">Accept cash payment</p>
                                                    </div>
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2 rounded-lg border border-slate-700 p-4 hover:bg-slate-700/50">
                                                <RadioGroupItem value="card" id="card" />
                                                <Label htmlFor="card" className="flex items-center gap-3 cursor-pointer flex-1">
                                                    <CreditCard className="h-5 w-5" />
                                                    <div>
                                                        <p className="font-medium">Credit/Debit Card</p>
                                                        <p className="text-sm text-gray-400">Process card payment</p>
                                                    </div>
                                                </Label>
                                            </div>
                                        </RadioGroup>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Payment Summary */}
                        {studentData && selectedFees.length > 0 && (
                            <div>
                                <Card className="bg-slate-800/60 border-slate-700 text-white sticky top-4">
                                    <CardHeader>
                                        <CardTitle>Payment Summary</CardTitle>
                                        <CardDescription className="text-gray-300">Review before processing</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-sm text-gray-400">Student</p>
                                                <p className="font-medium">{studentData.name}</p>
                                                <p className="text-xs text-gray-400">{studentData.id}</p>
                                            </div>

                                            <Separator className="bg-slate-700" />

                                            <div>
                                                <p className="text-sm text-gray-400 mb-2">Selected Fees</p>
                                                <div className="space-y-2">
                                                    {selectedFees.map((fee) => (
                                                        <div key={fee} className="flex justify-between">
                                                            <p className="capitalize">{fee} Fee</p>
                                                            <p>₱{studentData.fees[fee].balance.toLocaleString()}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <Separator className="bg-slate-700" />

                                            <div className="flex justify-between font-bold">
                                                <p>Total Amount</p>
                                                <p>₱{calculateTotal().toLocaleString()}</p>
                                            </div>

                                            <div>
                                                <p className="text-sm text-gray-400 mb-2">Payment Method</p>
                                                <p className="capitalize">{paymentMethod === "cash" ? "Cash" : "Credit/Debit Card"}</p>
                                            </div>

                                            <Button
                                                className="w-full bg-primary hover:bg-primary/90"
                                                onClick={handleProcessPayment}
                                                disabled={isProcessing || selectedFees.length === 0}
                                            >
                                                {isProcessing ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    "Process Payment"
                                                )}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto">
                        <Card className="bg-white text-slate-900 mb-6">
                            <CardContent className="p-0">
                                <div className="bg-green-500 p-6 text-white text-center">
                                    <CheckCircle className="h-16 w-16 mx-auto mb-2" />
                                    <h2 className="text-2xl font-bold">Payment Successful!</h2>
                                    <p>The payment has been processed successfully.</p>
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
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <div className="flex justify-center gap-4">
                            <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                                Print Receipt
                            </Button>
                            <Button className="bg-primary hover:bg-primary/90" onClick={handleNewPayment}>
                                New Payment
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
