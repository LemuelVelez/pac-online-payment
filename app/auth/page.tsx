/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Eye, EyeOff, Lock, Mail, User, IdCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    getAccount,
    getDatabases,
    ID,
    Permission,
    Role,
    isStudentIdAvailable,
} from "@/lib/appwrite"
import { getOrCreateUserRole, roleToDashboard } from "@/lib/appwrite"
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select"
import { useAuth } from "@/components/auth/auth-provider"
import { toast } from "sonner"

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID as string
const USERS_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID as string

const COURSES = [
    "BACHELOR OF SCIENCE IN EDUCATION",
    "BACHELOR OF SCIENCE IN SOCIAL WORK",
    "BACHELOR OF SCIENCE IN COMPUTER SCIENCE",
    "BACHELOR OF SCIENCE IN INFORMATION TECHNOLOGY",
] as const
type CourseName = typeof COURSES[number]

const COURSE_ACRONYM: Record<CourseName, string> = {
    "BACHELOR OF SCIENCE IN EDUCATION": "BSED",
    "BACHELOR OF SCIENCE IN SOCIAL WORK": "BSSW",
    "BACHELOR OF SCIENCE IN COMPUTER SCIENCE": "BSCS",
    "BACHELOR OF SCIENCE IN INFORMATION TECHNOLOGY": "BSIT",
}

const YEAR_LEVELS = ["1st", "2nd", "3rd", "4th", "5th"] as const
type YearLevel = typeof YEAR_LEVELS[number]
type AccountType = "student" | "other"

const REMEMBER_FLAG_KEY = "pac-auth:remember"
const REMEMBER_EMAIL_KEY = "pac-auth:rememberEmail"

function sanitizeRedirect(raw: string | null | undefined): string | null {
    if (!raw) return null
    try {
        const url = decodeURIComponent(raw)
        if (!url.startsWith("/")) return null
        if (url.startsWith("/auth")) return null
        return url
    } catch {
        return null
    }
}

async function ensureUserDoc(
    userId: string,
    email: string,
    fullName: string | undefined,
    opts?: { studentId?: string; course?: string; yearLevel?: string }
) {
    const databases = getDatabases()
    const payload: Record<string, any> = {
        userId,
        email,
        fullName: fullName ?? "",
        role: "student",
        status: "active",
    }
    if (opts?.studentId) payload.studentId = opts.studentId
    if (opts?.course) payload.course = opts.course
    if (opts?.yearLevel) payload.yearLevel = opts.yearLevel

    try {
        await databases.createDocument(DB_ID, USERS_COL_ID, userId, payload, [
            Permission.read(Role.user(userId)),
            Permission.update(Role.user(userId)),
            Permission.delete(Role.user(userId)),
        ])
    } catch (err: any) {
        const code = err?.code ?? err?.response?.code
        if (code !== 409) throw err
    }
}

export default function LoginPage() {
    const [activeTab, setActiveTab] = useState("login")
    const [showPassword, setShowPassword] = useState(false)

    // login state
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [rememberMe, setRememberMe] = useState(false)
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    // register state
    const [fullName, setFullName] = useState("")
    const [accountType, setAccountType] = useState<AccountType>("student")
    const [studentId, setStudentId] = useState("")
    const [course, setCourse] = useState<CourseName | undefined>(undefined)
    const [yearLevel, setYearLevel] = useState<YearLevel | undefined>(undefined)
    const [regEmail, setRegEmail] = useState("")
    const [regPassword, setRegPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [regError, setRegError] = useState("")
    const [isRegistering, setIsRegistering] = useState(false)
    const [showRegPassword, setShowRegPassword] = useState(false)
    const [showRegConfirm, setShowRegConfirm] = useState(false)

    const searchParams = useSearchParams()
    const router = useRouter()
    const { login } = useAuth()

    const redirectParam = sanitizeRedirect(searchParams.get("redirect") || searchParams.get("next"))
    const bootRedirectedRef = useRef(false)

    // preload remembered email
    useEffect(() => {
        try {
            const remembered = localStorage.getItem(REMEMBER_FLAG_KEY) === "1"
            if (remembered) {
                const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY) || ""
                setEmail(savedEmail)
                setRememberMe(true)
            }
        } catch { }
    }, [])

    // Single, safe redirect if already logged in
    useEffect(() => {
        if (bootRedirectedRef.current) return
            ; (async () => {
                try {
                    const me = await getAccount().get()
                    if (!me.emailVerification) {
                        const qs = `?email=${encodeURIComponent(me.email)}&needsVerification=1`
                        router.replace(`/auth/verify-email${qs}`)
                        bootRedirectedRef.current = true
                        return
                    }
                    const role = await getOrCreateUserRole(me.$id, me.email, me.name)
                    const dest = redirectParam || roleToDashboard(role)
                    router.replace(dest)
                    bootRedirectedRef.current = true
                } catch {
                    // not logged in – render login normally
                }
            })()
    }, [redirectParam, router])

    const handleRememberToggle: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        const checked = e.currentTarget.checked
        setRememberMe(checked)
        try {
            if (checked) {
                localStorage.setItem(REMEMBER_FLAG_KEY, "1")
                localStorage.setItem(REMEMBER_EMAIL_KEY, email)
            } else {
                localStorage.removeItem(REMEMBER_FLAG_KEY)
                localStorage.removeItem(REMEMBER_EMAIL_KEY)
            }
        } catch { }
    }

    const handleEmailChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        const value = e.target.value
        setEmail(value)
        if (rememberMe) {
            try {
                localStorage.setItem(REMEMBER_EMAIL_KEY, value)
            } catch { }
        }
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)
        try {
            // Prefer sanitized redirect target if present
            const target = redirectParam ?? "/dashboard"
            await login(email, password, target)
            try {
                if (rememberMe) {
                    localStorage.setItem(REMEMBER_FLAG_KEY, "1")
                    localStorage.setItem(REMEMBER_EMAIL_KEY, email)
                } else {
                    localStorage.removeItem(REMEMBER_FLAG_KEY)
                    localStorage.removeItem(REMEMBER_EMAIL_KEY)
                }
            } catch { }
            toast.success("Welcome back!", {
                description: "You have successfully signed in.",
            })
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

            // Required for student accounts
            const trimmedStudentId = studentId.trim()
            if (accountType === "student") {
                if (!trimmedStudentId) {
                    setRegError("Student ID is required for student accounts.")
                    return
                }
                if (!course) {
                    setRegError("Course is required for student accounts.")
                    return
                }
                if (!yearLevel) {
                    setRegError("Year level is required for student accounts.")
                    return
                }

                try {
                    const available = await isStudentIdAvailable(trimmedStudentId)
                    if (!available) {
                        setRegError("That Student ID is already in use. Please double-check and try another.")
                        return
                    }
                } catch { }
            }

            // Create account
            try {
                await account.create(ID.unique(), regEmail, regPassword, fullName || undefined)
            } catch (err: any) {
                const code = err?.code ?? err?.response?.code
                if (code === 409) {
                    setRegError("An account with this email already exists. Please log in instead.")
                    return
                }
                throw err
            }

            // Auto-login
            await account.createEmailPasswordSession(regEmail, regPassword)

            // Ensure user doc
            const me = await account.get()
            try {
                await ensureUserDoc(
                    me.$id,
                    me.email,
                    fullName || me.name,
                    accountType === "student"
                        ? {
                            studentId: trimmedStudentId,
                            course: course || undefined,
                            yearLevel: yearLevel || undefined,
                        }
                        : undefined
                )
            } catch (err: any) {
                const code = err?.code ?? err?.response?.code
                if (code === 409) {
                    try {
                        await account.deleteSession("current")
                    } catch { }
                    setRegError("That Student ID is already in use. Please use a different one.")
                    return
                }
                throw err
            }

            // Email verification (best-effort)
            const origin = window.location.origin
            const verifyCallbackUrl = `${origin}/auth/verify-email/callback`
            try {
                await account.createVerification(verifyCallbackUrl)
            } catch { }

            toast.success("Account created!", {
                description: "We sent a verification link to your email.",
            })

            // Go to verify page
            router.replace(`/auth/verify-email?email=${encodeURIComponent(regEmail)}&justRegistered=1`)
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
                        <Image
                            src="/images/logo.png"
                            alt="PAC Salug Campus logo"
                            width={64}
                            height={64}
                            className="h-16 w-16 object-contain mx-auto mb-4"
                            priority
                        />
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

                        {/* LOGIN */}
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
                                                    onChange={handleEmailChange}
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
                                                    checked={rememberMe}
                                                    onChange={handleRememberToggle}
                                                    title="Stores your email on this device for faster sign-in."
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
                                            className="w-full cursor-pointer text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? "Logging in..." : "Login"}
                                        </Button>
                                    </form>
                                </CardContent>
                                <CardFooter className="flex justify-center border-slate-700 pt-6">
                                    <p className="text-sm text-gray-400">
                                        Need help?{" "}
                                        <Link href="/contact#support" className="text-purple-400 hover:text-purple-300">
                                            Contact support
                                        </Link>
                                    </p>
                                </CardFooter>
                            </Card>
                        </TabsContent>

                        {/* REGISTER */}
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
                                            <Label className="text-white">Account Type</Label>
                                            <Select value={accountType} onValueChange={(v: AccountType) => setAccountType(v)}>
                                                <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                                                    <span className="truncate">{accountType === "student" ? "Student" : "Other (Staff/Guest)"}</span>
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-900 text-white border-slate-700">
                                                    <SelectItem value="student">Student</SelectItem>
                                                    <SelectItem value="other">Other (Staff/Guest)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {accountType === "student" && (
                                            <>
                                                <div className="space-y-2">
                                                    <Label htmlFor="student-id" className="text-white">
                                                        Student ID <span className="text-red-300">*</span>
                                                    </Label>
                                                    <div className="relative">
                                                        <IdCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                                        <Input
                                                            id="student-id"
                                                            placeholder="e.g., 2025-00123"
                                                            className="pl-10 bg-slate-900/50 border-slate-700 text-white"
                                                            value={studentId}
                                                            onChange={(e) => setStudentId(e.target.value)}
                                                            required
                                                            aria-required="true"
                                                            autoComplete="off"
                                                            spellCheck={false}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-white">
                                                        Course <span className="text-red-300">*</span>
                                                    </Label>
                                                    <Select value={course} onValueChange={(v: CourseName) => setCourse(v)}>
                                                        <SelectTrigger
                                                            className="bg-slate-900/50 border-slate-700 text-white"
                                                            aria-required="true"
                                                            aria-invalid={accountType === "student" && !course ? true : undefined}
                                                        >
                                                            <span className="truncate">{course ? COURSE_ACRONYM[course] : "Select course"}</span>
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-slate-900 text-white border-slate-700">
                                                            {COURSES.map((c) => (
                                                                <SelectItem key={c} value={c}>
                                                                    <div className="flex w-full items-center justify-between gap-2">
                                                                        <span className="block">{c}</span>
                                                                        <span className="text-xs opacity-70">{COURSE_ACRONYM[c]}</span>
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-white">
                                                        Year Level <span className="text-red-300">*</span>
                                                    </Label>
                                                    <Select value={yearLevel} onValueChange={(v: YearLevel) => setYearLevel(v)}>
                                                        <SelectTrigger
                                                            className="bg-slate-900/50 border-slate-700 text-white"
                                                            aria-required="true"
                                                            aria-invalid={accountType === "student" && !yearLevel ? true : undefined}
                                                        >
                                                            <span className="truncate">{yearLevel ?? "Select year level"}</span>
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-slate-900 text-white border-slate-700">
                                                            {YEAR_LEVELS.map((y) => (
                                                                <SelectItem key={y} value={y}>
                                                                    {y}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </>
                                        )}

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
                                            className="w-full text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
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
