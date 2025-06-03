"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DateRangePicker } from "@/components/admin/date-range-picker"
import { PaymentChart } from "@/components/dashboard/payment-chart"
import { PaymentPieChart } from "@/components/dashboard/payment-pie-chart"
import {
  Download,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Calendar,
} from "lucide-react"

// Mock data for expenses
const expenseCategories = [
  {
    id: 1,
    name: "Salaries & Benefits",
    budgeted: 6000000,
    spent: 4800000,
    remaining: 1200000,
    percentage: 80,
    trend: "stable",
    lastMonth: 600000,
  },
  {
    id: 2,
    name: "Utilities",
    budgeted: 800000,
    spent: 520000,
    remaining: 280000,
    percentage: 65,
    trend: "increasing",
    lastMonth: 85000,
  },
  {
    id: 3,
    name: "Maintenance & Repairs",
    budgeted: 500000,
    spent: 380000,
    remaining: 120000,
    percentage: 76,
    trend: "stable",
    lastMonth: 45000,
  },
  {
    id: 4,
    name: "Office Supplies",
    budgeted: 200000,
    spent: 165000,
    remaining: 35000,
    percentage: 82.5,
    trend: "decreasing",
    lastMonth: 18000,
  },
  {
    id: 5,
    name: "Technology",
    budgeted: 1200000,
    spent: 950000,
    remaining: 250000,
    percentage: 79.2,
    trend: "increasing",
    lastMonth: 120000,
  },
  {
    id: 6,
    name: "Marketing",
    budgeted: 300000,
    spent: 180000,
    remaining: 120000,
    percentage: 60,
    trend: "stable",
    lastMonth: 25000,
  },
]

const recentExpenses = [
  {
    id: "EXP-001",
    date: "2023-09-01",
    vendor: "ABC Utilities Corp",
    category: "Utilities",
    description: "Monthly electricity bill",
    amount: 85000,
    status: "approved",
    approvedBy: "John Manager",
    receipt: true,
  },
  {
    id: "EXP-002",
    date: "2023-09-01",
    vendor: "Tech Solutions Inc",
    category: "Technology",
    description: "Software licenses renewal",
    amount: 120000,
    status: "pending",
    approvedBy: null,
    receipt: true,
  },
  {
    id: "EXP-003",
    date: "2023-08-31",
    vendor: "Office Depot",
    category: "Office Supplies",
    description: "Stationery and supplies",
    amount: 18000,
    status: "approved",
    approvedBy: "Jane Smith",
    receipt: true,
  },
  {
    id: "EXP-004",
    date: "2023-08-30",
    vendor: "Maintenance Co",
    category: "Maintenance & Repairs",
    description: "HVAC system maintenance",
    amount: 45000,
    status: "approved",
    approvedBy: "John Manager",
    receipt: false,
  },
  {
    id: "EXP-005",
    date: "2023-08-29",
    vendor: "Marketing Agency",
    category: "Marketing",
    description: "Digital advertising campaign",
    amount: 25000,
    status: "rejected",
    approvedBy: "Jane Smith",
    receipt: true,
  },
]

const monthlyExpenseTrend = [
  { month: "Jan", amount: 850000 },
  { month: "Feb", amount: 920000 },
  { month: "Mar", amount: 880000 },
  { month: "Apr", amount: 950000 },
  { month: "May", amount: 1100000 },
  { month: "Jun", amount: 980000 },
  { month: "Jul", amount: 1050000 },
  { month: "Aug", amount: 1150000 },
]

const expenseDistribution = [
  { name: "Salaries & Benefits", value: 4800000 },
  { name: "Technology", value: 950000 },
  { name: "Utilities", value: 520000 },
  { name: "Maintenance", value: 380000 },
  { name: "Marketing", value: 180000 },
  { name: "Office Supplies", value: 165000 },
]

export default function ExpensesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [isAddingExpense, setIsAddingExpense] = useState(false)

  const filteredExpenses = recentExpenses.filter((expense) => {
    const matchesSearch =
      expense.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || expense.status === statusFilter
    const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter

    return matchesSearch && matchesStatus && matchesCategory
  })

  const totalBudget = expenseCategories.reduce((sum, cat) => sum + cat.budgeted, 0)
  const totalSpent = expenseCategories.reduce((sum, cat) => sum + cat.spent, 0)
  const totalRemaining = totalBudget - totalSpent

  return (
    <DashboardLayout allowedRoles={["business-office"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Expense Management</h1>
            <p className="text-gray-300">Track and manage institutional expenses</p>
          </div>
          <div className="mt-4 flex space-x-3 md:mt-0">
            <DateRangePicker />
            <Button
              variant="outline"
              className="border-slate-600 text-white hover:bg-slate-700"
              onClick={() => setIsAddingExpense(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
            <Button className="bg-primary hover:bg-primary/90">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Expense Overview Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <Card className="bg-slate-800/60 border-slate-700 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₱{(totalBudget / 1000000).toFixed(1)}M</div>
              <p className="text-xs text-gray-400 mt-1">
                <DollarSign className="inline h-3 w-3 text-blue-500 mr-1" />
                Annual budget
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
                <CheckCircle className="inline h-3 w-3 text-green-500 mr-1" />
                {((totalSpent / totalBudget) * 100).toFixed(1)}% of budget
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
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-gray-400 mt-1">
                <Clock className="inline h-3 w-3 text-amber-500 mr-1" />
                Require attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Expense Alerts */}
        <div className="mb-8 space-y-4">
          <Alert className="bg-amber-500/20 border-amber-500/50 text-amber-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Office Supplies category is at 82.5% of budget with 4 months remaining. Monitor spending closely.
            </AlertDescription>
          </Alert>
          <Alert className="bg-blue-500/20 border-blue-500/50 text-blue-200">
            <Clock className="h-4 w-4" />
            <AlertDescription>3 expense requests are pending approval totaling ₱163,000.</AlertDescription>
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
            <TabsTrigger value="expenses" className="cursor-pointer">
              Expenses
            </TabsTrigger>
            <TabsTrigger value="analytics" className="cursor-pointer">
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card className="bg-slate-800/60 border-slate-700 text-white">
                  <CardHeader>
                    <CardTitle>Monthly Expense Trend</CardTitle>
                    <CardDescription className="text-gray-300">Expense patterns over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <PaymentChart data={monthlyExpenseTrend} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/60 border-slate-700 text-white">
                  <CardHeader>
                    <CardTitle>Expense Distribution</CardTitle>
                    <CardDescription className="text-gray-300">Spending by category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <PaymentPieChart data={expenseDistribution} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-slate-800/60 border-slate-700 text-white">
                <CardHeader>
                  <CardTitle>Budget Performance Summary</CardTitle>
                  <CardDescription className="text-gray-300">Category-wise budget utilization</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {expenseCategories.map((category) => (
                      <div key={category.id} className="rounded-lg border border-slate-700 p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">{category.name}</h3>
                          <Badge
                            variant={
                              category.percentage > 90
                                ? "destructive"
                                : category.percentage > 75
                                  ? "secondary"
                                  : "default"
                            }
                            className={
                              category.percentage > 90
                                ? "bg-red-500/20 text-red-400"
                                : category.percentage > 75
                                  ? "bg-amber-500/20 text-amber-400"
                                  : "bg-green-500/20 text-green-400"
                            }
                          >
                            {category.percentage.toFixed(1)}%
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Spent</span>
                            <span>₱{category.spent.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Budget</span>
                            <span>₱{category.budgeted.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Remaining</span>
                            <span className="text-green-500">₱{category.remaining.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Last Month</span>
                            <span>₱{category.lastMonth.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="categories">
            <Card className="bg-slate-800/60 border-slate-700 text-white">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Expense Categories</CardTitle>
                  <CardDescription className="text-gray-300">Manage expense categories and budgets</CardDescription>
                </div>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Category
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {expenseCategories.map((category) => (
                    <div key={category.id} className="rounded-lg border border-slate-700 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-medium">{category.name}</h3>
                          <p className="text-sm text-gray-400">
                            Trend: {category.trend} | Last updated: September 1, 2023
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-slate-600 text-white hover:bg-slate-700"
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

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                        <div>
                          <p className="text-sm text-gray-400">Budget</p>
                          <p className="text-xl font-bold">₱{category.budgeted.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Spent</p>
                          <p className="text-xl font-bold">₱{category.spent.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Remaining</p>
                          <p className="text-xl font-bold text-green-500">₱{category.remaining.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Utilization</p>
                          <p
                            className={`text-xl font-bold ${
                              category.percentage > 90
                                ? "text-red-500"
                                : category.percentage > 75
                                  ? "text-amber-500"
                                  : "text-green-500"
                            }`}
                          >
                            {category.percentage.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Monthly Avg</p>
                          <p className="text-xl font-bold">₱{Math.round(category.spent / 8).toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="mb-2 flex justify-between">
                          <span className="text-sm text-gray-400">Budget Progress</span>
                          <span className="text-sm">{category.percentage.toFixed(1)}%</span>
                        </div>
                        <div className="h-3 w-full rounded-full bg-slate-600">
                          <div
                            className={`h-3 rounded-full ${
                              category.percentage > 90
                                ? "bg-red-500"
                                : category.percentage > 75
                                  ? "bg-amber-500"
                                  : "bg-green-500"
                            }`}
                            style={{ width: `${Math.min(category.percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses">
            <Card className="bg-slate-800/60 border-slate-700 text-white">
              <CardHeader>
                <CardTitle>Recent Expenses</CardTitle>
                <CardDescription className="text-gray-300">Track and manage expense transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search expenses..."
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
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-[180px] bg-slate-700 border-slate-600">
                        <div className="flex items-center">
                          <Filter className="mr-2 h-4 w-4 text-gray-400" />
                          <span className="truncate">Category</span>
                        </div>
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600 text-white">
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="Utilities">Utilities</SelectItem>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                        <SelectItem value="Maintenance & Repairs">Maintenance & Repairs</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-700">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-700 bg-slate-900/50 text-left text-sm font-medium text-gray-300">
                          <th className="px-6 py-3">Expense ID</th>
                          <th className="px-6 py-3">Date</th>
                          <th className="px-6 py-3">Vendor</th>
                          <th className="px-6 py-3">Category</th>
                          <th className="px-6 py-3">Description</th>
                          <th className="px-6 py-3">Amount</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3">Receipt</th>
                          <th className="px-6 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        {filteredExpenses.map((expense) => (
                          <tr key={expense.id} className="text-sm">
                            <td className="whitespace-nowrap px-6 py-4 font-medium">{expense.id}</td>
                            <td className="whitespace-nowrap px-6 py-4">{expense.date}</td>
                            <td className="px-6 py-4">{expense.vendor}</td>
                            <td className="px-6 py-4">{expense.category}</td>
                            <td className="px-6 py-4">{expense.description}</td>
                            <td className="whitespace-nowrap px-6 py-4">₱{expense.amount.toLocaleString()}</td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <Badge
                                variant={
                                  expense.status === "approved"
                                    ? "default"
                                    : expense.status === "pending"
                                      ? "secondary"
                                      : "destructive"
                                }
                                className={
                                  expense.status === "approved"
                                    ? "bg-green-500/20 text-green-400"
                                    : expense.status === "pending"
                                      ? "bg-amber-500/20 text-amber-400"
                                      : "bg-red-500/20 text-red-400"
                                }
                              >
                                {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                              </Badge>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              {expense.receipt ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                              )}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-slate-600 text-white hover:bg-slate-700"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {expense.status === "pending" && (
                                  <>
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-red-600 text-red-400 hover:bg-red-600/20"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Card className="bg-slate-800/60 border-slate-700 text-white">
                  <CardHeader>
                    <CardTitle>Expense Trends</CardTitle>
                    <CardDescription className="text-gray-300">Monthly spending patterns</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Average Monthly</span>
                      <span className="font-medium">₱968,750</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Highest Month</span>
                      <span className="font-medium text-red-500">₱1.15M (Aug)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Lowest Month</span>
                      <span className="font-medium text-green-500">₱850K (Jan)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Growth Rate</span>
                      <span className="font-medium text-amber-500">+8.2%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/60 border-slate-700 text-white">
                  <CardHeader>
                    <CardTitle>Top Vendors</CardTitle>
                    <CardDescription className="text-gray-300">Highest spending vendors</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">ABC Utilities Corp</span>
                      <span className="font-medium">₱680K</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tech Solutions Inc</span>
                      <span className="font-medium">₱520K</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Maintenance Co</span>
                      <span className="font-medium">₱380K</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Office Depot</span>
                      <span className="font-medium">₱165K</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Marketing Agency</span>
                      <span className="font-medium">₱180K</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/60 border-slate-700 text-white">
                  <CardHeader>
                    <CardTitle>Expense Insights</CardTitle>
                    <CardDescription className="text-gray-300">Key observations</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Alert className="bg-green-500/20 border-green-500/50 text-green-200">
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Technology expenses decreased 15% this quarter
                      </AlertDescription>
                    </Alert>
                    <Alert className="bg-amber-500/20 border-amber-500/50 text-amber-200">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Utility costs increased 12% due to summer usage
                      </AlertDescription>
                    </Alert>
                    <Alert className="bg-blue-500/20 border-blue-500/50 text-blue-200">
                      <FileText className="h-4 w-4" />
                      <AlertDescription className="text-xs">95% of expenses have proper documentation</AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-slate-800/60 border-slate-700 text-white">
                <CardHeader>
                  <CardTitle>Expense Forecast</CardTitle>
                  <CardDescription className="text-gray-300">Projected expenses for next quarter</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Category Projections</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Salaries & Benefits</span>
                          <span className="font-medium">₱1.8M</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Technology</span>
                          <span className="font-medium">₱350K</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Utilities</span>
                          <span className="font-medium">₱280K</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Maintenance</span>
                          <span className="font-medium">₱120K</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Other</span>
                          <span className="font-medium">₱200K</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Risk Factors</h3>
                      <div className="space-y-3 text-sm">
                        <div className="rounded-lg bg-red-500/20 p-3">
                          <p className="font-medium text-red-400">High Risk</p>
                          <p className="text-gray-300">Utility costs may spike 20% in winter</p>
                        </div>
                        <div className="rounded-lg bg-amber-500/20 p-3">
                          <p className="font-medium text-amber-400">Medium Risk</p>
                          <p className="text-gray-300">Technology refresh cycle due Q4</p>
                        </div>
                        <div className="rounded-lg bg-green-500/20 p-3">
                          <p className="font-medium text-green-400">Low Risk</p>
                          <p className="text-gray-300">Office supplies well controlled</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Add Expense Modal */}
        {isAddingExpense && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="bg-slate-800 border-slate-700 text-white w-full max-w-2xl mx-4">
              <CardHeader>
                <CardTitle>Add New Expense</CardTitle>
                <CardDescription className="text-gray-300">Enter expense details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="vendor">Vendor</Label>
                    <Input id="vendor" className="bg-slate-700 border-slate-600" />
                  </div>
                  <div>
                    <Label htmlFor="amount">Amount</Label>
                    <Input id="amount" type="number" className="bg-slate-700 border-slate-600" />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select>
                      <SelectTrigger id="category" className="bg-slate-700 border-slate-600">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600 text-white">
                        <SelectItem value="utilities">Utilities</SelectItem>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="supplies">Office Supplies</SelectItem>
                        <SelectItem value="maintenance">Maintenance & Repairs</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" type="date" className="bg-slate-700 border-slate-600" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" className="bg-slate-700 border-slate-600" />
                </div>
                <div>
                  <Label htmlFor="receipt">Receipt</Label>
                  <Input id="receipt" type="file" className="bg-slate-700 border-slate-600" />
                </div>
              </CardContent>
              <div className="flex justify-end space-x-2 p-6">
                <Button
                  variant="outline"
                  className="border-slate-600 text-white hover:bg-slate-700"
                  onClick={() => setIsAddingExpense(false)}
                >
                  Cancel
                </Button>
                <Button className="bg-primary hover:bg-primary/90" onClick={() => setIsAddingExpense(false)}>
                  Add Expense
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
