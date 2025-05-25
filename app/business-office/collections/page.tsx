"use client"

import { useState } from "react"
import { BusinessOfficeLayout } from "@/components/layout/business-office-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { DateRangePicker } from "@/components/admin/date-range-picker"
import { PaymentChart } from "@/components/dashboard/payment-chart"
import { PaymentPieChart } from "@/components/dashboard/payment-pie-chart"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    Download,
    TrendingUp,
    Search,
    Filter,
    AlertCircle,
    Users,
    Calendar,
    FileText,
    CreditCard,
    Clock,
    CheckCircle,
} from "lucide-react"

// Mock data for collections
const collectionsData = [
    {
        id: "COL-2023-001",
        date: "2023-09-01",
        studentId: "2023-0001",
        studentName: "John Smith",
        course: "BS Computer Science",
        feeType: "Tuition Fee",
        amount: 15000,
        paymentMethod: "Credit Card",
        status: "Collected",
        cashier: "Maria Garcia",
    },
    {
        id: "COL-2023-002",
        date: "2023-09-01",
        studentId: "2023-0002",
        studentName: "Sarah Williams",
        course: "BS Information Technology",
        feeType: "Laboratory Fee",
        amount: 5000,
        paymentMethod: "E-Wallet",
        status: "Collected",
        cashier: "Maria Garcia",
    },
    {
        id: "COL-2023-003",
        date: "2023-08-31",
        studentId: "2023-0003",
        studentName: "David Brown",
        course: "BS Electronics Engineering",
        feeType: "Tuition Fee",
        amount: 12000,
        paymentMethod: "Bank Transfer",
        status: "Collected",
        cashier: "Elizabeth Wilson",
    },
    {
        id: "COL-2023-004",
        date: "2023-08-30",
        studentId: "2023-0004",
        studentName: "Michael Miller",
        course: "BS Business Administration",
        feeType: "Tuition Fee",
        amount: 8000,
        paymentMethod: "Credit Card",
        status: "Pending",
        cashier: "Maria Garcia",
    },
    {
        id: "COL-2023-005",
        date: "2023-08-29",
        studentId: "2023-0005",
        studentName: "Jennifer Davis",
        course: "BS Education",
        feeType: "Library Fee",
        amount: 1500,
        paymentMethod: "E-Wallet",
        status: "Collected",
        cashier: "Elizabeth Wilson",
    },
]

const outstandingData = [
    {
        studentId: "2023-0006",
        studentName: "James Moore",
        course: "BS Computer Science",
        totalFees: 35000,
        amountPaid: 15000,
        balance: 20000,
        dueDate: "2023-09-30",
        daysOverdue: 0,
        status: "Current",
    },
    {
        studentId: "2023-0007",
        studentName: "Patricia Taylor",
        course: "BS Information Technology",
        totalFees: 32000,
        amountPaid: 0,
        balance: 32000,
        dueDate: "2023-08-31",
        daysOverdue: 1,
        status: "Overdue",
    },
    {
        studentId: "2023-0008",
        studentName: "Robert Johnson",
        course: "BS Electronics Engineering",
        totalFees: 38500,
        amountPaid: 10000,
        balance: 28500,
        dueDate: "2023-09-15",
        daysOverdue: 0,
        status: "Current",
    },
]

const collectionTrend = [
    { month: "Jan", amount: 1200000 },
    { month: "Feb", amount: 1450000 },
    { month: "Mar", amount: 1350000 },
    { month: "Apr", amount: 1500000 },
    { month: "May", amount: 1800000 },
    { month: "Jun", amount: 1700000 },
    { month: "Jul", amount: 1900000 },
    { month: "Aug", amount: 2100000 },
]

const paymentMethodDistribution = [
    { name: "Credit Card", value: 4500000 },
    { name: "E-Wallet", value: 3200000 },
    { name: "Bank Transfer", value: 2300000 },
    { name: "Cash", value: 500000 },
]

const courseCollectionDistribution = [
    { name: "BS Computer Science", value: 3500000 },
    { name: "BS Information Technology", value: 2800000 },
    { name: "BS Electronics Engineering", value: 2200000 },
    { name: "BS Business Administration", value: 1500000 },
    { name: "BS Education", value: 500000 },
]

export default function BusinessOfficeCollectionsPage() {
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [courseFilter, setCourseFilter] = useState("all")
    const [paymentMethodFilter, setPaymentMethodFilter] = useState("all")

    // Filter collections based on search and filters
    const filteredCollections = collectionsData.filter((collection) => {
        const matchesSearch =
            collection.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            collection.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            collection.id.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = statusFilter === "all" || collection.status.toLowerCase() === statusFilter.toLowerCase()
        const matchesCourse = courseFilter === "all" || collection.course.includes(courseFilter)
        const matchesPaymentMethod =
            paymentMethodFilter === "all" || collection.paymentMethod.toLowerCase().replace(" ", "-") === paymentMethodFilter

        return matchesSearch && matchesStatus && matchesCourse && matchesPaymentMethod
    })

    // Filter outstanding balances
    const filteredOutstanding = outstandingData.filter((student) => {
        const matchesSearch =
            student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.studentId.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesCourse = courseFilter === "all" || student.course.includes(courseFilter)

        return matchesSearch && matchesCourse
    })

    return (
        <BusinessOfficeLayout>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Collections Management</h1>
                        <p className="text-gray-300">Monitor and manage fee collections</p>
                    </div>
                    <div className="mt-4 flex space-x-3 md:mt-0">
                        <DateRangePicker />
                        <Button className="bg-primary hover:bg-primary/90">
                            <Download className="mr-2 h-4 w-4" />
                            Export Report
                        </Button>
                    </div>
                </div>

                <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Collections</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₱10,500,000</div>
                            <p className="text-xs text-gray-400 mt-1">
                                <TrendingUp className="inline h-3 w-3 text-green-500 mr-1" />
                                +15% from last month
                            </p>
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
                            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">92.5%</div>
                            <p className="text-xs text-gray-400 mt-1">
                                <CheckCircle className="inline h-3 w-3 text-green-500 mr-1" />
                                Above target (90%)
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Overdue Accounts</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">12</div>
                            <p className="text-xs text-gray-400 mt-1">
                                <Clock className="inline h-3 w-3 text-red-500 mr-1" />
                                Requires attention
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Alert className="mb-8 bg-amber-500/20 border-amber-500/50 text-amber-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        There are 12 accounts with overdue payments totaling ₱320,000. Consider sending payment reminders.
                    </AlertDescription>
                </Alert>

                <Tabs defaultValue="collections" className="w-full">
                    <TabsList className="bg-slate-800 border-slate-700 mb-8 grid w-full grid-cols-4 lg:max-w-[800px]">
                        <TabsTrigger value="collections" className="cursor-pointer">
                            Collections
                        </TabsTrigger>
                        <TabsTrigger value="outstanding" className="cursor-pointer">
                            Outstanding
                        </TabsTrigger>
                        <TabsTrigger value="trends" className="cursor-pointer">
                            Trends
                        </TabsTrigger>
                        <TabsTrigger value="analysis" className="cursor-pointer">
                            Analysis
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="collections">
                        <Card className="bg-slate-800/60 border-slate-700 text-white mb-6">
                            <CardContent className="p-6">
                                <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            placeholder="Search by ID, student name..."
                                            className="pl-10 bg-slate-700 border-slate-600"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex space-x-4">
                                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                                            <SelectTrigger className="w-[150px] bg-slate-700 border-slate-600">
                                                <div className="flex items-center">
                                                    <Filter className="mr-2 h-4 w-4 text-gray-400" />
                                                    <span className="truncate">Status</span>
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                                <SelectItem value="all">All Status</SelectItem>
                                                <SelectItem value="collected">Collected</SelectItem>
                                                <SelectItem value="pending">Pending</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select value={courseFilter} onValueChange={setCourseFilter}>
                                            <SelectTrigger className="w-[180px] bg-slate-700 border-slate-600">
                                                <div className="flex items-center">
                                                    <Filter className="mr-2 h-4 w-4 text-gray-400" />
                                                    <span className="truncate">Course</span>
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                                <SelectItem value="all">All Courses</SelectItem>
                                                <SelectItem value="Computer Science">BS Computer Science</SelectItem>
                                                <SelectItem value="Information Technology">BS Information Technology</SelectItem>
                                                <SelectItem value="Electronics Engineering">BS Electronics Engineering</SelectItem>
                                                <SelectItem value="Business Administration">BS Business Administration</SelectItem>
                                                <SelectItem value="Education">BS Education</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                                            <SelectTrigger className="w-[180px] bg-slate-700 border-slate-600">
                                                <div className="flex items-center">
                                                    <Filter className="mr-2 h-4 w-4 text-gray-400" />
                                                    <span className="truncate">Payment Method</span>
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
                                <CardTitle>Recent Collections</CardTitle>
                                <CardDescription className="text-gray-300">
                                    Showing {filteredCollections.length} collection records
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-lg border border-slate-700">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-slate-700 bg-slate-900/50 text-left text-sm font-medium text-gray-300">
                                                    <th className="px-6 py-3">Collection ID</th>
                                                    <th className="px-6 py-3">Date</th>
                                                    <th className="px-6 py-3">Student</th>
                                                    <th className="px-6 py-3">Course</th>
                                                    <th className="px-6 py-3">Fee Type</th>
                                                    <th className="px-6 py-3">Amount</th>
                                                    <th className="px-6 py-3">Payment Method</th>
                                                    <th className="px-6 py-3">Status</th>
                                                    <th className="px-6 py-3">Cashier</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-700">
                                                {filteredCollections.map((collection) => (
                                                    <tr key={collection.id} className="text-sm">
                                                        <td className="whitespace-nowrap px-6 py-4 font-medium">{collection.id}</td>
                                                        <td className="whitespace-nowrap px-6 py-4">{collection.date}</td>
                                                        <td className="px-6 py-4">
                                                            <div>
                                                                <p className="font-medium">{collection.studentName}</p>
                                                                <p className="text-xs text-gray-400">{collection.studentId}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">{collection.course}</td>
                                                        <td className="px-6 py-4">{collection.feeType}</td>
                                                        <td className="whitespace-nowrap px-6 py-4">₱{collection.amount.toLocaleString()}</td>
                                                        <td className="px-6 py-4">{collection.paymentMethod}</td>
                                                        <td className="whitespace-nowrap px-6 py-4">
                                                            {collection.status === "Collected" ? (
                                                                <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-500">
                                                                    Collected
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-500">
                                                                    Pending
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">{collection.cashier}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="outstanding">
                        <Card className="bg-slate-800/60 border-slate-700 text-white">
                            <CardHeader>
                                <CardTitle>Outstanding Balances</CardTitle>
                                <CardDescription className="text-gray-300">Students with unpaid or partially paid fees</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-lg border border-slate-700">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-slate-700 bg-slate-900/50 text-left text-sm font-medium text-gray-300">
                                                    <th className="px-6 py-3">Student ID</th>
                                                    <th className="px-6 py-3">Student Name</th>
                                                    <th className="px-6 py-3">Course</th>
                                                    <th className="px-6 py-3">Total Fees</th>
                                                    <th className="px-6 py-3">Amount Paid</th>
                                                    <th className="px-6 py-3">Balance</th>
                                                    <th className="px-6 py-3">Due Date</th>
                                                    <th className="px-6 py-3">Days Overdue</th>
                                                    <th className="px-6 py-3">Status</th>
                                                    <th className="px-6 py-3">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-700">
                                                {filteredOutstanding.map((student) => (
                                                    <tr key={student.studentId} className="text-sm">
                                                        <td className="whitespace-nowrap px-6 py-4 font-medium">{student.studentId}</td>
                                                        <td className="px-6 py-4">{student.studentName}</td>
                                                        <td className="px-6 py-4">{student.course}</td>
                                                        <td className="whitespace-nowrap px-6 py-4">₱{student.totalFees.toLocaleString()}</td>
                                                        <td className="whitespace-nowrap px-6 py-4">₱{student.amountPaid.toLocaleString()}</td>
                                                        <td className="whitespace-nowrap px-6 py-4 font-medium text-amber-500">
                                                            ₱{student.balance.toLocaleString()}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4">{student.dueDate}</td>
                                                        <td className="whitespace-nowrap px-6 py-4">
                                                            {student.daysOverdue > 0 ? (
                                                                <span className="text-red-500">{student.daysOverdue} days</span>
                                                            ) : (
                                                                <span className="text-gray-400">-</span>
                                                            )}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4">
                                                            {student.status === "Overdue" ? (
                                                                <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-500">
                                                                    Overdue
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-500">
                                                                    Current
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-slate-600 text-white hover:bg-slate-700"
                                                            >
                                                                Send Reminder
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <Card className="bg-slate-700/50 border-slate-600">
                                        <CardContent className="p-4">
                                            <p className="text-sm text-gray-400">Total Outstanding</p>
                                            <p className="text-2xl font-bold">₱850,000</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-slate-700/50 border-slate-600">
                                        <CardContent className="p-4">
                                            <p className="text-sm text-gray-400">Overdue Amount</p>
                                            <p className="text-2xl font-bold text-red-500">₱320,000</p>
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

                    <TabsContent value="trends">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Collection Trends</CardTitle>
                                    <CardDescription className="text-gray-300">Monthly collection performance</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-80">
                                        <PaymentChart data={collectionTrend} />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Payment Methods</CardTitle>
                                    <CardDescription className="text-gray-300">Distribution by payment method</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-80">
                                        <PaymentPieChart data={paymentMethodDistribution} />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Collection Efficiency</CardTitle>
                                    <CardDescription className="text-gray-300">Key performance metrics</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm text-gray-400">Average Collection Time</span>
                                            <span className="text-sm font-medium">3.2 days</span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-slate-600">
                                            <div className="h-2 rounded-full bg-green-500" style={{ width: "85%" }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm text-gray-400">First Contact Resolution</span>
                                            <span className="text-sm font-medium">78%</span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-slate-600">
                                            <div className="h-2 rounded-full bg-blue-500" style={{ width: "78%" }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm text-gray-400">Payment Success Rate</span>
                                            <span className="text-sm font-medium">95%</span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-slate-600">
                                            <div className="h-2 rounded-full bg-green-500" style={{ width: "95%" }}></div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Top Performing Courses</CardTitle>
                                    <CardDescription className="text-gray-300">By collection rate</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">BS Computer Science</span>
                                        <span className="text-sm font-medium text-green-500">98%</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">BS Information Technology</span>
                                        <span className="text-sm font-medium text-green-500">95%</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">BS Electronics Engineering</span>
                                        <span className="text-sm font-medium text-amber-500">88%</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">BS Business Administration</span>
                                        <span className="text-sm font-medium text-amber-500">85%</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">BS Education</span>
                                        <span className="text-sm font-medium text-red-500">72%</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Collection Forecast</CardTitle>
                                    <CardDescription className="text-gray-300">Next month projection</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="text-center">
                                        <p className="text-sm text-gray-400">Expected Collections</p>
                                        <p className="text-3xl font-bold text-green-500">₱2.5M</p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Tuition Fees</span>
                                            <span>₱1.8M</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Laboratory Fees</span>
                                            <span>₱450K</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Other Fees</span>
                                            <span>₱250K</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="analysis">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Collection by Course</CardTitle>
                                    <CardDescription className="text-gray-300">Revenue distribution by program</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-80">
                                        <PaymentPieChart data={courseCollectionDistribution} />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Collection Analysis</CardTitle>
                                    <CardDescription className="text-gray-300">Key insights and recommendations</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Alert className="bg-green-500/20 border-green-500/50 text-green-200">
                                        <CheckCircle className="h-4 w-4" />
                                        <AlertDescription>
                                            Collection rate has improved by 8% compared to last semester. Credit card payments show the
                                            highest success rate.
                                        </AlertDescription>
                                    </Alert>

                                    <Alert className="bg-amber-500/20 border-amber-500/50 text-amber-200">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>
                                            BS Education program has the lowest collection rate at 72%. Consider implementing targeted payment
                                            plans.
                                        </AlertDescription>
                                    </Alert>

                                    <Alert className="bg-blue-500/20 border-blue-500/50 text-blue-200">
                                        <TrendingUp className="h-4 w-4" />
                                        <AlertDescription>
                                            E-wallet payments increased by 35% this semester. Consider promoting this payment method for
                                            faster collections.
                                        </AlertDescription>
                                    </Alert>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="bg-slate-800/60 border-slate-700 text-white mt-6">
                            <CardHeader>
                                <CardTitle>Recommended Actions</CardTitle>
                                <CardDescription className="text-gray-300">Based on collection analysis</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    <div className="rounded-lg bg-slate-700/50 p-4">
                                        <div className="flex items-center mb-2">
                                            <FileText className="h-5 w-5 text-blue-500 mr-2" />
                                            <h3 className="font-medium">Payment Reminders</h3>
                                        </div>
                                        <p className="text-sm text-gray-400">Send automated reminders to 12 overdue accounts</p>
                                        <Button size="sm" className="mt-3 w-full bg-primary hover:bg-primary/90">
                                            Send Reminders
                                        </Button>
                                    </div>

                                    <div className="rounded-lg bg-slate-700/50 p-4">
                                        <div className="flex items-center mb-2">
                                            <CreditCard className="h-5 w-5 text-green-500 mr-2" />
                                            <h3 className="font-medium">Payment Plans</h3>
                                        </div>
                                        <p className="text-sm text-gray-400">Offer installment plans for students with large balances</p>
                                        <Button
                                            size="sm"
                                            className="mt-3 w-full"
                                            variant="outline"
                                            className="border-slate-600 text-white hover:bg-slate-700"
                                        >
                                            Create Plans
                                        </Button>
                                    </div>

                                    <div className="rounded-lg bg-slate-700/50 p-4">
                                        <div className="flex items-center mb-2">
                                            <Calendar className="h-5 w-5 text-purple-500 mr-2" />
                                            <h3 className="font-medium">Schedule Follow-ups</h3>
                                        </div>
                                        <p className="text-sm text-gray-400">Set up collection follow-up calls for high-value accounts</p>
                                        <Button
                                            size="sm"
                                            className="mt-3 w-full"
                                            variant="outline"
                                            className="border-slate-600 text-white hover:bg-slate-700"
                                        >
                                            Schedule Calls
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </BusinessOfficeLayout>
    )
}
