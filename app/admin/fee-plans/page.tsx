// app\admin\fee-plans\page.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
    VisibilityState,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, Copy, Edit, Eye, MoreHorizontal, Plus, Trash2, X } from "lucide-react"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Item, ItemContent, ItemMedia, ItemTitle } from "@/components/ui/item"
import { Spinner } from "@/components/ui/spinner"

/* =========================================================
   Types & Helpers
========================================================= */

type FeeItem = { id: string; name: string; amount: number }
type FeePlan = {
    id: string
    program: string
    units: number
    tuitionPerUnit: number
    registrationFee: number
    feeItems: FeeItem[]
    createdAt: string
    updatedAt: string
}

type PlanRow = {
    id: string
    program: string
    units: number
    perUnit: number
    registration: number
    tuition: number
    others: number
    total: number
    updatedAt: string
    _plan: FeePlan
}

const LS_KEY = "admin-fee-plans"

const php = (n: number) =>
    `₱${(isNaN(n) ? 0 : n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function calcTotals(plan: FeePlan) {
    const tuition = plan.units * plan.tuitionPerUnit
    const others = plan.feeItems.reduce((s, f) => s + (Number.isFinite(f.amount) ? f.amount : 0), 0)
    const total = plan.registrationFee + tuition + others
    return { tuition, others, total }
}

function uid() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
    return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function loadInitial(): FeePlan[] {
    try {
        const raw = localStorage.getItem(LS_KEY)
        if (raw) return JSON.parse(raw) as FeePlan[]
    } catch { }
    const now = new Date().toISOString()
    return [
        {
            id: uid(),
            program: "BS Program (24 Units)",
            units: 24,
            tuitionPerUnit: 206.0,
            registrationFee: 1000,
            feeItems: [
                { id: uid(), name: "Passbook", amount: 52.55 },
                { id: uid(), name: "Library Fee", amount: 157.65 },
                { id: uid(), name: "Development Fee", amount: 157.65 },
                { id: uid(), name: "Laboratory Fee", amount: 1260.6 },
                { id: uid(), name: "Student Association", amount: 210.2 },
                { id: uid(), name: "Medical Fee", amount: 656.88 },
                { id: uid(), name: "Others School Fees", amount: 3605.44 },
            ],
            createdAt: now,
            updatedAt: now,
        },
        {
            id: uid(),
            program: "BS Program (18 Units)",
            units: 18,
            tuitionPerUnit: 206.0,
            registrationFee: 1000,
            feeItems: [
                { id: uid(), name: "Passbook", amount: 52.55 },
                { id: uid(), name: "Library Fee", amount: 157.65 },
                { id: uid(), name: "Development Fee", amount: 157.65 },
                { id: uid(), name: "Laboratory Fee", amount: 630.6 },
                { id: uid(), name: "Student Association", amount: 210.2 },
                { id: uid(), name: "Medical Fee", amount: 656.88 },
                { id: uid(), name: "Others School Fees", amount: 3605.44 },
            ],
            createdAt: now,
            updatedAt: now,
        },
    ]
}

/* =========================================================
   Generic DataTable Shell (shadcn pattern)
========================================================= */

type DataTableShellProps<TData, TValue> = {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    filterColumnId?: string
    filterPlaceholder?: string
    className?: string
}

function DataTableShell<TData, TValue>({
    columns,
    data,
    filterColumnId,
    filterPlaceholder = "Filter...",
    className,
}: DataTableShellProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = useState({})

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: { sorting, columnFilters, columnVisibility, rowSelection },
    })

    return (
        <div className={className}>
            <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
                {filterColumnId && (
                    <Input
                        placeholder={filterPlaceholder}
                        value={(table.getColumn(filterColumnId)?.getFilterValue() as string) ?? ""}
                        onChange={(e) => table.getColumn(filterColumnId)?.setFilterValue(e.target.value)}
                        className="max-w-sm bg-slate-700 border-slate-600"
                    />
                )}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="sm:ml-auto border-slate-600 text-white hover:bg-slate-700">
                            Columns <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 text-white">
                        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-slate-700" />
                        {table
                            .getAllLeafColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => (
                                <DropdownMenuCheckboxItem
                                    key={column.id}
                                    className="capitalize"
                                    checked={column.getIsVisible()}
                                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                >
                                    {column.id}
                                </DropdownMenuCheckboxItem>
                            ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="overflow-hidden rounded-md border border-slate-700">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((hg) => (
                            <TableRow key={hg.id}>
                                {hg.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-end space-x-2 py-4">
                <div className="text-muted-foreground flex-1 text-sm">{table.getFilteredRowModel().rows.length} row(s)</div>
                <div className="space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-600 text-white hover:bg-slate-700"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-600 text-white hover:bg-slate-700"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    )
}

/* =========================================================
   Page
========================================================= */

export default function AdminFeePlansPage() {
    const [plans, setPlans] = useState<FeePlan[]>([])
    const [dialogOpen, setDialogOpen] = useState(false)
    const [mode, setMode] = useState<"create" | "edit">("create")
    const [working, setWorking] = useState<FeePlan | null>(null)
    const [viewPlan, setViewPlan] = useState<FeePlan | null>(null)

    // confirmation + loading states for actions
    const [confirm, setConfirm] = useState<{ type: "duplicate" | "delete"; plan: FeePlan } | null>(null)
    const [busy, setBusy] = useState<string | null>(null)

    // optional loading for save
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        setPlans(loadInitial())
    }, [])

    useEffect(() => {
        try {
            localStorage.setItem(LS_KEY, JSON.stringify(plans))
        } catch { }
    }, [plans])

    const openCreate = () => {
        const now = new Date().toISOString()
        setWorking({
            id: uid(),
            program: "",
            units: 0,
            tuitionPerUnit: 0,
            registrationFee: 0,
            feeItems: [],
            createdAt: now,
            updatedAt: now,
        })
        setMode("create")
        setDialogOpen(true)
    }

    const openEdit = (plan: FeePlan) => {
        setWorking(JSON.parse(JSON.stringify(plan)))
        setMode("edit")
        setDialogOpen(true)
    }

    const duplicatePlan = (plan: FeePlan) => {
        const copy: FeePlan = {
            ...plan,
            id: uid(),
            program: `${plan.program} (Copy)`,
            feeItems: plan.feeItems.map((f) => ({ ...f, id: uid() })),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }
        setPlans((p) => [copy, ...p])
    }

    const removePlan = (id: string) => setPlans((p) => p.filter((x) => x.id !== id))

    const saveWorking = () => {
        if (!working) return
        setSaving(true)
        const cleaned: FeePlan = {
            ...working,
            program: working.program.trim() || "Untitled Fee Plan",
            units: Number(working.units) || 0,
            tuitionPerUnit: Number(working.tuitionPerUnit) || 0,
            registrationFee: Number(working.registrationFee) || 0,
            feeItems: working.feeItems.map((f) => ({
                ...f,
                name: f.name.trim() || "Misc. Fee",
                amount: Number(f.amount) || 0,
            })),
            updatedAt: new Date().toISOString(),
        }
        setPlans((p) => (mode === "create" ? [cleaned, ...p] : p.map((x) => (x.id === cleaned.id ? cleaned : x))))
        setSaving(false)
        setDialogOpen(false)
    }

    /* ---------- Plans table ---------- */

    const planRows: PlanRow[] = useMemo(
        () =>
            plans.map((p) => {
                const { tuition, others, total } = calcTotals(p)
                return {
                    id: p.id,
                    program: p.program,
                    units: p.units,
                    perUnit: p.tuitionPerUnit,
                    registration: p.registrationFee,
                    tuition,
                    others,
                    total,
                    updatedAt: p.updatedAt,
                    _plan: p,
                }
            }),
        [plans],
    )

    const planColumns: ColumnDef<PlanRow>[] = [
        {
            accessorKey: "program",
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="px-0">
                    Program / Plan
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const prog = row.getValue("program") as string
                const updatedAt = row.original.updatedAt
                return (
                    <div className="flex flex-col">
                        <span className="font-medium">{prog}</span>
                        <span className="text-xs text-gray-400">Updated {new Date(updatedAt).toLocaleString()}</span>
                    </div>
                )
            },
        },
        {
            accessorKey: "units",
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    Units
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
        },
        { accessorKey: "perUnit", header: "Per Unit", cell: ({ row }) => php(row.getValue("perUnit") as number) },
        { accessorKey: "registration", header: "Registration", cell: ({ row }) => php(row.getValue("registration") as number) },
        { accessorKey: "tuition", header: "Tuition Total", cell: ({ row }) => php(row.getValue("tuition") as number) },
        { accessorKey: "others", header: "Other Fees", cell: ({ row }) => php(row.getValue("others") as number) },
        {
            accessorKey: "total",
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    Grand Total
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => <span className="font-semibold">{php(row.getValue("total") as number)}</span>,
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({ row }) => {
                const plan = row.original._plan
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 text-white">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setViewPlan(plan)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View breakdown
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(plan)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    navigator.clipboard.writeText(plan.id)
                                }}
                            >
                                <Copy className="mr-2 h-4 w-4" />
                                Copy plan ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-700" />
                            <DropdownMenuItem
                                onClick={() => setConfirm({ type: "duplicate", plan })}
                                className="text-blue-300 focus:text-blue-200"
                            >
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicate…
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setConfirm({ type: "delete", plan })}
                                className="text-red-400 focus:text-red-300"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete…
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ]

    /* ---------- Fee items editor table ---------- */

    const FeeItemsEditor = ({ current }: { current: FeePlan }) => {
        type Row = { id: string; name: string; amount: number }
        const rows: Row[] = current.feeItems.map((f) => ({ id: f.id, name: f.name, amount: f.amount }))

        const cols: ColumnDef<Row>[] = [
            {
                accessorKey: "name",
                header: "Description",
                cell: ({ row }) => (
                    <Input
                        value={row.getValue("name") as string}
                        onChange={(e) => {
                            const next = current.feeItems.map((x) => (x.id === row.original.id ? { ...x, name: e.target.value } : x))
                            setWorking({ ...current, feeItems: next })
                        }}
                        placeholder="e.g., Library Fee"
                        className="bg-slate-700 border-slate-600"
                    />
                ),
            },
            {
                accessorKey: "amount",
                header: "Amount",
                cell: ({ row }) => (
                    <Input
                        type="number"
                        step="0.01"
                        value={row.getValue("amount") as number}
                        onChange={(e) => {
                            const val = Number(e.target.value)
                            const next = current.feeItems.map((x) => (x.id === row.original.id ? { ...x, amount: val } : x))
                            setWorking({ ...current, feeItems: next })
                        }}
                        className="bg-slate-700 border-slate-600"
                    />
                ),
            },
            {
                id: "remove",
                enableHiding: false,
                header: "Remove",
                cell: ({ row }) => (
                    <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 border-red-600 text-red-400 hover:bg-red-900/20"
                        onClick={() => {
                            const next = current.feeItems.filter((x) => x.id !== row.original.id)
                            setWorking({ ...current, feeItems: next })
                        }}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                ),
            },
        ]

        return (
            <DataTableShell<Row, unknown>
                columns={cols}
                data={rows}
                filterColumnId="name"
                filterPlaceholder="Filter fee items..."
            />
        )
    }

    /* ---------- Breakdown table (view) ---------- */

    const BreakdownTable = ({ plan }: { plan: FeePlan }) => {
        type Row = { id: string; desc: string; amount: number }
        const rows: Row[] = [
            { id: "reg", desc: "Registration Fee", amount: plan.registrationFee },
            {
                id: "tuition",
                desc: `Tuition Per Unit × Units (${plan.units} × ${php(plan.tuitionPerUnit)})`,
                amount: calcTotals(plan).tuition,
            },
            ...plan.feeItems.map((f) => ({ id: f.id, desc: f.name, amount: f.amount })),
            { id: "sub", desc: "Other Fees Subtotal", amount: calcTotals(plan).others },
        ]

        const cols: ColumnDef<Row>[] = [
            { accessorKey: "desc", header: "Description" },
            { accessorKey: "amount", header: "Amount", cell: ({ row }) => php(row.getValue("amount") as number) },
        ]

        return <DataTableShell<Row, unknown> columns={cols} data={rows} />
    }

    const othersSubtotal = (w: FeePlan | null) =>
        php((w?.feeItems ?? []).reduce((s, f) => s + (Number.isFinite(f.amount) ? f.amount : 0), 0))

    const grandTotal = (w: FeePlan | null) =>
        php(
            (w?.units || 0) * (w?.tuitionPerUnit || 0) +
            (w?.registrationFee || 0) +
            (w?.feeItems || []).reduce((s, f) => s + (Number.isFinite(f.amount) ? f.amount : 0), 0),
        )

    const handleConfirm = () => {
        if (!confirm) return
        const isDelete = confirm.type === "delete"
        const label = isDelete ? "Deleting fee plan..." : "Duplicating fee plan..."
        setBusy(label)
        if (isDelete) {
            removePlan(confirm.plan.id)
        } else {
            duplicatePlan(confirm.plan)
        }
        setBusy(null)
        setConfirm(null)
    }

    return (
        <DashboardLayout allowedRoles={["admin"]}>
            <div className="container mx-auto px-4 py-8">
                {/* Mobile: vertical; Desktop: horizontal */}
                <div className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="w-full">
                        <h1 className="text-2xl font-bold text-white">Fee Plans</h1>
                        <p className="text-gray-300">Create, customize, and manage tuition &amp; fees per program.</p>
                    </div>
                    <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90" onClick={openCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Fee Plan
                    </Button>
                </div>

                <Card className="bg-slate-800/60 border-slate-700 text-white">
                    <CardHeader>
                        <CardTitle>All Plans</CardTitle>
                        <CardDescription className="text-gray-300">
                            Total: {plans.length} {plans.length === 1 ? "plan" : "plans"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DataTableShell<PlanRow, unknown>
                            columns={planColumns}
                            data={planRows}
                            filterColumnId="program"
                            filterPlaceholder="Filter programs..."
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Create / Edit */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="bg-slate-800 border-slate-700 text-white w-[min(100vw-2rem,920px)] sm:max-w-3xl max-h-[90dvh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{mode === "create" ? "Create Fee Plan" : "Edit Fee Plan"}</DialogTitle>
                        <DialogDescription className="text-gray-300">
                            Configure tuition, registration, and other school fees. Totals update automatically.
                        </DialogDescription>
                    </DialogHeader>

                    {working && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="program">Program / Course</Label>
                                    <Input
                                        id="program"
                                        value={working.program}
                                        onChange={(e) => setWorking({ ...working, program: e.target.value })}
                                        placeholder="e.g., BSED, BSCS, BSSW, BSIT"
                                        className="bg-slate-700 border-slate-600"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="units">Units</Label>
                                    <Input
                                        id="units"
                                        type="number"
                                        value={working.units}
                                        onChange={(e) => setWorking({ ...working, units: Number(e.target.value) })}
                                        className="bg-slate-700 border-slate-600"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="perUnit">Tuition Per Unit</Label>
                                    <Input
                                        id="perUnit"
                                        type="number"
                                        step="0.01"
                                        value={working.tuitionPerUnit}
                                        onChange={(e) => setWorking({ ...working, tuitionPerUnit: Number(e.target.value) })}
                                        className="bg-slate-700 border-slate-600"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reg">Registration Fee</Label>
                                    <Input
                                        id="reg"
                                        type="number"
                                        step="0.01"
                                        value={working.registrationFee}
                                        onChange={(e) => setWorking({ ...working, registrationFee: Number(e.target.value) })}
                                        className="bg-slate-700 border-slate-600"
                                    />
                                </div>
                            </div>

                            <Separator className="bg-slate-700" />

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-medium">Other School Fees</h3>
                                        <Badge variant="secondary">Subtotal: {othersSubtotal(working)}</Badge>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-slate-600 text-white hover:bg-slate-700"
                                        onClick={() =>
                                            setWorking({
                                                ...working,
                                                feeItems: [...working.feeItems, { id: uid(), name: "", amount: 0 }],
                                            })
                                        }
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Fee Item
                                    </Button>
                                </div>

                                <FeeItemsEditor current={working} />
                            </div>

                            <Separator className="bg-slate-700" />

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <Card className="bg-slate-700/40 border-slate-600">
                                    <CardContent className="p-4">
                                        <p className="text-xs text-gray-300">Tuition Total</p>
                                        <p className="text-xl font-semibold">{php((working.units || 0) * (working.tuitionPerUnit || 0))}</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-slate-700/40 border-slate-600">
                                    <CardContent className="p-4">
                                        <p className="text-xs text-gray-300">Other Fees</p>
                                        <p className="text-xl font-semibold">{othersSubtotal(working)}</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-slate-700/40 border-slate-600">
                                    <CardContent className="p-4">
                                        <p className="text-xs text-gray-300">Grand Total</p>
                                        <p className="text-xl font-semibold">{grandTotal(working)}</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex flex-col gap-2 sm:flex-row">
                        <Button
                            variant="outline"
                            className="border-slate-600 text-white hover:bg-slate-700"
                            onClick={() => setDialogOpen(false)}
                            disabled={saving}
                        >
                            Cancel
                        </Button>
                        <Button className="bg-primary hover:bg-primary/90" onClick={saveWorking} disabled={saving}>
                            {saving ? (
                                <span className="inline-flex items-center gap-2">
                                    <Spinner className="h-4 w-4" />
                                    Saving…
                                </span>
                            ) : mode === "create" ? (
                                "Create Plan"
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View breakdown */}
            <Dialog open={!!viewPlan} onOpenChange={(o) => !o && setViewPlan(null)}>
                <DialogContent className="bg-slate-800 border-slate-700 text-white w-[min(100vw-2rem,720px)] max-h-[90dvh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Fee Breakdown</DialogTitle>
                        <DialogDescription className="text-gray-300">{viewPlan?.program}</DialogDescription>
                    </DialogHeader>

                    {viewPlan && (
                        <div className="space-y-3">
                            <BreakdownTable plan={viewPlan} />
                            <div className="mt-2 flex justify-end">
                                <span className="text-sm font-semibold">TOTAL: {php(calcTotals(viewPlan).total)}</span>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex flex-col gap-2 sm:flex-row">
                        <Button
                            variant="outline"
                            className="border-slate-600 text-white hover:bg-slate-700"
                            onClick={() => setViewPlan(null)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirm duplicate/delete */}
            <AlertDialog open={!!confirm} onOpenChange={(o) => (!o && !busy ? setConfirm(null) : null)}>
                <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirm?.type === "delete" ? "Delete Fee Plan?" : "Duplicate Fee Plan?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-300">
                            {confirm?.type === "delete"
                                ? `This will permanently remove "${confirm?.plan.program}". This action cannot be undone.`
                                : `Create a copy of "${confirm?.plan.program}" with the same fees.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-slate-600 text-white hover:bg-slate-700" disabled={!!busy}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirm}
                            className={confirm?.type === "delete" ? "bg-red-600 hover:bg-red-700" : "bg-primary hover:bg-primary/90"}
                            disabled={!!busy}
                        >
                            {busy ? (
                                <span className="inline-flex items-center gap-2">
                                    <Spinner className="h-4 w-4" />
                                    {busy}
                                </span>
                            ) : confirm?.type === "delete" ? (
                                "Delete"
                            ) : (
                                "Duplicate"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Floating spinner indicator while busy */}
            {busy && (
                <div className="fixed bottom-4 right-4 z-50">
                    <Item variant="muted" className="[--radius:1rem] shadow-lg">
                        <ItemMedia>
                            <Spinner />
                        </ItemMedia>
                        <ItemContent>
                            <ItemTitle className="line-clamp-1">{busy}</ItemTitle>
                        </ItemContent>
                    </Item>
                </div>
            )}
        </DashboardLayout>
    )
}
