import { MainLayout } from "@/components/layout/main-layout"
import { SectionHeading } from "@/components/ui/section-heading"

export default function AboutPage() {
    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-12">
                <SectionHeading
                    title="About PAC Salug Online Payment"
                    description="A secure, student-friendly way to settle fees without lining up."
                />
                <div className="mt-6 grid gap-6 md:grid-cols-2">
                    <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6">
                        <h3 className="text-white font-semibold mb-2">Our Mission</h3>
                        <p className="text-gray-300">
                            To make tuition and miscellaneous fee payments simple, transparent, and accessible to every student.
                        </p>
                    </div>
                    <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6">
                        <h3 className="text-white font-semibold mb-2">What You Get</h3>
                        <p className="text-gray-300">
                            Multiple payment methods, instant confirmations, and a clear payment history—all in one place.
                        </p>
                    </div>
                </div>
            </div>
        </MainLayout>
    )
}
