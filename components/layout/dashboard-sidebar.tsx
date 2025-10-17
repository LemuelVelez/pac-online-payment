// components/layout/dashboard-sidebar.tsx
/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { LogOut, Power, Loader2 } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { navigationConfig, roleDisplayNames } from "@/components/navigation/role-navigation"
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog"

interface DashboardSidebarProps {
    isOpen?: boolean
    onClose?: () => void
}

export function DashboardSidebar({ isOpen, onClose }: DashboardSidebarProps) {
    const pathname = usePathname()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(isOpen || false)
    const sidebarRef = useRef<HTMLDivElement>(null)
    const { user, logout } = useAuth()

    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const [isLoggingOutAll, setIsLoggingOutAll] = useState(false)
    const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false)
    const [confirmLogoutAllOpen, setConfirmLogoutAllOpen] = useState(false)

    const navigation = user?.role ? navigationConfig[user.role] || [] : []
    const displayName = user?.role ? roleDisplayNames[user.role] : "PAC Payment"

    useEffect(() => {
        if (isOpen !== undefined) {
            setIsMobileMenuOpen(isOpen)
        }
    }, [isOpen])

    const handleClose = () => {
        setIsMobileMenuOpen(false)
        if (onClose) onClose()
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isMobileMenuOpen && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
                handleClose()
            }
        }
        if (isMobileMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside)
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [isMobileMenuOpen])

    const doLogout = async () => {
        setIsLoggingOut(true)
        try {
            await logout()
        } finally {
            setIsLoggingOut(false)
        }
    }
    const doLogoutAll = async () => {
        setIsLoggingOutAll(true)
        try {
            await logout(true)
        } finally {
            setIsLoggingOutAll(false)
        }
    }

    return (
        <>
            {/* Sidebar for desktop */}
            <div className="hidden h-screen w-64 flex-shrink-0 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 lg:block">
                <div className="flex h-full flex-col">
                    <div className="flex h-[65px] items-center border-b border-gray-200 px-6 dark:border-gray-800">
                        <Link href={navigation[0]?.href || "/"} className="flex items-center">
                            <Image
                                src="/images/logo.png"
                                alt="App Logo"
                                width={32}
                                height={32}
                                className="mr-2 h-8 w-8 rounded-md object-contain"
                                priority
                            />
                            <span className="text-xl font-bold text-primary">{displayName}</span>
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
                                        className={`group flex items-center rounded-md px-3 py-2 text-sm font-medium cursor-pointer ${isActive
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
                    <div className="border-t border-gray-200 p-4 space-y-2 dark:border-gray-800">
                        {/* Log out (all devices) with confirmation */}
                        <AlertDialog
                            open={confirmLogoutAllOpen}
                            onOpenChange={(open) => {
                                if (!isLoggingOutAll) setConfirmLogoutAllOpen(open)
                            }}
                        >
                            <AlertDialogTrigger asChild>
                                <button
                                    className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer"
                                    onClick={() => setConfirmLogoutAllOpen(true)}
                                >
                                    <Power className="mr-3 size-5 text-gray-500 dark:text-gray-400" />
                                    Log out (all devices)
                                </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-slate-900 border-slate-700 text-white">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Log out from all devices?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-slate-300">
                                        This will end your session on this browser and any other devices where you’re signed in.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-slate-800 text-white border-slate-700" disabled={isLoggingOutAll}>
                                        Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        className="inline-flex items-center"
                                        disabled={isLoggingOutAll}
                                        onClick={doLogoutAll}
                                        aria-busy={isLoggingOutAll}
                                    >
                                        {isLoggingOutAll ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Logging out…
                                            </>
                                        ) : (
                                            <>
                                                <Power className="mr-2 h-4 w-4" />
                                                Log out everywhere
                                            </>
                                        )}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        {/* Sign out (current device) with confirmation */}
                        <AlertDialog
                            open={confirmLogoutOpen}
                            onOpenChange={(open) => {
                                if (!isLoggingOut) setConfirmLogoutOpen(open)
                            }}
                        >
                            <AlertDialogTrigger asChild>
                                <button
                                    className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer"
                                    onClick={() => setConfirmLogoutOpen(true)}
                                >
                                    <LogOut className="mr-3 size-5 text-gray-500 dark:text-gray-400" />
                                    Sign out
                                </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-slate-900 border-slate-700 text-white">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Log out of this device?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-slate-300">
                                        This will end your current session on this browser only.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-slate-800 text-white border-slate-700" disabled={isLoggingOut}>
                                        Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        className="inline-flex items-center"
                                        disabled={isLoggingOut}
                                        onClick={doLogout}
                                        aria-busy={isLoggingOut}
                                    >
                                        {isLoggingOut ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Logging out…
                                            </>
                                        ) : (
                                            <>
                                                <LogOut className="mr-2 h-4 w-4" />
                                                Log out
                                            </>
                                        )}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            </div>

            {/* Sidebar for mobile */}
            <div
                ref={sidebarRef}
                className={`fixed inset-y-0 left-0 z-40 w-64 transform overflow-y-auto bg-white transition-transform duration-300 ease-in-out dark:bg-gray-900 lg:hidden ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="flex h-full flex-col">
                    <div className="flex h-16 items-center border-b border-gray-200 px-6 dark:border-gray-800">
                        <Link href={navigation[0]?.href || "/"} className="flex items-center">
                            <Image
                                src="/images/logo.png"
                                alt="App Logo"
                                width={32}
                                height={32}
                                className="mr-2 h-8 w-8 rounded-md object-contain"
                                priority
                            />
                            <span className="text-xl font-bold text-primary">{displayName}</span>
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
                                        className={`group flex items-center rounded-md px-3 py-2 text-sm font-medium cursor-pointer ${isActive
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
                    <div className="border-t border-gray-200 p-4 space-y-2 dark:border-gray-800">
                        {/* Log out (all devices) with confirmation */}
                        <AlertDialog
                            open={confirmLogoutAllOpen}
                            onOpenChange={(open) => {
                                if (!isLoggingOutAll) setConfirmLogoutAllOpen(open)
                            }}
                        >
                            <AlertDialogTrigger asChild>
                                <button
                                    className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer"
                                    onClick={() => setConfirmLogoutAllOpen(true)}
                                >
                                    <Power className="mr-3 size-5 text-gray-500 dark:text-gray-400" />
                                    Log out (all devices)
                                </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-slate-900 border-slate-700 text-white">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Log out from all devices?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-slate-300">
                                        This will end your session on this browser and any other devices where you’re signed in.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-slate-800 text-white border-slate-700" disabled={isLoggingOutAll}>
                                        Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        className="inline-flex items-center"
                                        disabled={isLoggingOutAll}
                                        onClick={doLogoutAll}
                                        aria-busy={isLoggingOutAll}
                                    >
                                        {isLoggingOutAll ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Logging out…
                                            </>
                                        ) : (
                                            <>
                                                <Power className="mr-2 h-4 w-4" />
                                                Log out everywhere
                                            </>
                                        )}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        {/* Sign out (current device) with confirmation */}
                        <AlertDialog
                            open={confirmLogoutOpen}
                            onOpenChange={(open) => {
                                if (!isLoggingOut) setConfirmLogoutOpen(open)
                            }}
                        >
                            <AlertDialogTrigger asChild>
                                <button
                                    className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer"
                                    onClick={() => setConfirmLogoutOpen(true)}
                                >
                                    <LogOut className="mr-3 size-5 text-gray-500 dark:text-gray-400" />
                                    Sign out
                                </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-slate-900 border-slate-700 text-white">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Log out of this device?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-slate-300">
                                        This will end your current session on this browser only.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-slate-800 text-white border-slate-700" disabled={isLoggingOut}>
                                        Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        className="inline-flex items-center"
                                        disabled={isLoggingOut}
                                        onClick={doLogout}
                                        aria-busy={isLoggingOut}
                                    >
                                        {isLoggingOut ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Logging out…
                                            </>
                                        ) : (
                                            <>
                                                <LogOut className="mr-2 h-4 w-4" />
                                                Log out
                                            </>
                                        )}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            </div>
        </>
    )
}
