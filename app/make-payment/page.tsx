"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PaymentRedirect } from "@/components/payment/payment-redirect"

export default function MakePaymentPage() {
    // In a real app, this would come from a form submission or query parameters
    const paymentDetails = {
        amount: 1500.0,
        description: "Tuition Fee - 1st Semester",
        studentId: "2023-12345",
        referenceNumber: "PAC-" + Math.random().toString(36).substring(2, 10).toUpperCase(),
    }

    return (
        <DashboardLayout>
            <div className="mx-auto px-4 py-8">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold">Complete Your Payment</h1>
                    <p className="text-gray-600 dark:text-gray-400">Review your payment details before proceeding</p>
                </div>

                <div className="card">
                    <PaymentRedirect
                        amount={paymentDetails.amount}
                        description={paymentDetails.description}
                        studentId={paymentDetails.studentId}
                        referenceNumber={paymentDetails.referenceNumber}
                    />
                </div>
            </div>
        </DashboardLayout>
    )
}
