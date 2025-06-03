/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DateRangePicker } from "@/components/admin/date-range-picker"
import { PaymentChart } from "@/components/dashboard/payment-chart"
import { PaymentPieChart } from "@/components/dashboard/payment-pie-chart"
import {
    Download,
    Plus,
    Edit,
    Trash2,
    AlertTriangle,
    TrendingUp,
    DollarSign,
    Target,
    Calendar,
    Save,
} from "lucide-react"

// Mock data for budget management
const budgetCategories = [
    {
        id: 1,
        name: "Academic Programs",
        allocated: 5000000,
        spent: 3800000,
        remaining: 1200000,
        percentage: 76,
        status: "on-track",
        lastUpdated: "2023-09-01",
    },
    {
        id: 2,
        name: "Infrastructure",
        allocated: 2500000,
        spent: 2100000,
        remaining: 400000,
        percentage: 84,
        status: "warning",
        lastUpdated: "2023-08-30",
    },
    {
        id: 3,
        name: "Student Services",
        allocated: 1500000,
        spent: 1650000,
        remaining: -150000,
        percentage: 110,
        status: "over-budget",
        lastUpdated: "2023-09-01",
    },
    {
        id: 4,
        name: "Administration",
        allocated: 2000000,
        spent: 1450000,
        remaining: 550000,
        percentage: 72.5,
        status: "on-track",
        lastUpdated: "2023-08-31",
    },
    {
        id: 5,
        name: "Technology",
        allocated: 1200000,
        spent: 850000,
        remaining: 350000,
        percentage: 70.8,
        status: "on-track",
        lastUpdated: "2023-08-29",
    },
]

const monthlyBudgetTrend = [
    { month: "Jan", budgeted: 1000000, actual: 950000 },
    { month: "Feb", budgeted: 1000000, actual: 1050000 },
    { month: "Mar", budgeted: 1000000, actual: 980000 },
    { month: "Apr", budgeted: 1000000, actual: 1100000 },
    { month: "May", budgeted: 1000000, actual: 1200000 },
    { month: "Jun", budgeted: 1000000, actual: 1150000 },
    { month: "Jul", budgeted: 1000000, actual: 1080000 },
    { month: "Aug", budgeted: 1000000, actual: 1250000 },
]

const budgetDistribution = [
    { name: "Academic Programs", value: 5000000 },
    { name: "Infrastructure", value: 2500000 },
    { name: "Student Services", value: 1500000 },
    { name: "Administration", value: 2000000 },
    { name: "Technology", value: 1200000 },
]

export default function BudgetManagementPage() {
    const [selectedCategory, setSelectedCategory] = useState("all")
    const [isEditing, setIsEditing] = useState(false)
    const [editingCategory, setEditingCategory] = useState(null)

    const totalBudget = budgetCategories.reduce((sum, cat) => sum + cat.allocated, 0)
    const totalSpent = budgetCategories.reduce((sum, cat) => sum + cat.spent, 0)
    const totalRemaining = totalBudget - totalSpent

    return (
        <DashboardLayout allowedRoles={["business-office"]}>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Budget Management</h1>
                        <p className="text-gray-300">Monitor and manage institutional budgets</p>
                    </div>
                    <div className="mt-4 flex space-x-3 md:mt-0">
                        <DateRangePicker />
                        <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                            <Plus className="mr-2 h-4 w-4" />
                            New Budget
                        </Button>
                        <Button className="bg-primary hover:bg-primary/90">
                            <Download className="mr-2 h-4 w-4" />
                            Export Report
                        </Button>
                    </div>
                </div>

                {/* Budget Overview Cards */}
                <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₱{(totalBudget / 1000000).toFixed(1)}M</div>
                            <p className="text-xs text-gray-400 mt-1">
                                <Target className="inline h-3 w-3 text-blue-500 mr-1" />
                                FY 2023-2024
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₱{(totalSpent / 1000000).toFixed(1)}M</div>
                            <p className="text-xs text-gray-400 mt-1">
                                <DollarSign className="inline h-3 w-3 text-green-500 mr-1" />
                                {((totalSpent / totalBudget) * 100).toFixed(1)}% utilized
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Remaining Budget</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₱{(totalRemaining / 1000000).toFixed(1)}M</div>
                            <p className="text-xs text-gray-400 mt-1">
                                <Calendar className="inline h-3 w-3 text-amber-500 mr-1" />4 months remaining
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Budget Variance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-500">+₱150K</div>
                            <p className="text-xs text-gray-400 mt-1">
                                <TrendingUp className="inline h-3 w-3 text-red-500 mr-1" />
                                1.2% over budget
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Budget Alerts */}
                <div className="mb-8 space-y-4">
                    <Alert className="bg-red-500/20 border-red-500/50 text-red-200">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            Student Services is over budget by ₱150,000 (10%). Immediate attention required.
                        </AlertDescription>
                    </Alert>
                    <Alert className="bg-amber-500/20 border-amber-500/50 text-amber-200">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            Infrastructure budget is at 84% utilization with 4 months remaining. Monitor closely.
                        </AlertDescription>
                    </Alert>
                </div>

                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="bg-slate-800 border-slate-700 mb-8 grid w-full grid-cols-4 lg:max-w-[600px]">
                        <TabsTrigger value="overview" className="cursor-pointer">
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="categories" className="cursor-pointer">
                            Categories
                        </TabsTrigger>
                        <TabsTrigger value="trends" className="cursor-pointer">
                            Trends
                        </TabsTrigger>
                        <TabsTrigger value="planning" className="cursor-pointer">
                            Planning
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Budget Distribution</CardTitle>
                                    <CardDescription className="text-gray-300">Allocation by category</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-80">
                                        <PaymentPieChart data={budgetDistribution} />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Budget vs Actual Spending</CardTitle>
                                    <CardDescription className="text-gray-300">Monthly comparison</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-80">
                                        <PaymentChart
                                            data={monthlyBudgetTrend.map((item) => ({
                                                month: item.month,
                                                amount: item.actual,
                                            }))}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="mt-6 bg-slate-800/60 border-slate-700 text-white">
                            <CardHeader>
                                <CardTitle>Budget Performance Summary</CardTitle>
                                <CardDescription className="text-gray-300">Key metrics and insights</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                    <div className="space-y-4">
                                        <h3 className="font-medium">Top Performing Categories</h3>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-400">Technology</span>
                                                <span className="text-sm text-green-500">29.2% under budget</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-400">Administration</span>
                                                <span className="text-sm text-green-500">27.5% under budget</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-400">Academic Programs</span>
                                                <span className="text-sm text-green-500">24% under budget</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="font-medium">Areas of Concern</h3>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-400">Student Services</span>
                                                <span className="text-sm text-red-500">10% over budget</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-400">Infrastructure</span>
                                                <span className="text-sm text-amber-500">84% utilized</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="font-medium">Recommendations</h3>
                                        <div className="space-y-2 text-sm text-gray-400">
                                            <p>• Reallocate funds from under-utilized categories</p>
                                            <p>• Implement cost controls for Student Services</p>
                                            <p>• Review Infrastructure spending patterns</p>
                                            <p>• Consider budget adjustments for Q4</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="categories">
                        <Card className="bg-slate-800/60 border-slate-700 text-white">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Budget Categories</CardTitle>
                                    <CardDescription className="text-gray-300">Detailed breakdown by category</CardDescription>
                                </div>
                                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                    <SelectTrigger className="w-[200px] bg-slate-700 border-slate-600">
                                        <SelectValue placeholder="Filter by category" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                        <SelectItem value="all">All Categories</SelectItem>
                                        <SelectItem value="academic">Academic Programs</SelectItem>
                                        <SelectItem value="infrastructure">Infrastructure</SelectItem>
                                        <SelectItem value="student">Student Services</SelectItem>
                                        <SelectItem value="admin">Administration</SelectItem>
                                        <SelectItem value="tech">Technology</SelectItem>
                                    </SelectContent>
                                </Select>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {budgetCategories.map((category) => (
                                        <div key={category.id} className="rounded-lg border border-slate-700 p-6">
                                            <div className="mb-4 flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-lg font-medium">{category.name}</h3>
                                                    <p className="text-sm text-gray-400">Last updated: {category.lastUpdated}</p>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-slate-600 text-white hover:bg-slate-700"
                                                        onClick={() => {
                                                            setEditingCategory(category)
                                                            setIsEditing(true)
                                                        }}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-red-600 text-red-400 hover:bg-red-600/20"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                                                <div>
                                                    <p className="text-sm text-gray-400">Allocated</p>
                                                    <p className="text-xl font-bold">₱{category.allocated.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-400">Spent</p>
                                                    <p className="text-xl font-bold">₱{category.spent.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-400">Remaining</p>
                                                    <p
                                                        className={`text-xl font-bold ${category.remaining < 0 ? "text-red-500" : "text-green-500"
                                                            }`}
                                                    >
                                                        ₱{Math.abs(category.remaining).toLocaleString()}
                                                        {category.remaining < 0 ? " over" : ""}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-400">Utilization</p>
                                                    <p
                                                        className={`text-xl font-bold ${category.percentage > 100
                                                                ? "text-red-500"
                                                                : category.percentage > 80
                                                                    ? "text-amber-500"
                                                                    : "text-green-500"
                                                            }`}
                                                    >
                                                        {category.percentage.toFixed(1)}%
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-4">
                                                <div className="mb-2 flex justify-between">
                                                    <span className="text-sm text-gray-400">Budget Utilization</span>
                                                    <span className="text-sm">{category.percentage.toFixed(1)}%</span>
                                                </div>
                                                <Progress
                                                    value={Math.min(category.percentage, 100)}
                                                    className={`h-3 ${category.percentage > 100
                                                            ? "bg-red-900"
                                                            : category.percentage > 80
                                                                ? "bg-amber-900"
                                                                : "bg-slate-700"
                                                        }`}
                                                />
                                                {category.percentage > 100 && (
                                                    <div className="mt-1 text-xs text-red-400">
                                                        Over budget by {(category.percentage - 100).toFixed(1)}%
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-4 flex justify-between">
                                                <span
                                                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${category.status === "on-track"
                                                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500"
                                                            : category.status === "warning"
                                                                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500"
                                                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500"
                                                        }`}
                                                >
                                                    {category.status === "on-track"
                                                        ? "On Track"
                                                        : category.status === "warning"
                                                            ? "Warning"
                                                            : "Over Budget"}
                                                </span>
                                                <Button size="sm" variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                                                    View Details
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="trends">
                        <div className="space-y-6">
                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Monthly Budget Trends</CardTitle>
                                    <CardDescription className="text-gray-300">Budget vs actual spending over time</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-96">
                                        <PaymentChart
                                            data={monthlyBudgetTrend.map((item) => ({
                                                month: item.month,
                                                amount: item.actual,
                                            }))}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                                <Card className="bg-slate-800/60 border-slate-700 text-white">
                                    <CardHeader>
                                        <CardTitle>Spending Velocity</CardTitle>
                                        <CardDescription className="text-gray-300">Rate of budget consumption</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Current Rate</span>
                                            <span className="font-medium">₱1.25M/month</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Target Rate</span>
                                            <span className="font-medium">₱1.0M/month</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Variance</span>
                                            <span className="font-medium text-red-500">+25%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Projected Depletion</span>
                                            <span className="font-medium text-amber-500">3.2 months</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-slate-800/60 border-slate-700 text-white">
                                    <CardHeader>
                                        <CardTitle>Seasonal Patterns</CardTitle>
                                        <CardDescription className="text-gray-300">Historical spending patterns</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Q1 Average</span>
                                            <span className="font-medium">₱2.98M</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Q2 Average</span>
                                            <span className="font-medium">₱3.58M</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Q3 Current</span>
                                            <span className="font-medium text-amber-500">₱3.75M</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Q4 Projected</span>
                                            <span className="font-medium">₱2.85M</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-slate-800/60 border-slate-700 text-white">
                                    <CardHeader>
                                        <CardTitle>Budget Efficiency</CardTitle>
                                        <CardDescription className="text-gray-300">Performance metrics</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm text-gray-400">Cost per Student</span>
                                                <span className="text-sm font-medium">₱45,250</span>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-slate-600">
                                                <div className="h-2 rounded-full bg-green-500" style={{ width: "85%" }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm text-gray-400">Budget Accuracy</span>
                                                <span className="text-sm font-medium">88%</span>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-slate-600">
                                                <div className="h-2 rounded-full bg-blue-500" style={{ width: "88%" }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm text-gray-400">Variance Control</span>
                                                <span className="text-sm font-medium">72%</span>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-slate-600">
                                                <div className="h-2 rounded-full bg-amber-500" style={{ width: "72%" }}></div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="planning">
                        <div className="space-y-6">
                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Budget Planning & Adjustments</CardTitle>
                                    <CardDescription className="text-gray-300">Plan and modify budget allocations</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-medium">Proposed Adjustments</h3>
                                            <div className="space-y-4">
                                                <div className="rounded-lg border border-slate-700 p-4">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="font-medium">Student Services</span>
                                                        <span className="text-red-500">-₱200,000</span>
                                                    </div>
                                                    <p className="text-sm text-gray-400">Reduce allocation due to over-spending</p>
                                                </div>
                                                <div className="rounded-lg border border-slate-700 p-4">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="font-medium">Technology</span>
                                                        <span className="text-green-500">+₱150,000</span>
                                                    </div>
                                                    <p className="text-sm text-gray-400">Increase for infrastructure upgrades</p>
                                                </div>
                                                <div className="rounded-lg border border-slate-700 p-4">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="font-medium">Academic Programs</span>
                                                        <span className="text-green-500">+₱50,000</span>
                                                    </div>
                                                    <p className="text-sm text-gray-400">Additional funding for new courses</p>
                                                </div>
                                            </div>
                                            <Button className="w-full bg-primary hover:bg-primary/90">
                                                <Save className="mr-2 h-4 w-4" />
                                                Apply Adjustments
                                            </Button>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-lg font-medium">Next Year Planning</h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <Label htmlFor="total-budget">Total Budget (FY 2024-2025)</Label>
                                                    <Input
                                                        id="total-budget"
                                                        defaultValue="13,500,000"
                                                        className="bg-slate-700 border-slate-600"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="inflation-rate">Inflation Adjustment (%)</Label>
                                                    <Input id="inflation-rate" defaultValue="3.5" className="bg-slate-700 border-slate-600" />
                                                </div>
                                                <div>
                                                    <Label htmlFor="growth-factor">Growth Factor (%)</Label>
                                                    <Input id="growth-factor" defaultValue="8.0" className="bg-slate-700 border-slate-600" />
                                                </div>
                                                <div>
                                                    <Label htmlFor="contingency">Contingency Reserve (%)</Label>
                                                    <Input id="contingency" defaultValue="5.0" className="bg-slate-700 border-slate-600" />
                                                </div>
                                            </div>
                                            <Button variant="outline" className="w-full border-slate-600 text-white hover:bg-slate-700">
                                                Generate Draft Budget
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                                <Card className="bg-slate-800/60 border-slate-700 text-white">
                                    <CardHeader>
                                        <CardTitle>Budget Scenarios</CardTitle>
                                        <CardDescription className="text-gray-300">What-if analysis</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="rounded-lg bg-green-500/20 p-3">
                                            <h4 className="font-medium text-green-400">Optimistic (+10%)</h4>
                                            <p className="text-sm text-gray-300">₱13.5M total budget</p>
                                            <p className="text-xs text-gray-400">Increased enrollment scenario</p>
                                        </div>
                                        <div className="rounded-lg bg-blue-500/20 p-3">
                                            <h4 className="font-medium text-blue-400">Baseline (Current)</h4>
                                            <p className="text-sm text-gray-300">₱12.2M total budget</p>
                                            <p className="text-xs text-gray-400">Current trajectory</p>
                                        </div>
                                        <div className="rounded-lg bg-amber-500/20 p-3">
                                            <h4 className="font-medium text-amber-400">Conservative (-5%)</h4>
                                            <p className="text-sm text-gray-300">₱11.6M total budget</p>
                                            <p className="text-xs text-gray-400">Economic uncertainty scenario</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-slate-800/60 border-slate-700 text-white">
                                    <CardHeader>
                                        <CardTitle>Risk Assessment</CardTitle>
                                        <CardDescription className="text-gray-300">Budget risk factors</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-400">Enrollment Risk</span>
                                            <span className="text-sm text-amber-500">Medium</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-400">Economic Risk</span>
                                            <span className="text-sm text-red-500">High</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-400">Operational Risk</span>
                                            <span className="text-sm text-green-500">Low</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-400">Regulatory Risk</span>
                                            <span className="text-sm text-amber-500">Medium</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-400">Technology Risk</span>
                                            <span className="text-sm text-green-500">Low</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-slate-800/60 border-slate-700 text-white">
                                    <CardHeader>
                                        <CardTitle>Action Items</CardTitle>
                                        <CardDescription className="text-gray-300">Recommended actions</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="text-sm">
                                            <p className="font-medium text-red-400">High Priority</p>
                                            <p className="text-gray-400">Address Student Services overspend</p>
                                        </div>
                                        <div className="text-sm">
                                            <p className="font-medium text-amber-400">Medium Priority</p>
                                            <p className="text-gray-400">Review Infrastructure spending</p>
                                        </div>
                                        <div className="text-sm">
                                            <p className="font-medium text-green-400">Low Priority</p>
                                            <p className="text-gray-400">Optimize Technology allocation</p>
                                        </div>
                                        <div className="text-sm">
                                            <p className="font-medium text-blue-400">Planning</p>
                                            <p className="text-gray-400">Prepare FY 2024-2025 budget</p>
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
