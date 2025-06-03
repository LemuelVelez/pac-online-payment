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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Check, Info, Lock, Save, Shield, User, Receipt, Bell, CreditCard } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function CashierSettingsPage() {
    const [passwordChanged, setPasswordChanged] = useState(false)
    const [settingsSaved, setSettingsSaved] = useState(false)

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault()
        setPasswordChanged(true)
        setTimeout(() => {
            setPasswordChanged(false)
        }, 3000)
    }

    const handleSaveSettings = (e: React.FormEvent) => {
        e.preventDefault()
        setSettingsSaved(true)
        setTimeout(() => {
            setSettingsSaved(false)
        }, 3000)
    }

    return (
        <DashboardLayout allowedRoles={["cashier"]}>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white">Cashier Settings</h1>
                    <p className="text-gray-300">Manage your account and cashier preferences</p>
                </div>

                <Tabs defaultValue="account" className="w-full">
                    <TabsList className="bg-slate-800 border-slate-700 mb-8 grid w-full grid-cols-3 lg:max-w-[600px]">
                        <TabsTrigger value="account" className="cursor-pointer">
                            Account
                        </TabsTrigger>
                        <TabsTrigger value="cashier" className="cursor-pointer">
                            Cashier
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
                                    <form onSubmit={handleSaveSettings} className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="employee-id">Employee ID</Label>
                                            <Input
                                                id="employee-id"
                                                defaultValue="CASH-001"
                                                className="bg-slate-700 border-slate-600"
                                                readOnly
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="full-name">Full Name</Label>
                                            <Input id="full-name" defaultValue="Maria Garcia" className="bg-slate-700 border-slate-600" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email Address</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                defaultValue="maria.garcia@pacsalug.edu.ph"
                                                className="bg-slate-700 border-slate-600"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone Number</Label>
                                            <Input id="phone" defaultValue="(123) 456-7890" className="bg-slate-700 border-slate-600" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="department">Department</Label>
                                            <Input
                                                id="department"
                                                defaultValue="Cashier Office"
                                                className="bg-slate-700 border-slate-600"
                                                readOnly
                                            />
                                        </div>
                                        <div className="flex lg:items-center lg:justify-between mt-4 flex-col overflow-x-auto space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 md:mt-0">
                                            <div className="flex items-center space-x-2">
                                                <Shield className="h-5 w-5 text-green-500" />
                                                <span className="text-sm text-green-500">Account verified</span>
                                            </div>
                                            <Button type="submit" className="bg-primary hover:bg-primary/90 cursor-pointer">
                                                <Save className="mr-2 h-4 w-4" />
                                                Save Changes
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Lock className="mr-2 h-5 w-5" />
                                        Password & Security
                                    </CardTitle>
                                    <CardDescription className="text-gray-300">
                                        Change your password and security settings
                                    </CardDescription>
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

                                    <Separator className="bg-slate-700 my-6" />

                                    <div className="space-y-4">
                                        <h3 className="font-medium">Security Preferences</h3>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm">Auto-logout after inactivity</p>
                                                <p className="text-xs text-gray-400">Automatically log out after 30 minutes of inactivity</p>
                                            </div>
                                            <Switch id="auto-logout" defaultChecked className="cursor-pointer" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm">Login notifications</p>
                                                <p className="text-xs text-gray-400">Receive alerts when someone logs into your account</p>
                                            </div>
                                            <Switch id="login-alerts" defaultChecked className="cursor-pointer" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="cashier">
                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Receipt className="mr-2 h-5 w-5" />
                                        Receipt Settings
                                    </CardTitle>
                                    <CardDescription className="text-gray-300">
                                        Configure receipt and printing preferences
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {settingsSaved && (
                                        <Alert className="mb-6 bg-green-500/20 border-green-500/50 text-green-200">
                                            <Check className="h-4 w-4" />
                                            <AlertDescription>Settings have been saved successfully!</AlertDescription>
                                        </Alert>
                                    )}
                                    <form onSubmit={handleSaveSettings} className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="receipt-format">Receipt Format</Label>
                                            <Select defaultValue="standard">
                                                <SelectTrigger id="receipt-format" className="bg-slate-700 border-slate-600">
                                                    <SelectValue placeholder="Select receipt format" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                                    <SelectItem value="standard">Standard Receipt</SelectItem>
                                                    <SelectItem value="detailed">Detailed Receipt</SelectItem>
                                                    <SelectItem value="compact">Compact Receipt</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="printer">Default Printer</Label>
                                            <Select defaultValue="thermal-01">
                                                <SelectTrigger id="printer" className="bg-slate-700 border-slate-600">
                                                    <SelectValue placeholder="Select printer" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                                    <SelectItem value="thermal-01">Thermal Printer 01</SelectItem>
                                                    <SelectItem value="thermal-02">Thermal Printer 02</SelectItem>
                                                    <SelectItem value="laser-01">Laser Printer 01</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm">Auto-print receipts</p>
                                                    <p className="text-xs text-gray-400">Automatically print receipts after payment</p>
                                                </div>
                                                <Switch id="auto-print" defaultChecked className="cursor-pointer" />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm">Print duplicate receipts</p>
                                                    <p className="text-xs text-gray-400">Print two copies of each receipt</p>
                                                </div>
                                                <Switch id="duplicate-receipts" className="cursor-pointer" />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm">Include QR code</p>
                                                    <p className="text-xs text-gray-400">Add QR code for digital verification</p>
                                                </div>
                                                <Switch id="qr-code" defaultChecked className="cursor-pointer" />
                                            </div>
                                        </div>

                                        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 cursor-pointer">
                                            <Save className="mr-2 h-4 w-4" />
                                            Save Receipt Settings
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <CreditCard className="mr-2 h-5 w-5" />
                                        Payment Preferences
                                    </CardTitle>
                                    <CardDescription className="text-gray-300">Configure payment processing preferences</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSaveSettings} className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="default-payment-method">Default Payment Method</Label>
                                            <Select defaultValue="cash">
                                                <SelectTrigger id="default-payment-method" className="bg-slate-700 border-slate-600">
                                                    <SelectValue placeholder="Select default method" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                                    <SelectItem value="cash">Cash</SelectItem>
                                                    <SelectItem value="card">Credit/Debit Card</SelectItem>
                                                    <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                                                    <SelectItem value="e-wallet">E-Wallet</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="currency-display">Currency Display</Label>
                                            <Select defaultValue="peso">
                                                <SelectTrigger id="currency-display" className="bg-slate-700 border-slate-600">
                                                    <SelectValue placeholder="Select currency format" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                                    <SelectItem value="peso">Philippine Peso (₱)</SelectItem>
                                                    <SelectItem value="usd">US Dollar ($)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm">Confirm large payments</p>
                                                    <p className="text-xs text-gray-400">Require confirmation for payments over ₱50,000</p>
                                                </div>
                                                <Switch id="confirm-large" defaultChecked className="cursor-pointer" />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm">Quick payment shortcuts</p>
                                                    <p className="text-xs text-gray-400">Enable keyboard shortcuts for faster processing</p>
                                                </div>
                                                <Switch id="shortcuts" defaultChecked className="cursor-pointer" />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm">Sound notifications</p>
                                                    <p className="text-xs text-gray-400">Play sound when payment is completed</p>
                                                </div>
                                                <Switch id="sound-notifications" defaultChecked className="cursor-pointer" />
                                            </div>
                                        </div>

                                        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 cursor-pointer">
                                            <Save className="mr-2 h-4 w-4" />
                                            Save Payment Settings
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-800/60 border-slate-700 text-white lg:col-span-2">
                                <CardHeader>
                                    <CardTitle>Shift Management</CardTitle>
                                    <CardDescription className="text-gray-300">Configure your shift and working hours</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSaveSettings} className="space-y-6">
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="shift-start">Shift Start Time</Label>
                                                <Select defaultValue="08:00">
                                                    <SelectTrigger id="shift-start" className="bg-slate-700 border-slate-600">
                                                        <SelectValue placeholder="Select start time" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                                        <SelectItem value="07:00">7:00 AM</SelectItem>
                                                        <SelectItem value="08:00">8:00 AM</SelectItem>
                                                        <SelectItem value="09:00">9:00 AM</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="shift-end">Shift End Time</Label>
                                                <Select defaultValue="17:00">
                                                    <SelectTrigger id="shift-end" className="bg-slate-700 border-slate-600">
                                                        <SelectValue placeholder="Select end time" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                                        <SelectItem value="16:00">4:00 PM</SelectItem>
                                                        <SelectItem value="17:00">5:00 PM</SelectItem>
                                                        <SelectItem value="18:00">6:00 PM</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm">Break reminders</p>
                                                    <p className="text-xs text-gray-400">Remind me to take breaks during long shifts</p>
                                                </div>
                                                <Switch id="break-reminders" defaultChecked className="cursor-pointer" />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm">End-of-shift summary</p>
                                                    <p className="text-xs text-gray-400">Show transaction summary at end of shift</p>
                                                </div>
                                                <Switch id="shift-summary" defaultChecked className="cursor-pointer" />
                                            </div>
                                        </div>

                                        <Button type="submit" className="bg-primary hover:bg-primary/90 cursor-pointer">
                                            <Save className="mr-2 h-4 w-4" />
                                            Save Shift Settings
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="notifications">
                        <Card className="bg-slate-800/60 border-slate-700 text-white">
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Bell className="mr-2 h-5 w-5" />
                                    Notification Preferences
                                </CardTitle>
                                <CardDescription className="text-gray-300">Manage how you receive notifications</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSaveSettings} className="space-y-6">
                                    <div>
                                        <h3 className="mb-4 font-medium">Email Notifications</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p>Daily transaction summary</p>
                                                    <p className="text-sm text-gray-400">Receive daily summary of your transactions</p>
                                                </div>
                                                <Switch id="email-daily-summary" defaultChecked className="cursor-pointer" />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p>Failed transaction alerts</p>
                                                    <p className="text-sm text-gray-400">Get notified when transactions fail</p>
                                                </div>
                                                <Switch id="email-failed-transactions" defaultChecked className="cursor-pointer" />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p>System maintenance notices</p>
                                                    <p className="text-sm text-gray-400">Receive emails about system maintenance</p>
                                                </div>
                                                <Switch id="email-maintenance" defaultChecked className="cursor-pointer" />
                                            </div>
                                        </div>
                                    </div>

                                    <Separator className="bg-slate-700" />

                                    <div>
                                        <h3 className="mb-4 font-medium">In-App Notifications</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p>Payment confirmations</p>
                                                    <p className="text-sm text-gray-400">Show notifications for successful payments</p>
                                                </div>
                                                <Switch id="app-payment-confirmations" defaultChecked className="cursor-pointer" />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p>Queue notifications</p>
                                                    <p className="text-sm text-gray-400">Notifications about student queue status</p>
                                                </div>
                                                <Switch id="app-queue" defaultChecked className="cursor-pointer" />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p>System alerts</p>
                                                    <p className="text-sm text-gray-400">Important system alerts and announcements</p>
                                                </div>
                                                <Switch id="app-system-alerts" defaultChecked className="cursor-pointer" />
                                            </div>
                                        </div>
                                    </div>

                                    <Separator className="bg-slate-700" />

                                    <div>
                                        <h3 className="mb-4 font-medium">Sound Notifications</h3>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="notification-volume">Notification Volume</Label>
                                                <Select defaultValue="medium">
                                                    <SelectTrigger id="notification-volume" className="bg-slate-700 border-slate-600">
                                                        <SelectValue placeholder="Select volume level" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                                        <SelectItem value="off">Off</SelectItem>
                                                        <SelectItem value="low">Low</SelectItem>
                                                        <SelectItem value="medium">Medium</SelectItem>
                                                        <SelectItem value="high">High</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p>Payment success sound</p>
                                                    <p className="text-sm text-gray-400">Play sound when payment is successful</p>
                                                </div>
                                                <Switch id="sound-success" defaultChecked className="cursor-pointer" />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p>Error alert sound</p>
                                                    <p className="text-sm text-gray-400">Play sound when errors occur</p>
                                                </div>
                                                <Switch id="sound-error" defaultChecked className="cursor-pointer" />
                                            </div>
                                        </div>
                                    </div>

                                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90 cursor-pointer">
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Notification Settings
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    )
}
