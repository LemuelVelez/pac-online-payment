"use client"

import type React from "react"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Check, Info, Lock, Save, Shield, User } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SettingsPage() {
    const [passwordChanged, setPasswordChanged] = useState(false)

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault()
        setPasswordChanged(true)
        // In a real app, this would actually change the password
        setTimeout(() => {
            setPasswordChanged(false)
        }, 3000)
    }

    return (
        <DashboardLayout>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white">Settings</h1>
                    <p className="text-gray-300">Manage your account settings and preferences</p>
                </div>

                <Tabs defaultValue="account" className="w-full">
                    <TabsList className="bg-slate-800 border-slate-700 mb-8 grid w-full grid-cols-2 lg:max-w-[400px]">
                        <TabsTrigger value="account" className="cursor-pointer">
                            Account
                        </TabsTrigger>
                        <TabsTrigger value="notifications" className="cursor-pointer">
                            Notifications
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="account">
                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <User className="mr-2 h-5 w-5" />
                                        Account Information
                                    </CardTitle>
                                    <CardDescription className="text-gray-300">Update your account details</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="username">Username</Label>
                                            <Input id="username" defaultValue="johnsmith2023" className="bg-slate-700 border-slate-600" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email Address</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                defaultValue="johnsmith@example.com"
                                                className="bg-slate-700 border-slate-600"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone Number</Label>
                                            <Input id="phone" defaultValue="(123) 456-7890" className="bg-slate-700 border-slate-600" />
                                        </div>
                                        <div className="flex lg:items-center lg:justify-between mt-4 flex-col overflow-x-auto space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 md:mt-0">
                                            <div className="flex items-center space-x-2">
                                                <Shield className="h-5 w-5 text-green-500" />
                                                <span className="text-sm text-green-500">Your account is secure</span>
                                            </div>
                                            <Button className="bg-primary hover:bg-primary/90 cursor-pointer">
                                                <Save className="mr-2 h-4 w-4" />
                                                Save Changes
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Lock className="mr-2 h-5 w-5" />
                                        Password
                                    </CardTitle>
                                    <CardDescription className="text-gray-300">Change your password</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {passwordChanged && (
                                        <Alert className="mb-6 bg-green-500/20 border-green-500/50 text-green-200">
                                            <Check className="h-4 w-4" />
                                            <AlertDescription>Your password has been changed successfully!</AlertDescription>
                                        </Alert>
                                    )}
                                    <form onSubmit={handlePasswordChange} className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="current-password">Current Password</Label>
                                            <Input id="current-password" type="password" className="bg-slate-700 border-slate-600" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="new-password">New Password</Label>
                                            <Input id="new-password" type="password" className="bg-slate-700 border-slate-600" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="confirm-password">Confirm New Password</Label>
                                            <Input id="confirm-password" type="password" className="bg-slate-700 border-slate-600" />
                                        </div>
                                        <Alert className="bg-blue-500/20 border-blue-500/50 text-blue-200">
                                            <Info className="h-4 w-4" />
                                            <AlertDescription>
                                                Password must be at least 8 characters long and include uppercase letters, numbers, and special
                                                characters.
                                            </AlertDescription>
                                        </Alert>
                                        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 cursor-pointer">
                                            Change Password
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-800/60 border-slate-700 text-white lg:col-span-2">
                                <CardHeader>
                                    <CardTitle>Security Settings</CardTitle>
                                    <CardDescription className="text-gray-300">Manage your account security preferences</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-medium">Two-Factor Authentication</h3>
                                                <p className="text-sm text-gray-400">Add an extra layer of security to your account</p>
                                            </div>
                                            <Switch id="two-factor" className="cursor-pointer" />
                                        </div>
                                        <Separator className="bg-slate-700" />
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-medium">Login Notifications</h3>
                                                <p className="text-sm text-gray-400">Receive alerts when someone logs into your account</p>
                                            </div>
                                            <Switch id="login-alerts" defaultChecked className="cursor-pointer" />
                                        </div>
                                        <Separator className="bg-slate-700" />
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-medium">Session Management</h3>
                                                <p className="text-sm text-gray-400">Manage your active sessions and devices</p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                className="border-slate-600 text-white hover:bg-slate-700 cursor-pointer"
                                            >
                                                View Sessions
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="notifications">
                        <Card className="bg-slate-800/60 border-slate-700 text-white">
                            <CardHeader>
                                <CardTitle>Notification Preferences</CardTitle>
                                <CardDescription className="text-gray-300">Manage how you receive notifications</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="mb-4 font-medium">Email Notifications</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p>Payment Confirmations</p>
                                                    <p className="text-sm text-gray-400">Receive emails for payment confirmations</p>
                                                </div>
                                                <Switch id="email-payments" defaultChecked className="cursor-pointer" />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p>Payment Reminders</p>
                                                    <p className="text-sm text-gray-400">Get reminded when payments are due</p>
                                                </div>
                                                <Switch id="email-reminders" defaultChecked className="cursor-pointer" />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p>System Updates</p>
                                                    <p className="text-sm text-gray-400">Receive emails about system updates and maintenance</p>
                                                </div>
                                                <Switch id="email-updates" className="cursor-pointer" />
                                            </div>
                                        </div>
                                    </div>

                                    <Separator className="bg-slate-700" />

                                    <div>
                                        <h3 className="mb-4 font-medium">SMS Notifications</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p>Payment Confirmations</p>
                                                    <p className="text-sm text-gray-400">Receive SMS for payment confirmations</p>
                                                </div>
                                                <Switch id="sms-payments" className="cursor-pointer" />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p>Payment Reminders</p>
                                                    <p className="text-sm text-gray-400">Get SMS reminders when payments are due</p>
                                                </div>
                                                <Switch id="sms-reminders" className="cursor-pointer" />
                                            </div>
                                        </div>
                                    </div>

                                    <Separator className="bg-slate-700" />

                                    <div>
                                        <h3 className="mb-4 font-medium">In-App Notifications</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p>Payment Activity</p>
                                                    <p className="text-sm text-gray-400">Notifications for all payment activities</p>
                                                </div>
                                                <Switch id="app-payments" defaultChecked className="cursor-pointer" />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p>System Announcements</p>
                                                    <p className="text-sm text-gray-400">Important announcements from PAC Salug</p>
                                                </div>
                                                <Switch id="app-announcements" defaultChecked className="cursor-pointer" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    )
}
