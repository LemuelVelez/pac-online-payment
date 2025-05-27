"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DateRangePicker } from "@/components/admin/date-range-picker"
import { PaymentChart } from "@/components/dashboard/payment-chart"
import { PaymentPieChart } from "@/components/dashboard/payment-pie-chart"
import { Download, FileText, Filter, Search, Users, ChevronDown } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Mock data for financial reports
const paymentReports = [
    {
        id: "p1",
        studentId: "2023-0001",
        studentName: "John Smith",
        amount: 5000,
        feeType: "Tuition",
        paymentMethod: "Credit Card",
        date: "2023-05-15T10:30:00",
        status: "Completed",
    },
    {
        id: "p2",
        studentId: "2023-0002",
        studentName: "Maria Garcia",
        amount: 1500,
        feeType: "Library",
        paymentMethod: "Cash",
        date: "2023-05-14T14:20:00",
        status: "Completed",
    },
    {
        id: "p3",
        studentId: "2023-0003",
        studentName: "Ahmed Khan",
        amount: 3000,
        feeType: "Laboratory",
        paymentMethod: "Bank Transfer",
        date: "2023-05-13T09:15:00",
        status: "Completed",
    },
    {
        id: "p4",
        studentId: "2023-0004",
        studentName: "Sarah Johnson",
        amount: 5000,
        feeType: "Tuition",
        paymentMethod: "E-Wallet",
        date: "2023-05-12T08:45:00",
        status: "Completed",
    },
    {
        id: "p5",
        studentId: "2023-0005",
        studentName: "Michael Brown",
        amount: 2500,
        feeType: "Miscellaneous",
        paymentMethod: "Credit Card",
        date: "2023-05-11T16:30:00",
        status: "Completed",
    },
    {
        id: "p6",
        studentId: "2023-0006",
        studentName: "Emma Wilson",
        amount: 5000,
        feeType: "Tuition",
        paymentMethod: "Cash",
        date: "2023-05-10T11:20:00",
        status: "Completed",
    },
    {
        id: "p7",
        studentId: "2023-0007",
        studentName: "David Lee",
        amount: 1000,
        feeType: "Library",
        paymentMethod: "E-Wallet",
        date: "2023-05-09T13:45:00",
        status: "Completed",
    },
    {
        id: "p8",
        studentId: "2023-0008",
        studentName: "Sophia Martinez",
        amount: 3000,
        feeType: "Laboratory",
        paymentMethod: "Bank Transfer",
        date: "2023-05-08T10:00:00",
        status: "Completed",
    },
]

// Mock data for outstanding balances
const outstandingBalances = [
    {
        id: "b1",
        studentId: "2023-0009",
        studentName: "James Taylor",
        course: "BS Computer Science",
        totalFees: 35000,
        amountPaid: 15000,
        balance: 20000,
        dueDate: "2023-06-15T00:00:00",
    },
    {
        id: "b2",
        studentId: "2023-0010",
        studentName: "Olivia Anderson",
        course: "BS Information Technology",
        totalFees: 32000,
        amountPaid: 10000,
        balance: 22000,
        dueDate: "2023-06-15T00:00:00",
    },
    {
        id: "b3",
        studentId: "2023-0011",
        studentName: "William Garcia",
        course: "BS Business Administration",
        totalFees: 28000,
        amountPaid: 8000,
        balance: 20000,
        dueDate: "2023-06-15T00:00:00",
    },
    {
        id: "b4",
        studentId: "2023-0012",
        studentName: "Ava Martinez",
        course: "BS Education",
        totalFees: 26000,
        amountPaid: 6000,
        balance: 20000,
        dueDate: "2023-06-15T00:00:00",
    },
    {
        id: "b5",
        studentId: "2023-0013",
        studentName: "Ethan Johnson",
        course: "BS Computer Science",
        totalFees: 35000,
        amountPaid: 5000,
        balance: 30000,
        dueDate: "2023-06-15T00:00:00",
    },
]

// Chart data - Fixed to match expected types
const monthlyCollectionData = [
    { month: "Jan", amount: 125000 },
    { month: "Feb", amount: 182000 },
    { month: "Mar", amount: 158000 },
    { month: "Apr", amount: 220000 },
    { month: "May", amount: 285000 },
]

const paymentMethodDistribution = [
    { name: "Credit Card", value: 45 },
    { name: "Cash", value: 25 },
    { name: "E-Wallet", value: 20 },
    { name: "Bank Transfer", value: 10 },
]

const feeTypeDistribution = [
    { name: "Tuition", value: 65 },
    { name: "Laboratory", value: 15 },
    { name: "Library", value: 10 },
    { name: "Miscellaneous", value: 10 },
]

// Tab configuration for mobile dropdown
const tabOptions = [
    { value: "payment-history", label: "Payment History" },
    { value: "revenue-analysis", label: "Revenue Analysis" },
    { value: "outstanding-balances", label: "Outstanding Balances" },
    { value: "financial-summary", label: "Financial Summary" },
]

export default function AdminReportsPage() {
    const [searchTerm, setSearchTerm] = useState("")
    const [feeTypeFilter, setFeeTypeFilter] = useState("all")
    const [paymentMethodFilter, setPaymentMethodFilter] = useState("all")
    const [activeTab, setActiveTab] = useState("payment-history")

    // Filter payment reports based on search and filters
    const filteredPayments = paymentReports.filter((payment) => {
        const matchesSearch =
            payment.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.id.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesFeeType = feeTypeFilter === "all" || payment.feeType.toLowerCase() === feeTypeFilter.toLowerCase()
        const matchesPaymentMethod =
            paymentMethodFilter === "all" ||
            payment.paymentMethod.toLowerCase().replace(" ", "-") === paymentMethodFilter.toLowerCase()

        return matchesSearch && matchesFeeType && matchesPaymentMethod
    })

    return (
        <DashboardLayout allowedRoles={["admin"]}>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Financial Reports</h1>
                        <p className="text-gray-300">View and analyze financial data</p>
                    </div>
                    <div className="mt-4 flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 md:mt-0">
                        <DateRangePicker />
                        <Button className="bg-primary hover:bg-primary/90">
                            <Download className="mr-2 h-4 w-4" />
                            Export Report
                        </Button>
                    </div>
                </div>

                <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₱10,500,000</div>
                            <p className="text-xs text-gray-400 mt-1">Current Academic Year</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">2,345</div>
                            <p className="text-xs text-gray-400 mt-1">Current Academic Year</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₱850,000</div>
                            <p className="text-xs text-gray-400 mt-1">
                                <Users className="inline h-3 w-3 text-amber-500 mr-1" />
                                45 students with balance
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Average Payment</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₱4,478</div>
                            <p className="text-xs text-gray-400 mt-1">Per transaction</p>
                        </CardContent>
                    </Card>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    {/* Mobile Dropdown - visible on extra small screens */}
                    <div className="mb-6 sm:hidden">
                        <Select value={activeTab} onValueChange={setActiveTab}>
                            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                <div className="flex items-center">
                                    <SelectValue placeholder="Select Report" />
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                {tabOptions.map((tab) => (
                                    <SelectItem key={tab.value} value={tab.value} className="focus:bg-slate-700">
                                        {tab.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Horizontal Scrolling Tabs - visible on small screens and up */}
                    <div className="hidden sm:block mb-8">
                        <div className="relative">
                            <TabsList className="bg-slate-800 border-slate-700 flex h-auto p-1 w-full overflow-x-auto scrollbar-hide">
                                <div className="flex space-x-1 min-w-max">
                                    <TabsTrigger
                                        value="payment-history"
                                        className="whitespace-nowrap px-3 py-2 text-sm data-[state=active]:bg-slate-700 data-[state=active]:text-white"
                                    >
                                        Payment History
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="revenue-analysis"
                                        className="whitespace-nowrap px-3 py-2 text-sm data-[state=active]:bg-slate-700 data-[state=active]:text-white"
                                    >
                                        Revenue Analysis
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="outstanding-balances"
                                        className="whitespace-nowrap px-3 py-2 text-sm data-[state=active]:bg-slate-700 data-[state=active]:text-white"
                                    >
                                        Outstanding Balances
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="financial-summary"
                                        className="whitespace-nowrap px-3 py-2 text-sm data-[state=active]:bg-slate-700 data-[state=active]:text-white"
                                    >
                                        Financial Summary
                                    </TabsTrigger>
                                </div>
                            </TabsList>
                        </div>
                    </div>

                    <TabsContent value="payment-history">
                        <Card className="bg-slate-800/60 border-slate-700 text-white mb-6">
                            <CardContent className="p-6">
                                <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:space-x-4 lg:space-y-0">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            placeholder="Search by ID, student name..."
                                            className="pl-10 bg-slate-700 border-slate-600"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                                        <Select value={feeTypeFilter} onValueChange={setFeeTypeFilter}>
                                            <SelectTrigger className="w-full sm:w-[150px] bg-slate-700 border-slate-600">
                                                <div className="flex items-center">
                                                    <Filter className="mr-2 h-4 w-4 text-gray-400" />
                                                    <SelectValue placeholder="Fee Type" />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                                <SelectItem value="all">All Fee Types</SelectItem>
                                                <SelectItem value="tuition">Tuition</SelectItem>
                                                <SelectItem value="laboratory">Laboratory</SelectItem>
                                                <SelectItem value="library">Library</SelectItem>
                                                <SelectItem value="miscellaneous">Miscellaneous</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                                            <SelectTrigger className="w-full sm:w-[180px] bg-slate-700 border-slate-600">
                                                <div className="flex items-center">
                                                    <Filter className="mr-2 h-4 w-4 text-gray-400" />
                                                    <SelectValue placeholder="Payment Method" />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                                <SelectItem value="all">All Methods</SelectItem>
                                                <SelectItem value="credit-card">Credit Card</SelectItem>
                                                <SelectItem value="e-wallet">E-Wallet</SelectItem>
                                                <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                                                <SelectItem value="cash">Cash</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-800/60 border-slate-700 text-white">
                            <CardHeader>
                                <CardTitle>Payment Transactions</CardTitle>
                                <CardDescription className="text-gray-300">
                                    Showing {filteredPayments.length} payment records
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-lg border border-slate-700">
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[800px]">
                                            <thead>
                                                <tr className="border-b border-slate-700 bg-slate-900/50 text-left text-sm font-medium text-gray-300">
                                                    <th className="px-6 py-3 min-w-[120px]">Transaction ID</th>
                                                    <th className="px-6 py-3 min-w-[100px]">Date</th>
                                                    <th className="px-6 py-3 min-w-[150px]">Student</th>
                                                    <th className="px-6 py-3 min-w-[100px]">Fee Type</th>
                                                    <th className="px-6 py-3 min-w-[100px]">Amount</th>
                                                    <th className="px-6 py-3 min-w-[120px]">Payment Method</th>
                                                    <th className="px-6 py-3 min-w-[80px]">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-700">
                                                {filteredPayments.map((payment) => (
                                                    <tr key={payment.id} className="text-sm">
                                                        <td className="whitespace-nowrap px-6 py-4 font-medium">{payment.id}</td>
                                                        <td className="whitespace-nowrap px-6 py-4">
                                                            {new Date(payment.date).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div>
                                                                <p className="font-medium">{payment.studentName}</p>
                                                                <p className="text-xs text-gray-400">{payment.studentId}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">{payment.feeType}</td>
                                                        <td className="whitespace-nowrap px-6 py-4">₱{payment.amount.toLocaleString()}</td>
                                                        <td className="px-6 py-4">{payment.paymentMethod}</td>
                                                        <td className="whitespace-nowrap px-6 py-4">
                                                            <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-500">
                                                                {payment.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="revenue-analysis">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Monthly Revenue</CardTitle>
                                    <CardDescription className="text-gray-300">Revenue trend over time</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-80">
                                        <PaymentChart data={monthlyCollectionData} />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Revenue by Payment Method</CardTitle>
                                    <CardDescription className="text-gray-300">Distribution by payment method</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-80">
                                        <PaymentPieChart data={paymentMethodDistribution} />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Revenue by Fee Type</CardTitle>
                                    <CardDescription className="text-gray-300">Distribution by fee category</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-80">
                                        <PaymentPieChart data={feeTypeDistribution} />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Revenue Metrics</CardTitle>
                                    <CardDescription className="text-gray-300">Key financial indicators</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm text-gray-400">Revenue Growth (YoY)</span>
                                                <span className="text-sm font-medium text-green-500">+12.5%</span>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-slate-600">
                                                <div className="h-2 rounded-full bg-green-500" style={{ width: "75%" }}></div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm text-gray-400">Collection Rate</span>
                                                <span className="text-sm font-medium">92.5%</span>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-slate-600">
                                                <div className="h-2 rounded-full bg-blue-500" style={{ width: "92.5%" }}></div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm text-gray-400">Operating Margin</span>
                                                <span className="text-sm font-medium">28.3%</span>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-slate-600">
                                                <div className="h-2 rounded-full bg-purple-500" style={{ width: "28.3%" }}></div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm text-gray-400">Cost per Student</span>
                                                <span className="text-sm font-medium">₱32,450</span>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-slate-600">
                                                <div className="h-2 rounded-full bg-amber-500" style={{ width: "65%" }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="outstanding-balances">
                        <Card className="bg-slate-800/60 border-slate-700 text-white">
                            <CardHeader>
                                <CardTitle>Outstanding Balances</CardTitle>
                                <CardDescription className="text-gray-300">Students with unpaid or partially paid fees</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-lg border border-slate-700">
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[900px]">
                                            <thead>
                                                <tr className="border-b border-slate-700 bg-slate-900/50 text-left text-sm font-medium text-gray-300">
                                                    <th className="px-6 py-3 min-w-[120px]">Student ID</th>
                                                    <th className="px-6 py-3 min-w-[150px]">Student Name</th>
                                                    <th className="px-6 py-3 min-w-[200px]">Course</th>
                                                    <th className="px-6 py-3 min-w-[120px]">Total Fees</th>
                                                    <th className="px-6 py-3 min-w-[120px]">Amount Paid</th>
                                                    <th className="px-6 py-3 min-w-[100px]">Balance</th>
                                                    <th className="px-6 py-3 min-w-[100px]">Due Date</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-700">
                                                {outstandingBalances.map((student) => (
                                                    <tr key={student.id} className="text-sm">
                                                        <td className="whitespace-nowrap px-6 py-4 font-medium">{student.studentId}</td>
                                                        <td className="px-6 py-4">{student.studentName}</td>
                                                        <td className="px-6 py-4">{student.course}</td>
                                                        <td className="whitespace-nowrap px-6 py-4">₱{student.totalFees.toLocaleString()}</td>
                                                        <td className="whitespace-nowrap px-6 py-4">₱{student.amountPaid.toLocaleString()}</td>
                                                        <td className="whitespace-nowrap px-6 py-4 font-medium text-amber-500">
                                                            ₱{student.balance.toLocaleString()}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4">
                                                            {new Date(student.dueDate).toLocaleDateString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    <Card className="bg-slate-700/50 border-slate-600">
                                        <CardContent className="p-4">
                                            <p className="text-sm text-gray-400">Total Outstanding</p>
                                            <p className="text-2xl font-bold">₱850,000</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-slate-700/50 border-slate-600">
                                        <CardContent className="p-4">
                                            <p className="text-sm text-gray-400">Average Balance</p>
                                            <p className="text-2xl font-bold">₱18,889</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-slate-700/50 border-slate-600">
                                        <CardContent className="p-4">
                                            <p className="text-sm text-gray-400">Students with Balance</p>
                                            <p className="text-2xl font-bold">45</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="financial-summary">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Financial Summary</CardTitle>
                                    <CardDescription className="text-gray-300">Current academic year overview</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex justify-between border-b border-slate-700 pb-2">
                                            <span className="font-medium">Total Revenue</span>
                                            <span>₱10,500,000</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-700 pb-2">
                                            <span className="font-medium">Total Expenses</span>
                                            <span>₱7,350,000</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-700 pb-2">
                                            <span className="font-medium">Net Income</span>
                                            <span className="text-green-500">₱3,150,000</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-700 pb-2">
                                            <span className="font-medium">Outstanding Balances</span>
                                            <span className="text-amber-500">₱850,000</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-700 pb-2">
                                            <span className="font-medium">Collection Rate</span>
                                            <span>92.5%</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-700 pb-2">
                                            <span className="font-medium">Operating Margin</span>
                                            <span>28.3%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-medium">Total Students</span>
                                            <span>1,250</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Available Reports</CardTitle>
                                    <CardDescription className="text-gray-300">Download detailed financial reports</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg bg-slate-700/50 p-4 space-y-3 sm:space-y-0">
                                            <div className="flex items-center">
                                                <FileText className="mr-3 h-5 w-5 text-blue-500" />
                                                <div>
                                                    <p className="font-medium">Income Statement</p>
                                                    <p className="text-xs text-gray-400">Current Academic Year</p>
                                                </div>
                                            </div>
                                            <Button size="sm" className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                                                <Download className="mr-2 h-4 w-4" />
                                                Download
                                            </Button>
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg bg-slate-700/50 p-4 space-y-3 sm:space-y-0">
                                            <div className="flex items-center">
                                                <FileText className="mr-3 h-5 w-5 text-green-500" />
                                                <div>
                                                    <p className="font-medium">Balance Sheet</p>
                                                    <p className="text-xs text-gray-400">As of May 31, 2023</p>
                                                </div>
                                            </div>
                                            <Button size="sm" className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                                                <Download className="mr-2 h-4 w-4" />
                                                Download
                                            </Button>
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg bg-slate-700/50 p-4 space-y-3 sm:space-y-0">
                                            <div className="flex items-center">
                                                <FileText className="mr-3 h-5 w-5 text-purple-500" />
                                                <div>
                                                    <p className="font-medium">Cash Flow Statement</p>
                                                    <p className="text-xs text-gray-400">Current Academic Year</p>
                                                </div>
                                            </div>
                                            <Button size="sm" className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                                                <Download className="mr-2 h-4 w-4" />
                                                Download
                                            </Button>
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg bg-slate-700/50 p-4 space-y-3 sm:space-y-0">
                                            <div className="flex items-center">
                                                <FileText className="mr-3 h-5 w-5 text-amber-500" />
                                                <div>
                                                    <p className="font-medium">Accounts Receivable Aging</p>
                                                    <p className="text-xs text-gray-400">As of May 31, 2023</p>
                                                </div>
                                            </div>
                                            <Button size="sm" className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                                                <Download className="mr-2 h-4 w-4" />
                                                Download
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="bg-slate-800/60 border-slate-700 text-white mt-6">
                            <CardHeader>
                                <CardTitle>Financial Metrics</CardTitle>
                                <CardDescription className="text-gray-300">Key performance indicators</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-400">Return on Investment</p>
                                        <p className="text-2xl font-bold">18.5%</p>
                                        <div className="h-2 w-full rounded-full bg-slate-600">
                                            <div className="h-2 rounded-full bg-green-500" style={{ width: "75%" }}></div>
                                        </div>
                                        <p className="text-xs text-gray-400">Target: 15%</p>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-400">Debt-to-Equity Ratio</p>
                                        <p className="text-2xl font-bold">0.32</p>
                                        <div className="h-2 w-full rounded-full bg-slate-600">
                                            <div className="h-2 rounded-full bg-blue-500" style={{ width: "32%" }}></div>
                                        </div>
                                        <p className="text-xs text-gray-400">Target: {"< 0.5"}</p>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-400">Current Ratio</p>
                                        <p className="text-2xl font-bold">2.4</p>
                                        <div className="h-2 w-full rounded-full bg-slate-600">
                                            <div className="h-2 rounded-full bg-purple-500" style={{ width: "80%" }}></div>
                                        </div>
                                        <p className="text-xs text-gray-400">Target: {"> 2.0"}</p>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-400">Asset Turnover</p>
                                        <p className="text-2xl font-bold">1.8</p>
                                        <div className="h-2 w-full rounded-full bg-slate-600">
                                            <div className="h-2 rounded-full bg-amber-500" style={{ width: "60%" }}></div>
                                        </div>
                                        <p className="text-xs text-gray-400">Target: {"> 1.5"}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    )
}
