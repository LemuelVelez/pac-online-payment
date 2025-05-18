import { CalendarIcon, FileText } from "lucide-react"
import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

// Mock payment history data
const paymentHistory = [
  {
    id: "PAY-123456",
    date: "2023-05-15",
    description: "Tuition Fee - 1st Semester",
    amount: 1500.0,
    status: "Completed",
  },
  {
    id: "PAY-123457",
    date: "2023-06-10",
    description: "Library Fee",
    amount: 500.0,
    status: "Completed",
  },
  {
    id: "PAY-123458",
    date: "2023-07-05",
    description: "Laboratory Fee",
    amount: 800.0,
    status: "Completed",
  },
]

export default function PaymentHistoryPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Payment History</h1>
          <p className="text-gray-600 dark:text-gray-400">View all your previous payments and download receipts</p>
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
                  <th className="px-6 py-3">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paymentHistory.map((payment) => (
                  <tr key={payment.id} className="text-sm text-gray-900 dark:text-gray-200">
                    <td className="whitespace-nowrap px-6 py-4 font-medium">{payment.id}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <CalendarIcon className="mr-2 size-4 text-gray-400" />
                        {payment.date}
                      </div>
                    </td>
                    <td className="px-6 py-4">{payment.description}</td>
                    <td className="whitespace-nowrap px-6 py-4 font-medium">₱{payment.amount.toFixed(2)}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-500">
                        {payment.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <button className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                        <FileText className="mr-1 size-4" />
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Link href="/dashboard" className="btn btn-outline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </DashboardLayout>
  )
}
