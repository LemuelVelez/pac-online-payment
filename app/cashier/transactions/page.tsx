"use client"

import { useState } from "react"
import { CashierLayout } from "@/components/layout/cashier-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { PaymentReceipt } from "@/components/payment/payment-receipt"
import { DateRangePicker } from "@/components/admin/date-range-picker"
import { Search, Download, Filter, Eye } from "lucide-react"

// Mock data for transactions
const transactionsData = [
    {
        id: "PAY-123458",
        date: "2023-09-01",
        time: "2:30 PM",
        studentId: "2023-0001",
        studentName: "John Smith",
        course: "BS Computer Science",
        feeType: "Tuition Fee",
        amount: 15000,
        paymentMethod: "Credit Card",
        status: "Completed",
        cashier: "Maria Garcia",
    },
    {
        id: "PAY-123457",
        date: "2023-09-01",
        time: "1:45 PM",
        studentId: "2023-0002",
        studentName: "Sarah Williams",
        course: "BS Information Technology",
        feeType: "Laboratory Fee",
        amount: 5000,
        paymentMethod: "E-Wallet",
        status: "Completed",
        cashier: "Maria Garcia",
    },
    {
        id: "PAY-123456",
        date: "2023-09-01",
        time: "11:20 AM",
        studentId: "2023-0003",
        studentName: "David Brown",
        course: "BS Electronics Engineering",
        feeType: "Tuition Fee",
        amount: 12000,
        paymentMethod: "Bank Transfer",
        status: "Completed",
        cashier: "Maria Garcia",
    },
    {
        id: "PAY-123455",
        date: "2023-09-01",
        time: "10:15 AM",
        studentId: "2023-0004",
        studentName: "Michael Miller",
        course: "BS Business Administration",
        feeType: "Tuition Fee",
        amount: 8000,
        paymentMethod: "Credit Card",
        status: "Completed",
        cashier: "Maria Garcia",
    },
    {
        id: "PAY-123454",
        date: "2023-09-01",
        time: "9:30 AM",
        studentId: "2023-0005",
        studentName: "Jennifer Davis",
        course: "BS Education",
        feeType: "Library Fee",
        amount: 1500,
        paymentMethod: "E-Wallet",
        status: "Completed",
        cashier: "Maria Garcia",
    },
    {
        id: "PAY-123453",
        date: "2023-08-31",
        time: "4:45 PM",
        studentId: "2023-0006",
        studentName: "James Moore",
        course: "BS Computer Science",
        feeType: "Miscellaneous Fee",
        amount: 3500,
        paymentMethod: "Credit Card",
        status: "Completed",
        cashier: "Maria Garcia",
    },
    {
        id: "PAY-123452",
        date: "2023-08-31",
        time: "3:20 PM",
        studentId: "2023-0007",
        studentName: "Patricia Taylor",
        course: "BS Information Technology",
        feeType: "Tuition Fee",
        amount: 10000,
        paymentMethod: "Bank Transfer",
        status: "Completed",
        cashier: "Maria Garcia",
    },
    {
        id: "PAY-123451",
        date: "2023-08-31",
        time: "2:15 PM",
        studentId: "2023-0008",
        studentName: "Robert Johnson",
        course: "BS Electronics Engineering",
        feeType: "Laboratory Fee",
        amount: 5000,
        paymentMethod: "E-Wallet",
        status: "Failed",
        cashier: "Maria Garcia",
    },
]

export default function CashierTransactionsPage() {
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [paymentMethodFilter, setPaymentMethodFilter] = useState("all")
    const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false)
    const [selectedTransaction, setSelectedTransaction] = useState<(typeof transactionsData)[0] | null>(null)

    // Filter transactions based on search term and filters
    const filteredTransactions = transactionsData.filter((transaction) => {
        const matchesSearch =
            transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.studentId.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = statusFilter === "all" || transaction.status.toLowerCase() === statusFilter.toLowerCase()
        const matchesPaymentMethod =
            paymentMethodFilter === "all" || transaction.paymentMethod.toLowerCase().replace(" ", "-") === paymentMethodFilter

        return matchesSearch && matchesStatus && matchesPaymentMethod
    })

    const handleViewReceipt = (transaction: (typeof transactionsData)[0]) => {
        setSelectedTransaction(transaction)
        setIsReceiptDialogOpen(true)
    }

    return (
        <CashierLayout>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Transaction History</h1>
                        <p className="text-gray-300">View and manage all payment transactions</p>
                    </div>
                    <div className="mt-4 flex space-x-3 md:mt-0">
                        <DateRangePicker />
                        <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="all" className="w-full">
                    <TabsList className="bg-slate-800 border-slate-700 mb-8 grid w-full grid-cols-3 lg:max-w-[600px]">
                        <TabsTrigger value="all" className="cursor-pointer">
                            All Transactions
                        </TabsTrigger>
                        <TabsTrigger value="today" className="cursor-pointer">
                            Today
                        </TabsTrigger>
                        <TabsTrigger value="my-transactions" className="cursor-pointer">
                            My Transactions
                        </TabsTrigger>
                    </TabsList>

                    <Card className="bg-slate-800/60 border-slate-700 text-white mb-6">
                        <CardContent className="p-6">
                            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search by ID, student name..."
                                        className="pl-10 bg-slate-700 border-slate-600"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex space-x-4">
                                    <div className="w-[150px]">
                                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                                            <SelectTrigger className="bg-slate-700 border-slate-600">
                                                <div className="flex items-center">
                                                    <Filter className="mr-2 h-4 w-4 text-gray-400" />
                                                    <span className="truncate">Status</span>
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                                <SelectItem value="all">All Status</SelectItem>
                                                <SelectItem value="completed">Completed</SelectItem>
                                                <SelectItem value="failed">Failed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="w-[180px]">
                                        <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                                            <SelectTrigger className="bg-slate-700 border-slate-600">
                                                <div className="flex items-center">
                                                    <Filter className="mr-2 h-4 w-4 text-gray-400" />
                                                    <span className="truncate">Payment Method</span>
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                                <SelectItem value="all">All Methods</SelectItem>
                                                <SelectItem value="credit-card">Credit Card</SelectItem>
                                                <SelectItem value="e-wallet">E-Wallet</SelectItem>
                                                <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <TabsContent value="all">
                        <Card className="bg-slate-800/60 border-slate-700 text-white">
                            <CardHeader>
                                <CardTitle>All Transactions</CardTitle>
                                <CardDescription className="text-gray-300">
                                    Showing {filteredTransactions.length} transactions
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-lg border border-slate-700">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-slate-700 bg-slate-900/50 text-left text-sm font-medium text-gray-300">
                                                    <th className="px-6 py-3">Reference ID</th>
                                                    <th className="px-6 py-3">Date & Time</th>
                                                    <th className="px-6 py-3">Student</th>
                                                    <th className="px-6 py-3">Fee Type</th>
                                                    <th className="px-6 py-3">Amount</th>
                                                    <th className="px-6 py-3">Payment Method</th>
                                                    <th className="px-6 py-3">Status</th>
                                                    <th className="px-6 py-3">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-700">
                                                {filteredTransactions.map((transaction) => (
                                                    <tr key={transaction.id} className="text-sm">
                                                        <td className="whitespace-nowrap px-6 py-4 font-medium">{transaction.id}</td>
                                                        <td className="whitespace-nowrap px-6 py-4">
                                                            {transaction.date} {transaction.time}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div>
                                                                <p className="font-medium">{transaction.studentName}</p>
                                                                <p className="text-xs text-gray-400">{transaction.studentId}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">{transaction.feeType}</td>
                                                        <td className="whitespace-nowrap px-6 py-4">₱{transaction.amount.toLocaleString()}</td>
                                                        <td className="px-6 py-4">{transaction.paymentMethod}</td>
                                                        <td className="whitespace-nowrap px-6 py-4">
                                                            {transaction.status === "Completed" ? (
                                                                <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-500">
                                                                    Completed
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-500">
                                                                    Failed
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-slate-600 text-white hover:bg-slate-700"
                                                                onClick={() => handleViewReceipt(transaction)}
                                                            >
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View
                                                            </Button>
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

                    <TabsContent value="today">
                        <Card className="bg-slate-800/60 border-slate-700 text-white">
                            <CardHeader>
                                <CardTitle>Today's Transactions</CardTitle>
                                <CardDescription className="text-gray-300">Transactions processed today</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-lg border border-slate-700">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-slate-700 bg-slate-900/50 text-left text-sm font-medium text-gray-300">
                                                    <th className="px-6 py-3">Reference ID</th>
                                                    <th className="px-6 py-3">Time</th>
                                                    <th className="px-6 py-3">Student</th>
                                                    <th className="px-6 py-3">Fee Type</th>
                                                    <th className="px-6 py-3">Amount</th>
                                                    <th className="px-6 py-3">Payment Method</th>
                                                    <th className="px-6 py-3">Status</th>
                                                    <th className="px-6 py-3">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-700">
                                                {filteredTransactions
                                                    .filter((t) => t.date === "2023-09-01")
                                                    .map((transaction) => (
                                                        <tr key={transaction.id} className="text-sm">
                                                            <td className="whitespace-nowrap px-6 py-4 font-medium">{transaction.id}</td>
                                                            <td className="whitespace-nowrap px-6 py-4">{transaction.time}</td>
                                                            <td className="px-6 py-4">
                                                                <div>
                                                                    <p className="font-medium">{transaction.studentName}</p>
                                                                    <p className="text-xs text-gray-400">{transaction.studentId}</p>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">{transaction.feeType}</td>
                                                            <td className="whitespace-nowrap px-6 py-4">₱{transaction.amount.toLocaleString()}</td>
                                                            <td className="px-6 py-4">{transaction.paymentMethod}</td>
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
                                                                    onClick={() => handleViewReceipt(transaction)}
                                                                >
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    View
                                                                </Button>
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

                    <TabsContent value="my-transactions">
                        <Card className="bg-slate-800/60 border-slate-700 text-white">
                            <CardHeader>
                                <CardTitle>My Transactions</CardTitle>
                                <CardDescription className="text-gray-300">Transactions processed by you</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                                    <Card className="bg-slate-700/50 border-slate-600">
                                        <CardContent className="p-4">
                                            <p className="text-sm text-gray-400">Total Transactions</p>
                                            <p className="text-2xl font-bold">{transactionsData.length}</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-slate-700/50 border-slate-600">
                                        <CardContent className="p-4">
                                            <p className="text-sm text-gray-400">Total Amount</p>
                                            <p className="text-2xl font-bold">
                                                ₱{transactionsData.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                                            </p>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-slate-700/50 border-slate-600">
                                        <CardContent className="p-4">
                                            <p className="text-sm text-gray-400">Successful</p>
                                            <p className="text-2xl font-bold text-green-500">
                                                {transactionsData.filter((t) => t.status === "Completed").length}
                                            </p>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-slate-700/50 border-slate-600">
                                        <CardContent className="p-4">
                                            <p className="text-sm text-gray-400">Failed</p>
                                            <p className="text-2xl font-bold text-red-500">
                                                {transactionsData.filter((t) => t.status === "Failed").length}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="rounded-lg border border-slate-700">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-slate-700 bg-slate-900/50 text-left text-sm font-medium text-gray-300">
                                                    <th className="px-6 py-3">Reference ID</th>
                                                    <th className="px-6 py-3">Date & Time</th>
                                                    <th className="px-6 py-3">Student</th>
                                                    <th className="px-6 py-3">Fee Type</th>
                                                    <th className="px-6 py-3">Amount</th>
                                                    <th className="px-6 py-3">Payment Method</th>
                                                    <th className="px-6 py-3">Status</th>
                                                    <th className="px-6 py-3">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-700">
                                                {filteredTransactions.map((transaction) => (
                                                    <tr key={transaction.id} className="text-sm">
                                                        <td className="whitespace-nowrap px-6 py-4 font-medium">{transaction.id}</td>
                                                        <td className="whitespace-nowrap px-6 py-4">
                                                            {transaction.date} {transaction.time}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div>
                                                                <p className="font-medium">{transaction.studentName}</p>
                                                                <p className="text-xs text-gray-400">{transaction.studentId}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">{transaction.feeType}</td>
                                                        <td className="whitespace-nowrap px-6 py-4">₱{transaction.amount.toLocaleString()}</td>
                                                        <td className="px-6 py-4">{transaction.paymentMethod}</td>
                                                        <td className="whitespace-nowrap px-6 py-4">
                                                            {transaction.status === "Completed" ? (
                                                                <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-500">
                                                                    Completed
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-500">
                                                                    Failed
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-slate-600 text-white hover:bg-slate-700"
                                                                onClick={() => handleViewReceipt(transaction)}
                                                            >
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View
                                                            </Button>
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
                </Tabs>

                {/* Receipt Dialog */}
                <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
                    <DialogContent className="bg-white sm:max-w-[600px]">
                        {selectedTransaction && (
                            <PaymentReceipt
                                receiptNumber={selectedTransaction.id}
                                date={selectedTransaction.date}
                                studentId={selectedTransaction.studentId}
                                studentName={selectedTransaction.studentName}
                                paymentMethod={selectedTransaction.paymentMethod}
                                items={[
                                    {
                                        description: selectedTransaction.feeType,
                                        amount: `₱${selectedTransaction.amount.toLocaleString()}`,
                                    },
                                ]}
                                total={`₱${selectedTransaction.amount.toLocaleString()}`}
                            />
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </CashierLayout>
    )
}
