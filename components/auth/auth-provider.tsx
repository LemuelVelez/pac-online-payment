"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import {
    getAccount,
    getOrCreateUserRole,
    roleToDashboard,
    signOutCurrentSession,
    signOutAllSessions,
} from "@/lib/appwrite"

// Define user roles
export type UserRole = "admin" | "cashier" | "business-office" | "student" | null

// Define user interface
export interface User {
    id: string
    name: string
    email: string
    role: UserRole
    avatar?: string
}

// Define auth context interface
interface AuthContextType {
    user: User | null
    isLoading: boolean
    // accept optional redirectPath so login callers can choose destination
    login: (email: string, password: string, redirectPath?: string) => Promise<void>
    // optional allDevices flag to sign out everywhere
    logout: (allDevices?: boolean) => Promise<void>
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    // Seed from localStorage quickly (optional), then reconcile with Appwrite session.
    useEffect(() => {
        const seeded = localStorage.getItem("user")
        if (seeded) {
            try {
                const parsed = JSON.parse(seeded) as User
                setUser(parsed)
            } catch {
                // ignore bad JSON
            }
        }

        let cancelled = false
            ; (async () => {
                try {
                    const account = getAccount()
                    const me = await account.get() // throws if no session
                    const role = (await getOrCreateUserRole(me.$id, me.email, me.name)) as UserRole
                    const hydrated: User = {
                        id: me.$id,
                        name: me.name || me.email,
                        email: me.email,
                        role,
                    }
                    if (!cancelled) {
                        setUser(hydrated)
                        localStorage.setItem("user", JSON.stringify(hydrated))
                    }
                } catch {
                    if (!cancelled) {
                        setUser(null)
                        localStorage.removeItem("user")
                    }
                } finally {
                    if (!cancelled) setIsLoading(false)
                }
            })()

        return () => {
            cancelled = true
        }
    }, [])

    const login = async (email: string, password: string, redirectPath?: string) => {
        setIsLoading(true)
        try {
            const account = getAccount()
            await account.createEmailPasswordSession(email, password)

            const me = await account.get()
            const role = (await getOrCreateUserRole(me.$id, me.email, me.name)) as UserRole

            const authUser: User = {
                id: me.$id,
                name: me.name || me.email,
                email: me.email,
                role,
            }

            setUser(authUser)
            localStorage.setItem("user", JSON.stringify(authUser))

            // Prefer explicit redirectPath (e.g., ?redirect=/dashboard), otherwise role-based
            const target = redirectPath || roleToDashboard(role || "student")
            router.replace(target)
        } catch (error) {
            // Surface error to caller
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    const logout = async (allDevices: boolean = false) => {
        setIsLoading(true)
        try {
            if (allDevices) {
                await signOutAllSessions()
            } else {
                await signOutCurrentSession()
            }
        } catch {
            // ignore network/SDK errors; we still clear client state below
        } finally {
            // Always clear client-side state
            setUser(null)
            localStorage.removeItem("user")
            router.replace("/auth")
            setIsLoading(false)
        }
    }

    return <AuthContext.Provider value={{ user, isLoading, login, logout }}>{children}</AuthContext.Provider>
}

// Custom hook to use auth context
export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
