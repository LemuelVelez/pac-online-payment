import { MainLayout } from "@/components/layout/main-layout"
import { SectionHeading } from "@/components/ui/section-heading"

export default function TermsPage() {
    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-12">
                <SectionHeading
                    title="Terms of Service"
                    description="The rules and conditions for using the PAC Salug Online Payment System."
                />
                <div className="mt-6 space-y-6 text-gray-300">
                    <p className="text-sm">Last updated: {new Date().toLocaleDateString()}</p>

                    <section className="bg-slate-800/60 border border-slate-700 rounded-lg p-6">
                        <h3 className="text-white font-semibold mb-2">Acceptable Use</h3>
                        <p>
                            You agree to use the service lawfully and refrain from unauthorized access or fraudulent activities.
                        </p>
                    </section>

                    <section className="bg-slate-800/60 border border-slate-700 rounded-lg p-6">
                        <h3 className="text-white font-semibold mb-2">Accounts & Payments</h3>
                        <p>
                            You are responsible for the accuracy of your account details and any transactions you authorize.
                        </p>
                    </section>

                    <section className="bg-slate-800/60 border border-slate-700 rounded-lg p-6">
                        <h3 className="text-white font-semibold mb-2">Limitation of Liability</h3>
                        <p>
                            The service is provided “as is.” To the extent permitted by law, we are not liable for indirect or incidental damages.
                        </p>
                    </section>

                    <section className="bg-slate-800/60 border border-slate-700 rounded-lg p-6">
                        <h3 className="text-white font-semibold mb-2">Changes</h3>
                        <p>
                            We may update these terms. Continued use of the service after changes means you accept the revised terms.
                        </p>
                    </section>
                </div>
            </div>
        </MainLayout>
    )
}
