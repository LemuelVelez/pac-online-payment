"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useSessionRole } from "@/lib/appwrite-rbac"

export function SiteHeader() {
    const pathname = usePathname()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const { loading, user, dashboardHref } = useSessionRole()

    const toggleMenu = () => setIsMenuOpen((v) => !v)
    const closeMenu = () => setIsMenuOpen(false)
    const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")

    const navBtnBase =
        "relative text-white hover:text-white transition-colors hover:bg-white/10 data-[active=true]:bg-white/10 " +
        "after:absolute after:left-0 after:-bottom-2 after:h-0.5 after:w-0 after:bg-gradient-to-r after:from-sky-400 after:to-blue-400" +
        "data-[active=true]:after:w-full"

    const isAuthed = !!user

    return (
        <header className="sticky top-0 z-50 bg-slate-900/60 supports-[backdrop-filter]:backdrop-blur-md border-b border-white/10">
            <div className="container mx-auto py-4 px-4">
                <div className="flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2 text-white" onClick={closeMenu}>
                        <Image
                            src="/images/logo.jpg"
                            alt="PAC Salug Campus logo"
                            width={48}
                            height={48}
                            priority
                            className="h-10 w-10 object-contain"
                        />
                        <span className="text-xl font-bold">PAC Salug Campus</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex gap-4" aria-label="Primary">
                        <Button asChild variant="ghost" className={cn(navBtnBase)} data-active={isActive("/about")}>
                            <Link href="/about" aria-current={isActive("/about") ? "page" : undefined}>
                                About
                            </Link>
                        </Button>

                        <Button asChild variant="ghost" className={cn(navBtnBase)} data-active={isActive("/help")}>
                            <Link href="/help" aria-current={isActive("/help") ? "page" : undefined}>
                                Help
                            </Link>
                        </Button>

                        <Button
                            asChild
                            variant="ghost"
                            className={cn("text-white border-white bg-transparent hover:bg-white/10", navBtnBase, "data-[active=true]:border-white/60")}
                            data-active={isActive("/contact")}
                        >
                            <Link href="/contact" aria-current={isActive("/contact") ? "page" : undefined}>
                                Contact
                            </Link>
                        </Button>

                        <Button
                            asChild
                            className={cn(
                                "bg-gradient-to-r text-white from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600",
                                isActive("/auth") && !isAuthed && "ring-2 ring-white/30"
                            )}
                        >
                            <Link href={isAuthed ? dashboardHref : "/auth"} aria-current={!isAuthed && isActive("/auth") ? "page" : undefined}>
                                {loading ? "…" : isAuthed ? "Dashboard" : "Login"}
                            </Link>
                        </Button>
                    </nav>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden text-white p-2"
                        onClick={toggleMenu}
                        aria-label="Toggle menu"
                        aria-expanded={isMenuOpen}
                        aria-controls="mobile-menu"
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile Navigation */}
                <div
                    id="mobile-menu"
                    className={cn(
                        "absolute left-0 right-0 bg-slate-900/90 shadow-lg z-50 md:hidden transition-all duration-300 ease-in-out",
                        isMenuOpen ? "top-full opacity-100" : "-top-96 opacity-0 pointer-events-none"
                    )}
                >
                    <div className="flex flex-col p-4 space-y-3">
                        <Button
                            asChild
                            variant="ghost"
                            className={cn("justify-start", "text-white hover:text-white hover:bg-white/10", navBtnBase)}
                            data-active={isActive("/about")}
                        >
                            <Link href="/about" onClick={closeMenu}>
                                About
                            </Link>
                        </Button>

                        <Button
                            asChild
                            variant="ghost"
                            className={cn("justify-start", "text-white hover:text-white hover:bg-white/10", navBtnBase)}
                            data-active={isActive("/help")}
                        >
                            <Link href="/help" onClick={closeMenu}>
                                Help
                            </Link>
                        </Button>

                        <Button
                            asChild
                            variant="ghost"
                            className={cn("justify-start", "text-white hover:text-white hover:bg-white/10", navBtnBase)}
                            data-active={isActive("/contact")}
                        >
                            <Link href="/contact" onClick={closeMenu}>
                                Contact
                            </Link>
                        </Button>

                        <Button
                            className="text-white bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 w-full"
                            asChild
                        >
                            <Link href={isAuthed ? dashboardHref : "/auth"} onClick={closeMenu} className="w-full text-center">
                                {loading ? "…" : isAuthed ? "Dashboard" : "Login"}
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    )
}
