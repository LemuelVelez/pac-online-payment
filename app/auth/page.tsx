/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Eye, EyeOff, Lock, Mail, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getAccount, getDatabases, ID, Permission, Role, redirectIfActiveStudent } from "@/lib/appwrite"

// Use the provider (now wired to Appwrite) for consistent auth state
import { useAuth } from "@/components/auth/auth-provider"

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID as string
const USERS_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID as string

async function ensureUserDoc(userId: string, email: string, fullName?: string) {
    const databases = getDatabases()
    try {
        // Create a 1:1 user-profile document keyed by userId
        await databases.createDocument(
            DB_ID,
            USERS_COL_ID,
            userId,
            {
                userId,
                email,
                fullName: fullName ?? "",
                role: "student", // default role
                status: "active",
            },
            // ✅ Use only user-scoped permissions (matches allowed: any, users, user:{id}, users/unverified, user:{id}/unverified)
            [
                Permission.read(Role.user(userId)),
                Permission.update(Role.user(userId)),
                Permission.delete(Role.user(userId)),
            ]
        )
    } catch (err: any) {
        // If it already exists (409), ignore; otherwise bubble up
        if (err?.code !== 409 && err?.response?.code !== 409) {
            throw err
        }
    }
}

export default function LoginPage() {
    const [activeTab, setActiveTab] = useState("login")
    const [showPassword, setShowPassword] = useState(false)

    // login state
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    // register state
    const [fullName, setFullName] = useState("")
    const [regEmail, setRegEmail] = useState("")
    const [regPassword, setRegPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [regError, setRegError] = useState("")
    const [isRegistering, setIsRegistering] = useState(false)
    const [showRegPassword, setShowRegPassword] = useState(false)
    const [showRegConfirm, setShowRegConfirm] = useState(false)

    const searchParams = useSearchParams()
    const router = useRouter()
    const redirect = searchParams.get("redirect")

    const { login } = useAuth()

    // If already logged in and role is student, bounce straight to /dashboard
    useEffect(() => {
        ; (async () => {
            await redirectIfActiveStudent("/dashboard")
        })()
    }, [])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)
        try {
            // ✅ Use provider login so the auth context is hydrated before navigating
            const target = redirect ? decodeURIComponent(redirect) : "/dashboard"
            await login(email, password, target)
            // provider will router.replace(...) for us
        } catch (err: any) {
            setError(err?.message ?? "Invalid email or password. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const switchToLoginTab = () => setActiveTab("login")

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setRegError("")

        // Basic client validations
        if (regPassword !== confirmPassword) {
            setRegError("Passwords do not match.")
            return
        }
        if (regPassword.length < 8) {
            setRegError("Password must be at least 8 characters.")
            return
        }
        if (!DB_ID || !USERS_COL_ID) {
            setRegError("Missing Appwrite database/collection environment variables.")
            return
        }

        setIsRegistering(true)
        try {
            const account = getAccount()

            // Check first: rely on Appwrite's 409 conflict if email already exists
            try {
                await account.create(ID.unique(), regEmail, regPassword, fullName || undefined)
            } catch (err: any) {
                const code = err?.code ?? err?.response?.code
                if (code === 409) {
                    setRegError("An account with this email already exists. Please log in instead.")
                    return // stop — do not create session or continue
                }
                throw err
            }

            // Create a session so we can write the profile doc and send the verification email
            await account.createEmailPasswordSession(regEmail, regPassword)

            // Create the profile document with default role=student
            const me = await account.get()
            await ensureUserDoc(me.$id, me.email, fullName || me.name)

            // Send verification email with callback
            const origin = window.location.origin
            const verifyCallbackUrl = `${origin}/auth/verify-email/callback`
            try {
                await account.createVerification(verifyCallbackUrl)
            } catch (e) {
                console.warn("createVerification failed:", e)
            }

            // Redirect to verify email screen after registration
            router.push(`/auth/verify-email?email=${encodeURIComponent(regEmail)}&justRegistered=1`)
        } catch (err: any) {
            setRegError(err?.message ?? "Failed to register. Please try again.")
        } finally {
            setIsRegistering(false)
        }
    }

    return (
        <div className="max-h-screen overflow-y-auto bg-slate-800 flex flex-col">
            <header className="container mx-auto py-6 px-4">
                <Link href="/" className="flex items-center gap-2 text-white hover:text-purple-300 transition-colors">
                    <ArrowLeft className="h-5 w-5" />
                    <span>Back to Home</span>
                </Link>
            </header>

            <main className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className="h-16 w-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
                            P
                        </div>
                        <h1 className="text-2xl font-bold text-white">PAC Salug Campus</h1>
                        <p className="text-gray-300">Online Payment System</p>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-8">
                            <TabsTrigger
                                className="cursor-pointer hover:bg-slate-800/60 transition-colors data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                                value="login"
                            >
                                Login
                            </TabsTrigger>
                            <TabsTrigger
                                className="cursor-pointer hover:bg-slate-800/60 transition-colors data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                                value="register"
                            >
                                Register
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="login">
                            <Card className="border-purple-500/20 bg-slate-800/50 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="text-white">Login to your account</CardTitle>
                                    <CardDescription>Enter your credentials to access the payment system</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {error && (
                                        <Alert className="mb-4 bg-red-500/20 border-red-500/50 text-red-200">
                                            <AlertDescription>{error}</AlertDescription>
                                        </Alert>
                                    )}

                                    <form onSubmit={handleLogin} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-white">
                                                Email
                                            </Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    placeholder="Enter your email"
                                                    className="pl-10 bg-slate-900/50 border-slate-700 text-white"
                                                    required
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    autoComplete="username"
                                                    autoCapitalize="none"
                                                    autoCorrect="off"
                                                    spellCheck={false}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="password" className="text-white">
                                                Password
                                            </Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="password"
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="Enter your password"
                                                    className="pl-10 pr-10 bg-slate-900/50 border-slate-700 text-white"
                                                    required
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    autoComplete="current-password"
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute right-3 top-3 text-gray-400 hover:text-white"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                                    aria-pressed={showPassword}
                                                >
                                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id="remember"
                                                    name="remember"
                                                    className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                                />
                                                <Label htmlFor="remember" className="text-sm cursor-pointer text-gray-300">
                                                    Remember me
                                                </Label>
                                            </div>
                                            <Link href="/auth/forgot-password" className="text-sm text-purple-400 hover:text-purple-300">
                                                Forgot password?
                                            </Link>
                                        </div>
                                        <Button
                                            type="submit"
                                            className="w-full cursor-pointer bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? "Logging in..." : "Login"}
                                        </Button>
                                    </form>
                                </CardContent>
                                <CardFooter className="flex justify-center border-slate-700 pt-6">
                                    <p className="text-sm text-gray-400">
                                        Need help?{" "}
                                        <a href="#" className="text-purple-400 hover:text-purple-300">
                                            Contact support
                                        </a>
                                    </p>
                                </CardFooter>
                            </Card>
                        </TabsContent>

                        <TabsContent value="register">
                            <Card className="border-purple-500/20 bg-slate-800/50 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="text-white">Create an account</CardTitle>
                                    <CardDescription>Register to use the online payment system</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {regError && (
                                        <Alert className="mb-4 bg-red-500/20 border-red-500/50 text-red-200">
                                            <AlertDescription>{regError}</AlertDescription>
                                        </Alert>
                                    )}

                                    <form className="space-y-4" onSubmit={handleRegister}>
                                        <div className="space-y-2">
                                            <Label htmlFor="fullname" className="text-white">
                                                Full Name
                                            </Label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="fullname"
                                                    placeholder="Enter your full name"
                                                    className="pl-10 bg-slate-900/50 border-slate-700 text-white"
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    required
                                                    autoComplete="name"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="reg-email" className="text-white">
                                                Email
                                            </Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="reg-email"
                                                    type="email"
                                                    placeholder="Enter your email"
                                                    className="pl-10 bg-slate-900/50 border-slate-700 text-white"
                                                    value={regEmail}
                                                    onChange={(e) => setRegEmail(e.target.value)}
                                                    required
                                                    autoComplete="email"
                                                    autoCapitalize="none"
                                                    autoCorrect="off"
                                                    spellCheck={false}
                                                />
                                            </div>
                                        </div>

                                        {/* Password with Eye/EyeOff toggle */}
                                        <div className="space-y-2">
                                            <Label htmlFor="reg-password" className="text-white">
                                                Password
                                            </Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="reg-password"
                                                    type={showRegPassword ? "text" : "password"}
                                                    placeholder="Create a password"
                                                    className="pl-10 pr-10 bg-slate-900/50 border-slate-700 text-white"
                                                    value={regPassword}
                                                    onChange={(e) => setRegPassword(e.target.value)}
                                                    required
                                                    autoComplete="new-password"
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute right-3 top-3 text-gray-400 hover:text-white"
                                                    onClick={() => setShowRegPassword((s) => !s)}
                                                    aria-label={showRegPassword ? "Hide password" : "Show password"}
                                                    aria-pressed={showRegPassword}
                                                >
                                                    {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Confirm password with Eye/EyeOff toggle */}
                                        <div className="space-y-2">
                                            <Label htmlFor="confirm-password" className="text-white">
                                                Confirm Password
                                            </Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="confirm-password"
                                                    type={showRegConfirm ? "text" : "password"}
                                                    placeholder="Confirm your password"
                                                    className="pl-10 pr-10 bg-slate-900/50 border-slate-700 text-white"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    required
                                                    autoComplete="new-password"
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute right-3 top-3 text-gray-400 hover:text-white"
                                                    onClick={() => setShowRegConfirm((s) => !s)}
                                                    aria-label={showRegConfirm ? "Hide password" : "Show password"}
                                                    aria-pressed={showRegConfirm}
                                                >
                                                    {showRegConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-full bg-gradient-to-r from紫-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                                            disabled={isRegistering}
                                        >
                                            {isRegistering ? "Creating account..." : "Register"}
                                        </Button>
                                    </form>
                                </CardContent>
                                <CardFooter className="flex justify-center border-slate-700 pt-6">
                                    <p className="text-sm text-gray-400">
                                        Already have an account?{" "}
                                        <button
                                            onClick={switchToLoginTab}
                                            className="text-purple-400 hover:text-purple-300 underline bg-transparent border-none cursor-pointer"
                                        >
                                            Login
                                        </button>
                                    </p>
                                </CardFooter>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>

            <footer className="py-6 text-center text-gray-400 text-sm">
                <p>© {new Date().getFullYear()} PAC Salug Campus. All rights reserved.</p>
            </footer>
        </div>
    )
}
