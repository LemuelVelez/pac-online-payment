"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatCard, ProgressFooter } from "@/components/dashboard/stat-card"
import { PaymentChart } from "@/components/dashboard/payment-chart"
import { PaymentPieChart } from "@/components/dashboard/payment-pie-chart"
import { UserTable } from "@/components/admin/user-table"
import { RecentActivityList } from "@/components/admin/recent-activity-list"
import { AlertCircle, Download, FileText, Users, DollarSign, TrendingUp, Calendar } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Mock data for the dashboard
const paymentHistory = [
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

const paymentDistribution = [
    { name: "Tuition", value: 650000 },
    { name: "Laboratory", value: 180000 },
    { name: "Library", value: 45000 },
    { name: "Miscellaneous", value: 120000 },
]

const recentUsers = [
    {
        id: "USR-1001",
        name: "John Smith",
        email: "john.smith@example.com",
        role: "Student",
        status: "Active",
        dateCreated: "2023-08-15",
    },
    {
        id: "USR-1002",
        name: "Maria Garcia",
        email: "maria.garcia@example.com",
        role: "Cashier",
        status: "Active",
        dateCreated: "2023-08-14",
    },
    {
        id: "USR-1003",
        name: "Robert Johnson",
        email: "robert.johnson@example.com",
        role: "Business Office",
        status: "Active",
        dateCreated: "2023-08-12",
    },
    {
        id: "USR-1004",
        name: "Sarah Williams",
        email: "sarah.williams@example.com",
        role: "Student",
        status: "Inactive",
        dateCreated: "2023-08-10",
    },
    {
        id: "USR-1005",
        name: "David Brown",
        email: "david.brown@example.com",
        role: "Student",
        status: "Active",
        dateCreated: "2023-08-09",
    },
]

const recentActivities = [
    {
        id: "ACT-1001",
        user: "Maria Garcia",
        action: "Processed payment",
        details: "Processed payment of ₱15,000 for student John Doe",
        timestamp: "Today at 2:30 PM",
    },
    {
        id: "ACT-1002",
        user: "Admin",
        action: "Added new user",
        details: "Added new user Sarah Williams with Student role",
        timestamp: "Today at 11:45 AM",
    },
    {
        id: "ACT-1003",
        user: "Robert Johnson",
        action: "Updated fee structure",
        details: "Updated tuition fee for BS Computer Science",
        timestamp: "Yesterday at 4:15 PM",
    },
    {
        id: "ACT-1004",
        user: "Admin",
        action: "System maintenance",
        details: "Performed system backup and maintenance",
        timestamp: "Yesterday at 10:30 AM",
    },
    {
        id: "ACT-1005",
        user: "Maria Garcia",
        action: "Generated report",
        details: "Generated monthly collection report for August 2023",
        timestamp: "Aug 31, 2023",
    },
]

export default function AdminDashboardPage() {
    const [selectedPeriod, setSelectedPeriod] = useState("monthly")

    return (
        <AdminLayout>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                        <p className="text-gray-300">Welcome back, Administrator</p>
                    </div>
                    <div className="mt-4 flex space-x-3 md:mt-0">
                        <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                            <Calendar className="mr-2 h-4 w-4" />
                            Select Date Range
                        </Button>
                        <Button className="bg-primary hover:bg-primary/90">
                            <Download className="mr-2 h-4 w-4" />
                            Export Reports
                        </Button>
                    </div>
                </div>

                <Alert className="mb-8 bg-amber-500/20 border-amber-500/50 text-amber-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        System maintenance scheduled for September 15, 2023, from 10:00 PM to 2:00 AM. The system will be
                        unavailable during this time.
                    </AlertDescription>
                </Alert>

                <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Users"
                        value="1,254"
                        icon={Users}
                        iconColor="text-blue-500"
                        iconBgColor="bg-blue-500/20"
                        footer={<ProgressFooter value={78} label="12% increase from last month" />}
                    />
                    <StatCard
                        title="Total Collections"
                        value="₱1,250,000"
                        icon={DollarSign}
                        iconColor="text-green-500"
                        iconBgColor="bg-green-500/20"
                        footer={<ProgressFooter value={65} label="8% increase from last month" />}
                    />
                    <StatCard
                        title="Pending Payments"
                        value="₱350,000"
                        icon={FileText}
                        iconColor="text-amber-500"
                        iconBgColor="bg-amber-500/20"
                        footer={<ProgressFooter value={45} label="15% decrease from last month" />}
                    />
                    <StatCard
                        title="Collection Rate"
                        value="78%"
                        icon={TrendingUp}
                        iconColor="text-purple-500"
                        iconBgColor="bg-purple-500/20"
                        footer={<ProgressFooter value={78} label="5% increase from last month" />}
                    />
                </div>

                <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div>
                                <CardTitle>Collection Overview</CardTitle>
                                <CardDescription className="text-gray-300">Monthly collection data</CardDescription>
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
                                <PaymentChart data={paymentHistory} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader className="pb-2">
                            <CardTitle>Fee Distribution</CardTitle>
                            <CardDescription className="text-gray-300">Breakdown of collected fees by category</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80">
                                <PaymentPieChart data={paymentDistribution} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader>
                            <CardTitle>Recent Users</CardTitle>
                            <CardDescription className="text-gray-300">Recently added users in the system</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <UserTable users={recentUsers} isCompact />
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                            <CardDescription className="text-gray-300">Latest actions performed in the system</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <RecentActivityList activities={recentActivities} />
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-8">
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="bg-slate-800 border-slate-700 mb-8 grid w-full grid-cols-3 lg:max-w-[600px]">
                            <TabsTrigger value="overview" className="cursor-pointer">
                                System Overview
                            </TabsTrigger>
                            <TabsTrigger value="performance" className="cursor-pointer">
                                Performance
                            </TabsTrigger>
                            <TabsTrigger value="security" className="cursor-pointer">
                                Security Logs
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview">
                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>System Overview</CardTitle>
                                    <CardDescription className="text-gray-300">Current system status and metrics</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                            <div className="rounded-lg bg-slate-700/50 p-4">
                                                <p className="text-sm text-gray-300">System Version</p>
                                                <p className="text-lg font-medium">v2.5.3</p>
                                            </div>
                                            <div className="rounded-lg bg-slate-700/50 p-4">
                                                <p className="text-sm text-gray-300">Last Backup</p>
                                                <p className="text-lg font-medium">Aug 31, 2023 - 02:00 AM</p>
                                            </div>
                                            <div className="rounded-lg bg-slate-700/50 p-4">
                                                <p className="text-sm text-gray-300">Server Status</p>
                                                <p className="text-lg font-medium text-green-500">Operational</p>
                                            </div>
                                        </div>

                                        <div className="rounded-lg bg-slate-700/30 p-4">
                                            <h3 className="mb-2 text-lg font-medium">Active Modules</h3>
                                            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
                                                <div className="rounded-md bg-green-500/20 px-3 py-2 text-green-300">User Management</div>
                                                <div className="rounded-md bg-green-500/20 px-3 py-2 text-green-300">Payment Processing</div>
                                                <div className="rounded-md bg-green-500/20 px-3 py-2 text-green-300">Reporting</div>
                                                <div className="rounded-md bg-green-500/20 px-3 py-2 text-green-300">Fee Management</div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="performance">
                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>System Performance</CardTitle>
                                    <CardDescription className="text-gray-300">Performance metrics and statistics</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                            <div className="rounded-lg bg-slate-700/50 p-4">
                                                <p className="text-sm text-gray-300">Average Response Time</p>
                                                <p className="text-lg font-medium">245ms</p>
                                            </div>
                                            <div className="rounded-lg bg-slate-700/50 p-4">
                                                <p className="text-sm text-gray-300">Uptime</p>
                                                <p className="text-lg font-medium">99.98%</p>
                                            </div>
                                            <div className="rounded-lg bg-slate-700/50 p-4">
                                                <p className="text-sm text-gray-300">Active Users</p>
                                                <p className="text-lg font-medium">42</p>
                                            </div>
                                        </div>

                                        <div className="rounded-lg bg-slate-700/30 p-4">
                                            <h3 className="mb-2 text-lg font-medium">Resource Usage</h3>
                                            <div className="space-y-3">
                                                <div>
                                                    <div className="mb-1 flex justify-between">
                                                        <span>CPU Usage</span>
                                                        <span>35%</span>
                                                    </div>
                                                    <div className="h-2 w-full rounded-full bg-slate-600">
                                                        <div className="h-2 rounded-full bg-blue-500" style={{ width: "35%" }}></div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="mb-1 flex justify-between">
                                                        <span>Memory Usage</span>
                                                        <span>62%</span>
                                                    </div>
                                                    <div className="h-2 w-full rounded-full bg-slate-600">
                                                        <div className="h-2 rounded-full bg-amber-500" style={{ width: "62%" }}></div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="mb-1 flex justify-between">
                                                        <span>Disk Usage</span>
                                                        <span>28%</span>
                                                    </div>
                                                    <div className="h-2 w-full rounded-full bg-slate-600">
                                                        <div className="h-2 rounded-full bg-green-500" style={{ width: "28%" }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="security">
                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Security Logs</CardTitle>
                                    <CardDescription className="text-gray-300">Recent security events and logs</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="rounded-lg border border-slate-700">
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b border-slate-700 bg-slate-900/50 text-left text-sm font-medium text-gray-300">
                                                        <th className="px-6 py-3">Timestamp</th>
                                                        <th className="px-6 py-3">Event</th>
                                                        <th className="px-6 py-3">User</th>
                                                        <th className="px-6 py-3">IP Address</th>
                                                        <th className="px-6 py-3">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-700">
                                                    <tr className="text-sm">
                                                        <td className="whitespace-nowrap px-6 py-4">Sep 01, 2023 10:15 AM</td>
                                                        <td className="px-6 py-4">Login Attempt</td>
                                                        <td className="px-6 py-4">admin@pacsalug.edu.ph</td>
                                                        <td className="px-6 py-4">192.168.1.105</td>
                                                        <td className="px-6 py-4">
                                                            <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-500">
                                                                Success
                                                            </span>
                                                        </td>
                                                    </tr>
                                                    <tr className="text-sm">
                                                        <td className="whitespace-nowrap px-6 py-4">Sep 01, 2023 09:45 AM</td>
                                                        <td className="px-6 py-4">Password Change</td>
                                                        <td className="px-6 py-4">maria.garcia@example.com</td>
                                                        <td className="px-6 py-4">192.168.1.110</td>
                                                        <td className="px-6 py-4">
                                                            <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-500">
                                                                Success
                                                            </span>
                                                        </td>
                                                    </tr>
                                                    <tr className="text-sm">
                                                        <td className="whitespace-nowrap px-6 py-4">Sep 01, 2023 08:30 AM</td>
                                                        <td className="px-6 py-4">Login Attempt</td>
                                                        <td className="px-6 py-4">unknown@example.com</td>
                                                        <td className="px-6 py-4">203.45.67.89</td>
                                                        <td className="px-6 py-4">
                                                            <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-500">
                                                                Failed
                                                            </span>
                                                        </td>
                                                    </tr>
                                                    <tr className="text-sm">
                                                        <td className="whitespace-nowrap px-6 py-4">Aug 31, 2023 05:20 PM</td>
                                                        <td className="px-6 py-4">Permission Change</td>
                                                        <td className="px-6 py-4">admin@pacsalug.edu.ph</td>
                                                        <td className="px-6 py-4">192.168.1.105</td>
                                                        <td className="px-6 py-4">
                                                            <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-500">
                                                                Success
                                                            </span>
                                                        </td>
                                                    </tr>
                                                    <tr className="text-sm">
                                                        <td className="whitespace-nowrap px-6 py-4">Aug 31, 2023 03:15 PM</td>
                                                        <td className="px-6 py-4">Login Attempt</td>
                                                        <td className="px-6 py-4">robert.johnson@example.com</td>
                                                        <td className="px-6 py-4">192.168.1.120</td>
                                                        <td className="px-6 py-4">
                                                            <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-500">
                                                                Success
                                                            </span>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </AdminLayout>
    )
}
