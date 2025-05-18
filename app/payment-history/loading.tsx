import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default function PaymentHistoryLoading() {
    return (
        <DashboardLayout>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <div className="h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                    <div className="mt-2 h-4 w-96 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
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
                                {[...Array(5)].map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-6 py-4">
                                            <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="h-4 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"></div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
