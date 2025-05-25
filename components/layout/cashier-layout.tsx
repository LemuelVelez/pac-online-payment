"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Home, CreditCard, FileText, LogOut, Menu, X, User, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
    { name: "Dashboard", href: "/cashier/dashboard", icon: Home },
    { name: "Process Payments", href: "/cashier/payments", icon: CreditCard },
    { name: "Transactions", href: "/cashier/transactions", icon: FileText },
]

export function CashierLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 border-b border-slate-700 bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <h1 className="text-xl font-bold text-white">Cashier Portal</h1>
                            </div>
                            <div className="hidden md:block">
                                <div className="ml-10 flex items-baseline space-x-4">
                                    {navigation.map((item) => {
                                        const isActive = pathname === item.href
                                        return (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                className={cn(
                                                    isActive ? "bg-slate-800 text-white" : "text-gray-300 hover:bg-slate-700 hover:text-white",
                                                    "group flex items-center rounded-md px-3 py-2 text-sm font-medium",
                                                )}
                                            >
                                                <item.icon
                                                    className={cn(
                                                        isActive ? "text-white" : "text-gray-400 group-hover:text-white",
                                                        "mr-3 h-5 w-5 flex-shrink-0",
                                                    )}
                                                    aria-hidden="true"
                                                />
                                                {item.name}
                                            </Link>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                        <div className="hidden md:block">
                            <div className="ml-4 flex items-center md:ml-6">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Maria Garcia" />
                                                <AvatarFallback>MG</AvatarFallback>
                                            </Avatar>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700 text-white" align="end" forceMount>
                                        <DropdownMenuLabel className="font-normal">
                                            <div className="flex flex-col space-y-1">
                                                <p className="text-sm font-medium leading-none">Maria Garcia</p>
                                                <p className="text-xs leading-none text-gray-400">maria.garcia@example.com</p>
                                            </div>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator className="bg-slate-700" />
                                        <DropdownMenuItem className="hover:bg-slate-700 cursor-pointer">
                                            <User className="mr-2 h-4 w-4" />
                                            <span>Profile</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="hover:bg-slate-700 cursor-pointer">
                                            <Settings className="mr-2 h-4 w-4" />
                                            <span>Settings</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-slate-700" />
                                        <DropdownMenuItem className="hover:bg-slate-700 cursor-pointer">
                                            <LogOut className="mr-2 h-4 w-4" />
                                            <span>Log out</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                        <div className="-mr-2 flex md:hidden">
                            <Button
                                variant="ghost"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-800"
                            >
                                <span className="sr-only">Open main menu</span>
                                {isMobileMenuOpen ? (
                                    <X className="block h-6 w-6" aria-hidden="true" />
                                ) : (
                                    <Menu className="block h-6 w-6" aria-hidden="true" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Mobile menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden">
                        <div className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={cn(
                                            isActive ? "bg-slate-800 text-white" : "text-gray-300 hover:bg-slate-700 hover:text-white",
                                            "group flex items-center rounded-md px-3 py-2 text-base font-medium",
                                        )}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <item.icon
                                            className={cn(
                                                isActive ? "text-white" : "text-gray-400 group-hover:text-white",
                                                "mr-3 h-6 w-6 flex-shrink-0",
                                            )}
                                            aria-hidden="true"
                                        />
                                        {item.name}
                                    </Link>
                                )
                            })}
                        </div>
                        <div className="border-t border-slate-700 pb-3 pt-4">
                            <div className="flex items-center px-5">
                                <div className="flex-shrink-0">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src="/placeholder.svg?height=40&width=40" alt="Maria Garcia" />
                                        <AvatarFallback>MG</AvatarFallback>
                                    </Avatar>
                                </div>
                                <div className="ml-3">
                                    <div className="text-base font-medium text-white">Maria Garcia</div>
                                    <div className="text-sm font-medium text-gray-400">maria.garcia@example.com</div>
                                </div>
                            </div>
                            <div className="mt-3 space-y-1 px-2">
                                <Button
                                    variant="ghost"
                                    className="block w-full rounded-md px-3 py-2 text-left text-base font-medium text-gray-400 hover:bg-slate-700 hover:text-white"
                                >
                                    <User className="mr-3 inline h-5 w-5" />
                                    Profile
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="block w-full rounded-md px-3 py-2 text-left text-base font-medium text-gray-400 hover:bg-slate-700 hover:text-white"
                                >
                                    <Settings className="mr-3 inline h-5 w-5" />
                                    Settings
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="block w-full rounded-md px-3 py-2 text-left text-base font-medium text-gray-400 hover:bg-slate-700 hover:text-white"
                                >
                                    <LogOut className="mr-3 inline h-5 w-5" />
                                    Log out
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* Main content */}
            <main className="flex-1">{children}</main>
        </div>
    )
}
