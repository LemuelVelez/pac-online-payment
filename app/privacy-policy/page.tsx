import { MainLayout } from "@/components/layout/main-layout"
import { SectionHeading } from "@/components/ui/section-heading"

export default function PrivacyPolicyPage() {
    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-12">
                <SectionHeading
                    title="Privacy Policy"
                    description="How we collect, use, and protect your information."
                />
                <div className="mt-6 space-y-6 text-gray-300">
                    <p className="text-sm">Last updated: {new Date().toLocaleDateString()}</p>

                    <section className="bg-slate-800/60 border border-slate-700 rounded-lg p-6">
                        <h3 className="text-white font-semibold mb-2">Information We Collect</h3>
                        <p>
                            We collect account details (name, email), payment references, and usage data to operate and improve the service.
                        </p>
                    </section>

                    <section className="bg-slate-800/60 border border-slate-700 rounded-lg p-6">
                        <h3 className="text-white font-semibold mb-2">How We Use Information</h3>
                        <p>
                            To process payments, provide receipts, prevent fraud, and offer support. We do not sell your personal data.
                        </p>
                    </section>

                    <section className="bg-slate-800/60 border border-slate-700 rounded-lg p-6">
                        <h3 className="text-white font-semibold mb-2">Data Security</h3>
                        <p>
                            We use industry-standard encryption and access controls to safeguard your information.
                        </p>
                    </section>

                    <section className="bg-slate-800/60 border border-slate-700 rounded-lg p-6">
                        <h3 className="text-white font-semibold mb-2">Your Choices</h3>
                        <p>
                            You can request access, correction, or deletion of your data subject to legal/record-keeping obligations.
                        </p>
                    </section>
                </div>
            </div>
        </MainLayout>
    )
}
