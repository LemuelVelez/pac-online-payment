"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Eye, EyeOff, Lock, Mail, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false)
    const router = useRouter()

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault()
        // In a real app, we would authenticate the user here
        router.push("/dashboard")
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex flex-col">
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

                    <Tabs defaultValue="login" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-8">
                            <TabsTrigger value="login">Login</TabsTrigger>
                            <TabsTrigger value="register">Register</TabsTrigger>
                        </TabsList>
                        <TabsContent value="login">
                            <Card className="border-purple-500/20 bg-slate-800/50 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="text-white">Login to your account</CardTitle>
                                    <CardDescription>Enter your credentials to access the payment system</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleLogin} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-white">
                                                Student ID / Email
                                            </Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="email"
                                                    placeholder="Enter your student ID or email"
                                                    className="pl-10 bg-slate-900/50 border-slate-700 text-white"
                                                    required
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
                                                <Label htmlFor="remember" className="text-sm text-gray-300">
                                                    Remember me
                                                </Label>
                                            </div>
                                            <a href="#" className="text-sm text-purple-400 hover:text-purple-300">
                                                Forgot password?
                                            </a>
                                        </div>
                                        <Button
                                            type="submit"
                                            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                                        >
                                            Login
                                        </Button>
                                    </form>
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
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="terms"
                                                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                                required
                                            />
                                            <Label htmlFor="terms" className="text-sm text-gray-300">
                                                I agree to the{" "}
                                                <a href="#" className="text-purple-400 hover:text-purple-300">
                                                    Terms of Service
                                                </a>{" "}
                                                and{" "}
                                                <a href="#" className="text-purple-400 hover:text-purple-300">
                                                    Privacy Policy
                                                </a>
                                            </Label>
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
                                        <a href="#" className="text-purple-400 hover:text-purple-300">
                                            Login
                                        </a>
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
