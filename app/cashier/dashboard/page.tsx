"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/dashboard/stat-card"
import { CreditCard, DollarSign, Receipt, Users, TrendingUp, Clock } from "lucide-react"
import { PaymentChart } from "@/components/dashboard/payment-chart"
import { TransactionItem } from "@/components/dashboard/transaction-item"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function CashierDashboardPage() {
  // Mock data for daily transactions
  const dailyTransactions = [
    { month: "6AM", amount: 5000 },
    { month: "8AM", amount: 12000 },
    { month: "10AM", amount: 25000 },
    { month: "12PM", amount: 18000 },
    { month: "2PM", amount: 32000 },
    { month: "4PM", amount: 28000 },
    { month: "6PM", amount: 15000 },
    { month: "8PM", amount: 0 },
  ]

  // Recent transactions
  const recentTransactions = [
    {
      icon: CreditCard,
      iconColor: "text-green-500",
      iconBgColor: "bg-green-500/20",
      title: "Tuition Payment",
      date: "John Smith - 5 mins ago",
      amount: "₱25,000",
      status: "Completed",
      statusColor: "text-green-500 text-sm",
    },
    {
      icon: Receipt,
      iconColor: "text-blue-500",
      iconBgColor: "bg-blue-500/20",
      title: "Laboratory Fee",
      date: "Maria Garcia - 15 mins ago",
      amount: "₱5,000",
      status: "Processing",
      statusColor: "text-blue-500 text-sm",
    },
    {
      icon: CreditCard,
      iconColor: "text-green-500",
      iconBgColor: "bg-green-500/20",
      title: "Miscellaneous Fee",
      date: "Robert Chen - 1 hour ago",
      amount: "₱3,500",
      status: "Completed",
      statusColor: "text-green-500 text-sm",
    },
  ]

  return (
    <DashboardLayout allowedRoles={["cashier"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Cashier Dashboard</h1>
          <p className="text-gray-300">Process payments and manage transactions</p>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8 bg-slate-800/60 border-slate-700 text-white">
          <CardHeader>
            <CardTitle>Quick Payment Processing</CardTitle>
            <CardDescription className="text-gray-300">Process a new payment quickly</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="student-id">Student ID</Label>
                <Input id="student-id" placeholder="Enter student ID" className="bg-slate-700 border-slate-600" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₱)</Label>
                <Input id="amount" type="number" placeholder="Enter amount" className="bg-slate-700 border-slate-600" />
              </div>
              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Button className="w-full bg-primary hover:bg-primary/90">Process Payment</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Today's Collections"
            value="₱135,000"
            icon={DollarSign}
            iconColor="text-green-500"
            iconBgColor="bg-green-500/20"
            footer={
              <div className="flex items-center text-green-500 text-sm">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span>8% from yesterday</span>
              </div>
            }
          />
          <StatCard
            title="Transactions Today"
            value="47"
            icon={Receipt}
            iconColor="text-blue-500"
            iconBgColor="bg-blue-500/20"
            footer={<p className="text-gray-400 text-sm">12 pending</p>}
          />
          <StatCard
            title="Students Served"
            value="42"
            icon={Users}
            iconColor="text-purple-500"
            iconBgColor="bg-purple-500/20"
            footer={<p className="text-gray-400 text-sm">5 in queue</p>}
          />
          <StatCard
            title="Avg. Processing Time"
            value="3.5 min"
            icon={Clock}
            iconColor="text-yellow-500"
            iconBgColor="bg-yellow-500/20"
            footer={<p className="text-gray-400 text-sm">Target: 5 min</p>}
          />
        </div>

        {/* Charts and Recent Transactions */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="bg-slate-800/60 border-slate-700 text-white">
            <CardHeader>
              <CardTitle>Today&apos;s Transaction Flow</CardTitle>
              <CardDescription className="text-gray-300">Hourly transaction amounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <PaymentChart data={dailyTransactions} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/60 border-slate-700 text-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription className="text-gray-300">Latest payment activities</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="border-slate-600 text-white hover:bg-slate-700">
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.map((transaction, index) => (
                  <TransactionItem key={index} {...transaction} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
