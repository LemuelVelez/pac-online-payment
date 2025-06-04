"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DateRangePicker } from "@/components/admin/date-range-picker"
import { PaymentChart } from "@/components/dashboard/payment-chart"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
    Download,
    TrendingUp,
    Target,
    AlertTriangle,
    CheckCircle,
    BarChart4,
    Calculator,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    MoreVertical,
    Settings,
} from "lucide-react"

// Mock data for forecasting
const historicalData = [
    { month: "Jan 2023", revenue: 1200000, expenses: 950000, enrollment: 1580 },
    { month: "Feb 2023", revenue: 1450000, expenses: 1100000, enrollment: 1590 },
    { month: "Mar 2023", revenue: 1350000, expenses: 1050000, enrollment: 1575 },
    { month: "Apr 2023", revenue: 1500000, expenses: 1200000, enrollment: 1600 },
    { month: "May 2023", revenue: 1800000, expenses: 1350000, enrollment: 1620 },
    { month: "Jun 2023", revenue: 1700000, expenses: 1300000, enrollment: 1610 },
    { month: "Jul 2023", revenue: 1900000, expenses: 1450000, enrollment: 1630 },
    { month: "Aug 2023", revenue: 2100000, expenses: 1600000, enrollment: 1650 },
]

const forecastData = [
    { month: "Sep 2023", revenue: 2200000, expenses: 1650000, enrollment: 1670, confidence: 95 },
    { month: "Oct 2023", revenue: 2350000, expenses: 1750000, enrollment: 1690, confidence: 90 },
    { month: "Nov 2023", revenue: 2100000, expenses: 1600000, enrollment: 1680, confidence: 85 },
    { month: "Dec 2023", revenue: 1800000, expenses: 1400000, enrollment: 1660, confidence: 80 },
    { month: "Jan 2024", revenue: 2400000, expenses: 1800000, enrollment: 1720, confidence: 75 },
    { month: "Feb 2024", revenue: 2600000, expenses: 1950000, enrollment: 1750, confidence: 70 },
]

// Define the scenario type
type ScenarioKey = "optimistic" | "realistic" | "pessimistic"

const scenarios = {
    optimistic: {
        name: "Optimistic",
        description: "Best case scenario with 15% growth",
        revenueGrowth: 15,
        enrollmentGrowth: 10,
        costIncrease: 5,
        probability: 25,
    },
    realistic: {
        name: "Realistic",
        description: "Expected scenario with 8% growth",
        revenueGrowth: 8,
        enrollmentGrowth: 5,
        costIncrease: 7,
        probability: 50,
    },
    pessimistic: {
        name: "Pessimistic",
        description: "Conservative scenario with 3% growth",
        revenueGrowth: 3,
        enrollmentGrowth: 1,
        costIncrease: 10,
        probability: 25,
    },
} as const

const kpiForecasts = [
    {
        metric: "Total Revenue",
        current: "₱12.5M",
        forecast: "₱14.2M",
        change: "+13.6%",
        trend: "up",
        confidence: 88,
    },
    {
        metric: "Net Profit",
        current: "₱2.8M",
        forecast: "₱3.4M",
        change: "+21.4%",
        trend: "up",
        confidence: 82,
    },
    {
        metric: "Student Enrollment",
        current: "1,650",
        forecast: "1,750",
        change: "+6.1%",
        trend: "up",
        confidence: 91,
    },
    {
        metric: "Collection Rate",
        current: "92.5%",
        forecast: "94.2%",
        change: "+1.8%",
        trend: "up",
        confidence: 85,
    },
]

// Mobile Actions Component
function MobileActions({
    forecastPeriod,
    setForecastPeriod,
}: {
    forecastPeriod: string
    setForecastPeriod: (value: string) => void
}) {
    return (
        <div className="flex items-center gap-2 md:hidden">
            {/* Date Range Picker - Simplified for mobile */}
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="border-slate-600 text-white hover:bg-slate-700">
                        <Calendar className="h-4 w-4" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="bg-slate-800 border-slate-700">
                    <div className="py-4">
                        <h3 className="text-lg font-medium text-white mb-4">Select Date Range</h3>
                        <DateRangePicker />
                    </div>
                </SheetContent>
            </Sheet>

            {/* Forecast Period - Mobile Select */}
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="border-slate-600 text-white hover:bg-slate-700">
                        <Settings className="h-4 w-4" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="bg-slate-800 border-slate-700">
                    <div className="py-4 space-y-4">
                        <h3 className="text-lg font-medium text-white mb-4">Forecast Settings</h3>
                        <div>
                            <Label htmlFor="mobile-period" className="text-white">
                                Forecast Period
                            </Label>
                            <Select value={forecastPeriod} onValueChange={setForecastPeriod}>
                                <SelectTrigger id="mobile-period" className="bg-slate-700 border-slate-600 text-white mt-2">
                                    <SelectValue placeholder="Period" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                    <SelectItem value="3-months">3 Months</SelectItem>
                                    <SelectItem value="6-months">6 Months</SelectItem>
                                    <SelectItem value="12-months">12 Months</SelectItem>
                                    <SelectItem value="24-months">24 Months</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Actions Menu */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="border-slate-600 text-white hover:bg-slate-700">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 text-white">
                    <DropdownMenuItem className="hover:bg-slate-700">
                        <Download className="mr-2 h-4 w-4" />
                        Export Forecast
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}

// Desktop Actions Component
function DesktopActions({
    forecastPeriod,
    setForecastPeriod,
}: {
    forecastPeriod: string
    setForecastPeriod: (value: string) => void
}) {
    return (
        <div className="hidden md:flex space-x-3">
            <DateRangePicker />
            <Select value={forecastPeriod} onValueChange={setForecastPeriod}>
                <SelectTrigger className="w-[150px] bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600 text-white">
                    <SelectItem value="3-months">3 Months</SelectItem>
                    <SelectItem value="6-months">6 Months</SelectItem>
                    <SelectItem value="12-months">12 Months</SelectItem>
                    <SelectItem value="24-months">24 Months</SelectItem>
                </SelectContent>
            </Select>
            <Button className="bg-primary hover:bg-primary/90">
                <Download className="mr-2 h-4 w-4" />
                Export Forecast
            </Button>
        </div>
    )
}

// Mobile Tabs Component
function MobileTabs({ value, onValueChange }: { value: string; onValueChange: (value: string) => void }) {
    const tabs = [
        { value: "overview", label: "Overview", shortLabel: "Overview" },
        { value: "scenarios", label: "Scenarios", shortLabel: "Scenarios" },
        { value: "models", label: "Models", shortLabel: "Models" },
        { value: "insights", label: "Insights", shortLabel: "Insights" },
    ]

    return (
        <div className="md:hidden mb-6">
            <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex space-x-1 p-1 bg-slate-800 rounded-lg border border-slate-700">
                    {tabs.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => onValueChange(tab.value)}
                            className={`
                                flex-shrink-0 px-4 py-2 text-sm font-medium rounded-md transition-colors
                                ${value === tab.value
                                    ? "bg-slate-700 text-white shadow-sm"
                                    : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                                }
                            `}
                        >
                            {tab.shortLabel}
                        </button>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" className="invisible" />
            </ScrollArea>
        </div>
    )
}

// Desktop Tabs Component
function DesktopTabs() {
    return (
        <TabsList className="hidden md:grid bg-slate-800 border-slate-700 mb-8 w-full grid-cols-4 lg:max-w-[600px]">
            <TabsTrigger value="overview" className="cursor-pointer">
                Overview
            </TabsTrigger>
            <TabsTrigger value="scenarios" className="cursor-pointer">
                Scenarios
            </TabsTrigger>
            <TabsTrigger value="models" className="cursor-pointer">
                Models
            </TabsTrigger>
            <TabsTrigger value="insights" className="cursor-pointer">
                Insights
            </TabsTrigger>
        </TabsList>
    )
}

export default function ForecastingPage() {
    // Type the state with the ScenarioKey type
    const [selectedScenario, setSelectedScenario] = useState<ScenarioKey>("realistic")
    const [forecastPeriod, setForecastPeriod] = useState("6-months")
    const [confidenceLevel, setConfidenceLevel] = useState([80])
    const [activeTab, setActiveTab] = useState("overview")

    return (
        <DashboardLayout allowedRoles={["business-office"]}>
            <div className="container mx-auto px-4 py-8">
                {/* Header Section with Mobile-Optimized Actions */}
                <div className="mb-8 flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Financial Forecasting</h1>
                        <p className="text-gray-300">Predict future financial performance and trends</p>
                    </div>

                    {/* Mobile Actions */}
                    <MobileActions forecastPeriod={forecastPeriod} setForecastPeriod={setForecastPeriod} />

                    {/* Desktop Actions */}
                    <DesktopActions forecastPeriod={forecastPeriod} setForecastPeriod={setForecastPeriod} />
                </div>

                {/* KPI Forecast Cards - Mobile Optimized */}
                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {kpiForecasts.map((kpi, index) => (
                        <Card key={index} className="bg-slate-800/60 border-slate-700 text-white">
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex items-center justify-between">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm text-gray-400 truncate">{kpi.metric}</p>
                                        <p className="text-lg sm:text-xl font-bold">{kpi.forecast}</p>
                                        <p className="text-xs text-gray-400">Current: {kpi.current}</p>
                                    </div>
                                    <div className="flex flex-col items-end ml-2">
                                        <div className={`rounded-full p-2 ${kpi.trend === "up" ? "bg-green-500/20" : "bg-red-500/20"}`}>
                                            {kpi.trend === "up" ? (
                                                <ArrowUpRight className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <ArrowDownRight className="h-4 w-4 text-red-500" />
                                            )}
                                        </div>
                                        <span className={`text-sm ${kpi.trend === "up" ? "text-green-500" : "text-red-500"}`}>
                                            {kpi.change}
                                        </span>
                                        <span className="text-xs text-gray-400">{kpi.confidence}% confidence</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    {/* Mobile Tabs */}
                    <MobileTabs value={activeTab} onValueChange={setActiveTab} />

                    {/* Desktop Tabs */}
                    <DesktopTabs />

                    <TabsContent value="overview">
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                <Card className="bg-slate-800/60 border-slate-700 text-white">
                                    <CardHeader>
                                        <CardTitle>Revenue Forecast</CardTitle>
                                        <CardDescription className="text-gray-300">Historical data and 6-month projection</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-64 sm:h-80">
                                            <PaymentChart
                                                data={[...historicalData, ...forecastData].map((item) => ({
                                                    month: item.month.split(" ")[0],
                                                    amount: item.revenue,
                                                }))}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-slate-800/60 border-slate-700 text-white">
                                    <CardHeader>
                                        <CardTitle>Enrollment Forecast</CardTitle>
                                        <CardDescription className="text-gray-300">Student enrollment projections</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-64 sm:h-80">
                                            <PaymentChart
                                                data={[...historicalData, ...forecastData].map((item) => ({
                                                    month: item.month.split(" ")[0],
                                                    amount: item.enrollment,
                                                }))}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                <Card className="bg-slate-800/60 border-slate-700 text-white">
                                    <CardHeader>
                                        <CardTitle>Forecast Accuracy</CardTitle>
                                        <CardDescription className="text-gray-300">Model performance metrics</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm text-gray-400">Revenue Accuracy</span>
                                                <span className="text-sm font-medium">94.2%</span>
                                            </div>
                                            <Progress value={94.2} className="h-2 bg-slate-700" />
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm text-gray-400">Enrollment Accuracy</span>
                                                <span className="text-sm font-medium">91.8%</span>
                                            </div>
                                            <Progress value={91.8} className="h-2 bg-slate-700" />
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm text-gray-400">Expense Accuracy</span>
                                                <span className="text-sm font-medium">88.5%</span>
                                            </div>
                                            <Progress value={88.5} className="h-2 bg-slate-700" />
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm text-gray-400">Overall Confidence</span>
                                                <span className="text-sm font-medium">91.5%</span>
                                            </div>
                                            <Progress value={91.5} className="h-2 bg-slate-700" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-slate-800/60 border-slate-700 text-white">
                                    <CardHeader>
                                        <CardTitle>Key Assumptions</CardTitle>
                                        <CardDescription className="text-gray-300">Forecast assumptions</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Inflation Rate</span>
                                            <span className="text-green-500">3.5%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Market Growth</span>
                                            <span className="text-blue-500">5.2%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Competition Impact</span>
                                            <span className="text-amber-500">-2.1%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Economic Stability</span>
                                            <span className="text-green-500">Stable</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Regulatory Changes</span>
                                            <span className="text-green-500">Minimal</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-slate-800/60 border-slate-700 text-white">
                                    <CardHeader>
                                        <CardTitle>Risk Factors</CardTitle>
                                        <CardDescription className="text-gray-300">Potential forecast risks</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <Alert className="bg-red-500/20 border-red-500/50 text-red-200">
                                            <AlertTriangle className="h-4 w-4" />
                                            <AlertDescription className="text-xs">
                                                Economic downturn could reduce enrollment by 15%
                                            </AlertDescription>
                                        </Alert>
                                        <Alert className="bg-amber-500/20 border-amber-500/50 text-amber-200">
                                            <AlertTriangle className="h-4 w-4" />
                                            <AlertDescription className="text-xs">New competition may impact revenue by 8%</AlertDescription>
                                        </Alert>
                                        <Alert className="bg-blue-500/20 border-blue-500/50 text-blue-200">
                                            <CheckCircle className="h-4 w-4" />
                                            <AlertDescription className="text-xs">
                                                Digital transformation opportunities identified
                                            </AlertDescription>
                                        </Alert>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="scenarios">
                        <div className="space-y-6">
                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Scenario Planning</CardTitle>
                                    <CardDescription className="text-gray-300">
                                        Compare different forecast scenarios and their outcomes
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                                        {Object.entries(scenarios).map(([key, scenario]) => (
                                            <div
                                                key={key}
                                                className={`rounded-lg border p-4 sm:p-6 cursor-pointer transition-colors ${selectedScenario === key
                                                    ? "border-primary bg-primary/10"
                                                    : "border-slate-700 hover:border-slate-600"
                                                    }`}
                                                onClick={() => setSelectedScenario(key as ScenarioKey)}
                                            >
                                                <div className="mb-4">
                                                    <h3 className="text-lg font-medium">{scenario.name}</h3>
                                                    <p className="text-sm text-gray-400">{scenario.description}</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-gray-400">Revenue Growth</span>
                                                        <span className="text-sm text-green-500">+{scenario.revenueGrowth}%</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-gray-400">Enrollment Growth</span>
                                                        <span className="text-sm text-blue-500">+{scenario.enrollmentGrowth}%</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-gray-400">Cost Increase</span>
                                                        <span className="text-sm text-red-500">+{scenario.costIncrease}%</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-gray-400">Probability</span>
                                                        <span className="text-sm">{scenario.probability}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Scenario Comparison</CardTitle>
                                    <CardDescription className="text-gray-300">
                                        Financial impact of selected scenario: {scenarios[selectedScenario].name}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-medium">Financial Projections</h3>
                                            <div className="space-y-3">
                                                <div className="rounded-lg bg-slate-700/50 p-4">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-400">Projected Revenue</span>
                                                        <span className="text-lg sm:text-xl font-bold text-green-500">
                                                            ₱
                                                            {((12500000 * (1 + scenarios[selectedScenario].revenueGrowth / 100)) / 1000000).toFixed(
                                                                1,
                                                            )}
                                                            M
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-400">
                                                        vs Current: ₱12.5M (+
                                                        {((12500000 * (scenarios[selectedScenario].revenueGrowth / 100)) / 1000000).toFixed(1)}M)
                                                    </p>
                                                </div>
                                                <div className="rounded-lg bg-slate-700/50 p-4">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-400">Projected Expenses</span>
                                                        <span className="text-lg sm:text-xl font-bold text-red-500">
                                                            ₱{((9700000 * (1 + scenarios[selectedScenario].costIncrease / 100)) / 1000000).toFixed(1)}
                                                            M
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-400">
                                                        vs Current: ₱9.7M (+
                                                        {((9700000 * (scenarios[selectedScenario].costIncrease / 100)) / 1000000).toFixed(1)}M)
                                                    </p>
                                                </div>
                                                <div className="rounded-lg bg-slate-700/50 p-4">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-400">Net Profit</span>
                                                        <span className="text-lg sm:text-xl font-bold text-blue-500">
                                                            ₱
                                                            {(
                                                                (12500000 * (1 + scenarios[selectedScenario].revenueGrowth / 100) -
                                                                    9700000 * (1 + scenarios[selectedScenario].costIncrease / 100)) /
                                                                1000000
                                                            ).toFixed(1)}
                                                            M
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-400">
                                                        Profit Margin:{" "}
                                                        {(
                                                            ((12500000 * (1 + scenarios[selectedScenario].revenueGrowth / 100) -
                                                                9700000 * (1 + scenarios[selectedScenario].costIncrease / 100)) /
                                                                (12500000 * (1 + scenarios[selectedScenario].revenueGrowth / 100))) *
                                                            100
                                                        ).toFixed(1)}
                                                        %
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-lg font-medium">Operational Impact</h3>
                                            <div className="space-y-3">
                                                <div className="rounded-lg bg-slate-700/50 p-4">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-400">Student Enrollment</span>
                                                        <span className="text-lg sm:text-xl font-bold text-purple-500">
                                                            {Math.round(1650 * (1 + scenarios[selectedScenario].enrollmentGrowth / 100))}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-400">
                                                        vs Current: 1,650 (+
                                                        {Math.round(1650 * (scenarios[selectedScenario].enrollmentGrowth / 100))})
                                                    </p>
                                                </div>
                                                <div className="rounded-lg bg-slate-700/50 p-4">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-400">Revenue per Student</span>
                                                        <span className="text-lg sm:text-xl font-bold text-amber-500">
                                                            ₱
                                                            {Math.round(
                                                                (12500000 * (1 + scenarios[selectedScenario].revenueGrowth / 100)) /
                                                                (1650 * (1 + scenarios[selectedScenario].enrollmentGrowth / 100)),
                                                            ).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-400">vs Current: ₱7,576</p>
                                                </div>
                                                <div className="rounded-lg bg-slate-700/50 p-4">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-400">Capacity Utilization</span>
                                                        <span className="text-lg sm:text-xl font-bold text-cyan-500">
                                                            {(
                                                                ((1650 * (1 + scenarios[selectedScenario].enrollmentGrowth / 100)) / 1900) *
                                                                100
                                                            ).toFixed(1)}
                                                            %
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-400">vs Current: 86.8%</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="models">
                        <div className="space-y-6">
                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Forecasting Models</CardTitle>
                                    <CardDescription className="text-gray-300">Configure and tune forecasting models</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-medium">Model Parameters</h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <Label htmlFor="confidence-level">Confidence Level: {confidenceLevel[0]}%</Label>
                                                    <Slider
                                                        id="confidence-level"
                                                        min={50}
                                                        max={99}
                                                        step={1}
                                                        value={confidenceLevel}
                                                        onValueChange={setConfidenceLevel}
                                                        className="mt-2"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="seasonality">Seasonality Factor</Label>
                                                    <Select defaultValue="high">
                                                        <SelectTrigger id="seasonality" className="bg-slate-700 border-slate-600">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                                            <SelectItem value="low">Low</SelectItem>
                                                            <SelectItem value="medium">Medium</SelectItem>
                                                            <SelectItem value="high">High</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label htmlFor="trend-strength">Trend Strength</Label>
                                                    <Select defaultValue="moderate">
                                                        <SelectTrigger id="trend-strength" className="bg-slate-700 border-slate-600">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                                            <SelectItem value="weak">Weak</SelectItem>
                                                            <SelectItem value="moderate">Moderate</SelectItem>
                                                            <SelectItem value="strong">Strong</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label htmlFor="external-factors">External Factors Weight</Label>
                                                    <Input
                                                        id="external-factors"
                                                        type="number"
                                                        defaultValue="0.3"
                                                        min="0"
                                                        max="1"
                                                        step="0.1"
                                                        className="bg-slate-700 border-slate-600"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-lg font-medium">Model Performance</h3>
                                            <div className="space-y-4">
                                                <div className="rounded-lg border border-slate-700 p-4">
                                                    <h4 className="font-medium mb-2">Linear Regression</h4>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between">
                                                            <span className="text-sm text-gray-400">Accuracy</span>
                                                            <span className="text-sm text-green-500">89.2%</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-sm text-gray-400">RMSE</span>
                                                            <span className="text-sm">₱125,000</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-sm text-gray-400">Status</span>
                                                            <span className="text-sm text-green-500">Active</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="rounded-lg border border-slate-700 p-4">
                                                    <h4 className="font-medium mb-2">ARIMA</h4>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between">
                                                            <span className="text-sm text-gray-400">Accuracy</span>
                                                            <span className="text-sm text-blue-500">92.1%</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-sm text-gray-400">RMSE</span>
                                                            <span className="text-sm">₱98,000</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-sm text-gray-400">Status</span>
                                                            <span className="text-sm text-blue-500">Primary</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="rounded-lg border border-slate-700 p-4">
                                                    <h4 className="font-medium mb-2">Neural Network</h4>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between">
                                                            <span className="text-sm text-gray-400">Accuracy</span>
                                                            <span className="text-sm text-purple-500">94.7%</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-sm text-gray-400">RMSE</span>
                                                            <span className="text-sm">₱76,000</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-sm text-gray-400">Status</span>
                                                            <span className="text-sm text-amber-500">Testing</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-slate-700">
                                        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                                            <div>
                                                <h3 className="text-lg font-medium">Model Training</h3>
                                                <p className="text-sm text-gray-400">Retrain models with latest data</p>
                                            </div>
                                            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                                                <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                                                    <Calculator className="mr-2 h-4 w-4" />
                                                    Validate Models
                                                </Button>
                                                <Button className="bg-primary hover:bg-primary/90">
                                                    <BarChart4 className="mr-2 h-4 w-4" />
                                                    Retrain Models
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="insights">
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                <Card className="bg-slate-800/60 border-slate-700 text-white">
                                    <CardHeader>
                                        <CardTitle>Key Insights</CardTitle>
                                        <CardDescription className="text-gray-300">AI-generated forecast insights</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <Alert className="bg-green-500/20 border-green-500/50 text-green-200">
                                            <TrendingUp className="h-4 w-4" />
                                            <AlertDescription>
                                                Revenue is projected to grow 13.6% over the next 6 months, driven by increased enrollment in
                                                technology programs.
                                            </AlertDescription>
                                        </Alert>
                                        <Alert className="bg-blue-500/20 border-blue-500/50 text-blue-200">
                                            <Target className="h-4 w-4" />
                                            <AlertDescription>
                                                Student retention rate is expected to improve to 94.2%, indicating strong program satisfaction.
                                            </AlertDescription>
                                        </Alert>
                                        <Alert className="bg-amber-500/20 border-amber-500/50 text-amber-200">
                                            <AlertTriangle className="h-4 w-4" />
                                            <AlertDescription>
                                                Operating costs may increase by 7% due to inflation and facility expansion requirements.
                                            </AlertDescription>
                                        </Alert>
                                        <Alert className="bg-purple-500/20 border-purple-500/50 text-purple-200">
                                            <CheckCircle className="h-4 w-4" />
                                            <AlertDescription>
                                                Digital payment adoption is accelerating, reducing processing costs by an estimated 12%.
                                            </AlertDescription>
                                        </Alert>
                                    </CardContent>
                                </Card>

                                <Card className="bg-slate-800/60 border-slate-700 text-white">
                                    <CardHeader>
                                        <CardTitle>Recommendations</CardTitle>
                                        <CardDescription className="text-gray-300">
                                            Strategic recommendations based on forecasts
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="rounded-lg bg-slate-700/50 p-4">
                                            <h4 className="font-medium text-green-400 mb-2">Revenue Optimization</h4>
                                            <p className="text-sm text-gray-300">
                                                Consider increasing capacity for high-demand programs to capture additional revenue of ₱1.2M.
                                            </p>
                                        </div>
                                        <div className="rounded-lg bg-slate-700/50 p-4">
                                            <h4 className="font-medium text-blue-400 mb-2">Cost Management</h4>
                                            <p className="text-sm text-gray-300">
                                                Implement energy-efficient systems to offset 15% of projected utility cost increases.
                                            </p>
                                        </div>
                                        <div className="rounded-lg bg-slate-700/50 p-4">
                                            <h4 className="font-medium text-purple-400 mb-2">Technology Investment</h4>
                                            <p className="text-sm text-gray-300">
                                                Invest in online learning platforms to capture remote student market worth ₱800K annually.
                                            </p>
                                        </div>
                                        <div className="rounded-lg bg-slate-700/50 p-4">
                                            <h4 className="font-medium text-amber-400 mb-2">Risk Mitigation</h4>
                                            <p className="text-sm text-gray-300">
                                                Establish contingency fund of ₱500K to handle potential enrollment fluctuations.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Action Plan</CardTitle>
                                    <CardDescription className="text-gray-300">
                                        Recommended actions based on forecast analysis
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        <div className="rounded-lg border border-slate-700 p-4">
                                            <div className="flex items-center mb-3">
                                                <Calendar className="h-5 w-5 text-green-500 mr-2" />
                                                <h3 className="font-medium">Short Term (1-3 months)</h3>
                                            </div>
                                            <ul className="space-y-2 text-sm text-gray-300">
                                                <li>• Optimize current course capacity</li>
                                                <li>• Implement cost control measures</li>
                                                <li>• Launch digital payment incentives</li>
                                                <li>• Review pricing strategy</li>
                                            </ul>
                                        </div>

                                        <div className="rounded-lg border border-slate-700 p-4">
                                            <div className="flex items-center mb-3">
                                                <Target className="h-5 w-5 text-blue-500 mr-2" />
                                                <h3 className="font-medium">Medium Term (3-6 months)</h3>
                                            </div>
                                            <ul className="space-y-2 text-sm text-gray-300">
                                                <li>• Expand high-demand programs</li>
                                                <li>• Invest in technology infrastructure</li>
                                                <li>• Develop online course offerings</li>
                                                <li>• Enhance student retention programs</li>
                                            </ul>
                                        </div>

                                        <div className="rounded-lg border border-slate-700 p-4">
                                            <div className="flex items-center mb-3">
                                                <BarChart4 className="h-5 w-5 text-purple-500 mr-2" />
                                                <h3 className="font-medium">Long Term (6+ months)</h3>
                                            </div>
                                            <ul className="space-y-2 text-sm text-gray-300">
                                                <li>• Consider facility expansion</li>
                                                <li>• Explore new revenue streams</li>
                                                <li>• Develop strategic partnerships</li>
                                                <li>• Implement advanced analytics</li>
                                            </ul>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    )
}
