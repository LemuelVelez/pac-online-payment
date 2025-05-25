"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

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
    login: (email: string, password: string) => Promise<void>
    logout: () => void
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock users for demonstration
const MOCK_USERS: User[] = [
    {
        id: "1",
        name: "Admin User",
        email: "admin@example.com",
        role: "admin",
        avatar: "/images/avatars/admin.png",
    },
    {
        id: "2",
        name: "Cashier User",
        email: "cashier@example.com",
        role: "cashier",
        avatar: "/images/avatars/cashier.png",
    },
    {
        id: "3",
        name: "Business Office User",
        email: "business@example.com",
        role: "business-office",
        avatar: "/images/avatars/business.png",
    },
    {
        id: "4",
        name: "John Smith",
        email: "student@example.com",
        role: "student",
        avatar: "/images/avatars/student.png",
    },
]

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    // Check for existing session on mount
    useEffect(() => {
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
            setUser(JSON.parse(storedUser))
        }
        setIsLoading(false)
    }, [])

    // Login function
    const login = async (email: string, password: string) => {
        setIsLoading(true)
        try {
            // Simulate API call delay
            await new Promise((resolve) => setTimeout(resolve, 1000))

            // Find user by email (in a real app, this would be an API call)
            const foundUser = MOCK_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase())

            if (!foundUser) {
                throw new Error("Invalid credentials")
            }

            // In a real app, you would validate the password here
            // For demo purposes, we'll accept any password for existing users
            console.log("Password provided:", password) // This uses the password parameter

            // Set user in state and localStorage
            setUser(foundUser)
            localStorage.setItem("user", JSON.stringify(foundUser))

            // Redirect based on role
            redirectBasedOnRole(foundUser.role)
        } catch (error) {
            console.error("Login failed:", error)
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    // Logout function
    const logout = () => {
        setUser(null)
        localStorage.removeItem("user")
        router.push("/login")
    }

    // Redirect based on user role
    const redirectBasedOnRole = (role: UserRole) => {
        switch (role) {
            case "admin":
                router.push("/admin/dashboard")
                break
            case "cashier":
                router.push("/cashier/dashboard")
                break
            case "business-office":
                router.push("/business-office/dashboard")
                break
            case "student":
                router.push("/dashboard")
                break
            default:
                router.push("/login")
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
