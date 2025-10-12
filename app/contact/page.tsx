import { MainLayout } from "@/components/layout/main-layout"
import { SectionHeading } from "@/components/ui/section-heading"
import { Button } from "@/components/ui/button"

const gmailCompose = (to: string, subject = "PAC Salug Support", body = "") =>
    `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(
        subject
    )}&body=${encodeURIComponent(body)}`

export default function ContactPage() {
    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-12">
                <SectionHeading
                    title="Contact Us"
                    description="Reach out to the PAC Salug team for support or general inquiries."
                />

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                    {/* Anchor target for footer link /contact#support */}
                    <div id="support" className="bg-slate-800/60 border border-slate-700 rounded-lg p-6">
                        <h3 className="text-white font-semibold mb-2">Support</h3>
                        <p className="text-gray-300">
                            Email:{" "}
                            <a
                                className="underline"
                                href={gmailCompose("info@pacsalug.edu.ph", "PAC Salug Support")}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                info@pacsalug.edu.ph
                            </a>
                            <br />
                            Phone:{" "}
                            <a className="underline" href="tel:+631234567890">
                                (123) 456-7890
                            </a>
                        </p>
                        <div className="mt-4 flex gap-3">
                            <Button asChild>
                                <a
                                    href={gmailCompose(
                                        "info@pacsalug.edu.ph",
                                        "PAC Salug Support",
                                        "Hello PAC Support,\n\nI need help with ..."
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Email Support (Gmail)
                                </a>
                            </Button>
                            <Button asChild variant="outline">
                                <a href="tel:+631234567890">Call Us</a>
                            </Button>
                        </div>
                    </div>

                    <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6">
                        <h3 className="text-white font-semibold mb-2">Office Hours</h3>
                        <p className="text-gray-300">
                            Monday – Friday, 8:00 AM – 5:00 PM (PH Time)
                            <br />
                            We aim to respond within one business day.
                        </p>
                    </div>
                </div>
            </div>
        </MainLayout>
    )
}
