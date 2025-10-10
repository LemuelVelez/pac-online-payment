"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import {
    getAccount,
    getOrCreateUserRole,
    roleToDashboard,
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
    // if you want a “Log out from all devices” button anywhere, call logout(true)
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
            } catch { }
        }

        let cancelled = false
            ; (async () => {
                try {
                    const account = getAccount()
                    const me = await account.get() // throws if no session
                    // If we have a session but it's not verified, DO NOT hydrate as logged-in.
                    if (!me.emailVerification) {
                        if (!cancelled) {
                            setUser(null)
                            localStorage.removeItem("user")
                        }
                    } else {
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
            // Create session to be able to read account
            await account.createEmailPasswordSession(email, password)

            const me = await account.get()

            // ⛔ Block full login for unverified users, but KEEP the session so they can fix email / verify.
            if (!me.emailVerification) {
                // best-effort: send a fresh verification email
                try {
                    const origin = typeof window !== "undefined" ? window.location.origin : ""
                    const verifyCallbackUrl = origin ? `${origin}/auth/verify-email/callback` : undefined
                    if (verifyCallbackUrl) {
                        await account.createVerification(verifyCallbackUrl)
                    }
                } catch {
                    // ignore email send errors
                }

                // Do not set user; keep session and route to verify-email
                setUser(null)
                localStorage.removeItem("user")
                const qs = `?email=${encodeURIComponent(me.email)}&needsVerification=1`
                router.replace(`/auth/verify-email${qs}`)
                return
            }

            // Verified: proceed
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

    const logout = async (allDevices?: boolean) => {
        setIsLoading(true)
        try {
            const account = getAccount()
            try {
                if (allDevices) {
                    await account.deleteSessions()
                } else {
                    await account.deleteSession("current")
                }
            } catch {
                // ignore if already logged out
            }
            setUser(null)
            localStorage.removeItem("user")
            router.replace("/auth")
        } finally {
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
