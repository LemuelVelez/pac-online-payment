"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PaymentChart } from "@/components/dashboard/payment-chart"
import { PaymentPieChart } from "@/components/dashboard/payment-pie-chart"
import { Calendar, Download, FileText, Printer, Filter } from "lucide-react"
import { DateRangePicker } from "@/components/admin/date-range-picker"
import { ReportTable } from "@/components/admin/report-table"

// Mock data for reports
const collectionData = [
    { month: "Jan", amount: 120000 },
    { month: "Feb", amount: 145000 },
    { month: "Mar", amount: 135000 },
    { month: "Apr", amount: 150000 },
    { month: "May", amount: 180000 },
    { month: "Jun", amount: 170000 },
    { month: "Jul", amount: 190000 },
    { month: "Aug", amount: 210000 },
    { month: "Sep", amount: 0 },
    { month: "Oct", amount: 0 },
    { month: "Nov", amount: 0 },
    { month: "Dec", amount: 0 },
]

const feeDistribution = [
    { name: "Tuition", value: 650000 },
    { name: "Laboratory", value: 180000 },
    { name: "Library", value: 45000 },
    { name: "Miscellaneous", value: 120000 },
]

const courseDistribution = [
    { name: "BS Computer Science", value: 350000 },
    { name: "BS Information Technology", value: 280000 },
    { name: "BS Electronics Engineering", value: 220000 },
    { name: "BS Business Administration", value: 180000 },
    { name: "BS Education", value: 150000 },
]

const collectionReportData = [
    {
        id: "COL-1001",
        date: "2023-08-31",
        paymentMethod: "Credit Card",
        amount: 15000,
        feeType: "Tuition",
        course: "BS Computer Science",
        studentId: "2023-0001",
        studentName: "John Smith",
        cashier: "Maria Garcia",
    },
    {
        id: "COL-1002",
        date: "2023-08-30",
        paymentMethod: "E-Wallet",
        amount: 5000,
        feeType: "Laboratory",
        course: "BS Information Technology",
        studentId: "2023-0002",
        studentName: "Sarah Williams",
        cashier: "Maria Garcia",
    },
    {
        id: "COL-1003",
        date: "2023-08-29",
        paymentMethod: "Bank Transfer",
        amount: 12000,
        feeType: "Tuition",
        course: "BS Electronics Engineering",
        studentId: "2023-0003",
        studentName: "David Brown",
        cashier: "Elizabeth Wilson",
    },
    {
        id: "COL-1004",
        date: "2023-08-28",
        paymentMethod: "Credit Card",
        amount: 8000,
        feeType: "Tuition",
        course: "BS Business Administration",
        studentId: "2023-0004",
        studentName: "Michael Miller",
        cashier: "Elizabeth Wilson",
    },
    {
        id: "COL-1005",
        date: "2023-08-27",
        paymentMethod: "E-Wallet",
        amount: 1500,
        feeType: "Library",
        course: "BS Education",
        studentId: "2023-0005",
        studentName: "Jennifer Davis",
        cashier: "Maria Garcia",
    },
]

const outstandingBalanceData = [
    {
        id: "BAL-1001",
        studentId: "2023-0006",
        studentName: "James Moore",
        course: "BS Computer Science",
        totalFees: 35000,
        amountPaid: 15000,
        balance: 20000,
        dueDate: "2023-09-30",
        status: "Partial",
    },
    {
        id: "BAL-1002",
        studentId: "2023-0007",
        studentName: "Patricia Taylor",
        course: "BS Information Technology",
        totalFees: 32000,
        amountPaid: 0,
        balance: 32000,
        dueDate: "2023-09-30",
        status: "Unpaid",
    },
    {
        id: "BAL-1003",
        studentId: "2023-0008",
        studentName: "Robert Johnson",
        course: "BS Electronics Engineering",
        totalFees: 38500,
        amountPaid: 10000,
        balance: 28500,
        dueDate: "2023-09-30",
        status: "Partial",
    },
    {
        id: "BAL-1004",
        studentId: "2023-0009",
        studentName: "Elizabeth Wilson",
        course: "BS Business Administration",
        totalFees: 28500,
        amountPaid: 5000,
        balance: 23500,
        dueDate: "2023-09-30",
        status: "Partial",
    },
    {
        id: "BAL-1005",
        studentId: "2023-0010",
        studentName: "Michael Miller",
        course: "BS Education",
        totalFees: 26000,
        amountPaid: 0,
        balance: 26000,
        dueDate: "2023-09-30",
        status: "Unpaid",
    },
]

export default function AdminReportsPage() {
    const [selectedPeriod, setSelectedPeriod] = useState("monthly")
    const [selectedCourse, setSelectedCourse] = useState("all")
    const [selectedFeeType, setSelectedFeeType] = useState("all")
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("all")

    return (
        <AdminLayout>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Reports</h1>
                        <p className="text-gray-300">Generate and view financial reports</p>
                    </div>
                    <div className="mt-4 flex space-x-3 md:mt-0">
                        <DateRangePicker />
                        <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                            <Printer className="mr-2 h-4 w-4" />
                            Print
                        </Button>
                        <Button className="bg-primary hover:bg-primary/90">
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="collections" className="w-full">
                    <TabsList className="bg-slate-800 border-slate-700 mb-8 grid w-full grid-cols-3 lg:max-w-[600px]">
                        <TabsTrigger value="collections" className="cursor-pointer">
                            Collections
                        </TabsTrigger>
                        <TabsTrigger value="outstanding" className="cursor-pointer">
                            Outstanding Balances
                        </TabsTrigger>
                        <TabsTrigger value="analytics" className="cursor-pointer">
                            Analytics
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="collections">
                        <Card className="bg-slate-800/60 border-slate-700 text-white mb-8">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div>
                                    <CardTitle>Collection Report</CardTitle>
                                    <CardDescription className="text-gray-300">
                                        Summary of all collections for the selected period
                                    </CardDescription>
                                </div>
                                <div className="flex space-x-2">
                                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                                        <SelectTrigger className="w-[150px] bg-slate-700 border-slate-600">
                                            <SelectValue placeholder="Select period" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                            <SelectItem value="weekly">Weekly</SelectItem>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                            <SelectItem value="quarterly">Quarterly</SelectItem>
                                            <SelectItem value="yearly">Yearly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80">
                                    <PaymentChart data={collectionData} />
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader className="pb-2">
                                    <CardTitle>Fee Distribution</CardTitle>
                                    <CardDescription className="text-gray-300">Breakdown of collections by fee type</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-80">
                                        <PaymentPieChart data={feeDistribution} />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader className="pb-2">
                                    <CardTitle>Course Distribution</CardTitle>
                                    <CardDescription className="text-gray-300">Breakdown of collections by course</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-80">
                                        <PaymentPieChart data={courseDistribution} />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="bg-slate-800/60 border-slate-700 text-white">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Detailed Collection Report</CardTitle>
                                    <CardDescription className="text-gray-300">Detailed list of all collections</CardDescription>
                                </div>
                                <div className="flex space-x-2">
                                    <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                                        <SelectTrigger className="w-[180px] bg-slate-700 border-slate-600">
                                            <div className="flex items-center">
                                                <Filter className="mr-2 h-4 w-4 text-gray-400" />
                                                <span className="truncate">Course</span>
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                            <SelectItem value="all">All Courses</SelectItem>
                                            <SelectItem value="bscs">BS Computer Science</SelectItem>
                                            <SelectItem value="bsit">BS Information Technology</SelectItem>
                                            <SelectItem value="bsece">BS Electronics Engineering</SelectItem>
                                            <SelectItem value="bsba">BS Business Administration</SelectItem>
                                            <SelectItem value="bsed">BS Education</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={selectedFeeType} onValueChange={setSelectedFeeType}>
                                        <SelectTrigger className="w-[180px] bg-slate-700 border-slate-600">
                                            <div className="flex items-center">
                                                <Filter className="mr-2 h-4 w-4 text-gray-400" />
                                                <span className="truncate">Fee Type</span>
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
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ReportTable
                                    data={collectionReportData}
                                    columns={[
                                        { header: "Reference ID", accessor: "id" },
                                        { header: "Date", accessor: "date" },
                                        { header: "Student ID", accessor: "studentId" },
                                        { header: "Student Name", accessor: "studentName" },
                                        { header: "Course", accessor: "course" },
                                        { header: "Fee Type", accessor: "feeType" },
                                        { header: "Payment Method", accessor: "paymentMethod" },
                                        { header: "Amount", accessor: "amount", format: (value) => `₱${value.toLocaleString()}` },
                                        { header: "Cashier", accessor: "cashier" },
                                    ]}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="outstanding">
                        <Card className="bg-slate-800/60 border-slate-700 text-white mb-8">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Outstanding Balances</CardTitle>
                                    <CardDescription className="text-gray-300">
                                        Students with unpaid or partially paid fees
                                    </CardDescription>
                                </div>
                                <div className="flex space-x-2">
                                    <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                                        <SelectTrigger className="w-[180px] bg-slate-700 border-slate-600">
                                            <div className="flex items-center">
                                                <Filter className="mr-2 h-4 w-4 text-gray-400" />
                                                <span className="truncate">Course</span>
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                            <SelectItem value="all">All Courses</SelectItem>
                                            <SelectItem value="bscs">BS Computer Science</SelectItem>
                                            <SelectItem value="bsit">BS Information Technology</SelectItem>
                                            <SelectItem value="bsece">BS Electronics Engineering</SelectItem>
                                            <SelectItem value="bsba">BS Business Administration</SelectItem>
                                            <SelectItem value="bsed">BS Education</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ReportTable
                                    data={outstandingBalanceData}
                                    columns={[
                                        { header: "Student ID", accessor: "studentId" },
                                        { header: "Student Name", accessor: "studentName" },
                                        { header: "Course", accessor: "course" },
                                        { header: "Total Fees", accessor: "totalFees", format: (value) => `₱${value.toLocaleString()}` },
                                        { header: "Amount Paid", accessor: "amountPaid", format: (value) => `₱${value.toLocaleString()}` },
                                        { header: "Balance", accessor: "balance", format: (value) => `₱${value.toLocaleString()}` },
                                        { header: "Due Date", accessor: "dueDate" },
                                        {
                                            header: "Status",
                                            accessor: "status",
                                            format: (value) => {
                                                const statusClasses = {
                                                    Unpaid: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500",
                                                    Partial: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500",
                                                    Paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500",
                                                }
                                                return (
                                                    <span
                                                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusClasses[value as keyof typeof statusClasses]
                                                            }`}
                                                    >
                                                        {value}
                                                    </span>
                                                )
                                            },
                                        },
                                    ]}
                                />
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Summary</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex justify-between">
                                            <span className="text-gray-300">Total Students with Balance:</span>
                                            <span className="font-medium">5</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-300">Total Outstanding Amount:</span>
                                            <span className="font-medium">₱130,000.00</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-300">Fully Unpaid:</span>
                                            <span className="font-medium">2</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-300">Partially Paid:</span>
                                            <span className="font-medium">3</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-800/60 border-slate-700 text-white md:col-span-2">
                                <CardHeader>
                                    <CardTitle>Actions</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <Button className="bg-primary hover:bg-primary/90">
                                            <FileText className="mr-2 h-4 w-4" />
                                            Generate Payment Reminders
                                        </Button>
                                        <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                                            <Calendar className="mr-2 h-4 w-4" />
                                            Schedule Follow-ups
                                        </Button>
                                        <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                                            <Download className="mr-2 h-4 w-4" />
                                            Export to Excel
                                        </Button>
                                        <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                                            <Printer className="mr-2 h-4 w-4" />
                                            Print Report
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="analytics">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <div>
                                        <CardTitle>Collection Trends</CardTitle>
                                        <CardDescription className="text-gray-300">Monthly collection trends for the year</CardDescription>
                                    </div>
                                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                                        <SelectTrigger className="w-[150px] bg-slate-700 border-slate-600">
                                            <SelectValue placeholder="Select period" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                            <SelectItem value="weekly">Weekly</SelectItem>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                            <SelectItem value="quarterly">Quarterly</SelectItem>
                                            <SelectItem value="yearly">Yearly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-80">
                                        <PaymentChart data={collectionData} />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <div>
                                        <CardTitle>Payment Method Analysis</CardTitle>
                                        <CardDescription className="text-gray-300">
                                            Distribution of payments by payment method
                                        </CardDescription>
                                    </div>
                                    <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
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
                                        </SelectContent>
                                    </Select>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-80">
                                        <PaymentPieChart
                                            data={[
                                                { name: "Credit Card", value: 450000 },
                                                { name: "E-Wallet", value: 320000 },
                                                { name: "Bank Transfer", value: 230000 },
                                            ]}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Collection Rate Analysis</CardTitle>
                                    <CardDescription className="text-gray-300">Analysis of collection rates by course</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        <div>
                                            <div className="mb-1 flex justify-between">
                                                <span>BS Computer Science</span>
                                                <span>85%</span>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-slate-600">
                                                <div className="h-2 rounded-full bg-green-500" style={{ width: "85%" }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="mb-1 flex justify-between">
                                                <span>BS Information Technology</span>
                                                <span>78%</span>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-slate-600">
                                                <div className="h-2 rounded-full bg-green-500" style={{ width: "78%" }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="mb-1 flex justify-between">
                                                <span>BS Electronics Engineering</span>
                                                <span>72%</span>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-slate-600">
                                                <div className="h-2 rounded-full bg-green-500" style={{ width: "72%" }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="mb-1 flex justify-between">
                                                <span>BS Business Administration</span>
                                                <span>65%</span>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-slate-600">
                                                <div className="h-2 rounded-full bg-amber-500" style={{ width: "65%" }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="mb-1 flex justify-between">
                                                <span>BS Education</span>
                                                <span>58%</span>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-slate-600">
                                                <div className="h-2 rounded-full bg-amber-500" style={{ width: "58%" }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Key Insights</CardTitle>
                                    <CardDescription className="text-gray-300">
                                        Important insights from the financial data
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="rounded-lg bg-blue-500/20 p-4 text-blue-200">
                                            <h3 className="mb-2 font-medium">Collection Growth</h3>
                                            <p className="text-sm">
                                                Collections have increased by 15% compared to the same period last year, with the highest growth
                                                in BS Computer Science program.
                                            </p>
                                        </div>
                                        <div className="rounded-lg bg-green-500/20 p-4 text-green-200">
                                            <h3 className="mb-2 font-medium">Payment Method Shift</h3>
                                            <p className="text-sm">
                                                E-wallet payments have increased by 25% this year, indicating a shift in student payment
                                                preferences from traditional methods.
                                            </p>
                                        </div>
                                        <div className="rounded-lg bg-amber-500/20 p-4 text-amber-200">
                                            <h3 className="mb-2 font-medium">Outstanding Balance Alert</h3>
                                            <p className="text-sm">
                                                BS Education program has the highest percentage of outstanding balances at 42%. Consider
                                                implementing targeted payment reminders.
                                            </p>
                                        </div>
                                        <div className="rounded-lg bg-purple-500/20 p-4 text-purple-200">
                                            <h3 className="mb-2 font-medium">Collection Forecast</h3>
                                            <p className="text-sm">
                                                Based on current trends, we project a 10% increase in total collections by the end of the
                                                semester.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </AdminLayout>
    )
}
