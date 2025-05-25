"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard, ProgressFooter } from "@/components/dashboard/stat-card"
import { DollarSign, TrendingUp, FileText, AlertCircle, PieChart, BarChart4 } from "lucide-react"
import { PaymentChart } from "@/components/dashboard/payment-chart"
import { PaymentPieChart } from "@/components/dashboard/payment-pie-chart"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

export default function BusinessOfficeDashboardPage() {
    // Mock data for financial overview
    const monthlyRevenue = [
        { month: "Jan", amount: 850000 },
        { month: "Feb", amount: 920000 },
        { month: "Mar", amount: 1100000 },
        { month: "Apr", amount: 980000 },
        { month: "May", amount: 1250000 },
        { month: "Jun", amount: 1180000 },
        { month: "Jul", amount: 1350000 },
        { month: "Aug", amount: 0 },
        { month: "Sep", amount: 0 },
        { month: "Oct", amount: 0 },
        { month: "Nov", amount: 0 },
        { month: "Dec", amount: 0 },
    ]

    const revenueByCategory = [
        { name: "Tuition Fees", value: 4500000 },
        { name: "Laboratory Fees", value: 850000 },
        { name: "Library Fees", value: 320000 },
        { name: "Miscellaneous", value: 680000 },
        { name: "Other Fees", value: 450000 },
    ]

    const budgetAllocation = [
        { category: "Academic Programs", allocated: 3500000, spent: 2800000 },
        { category: "Infrastructure", allocated: 1500000, spent: 1200000 },
        { category: "Student Services", allocated: 800000, spent: 650000 },
        { category: "Administration", allocated: 1200000, spent: 1100000 },
    ]

    return (
        <DashboardLayout allowedRoles={["business-office"]}>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white">Business Office Dashboard</h1>
                    <p className="text-gray-300">Financial overview and management</p>
                </div>

                {/* Financial Stats */}
                <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Revenue YTD"
                        value="₱6.8M"
                        icon={DollarSign}
                        iconColor="text-green-500"
                        iconBgColor="bg-green-500/20"
                        footer={
                            <div className="flex items-center text-green-500 text-sm">
                                <TrendingUp className="h-4 w-4 mr-1" />
                                <span>15% from last year</span>
                            </div>
                        }
                    />
                    <StatCard
                        title="Outstanding Balance"
                        value="₱1.2M"
                        icon={AlertCircle}
                        iconColor="text-yellow-500"
                        iconBgColor="bg-yellow-500/20"
                        footer={<ProgressFooter value={35} label="35% of total receivables" />}
                    />
                    <StatCard
                        title="Collection Rate"
                        value="85%"
                        icon={PieChart}
                        iconColor="text-blue-500"
                        iconBgColor="bg-blue-500/20"
                        footer={<p className="text-gray-400 text-sm">Target: 90%</p>}
                    />
                    <StatCard
                        title="Budget Utilization"
                        value="78%"
                        icon={BarChart4}
                        iconColor="text-purple-500"
                        iconBgColor="bg-purple-500/20"
                        footer={<ProgressFooter value={78} label="₱5.5M of ₱7M" />}
                    />
                </div>

                {/* Revenue Charts */}
                <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-2">
                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader>
                            <CardTitle>Monthly Revenue Trend</CardTitle>
                            <CardDescription className="text-gray-300">Revenue performance for the current year</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80">
                                <PaymentChart data={monthlyRevenue} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader>
                            <CardTitle>Revenue by Category</CardTitle>
                            <CardDescription className="text-gray-300">Distribution of revenue sources</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80">
                                <PaymentPieChart data={revenueByCategory} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Budget Overview */}
                <Card className="bg-slate-800/60 border-slate-700 text-white">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Budget Allocation & Utilization</CardTitle>
                            <CardDescription className="text-gray-300">Current fiscal year budget status</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" className="border-slate-600 text-white hover:bg-slate-700">
                            View Details
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {budgetAllocation.map((item, index) => (
                                <div key={index} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">{item.category}</span>
                                        <span className="text-sm text-gray-400">
                                            ₱{(item.spent / 1000000).toFixed(1)}M / ₱{(item.allocated / 1000000).toFixed(1)}M
                                        </span>
                                    </div>
                                    <Progress value={(item.spent / item.allocated) * 100} className="h-2 bg-slate-700" />
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-400">{Math.round((item.spent / item.allocated) * 100)}% utilized</span>
                                        <span className="text-gray-400">
                                            ₱{((item.allocated - item.spent) / 1000000).toFixed(1)}M remaining
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="mt-6 bg-slate-800/60 border-slate-700 text-white">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription className="text-gray-300">Common financial operations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                                <FileText className="mr-2 h-4 w-4" />
                                Generate Report
                            </Button>
                            <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                                <DollarSign className="mr-2 h-4 w-4" />
                                View Collections
                            </Button>
                            <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                                <BarChart4 className="mr-2 h-4 w-4" />
                                Budget Analysis
                            </Button>
                            <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                                <AlertCircle className="mr-2 h-4 w-4" />
                                Outstanding Balances
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
