"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PaymentChart } from "@/components/dashboard/payment-chart"
import { PaymentPieChart } from "@/components/dashboard/payment-pie-chart"
import { DateRangePicker } from "@/components/admin/date-range-picker"
import { Download, TrendingUp, Users, CreditCard, Clock } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Mock data for analytics
const monthlyUsers = [
    { name: "Jan", value: 120 },
    { name: "Feb", value: 145 },
    { name: "Mar", value: 158 },
    { name: "Apr", value: 175 },
    { name: "May", value: 210 },
    { name: "Jun", value: 235 },
    { name: "Jul", value: 245 },
    { name: "Aug", value: 260 },
]

const userTypeDistribution = [
    { name: "Students", value: 65 },
    { name: "Cashiers", value: 15 },
    { name: "Business Office", value: 10 },
    { name: "Admins", value: 10 },
]

const paymentMethodDistribution = [
    { name: "Credit Card", value: 45 },
    { name: "Cash", value: 25 },
    { name: "E-Wallet", value: 20 },
    { name: "Bank Transfer", value: 10 },
]

const monthlyTransactions = [
    { name: "Jan", value: 320 },
    { name: "Feb", value: 345 },
    { name: "Mar", value: 358 },
    { name: "Apr", value: 375 },
    { name: "May", value: 410 },
    { name: "Jun", value: 435 },
    { name: "Jul", value: 445 },
    { name: "Aug", value: 460 },
]

// Tab configuration for mobile dropdown
const tabOptions = [
    { value: "users", label: "User Analytics" },
    { value: "transactions", label: "Transaction Analytics" },
    { value: "performance", label: "System Performance" },
]

// Helper function to transform data for PaymentChart
const transformDataForChart = (data: { name: string; value: number }[]) => {
    return data.map(item => ({
        month: item.name,
        amount: item.value
    }))
}

export default function AdminAnalyticsPage() {
    const [activeTab, setActiveTab] = useState("users")

    return (
        <DashboardLayout allowedRoles={["admin"]}>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
                        <p className="text-gray-300">Insights and performance metrics</p>
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
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">1,234</div>
                            <p className="text-xs text-gray-400 mt-1">
                                <TrendingUp className="inline h-3 w-3 text-green-500 mr-1" />
                                +15% from last month
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">985</div>
                            <p className="text-xs text-gray-400 mt-1">
                                <Users className="inline h-3 w-3 text-blue-500 mr-1" />
                                80% of total users
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">2,345</div>
                            <p className="text-xs text-gray-400 mt-1">
                                <CreditCard className="inline h-3 w-3 text-purple-500 mr-1" />
                                Current academic year
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Avg. Session Time</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">12m 45s</div>
                            <p className="text-xs text-gray-400 mt-1">
                                <Clock className="inline h-3 w-3 text-amber-500 mr-1" />
                                +2m from last month
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    {/* Mobile Dropdown - visible on extra small screens */}
                    <div className="mb-6 sm:hidden">
                        <Select value={activeTab} onValueChange={setActiveTab}>
                            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                <div className="flex items-center">
                                    <SelectValue placeholder="Select Analytics" />
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
                                        value="users"
                                        className="whitespace-nowrap px-4 py-2 text-sm data-[state=active]:bg-slate-700 data-[state=active]:text-white"
                                    >
                                        User Analytics
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="transactions"
                                        className="whitespace-nowrap px-4 py-2 text-sm data-[state=active]:bg-slate-700 data-[state=active]:text-white"
                                    >
                                        Transaction Analytics
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="performance"
                                        className="whitespace-nowrap px-4 py-2 text-sm data-[state=active]:bg-slate-700 data-[state=active]:text-white"
                                    >
                                        System Performance
                                    </TabsTrigger>
                                </div>
                            </TabsList>
                        </div>
                    </div>

                    <TabsContent value="users">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>User Growth</CardTitle>
                                    <CardDescription className="text-gray-300">Monthly user registrations</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-80">
                                        <PaymentChart data={transformDataForChart(monthlyUsers)} />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>User Distribution</CardTitle>
                                    <CardDescription className="text-gray-300">Breakdown by user type</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-80">
                                        <PaymentPieChart data={userTypeDistribution} />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>User Engagement</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm text-gray-400">Daily Active Users</span>
                                            <span className="text-sm font-medium">425</span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-slate-600">
                                            <div className="h-2 rounded-full bg-green-500" style={{ width: "65%" }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm text-gray-400">Weekly Active Users</span>
                                            <span className="text-sm font-medium">780</span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-slate-600">
                                            <div className="h-2 rounded-full bg-blue-500" style={{ width: "78%" }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm text-gray-400">Monthly Active Users</span>
                                            <span className="text-sm font-medium">985</span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-slate-600">
                                            <div className="h-2 rounded-full bg-purple-500" style={{ width: "95%" }}></div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>User Retention</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">1-month retention</span>
                                        <span className="text-sm font-medium text-green-500">85%</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">3-month retention</span>
                                        <span className="text-sm font-medium text-green-500">72%</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">6-month retention</span>
                                        <span className="text-sm font-medium text-amber-500">58%</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">12-month retention</span>
                                        <span className="text-sm font-medium text-amber-500">45%</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>User Demographics</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-400">Age Distribution</p>
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-full rounded-full bg-slate-600">
                                                <div className="h-2 rounded-full bg-blue-500" style={{ width: "35%" }}></div>
                                            </div>
                                            <span className="text-xs whitespace-nowrap">18-24</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-full rounded-full bg-slate-600">
                                                <div className="h-2 rounded-full bg-green-500" style={{ width: "45%" }}></div>
                                            </div>
                                            <span className="text-xs whitespace-nowrap">25-34</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-full rounded-full bg-slate-600">
                                                <div className="h-2 rounded-full bg-amber-500" style={{ width: "15%" }}></div>
                                            </div>
                                            <span className="text-xs whitespace-nowrap">35-44</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-full rounded-full bg-slate-600">
                                                <div className="h-2 rounded-full bg-red-500" style={{ width: "5%" }}></div>
                                            </div>
                                            <span className="text-xs whitespace-nowrap">45+</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="transactions">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Transaction Volume</CardTitle>
                                    <CardDescription className="text-gray-300">Monthly transaction count</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-80">
                                        <PaymentChart data={transformDataForChart(monthlyTransactions)} />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Payment Methods</CardTitle>
                                    <CardDescription className="text-gray-300">Distribution by payment type</CardDescription>
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
                                    <CardTitle>Transaction Metrics</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-400">Avg. Transaction Value</span>
                                        <span className="font-medium">₱4,478</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-400">Success Rate</span>
                                        <span className="font-medium text-green-500">98.5%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-400">Failure Rate</span>
                                        <span className="font-medium text-red-500">1.5%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-400">Avg. Processing Time</span>
                                        <span className="font-medium">2.3s</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Peak Transaction Hours</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">8:00 AM - 10:00 AM</span>
                                        <span className="text-sm font-medium text-amber-500">25%</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">10:00 AM - 12:00 PM</span>
                                        <span className="text-sm font-medium text-green-500">35%</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">12:00 PM - 2:00 PM</span>
                                        <span className="text-sm font-medium text-amber-500">15%</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">2:00 PM - 4:00 PM</span>
                                        <span className="text-sm font-medium text-blue-500">20%</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">4:00 PM - 6:00 PM</span>
                                        <span className="text-sm font-medium">5%</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Transaction Types</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">Tuition Payments</span>
                                        <span className="text-sm font-medium text-green-500">65%</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">Laboratory Fees</span>
                                        <span className="text-sm font-medium text-blue-500">15%</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">Library Fees</span>
                                        <span className="text-sm font-medium text-amber-500">10%</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">Miscellaneous Fees</span>
                                        <span className="text-sm font-medium text-purple-500">10%</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="performance">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>System Performance</CardTitle>
                                    <CardDescription className="text-gray-300">Key performance indicators</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm text-gray-400">Server Uptime</span>
                                            <span className="text-sm font-medium text-green-500">99.98%</span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-slate-600">
                                            <div className="h-2 rounded-full bg-green-500" style={{ width: "99.98%" }}></div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm text-gray-400">Average Response Time</span>
                                            <span className="text-sm font-medium">245ms</span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-slate-600">
                                            <div className="h-2 rounded-full bg-blue-500" style={{ width: "75%" }}></div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm text-gray-400">Database Performance</span>
                                            <span className="text-sm font-medium">Excellent</span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-slate-600">
                                            <div className="h-2 rounded-full bg-green-500" style={{ width: "90%" }}></div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm text-gray-400">API Success Rate</span>
                                            <span className="text-sm font-medium text-green-500">99.5%</span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-slate-600">
                                            <div className="h-2 rounded-full bg-green-500" style={{ width: "99.5%" }}></div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Error Rates</CardTitle>
                                    <CardDescription className="text-gray-300">System errors and exceptions</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="rounded-lg bg-slate-700/50 p-4">
                                        <div className="flex justify-between mb-2">
                                            <span className="font-medium">Payment Processing Errors</span>
                                            <span className="text-green-500">0.5%</span>
                                        </div>
                                        <p className="text-sm text-gray-400">12 errors in the last 30 days</p>
                                    </div>

                                    <div className="rounded-lg bg-slate-700/50 p-4">
                                        <div className="flex justify-between mb-2">
                                            <span className="font-medium">Authentication Failures</span>
                                            <span className="text-amber-500">1.2%</span>
                                        </div>
                                        <p className="text-sm text-gray-400">28 failures in the last 30 days</p>
                                    </div>

                                    <div className="rounded-lg bg-slate-700/50 p-4">
                                        <div className="flex justify-between mb-2">
                                            <span className="font-medium">Database Timeouts</span>
                                            <span className="text-green-500">0.1%</span>
                                        </div>
                                        <p className="text-sm text-gray-400">3 timeouts in the last 30 days</p>
                                    </div>

                                    <div className="rounded-lg bg-slate-700/50 p-4">
                                        <div className="flex justify-between mb-2">
                                            <span className="font-medium">API Errors</span>
                                            <span className="text-green-500">0.3%</span>
                                        </div>
                                        <p className="text-sm text-gray-400">7 errors in the last 30 days</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="bg-slate-800/60 border-slate-700 text-white mt-6">
                            <CardHeader>
                                <CardTitle>Resource Utilization</CardTitle>
                                <CardDescription className="text-gray-300">System resource usage</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-400">CPU Usage</p>
                                        <div className="flex items-center justify-between">
                                            <div className="h-2 w-full rounded-full bg-slate-600">
                                                <div className="h-2 rounded-full bg-green-500" style={{ width: "45%" }}></div>
                                            </div>
                                            <span className="ml-2 text-sm">45%</span>
                                        </div>
                                        <p className="text-xs text-gray-400">Average over 24 hours</p>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-400">Memory Usage</p>
                                        <div className="flex items-center justify-between">
                                            <div className="h-2 w-full rounded-full bg-slate-600">
                                                <div className="h-2 rounded-full bg-blue-500" style={{ width: "62%" }}></div>
                                            </div>
                                            <span className="ml-2 text-sm">62%</span>
                                        </div>
                                        <p className="text-xs text-gray-400">Average over 24 hours</p>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-400">Disk Usage</p>
                                        <div className="flex items-center justify-between">
                                            <div className="h-2 w-full rounded-full bg-slate-600">
                                                <div className="h-2 rounded-full bg-amber-500" style={{ width: "78%" }}></div>
                                            </div>
                                            <span className="ml-2 text-sm">78%</span>
                                        </div>
                                        <p className="text-xs text-gray-400">Total storage capacity</p>
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