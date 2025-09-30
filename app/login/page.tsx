/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, Eye, EyeOff, Lock, Mail, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/auth/auth-provider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function LoginPage() {
    const [activeTab, setActiveTab] = useState("login")
    const [showPassword, setShowPassword] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const searchParams = useSearchParams()
    const redirect = searchParams.get("redirect") || ""
    const { login } = useAuth()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        try {
            await login(email, password)
            if (redirect) {
                console.log("Redirect parameter:", redirect)
            }
        } catch (error) {
            setError("Invalid email or password. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    // Demo credentials for quick login
    const demoCredentials = [
        { role: "Admin", email: "admin@example.com", password: "password" },
        { role: "Cashier", email: "cashier@example.com", password: "password" },
        { role: "Business Office", email: "business@example.com", password: "password" },
        { role: "Student", email: "student@example.com", password: "password" },
    ]

    const loginAsDemoUser = (demoEmail: string) => {
        setEmail(demoEmail)
        setPassword("password")
    }

    const switchToLoginTab = () => {
        setActiveTab("login")
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
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute right-3 top-3 text-gray-400 hover:text-white"
                                                    onClick={() => setShowPassword(!showPassword)}
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
                                                    className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                                />
                                                <Label htmlFor="remember" className="text-sm cursor-pointer text-gray-300">
                                                    Remember me
                                                </Label>
                                            </div>
                                            <Link href="/login/forgot-password" className="text-sm text-purple-400 hover:text-purple-300">
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

                                    <div className="mt-6">
                                        <p className="text-sm text-gray-400 mb-2">Demo Accounts (Click to fill):</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {demoCredentials.map((cred) => (
                                                <Button
                                                    key={cred.role}
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-xs text-white border-slate-700 hover:bg-slate-700 hover:text-white"
                                                    onClick={() => loginAsDemoUser(cred.email)}
                                                >
                                                    {cred.role}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-center border-t border-slate-700 pt-6">
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
                                    <form className="space-y-4">
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
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="student-id" className="text-white">
                                                Student ID
                                            </Label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="student-id"
                                                    placeholder="Enter your student ID"
                                                    className="pl-10 bg-slate-900/50 border-slate-700 text-white"
                                                    required
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
                                                    required
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
                                                    type="password"
                                                    placeholder="Create a password"
                                                    className="pl-10 bg-slate-900/50 border-slate-700 text-white"
                                                    required
                                                />
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
                                                    type="password"
                                                    placeholder="Confirm your password"
                                                    className="pl-10 bg-slate-900/50 border-slate-700 text-white"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-start space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id="terms"
                                                    className="h-4 w-4 mt-0.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 flex-shrink-0"
                                                    required
                                                />
                                                <div className="text-sm text-gray-300 leading-relaxed">
                                                    I agree to the{" "}
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="text-purple-400 hover:text-purple-300 underline cursor-pointer"
                                                            >
                                                                Terms of Service
                                                            </button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-2xl sm:max-w-3xl bg-slate-800">
                                                            <DialogHeader>
                                                                <DialogTitle>Terms of Service</DialogTitle>
                                                                <DialogDescription>
                                                                    PAC Salug Campus — Online Payment System · Effective: September 29, 2025
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <ScrollArea className="h-[60vh] pr-4">
                                                                <div className="space-y-4 text-sm text-muted-foreground">
                                                                    <section>
                                                                        <h3 className="font-semibold text-foreground">1) Acceptance of Terms</h3>
                                                                        <p>
                                                                            By creating an account or using the PAC Salug Campus Online Payment System (“Service”),
                                                                            you agree to these Terms. If you do not agree, do not use the Service.
                                                                        </p>
                                                                    </section>

                                                                    <section>
                                                                        <h3 className="font-semibold text-foreground">2) Eligibility & Accounts</h3>
                                                                        <ul className="list-disc pl-5 space-y-1">
                                                                            <li>You must provide accurate information and keep your credentials secure.</li>
                                                                            <li>You are responsible for activity under your account.</li>
                                                                            <li>Institution administrators may enable/disable your access per campus policies.</li>
                                                                        </ul>
                                                                    </section>

                                                                    <section>
                                                                        <h3 className="font-semibold text-foreground">3) Payments & Fees</h3>
                                                                        <ul className="list-disc pl-5 space-y-1">
                                                                            <li>Amounts shown are based on official campus assessments.</li>
                                                                            <li>
                                                                                Convenience or processing fees (if any) will be disclosed before you confirm a
                                                                                transaction.
                                                                            </li>
                                                                            <li>All successful transactions generate a reference/receipt you should keep.</li>
                                                                        </ul>
                                                                    </section>

                                                                    <section>
                                                                        <h3 className="font-semibold text-foreground">4) Prohibited Conduct</h3>
                                                                        <ul className="list-disc pl-5 space-y-1">
                                                                            <li>No unauthorized access, scraping, or interference with the Service.</li>
                                                                            <li>No false, misleading, or infringing content or payments.</li>
                                                                            <li>Do not circumvent security or payment verification features.</li>
                                                                        </ul>
                                                                    </section>

                                                                    <section>
                                                                        <h3 className="font-semibold text-foreground">5) Intellectual Property</h3>
                                                                        <p>
                                                                            The Service, including logos, UI, and content, is owned by the institution or its
                                                                            licensors. You receive a limited, non-exclusive license to use it as intended.
                                                                        </p>
                                                                    </section>

                                                                    <section>
                                                                        <h3 className="font-semibold text-foreground">6) Disclaimers</h3>
                                                                        <p>
                                                                            The Service is provided “as is” and “as available.” We disclaim warranties of
                                                                            merchantability, fitness for a particular purpose, and non-infringement to the fullest
                                                                            extent permitted by law.
                                                                        </p>
                                                                    </section>

                                                                    <section>
                                                                        <h3 className="font-semibold text-foreground">7) Limitation of Liability</h3>
                                                                        <p>
                                                                            To the maximum extent permitted by law, the institution is not liable for indirect,
                                                                            incidental, or consequential damages, or for losses arising from unauthorized account
                                                                            access due to your actions or omissions.
                                                                        </p>
                                                                    </section>

                                                                    <section>
                                                                        <h3 className="font-semibold text-foreground">8) Termination</h3>
                                                                        <p>
                                                                            We may suspend or terminate access for violations of these Terms or campus policies.
                                                                            You may stop using the Service at any time.
                                                                        </p>
                                                                    </section>

                                                                    <section>
                                                                        <h3 className="font-semibold text-foreground">9) Governing Law</h3>
                                                                        <p>
                                                                            These Terms are governed by the laws of the Philippines. Venue and jurisdiction shall
                                                                            be in the appropriate courts within the Philippines, without regard to conflict-of-law
                                                                            rules.
                                                                        </p>
                                                                    </section>

                                                                    <section>
                                                                        <h3 className="font-semibold text-foreground">10) Changes to Terms</h3>
                                                                        <p>
                                                                            We may update these Terms. Material changes will be posted within the Service. Your
                                                                            continued use after changes take effect constitutes acceptance.
                                                                        </p>
                                                                    </section>

                                                                    <section>
                                                                        <h3 className="font-semibold text-foreground">11) Contact</h3>
                                                                        <p>
                                                                            For questions or support, please contact the campus Business Office or the IT Office.
                                                                        </p>
                                                                    </section>
                                                                </div>
                                                            </ScrollArea>
                                                            <DialogFooter className="mt-4">
                                                                <DialogClose asChild>
                                                                    <Button type="button" variant="secondary" className="cursor-pointer">
                                                                        Close
                                                                    </Button>
                                                                </DialogClose>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>
                                                    {" "}and{" "}
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="text-purple-400 hover:text-purple-300 underline cursor-pointer"
                                                            >
                                                                Privacy Policy
                                                            </button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-2xl sm:max-w-3xl bg-slate-800">
                                                            <DialogHeader>
                                                                <DialogTitle>Privacy Policy</DialogTitle>
                                                                <DialogDescription>
                                                                    PAC Salug Campus — Online Payment System · Effective: September 29, 2025
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <ScrollArea className="h-[60vh] pr-4">
                                                                <div className="space-y-4 text-sm text-muted-foreground">
                                                                    <section>
                                                                        <h3 className="font-semibold text-foreground">1) What We Collect</h3>
                                                                        <ul className="list-disc pl-5 space-y-1">
                                                                            <li>Account details: name, student ID, institutional email.</li>
                                                                            <li>Payment information: amounts, references, method metadata (no card storage on our servers unless stated).</li>
                                                                            <li>Usage and device data for security and troubleshooting.</li>
                                                                        </ul>
                                                                    </section>

                                                                    <section>
                                                                        <h3 className="font-semibold text-foreground">2) How We Use Data</h3>
                                                                        <ul className="list-disc pl-5 space-y-1">
                                                                            <li>Process payments and issue receipts.</li>
                                                                            <li>Provide support and verify identity.</li>
                                                                            <li>Secure and improve the Service, prevent fraud, and comply with laws.</li>
                                                                        </ul>
                                                                    </section>

                                                                    <section>
                                                                        <h3 className="font-semibold text-foreground">3) Legal Basis</h3>
                                                                        <p>
                                                                            We process data under the Data Privacy Act of 2012 (RA 10173) and applicable laws,
                                                                            based on your consent, contractual necessity, legitimate interests, and/or legal
                                                                            obligations.
                                                                        </p>
                                                                    </section>

                                                                    <section>
                                                                        <h3 className="font-semibold text-foreground">4) Sharing</h3>
                                                                        <p>
                                                                            We may share limited data with authorized campus units and trusted service providers
                                                                            (e.g., payment processors, hosting) under data-sharing agreements. We do not sell your
                                                                            personal data.
                                                                        </p>
                                                                    </section>

                                                                    <section>
                                                                        <h3 className="font-semibold text-foreground">5) Retention</h3>
                                                                        <p>
                                                                            We keep records only as long as necessary for the purposes above and in line with
                                                                            regulatory/audit requirements, then delete or anonymize them.
                                                                        </p>
                                                                    </section>

                                                                    <section>
                                                                        <h3 className="font-semibold text-foreground">6) Security</h3>
                                                                        <p>
                                                                            We implement administrative, physical, and technical safeguards. No system is 100%
                                                                            secure; please protect your credentials.
                                                                        </p>
                                                                    </section>

                                                                    <section>
                                                                        <h3 className="font-semibold text-foreground">7) Your Rights</h3>
                                                                        <ul className="list-disc pl-5 space-y-1">
                                                                            <li>Access, correction, deletion (where applicable).</li>
                                                                            <li>Object to processing or withdraw consent.</li>
                                                                            <li>File a complaint with the National Privacy Commission.</li>
                                                                        </ul>
                                                                    </section>

                                                                    <section>
                                                                        <h3 className="font-semibold text-foreground">8) Cookies & Similar Tech</h3>
                                                                        <p>
                                                                            We may use cookies or similar technologies for session management, security, and
                                                                            analytics. You can control cookies in your browser settings.
                                                                        </p>
                                                                    </section>

                                                                    <section>
                                                                        <h3 className="font-semibold text-foreground">9) Changes</h3>
                                                                        <p>
                                                                            We may update this Policy. Material changes will be posted within the Service. Your
                                                                            continued use after changes take effect means you acknowledge the updates.
                                                                        </p>
                                                                    </section>

                                                                    <section>
                                                                        <h3 className="font-semibold text-foreground">10) Contact</h3>
                                                                        <p>
                                                                            To exercise your rights or ask questions, contact the campus Data Protection Officer or
                                                                            IT Office.
                                                                        </p>
                                                                    </section>
                                                                </div>
                                                            </ScrollArea>
                                                            <DialogFooter className="mt-4">
                                                                <DialogClose asChild>
                                                                    <Button type="button" variant="secondary" className="cursor-pointer">
                                                                        Close
                                                                    </Button>
                                                                </DialogClose>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>
                                                    .
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                                        >
                                            Register
                                        </Button>
                                    </form>
                                </CardContent>
                                <CardFooter className="flex justify-center border-t border-slate-700 pt-6">
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
