"use client"

import { useState } from "react"
import { CashierLayout } from "@/components/layout/cashier-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/dashboard/stat-card"
import { TransactionItem } from "@/components/dashboard/transaction-item"
import { PaymentChart } from "@/components/dashboard/payment-chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PaymentForm } from "@/components/payment/payment-form"
import { PaymentReceipt } from "@/components/payment/payment-receipt"
import { AlertCircle, Calendar, CreditCard, Download, FileText, Search, TrendingUp, Wallet, Clock } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Mock data for the dashboard
const dailyTransactions = [
  { month: "9 AM", amount: 5000 },
  { month: "10 AM", amount: 12000 },
  { month: "11 AM", amount: 8000 },
  { month: "12 PM", amount: 3000 },
  { month: "1 PM", amount: 7000 },
  { month: "2 PM", amount: 15000 },
  { month: "3 PM", amount: 10000 },
  { month: "4 PM", amount: 6000 },
  { month: "5 PM", amount: 0 },
]

export default function CashierDashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("today")
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false)

  return (
    <CashierLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Cashier Dashboard</h1>
            <p className="text-gray-300">Welcome back, Maria Garcia</p>
          </div>
          <div className="mt-4 flex space-x-3 md:mt-0">
            <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
              <Calendar className="mr-2 h-4 w-4" />
              Select Date
            </Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={() => setIsPaymentDialogOpen(true)}>
              <CreditCard className="mr-2 h-4 w-4" />
              Process Payment
            </Button>
          </div>
        </div>

        <Alert className="mb-8 bg-blue-500/20 border-blue-500/50 text-blue-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Today&apos;s collection target: ₱75,000. Current progress: ₱66,000 (88% achieved).
          </AlertDescription>
        </Alert>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <StatCard
            title="Today's Collections"
            value="₱66,000"
            icon={Wallet}
            iconColor="text-green-500"
            iconBgColor="bg-green-500/20"
          />
          <StatCard
            title="Transactions Today"
            value="24"
            icon={FileText}
            iconColor="text-blue-500"
            iconBgColor="bg-blue-500/20"
          />
          <StatCard
            title="Collection Rate"
            value="88%"
            icon={TrendingUp}
            iconColor="text-purple-500"
            iconBgColor="bg-purple-500/20"
          />
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="bg-slate-800/60 border-slate-700 text-white lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Transaction Overview</CardTitle>
                <CardDescription className="text-gray-300">Hourly transaction data</CardDescription>
              </div>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[150px] bg-slate-700 border-slate-600">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600 text-white">
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <PaymentChart data={dailyTransactions} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/60 border-slate-700 text-white">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription className="text-gray-300">Frequently used actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => setIsPaymentDialogOpen(true)}>
                <CreditCard className="mr-2 h-4 w-4" />
                Process New Payment
              </Button>
              <Button
                variant="outline"
                className="w-full border-slate-600 text-white hover:bg-slate-700"
                onClick={() => setIsReceiptDialogOpen(true)}
              >
                <FileText className="mr-2 h-4 w-4" />
                Generate Receipt
              </Button>
              <Button variant="outline" className="w-full border-slate-600 text-white hover:bg-slate-700">
                <Search className="mr-2 h-4 w-4" />
                Search Transactions
              </Button>
              <Button variant="outline" className="w-full border-slate-600 text-white hover:bg-slate-700">
                <Download className="mr-2 h-4 w-4" />
                Download Reports
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="bg-slate-800/60 border-slate-700 text-white lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription className="text-gray-300">Latest payment transactions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <TransactionItem
                icon={CreditCard}
                iconColor="text-blue-500"
                iconBgColor="bg-blue-500/20"
                title="Tuition Fee Payment"
                date="Today, 2:30 PM"
                amount="₱15,000"
                status="Completed"
                statusColor="text-green-500"
              />
              <TransactionItem
                icon={Wallet}
                iconColor="text-purple-500"
                iconBgColor="bg-purple-500/20"
                title="Laboratory Fee Payment"
                date="Today, 1:45 PM"
                amount="₱5,000"
                status="Completed"
                statusColor="text-green-500"
              />
              <TransactionItem
                icon={CreditCard}
                iconColor="text-blue-500"
                iconBgColor="bg-blue-500/20"
                title="Tuition Fee Payment"
                date="Today, 11:20 AM"
                amount="₱12,000"
                status="Completed"
                statusColor="text-green-500"
              />
              <TransactionItem
                icon={CreditCard}
                iconColor="text-blue-500"
                iconBgColor="bg-blue-500/20"
                title="Tuition Fee Payment"
                date="Today, 10:15 AM"
                amount="₱8,000"
                status="Completed"
                statusColor="text-green-500"
              />
              <TransactionItem
                icon={Wallet}
                iconColor="text-purple-500"
                iconBgColor="bg-purple-500/20"
                title="Library Fee Payment"
                date="Today, 9:30 AM"
                amount="₱1,500"
                status="Completed"
                statusColor="text-green-500"
              />
            </CardContent>
          </Card>

          <Card className="bg-slate-800/60 border-slate-700 text-white">
            <CardHeader>
              <CardTitle>Payment Queue</CardTitle>
              <CardDescription className="text-gray-300">Students waiting for payment processing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-slate-700/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-3 rounded-full bg-amber-500/20 p-2">
                      <Clock className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="font-medium">James Moore</p>
                      <p className="text-sm text-gray-400">Student ID: 2023-0006</p>
                    </div>
                  </div>
                  <Button size="sm" className="bg-primary hover:bg-primary/90">
                    Process
                  </Button>
                </div>
              </div>

              <div className="rounded-lg bg-slate-700/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-3 rounded-full bg-amber-500/20 p-2">
                      <Clock className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="font-medium">Patricia Taylor</p>
                      <p className="text-sm text-gray-400">Student ID: 2023-0007</p>
                    </div>
                  </div>
                  <Button size="sm" className="bg-primary hover:bg-primary/90">
                    Process
                  </Button>
                </div>
              </div>

              <div className="rounded-lg bg-slate-700/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-3 rounded-full bg-amber-500/20 p-2">
                      <Clock className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="font-medium">Robert Johnson</p>
                      <p className="text-sm text-gray-400">Student ID: 2023-0008</p>
                    </div>
                  </div>
                  <Button size="sm" className="bg-primary hover:bg-primary/90">
                    Process
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="bg-slate-800 border-slate-700 mb-8 grid w-full grid-cols-3 lg:max-w-[600px]">
              <TabsTrigger value="pending" className="cursor-pointer">
                Pending Payments
              </TabsTrigger>
              <TabsTrigger value="completed" className="cursor-pointer">
                Completed Today
              </TabsTrigger>
              <TabsTrigger value="search" className="cursor-pointer">
                Search
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <Card className="bg-slate-800/60 border-slate-700 text-white">
                <CardHeader>
                  <CardTitle>Pending Payments</CardTitle>
                  <CardDescription className="text-gray-300">Students with pending payment requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border border-slate-700">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-700 bg-slate-900/50 text-left text-sm font-medium text-gray-300">
                            <th className="px-6 py-3">Student ID</th>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">Course</th>
                            <th className="px-6 py-3">Fee Type</th>
                            <th className="px-6 py-3">Amount</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                          <tr className="text-sm">
                            <td className="whitespace-nowrap px-6 py-4 font-medium">2023-0006</td>
                            <td className="px-6 py-4">James Moore</td>
                            <td className="px-6 py-4">BS Computer Science</td>
                            <td className="px-6 py-4">Tuition Fee</td>
                            <td className="whitespace-nowrap px-6 py-4">₱20,000.00</td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-500">
                                Pending
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <Button size="sm" className="bg-primary hover:bg-primary/90">
                                Process
                              </Button>
                            </td>
                          </tr>
                          <tr className="text-sm">
                            <td className="whitespace-nowrap px-6 py-4 font-medium">2023-0007</td>
                            <td className="px-6 py-4">Patricia Taylor</td>
                            <td className="px-6 py-4">BS Information Technology</td>
                            <td className="px-6 py-4">Laboratory Fee</td>
                            <td className="whitespace-nowrap px-6 py-4">₱5,000.00</td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-500">
                                Pending
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <Button size="sm" className="bg-primary hover:bg-primary/90">
                                Process
                              </Button>
                            </td>
                          </tr>
                          <tr className="text-sm">
                            <td className="whitespace-nowrap px-6 py-4 font-medium">2023-0008</td>
                            <td className="px-6 py-4">Robert Johnson</td>
                            <td className="px-6 py-4">BS Electronics Engineering</td>
                            <td className="px-6 py-4">Tuition Fee</td>
                            <td className="whitespace-nowrap px-6 py-4">₱15,000.00</td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-500">
                                Pending
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <Button size="sm" className="bg-primary hover:bg-primary/90">
                                Process
                              </Button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="completed">
              <Card className="bg-slate-800/60 border-slate-700 text-white">
                <CardHeader>
                  <CardTitle>Completed Payments Today</CardTitle>
                  <CardDescription className="text-gray-300">Payments processed today</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border border-slate-700">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-700 bg-slate-900/50 text-left text-sm font-medium text-gray-300">
                            <th className="px-6 py-3">Reference ID</th>
                            <th className="px-6 py-3">Student ID</th>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">Fee Type</th>
                            <th className="px-6 py-3">Amount</th>
                            <th className="px-6 py-3">Time</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                          <tr className="text-sm">
                            <td className="whitespace-nowrap px-6 py-4 font-medium">PAY-123458</td>
                            <td className="whitespace-nowrap px-6 py-4">2023-0001</td>
                            <td className="px-6 py-4">John Smith</td>
                            <td className="px-6 py-4">Tuition Fee</td>
                            <td className="whitespace-nowrap px-6 py-4">₱15,000.00</td>
                            <td className="whitespace-nowrap px-6 py-4">2:30 PM</td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-500">
                                Completed
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-slate-600 text-white hover:bg-slate-700"
                                onClick={() => setIsReceiptDialogOpen(true)}
                              >
                                Receipt
                              </Button>
                            </td>
                          </tr>
                          <tr className="text-sm">
                            <td className="whitespace-nowrap px-6 py-4 font-medium">PAY-123457</td>
                            <td className="whitespace-nowrap px-6 py-4">2023-0002</td>
                            <td className="px-6 py-4">Sarah Williams</td>
                            <td className="px-6 py-4">Laboratory Fee</td>
                            <td className="whitespace-nowrap px-6 py-4">₱5,000.00</td>
                            <td className="whitespace-nowrap px-6 py-4">1:45 PM</td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-500">
                                Completed
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-slate-600 text-white hover:bg-slate-700"
                                onClick={() => setIsReceiptDialogOpen(true)}
                              >
                                Receipt
                              </Button>
                            </td>
                          </tr>
                          <tr className="text-sm">
                            <td className="whitespace-nowrap px-6 py-4 font-medium">PAY-123456</td>
                            <td className="whitespace-nowrap px-6 py-4">2023-0003</td>
                            <td className="px-6 py-4">David Brown</td>
                            <td className="px-6 py-4">Tuition Fee</td>
                            <td className="whitespace-nowrap px-6 py-4">₱12,000.00</td>
                            <td className="whitespace-nowrap px-6 py-4">11:20 AM</td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-500">
                                Completed
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-slate-600 text-white hover:bg-slate-700"
                                onClick={() => setIsReceiptDialogOpen(true)}
                              >
                                Receipt
                              </Button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="search">
              <Card className="bg-slate-800/60 border-slate-700 text-white">
                <CardHeader>
                  <CardTitle>Search Transactions</CardTitle>
                  <CardDescription className="text-gray-300">Search for specific transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor="search-id">Reference ID / Student ID</Label>
                      <Input id="search-id" placeholder="Enter ID" className="bg-slate-700 border-slate-600" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="search-name">Student Name</Label>
                      <Input id="search-name" placeholder="Enter name" className="bg-slate-700 border-slate-600" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="search-date">Date Range</Label>
                      <Input id="search-date" type="date" className="bg-slate-700 border-slate-600" />
                    </div>
                    <div className="flex items-end">
                      <Button className="w-full bg-primary hover:bg-primary/90">
                        <Search className="mr-2 h-4 w-4" />
                        Search
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-center p-8">
                    <div className="text-center">
                      <Search className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-lg font-medium">No Search Results</h3>
                      <p className="mt-1 text-gray-400">Enter search criteria above to find transactions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Process Payment Dialog */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Process Payment</DialogTitle>
              <DialogDescription className="text-gray-300">
                Enter payment details to process a new transaction
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="student-id">Student ID</Label>
                <Input id="student-id" placeholder="Enter student ID" className="bg-slate-700 border-slate-600" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fee-type">Fee Type</Label>
                <Select>
                  <SelectTrigger id="fee-type" className="bg-slate-700 border-slate-600">
                    <SelectValue placeholder="Select fee type" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600 text-white">
                    <SelectItem value="tuition">Tuition Fee</SelectItem>
                    <SelectItem value="laboratory">Laboratory Fee</SelectItem>
                    <SelectItem value="library">Library Fee</SelectItem>
                    <SelectItem value="miscellaneous">Miscellaneous Fee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₱)</Label>
                <Input id="amount" type="number" placeholder="Enter amount" className="bg-slate-700 border-slate-600" />
              </div>
              <PaymentForm
                amount="₱15,000.00"
                description="Tuition Fee Payment"
                onSuccess={() => {
                  setIsPaymentDialogOpen(false)
                  // Show success message or redirect
                }}
                onCancel={() => setIsPaymentDialogOpen(false)}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Receipt Dialog */}
        <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
          <DialogContent className="bg-white sm:max-w-[600px]">
            <PaymentReceipt
              receiptNumber="REC-123458"
              date="September 1, 2023"
              studentId="2023-0001"
              studentName="John Smith"
              paymentMethod="Credit Card"
              items={[{ description: "Tuition Fee", amount: "₱15,000.00" }]}
              total="₱15,000.00"
            />
          </DialogContent>
        </Dialog>
      </div>
    </CashierLayout>
  )
}
