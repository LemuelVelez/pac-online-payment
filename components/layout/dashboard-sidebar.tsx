"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CreditCard, FileText, Home, LogOut, Menu, Settings, User, X } from "lucide-react"
import { useState, useEffect } from "react"

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Make Payment", href: "/make-payment", icon: CreditCard },
    { name: "Payment History", href: "/payment-history", icon: FileText },
    { name: "Profile", href: "/profile", icon: User },
    { name: "Settings", href: "/settings", icon: Settings },
]

interface DashboardSidebarProps {
    isOpen?: boolean
    onClose?: () => void
}

export function DashboardSidebar({ isOpen, onClose }: DashboardSidebarProps) {
    const pathname = usePathname()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(isOpen || false)

    // Sync internal state with prop
    useEffect(() => {
        if (isOpen !== undefined) {
            setIsMobileMenuOpen(isOpen)
        }
    }, [isOpen])

    // Handle close with callback
    const handleClose = () => {
        setIsMobileMenuOpen(false)
        if (onClose) {
            onClose()
        }
    }

    return (
        <>
            {/* Mobile menu button */}
            <button
                type="button"
                className="fixed right-4 top-4 z-40 rounded-md bg-gray-800 p-2 text-gray-400 lg:hidden"
                onClick={() => {
                    const newState = !isMobileMenuOpen
                    setIsMobileMenuOpen(newState)
                    if (!newState && onClose) {
                        onClose()
                    }
                }}
            >
                <span className="sr-only">Open sidebar</span>
                {isMobileMenuOpen ? (
                    <X className="size-6" aria-hidden="true" />
                ) : (
                    <Menu className="size-6" aria-hidden="true" />
                )}
            </button>

            {/* Mobile menu overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-30 bg-gray-800/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar for desktop */}
            <div className="hidden h-screen w-64 flex-shrink-0 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 lg:block">
                <div className="flex h-full flex-col">
                    <div className="flex h-16 items-center border-b border-gray-200 px-6 dark:border-gray-800">
                        <Link href="/" className="flex items-center">
                            <span className="text-xl font-bold text-primary">PAC Payment</span>
                        </Link>
                    </div>
                    <div className="flex flex-1 flex-col overflow-y-auto">
                        <nav className="flex-1 space-y-1 px-2 py-4">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`group flex items-center rounded-md px-3 py-2 text-sm font-medium ${isActive
                                                ? "bg-primary/10 text-primary dark:bg-primary/5"
                                                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                                            }`}
                                        onClick={handleClose}
                                    >
                                        <item.icon
                                            className={`mr-3 size-5 flex-shrink-0 ${isActive ? "text-primary" : "text-gray-500 dark:text-gray-400"
                                                }`}
                                            aria-hidden="true"
                                        />
                                        {item.name}
                                    </Link>
                                )
                            })}
                        </nav>
                    </div>
                    <div className="border-t border-gray-200 p-4 dark:border-gray-800">
                        <button className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                            <LogOut className="mr-3 size-5 text-gray-500 dark:text-gray-400" />
                            Sign out
                        </button>
                    </div>
                </div>
            </div>

            {/* Sidebar for mobile */}
            <div
                className={`fixed inset-y-0 left-0 z-40 w-64 transform overflow-y-auto bg-white transition-transform duration-300 ease-in-out dark:bg-gray-900 lg:hidden ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="flex h-full flex-col">
                    <div className="flex h-16 items-center border-b border-gray-200 px-6 dark:border-gray-800">
                        <Link href="/" className="flex items-center">
                            <span className="text-xl font-bold text-primary">PAC Payment</span>
                        </Link>
                    </div>
                    <div className="flex flex-1 flex-col overflow-y-auto">
                        <nav className="flex-1 space-y-1 px-2 py-4">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`group flex items-center rounded-md px-3 py-2 text-sm font-medium ${isActive
                                                ? "bg-primary/10 text-primary dark:bg-primary/5"
                                                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                                            }`}
                                        onClick={handleClose}
                                    >
                                        <item.icon
                                            className={`mr-3 size-5 flex-shrink-0 ${isActive ? "text-primary" : "text-gray-500 dark:text-gray-400"
                                                }`}
                                            aria-hidden="true"
                                        />
                                        {item.name}
                                    </Link>
                                )
                            })}
                        </nav>
                    </div>
                    <div className="border-t border-gray-200 p-4 dark:border-gray-800">
                        <button className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                            <LogOut className="mr-3 size-5 text-gray-500 dark:text-gray-400" />
                            Sign out
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
