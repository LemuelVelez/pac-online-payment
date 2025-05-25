"use client"

import type React from "react"

import { useState } from "react"
import { CashierLayout } from "@/components/layout/cashier-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PaymentForm } from "@/components/payment/payment-form"
import { PaymentReceipt } from "@/components/payment/payment-receipt"
import { Check, Search, User, BookOpen, CreditCard, FileText } from "lucide-react"

// Mock data for student information
const studentData = {
    id: "2023-0001",
    name: "John Smith",
    course: "BS Computer Science",
    yearLevel: "Third Year",
    balance: 35000,
    paid: 10000,
    remaining: 25000,
    fees: [
        { type: "Tuition Fee", amount: 25000, paid: 10000, remaining: 15000 },
        { type: "Laboratory Fee", amount: 5000, paid: 0, remaining: 5000 },
        { type: "Library Fee", amount: 1500, paid: 0, remaining: 1500 },
        { type: "Miscellaneous Fee", amount: 3500, paid: 0, remaining: 3500 },
    ],
}

export default function CashierPaymentsPage() {
    const [searchQuery, setSearchQuery] = useState("")
    const [isStudentFound, setIsStudentFound] = useState(false)
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
    const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false)
    const [selectedFeeType, setSelectedFeeType] = useState("")
    const [paymentAmount, setPaymentAmount] = useState("")
    const [paymentSuccess, setPaymentSuccess] = useState(false)

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        // In a real app, this would search for the student in the database
        if (searchQuery.trim() !== "") {
            setIsStudentFound(true)
        }
    }

    const handlePaymentSubmit = () => {
        setIsPaymentDialogOpen(true)
    }

    const handlePaymentSuccess = () => {
        setIsPaymentDialogOpen(false)
        setPaymentSuccess(true)
        setIsReceiptDialogOpen(true)
        setTimeout(() => {
            setPaymentSuccess(false)
        }, 5000)
    }

    return (
        <CashierLayout>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white">Process Payments</h1>
                    <p className="text-gray-300">Search for a student and process their payment</p>
                </div>

                {paymentSuccess && (
                    <Alert className="mb-6 bg-green-500/20 border-green-500/50 text-green-200">
                        <Check className="h-4 w-4" />
                        <AlertDescription>Payment processed successfully! Receipt has been generated.</AlertDescription>
                    </Alert>
                )}

                <Card className="bg-slate-800/60 border-slate-700 text-white mb-8">
                    <CardHeader>
                        <CardTitle>Student Search</CardTitle>
                        <CardDescription className="text-gray-300">Enter student ID or name to search</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={handleSearch}
                            className="flex flex-col space-y-4 md:flex-row md:items-end md:space-x-4 md:space-y-0"
                        >
                            <div className="flex-1 space-y-2">
                                <Label htmlFor="search">Student ID or Name</Label>
                                <Input
                                    id="search"
                                    placeholder="Enter student ID or name"
                                    className="bg-slate-700 border-slate-600"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Button type="submit" className="bg-primary hover:bg-primary/90">
                                <Search className="mr-2 h-4 w-4" />
                                Search
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {isStudentFound && (
                    <>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-8">
                            <Card className="bg-slate-800/60 border-slate-700 text-white md:col-span-2">
                                <CardHeader>
                                    <CardTitle>Student Information</CardTitle>
                                    <CardDescription className="text-gray-300">Details of the selected student</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        <div className="space-y-4">
                                            <div className="flex items-center">
                                                <User className="mr-2 h-5 w-5 text-gray-400" />
                                                <div>
                                                    <p className="text-sm text-gray-400">Student Name</p>
                                                    <p className="font-medium">{studentData.name}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <BookOpen className="mr-2 h-5 w-5 text-gray-400" />
                                                <div>
                                                    <p className="text-sm text-gray-400">Course</p>
                                                    <p className="font-medium">{studentData.course}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center">
                                                <FileText className="mr-2 h-5 w-5 text-gray-400" />
                                                <div>
                                                    <p className="text-sm text-gray-400">Student ID</p>
                                                    <p className="font-medium">{studentData.id}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <BookOpen className="mr-2 h-5 w-5 text-gray-400" />
                                                <div>
                                                    <p className="text-sm text-gray-400">Year Level</p>
                                                    <p className="font-medium">{studentData.yearLevel}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Balance Summary</CardTitle>
                                    <CardDescription className="text-gray-300">Current balance information</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <p className="text-sm text-gray-400">Total Fees</p>
                                        <p className="text-2xl font-bold">₱{studentData.balance.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Amount Paid</p>
                                        <p className="text-xl font-medium text-green-500">₱{studentData.paid.toLocaleString()}</p>
                                    </div>
                                    <div className="border-t border-slate-700 pt-4">
                                        <p className="text-sm text-gray-400">Remaining Balance</p>
                                        <p className="text-2xl font-bold text-amber-500">₱{studentData.remaining.toLocaleString()}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="bg-slate-800/60 border-slate-700 text-white mb-8">
                            <CardHeader>
                                <CardTitle>Fee Breakdown</CardTitle>
                                <CardDescription className="text-gray-300">Detailed breakdown of fees and payments</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-lg border border-slate-700">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-slate-700 bg-slate-900/50 text-left text-sm font-medium text-gray-300">
                                                    <th className="px-6 py-3">Fee Type</th>
                                                    <th className="px-6 py-3">Total Amount</th>
                                                    <th className="px-6 py-3">Amount Paid</th>
                                                    <th className="px-6 py-3">Remaining</th>
                                                    <th className="px-6 py-3">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-700">
                                                {studentData.fees.map((fee, index) => (
                                                    <tr key={index} className="text-sm">
                                                        <td className="px-6 py-4 font-medium">{fee.type}</td>
                                                        <td className="px-6 py-4">₱{fee.amount.toLocaleString()}</td>
                                                        <td className="px-6 py-4">₱{fee.paid.toLocaleString()}</td>
                                                        <td className="px-6 py-4">₱{fee.remaining.toLocaleString()}</td>
                                                        <td className="px-6 py-4">
                                                            {fee.paid === 0 ? (
                                                                <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-500">
                                                                    Unpaid
                                                                </span>
                                                            ) : fee.remaining === 0 ? (
                                                                <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-500">
                                                                    Paid
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-500">
                                                                    Partial
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-800/60 border-slate-700 text-white">
                            <CardHeader>
                                <CardTitle>Process Payment</CardTitle>
                                <CardDescription className="text-gray-300">Enter payment details to process</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="fee-type">Fee Type</Label>
                                        <Select value={selectedFeeType} onValueChange={setSelectedFeeType}>
                                            <SelectTrigger id="fee-type" className="bg-slate-700 border-slate-600">
                                                <SelectValue placeholder="Select fee type" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                                <SelectItem value="tuition">Tuition Fee</SelectItem>
                                                <SelectItem value="laboratory">Laboratory Fee</SelectItem>
                                                <SelectItem value="library">Library Fee</SelectItem>
                                                <SelectItem value="miscellaneous">Miscellaneous Fee</SelectItem>
                                                <SelectItem value="all">All Fees</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="amount">Amount (₱)</Label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            placeholder="Enter amount"
                                            className="bg-slate-700 border-slate-600"
                                            value={paymentAmount}
                                            onChange={(e) => setPaymentAmount(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end">
                                    <Button
                                        className="bg-primary hover:bg-primary/90"
                                        onClick={handlePaymentSubmit}
                                        disabled={!selectedFeeType || !paymentAmount}
                                    >
                                        <CreditCard className="mr-2 h-4 w-4" />
                                        Process Payment
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}

                {/* Payment Dialog */}
                <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                    <DialogContent className="bg-slate-800 border-slate-700 text-white sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Confirm Payment</DialogTitle>
                            <DialogDescription className="text-gray-300">Review and confirm payment details</DialogDescription>
                        </DialogHeader>
                        <PaymentForm
                            amount={`₱${paymentAmount}`}
                            description={`${selectedFeeType} Payment for ${studentData.name}`}
                            onSuccess={handlePaymentSuccess}
                            onCancel={() => setIsPaymentDialogOpen(false)}
                        />
                    </DialogContent>
                </Dialog>

                {/* Receipt Dialog */}
                <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
                    <DialogContent className="bg-white sm:max-w-[600px]">
                        <PaymentReceipt
                            receiptNumber={`REC-${Date.now()}`}
                            date={new Date().toLocaleDateString()}
                            studentId={studentData.id}
                            studentName={studentData.name}
                            paymentMethod="Credit Card"
                            items={[{ description: selectedFeeType, amount: `₱${paymentAmount}` }]}
                            total={`₱${paymentAmount}`}
                        />
                    </DialogContent>
                </Dialog>
            </div>
        </CashierLayout>
    )
}
