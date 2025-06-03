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
import { Textarea } from "@/components/ui/textarea"
import { Check, Info, Lock, Save, Shield, User, Building, Bell, Database, Mail } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function BusinessOfficeSettingsPage() {
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
        <DashboardLayout allowedRoles={["business-office"]}>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white">Business Office Settings</h1>
                    <p className="text-gray-300">Manage your account and business office preferences</p>
                </div>

                <Tabs defaultValue="account" className="w-full">
                    <TabsList className="bg-slate-800 border-slate-700 mb-8 grid w-full grid-cols-4 lg:max-w-[800px]">
                        <TabsTrigger value="account" className="cursor-pointer">
                            Account
                        </TabsTrigger>
                        <TabsTrigger value="financial" className="cursor-pointer">
                            Financial
                        </TabsTrigger>
                        <TabsTrigger value="notifications" className="cursor-pointer">
                            Notifications
                        </TabsTrigger>
                        <TabsTrigger value="system" className="cursor-pointer">
                            System
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
                                    {settingsSaved && (
                                        <Alert className="mb-6 bg-green-500/20 border-green-500/50 text-green-200">
                                            <Check className="h-4 w-4" />
                                            <AlertDescription>Settings have been saved successfully!</AlertDescription>
                                        </Alert>
                                    )}
                                    <form onSubmit={handleSaveSettings} className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="employee-id">Employee ID</Label>
                                            <Input
                                                id="employee-id"
                                                defaultValue="BO-001"
                                                className="bg-slate-700 border-slate-600"
                                                readOnly
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="full-name">Full Name</Label>
                                            <Input id="full-name" defaultValue="Sarah Johnson" className="bg-slate-700 border-slate-600" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email Address</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                defaultValue="sarah.johnson@pacsalug.edu.ph"
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
                                                defaultValue="Business Office"
                                                className="bg-slate-700 border-slate-600"
                                                readOnly
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="position">Position</Label>
                                            <Input id="position" defaultValue="Financial Manager" className="bg-slate-700 border-slate-600" />
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
                                                <p className="text-sm">Two-Factor Authentication</p>
                                                <p className="text-xs text-gray-400">Add extra security to your account</p>
                                            </div>
                                            <Switch id="two-factor" className="cursor-pointer" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm">Auto-logout after inactivity</p>
                                                <p className="text-xs text-gray-400">Automatically log out after 30 minutes</p>
                                            </div>
                                            <Switch id="auto-logout" defaultChecked className="cursor-pointer" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm">Login notifications</p>
                                                <p className="text-xs text-gray-400">Receive alerts for account access</p>
                                            </div>
                                            <Switch id="login-alerts" defaultChecked className="cursor-pointer" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="financial">
                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Building className="mr-2 h-5 w-5" />
                                        Financial Preferences
                                    </CardTitle>
                                    <CardDescription className="text-gray-300">
                                        Configure financial settings and preferences
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSaveSettings} className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="default-currency">Default Currency</Label>
                                            <Select defaultValue="php">
                                                <SelectTrigger id="default-currency" className="bg-slate-700 border-slate-600">
                                                    <SelectValue placeholder="Select currency" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                                    <SelectItem value="php">Philippine Peso (₱)</SelectItem>
                                                    <SelectItem value="usd">US Dollar ($)</SelectItem>
                                                    <SelectItem value="eur">Euro (€)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="fiscal-year">Fiscal Year Start</Label>
                                            <Select defaultValue="january">
                                                <SelectTrigger id="fiscal-year" className="bg-slate-700 border-slate-600">
                                                    <SelectValue placeholder="Select month" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                                    <SelectItem value="january">January</SelectItem>
                                                    <SelectItem value="april">April</SelectItem>
                                                    <SelectItem value="july">July</SelectItem>
                                                    <SelectItem value="october">October</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="decimal-places">Decimal Places</Label>
                                            <Select defaultValue="2">
                                                <SelectTrigger id="decimal-places" className="bg-slate-700 border-slate-600">
                                                    <SelectValue placeholder="Select decimal places" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                                    <SelectItem value="0">0</SelectItem>
                                                    <SelectItem value="2">2</SelectItem>
                                                    <SelectItem value="4">4</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="font-medium">Approval Workflows</h3>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm">Require approval for expenses over</p>
                                                    <p className="text-xs text-gray-400">Set threshold for expense approvals</p>
                                                </div>
                                                <Input
                                                    defaultValue="50000"
                                                    className="w-32 bg-slate-700 border-slate-600"
                                                    placeholder="Amount"
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm">Auto-approve recurring expenses</p>
                                                    <p className="text-xs text-gray-400">Automatically approve known recurring expenses</p>
                                                </div>
                                                <Switch id="auto-approve" defaultChecked className="cursor-pointer" />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm">Multi-level approval</p>
                                                    <p className="text-xs text-gray-400">Require multiple approvals for large expenses</p>
                                                </div>
                                                <Switch id="multi-approval" className="cursor-pointer" />
                                            </div>
                                        </div>

                                        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 cursor-pointer">
                                            <Save className="mr-2 h-4 w-4" />
                                            Save Financial Settings
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Database className="mr-2 h-5 w-5" />
                                        Reporting & Analytics
                                    </CardTitle>
                                    <CardDescription className="text-gray-300">Configure reporting preferences</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSaveSettings} className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="report-frequency">Default Report Frequency</Label>
                                            <Select defaultValue="monthly">
                                                <SelectTrigger id="report-frequency" className="bg-slate-700 border-slate-600">
                                                    <SelectValue placeholder="Select frequency" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                                    <SelectItem value="daily">Daily</SelectItem>
                                                    <SelectItem value="weekly">Weekly</SelectItem>
                                                    <SelectItem value="monthly">Monthly</SelectItem>
                                                    <SelectItem value="quarterly">Quarterly</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="chart-type">Default Chart Type</Label>
                                            <Select defaultValue="line">
                                                <SelectTrigger id="chart-type" className="bg-slate-700 border-slate-600">
                                                    <SelectValue placeholder="Select chart type" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                                    <SelectItem value="line">Line Chart</SelectItem>
                                                    <SelectItem value="bar">Bar Chart</SelectItem>
                                                    <SelectItem value="pie">Pie Chart</SelectItem>
                                                    <SelectItem value="area">Area Chart</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="font-medium">Automated Reports</h3>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm">Monthly financial summary</p>
                                                    <p className="text-xs text-gray-400">Generate monthly financial reports automatically</p>
                                                </div>
                                                <Switch id="monthly-reports" defaultChecked className="cursor-pointer" />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm">Budget variance alerts</p>
                                                    <p className="text-xs text-gray-400">Alert when budget variance exceeds threshold</p>
                                                </div>
                                                <Switch id="variance-alerts" defaultChecked className="cursor-pointer" />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm">Expense trend analysis</p>
                                                    <p className="text-xs text-gray-400">Weekly expense trend reports</p>
                                                </div>
                                                <Switch id="trend-analysis" className="cursor-pointer" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="report-recipients">Report Recipients</Label>
                                            <Textarea
                                                id="report-recipients"
                                                placeholder="Enter email addresses separated by commas"
                                                className="bg-slate-700 border-slate-600"
                                                defaultValue="director@pacsalug.edu.ph, finance@pacsalug.edu.ph"
                                            />
                                        </div>

                                        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 cursor-pointer">
                                            <Save className="mr-2 h-4 w-4" />
                                            Save Reporting Settings
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
                                                    <p>Budget alerts</p>
                                                    <p className="text-sm text-gray-400">Receive alerts when budgets exceed thresholds</p>
                                                </div>
                                                <Switch id="email-budget-alerts" defaultChecked className="cursor-pointer" />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p>Expense approvals</p>
                                                    <p className="text-sm text-gray-400">Get notified when expenses need approval</p>
                                                </div>
                                                <Switch id="email-expense-approvals" defaultChecked className="cursor-pointer" />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p>Financial reports</p>
                                                    <p className="text-sm text-gray-400">Receive automated financial reports</p>
                                                </div>
                                                <Switch id="email-reports" defaultChecked className="cursor-pointer" />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p>Payment confirmations</p>
                                                    <p className="text-sm text-gray-400">Notifications for payment transactions</p>
                                                </div>
                                                <Switch id="email-payments" defaultChecked className="cursor-pointer" />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p>System maintenance</p>
                                                    <p className="text-sm text-gray-400">Alerts about system updates and maintenance</p>
                                                </div>
                                                <Switch id="email-maintenance" className="cursor-pointer" />
                                            </div>
                                        </div>
                                    </div>

                                    <Separator className="bg-slate-700" />

                                    <div>
                                        <h3 className="mb-4 font-medium">In-App Notifications</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p>Real-time alerts</p>
                                                    <p className="text-sm text-gray-400">Show notifications for urgent financial matters</p>
                                                </div>
                                                <Switch id="app-realtime" defaultChecked className="cursor-pointer" />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p>Dashboard updates</p>
                                                    <p className="text-sm text-gray-400">Notifications when dashboard data is updated</p>
                                                </div>
                                                <Switch id="app-dashboard" defaultChecked className="cursor-pointer" />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p>Reconciliation alerts</p>
                                                    <p className="text-sm text-gray-400">Alerts for bank reconciliation discrepancies</p>
                                                </div>
                                                <Switch id="app-reconciliation" defaultChecked className="cursor-pointer" />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p>Collection reminders</p>
                                                    <p className="text-sm text-gray-400">Reminders for outstanding collections</p>
                                                </div>
                                                <Switch id="app-collections" defaultChecked className="cursor-pointer" />
                                            </div>
                                        </div>
                                    </div>

                                    <Separator className="bg-slate-700" />

                                    <div>
                                        <h3 className="mb-4 font-medium">Notification Timing</h3>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="quiet-hours-start">Quiet Hours Start</Label>
                                                <Select defaultValue="22:00">
                                                    <SelectTrigger id="quiet-hours-start" className="bg-slate-700 border-slate-600">
                                                        <SelectValue placeholder="Select time" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                                        <SelectItem value="20:00">8:00 PM</SelectItem>
                                                        <SelectItem value="21:00">9:00 PM</SelectItem>
                                                        <SelectItem value="22:00">10:00 PM</SelectItem>
                                                        <SelectItem value="23:00">11:00 PM</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="quiet-hours-end">Quiet Hours End</Label>
                                                <Select defaultValue="07:00">
                                                    <SelectTrigger id="quiet-hours-end" className="bg-slate-700 border-slate-600">
                                                        <SelectValue placeholder="Select time" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                                        <SelectItem value="06:00">6:00 AM</SelectItem>
                                                        <SelectItem value="07:00">7:00 AM</SelectItem>
                                                        <SelectItem value="08:00">8:00 AM</SelectItem>
                                                        <SelectItem value="09:00">9:00 AM</SelectItem>
                                                    </SelectContent>
                                                </Select>
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

                    <TabsContent value="system">
                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>System Preferences</CardTitle>
                                    <CardDescription className="text-gray-300">Configure system-wide settings</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSaveSettings} className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="timezone">Timezone</Label>
                                            <Select defaultValue="asia-manila">
                                                <SelectTrigger id="timezone" className="bg-slate-700 border-slate-600">
                                                    <SelectValue placeholder="Select timezone" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                                    <SelectItem value="asia-manila">Asia/Manila (GMT+8)</SelectItem>
                                                    <SelectItem value="america-new_york">America/New_York (GMT-4)</SelectItem>
                                                    <SelectItem value="europe-london">Europe/London (GMT+1)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="date-format">Date Format</Label>
                                            <Select defaultValue="mm-dd-yyyy">
                                                <SelectTrigger id="date-format" className="bg-slate-700 border-slate-600">
                                                    <SelectValue placeholder="Select date format" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                                    <SelectItem value="mm-dd-yyyy">MM/DD/YYYY</SelectItem>
                                                    <SelectItem value="dd-mm-yyyy">DD/MM/YYYY</SelectItem>
                                                    <SelectItem value="yyyy-mm-dd">YYYY/MM/DD</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="number-format">Number Format</Label>
                                            <Select defaultValue="1234.56">
                                                <SelectTrigger id="number-format" className="bg-slate-700 border-slate-600">
                                                    <SelectValue placeholder="Select number format" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                                    <SelectItem value="1234.56">1,234.56</SelectItem>
                                                    <SelectItem value="1234,56">1.234,56</SelectItem>
                                                    <SelectItem value="1 234.56">1 234.56</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="font-medium">Data Management</h3>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm">Auto-backup data</p>
                                                    <p className="text-xs text-gray-400">Automatically backup financial data daily</p>
                                                </div>
                                                <Switch id="auto-backup" defaultChecked className="cursor-pointer" />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm">Data retention</p>
                                                    <p className="text-xs text-gray-400">Keep transaction data for 7 years</p>
                                                </div>
                                                <Switch id="data-retention" defaultChecked className="cursor-pointer" />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm">Audit logging</p>
                                                    <p className="text-xs text-gray-400">Log all financial transactions and changes</p>
                                                </div>
                                                <Switch id="audit-logging" defaultChecked className="cursor-pointer" />
                                            </div>
                                        </div>

                                        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 cursor-pointer">
                                            <Save className="mr-2 h-4 w-4" />
                                            Save System Settings
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Mail className="mr-2 h-5 w-5" />
                                        Integration Settings
                                    </CardTitle>
                                    <CardDescription className="text-gray-300">Configure external integrations</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSaveSettings} className="space-y-6">
                                        <div className="space-y-4">
                                            <h3 className="font-medium">Banking Integration</h3>
                                            <div className="space-y-2">
                                                <Label htmlFor="bank-api">Bank API Endpoint</Label>
                                                <Input
                                                    id="bank-api"
                                                    defaultValue="https://api.bank.com/v1"
                                                    className="bg-slate-700 border-slate-600"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="bank-key">API Key</Label>
                                                <Input
                                                    id="bank-key"
                                                    type="password"
                                                    defaultValue="••••••••••••••••"
                                                    className="bg-slate-700 border-slate-600"
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm">Auto-sync transactions</p>
                                                    <p className="text-xs text-gray-400">Automatically sync bank transactions daily</p>
                                                </div>
                                                <Switch id="auto-sync" defaultChecked className="cursor-pointer" />
                                            </div>
                                        </div>

                                        <Separator className="bg-slate-700" />

                                        <div className="space-y-4">
                                            <h3 className="font-medium">Accounting Software</h3>
                                            <div className="space-y-2">
                                                <Label htmlFor="accounting-system">System</Label>
                                                <Select defaultValue="quickbooks">
                                                    <SelectTrigger id="accounting-system" className="bg-slate-700 border-slate-600">
                                                        <SelectValue placeholder="Select system" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                                        <SelectItem value="quickbooks">QuickBooks</SelectItem>
                                                        <SelectItem value="xero">Xero</SelectItem>
                                                        <SelectItem value="sage">Sage</SelectItem>
                                                        <SelectItem value="none">None</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm">Export transactions</p>
                                                    <p className="text-xs text-gray-400">Export to accounting software weekly</p>
                                                </div>
                                                <Switch id="export-transactions" className="cursor-pointer" />
                                            </div>
                                        </div>

                                        <Separator className="bg-slate-700" />

                                        <div className="space-y-4">
                                            <h3 className="font-medium">Payment Gateways</h3>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm">PayPal Integration</p>
                                                    <p className="text-xs text-gray-400">Enable PayPal payment processing</p>
                                                </div>
                                                <Switch id="paypal" defaultChecked className="cursor-pointer" />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm">Stripe Integration</p>
                                                    <p className="text-xs text-gray-400">Enable Stripe payment processing</p>
                                                </div>
                                                <Switch id="stripe" defaultChecked className="cursor-pointer" />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm">GCash Integration</p>
                                                    <p className="text-xs text-gray-400">Enable GCash payment processing</p>
                                                </div>
                                                <Switch id="gcash" defaultChecked className="cursor-pointer" />
                                            </div>
                                        </div>

                                        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 cursor-pointer">
                                            <Save className="mr-2 h-4 w-4" />
                                            Save Integration Settings
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    )
}
