/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useMemo, useState, useCallback, useRef } from "react"
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
import type { FeePlanDoc, FeePlanRecord } from "@/lib/fee-plan"
import { computeTotals, createFeePlan, deleteFeePlan, duplicateFeePlan, listAllFeePlans, updateFeePlan } from "@/lib/fee-plan"
import { toast } from "sonner"

type FeeItem = { id: string; name: string; amount: number }

type FeePlanVM = {
    id: string
    program: string
    units: number
    tuitionPerUnit: number
    registrationFee: number
    feeItems: FeeItem[]
    createdAt: string
    updatedAt: string
    isActive?: boolean
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
    _plan: FeePlanVM
}

const php = (n: number) => `₱${(isNaN(n) ? 0 : n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const toVM = (doc: FeePlanDoc): FeePlanVM => ({
    id: doc.$id,
    program: doc.program,
    units: Number(doc.units || 0),
    tuitionPerUnit: Number(doc.tuitionPerUnit || 0),
    registrationFee: Number(doc.registrationFee || 0),
    feeItems: (doc.feeItems ?? []).map((f) => ({ id: f.id, name: f.name, amount: Number(f.amount || 0) })),
    createdAt: doc.createdAt || doc.$createdAt,
    updatedAt: doc.updatedAt || doc.$updatedAt,
    isActive: doc.isActive,
})

type DataTableShellProps<TData, TValue> = {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    filterColumnId?: string
    filterPlaceholder?: string
    className?: string
    getRowId?: (originalRow: TData, index: number, parent?: any) => string
}

function DataTableShell<TData, TValue>({ columns, data, filterColumnId, filterPlaceholder = "Filter...", className, getRowId }: DataTableShellProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = useState({})

    const table = useReactTable({
        data,
        columns,
        ...(getRowId ? { getRowId } : {}),
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

type FieldErrors = Partial<Record<"program" | "units" | "tuitionPerUnit" | "registrationFee", string>>

function validateRequired(w: FeePlanVM | null): FieldErrors {
    const e: FieldErrors = {}
    if (!w) return e
    if (!w.program || !w.program.trim()) e.program = "Program / Course is required."
    if (!Number.isFinite(w.units) || w.units < 1) e.units = "Units is required (min 1)."
    if (!Number.isFinite(w.tuitionPerUnit) || w.tuitionPerUnit < 0) e.tuitionPerUnit = "Tuition Per Unit is required (≥ 0)."
    if (!Number.isFinite(w.registrationFee) || w.registrationFee < 0) e.registrationFee = "Registration Fee is required (≥ 0)."
    return e
}

function hasErrors(e: FieldErrors) {
    return Object.keys(e).length > 0
}

function errorInputClass(err?: string) {
    return err ? "border-red-500 focus-visible:ring-red-500" : "border-slate-600"
}

export default function AdminFeePlansPage() {
    const [plans, setPlans] = useState<FeePlanVM[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [mode, setMode] = useState<"create" | "edit">("create")
    const [working, setWorking] = useState<FeePlanVM | null>(null)
    const [viewPlan, setViewPlan] = useState<FeePlanVM | null>(null)
    const [confirm, setConfirm] = useState<{ type: "duplicate" | "delete"; plan: FeePlanVM } | null>(null)
    const [busy, setBusy] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [errors, setErrors] = useState<FieldErrors>({})
    const [focusItemId, setFocusItemId] = useState<string | null>(null)
    const focusItemIdRef = useRef<string | null>(null)

    useEffect(() => {
        focusItemIdRef.current = focusItemId
    }, [focusItemId])

    useEffect(() => {
        let mounted = true
            ; (async () => {
                try {
                    const docs = await listAllFeePlans()
                    if (!mounted) return
                    setPlans(docs.map(toVM))
                } catch (e: any) {
                    toast.error("Failed to load fee plans", { description: e?.message || "Please try again." })
                } finally {
                    if (mounted) setLoading(false)
                }
            })()
        return () => {
            mounted = false
        }
    }, [])

    useEffect(() => {
        setErrors(validateRequired(working))
    }, [working?.program, working?.units, working?.tuitionPerUnit, working?.registrationFee])

    const openCreate = () => {
        const iso = new Date().toISOString()
        setWorking({
            id: "__new__",
            program: "",
            units: 0,
            tuitionPerUnit: 0,
            registrationFee: 0,
            feeItems: [],
            createdAt: iso,
            updatedAt: iso,
            isActive: true,
        })
        setMode("create")
        setDialogOpen(true)
        setErrors({})
    }

    const openEdit = (plan: FeePlanVM) => {
        setWorking(JSON.parse(JSON.stringify(plan)))
        setMode("edit")
        setDialogOpen(true)
        setErrors(validateRequired(plan))
    }

    const removePlanLocal = (id: string) => setPlans((p) => p.filter((x) => x.id !== id))

    const saveWorking = async () => {
        if (!working) return
        const currentErrors = validateRequired(working)
        setErrors(currentErrors)
        if (hasErrors(currentErrors)) return
        setSaving(true)
        try {
            if (mode === "create") {
                const payload: Omit<FeePlanRecord, "createdAt" | "updatedAt"> = {
                    program: working.program.trim(),
                    units: working.units,
                    tuitionPerUnit: working.tuitionPerUnit,
                    registrationFee: working.registrationFee,
                    feeItems: working.feeItems,
                    isActive: working.isActive ?? true,
                }
                const created = await createFeePlan(payload)
                const vm = toVM(created)
                setPlans((p) => [vm, ...p])
                setDialogOpen(false)
                toast.success("Fee plan created", { description: vm.program })
            } else {
                const patch: Partial<FeePlanRecord> = {
                    program: working.program.trim(),
                    units: working.units,
                    tuitionPerUnit: working.tuitionPerUnit,
                    registrationFee: working.registrationFee,
                    feeItems: working.feeItems,
                    isActive: working.isActive,
                }
                const updated = await updateFeePlan(working.id, patch)
                const vm = toVM(updated)
                setPlans((p) => p.map((x) => (x.id === vm.id ? vm : x)))
                setDialogOpen(false)
                toast.success("Fee plan updated", { description: vm.program })
            }
        } catch (e: any) {
            toast.error("Save failed", { description: e?.message || "Please try again." })
        } finally {
            setSaving(false)
        }
    }

    const handleDuplicate = async (plan: FeePlanVM) => {
        setBusy("Duplicating fee plan...")
        try {
            const created = await duplicateFeePlan(plan.id)
            const vm = toVM(created)
            setPlans((p) => [vm, ...p])
            toast.success("Plan duplicated", { description: vm.program })
        } catch (e: any) {
            toast.error("Duplicate failed", { description: e?.message || "Please try again." })
        } finally {
            setBusy(null)
        }
    }

    const handleDelete = async (plan: FeePlanVM) => {
        setBusy("Deleting fee plan...")
        try {
            await deleteFeePlan(plan.id)
            removePlanLocal(plan.id)
            toast.success("Plan deleted", { description: plan.program })
        } catch (e: any) {
            toast.error("Delete failed", { description: e?.message || "Please try again." })
        } finally {
            setBusy(null)
        }
    }

    const planRows: PlanRow[] = useMemo(
        () =>
            plans.map((p) => {
                const { tuition, others, total } = computeTotals({
                    units: p.units,
                    tuitionPerUnit: p.tuitionPerUnit,
                    registrationFee: p.registrationFee,
                    feeItems: p.feeItems,
                })
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
        [plans]
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
                const active = row.original._plan.isActive ?? true
                return (
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="font-medium">{prog}</span>
                            {!active && <Badge variant="secondary">Inactive</Badge>}
                        </div>
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
                                onClick={async () => {
                                    try {
                                        await navigator.clipboard.writeText(plan.id)
                                        toast.success("Plan ID copied", { description: plan.id })
                                    } catch {
                                        toast.error("Failed to copy plan ID")
                                    }
                                }}
                            >
                                <Copy className="mr-2 h-4 w-4" />
                                Copy plan ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-700" />
                            <DropdownMenuItem onClick={() => setConfirm({ type: "duplicate", plan })} className="text-blue-300 focus:text-blue-200">
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicate…
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setConfirm({ type: "delete", plan })} className="text-red-400 focus:text-red-300">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete…
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ]

    const FeeItemsEditor = ({ current }: { current: FeePlanVM }) => {
        const [filter, setFilter] = useState("")
        const [drafts, setDrafts] = useState<Record<string, { name: string; amount: string }>>({})

        useEffect(() => {
            setDrafts((prev) => {
                const next: Record<string, { name: string; amount: string }> = {}
                for (const f of current.feeItems) {
                    const p = prev[f.id]
                    next[f.id] = {
                        name: p?.name ?? (f.name ?? ""),
                        amount: p?.amount ?? (Number.isFinite(f.amount) ? String(f.amount) : ""),
                    }
                }
                return next
            })
        }, [current.feeItems])

        const items = useMemo(() => {
            const q = filter.trim().toLowerCase()
            const source = current.feeItems
            if (!q) return source
            return source.filter((f) => (drafts[f.id]?.name ?? f.name ?? "").toLowerCase().includes(q))
        }, [current.feeItems, drafts, filter])

        const commit = useCallback(
            (id: string) => {
                const d = drafts[id]
                if (!d) return
                const parsed = d.amount.trim() === "" ? 0 : Number(d.amount)
                const safeAmount = Number.isFinite(parsed) ? parsed : 0
                setWorking((prev) => {
                    if (!prev) return prev
                    const feeItems = prev.feeItems.map((x) => (x.id === id ? { ...x, name: d.name, amount: safeAmount } : x))
                    return { ...prev, feeItems }
                })
            },
            [drafts]
        )

        const updateDraft = useCallback((id: string, patch: Partial<{ name: string; amount: string }>) => {
            setDrafts((prev) => ({ ...prev, [id]: { name: prev[id]?.name ?? "", amount: prev[id]?.amount ?? "", ...patch } }))
        }, [])

        const removeItem = useCallback((id: string) => {
            setWorking((prev) => {
                if (!prev) return prev
                return { ...prev, feeItems: prev.feeItems.filter((x) => x.id !== id) }
            })
            setDrafts((prev) => {
                const { ...rest } = prev
                return rest
            })
            if (focusItemIdRef.current === id) setFocusItemId(null)
        }, [])

        return (
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Input
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        placeholder="Filter fee items..."
                        className="max-w-sm bg-slate-700 border-slate-600"
                        onKeyDown={(e) => e.stopPropagation()}
                    />
                </div>

                <div className="overflow-hidden rounded-md border border-slate-700">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Description</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Remove</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.length ? (
                                items.map((fi) => (
                                    <TableRow key={fi.id}>
                                        <TableCell>
                                            <Input
                                                value={drafts[fi.id]?.name ?? ""}
                                                onChange={(e) => updateDraft(fi.id, { name: e.target.value })}
                                                onBlur={() => commit(fi.id)}
                                                onKeyDown={(e) => {
                                                    e.stopPropagation()
                                                    if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur()
                                                }}
                                                placeholder="e.g., Alumni Fee"
                                                className="bg-slate-700 border-slate-600"
                                                onPointerDown={(e) => e.stopPropagation()}
                                                onMouseDown={(e) => e.stopPropagation()}
                                                onClick={(e) => e.stopPropagation()}
                                                onFocus={() => {
                                                    if (focusItemIdRef.current === fi.id) setFocusItemId(null)
                                                }}
                                                autoFocus={fi.id === focusItemIdRef.current}
                                                spellCheck={false}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="text"
                                                inputMode="decimal"
                                                value={drafts[fi.id]?.amount ?? ""}
                                                onChange={(e) => {
                                                    updateDraft(fi.id, { amount: e.currentTarget.value })
                                                }}
                                                onBlur={() => commit(fi.id)}
                                                onKeyDown={(e) => {
                                                    e.stopPropagation()
                                                    if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur()
                                                }}
                                                placeholder="0.00"
                                                className="bg-slate-700 border-slate-600"
                                                onPointerDown={(e) => e.stopPropagation()}
                                                onMouseDown={(e) => e.stopPropagation()}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </TableCell>
                                        <TableCell className="w-[1%]">
                                            <Button
                                                size="icon"
                                                variant="outline"
                                                className="h-8 w-8 border-red-600 text-red-400 hover:bg-red-900/20"
                                                onClick={() => removeItem(fi.id)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        No fee items.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        )
    }

    const BreakdownTable = ({ plan }: { plan: FeePlanVM }) => {
        type Row = { id: string; desc: string; amount: number }
        const totals = computeTotals({
            units: plan.units,
            tuitionPerUnit: plan.tuitionPerUnit,
            registrationFee: plan.registrationFee,
            feeItems: plan.feeItems,
        })
        const rows: Row[] = [
            { id: "reg", desc: "Registration Fee", amount: plan.registrationFee },
            {
                id: "tuition",
                desc: `Tuition Per Unit × Units (${plan.units} × ${php(plan.tuitionPerUnit)})`,
                amount: totals.tuition,
            },
            ...plan.feeItems.map((f) => ({ id: f.id, desc: f.name, amount: f.amount })),
            { id: "sub", desc: "Other Fees Subtotal", amount: totals.others },
        ]
        const cols: ColumnDef<Row>[] = [
            { accessorKey: "desc", header: "Description" },
            { accessorKey: "amount", header: "Amount", cell: ({ row }) => php(row.getValue("amount") as number) },
        ]
        return <DataTableShell<Row, unknown> columns={cols} data={rows} getRowId={(r) => r.id} />
    }

    const othersSubtotal = (w: FeePlanVM | null) => php((w?.feeItems ?? []).reduce((s, f) => s + (Number.isFinite(f.amount) ? f.amount : 0), 0))

    const grandTotal = (w: FeePlanVM | null) => {
        const totals = computeTotals({
            units: w?.units || 0,
            tuitionPerUnit: w?.tuitionPerUnit || 0,
            registrationFee: w?.registrationFee || 0,
            feeItems: w?.feeItems || [],
        })
        return php(totals.total)
    }

    const handleConfirm = async () => {
        if (!confirm) return
        const isDelete = confirm.type === "delete"
        if (isDelete) {
            await handleDelete(confirm.plan)
        } else {
            await handleDuplicate(confirm.plan)
        }
        setConfirm(null)
    }

    const creatingOrEditingInvalid = hasErrors(errors)

    return (
        <DashboardLayout allowedRoles={["admin"]}>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="w-full">
                        <h1 className="text-2xl font-bold text-white">Fee Plans</h1>
                        <p className="text-gray-300">Create, customize, and manage tuition &amp; fees per program.</p>
                    </div>
                    <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90" onClick={openCreate} disabled={loading}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Fee Plan
                    </Button>
                </div>

                <Card className="bg-slate-800/60 border-slate-700 text-white">
                    <CardHeader>
                        <CardTitle>All Plans</CardTitle>
                        <CardDescription className="text-gray-300">
                            {loading ? "Loading…" : <>Total: {plans.length} {plans.length === 1 ? "plan" : "plans"}</>}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DataTableShell<PlanRow, unknown>
                            columns={planColumns}
                            data={planRows}
                            filterColumnId="program"
                            filterPlaceholder="Filter programs..."
                            getRowId={(r) => r.id}
                        />
                    </CardContent>
                </Card>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen} modal={false}>
                <DialogContent
                    className="bg-slate-800 border-slate-700 text-white w-[min(100vw-2rem,920px)] sm:max-w-3xl max-h-[90dvh] overflow-y-auto"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
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
                                        required
                                        value={working.program}
                                        onChange={(e) => setWorking((prev) => (prev ? { ...prev, program: e.target.value } : prev))}
                                        placeholder="e.g., BSED, BSCS, BSSW, BSIT"
                                        className={`bg-slate-700 ${errorInputClass(errors.program)}`}
                                        onKeyDown={(e) => e.stopPropagation()}
                                        aria-invalid={!!errors.program}
                                        aria-errormessage="program-error"
                                    />
                                    {errors.program && (
                                        <p id="program-error" className="text-xs text-red-400">
                                            {errors.program}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="units">Units</Label>
                                    <Input
                                        id="units"
                                        type="number"
                                        required
                                        min={1}
                                        value={Number.isFinite(working.units) ? working.units : 0}
                                        onChange={(e) => setWorking((prev) => (prev ? { ...prev, units: Number(e.target.value) } : prev))}
                                        className={`bg-slate-700 ${errorInputClass(errors.units)}`}
                                        onKeyDown={(e) => e.stopPropagation()}
                                        aria-invalid={!!errors.units}
                                        aria-errormessage="units-error"
                                    />
                                    {errors.units && (
                                        <p id="units-error" className="text-xs text-red-400">
                                            {errors.units}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="perUnit">Tuition Per Unit</Label>
                                    <Input
                                        id="perUnit"
                                        type="number"
                                        required
                                        step="0.01"
                                        min={0}
                                        value={Number.isFinite(working.tuitionPerUnit) ? working.tuitionPerUnit : 0}
                                        onChange={(e) => setWorking((prev) => (prev ? { ...prev, tuitionPerUnit: Number(e.target.value) } : prev))}
                                        className={`bg-slate-700 ${errorInputClass(errors.tuitionPerUnit)}`}
                                        onKeyDown={(e) => e.stopPropagation()}
                                        aria-invalid={!!errors.tuitionPerUnit}
                                        aria-errormessage="perunit-error"
                                    />
                                    {errors.tuitionPerUnit && (
                                        <p id="perunit-error" className="text-xs text-red-400">
                                            {errors.tuitionPerUnit}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="reg">Registration Fee</Label>
                                    <Input
                                        id="reg"
                                        type="number"
                                        required
                                        step={0.01}
                                        min={0}
                                        value={Number.isFinite(working.registrationFee) ? working.registrationFee : 0}
                                        onChange={(e) => setWorking((prev) => (prev ? { ...prev, registrationFee: Number(e.target.value) } : prev))}
                                        className={`bg-slate-700 ${errorInputClass(errors.registrationFee)}`}
                                        onKeyDown={(e) => e.stopPropagation()}
                                        aria-invalid={!!errors.registrationFee}
                                        aria-errormessage="regfee-error"
                                    />
                                    {errors.registrationFee && (
                                        <p id="regfee-error" className="text-xs text-red-400">
                                            {errors.registrationFee}
                                        </p>
                                    )}
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="inline-flex items-center gap-2 select-none">
                                        <input
                                            type="checkbox"
                                            checked={!!working.isActive}
                                            onChange={(e) => setWorking((prev) => (prev ? { ...prev, isActive: e.target.checked } : prev))}
                                            className="h-4 w-4 accent-primary"
                                        />
                                        <span>Active</span>
                                    </label>
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
                                        onClick={() => {
                                            const id = crypto.randomUUID?.() ?? String(Date.now())
                                            setWorking((prev) => (prev ? { ...prev, feeItems: [...prev.feeItems, { id, name: "", amount: 0 }] } : prev))
                                            setFocusItemId(id)
                                        }}
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
                        <Button
                            className="bg-primary hover:bg-primary/90 disabled:opacity-60"
                            onClick={saveWorking}
                            disabled={saving || creatingOrEditingInvalid}
                            title={creatingOrEditingInvalid ? "Please fix the required fields." : undefined}
                        >
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
                                <span className="text-sm font-semibold">
                                    TOTAL:{" "}
                                    {php(
                                        computeTotals({
                                            units: viewPlan.units,
                                            tuitionPerUnit: viewPlan.tuitionPerUnit,
                                            registrationFee: viewPlan.registrationFee,
                                            feeItems: viewPlan.feeItems,
                                        }).total
                                    )}
                                </span>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex flex-col gap-2 sm:flex-row">
                        <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700" onClick={() => setViewPlan(null)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!confirm} onOpenChange={(o) => (!o && !busy ? setConfirm(null) : null)}>
                <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{confirm?.type === "delete" ? "Delete Fee Plan?" : "Duplicate Fee Plan?"}</AlertDialogTitle>
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

            {(busy || loading) && (
                <div className="fixed bottom-4 right-4 z-50">
                    <Item variant="muted" className="[--radius:1rem] shadow-lg">
                        <ItemMedia>
                            <Spinner />
                        </ItemMedia>
                        <ItemContent>
                            <ItemTitle className="line-clamp-1">{busy || "Loading fee plans…"}</ItemTitle>
                        </ItemContent>
                    </Item>
                </div>
            )}
        </DashboardLayout>
    )
}
