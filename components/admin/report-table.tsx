/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Column {
    header: string
    accessor: string
    format?: (value: any) => React.ReactNode
}

interface ReportTableProps {
    data: any[]
    columns: Column[]
    searchable?: boolean
    searchPlaceholder?: string
    searchAccessor?: string
}

export function ReportTable({
    data,
    columns,
    searchable = false,
    searchPlaceholder = "Search...",
    searchAccessor,
}: ReportTableProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)

    // Filter data based on search term
    const filteredData =
        searchable && searchAccessor
            ? data.filter((item) => String(item[searchAccessor]).toLowerCase().includes(searchTerm.toLowerCase()))
            : data

    // Paginate data
    const totalPages = Math.ceil(filteredData.length / rowsPerPage)
    const paginatedData = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

    return (
        <div className="space-y-4">
            {searchable && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center w-full max-w-sm">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <Input
                                placeholder={searchPlaceholder}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 bg-slate-800/50 border-slate-700 text-white"
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className="rounded-md border border-slate-700 bg-slate-800/50">
                <Table>
                    <TableHeader>
                        <TableRow className="border-slate-700 hover:bg-slate-800">
                            {columns.map((column) => (
                                <TableHead key={column.accessor} className="text-slate-300">
                                    {column.header}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedData.length > 0 ? (
                            paginatedData.map((row, rowIndex) => (
                                <TableRow key={rowIndex} className="border-slate-700 hover:bg-slate-800">
                                    {columns.map((column) => (
                                        <TableCell key={column.accessor} className="text-slate-300">
                                            {column.format ? column.format(row[column.accessor]) : row[column.accessor]}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center text-slate-300">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {filteredData.length > rowsPerPage && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <p className="text-sm text-slate-400">Rows per page:</p>
                        <Select
                            value={rowsPerPage.toString()}
                            onValueChange={(value) => {
                                setRowsPerPage(Number(value))
                                setCurrentPage(1)
                            }}
                        >
                            <SelectTrigger className="h-8 w-[70px] bg-slate-800/50 border-slate-700 text-white">
                                <SelectValue placeholder={rowsPerPage} />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                {[5, 10, 20, 50, 100].map((pageSize) => (
                                    <SelectItem key={pageSize} value={pageSize.toString()}>
                                        {pageSize}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                        <p className="text-sm text-slate-400">
                            Page {currentPage} of {totalPages}
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="border-slate-700 text-white hover:bg-slate-700"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="border-slate-700 text-white hover:bg-slate-700"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
