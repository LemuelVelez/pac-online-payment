"use client"

import { useState } from "react"
import { BusinessOfficeLayout } from "@/components/layout/business-office-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatCard, ProgressFooter } from "@/components/dashboard/stat-card"
import { PaymentChart } from "@/components/dashboard/payment-chart"
import { PaymentPieChart } from "@/components/dashboard/payment-pie-chart"
import { TransactionItem } from "@/components/dashboard/transaction-item"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    AlertCircle,
    Calendar,
    Download,
    TrendingUp,
    DollarSign,
    PieChart,
    CreditCard,
    ArrowUpRight,
    ArrowDownRight,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Mock data for the dashboard
const monthlyRevenue = [
    { month: "Jan", amount: 1200000 },
    { month: "Feb", amount: 1450000 },
    { month: "Mar", amount: 1350000 },
    { month: "Apr", amount: 1500000 },
    { month: "May", amount: 1800000 },
    { month: "Jun", amount: 1700000 },
    { month: "Jul", amount: 1900000 },
    { month: "Aug", amount: 2100000 },
    { month: "Sep", amount: 0 },
    { month: "Oct", amount: 0 },
    { month: "Nov", amount: 0 },
    { month: "Dec", amount: 0 },
]

const revenueByCategory = [
    { name: "Tuition Fees", value: 6500000 },
    { name: "Laboratory Fees", value: 1800000 },
    { name: "Library Fees", value: 450000 },
    { name: "Miscellaneous", value: 1200000 },
    { name: "Other Income", value: 550000 },
]

const departmentBudget = [
    { name: "Academic Affairs", value: 3500000 },
    { name: "Student Services", value: 1200000 },
    { name: "Administration", value: 2800000 },
    { name: "Facilities", value: 1500000 },
    { name: "IT Services", value: 1000000 },
]

export default function BusinessOfficeDashboardPage() {
    const [selectedPeriod, setSelectedPeriod] = useState("monthly")

    return (
        <BusinessOfficeLayout>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Business Office Dashboard</h1>
                        <p className="text-gray-300">Welcome back, Robert Johnson</p>
                    </div>
                    <div className="mt-4 flex space-x-3 md:mt-0">
                        <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                            <Calendar className="mr-2 h-4 w-4" />
                            Select Date Range
                        </Button>
                        <Button className="bg-primary hover:bg-primary/90">
                            <Download className="mr-2 h-4 w-4" />
                            Export Financial Report
                        </Button>
                    </div>
                </div>

                <Alert className="mb-8 bg-amber-500/20 border-amber-500/50 text-amber-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Budget review meeting scheduled for September 15, 2023. Please prepare the quarterly financial reports.
                    </AlertDescription>
                </Alert>

                <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Revenue"
                        value="₱10,500,000"
                        icon={DollarSign}
                        iconColor="text-green-500"
                        iconBgColor="bg-green-500/20"
                        footer={<ProgressFooter value={85} label="15% increase from last year" />}
                    />
                    <StatCard
                        title="Total Expenses"
                        value="₱8,200,000"
                        icon={CreditCard}
                        iconColor="text-red-500"
                        iconBgColor="bg-red-500/20"
                        footer={<ProgressFooter value={78} label="5% increase from last year" />}
                    />
                    <StatCard
                        title="Net Income"
                        value="₱2,300,000"
                        icon={TrendingUp}
                        iconColor="text-blue-500"
                        iconBgColor="bg-blue-500/20"
                        footer={<ProgressFooter value={22} label="28% profit margin" />}
                    />
                    <StatCard
                        title="Collection Rate"
                        value="92%"
                        icon={PieChart}
                        iconColor="text-purple-500"
                        iconBgColor="bg-purple-500/20"
                        footer={<ProgressFooter value={92} label="8% improvement" />}
                    />
                </div>

                <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div>
                                <CardTitle>Revenue Overview</CardTitle>
                                <CardDescription className="text-gray-300">Monthly revenue trends</CardDescription>
                            </div>
                            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                                <SelectTrigger className="w-[180px] bg-slate-700 border-slate-600">
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
                                <PaymentChart data={monthlyRevenue} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader className="pb-2">
                            <CardTitle>Revenue by Category</CardTitle>
                            <CardDescription className="text-gray-300">Breakdown of revenue sources</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80">
                                <PaymentPieChart data={revenueByCategory} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader>
                            <CardTitle>Recent Transactions</CardTitle>
                            <CardDescription className="text-gray-300">Latest financial activities</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <TransactionItem
                                icon={ArrowUpRight}
                                iconColor="text-green-500"
                                iconBgColor="bg-green-500/20"
                                title="Tuition Fee Collection"
                                date="Today, 2:30 PM"
                                amount="₱150,000"
                                status="Income"
                                statusColor="text-green-500"
                            />
                            <TransactionItem
                                icon={ArrowDownRight}
                                iconColor="text-red-500"
                                iconBgColor="bg-red-500/20"
                                title="Faculty Salaries"
                                date="Today, 10:00 AM"
                                amount="₱450,000"
                                status="Expense"
                                statusColor="text-red-500"
                            />
                            <TransactionItem
                                icon={ArrowUpRight}
                                iconColor="text-green-500"
                                iconBgColor="bg-green-500/20"
                                title="Laboratory Fees"
                                date="Yesterday, 4:15 PM"
                                amount="₱25,000"
                                status="Income"
                                statusColor="text-green-500"
                            />
                            <TransactionItem
                                icon={ArrowDownRight}
                                iconColor="text-red-500"
                                iconBgColor="bg-red-500/20"
                                title="Utility Bills"
                                date="Yesterday, 2:00 PM"
                                amount="₱85,000"
                                status="Expense"
                                statusColor="text-red-500"
                            />
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader>
                            <CardTitle>Budget Allocation</CardTitle>
                            <CardDescription className="text-gray-300">Department budget distribution</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <PaymentPieChart data={departmentBudget} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader>
                            <CardTitle>Financial Metrics</CardTitle>
                            <CardDescription className="text-gray-300">Key performance indicators</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300">Operating Margin</span>
                                <span className="font-medium">22%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300">Current Ratio</span>
                                <span className="font-medium">2.5</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300">Debt-to-Equity</span>
                                <span className="font-medium">0.3</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300">Cash Flow</span>
                                <span className="font-medium text-green-500">Positive</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300">Budget Variance</span>
                                <span className="font-medium text-amber-500">-5%</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="cashflow" className="w-full">
                    <TabsList className="bg-slate-800 border-slate-700 mb-8 grid w-full grid-cols-3 lg:max-w-[600px]">
                        <TabsTrigger value="cashflow" className="cursor-pointer">
                            Cash Flow
                        </TabsTrigger>
                        <TabsTrigger value="receivables" className="cursor-pointer">
                            Receivables
                        </TabsTrigger>
                        <TabsTrigger value="payables" className="cursor-pointer">
                            Payables
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="cashflow">
                        <Card className="bg-slate-800/60 border-slate-700 text-white">
                            <CardHeader>
                                <CardTitle>Cash Flow Statement</CardTitle>
                                <CardDescription className="text-gray-300">Summary of cash inflows and outflows</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-medium mb-4">Operating Activities</h3>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-300">Cash from tuition fees</span>
                                                <span className="text-green-500">+₱6,500,000</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-300">Cash from other fees</span>
                                                <span className="text-green-500">+₱3,450,000</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-300">Salaries and wages</span>
                                                <span className="text-red-500">-₱5,200,000</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-300">Operating expenses</span>
                                                <span className="text-red-500">-₱2,100,000</span>
                                            </div>
                                            <div className="border-t border-slate-700 pt-2 flex justify-between font-medium">
                                                <span>Net cash from operations</span>
                                                <span className="text-green-500">₱2,650,000</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-medium mb-4">Investing Activities</h3>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-300">Equipment purchases</span>
                                                <span className="text-red-500">-₱450,000</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-300">Building improvements</span>
                                                <span className="text-red-500">-₱300,000</span>
                                            </div>
                                            <div className="border-t border-slate-700 pt-2 flex justify-between font-medium">
                                                <span>Net cash from investing</span>
                                                <span className="text-red-500">-₱750,000</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-medium mb-4">Financing Activities</h3>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-300">Loan proceeds</span>
                                                <span className="text-green-500">+₱500,000</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-300">Loan repayments</span>
                                                <span className="text-red-500">-₱200,000</span>
                                            </div>
                                            <div className="border-t border-slate-700 pt-2 flex justify-between font-medium">
                                                <span>Net cash from financing</span>
                                                <span className="text-green-500">₱300,000</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-slate-700 pt-4">
                                        <div className="flex justify-between text-lg font-bold">
                                            <span>Net increase in cash</span>
                                            <span className="text-green-500">₱2,200,000</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="receivables">
                        <Card className="bg-slate-800/60 border-slate-700 text-white">
                            <CardHeader>
                                <CardTitle>Accounts Receivable</CardTitle>
                                <CardDescription className="text-gray-300">Outstanding payments to be collected</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-lg border border-slate-700">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-slate-700 bg-slate-900/50 text-left text-sm font-medium text-gray-300">
                                                    <th className="px-6 py-3">Account</th>
                                                    <th className="px-6 py-3">Type</th>
                                                    <th className="px-6 py-3">Amount</th>
                                                    <th className="px-6 py-3">Due Date</th>
                                                    <th className="px-6 py-3">Age</th>
                                                    <th className="px-6 py-3">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-700">
                                                <tr className="text-sm">
                                                    <td className="px-6 py-4">Student Tuition Fees</td>
                                                    <td className="px-6 py-4">Tuition</td>
                                                    <td className="px-6 py-4">₱850,000</td>
                                                    <td className="px-6 py-4">Sep 30, 2023</td>
                                                    <td className="px-6 py-4">15 days</td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-500">
                                                            Pending
                                                        </span>
                                                    </td>
                                                </tr>
                                                <tr className="text-sm">
                                                    <td className="px-6 py-4">Government Grant</td>
                                                    <td className="px-6 py-4">Grant</td>
                                                    <td className="px-6 py-4">₱2,000,000</td>
                                                    <td className="px-6 py-4">Oct 15, 2023</td>
                                                    <td className="px-6 py-4">0 days</td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-500">
                                                            Current
                                                        </span>
                                                    </td>
                                                </tr>
                                                <tr className="text-sm">
                                                    <td className="px-6 py-4">Corporate Sponsorship</td>
                                                    <td className="px-6 py-4">Sponsorship</td>
                                                    <td className="px-6 py-4">₱500,000</td>
                                                    <td className="px-6 py-4">Sep 15, 2023</td>
                                                    <td className="px-6 py-4">30 days</td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-500">
                                                            Overdue
                                                        </span>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <Card className="bg-slate-700/50 border-slate-600">
                                        <CardContent className="p-4">
                                            <p className="text-sm text-gray-400">Total Receivables</p>
                                            <p className="text-2xl font-bold">₱3,350,000</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-slate-700/50 border-slate-600">
                                        <CardContent className="p-4">
                                            <p className="text-sm text-gray-400">Overdue Amount</p>
                                            <p className="text-2xl font-bold text-red-500">₱500,000</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-slate-700/50 border-slate-600">
                                        <CardContent className="p-4">
                                            <p className="text-sm text-gray-400">Collection Rate</p>
                                            <p className="text-2xl font-bold text-green-500">85%</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="payables">
                        <Card className="bg-slate-800/60 border-slate-700 text-white">
                            <CardHeader>
                                <CardTitle>Accounts Payable</CardTitle>
                                <CardDescription className="text-gray-300">
                                    Outstanding payments to vendors and suppliers
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-lg border border-slate-700">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-slate-700 bg-slate-900/50 text-left text-sm font-medium text-gray-300">
                                                    <th className="px-6 py-3">Vendor</th>
                                                    <th className="px-6 py-3">Category</th>
                                                    <th className="px-6 py-3">Amount</th>
                                                    <th className="px-6 py-3">Due Date</th>
                                                    <th className="px-6 py-3">Terms</th>
                                                    <th className="px-6 py-3">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-700">
                                                <tr className="text-sm">
                                                    <td className="px-6 py-4">ABC Office Supplies</td>
                                                    <td className="px-6 py-4">Supplies</td>
                                                    <td className="px-6 py-4">₱125,000</td>
                                                    <td className="px-6 py-4">Sep 20, 2023</td>
                                                    <td className="px-6 py-4">Net 30</td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-500">
                                                            Due Soon
                                                        </span>
                                                    </td>
                                                </tr>
                                                <tr className="text-sm">
                                                    <td className="px-6 py-4">XYZ Electric Company</td>
                                                    <td className="px-6 py-4">Utilities</td>
                                                    <td className="px-6 py-4">₱85,000</td>
                                                    <td className="px-6 py-4">Sep 25, 2023</td>
                                                    <td className="px-6 py-4">Net 15</td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-500">
                                                            Current
                                                        </span>
                                                    </td>
                                                </tr>
                                                <tr className="text-sm">
                                                    <td className="px-6 py-4">Tech Solutions Inc.</td>
                                                    <td className="px-6 py-4">IT Services</td>
                                                    <td className="px-6 py-4">₱250,000</td>
                                                    <td className="px-6 py-4">Oct 10, 2023</td>
                                                    <td className="px-6 py-4">Net 45</td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-500">
                                                            Current
                                                        </span>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <Card className="bg-slate-700/50 border-slate-600">
                                        <CardContent className="p-4">
                                            <p className="text-sm text-gray-400">Total Payables</p>
                                            <p className="text-2xl font-bold">₱460,000</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-slate-700/50 border-slate-600">
                                        <CardContent className="p-4">
                                            <p className="text-sm text-gray-400">Due This Week</p>
                                            <p className="text-2xl font-bold text-amber-500">₱210,000</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-slate-700/50 border-slate-600">
                                        <CardContent className="p-4">
                                            <p className="text-sm text-gray-400">Payment Terms</p>
                                            <p className="text-2xl font-bold">Net 30</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </BusinessOfficeLayout>
    )
}
