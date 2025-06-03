"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PaymentChart } from "@/components/dashboard/payment-chart"
import { PaymentPieChart } from "@/components/dashboard/payment-pie-chart"
import { DateRangePicker } from "@/components/admin/date-range-picker"
import { ReportTable } from "@/components/admin/report-table"
import { Download, Printer, MoreVertical, Calendar } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

// Mock data for financial reports
const incomeStatementData = {
    revenue: [
        { category: "Tuition Fees", amount: 6500000 },
        { category: "Laboratory Fees", amount: 1800000 },
        { category: "Library Fees", amount: 450000 },
        { category: "Miscellaneous Fees", amount: 1200000 },
        { category: "Other Income", amount: 550000 },
    ],
    expenses: [
        { category: "Salaries & Wages", amount: 5200000 },
        { category: "Operating Expenses", amount: 2100000 },
        { category: "Utilities", amount: 450000 },
        { category: "Maintenance", amount: 300000 },
        { category: "Other Expenses", amount: 150000 },
    ],
}

const balanceSheetData = {
    assets: [
        { category: "Cash & Cash Equivalents", amount: 3500000 },
        { category: "Accounts Receivable", amount: 3350000 },
        { category: "Property & Equipment", amount: 25000000 },
        { category: "Other Assets", amount: 1150000 },
    ],
    liabilities: [
        { category: "Accounts Payable", amount: 460000 },
        { category: "Accrued Expenses", amount: 850000 },
        { category: "Long-term Debt", amount: 5000000 },
        { category: "Other Liabilities", amount: 690000 },
    ],
}

const budgetVarianceData = [
    {
        department: "Academic Affairs",
        budgeted: 3500000,
        actual: 3350000,
        variance: -150000,
        variancePercent: -4.3,
    },
    {
        department: "Student Services",
        budgeted: 1200000,
        actual: 1250000,
        variance: 50000,
        variancePercent: 4.2,
    },
    {
        department: "Administration",
        budgeted: 2800000,
        actual: 2750000,
        variance: -50000,
        variancePercent: -1.8,
    },
    {
        department: "Facilities",
        budgeted: 1500000,
        actual: 1600000,
        variance: 100000,
        variancePercent: 6.7,
    },
    {
        department: "IT Services",
        budgeted: 1000000,
        actual: 950000,
        variance: -50000,
        variancePercent: -5.0,
    },
]

const monthlyTrend = [
    { month: "Jan", revenue: 1200000, expenses: 950000 },
    { month: "Feb", revenue: 1450000, expenses: 1100000 },
    { month: "Mar", revenue: 1350000, expenses: 1050000 },
    { month: "Apr", revenue: 1500000, expenses: 1200000 },
    { month: "May", revenue: 1800000, expenses: 1350000 },
    { month: "Jun", revenue: 1700000, expenses: 1300000 },
    { month: "Jul", revenue: 1900000, expenses: 1450000 },
    { month: "Aug", revenue: 2100000, expenses: 1600000 },
]

// Mobile Actions Component
function MobileActions() {
    return (
        <div className="flex items-center gap-2 md:hidden">
            {/* Date Range Picker - Simplified for mobile */}
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="border-slate-600 text-white hover:bg-slate-700">
                        <Calendar className="h-4 w-4" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="bg-slate-800 border-slate-700">
                    <div className="py-4">
                        <h3 className="text-lg font-medium text-white mb-4">Select Date Range</h3>
                        <DateRangePicker />
                    </div>
                </SheetContent>
            </Sheet>

            {/* Actions Menu */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="border-slate-600 text-white hover:bg-slate-700">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 text-white">
                    <DropdownMenuItem className="hover:bg-slate-700">
                        <Printer className="mr-2 h-4 w-4" />
                        Print Report
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-slate-700">
                        <Download className="mr-2 h-4 w-4" />
                        Export All
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}

// Desktop Actions Component
function DesktopActions() {
    return (
        <div className="hidden md:flex space-x-3">
            <DateRangePicker />
            <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                <Printer className="mr-2 h-4 w-4" />
                Print
            </Button>
            <Button className="bg-primary hover:bg-primary/90">
                <Download className="mr-2 h-4 w-4" />
                Export All
            </Button>
        </div>
    )
}

// Mobile Tabs Component
function MobileTabs({ value, onValueChange }: { value: string; onValueChange: (value: string) => void }) {
    const tabs = [
        { value: "income-statement", label: "Income", shortLabel: "Income" },
        { value: "balance-sheet", label: "Balance", shortLabel: "Balance" },
        { value: "budget-variance", label: "Budget", shortLabel: "Budget" },
        { value: "trend-analysis", label: "Trends", shortLabel: "Trends" },
    ]

    return (
        <div className="md:hidden mb-6">
            <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex space-x-1 p-1 bg-slate-800 rounded-lg border border-slate-700">
                    {tabs.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => onValueChange(tab.value)}
                            className={`
                                flex-shrink-0 px-4 py-2 text-sm font-medium rounded-md transition-colors
                                ${value === tab.value
                                    ? "bg-slate-700 text-white shadow-sm"
                                    : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                                }
                            `}
                        >
                            {tab.shortLabel}
                        </button>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" className="invisible" />
            </ScrollArea>
        </div>
    )
}

// Desktop Tabs Component
function DesktopTabs() {
    return (
        <TabsList className="hidden md:grid bg-slate-800 border-slate-700 mb-8 w-full grid-cols-4 lg:max-w-[800px]">
            <TabsTrigger value="income-statement" className="cursor-pointer">
                Income Statement
            </TabsTrigger>
            <TabsTrigger value="balance-sheet" className="cursor-pointer">
                Balance Sheet
            </TabsTrigger>
            <TabsTrigger value="budget-variance" className="cursor-pointer">
                Budget Variance
            </TabsTrigger>
            <TabsTrigger value="trend-analysis" className="cursor-pointer">
                Trend Analysis
            </TabsTrigger>
        </TabsList>
    )
}

export default function BusinessOfficeReportsPage() {
    const [selectedPeriod, setSelectedPeriod] = useState("monthly")
    const [selectedDepartment, setSelectedDepartment] = useState("all")
    const [activeTab, setActiveTab] = useState("income-statement")

    return (
        <DashboardLayout>
            <div className="container mx-auto px-4 py-8">
                {/* Header Section with Mobile-Optimized Actions */}
                <div className="mb-8 flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Financial Reports</h1>
                        <p className="text-gray-300">Comprehensive financial analysis and reporting</p>
                    </div>

                    {/* Mobile Actions */}
                    <MobileActions />

                    {/* Desktop Actions */}
                    <DesktopActions />
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    {/* Mobile Tabs */}
                    <MobileTabs value={activeTab} onValueChange={setActiveTab} />

                    {/* Desktop Tabs */}
                    <DesktopTabs />

                    <TabsContent value="income-statement">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Revenue Breakdown</CardTitle>
                                    <CardDescription className="text-gray-300">Income sources distribution</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-80">
                                        <PaymentPieChart
                                            data={incomeStatementData.revenue.map((item) => ({
                                                name: item.category,
                                                value: item.amount,
                                            }))}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Expense Breakdown</CardTitle>
                                    <CardDescription className="text-gray-300">Operating expenses distribution</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-80">
                                        <PaymentPieChart
                                            data={incomeStatementData.expenses.map((item) => ({
                                                name: item.category,
                                                value: item.amount,
                                            }))}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="bg-slate-800/60 border-slate-700 text-white">
                            <CardHeader>
                                <CardTitle>Income Statement Summary</CardTitle>
                                <CardDescription className="text-gray-300">For the period ending August 31, 2023</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-medium mb-4">Revenue</h3>
                                        <div className="space-y-2">
                                            {incomeStatementData.revenue.map((item, index) => (
                                                <div key={index} className="flex justify-between">
                                                    <span className="text-gray-300">{item.category}</span>
                                                    <span>₱{item.amount.toLocaleString()}</span>
                                                </div>
                                            ))}
                                            <div className="border-t border-slate-700 pt-2 flex justify-between font-medium">
                                                <span>Total Revenue</span>
                                                <span className="text-green-500">
                                                    ₱{incomeStatementData.revenue.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-medium mb-4">Expenses</h3>
                                        <div className="space-y-2">
                                            {incomeStatementData.expenses.map((item, index) => (
                                                <div key={index} className="flex justify-between">
                                                    <span className="text-gray-300">{item.category}</span>
                                                    <span>₱{item.amount.toLocaleString()}</span>
                                                </div>
                                            ))}
                                            <div className="border-t border-slate-700 pt-2 flex justify-between font-medium">
                                                <span>Total Expenses</span>
                                                <span className="text-red-500">
                                                    ₱{incomeStatementData.expenses.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-slate-700 pt-4">
                                        <div className="flex justify-between text-lg font-bold">
                                            <span>Net Income</span>
                                            <span className="text-green-500">
                                                ₱
                                                {(
                                                    incomeStatementData.revenue.reduce((sum, item) => sum + item.amount, 0) -
                                                    incomeStatementData.expenses.reduce((sum, item) => sum + item.amount, 0)
                                                ).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="balance-sheet">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Assets</CardTitle>
                                    <CardDescription className="text-gray-300">Total assets and their composition</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {balanceSheetData.assets.map((item, index) => (
                                            <div key={index}>
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-gray-300">{item.category}</span>
                                                    <span>₱{item.amount.toLocaleString()}</span>
                                                </div>
                                                <div className="h-2 w-full rounded-full bg-slate-600">
                                                    <div
                                                        className="h-2 rounded-full bg-blue-500"
                                                        style={{
                                                            width: `${(item.amount / balanceSheetData.assets.reduce((sum, a) => sum + a.amount, 0)) * 100
                                                                }%`,
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="border-t border-slate-700 pt-4 flex justify-between font-bold">
                                            <span>Total Assets</span>
                                            <span className="text-blue-500">
                                                ₱{balanceSheetData.assets.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Liabilities & Equity</CardTitle>
                                    <CardDescription className="text-gray-300">Total liabilities and equity breakdown</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {balanceSheetData.liabilities.map((item, index) => (
                                            <div key={index}>
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-gray-300">{item.category}</span>
                                                    <span>₱{item.amount.toLocaleString()}</span>
                                                </div>
                                                <div className="h-2 w-full rounded-full bg-slate-600">
                                                    <div
                                                        className="h-2 rounded-full bg-red-500"
                                                        style={{
                                                            width: `${(item.amount / balanceSheetData.liabilities.reduce((sum, a) => sum + a.amount, 0)) * 100
                                                                }%`,
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="border-t border-slate-700 pt-4">
                                            <div className="flex justify-between font-medium mb-2">
                                                <span>Total Liabilities</span>
                                                <span className="text-red-500">
                                                    ₱{balanceSheetData.liabilities.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between font-bold">
                                                <span>Total Equity</span>
                                                <span className="text-green-500">
                                                    ₱
                                                    {(
                                                        balanceSheetData.assets.reduce((sum, item) => sum + item.amount, 0) -
                                                        balanceSheetData.liabilities.reduce((sum, item) => sum + item.amount, 0)
                                                    ).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Financial Ratios</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">Current Ratio</span>
                                        <span className="font-medium">2.5</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">Quick Ratio</span>
                                        <span className="font-medium">2.1</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">Debt-to-Equity</span>
                                        <span className="font-medium">0.3</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Liquidity Analysis</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">Working Capital</span>
                                        <span className="font-medium text-green-500">₱6,390,000</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">Cash Position</span>
                                        <span className="font-medium">Strong</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">Days Cash on Hand</span>
                                        <span className="font-medium">45 days</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Asset Management</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">Asset Turnover</span>
                                        <span className="font-medium">0.32</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">Receivables Turnover</span>
                                        <span className="font-medium">8.5</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">Average Collection</span>
                                        <span className="font-medium">43 days</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="budget-variance">
                        <Card className="bg-slate-800/60 border-slate-700 text-white mb-8">
                            <CardHeader className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                                <div>
                                    <CardTitle>Budget vs Actual Analysis</CardTitle>
                                    <CardDescription className="text-gray-300">Department-wise budget performance</CardDescription>
                                </div>
                                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                                    <SelectTrigger className="w-full md:w-[200px] bg-slate-700 border-slate-600">
                                        <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                        <SelectItem value="all">All Departments</SelectItem>
                                        <SelectItem value="academic">Academic Affairs</SelectItem>
                                        <SelectItem value="student">Student Services</SelectItem>
                                        <SelectItem value="admin">Administration</SelectItem>
                                        <SelectItem value="facilities">Facilities</SelectItem>
                                        <SelectItem value="it">IT Services</SelectItem>
                                    </SelectContent>
                                </Select>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <ReportTable
                                        data={budgetVarianceData}
                                        columns={[
                                            { header: "Department", accessor: "department" },
                                            {
                                                header: "Budgeted",
                                                accessor: "budgeted",
                                                format: (value) => `₱${value.toLocaleString()}`,
                                            },
                                            {
                                                header: "Actual",
                                                accessor: "actual",
                                                format: (value) => `₱${value.toLocaleString()}`,
                                            },
                                            {
                                                header: "Variance",
                                                accessor: "variance",
                                                format: (value) => {
                                                    const isPositive = value >= 0
                                                    return (
                                                        <span className={isPositive ? "text-green-500" : "text-red-500"}>
                                                            {isPositive ? "+" : ""}₱{Math.abs(value).toLocaleString()}
                                                        </span>
                                                    )
                                                },
                                            },
                                            {
                                                header: "Variance %",
                                                accessor: "variancePercent",
                                                format: (value) => {
                                                    const isPositive = value >= 0
                                                    return (
                                                        <span className={isPositive ? "text-green-500" : "text-red-500"}>
                                                            {isPositive ? "+" : ""}
                                                            {value.toFixed(1)}%
                                                        </span>
                                                    )
                                                },
                                            },
                                        ]}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Budget Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">Total Budget</span>
                                        <span className="font-medium">₱10,000,000</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">Total Actual</span>
                                        <span className="font-medium">₱9,900,000</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">Overall Variance</span>
                                        <span className="font-medium text-green-500">-₱100,000 (-1%)</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Departments Over Budget</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">Student Services</span>
                                        <span className="text-red-500">+4.2%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">Facilities</span>
                                        <span className="text-red-500">+6.7%</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Departments Under Budget</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">Academic Affairs</span>
                                        <span className="text-green-500">-4.3%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">IT Services</span>
                                        <span className="text-green-500">-5.0%</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="trend-analysis">
                        <Card className="bg-slate-800/60 border-slate-700 text-white mb-8">
                            <CardHeader className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 pb-2">
                                <div>
                                    <CardTitle>Revenue vs Expenses Trend</CardTitle>
                                    <CardDescription className="text-gray-300">Monthly comparison for the current year</CardDescription>
                                </div>
                                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                                    <SelectTrigger className="w-full md:w-[180px] bg-slate-700 border-slate-600">
                                        <SelectValue placeholder="Select period" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                        <SelectItem value="quarterly">Quarterly</SelectItem>
                                        <SelectItem value="yearly">Yearly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </CardHeader>
                            <CardContent>
                                <div className="h-96">
                                    <PaymentChart
                                        data={monthlyTrend.map((item) => ({
                                            month: item.month,
                                            amount: item.revenue,
                                        }))}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Key Performance Indicators</CardTitle>
                                    <CardDescription className="text-gray-300">Financial health metrics</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <span>Revenue Growth</span>
                                                <span className="text-green-500">+15%</span>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-slate-600">
                                                <div className="h-2 rounded-full bg-green-500" style={{ width: "75%" }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <span>Expense Control</span>
                                                <span className="text-amber-500">+5%</span>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-slate-600">
                                                <div className="h-2 rounded-full bg-amber-500" style={{ width: "45%" }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <span>Profit Margin</span>
                                                <span className="text-green-500">22%</span>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-slate-600">
                                                <div className="h-2 rounded-full bg-green-500" style={{ width: "88%" }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <span>Collection Efficiency</span>
                                                <span className="text-green-500">92%</span>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-slate-600">
                                                <div className="h-2 rounded-full bg-green-500" style={{ width: "92%" }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Financial Forecast</CardTitle>
                                    <CardDescription className="text-gray-300">Projected performance for next quarter</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="rounded-lg bg-blue-500/20 p-4 text-blue-200">
                                            <h3 className="mb-2 font-medium">Revenue Projection</h3>
                                            <p className="text-sm">
                                                Based on current trends, revenue is expected to increase by 10% next quarter, reaching ₱3.2M
                                                monthly average.
                                            </p>
                                        </div>
                                        <div className="rounded-lg bg-green-500/20 p-4 text-green-200">
                                            <h3 className="mb-2 font-medium">Cost Optimization</h3>
                                            <p className="text-sm">
                                                Implementing cost-saving measures could reduce operating expenses by 8%, saving approximately
                                                ₱168,000 monthly.
                                            </p>
                                        </div>
                                        <div className="rounded-lg bg-amber-500/20 p-4 text-amber-200">
                                            <h3 className="mb-2 font-medium">Cash Flow Alert</h3>
                                            <p className="text-sm">
                                                Maintain minimum cash reserves of ₱2M to ensure smooth operations during low collection periods.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    )
}
