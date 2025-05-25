"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard, ProgressFooter } from "@/components/dashboard/stat-card"
import { Users, FileText, Shield, TrendingUp, DollarSign } from "lucide-react"
import { PaymentChart } from "@/components/dashboard/payment-chart"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function AdminDashboardPage() {
    // Mock data for charts
    const monthlyRevenue = [
        { month: "Jan", amount: 125000 },
        { month: "Feb", amount: 135000 },
        { month: "Mar", amount: 142000 },
        { month: "Apr", amount: 138000 },
        { month: "May", amount: 155000 },
        { month: "Jun", amount: 162000 },
        { month: "Jul", amount: 168000 },
        { month: "Aug", amount: 0 },
        { month: "Sep", amount: 0 },
        { month: "Oct", amount: 0 },
        { month: "Nov", amount: 0 },
        { month: "Dec", amount: 0 },
    ]

    // Mock data for recent activities
    const recentActivities = [
        {
            id: "1",
            user: "John Smith",
            action: "Payment Received",
            amount: "₱1,500",
            timestamp: "2 minutes ago",
            status: "success",
        },
        {
            id: "2",
            user: "Maria Garcia",
            action: "User Registration",
            amount: "-",
            timestamp: "15 minutes ago",
            status: "info",
        },
        {
            id: "3",
            user: "Admin User",
            action: "Report Generated",
            amount: "-",
            timestamp: "1 hour ago",
            status: "info",
        },
        {
            id: "4",
            user: "System",
            action: "Security Alert",
            amount: "-",
            timestamp: "2 hours ago",
            status: "warning",
        },
    ]

    const columns = [
        {
            accessorKey: "user",
            header: "User",
        },
        {
            accessorKey: "action",
            header: "Action",
        },
        {
            accessorKey: "amount",
            header: "Amount",
        },
        {
            accessorKey: "timestamp",
            header: "Time",
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }: any) => {
                const status = row.getValue("status")
                const variant = status === "success" ? "default" : status === "warning" ? "destructive" : "secondary"
                return <Badge variant={variant}>{status}</Badge>
            },
        },
    ]

    return (
        <DashboardLayout allowedRoles={["admin"]}>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                    <p className="text-gray-300">System overview and management</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Users"
                        value="1,234"
                        icon={Users}
                        iconColor="text-blue-500"
                        iconBgColor="bg-blue-500/20"
                        footer={<ProgressFooter value={85} label="85% active users" />}
                    />
                    <StatCard
                        title="Total Revenue"
                        value="₱925,000"
                        icon={DollarSign}
                        iconColor="text-green-500"
                        iconBgColor="bg-green-500/20"
                        footer={
                            <div className="flex items-center text-green-500 text-sm">
                                <TrendingUp className="h-4 w-4 mr-1" />
                                <span>12% from last month</span>
                            </div>
                        }
                    />
                    <StatCard
                        title="Pending Reports"
                        value="23"
                        icon={FileText}
                        iconColor="text-yellow-500"
                        iconBgColor="bg-yellow-500/20"
                        footer={<p className="text-gray-400 text-sm">5 urgent</p>}
                    />
                    <StatCard
                        title="Security Alerts"
                        value="3"
                        icon={Shield}
                        iconColor="text-red-500"
                        iconBgColor="bg-red-500/20"
                        footer={<p className="text-gray-400 text-sm">2 critical</p>}
                    />
                </div>

                {/* Charts and Tables */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader>
                            <CardTitle>Monthly Revenue</CardTitle>
                            <CardDescription className="text-gray-300">Revenue trends for the current year</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80">
                                <PaymentChart data={monthlyRevenue} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader>
                            <CardTitle>System Status</CardTitle>
                            <CardDescription className="text-gray-300">Current system health and performance</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                                        <span>Database Status</span>
                                    </div>
                                    <span className="text-green-500">Operational</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                                        <span>Payment Gateway</span>
                                    </div>
                                    <span className="text-green-500">Connected</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="h-3 w-3 bg-yellow-500 rounded-full animate-pulse"></div>
                                        <span>Email Service</span>
                                    </div>
                                    <span className="text-yellow-500">Degraded</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                                        <span>API Services</span>
                                    </div>
                                    <span className="text-green-500">Operational</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Activities */}
                <Card className="mt-6 bg-slate-800/60 border-slate-700 text-white">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Recent Activities</CardTitle>
                            <CardDescription className="text-gray-300">Latest system activities and events</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" className="border-slate-600 text-white hover:bg-slate-700">
                            View All
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <DataTable columns={columns} data={recentActivities} />
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
