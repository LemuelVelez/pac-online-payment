import { MainLayout } from "@/components/layout/main-layout"
import { SectionHeading } from "@/components/ui/section-heading"
import Link from "next/link"

export default function HelpPage() {
    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-12">
                <SectionHeading
                    title="Help & FAQs"
                    description="Quick answers to common questions. For more assistance, contact support."
                />

                <div id="faq" className="mt-6 space-y-4">
                    <details className="group bg-slate-800/60 border border-slate-700 rounded-lg p-4">
                        <summary className="cursor-pointer text-white font-medium select-none">
                            How do I pay my fees online?
                        </summary>
                        <p className="mt-2 text-gray-300">
                            Log in, choose the fee, pick a payment method (e.g., e-wallet or bank), and confirm. You’ll get a digital receipt.
                        </p>
                    </details>

                    <details className="group bg-slate-800/60 border border-slate-700 rounded-lg p-4">
                        <summary className="cursor-pointer text-white font-medium select-none">
                            Which payment methods are supported?
                        </summary>
                        <p className="mt-2 text-gray-300">
                            Popular e-wallets (e.g., GCash), bank cards, and bank transfers (as enabled by the school’s payment gateway).
                        </p>
                    </details>

                    <details className="group bg-slate-800/60 border border-slate-700 rounded-lg p-4">
                        <summary className="cursor-pointer text-white font-medium select-none">
                            Where can I see my payment history?
                        </summary>
                        <p className="mt-2 text-gray-300">
                            After logging in, open your dashboard and view the “Payments” or “History” section.
                        </p>
                    </details>
                </div>

                <div className="mt-8 text-gray-300">
                    Still need help?{" "}
                    <Link href="/contact" className="text-white underline underline-offset-4">
                        Contact Support
                    </Link>
                    .
                </div>
            </div>
        </MainLayout>
    )
}
