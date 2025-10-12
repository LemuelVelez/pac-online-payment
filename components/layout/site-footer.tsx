"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface SiteFooterProps {
    fullFooter?: boolean
}

const gmailCompose = (to: string, subject = "PAC Salug Inquiry", body = "") =>
    `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(
        subject
    )}&body=${encodeURIComponent(body)}`

export function SiteFooter({ fullFooter = true }: SiteFooterProps) {
    const pathname = usePathname()
    const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")

    // Shared style for footer nav links with active underline + bg
    const navLinkBase =
        "relative inline-flex items-center rounded-md px-1.5 py-0.5 text-sm " +
        "text-gray-400 hover:text-white transition-colors " +
        "after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-0 " +
        "after:bg-gradient-to-r after:from-purple-400 after:to-pink-400 " +
        "data-[active=true]:after:w-full data-[active=true]:bg-white/5"

    if (!fullFooter) {
        return (
            <footer className="py-6 text-center text-gray-400 text-sm">
                <p>© {new Date().getFullYear()} PAC Salug Campus. All rights reserved.</p>
            </footer>
        )
    }

    return (
        <footer className="bg-slate-900 py-12 border-t border-slate-800">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    <div>
                        <h4 className="text-white font-bold mb-4">PAC Salug Campus</h4>
                        <p className="text-gray-400 text-sm">
                            Philippine Advent College
                            <br />
                            Salug Campus
                            <br />
                            Zamboanga del Norte
                        </p>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-4">Quick Links</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    href="/"
                                    className={cn(navLinkBase)}
                                    data-active={pathname === "/"}
                                    aria-current={pathname === "/" ? "page" : undefined}
                                >
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/about"
                                    className={cn(navLinkBase)}
                                    data-active={isActive("/about")}
                                    aria-current={isActive("/about") ? "page" : undefined}
                                >
                                    About
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/contact"
                                    className={cn(navLinkBase)}
                                    data-active={isActive("/contact")}
                                    aria-current={isActive("/contact") ? "page" : undefined}
                                >
                                    Contact
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/help"
                                    className={cn(navLinkBase)}
                                    data-active={isActive("/help")}
                                    aria-current={isActive("/help") ? "page" : undefined}
                                >
                                    Help
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-4">Support</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    href="/privacy-policy"
                                    className={cn(navLinkBase)}
                                    data-active={isActive("/privacy-policy")}
                                    aria-current={isActive("/privacy-policy") ? "page" : undefined}
                                >
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/terms"
                                    className={cn(navLinkBase)}
                                    data-active={isActive("/terms")}
                                    aria-current={isActive("/terms") ? "page" : undefined}
                                >
                                    Terms of Service
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-4">Contact</h4>
                        <ul className="space-y-2">
                            <li className="text-gray-400 text-sm">
                                Email:{" "}
                                <a
                                    href={gmailCompose("info@pacsalug.edu.ph", "PAC Salug Inquiry")}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-white underline"
                                >
                                    info@pacsalug.edu.ph
                                </a>
                            </li>
                            <li className="text-gray-400 text-sm">
                                Phone:{" "}
                                <a href="tel:+631234567890" className="hover:text-white">
                                    (123) 456-7890
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-slate-800 pt-8 text-center">
                    <p className="text-gray-400 text-sm">
                        © {new Date().getFullYear()} PAC Salug Campus. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    )
}
