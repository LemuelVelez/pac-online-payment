"use client"

import { useState } from "react"
import { ArrowRight, CheckCircle, Loader2 } from "lucide-react"
import Link from "next/link"

interface PaymentRedirectProps {
    amount: number
    description: string
    studentId: string
    referenceNumber: string
}

export function PaymentRedirect({ amount, description, studentId, referenceNumber }: PaymentRedirectProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    const handlePayment = () => {
        setIsLoading(true)

        // Simulate payment processing
        setTimeout(() => {
            setIsLoading(false)
            setIsSuccess(true)
        }, 2000)

        // In a real implementation, this would redirect to Paymongo's checkout URL
        // window.location.href = `https://checkout.paymongo.com/checkout?id=${checkoutSessionId}`;
    }

    if (isSuccess) {
        return (
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                    <CheckCircle className="size-8 text-green-600 dark:text-green-500" />
                </div>
                <h3 className="text-xl font-semibold">Payment Successful!</h3>
                <p className="text-gray-600 dark:text-gray-400">
                    Your payment of ₱{amount.toFixed(2)} has been processed successfully.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">Reference Number: {referenceNumber}</p>
                <div className="mt-4 flex space-x-4">
                    <Link href="/payment-history" className="btn btn-outline">
                        View Payment History
                    </Link>
                    <Link href="/dashboard" className="btn btn-primary">
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50">
                <div className="flex flex-col space-y-2">
                    <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Amount</span>
                        <span className="font-medium">₱{amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Description</span>
                        <span className="font-medium">{description}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Student ID</span>
                        <span className="font-medium">{studentId}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Reference Number</span>
                        <span className="font-medium">{referenceNumber}</span>
                    </div>
                </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50">
                <h3 className="mb-2 font-medium">Payment Information</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    You will be redirected to a secure payment page to complete your transaction. The following payment methods
                    are accepted:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
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

            <button onClick={handlePayment} disabled={isLoading} className="btn btn-primary w-full">
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Preparing Secure Checkout...
                    </>
                ) : (
                    <>
                        Proceed to Secure Checkout
                        <ArrowRight className="ml-2 size-4" />
                    </>
                )}
            </button>
        </div>
    )
}
