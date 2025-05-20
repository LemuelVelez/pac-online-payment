"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { CreditCard, Wallet, BookOpen } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { PaymentChart } from "@/components/dashboard/payment-chart"
import { PaymentPieChart } from "@/components/dashboard/payment-pie-chart"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
    bsece: {
        "1": {
            tuition: 27000,
            laboratory: 6000,
            library: 1500,
            miscellaneous: 4000,
            total: 38500,
            paid: 12000,
        },
        "2": {
            tuition: 29000,
            laboratory: 7000,
            library: 1500,
            miscellaneous: 4000,
            total: 41500,
            paid: 0,
        },
        "3": {
            tuition: 31000,
            laboratory: 8000,
            library: 1500,
            miscellaneous: 4000,
            total: 44500,
            paid: 0,
        },
        "4": {
            tuition: 33000,
            laboratory: 9000,
            library: 1500,
            miscellaneous: 4000,
            total: 47500,
            paid: 0,
        },
    },
    bsba: {
        "1": {
            tuition: 22000,
            laboratory: 2000,
            library: 1500,
            miscellaneous: 3000,
            total: 28500,
            paid: 7000,
        },
        "2": {
            tuition: 24000,
            laboratory: 2000,
            library: 1500,
            miscellaneous: 3000,
            total: 30500,
            paid: 0,
        },
        "3": {
            tuition: 26000,
            laboratory: 2000,
            library: 1500,
            miscellaneous: 3000,
            total: 32500,
            paid: 0,
        },
        "4": {
            tuition: 28000,
            laboratory: 2000,
            library: 1500,
            miscellaneous: 3000,
            total: 34500,
            paid: 0,
        },
    },
    bsed: {
        "1": {
            tuition: 20000,
            laboratory: 1500,
            library: 1500,
            miscellaneous: 3000,
            total: 26000,
            paid: 6500,
        },
        "2": {
            tuition: 22000,
            laboratory: 1500,
            library: 1500,
            miscellaneous: 3000,
            total: 28000,
            paid: 0,
        },
        "3": {
            tuition: 24000,
            laboratory: 1500,
            library: 1500,
            miscellaneous: 3000,
            total: 30000,
            paid: 0,
        },
        "4": {
            tuition: 26000,
            laboratory: 1500,
            library: 1500,
            miscellaneous: 3000,
            total: 32000,
            paid: 0,
        },
    },
}

// Recent transactions data
const recentTransactions = [
    {
        id: "PAY-123458",
        date: "Jul 05, 2023",
        description: "Laboratory Fee",
        amount: 800.0,
        status: "Completed",
    },
    {
        id: "PAY-123457",
        date: "Jun 10, 2023",
        description: "Library Fee",
        amount: 500.0,
        status: "Completed",
    },
    {
        id: "PAY-123456",
        date: "May 15, 2023",
        description: "Tuition Fee - 1st Semester",
        amount: 1500.0,
        status: "Completed",
    },
]

export default function DashboardPage() {
    const [selectedCourse, setSelectedCourse] = useState("bscs")
    const [selectedYear, setSelectedYear] = useState("1")
    const [currentPaymentData, setCurrentPaymentData] = useState(paymentData.bscs["1"])
    const paymentHistory = [
        { month: "Jan", amount: 0 },
        { month: "Feb", amount: 0 },
        { month: "Mar", amount: 0 },
        { month: "Apr", amount: 0 },
        { month: "May", amount: 1500 },
        { month: "Jun", amount: 500 },
        { month: "Jul", amount: 800 },
        { month: "Aug", amount: 0 },
        { month: "Sep", amount: 0 },
        { month: "Oct", amount: 0 },
        { month: "Nov", amount: 0 },
        { month: "Dec", amount: 0 },
    ]

    // Update payment data when course or year changes
    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (paymentData[selectedCourse] && paymentData[selectedCourse][selectedYear]) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            setCurrentPaymentData(paymentData[selectedCourse][selectedYear])
        }
    }, [selectedCourse, selectedYear])

    // Calculate payment progress
    const paymentProgress = Math.round((currentPaymentData.paid / currentPaymentData.total) * 100)

    // Prepare pie chart data
    const pieChartData = [
        { name: "Tuition", value: currentPaymentData.tuition },
        { name: "Laboratory", value: currentPaymentData.laboratory },
        { name: "Library", value: currentPaymentData.library },
        { name: "Miscellaneous", value: currentPaymentData.miscellaneous },
    ]

    return (
        <DashboardLayout>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white">Student Payment Dashboard</h1>
                    <p className="text-gray-300">Manage your payments and view your payment history</p>
                </div>

                {/* Course and Year Selection */}
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
                                <Select value={selectedCourse} onValueChange={(value) => setSelectedCourse(value)}>
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
                                <Select value={selectedYear} onValueChange={(value) => setSelectedYear(value)}>
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

                {/* Payment Summary */}
                <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Total Fees</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="mr-4 rounded-lg bg-primary/20 p-3">
                                        <BookOpen className="size-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-3xl font-bold">₱{currentPaymentData.total.toLocaleString()}</p>
                                        <p className="text-sm text-gray-300">{courses.find((c) => c.id === selectedCourse)?.name}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Amount Paid</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="mr-4 rounded-lg bg-green-500/20 p-3">
                                        <Wallet className="size-6 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-3xl font-bold">₱{currentPaymentData.paid.toLocaleString()}</p>
                                        <p className="text-sm text-gray-300">{paymentProgress}% of total fees</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Balance Due</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="mr-4 rounded-lg bg-red-500/20 p-3">
                                        <CreditCard className="size-6 text-red-500" />
                                    </div>
                                    <div>
                                        <p className="text-3xl font-bold">
                                            ₱{(currentPaymentData.total - currentPaymentData.paid).toLocaleString()}
                                        </p>
                                        <p className="text-sm text-gray-300">{100 - paymentProgress}% remaining</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Payment Progress */}
                <Card className="mb-8 bg-slate-800/60 border-slate-700 text-white">
                    <CardHeader>
                        <CardTitle>Payment Progress</CardTitle>
                        <CardDescription className="text-gray-300">
                            Track your payment progress for the current semester
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Overall Progress</span>
                                <span className="text-sm font-medium">{paymentProgress}%</span>
                            </div>
                            <Progress value={paymentProgress} className="h-2 bg-slate-700" />

                            {paymentProgress < 100 && (
                                <Alert className="mt-4 bg-amber-500/20 border-amber-500/50 text-amber-200">
                                    <AlertDescription>
                                        You have a remaining balance of ₱
                                        {(currentPaymentData.total - currentPaymentData.paid).toLocaleString()}. Please settle your payments
                                        before the deadline.
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

                {/* Charts */}
                <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader>
                            <CardTitle>Fee Breakdown</CardTitle>
                            <CardDescription className="text-gray-300">Distribution of fees by category</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80">
                                <PaymentPieChart data={pieChartData} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader>
                            <CardTitle>Payment History</CardTitle>
                            <CardDescription className="text-gray-300">Monthly payment activity for the current year</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80">
                                <PaymentChart data={paymentHistory} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Fee Details */}
                <Card className="mb-8 bg-slate-800/60 border-slate-700 text-white">
                    <CardHeader>
                        <CardTitle>Fee Details</CardTitle>
                        <CardDescription className="text-gray-300">
                            Breakdown of fees for {courses.find((c) => c.id === selectedCourse)?.name} -{" "}
                            {yearLevels.find((y) => y.id === selectedYear)?.name}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-hidden rounded-lg border border-slate-700">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-700 bg-slate-900/50 text-left text-sm font-medium text-gray-300">
                                        <th className="px-6 py-3">Fee Type</th>
                                        <th className="px-6 py-3">Amount</th>
                                        <th className="px-6 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    <tr className="text-sm">
                                        <td className="px-6 py-4 font-medium">Tuition Fee</td>
                                        <td className="px-6 py-4">₱{currentPaymentData.tuition.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            {currentPaymentData.paid > 0 ? (
                                                <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-500">
                                                    Partially Paid
                                                </span>
                                            ) : (
                                                <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-500">
                                                    Unpaid
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                    <tr className="text-sm">
                                        <td className="px-6 py-4 font-medium">Laboratory Fee</td>
                                        <td className="px-6 py-4">₱{currentPaymentData.laboratory.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-500">
                                                Unpaid
                                            </span>
                                        </td>
                                    </tr>
                                    <tr className="text-sm">
                                        <td className="px-6 py-4 font-medium">Library Fee</td>
                                        <td className="px-6 py-4">₱{currentPaymentData.library.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-500">
                                                Unpaid
                                            </span>
                                        </td>
                                    </tr>
                                    <tr className="text-sm">
                                        <td className="px-6 py-4 font-medium">Miscellaneous Fee</td>
                                        <td className="px-6 py-4">₱{currentPaymentData.miscellaneous.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-500">
                                                Unpaid
                                            </span>
                                        </td>
                                    </tr>
                                    <tr className="bg-slate-900/30 text-sm font-medium">
                                        <td className="px-6 py-4">Total</td>
                                        <td className="px-6 py-4">₱{currentPaymentData.total.toLocaleString()}</td>
                                        <td className="px-6 py-4"></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Transactions */}
                <Card className="bg-slate-800/60 border-slate-700 text-white">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Recent Transactions</CardTitle>
                            <CardDescription className="text-gray-300">Your recent payment activities</CardDescription>
                        </div>
                        <Link href="/payment-history" className="text-sm font-medium text-primary hover:underline">
                            View All
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-hidden rounded-lg border border-slate-700">
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
                                    {recentTransactions.map((transaction) => (
                                        <tr key={transaction.id} className="text-sm text-gray-200">
                                            <td className="whitespace-nowrap px-6 py-4 font-medium">{transaction.id}</td>
                                            <td className="whitespace-nowrap px-6 py-4">{transaction.date}</td>
                                            <td className="px-6 py-4">{transaction.description}</td>
                                            <td className="whitespace-nowrap px-6 py-4 font-medium">₱{transaction.amount.toFixed(2)}</td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-500">
                                                    {transaction.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
