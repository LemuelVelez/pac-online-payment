"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function SiteHeader() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    return (
        <header className="sticky top-0 z-50 bg-slate-900/60 supports-[backdrop-filter]:backdrop-blur-md border-b border-white/10">
            <div className="container mx-auto py-4 px-4">
                {/* Desktop and Mobile Header */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                            P
                        </div>
                        <h1 className="text-white text-xl font-bold">PAC Salug Campus</h1>
                    </div>

                    {/* Desktop Navigation - Hidden on mobile */}
                    <div className="hidden md:flex gap-4">
                        <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10">
                            About
                        </Button>
                        <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10">
                            Help
                        </Button>
                        <Button variant="outline" className="text-white hover:text-white border-white bg-transparent hover:bg-white/10">
                            Contact
                        </Button>
                        <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                            <Link href="/auth">Login</Link>
                        </Button>
                    </div>

                    {/* Mobile Menu Button - Visible only on mobile */}
                    <button
                        className="md:hidden text-white p-2"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Toggle menu"
                        aria-expanded={isMenuOpen}
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile Navigation Menu */}
                <div
                    className={cn(
                        "absolute left-0 right-0 bg-slate-900/90 shadow-lg z-50 md:hidden transition-all duration-300 ease-in-out",
                        isMenuOpen ? "top-full opacity-100" : "-top-96 opacity-0 pointer-events-none",
                    )}
                >
                    <div className="flex flex-col p-4 space-y-3">
                        <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10 justify-start">
                            About
                        </Button>
                        <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10 justify-start">
                            Help
                        </Button>
                        <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10 justify-start">
                            Contact
                        </Button>
                        <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 w-full">
                            <Link href="/auth" className="w-full text-center">
                                Login
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    )
}
