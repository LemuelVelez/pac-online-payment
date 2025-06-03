"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DateRangePicker } from "@/components/admin/date-range-picker"
import {
    Download,
    Upload,
    CheckCircle,
    AlertTriangle,
    XCircle,
    Search,
    RefreshCw,
    FileText,
    DollarSign,
    Clock,
} from "lucide-react"

// Mock data for reconciliation
const bankTransactions = [
    {
        id: "BT-001",
        date: "2023-09-01",
        description: "STUDENT PAYMENT - JOHN SMITH",
        amount: 15000,
        reference: "REF123456",
        status: "matched",
        matchedPayment: "PAY-2023-001",
    },
    {
        id: "BT-002",
        date: "2023-09-01",
        description: "STUDENT PAYMENT - SARAH WILLIAMS",
        amount: 5000,
        reference: "REF123457",
        status: "matched",
        matchedPayment: "PAY-2023-002",
    },
    {
        id: "BT-003",
        date: "2023-09-01",
        description: "BANK CHARGES",
        amount: -250,
        reference: "CHG001",
        status: "unmatched",
        matchedPayment: null,
    },
    {
        id: "BT-004",
        date: "2023-08-31",
        description: "STUDENT PAYMENT - DAVID BROWN",
        amount: 12000,
        reference: "REF123458",
        status: "matched",
        matchedPayment: "PAY-2023-003",
    },
    {
        id: "BT-005",
        date: "2023-08-31",
        description: "UNKNOWN DEPOSIT",
        amount: 8500,
        reference: "UNK001",
        status: "unmatched",
        matchedPayment: null,
    },
]

const systemPayments = [
    {
        id: "PAY-2023-001",
        date: "2023-09-01",
        studentId: "2023-0001",
        studentName: "John Smith",
        amount: 15000,
        paymentMethod: "Bank Transfer",
        status: "matched",
        matchedTransaction: "BT-001",
    },
    {
        id: "PAY-2023-002",
        date: "2023-09-01",
        studentId: "2023-0002",
        studentName: "Sarah Williams",
        amount: 5000,
        paymentMethod: "Bank Transfer",
        status: "matched",
        matchedTransaction: "BT-002",
    },
    {
        id: "PAY-2023-003",
        date: "2023-08-31",
        studentId: "2023-0003",
        studentName: "David Brown",
        amount: 12000,
        paymentMethod: "Bank Transfer",
        status: "matched",
        matchedTransaction: "BT-004",
    },
    {
        id: "PAY-2023-004",
        date: "2023-08-30",
        studentId: "2023-0004",
        studentName: "Michael Miller",
        amount: 8000,
        paymentMethod: "Bank Transfer",
        status: "unmatched",
        matchedTransaction: null,
    },
    {
        id: "PAY-2023-005",
        date: "2023-08-29",
        studentId: "2023-0005",
        studentName: "Jennifer Davis",
        amount: 1500,
        paymentMethod: "Bank Transfer",
        status: "unmatched",
        matchedTransaction: null,
    },
]

const reconciliationSummary = {
    totalBankTransactions: 45,
    totalSystemPayments: 42,
    matchedTransactions: 38,
    unmatchedBankTransactions: 7,
    unmatchedSystemPayments: 4,
    discrepancies: 3,
    totalBankAmount: 1250000,
    totalSystemAmount: 1235000,
    variance: -15000,
}

export default function ReconciliationPage() {
    const [selectedTab, setSelectedTab] = useState("overview")
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [selectedTransactions, setSelectedTransactions] = useState([])

    const handleSelectTransaction = (transactionId, checked) => {
        if (checked) {
            setSelectedTransactions([...selectedTransactions, transactionId])
        } else {
            setSelectedTransactions(selectedTransactions.filter((id) => id !== transactionId))
        }
    }

    const handleBulkMatch = () => {
        // Handle bulk matching logic
        console.log("Bulk matching transactions:", selectedTransactions)
    }

    return (
        <DashboardLayout allowedRoles={["business-office"]}>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Bank Reconciliation</h1>
                        <p className="text-gray-300">Reconcile bank statements with system payments</p>
                    </div>
                    <div className="mt-4 flex space-x-3 md:mt-0">
                        <DateRangePicker />
                        <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                            <Upload className="mr-2 h-4 w-4" />
                            Import Statement
                        </Button>
                        <Button className="bg-primary hover:bg-primary/90">
                            <Download className="mr-2 h-4 w-4" />
                            Export Report
                        </Button>
                    </div>
                </div>

                {/* Reconciliation Summary */}
                <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{reconciliationSummary.totalBankTransactions}</div>
                            <p className="text-xs text-gray-400 mt-1">
                                <FileText className="inline h-3 w-3 text-blue-500 mr-1" />
                                Bank transactions
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Matched</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-500">{reconciliationSummary.matchedTransactions}</div>
                            <p className="text-xs text-gray-400 mt-1">
                                <CheckCircle className="inline h-3 w-3 text-green-500 mr-1" />
                                {(
                                    (reconciliationSummary.matchedTransactions / reconciliationSummary.totalBankTransactions) *
                                    100
                                ).toFixed(1)}
                                % success rate
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Unmatched</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-500">{reconciliationSummary.unmatchedBankTransactions}</div>
                            <p className="text-xs text-gray-400 mt-1">
                                <AlertTriangle className="inline h-3 w-3 text-amber-500 mr-1" />
                                Require attention
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Variance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-500">
                                ₱{Math.abs(reconciliationSummary.variance).toLocaleString()}
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                                <DollarSign className="inline h-3 w-3 text-red-500 mr-1" />
                                Amount difference
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Reconciliation Alerts */}
                <div className="mb-8 space-y-4">
                    <Alert className="bg-amber-500/20 border-amber-500/50 text-amber-200">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            7 bank transactions and 4 system payments remain unmatched. Review and reconcile these items.
                        </AlertDescription>
                    </Alert>
                    {reconciliationSummary.variance !== 0 && (
                        <Alert className="bg-red-500/20 border-red-500/50 text-red-200">
                            <XCircle className="h-4 w-4" />
                            <AlertDescription>
                                Variance of ₱{Math.abs(reconciliationSummary.variance).toLocaleString()} detected between bank and
                                system records.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
                    <TabsList className="bg-slate-800 border-slate-700 mb-8 grid w-full grid-cols-4 lg:max-w-[600px]">
                        <TabsTrigger value="overview" className="cursor-pointer">
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="bank-transactions" className="cursor-pointer">
                            Bank Transactions
                        </TabsTrigger>
                        <TabsTrigger value="system-payments" className="cursor-pointer">
                            System Payments
                        </TabsTrigger>
                        <TabsTrigger value="matching" className="cursor-pointer">
                            Manual Matching
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview">
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                <Card className="bg-slate-800/60 border-slate-700 text-white">
                                    <CardHeader>
                                        <CardTitle>Reconciliation Status</CardTitle>
                                        <CardDescription className="text-gray-300">Current reconciliation progress</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <span className="text-gray-400">Matched Transactions</span>
                                                <span className="text-green-500">
                                                    {reconciliationSummary.matchedTransactions}/{reconciliationSummary.totalBankTransactions}
                                                </span>
                                            </div>
                                            <div className="h-3 w-full rounded-full bg-slate-600">
                                                <div
                                                    className="h-3 rounded-full bg-green-500"
                                                    style={{
                                                        width: `${(reconciliationSummary.matchedTransactions / reconciliationSummary.totalBankTransactions) * 100}%`,
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <span className="text-gray-400">Amount Reconciled</span>
                                                <span className="text-blue-500">
                                                    ₱
                                                    {(
                                                        (reconciliationSummary.totalBankAmount - Math.abs(reconciliationSummary.variance)) /
                                                        1000000
                                                    ).toFixed(1)}
                                                    M
                                                </span>
                                            </div>
                                            <div className="h-3 w-full rounded-full bg-slate-600">
                                                <div
                                                    className="h-3 rounded-full bg-blue-500"
                                                    style={{
                                                        width: `${((reconciliationSummary.totalBankAmount - Math.abs(reconciliationSummary.variance)) / reconciliationSummary.totalBankAmount) * 100}%`,
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-slate-800/60 border-slate-700 text-white">
                                    <CardHeader>
                                        <CardTitle>Quick Actions</CardTitle>
                                        <CardDescription className="text-gray-300">Common reconciliation tasks</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <Button className="w-full bg-primary hover:bg-primary/90">
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            Auto-Match Transactions
                                        </Button>
                                        <Button variant="outline" className="w-full border-slate-600 text-white hover:bg-slate-700">
                                            <Upload className="mr-2 h-4 w-4" />
                                            Import Bank Statement
                                        </Button>
                                        <Button variant="outline" className="w-full border-slate-600 text-white hover:bg-slate-700">
                                            <FileText className="mr-2 h-4 w-4" />
                                            Generate Reconciliation Report
                                        </Button>
                                        <Button variant="outline" className="w-full border-slate-600 text-white hover:bg-slate-700">
                                            <Clock className="mr-2 h-4 w-4" />
                                            Schedule Auto-Reconciliation
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Reconciliation Summary</CardTitle>
                                    <CardDescription className="text-gray-300">
                                        Detailed breakdown of reconciliation status
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-medium">Bank Statement</h3>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Total Transactions</span>
                                                    <span>{reconciliationSummary.totalBankTransactions}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Total Amount</span>
                                                    <span>₱{reconciliationSummary.totalBankAmount.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Matched</span>
                                                    <span className="text-green-500">{reconciliationSummary.matchedTransactions}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Unmatched</span>
                                                    <span className="text-amber-500">{reconciliationSummary.unmatchedBankTransactions}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-lg font-medium">System Payments</h3>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Total Payments</span>
                                                    <span>{reconciliationSummary.totalSystemPayments}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Total Amount</span>
                                                    <span>₱{reconciliationSummary.totalSystemAmount.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Matched</span>
                                                    <span className="text-green-500">{reconciliationSummary.matchedTransactions}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Unmatched</span>
                                                    <span className="text-amber-500">{reconciliationSummary.unmatchedSystemPayments}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-slate-700">
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg font-medium">Variance</span>
                                            <span
                                                className={`text-lg font-bold ${reconciliationSummary.variance === 0 ? "text-green-500" : "text-red-500"
                                                    }`}
                                            >
                                                {reconciliationSummary.variance === 0
                                                    ? "Balanced"
                                                    : `₱${Math.abs(reconciliationSummary.variance).toLocaleString()}`}
                                            </span>
                                        </div>
                                        {reconciliationSummary.variance !== 0 && (
                                            <p className="text-sm text-gray-400 mt-1">
                                                {reconciliationSummary.variance > 0
                                                    ? "Bank amount exceeds system amount"
                                                    : "System amount exceeds bank amount"}
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="bank-transactions">
                        <Card className="bg-slate-800/60 border-slate-700 text-white">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Bank Transactions</CardTitle>
                                    <CardDescription className="text-gray-300">Transactions from bank statement</CardDescription>
                                </div>
                                <div className="flex space-x-2">
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-[150px] bg-slate-700 border-slate-600">
                                            <SelectValue placeholder="Filter by status" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                            <SelectItem value="all">All Status</SelectItem>
                                            <SelectItem value="matched">Matched</SelectItem>
                                            <SelectItem value="unmatched">Unmatched</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            placeholder="Search transactions..."
                                            className="pl-10 bg-slate-700 border-slate-600"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="rounded-lg border border-slate-700">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-slate-700 bg-slate-900/50 text-left text-sm font-medium text-gray-300">
                                                    <th className="px-6 py-3">
                                                        <Checkbox />
                                                    </th>
                                                    <th className="px-6 py-3">Date</th>
                                                    <th className="px-6 py-3">Description</th>
                                                    <th className="px-6 py-3">Amount</th>
                                                    <th className="px-6 py-3">Reference</th>
                                                    <th className="px-6 py-3">Status</th>
                                                    <th className="px-6 py-3">Matched Payment</th>
                                                    <th className="px-6 py-3">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-700">
                                                {bankTransactions
                                                    .filter((transaction) => {
                                                        const matchesSearch = transaction.description
                                                            .toLowerCase()
                                                            .includes(searchTerm.toLowerCase())
                                                        const matchesStatus = statusFilter === "all" || transaction.status === statusFilter
                                                        return matchesSearch && matchesStatus
                                                    })
                                                    .map((transaction) => (
                                                        <tr key={transaction.id} className="text-sm">
                                                            <td className="px-6 py-4">
                                                                <Checkbox
                                                                    checked={selectedTransactions.includes(transaction.id)}
                                                                    onCheckedChange={(checked) => handleSelectTransaction(transaction.id, checked)}
                                                                />
                                                            </td>
                                                            <td className="whitespace-nowrap px-6 py-4">{transaction.date}</td>
                                                            <td className="px-6 py-4">{transaction.description}</td>
                                                            <td className="whitespace-nowrap px-6 py-4">
                                                                <span className={transaction.amount > 0 ? "text-green-500" : "text-red-500"}>
                                                                    ₱{Math.abs(transaction.amount).toLocaleString()}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">{transaction.reference}</td>
                                                            <td className="whitespace-nowrap px-6 py-4">
                                                                <Badge
                                                                    variant={transaction.status === "matched" ? "default" : "secondary"}
                                                                    className={
                                                                        transaction.status === "matched"
                                                                            ? "bg-green-500/20 text-green-400"
                                                                            : "bg-amber-500/20 text-amber-400"
                                                                    }
                                                                >
                                                                    {transaction.status === "matched" ? "Matched" : "Unmatched"}
                                                                </Badge>
                                                            </td>
                                                            <td className="px-6 py-4">{transaction.matchedPayment || "-"}</td>
                                                            <td className="whitespace-nowrap px-6 py-4">
                                                                {transaction.status === "unmatched" && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="border-slate-600 text-white hover:bg-slate-700"
                                                                    >
                                                                        Match
                                                                    </Button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {selectedTransactions.length > 0 && (
                                    <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-700/50 p-4">
                                        <span className="text-sm text-gray-300">{selectedTransactions.length} transaction(s) selected</span>
                                        <Button size="sm" onClick={handleBulkMatch} className="bg-primary hover:bg-primary/90">
                                            Bulk Match
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="system-payments">
                        <Card className="bg-slate-800/60 border-slate-700 text-white">
                            <CardHeader>
                                <CardTitle>System Payments</CardTitle>
                                <CardDescription className="text-gray-300">Payments recorded in the system</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            placeholder="Search payments..."
                                            className="pl-10 bg-slate-700 border-slate-600"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="rounded-lg border border-slate-700">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-slate-700 bg-slate-900/50 text-left text-sm font-medium text-gray-300">
                                                    <th className="px-6 py-3">Payment ID</th>
                                                    <th className="px-6 py-3">Date</th>
                                                    <th className="px-6 py-3">Student</th>
                                                    <th className="px-6 py-3">Amount</th>
                                                    <th className="px-6 py-3">Method</th>
                                                    <th className="px-6 py-3">Status</th>
                                                    <th className="px-6 py-3">Matched Transaction</th>
                                                    <th className="px-6 py-3">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-700">
                                                {systemPayments
                                                    .filter((payment) => {
                                                        const matchesSearch =
                                                            payment.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                            payment.id.toLowerCase().includes(searchTerm.toLowerCase())
                                                        const matchesStatus = statusFilter === "all" || payment.status === statusFilter
                                                        return matchesSearch && matchesStatus
                                                    })
                                                    .map((payment) => (
                                                        <tr key={payment.id} className="text-sm">
                                                            <td className="whitespace-nowrap px-6 py-4 font-medium">{payment.id}</td>
                                                            <td className="whitespace-nowrap px-6 py-4">{payment.date}</td>
                                                            <td className="px-6 py-4">
                                                                <div>
                                                                    <p className="font-medium">{payment.studentName}</p>
                                                                    <p className="text-xs text-gray-400">{payment.studentId}</p>
                                                                </div>
                                                            </td>
                                                            <td className="whitespace-nowrap px-6 py-4">₱{payment.amount.toLocaleString()}</td>
                                                            <td className="px-6 py-4">{payment.paymentMethod}</td>
                                                            <td className="whitespace-nowrap px-6 py-4">
                                                                <Badge
                                                                    variant={payment.status === "matched" ? "default" : "secondary"}
                                                                    className={
                                                                        payment.status === "matched"
                                                                            ? "bg-green-500/20 text-green-400"
                                                                            : "bg-amber-500/20 text-amber-400"
                                                                    }
                                                                >
                                                                    {payment.status === "matched" ? "Matched" : "Unmatched"}
                                                                </Badge>
                                                            </td>
                                                            <td className="px-6 py-4">{payment.matchedTransaction || "-"}</td>
                                                            <td className="whitespace-nowrap px-6 py-4">
                                                                {payment.status === "unmatched" && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="border-slate-600 text-white hover:bg-slate-700"
                                                                    >
                                                                        Match
                                                                    </Button>
                                                                )}
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

                    <TabsContent value="matching">
                        <div className="space-y-6">
                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Manual Matching</CardTitle>
                                    <CardDescription className="text-gray-300">
                                        Manually match unmatched transactions and payments
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                        <div>
                                            <h3 className="mb-4 text-lg font-medium">Unmatched Bank Transactions</h3>
                                            <div className="space-y-3">
                                                {bankTransactions
                                                    .filter((t) => t.status === "unmatched")
                                                    .map((transaction) => (
                                                        <div
                                                            key={transaction.id}
                                                            className="rounded-lg border border-slate-700 p-4 hover:bg-slate-700/50 cursor-pointer"
                                                        >
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <p className="font-medium">{transaction.description}</p>
                                                                    <p className="text-sm text-gray-400">{transaction.date}</p>
                                                                    <p className="text-sm text-gray-400">Ref: {transaction.reference}</p>
                                                                </div>
                                                                <span
                                                                    className={`font-bold ${transaction.amount > 0 ? "text-green-500" : "text-red-500"}`}
                                                                >
                                                                    ₱{Math.abs(transaction.amount).toLocaleString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="mb-4 text-lg font-medium">Unmatched System Payments</h3>
                                            <div className="space-y-3">
                                                {systemPayments
                                                    .filter((p) => p.status === "unmatched")
                                                    .map((payment) => (
                                                        <div
                                                            key={payment.id}
                                                            className="rounded-lg border border-slate-700 p-4 hover:bg-slate-700/50 cursor-pointer"
                                                        >
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <p className="font-medium">{payment.studentName}</p>
                                                                    <p className="text-sm text-gray-400">{payment.date}</p>
                                                                    <p className="text-sm text-gray-400">ID: {payment.id}</p>
                                                                </div>
                                                                <span className="font-bold text-green-500">₱{payment.amount.toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-slate-700">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-medium">Matching Rules</h3>
                                                <p className="text-sm text-gray-400">Configure automatic matching criteria</p>
                                            </div>
                                            <Button className="bg-primary hover:bg-primary/90">
                                                <RefreshCw className="mr-2 h-4 w-4" />
                                                Run Auto-Match
                                            </Button>
                                        </div>

                                        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                                            <div className="space-y-2">
                                                <Label htmlFor="amount-tolerance">Amount Tolerance</Label>
                                                <Input id="amount-tolerance" defaultValue="0.00" className="bg-slate-700 border-slate-600" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="date-range">Date Range (days)</Label>
                                                <Input id="date-range" defaultValue="3" className="bg-slate-700 border-slate-600" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="reference-matching">Reference Matching</Label>
                                                <Select defaultValue="exact">
                                                    <SelectTrigger className="bg-slate-700 border-slate-600">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                                        <SelectItem value="exact">Exact Match</SelectItem>
                                                        <SelectItem value="partial">Partial Match</SelectItem>
                                                        <SelectItem value="fuzzy">Fuzzy Match</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    )
}
