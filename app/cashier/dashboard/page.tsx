"use client"

import { useEffect, useMemo, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/dashboard/stat-card"
import { CreditCard, DollarSign, Receipt, Users, TrendingUp, Clock } from "lucide-react"
import { PaymentChart } from "@/components/dashboard/payment-chart"
import { TransactionItem } from "@/components/dashboard/transaction-item"
import { Button } from "@/components/ui/button"
import { listTodayPayments, paymentsToHourlySeries } from "@/lib/appwrite-cashier"
import type { PaymentDoc } from "@/lib/appwrite-payments"

type ChartPoint = { month: string; amount: number }

export default function CashierDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [today, setToday] = useState<PaymentDoc[]>([])

  useEffect(() => {
    ; (async () => {
      setLoading(true)
      try {
        const docs = await listTodayPayments()
        setToday(docs)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const totals = useMemo(() => {
    let collected = 0
    let count = 0
    let pending = 0
    const users = new Set<string>()
    for (const p of today) {
      users.add(p.userId)
      count++
      if (p.status === "Pending") pending++
      if (p.status === "Completed" || p.status === "Succeeded") {
        collected += Number(p.amount) || 0
      }
    }
    return { collected, count, pending, students: users.size }
  }, [today])

  // Map hourly series to the shape expected by <PaymentChart />
  const chartData = useMemo<ChartPoint[]>(
    () =>
      paymentsToHourlySeries(today).map((d) => ({
        month: d.label, // e.g. "09:00"
        amount: d.amount,
      })),
    [today]
  )

  return (
    <DashboardLayout allowedRoles={["cashier"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Cashier Dashboard</h1>
          <p className="text-gray-300">Process payments and manage transactions</p>
        </div>

        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Today's Collections"
            value={`₱${totals.collected.toLocaleString()}`}
            icon={DollarSign}
            iconColor="text-green-500"
            iconBgColor="bg-green-500/20"
            footer={
              <div className="flex items-center text-green-500 text-sm">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span>{totals.pending} pending</span>
              </div>
            }
          />
          <StatCard
            title="Transactions Today"
            value={String(totals.count)}
            icon={Receipt}
            iconColor="text-blue-500"
            iconBgColor="bg-blue-500/20"
            footer={<p className="text-gray-400 text-sm">{totals.pending} require verification</p>}
          />
          <StatCard
            title="Students Served"
            value={String(totals.students)}
            icon={Users}
            iconColor="text-purple-500"
            iconBgColor="bg-purple-500/20"
            footer={<p className="text-gray-400 text-sm">unique payers</p>}
          />
          <StatCard
            title="Avg. Processing Time"
            value="—"
            icon={Clock}
            iconColor="text-yellow-500"
            iconBgColor="bg-yellow-500/20"
            footer={<p className="text-gray-400 text-sm">coming soon</p>}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="bg-slate-800/60 border-slate-700 text-white">
            <CardHeader>
              <CardTitle>Today&apos;s Transaction Flow</CardTitle>
              <CardDescription className="text-gray-300">Hourly transaction amounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <PaymentChart data={chartData} />
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
                {loading ? (
                  <div className="text-gray-400">Loading…</div>
                ) : today.length === 0 ? (
                  <div className="text-gray-400">No transactions today.</div>
                ) : (
                  today.slice(0, 8).map((p) => (
                    <TransactionItem
                      key={p.$id}
                      icon={p.method === "credit-card" ? CreditCard : Receipt}
                      iconColor={p.status === "Completed" ? "text-green-500" : "text-blue-500"}
                      iconBgColor={p.status === "Completed" ? "bg-green-500/20" : "bg-blue-500/20"}
                      title={Array.isArray(p.fees) && p.fees.length ? `${p.fees.join(", ")} Fee` : "Payment"}
                      date={`${new Date(p.$createdAt).toLocaleString()}`}
                      amount={`₱${Number(p.amount || 0).toLocaleString()}`}
                      status={p.status}
                      statusColor={p.status === "Completed" ? "text-green-500 text-sm" : "text-blue-500 text-sm"}
                    />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
