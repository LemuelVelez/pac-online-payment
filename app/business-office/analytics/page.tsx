"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { DateRangePicker } from "@/components/admin/date-range-picker"
import { PaymentChart } from "@/components/dashboard/payment-chart"
import { PaymentPieChart } from "@/components/dashboard/payment-pie-chart"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
    Download,
    TrendingUp,
    AlertCircle,
    CheckCircle,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    Settings,
    MoreVertical,
    Filter,
} from "lucide-react"

// Mock data for analytics
const revenueAnalytics = [
    { month: "Jan", revenue: 1200000, target: 1100000, growth: 9.1 },
    { month: "Feb", revenue: 1450000, target: 1200000, growth: 20.8 },
    { month: "Mar", revenue: 1350000, target: 1300000, growth: 3.8 },
    { month: "Apr", revenue: 1500000, target: 1400000, growth: 7.1 },
    { month: "May", revenue: 1800000, target: 1500000, growth: 20.0 },
    { month: "Jun", revenue: 1700000, target: 1600000, growth: 6.3 },
    { month: "Jul", revenue: 1900000, target: 1700000, growth: 11.8 },
    { month: "Aug", revenue: 2100000, target: 1800000, growth: 16.7 },
]

const studentAnalytics = [
    { course: "BS Computer Science", enrolled: 450, capacity: 500, revenue: 3500000, avgFee: 7778 },
    { course: "BS Information Technology", enrolled: 380, capacity: 400, revenue: 2800000, avgFee: 7368 },
    { course: "BS Electronics Engineering", enrolled: 320, capacity: 350, revenue: 2400000, avgFee: 7500 },
    { course: "BS Business Administration", enrolled: 280, capacity: 300, revenue: 1800000, avgFee: 6429 },
    { course: "BS Education", enrolled: 150, capacity: 200, revenue: 900000, avgFee: 6000 },
]

const paymentMethodAnalytics = [
    { method: "Credit Card", transactions: 1250, amount: 4500000, avgTransaction: 3600, growth: 15.2 },
    { method: "E-Wallet", transactions: 980, amount: 3200000, avgTransaction: 3265, growth: 28.5 },
    { method: "Bank Transfer", transactions: 650, amount: 2300000, avgTransaction: 3538, growth: 8.7 },
    { method: "Cash", transactions: 120, amount: 500000, avgTransaction: 4167, growth: -12.3 },
]

const kpiData = [
    { metric: "Revenue Growth", value: "15.2%", target: "12%", status: "above", trend: "up" },
    { metric: "Collection Rate", value: "92.5%", target: "90%", status: "above", trend: "up" },
    { metric: "Student Retention", value: "88.3%", target: "85%", status: "above", trend: "up" },
    { metric: "Average Fee per Student", value: "₱7,250", target: "₱7,000", status: "above", trend: "up" },
    { metric: "Payment Processing Time", value: "2.1 days", target: "3 days", status: "above", trend: "down" },
    { metric: "Outstanding Balance Ratio", value: "7.5%", target: "10%", status: "above", trend: "down" },
]

const cohortAnalysis = [
    { cohort: "2023 Freshmen", enrolled: 580, retained: 545, retentionRate: 94.0, revenue: 4200000 },
    { cohort: "2022 Sophomores", enrolled: 520, retained: 485, retentionRate: 93.3, revenue: 3800000 },
    { cohort: "2021 Juniors", enrolled: 480, retained: 425, retentionRate: 88.5, revenue: 3600000 },
    { cohort: "2020 Seniors", enrolled: 450, retained: 380, retentionRate: 84.4, revenue: 3200000 },
]

// Mobile Actions Component
function MobileActions({
    selectedPeriod,
    setSelectedPeriod,
    selectedMetric,
    setSelectedMetric,
}: {
    selectedPeriod: string
    setSelectedPeriod: (value: string) => void
    selectedMetric: string
    setSelectedMetric: (value: string) => void
}) {
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

            {/* Analytics Settings - Mobile Sheet */}
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="border-slate-600 text-white hover:bg-slate-700">
                        <Settings className="h-4 w-4" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="bg-slate-800 border-slate-700">
                    <div className="py-4 space-y-4">
                        <h3 className="text-lg font-medium text-white mb-4">Analytics Settings</h3>
                        <div>
                            <Label htmlFor="mobile-period" className="text-white">
                                Period
                            </Label>
                            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                                <SelectTrigger id="mobile-period" className="bg-slate-700 border-slate-600 text-white mt-2">
                                    <SelectValue placeholder="Period" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="quarterly">Quarterly</SelectItem>
                                    <SelectItem value="yearly">Yearly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="mobile-metric" className="text-white">
                                Primary Metric
                            </Label>
                            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                                <SelectTrigger id="mobile-metric" className="bg-slate-700 border-slate-600 text-white mt-2">
                                    <SelectValue placeholder="Metric" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                    <SelectItem value="revenue">Revenue</SelectItem>
                                    <SelectItem value="enrollment">Enrollment</SelectItem>
                                    <SelectItem value="retention">Retention</SelectItem>
                                    <SelectItem value="collection">Collection</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
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
                        <Download className="mr-2 h-4 w-4" />
                        Export Analytics
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-slate-700">
                        <Filter className="mr-2 h-4 w-4" />
                        Advanced Filters
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}

// Desktop Actions Component
function DesktopActions({
    selectedPeriod,
    setSelectedPeriod,
    selectedMetric,
    setSelectedMetric,
}: {
    selectedPeriod: string
    setSelectedPeriod: (value: string) => void
    selectedMetric: string
    setSelectedMetric: (value: string) => void
}) {
    return (
        <div className="hidden md:flex space-x-3">
            <DateRangePicker />
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[150px] bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600 text-white">
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
            </Select>
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger className="w-[150px] bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Metric" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600 text-white">
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="enrollment">Enrollment</SelectItem>
                    <SelectItem value="retention">Retention</SelectItem>
                    <SelectItem value="collection">Collection</SelectItem>
                </SelectContent>
            </Select>
            <Button className="bg-primary hover:bg-primary/90">
                <Download className="mr-2 h-4 w-4" />
                Export Analytics
            </Button>
        </div>
    )
}

// Mobile Tabs Component
function MobileTabs({ value, onValueChange }: { value: string; onValueChange: (value: string) => void }) {
    const tabs = [
        { value: "revenue", label: "Revenue", shortLabel: "Revenue" },
        { value: "students", label: "Students", shortLabel: "Students" },
        { value: "payments", label: "Payments", shortLabel: "Payments" },
        { value: "cohorts", label: "Cohorts", shortLabel: "Cohorts" },
        { value: "forecasting", label: "Forecasting", shortLabel: "Forecast" },
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
        <TabsList className="hidden md:grid bg-slate-800 border-slate-700 mb-8 w-full grid-cols-5 lg:max-w-[800px]">
            <TabsTrigger value="revenue" className="cursor-pointer">
                Revenue
            </TabsTrigger>
            <TabsTrigger value="students" className="cursor-pointer">
                Students
            </TabsTrigger>
            <TabsTrigger value="payments" className="cursor-pointer">
                Payments
            </TabsTrigger>
            <TabsTrigger value="cohorts" className="cursor-pointer">
                Cohorts
            </TabsTrigger>
            <TabsTrigger value="forecasting" className="cursor-pointer">
                Forecasting
            </TabsTrigger>
        </TabsList>
    )
}

export default function BusinessOfficeAnalyticsPage() {
    const [selectedPeriod, setSelectedPeriod] = useState("monthly")
    const [selectedMetric, setSelectedMetric] = useState("revenue")
    const [activeTab, setActiveTab] = useState("revenue")

    return (
        <DashboardLayout allowedRoles={["business-office"]}>
            <div className="container mx-auto px-4 py-8">
                {/* Header Section with Mobile-Optimized Actions */}
                <div className="mb-8 flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Financial Analytics</h1>
                        <p className="text-gray-300">Advanced analytics and insights</p>
                    </div>

                    {/* Mobile Actions */}
                    <MobileActions
                        selectedPeriod={selectedPeriod}
                        setSelectedPeriod={setSelectedPeriod}
                        selectedMetric={selectedMetric}
                        setSelectedMetric={setSelectedMetric}
                    />

                    {/* Desktop Actions */}
                    <DesktopActions
                        selectedPeriod={selectedPeriod}
                        setSelectedPeriod={setSelectedPeriod}
                        selectedMetric={selectedMetric}
                        setSelectedMetric={setSelectedMetric}
                    />
                </div>

                {/* KPI Overview - Mobile Optimized */}
                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {kpiData.map((kpi, index) => (
                        <Card key={index} className="bg-slate-800/60 border-slate-700 text-white">
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex items-center justify-between">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm text-gray-400 truncate">{kpi.metric}</p>
                                        <p className="text-lg sm:text-2xl font-bold">{kpi.value}</p>
                                        <p className="text-xs text-gray-400">Target: {kpi.target}</p>
                                    </div>
                                    <div className="flex flex-col items-end ml-2">
                                        <div className={`rounded-full p-2 ${kpi.status === "above" ? "bg-green-500/20" : "bg-red-500/20"}`}>
                                            {kpi.trend === "up" ? (
                                                <ArrowUpRight
                                                    className={`h-4 w-4 ${kpi.status === "above" ? "text-green-500" : "text-red-500"}`}
                                                />
                                            ) : (
                                                <ArrowDownRight
                                                    className={`h-4 w-4 ${kpi.status === "above" ? "text-green-500" : "text-red-500"}`}
                                                />
                                            )}
                                        </div>
                                        <span className={`text-xs ${kpi.status === "above" ? "text-green-500" : "text-red-500"}`}>
                                            {kpi.status === "above" ? "Above Target" : "Below Target"}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    {/* Mobile Tabs */}
                    <MobileTabs value={activeTab} onValueChange={setActiveTab} />

                    {/* Desktop Tabs */}
                    <DesktopTabs />

                    <TabsContent value="revenue">
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                <Card className="bg-slate-800/60 border-slate-700 text-white">
                                    <CardHeader>
                                        <CardTitle>Revenue vs Target</CardTitle>
                                        <CardDescription className="text-gray-300">Monthly performance tracking</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-64 sm:h-80">
                                            <PaymentChart
                                                data={revenueAnalytics.map((item) => ({
                                                    month: item.month,
                                                    amount: item.revenue,
                                                }))}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-slate-800/60 border-slate-700 text-white">
                                    <CardHeader>
                                        <CardTitle>Revenue Growth Rate</CardTitle>
                                        <CardDescription className="text-gray-300">Month-over-month growth</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {revenueAnalytics.slice(-6).map((item, index) => (
                                                <div key={index} className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-400">{item.month}</span>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-sm">₱{(item.revenue / 1000000).toFixed(1)}M</span>
                                                        <span className={`text-sm ${item.growth > 0 ? "text-green-500" : "text-red-500"}`}>
                                                            {item.growth > 0 ? "+" : ""}
                                                            {item.growth.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                <Card className="bg-slate-800/60 border-slate-700 text-white">
                                    <CardHeader>
                                        <CardTitle>Revenue Breakdown</CardTitle>
                                        <CardDescription className="text-gray-300">By fee type</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm text-gray-400">Tuition Fees</span>
                                                <span className="text-sm">₱8.5M (68%)</span>
                                            </div>
                                            <Progress value={68} className="h-2 bg-slate-700" />
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm text-gray-400">Laboratory Fees</span>
                                                <span className="text-sm">₱2.1M (17%)</span>
                                            </div>
                                            <Progress value={17} className="h-2 bg-slate-700" />
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm text-gray-400">Miscellaneous</span>
                                                <span className="text-sm">₱1.2M (10%)</span>
                                            </div>
                                            <Progress value={10} className="h-2 bg-slate-700" />
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm text-gray-400">Other Fees</span>
                                                <span className="text-sm">₱650K (5%)</span>
                                            </div>
                                            <Progress value={5} className="h-2 bg-slate-700" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-slate-800/60 border-slate-700 text-white">
                                    <CardHeader>
                                        <CardTitle>Revenue Quality</CardTitle>
                                        <CardDescription className="text-gray-300">Collection metrics</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Collection Rate</span>
                                            <span className="text-green-500">92.5%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Average Collection Time</span>
                                            <span className="text-blue-500">2.1 days</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Bad Debt Rate</span>
                                            <span className="text-green-500">0.8%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Payment Success Rate</span>
                                            <span className="text-green-500">98.2%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Refund Rate</span>
                                            <span className="text-amber-500">1.2%</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-slate-800/60 border-slate-700 text-white">
                                    <CardHeader>
                                        <CardTitle>Revenue Insights</CardTitle>
                                        <CardDescription className="text-gray-300">Key observations</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <Alert className="bg-green-500/20 border-green-500/50 text-green-200">
                                            <CheckCircle className="h-4 w-4" />
                                            <AlertDescription className="text-xs">
                                                Revenue exceeded target by 15.2% this quarter
                                            </AlertDescription>
                                        </Alert>
                                        <Alert className="bg-blue-500/20 border-blue-500/50 text-blue-200">
                                            <TrendingUp className="h-4 w-4" />
                                            <AlertDescription className="text-xs">E-wallet payments showing 28% growth</AlertDescription>
                                        </Alert>
                                        <Alert className="bg-amber-500/20 border-amber-500/50 text-amber-200">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription className="text-xs">Cash payments declining by 12.3%</AlertDescription>
                                        </Alert>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="students">
                        <div className="space-y-6">
                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Student Analytics by Course</CardTitle>
                                    <CardDescription className="text-gray-300">Enrollment and revenue analysis</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-slate-700 text-left text-sm font-medium text-gray-300">
                                                    <th className="pb-3 min-w-[200px]">Course</th>
                                                    <th className="pb-3 min-w-[80px]">Enrolled</th>
                                                    <th className="pb-3 min-w-[80px]">Capacity</th>
                                                    <th className="pb-3 min-w-[120px]">Utilization</th>
                                                    <th className="pb-3 min-w-[100px]">Revenue</th>
                                                    <th className="pb-3 min-w-[100px]">Avg Fee</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-700">
                                                {studentAnalytics.map((course, index) => (
                                                    <tr key={index} className="text-sm">
                                                        <td className="py-3 font-medium">{course.course}</td>
                                                        <td className="py-3">{course.enrolled}</td>
                                                        <td className="py-3">{course.capacity}</td>
                                                        <td className="py-3">
                                                            <div className="flex items-center space-x-2">
                                                                <div className="w-16 h-2 bg-slate-600 rounded-full">
                                                                    <div
                                                                        className="h-2 bg-blue-500 rounded-full"
                                                                        style={{
                                                                            width: `${(course.enrolled / course.capacity) * 100}%`,
                                                                        }}
                                                                    ></div>
                                                                </div>
                                                                <span className="text-xs">
                                                                    {((course.enrolled / course.capacity) * 100).toFixed(1)}%
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3">₱{(course.revenue / 1000000).toFixed(1)}M</td>
                                                        <td className="py-3">₱{course.avgFee.toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                <Card className="bg-slate-800/60 border-slate-700 text-white">
                                    <CardHeader>
                                        <CardTitle>Enrollment Distribution</CardTitle>
                                        <CardDescription className="text-gray-300">Students by course</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6 sm:p-8">
                                        <div className="h-80 sm:h-96 lg:h-80">
                                            <PaymentPieChart
                                                data={studentAnalytics.map((course) => ({
                                                    name: course.course.replace("BS ", ""),
                                                    value: course.enrolled,
                                                }))}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-slate-800/60 border-slate-700 text-white">
                                    <CardHeader>
                                        <CardTitle>Student Metrics</CardTitle>
                                        <CardDescription className="text-gray-300">Key performance indicators</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <span className="text-gray-400">Overall Capacity Utilization</span>
                                                <span className="font-medium">86.7%</span>
                                            </div>
                                            <Progress value={86.7} className="h-3 bg-slate-700" />
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <span className="text-gray-400">Student Satisfaction</span>
                                                <span className="font-medium">4.2/5.0</span>
                                            </div>
                                            <Progress value={84} className="h-3 bg-slate-700" />
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <span className="text-gray-400">Retention Rate</span>
                                                <span className="font-medium">88.3%</span>
                                            </div>
                                            <Progress value={88.3} className="h-3 bg-slate-700" />
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <span className="text-gray-400">Graduation Rate</span>
                                                <span className="font-medium">92.1%</span>
                                            </div>
                                            <Progress value={92.1} className="h-3 bg-slate-700" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="payments">
                        <div className="space-y-6">
                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Payment Method Analytics</CardTitle>
                                    <CardDescription className="text-gray-300">Transaction analysis by payment method</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-slate-700 text-left text-sm font-medium text-gray-300">
                                                    <th className="pb-3 min-w-[120px]">Payment Method</th>
                                                    <th className="pb-3 min-w-[100px]">Transactions</th>
                                                    <th className="pb-3 min-w-[100px]">Total Amount</th>
                                                    <th className="pb-3 min-w-[120px]">Avg Transaction</th>
                                                    <th className="pb-3 min-w-[100px]">Growth Rate</th>
                                                    <th className="pb-3 min-w-[100px]">Market Share</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-700">
                                                {paymentMethodAnalytics.map((method, index) => (
                                                    <tr key={index} className="text-sm">
                                                        <td className="py-3 font-medium">{method.method}</td>
                                                        <td className="py-3">{method.transactions.toLocaleString()}</td>
                                                        <td className="py-3">₱{(method.amount / 1000000).toFixed(1)}M</td>
                                                        <td className="py-3">₱{method.avgTransaction.toLocaleString()}</td>
                                                        <td className="py-3">
                                                            <span className={`${method.growth > 0 ? "text-green-500" : "text-red-500"}`}>
                                                                {method.growth > 0 ? "+" : ""}
                                                                {method.growth.toFixed(1)}%
                                                            </span>
                                                        </td>
                                                        <td className="py-3">{((method.amount / 10500000) * 100).toFixed(1)}%</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                <Card className="bg-slate-800/60 border-slate-700 text-white">
                                    <CardHeader>
                                        <CardTitle>Payment Method Distribution</CardTitle>
                                        <CardDescription className="text-gray-300">By transaction volume</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6 sm:p-8">
                                        <div className="h-80 sm:h-96 lg:h-80">
                                            <PaymentPieChart
                                                data={paymentMethodAnalytics.map((method) => ({
                                                    name: method.method,
                                                    value: method.amount,
                                                }))}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-slate-800/60 border-slate-700 text-white">
                                    <CardHeader>
                                        <CardTitle>Payment Trends</CardTitle>
                                        <CardDescription className="text-gray-300">Growth and adoption patterns</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="rounded-lg bg-green-500/20 p-4">
                                            <h4 className="font-medium text-green-400">Fastest Growing</h4>
                                            <p className="text-sm text-gray-300">E-Wallet (+28.5%)</p>
                                            <p className="text-xs text-gray-400">Driven by mobile adoption</p>
                                        </div>
                                        <div className="rounded-lg bg-blue-500/20 p-4">
                                            <h4 className="font-medium text-blue-400">Most Popular</h4>
                                            <p className="text-sm text-gray-300">Credit Card (42.9%)</p>
                                            <p className="text-xs text-gray-400">Highest transaction volume</p>
                                        </div>
                                        <div className="rounded-lg bg-red-500/20 p-4">
                                            <h4 className="font-medium text-red-400">Declining</h4>
                                            <p className="text-sm text-gray-300">Cash (-12.3%)</p>
                                            <p className="text-xs text-gray-400">Digital transformation impact</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="cohorts">
                        <div className="space-y-6">
                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Cohort Analysis</CardTitle>
                                    <CardDescription className="text-gray-300">Student retention and revenue by cohort</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-slate-700 text-left text-sm font-medium text-gray-300">
                                                    <th className="pb-3 min-w-[140px]">Cohort</th>
                                                    <th className="pb-3 min-w-[120px]">Initial Enrollment</th>
                                                    <th className="pb-3 min-w-[120px]">Current Enrollment</th>
                                                    <th className="pb-3 min-w-[100px]">Retention Rate</th>
                                                    <th className="pb-3 min-w-[100px]">Total Revenue</th>
                                                    <th className="pb-3 min-w-[140px]">Revenue per Student</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-700">
                                                {cohortAnalysis.map((cohort, index) => (
                                                    <tr key={index} className="text-sm">
                                                        <td className="py-3 font-medium">{cohort.cohort}</td>
                                                        <td className="py-3">{cohort.enrolled}</td>
                                                        <td className="py-3">{cohort.retained}</td>
                                                        <td className="py-3">
                                                            <span
                                                                className={`${cohort.retentionRate > 90
                                                                        ? "text-green-500"
                                                                        : cohort.retentionRate > 85
                                                                            ? "text-amber-500"
                                                                            : "text-red-500"
                                                                    }`}
                                                            >
                                                                {cohort.retentionRate.toFixed(1)}%
                                                            </span>
                                                        </td>
                                                        <td className="py-3">₱{(cohort.revenue / 1000000).toFixed(1)}M</td>
                                                        <td className="py-3">₱{(cohort.revenue / cohort.retained).toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                <Card className="bg-slate-800/60 border-slate-700 text-white">
                                    <CardHeader>
                                        <CardTitle>Retention Insights</CardTitle>
                                        <CardDescription className="text-gray-300">Key retention metrics</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Overall Retention</span>
                                            <span className="text-green-500">90.1%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">First Year Retention</span>
                                            <span className="text-green-500">94.0%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Senior Year Retention</span>
                                            <span className="text-amber-500">84.4%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Average Dropout Rate</span>
                                            <span className="text-red-500">9.9%</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-slate-800/60 border-slate-700 text-white">
                                    <CardHeader>
                                        <CardTitle>Revenue Impact</CardTitle>
                                        <CardDescription className="text-gray-300">Financial impact of retention</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Revenue at Risk</span>
                                            <span className="text-red-500">₱1.2M</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Avg Revenue per Dropout</span>
                                            <span className="text-amber-500">₱8,500</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Retention Value</span>
                                            <span className="text-green-500">₱14.6M</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">ROI of Retention</span>
                                            <span className="text-green-500">1,217%</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-slate-800/60 border-slate-700 text-white">
                                    <CardHeader>
                                        <CardTitle>Dropout Analysis</CardTitle>
                                        <CardDescription className="text-gray-300">Common dropout patterns</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="text-sm">
                                            <p className="font-medium text-red-400">Financial Reasons</p>
                                            <p className="text-gray-400">45% of dropouts</p>
                                        </div>
                                        <div className="text-sm">
                                            <p className="font-medium text-amber-400">Academic Performance</p>
                                            <p className="text-gray-400">28% of dropouts</p>
                                        </div>
                                        <div className="text-sm">
                                            <p className="font-medium text-blue-400">Personal Reasons</p>
                                            <p className="text-gray-400">18% of dropouts</p>
                                        </div>
                                        <div className="text-sm">
                                            <p className="font-medium text-gray-400">Other</p>
                                            <p className="text-gray-400">9% of dropouts</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="forecasting">
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                <Card className="bg-slate-800/60 border-slate-700 text-white">
                                    <CardHeader>
                                        <CardTitle>Revenue Forecast</CardTitle>
                                        <CardDescription className="text-gray-300">Next 6 months projection</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-64 sm:h-80">
                                            <PaymentChart
                                                data={[
                                                    { month: "Sep", amount: 2200000 },
                                                    { month: "Oct", amount: 2350000 },
                                                    { month: "Nov", amount: 2100000 },
                                                    { month: "Dec", amount: 1800000 },
                                                    { month: "Jan", amount: 2400000 },
                                                    { month: "Feb", amount: 2600000 },
                                                ]}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-slate-800/60 border-slate-700 text-white">
                                    <CardHeader>
                                        <CardTitle>Enrollment Forecast</CardTitle>
                                        <CardDescription className="text-gray-300">Projected student numbers</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="rounded-lg bg-blue-500/20 p-4">
                                            <h4 className="font-medium text-blue-400">Next Semester</h4>
                                            <p className="text-xl sm:text-2xl font-bold">1,680 students</p>
                                            <p className="text-sm text-gray-400">+5.2% growth expected</p>
                                        </div>
                                        <div className="rounded-lg bg-green-500/20 p-4">
                                            <h4 className="font-medium text-green-400">New Enrollments</h4>
                                            <p className="text-xl sm:text-2xl font-bold">420 students</p>
                                            <p className="text-sm text-gray-400">Freshmen intake</p>
                                        </div>
                                        <div className="rounded-lg bg-amber-500/20 p-4">
                                            <h4 className="font-medium text-amber-400">Capacity Utilization</h4>
                                            <p className="text-xl sm:text-2xl font-bold">89.3%</p>
                                            <p className="text-sm text-gray-400">Near optimal capacity</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                <Card className="bg-slate-800/60 border-slate-700 text-white">
                                    <CardHeader>
                                        <CardTitle>Financial Projections</CardTitle>
                                        <CardDescription className="text-gray-300">6-month outlook</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Projected Revenue</span>
                                            <span className="text-green-500">₱13.45M</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Expected Expenses</span>
                                            <span className="text-red-500">₱10.2M</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Net Income</span>
                                            <span className="text-green-500">₱3.25M</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Profit Margin</span>
                                            <span className="text-green-500">24.2%</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-slate-800/60 border-slate-700 text-white">
                                    <CardHeader>
                                        <CardTitle>Risk Factors</CardTitle>
                                        <CardDescription className="text-gray-300">Potential challenges</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Economic Downturn</span>
                                            <span className="text-red-500">High</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Competition</span>
                                            <span className="text-amber-500">Medium</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Regulatory Changes</span>
                                            <span className="text-amber-500">Medium</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Technology Disruption</span>
                                            <span className="text-green-500">Low</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-slate-800/60 border-slate-700 text-white">
                                    <CardHeader>
                                        <CardTitle>Opportunities</CardTitle>
                                        <CardDescription className="text-gray-300">Growth potential</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="text-sm">
                                            <p className="font-medium text-green-400">Online Programs</p>
                                            <p className="text-gray-400">+15% revenue potential</p>
                                        </div>
                                        <div className="text-sm">
                                            <p className="font-medium text-blue-400">International Students</p>
                                            <p className="text-gray-400">+8% enrollment growth</p>
                                        </div>
                                        <div className="text-sm">
                                            <p className="font-medium text-purple-400">Corporate Training</p>
                                            <p className="text-gray-400">New revenue stream</p>
                                        </div>
                                        <div className="text-sm">
                                            <p className="font-medium text-amber-400">Fee Optimization</p>
                                            <p className="text-gray-400">+5% margin improvement</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    )
}
