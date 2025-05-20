import Link from "next/link"
import { ArrowRight, Calendar, CreditCard, FileText, PieChart, Wallet } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

// Mock data for the dashboard
const stats = [
    {
        title: "Total Payments",
        value: "₱2,800.00",
        change: "+12%",
        changeType: "positive",
        icon: PieChart,
    },
    {
        title: "Pending Payments",
        value: "₱1,500.00",
        change: "",
        changeType: "neutral",
        icon: Calendar,
    },
    {
        title: "Last Payment",
        value: "₱800.00",
        change: "Jul 05",
        changeType: "neutral",
        icon: CreditCard,
    },
]

const recentTransactions = [
    {
        id: "PAY-123458",
        date: "Jul 05, 2023",
        description: "Laboratory Fee",
        amount: 800.0,
        status: "Completed",
    },
    {
        id: "PAY-123457",
        date: "Jun 10, 2023",
        description: "Library Fee",
        amount: 500.0,
        status: "Completed",
    },
    {
        id: "PAY-123456",
        date: "May 15, 2023",
        description: "Tuition Fee - 1st Semester",
        amount: 1500.0,
        status: "Completed",
    },
]

export default function DashboardPage() {
    return (
        <DashboardLayout>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold">Payment Dashboard</h1>
                    <p className="text-gray-600 dark:text-gray-400">Manage your payments and view your payment history</p>
                </div>

                {/* Stats */}
                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {stats.map((stat) => (
                        <div key={stat.title} className="card">
                            <div className="flex items-center">
                                <div className="mr-4 rounded-lg bg-primary/10 p-3 dark:bg-primary/5">
                                    <stat.icon className="size-6 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                                    <div className="flex items-baseline">
                                        <p className="text-2xl font-semibold">{stat.value}</p>
                                        {stat.change && (
                                            <p
                                                className={`ml-2 text-sm ${stat.changeType === "positive"
                                                    ? "text-green-600 dark:text-green-500"
                                                    : stat.changeType === "negative"
                                                        ? "text-red-600 dark:text-red-500"
                                                        : "text-gray-500 dark:text-gray-400"
                                                    }`}
                                            >
                                                {stat.change}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="mb-8">
                    <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <Link href="/make-payment" className="card flex items-center transition-all hover:shadow-md">
                            <div className="mr-4 rounded-lg bg-primary/10 p-3 dark:bg-primary/5">
                                <Wallet className="size-6 text-primary" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-medium">Make a Payment</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Pay your fees securely online</p>
                            </div>
                            <ArrowRight className="size-5 text-gray-400" />
                        </Link>

                        <Link href="/payment-history" className="card flex items-center transition-all hover:shadow-md">
                            <div className="mr-4 rounded-lg bg-secondary/10 p-3 dark:bg-secondary/5">
                                <FileText className="size-6 text-primary" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-medium">Payment History</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">View all your past transactions</p>
                            </div>
                            <ArrowRight className="size-5 text-gray-400" />
                        </Link>
                    </div>
                </div>

                {/* Payment Information */}
                <div className="mb-8">
                    <h2 className="mb-4 text-xl font-semibold">Payment Information</h2>
                    <div className="card">
                        <h3 className="mb-2 font-medium">Secure Payment Processing</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            All payments are processed securely through our payment provider. When making a payment, you will be
                            redirected to a secure checkout page.
                        </p>
                        <div className="mt-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-900/50">
                            <h4 className="mb-2 font-medium">Accepted Payment Methods</h4>
                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                <li className="flex items-center">
                                    <span className="mr-2 inline-block size-1.5 rounded-full bg-gray-400"></span>
                                    Credit/Debit Cards (Visa, Mastercard)
                                </li>
                                <li className="flex items-center">
                                    <span className="mr-2 inline-block size-1.5 rounded-full bg-gray-400"></span>
                                    E-Wallets (GCash, Maya, GrabPay)
                                </li>
                                <li className="flex items-center">
                                    <span className="mr-2 inline-block size-1.5 rounded-full bg-gray-400"></span>
                                    Online Banking
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Recent Transactions */}
                <div>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Recent Transactions</h2>
                        <Link href="/payment-history" className="text-sm font-medium text-primary hover:underline">
                            View All
                        </Link>
                    </div>
                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50 text-left text-sm font-medium text-gray-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-400">
                                        <th className="px-6 py-3">Reference ID</th>
                                        <th className="px-6 py-3">Date</th>
                                        <th className="px-6 py-3">Description</th>
                                        <th className="px-6 py-3">Amount</th>
                                        <th className="px-6 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {recentTransactions.map((transaction) => (
                                        <tr key={transaction.id} className="text-sm text-gray-900 dark:text-gray-200">
                                            <td className="whitespace-nowrap px-6 py-4 font-medium">{transaction.id}</td>
                                            <td className="whitespace-nowrap px-6 py-4">{transaction.date}</td>
                                            <td className="px-6 py-4">{transaction.description}</td>
                                            <td className="whitespace-nowrap px-6 py-4 font-medium">₱{transaction.amount.toFixed(2)}</td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-500">
                                                    {transaction.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
