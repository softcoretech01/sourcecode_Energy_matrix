import React, { useState } from "react";
import { Search, Edit, Upload, FileText, Scale } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

// Mock Data matching the screenshot
const data = [
    {
        id: 1,
        readingDate: "2024-04-18",
        windmillNumber: "WM-001",
        exportedKwh: "1,200",
        consumedKwh: "300",
        unitValueExport: "5",
        unitValueImport: "4,500", // Net payable in screenshot is last col, 4500. Wait. 300 * ?
        netPayable: "4,500",
        status: "Saved",
    },
    {
        id: 2,
        readingDate: "2024-04-21",
        windmillNumber: "WM-002",
        exportedKwh: "1,050",
        consumedKwh: "290",
        unitValueExport: "4.80",
        unitValueImport: "3,624",
        netPayable: "3,624",
        status: "Posted",
    },
    {
        id: 3,
        readingDate: "2024-04-20",
        windmillNumber: "WM-003",
        exportedKwh: "1,300",
        consumedKwh: "310",
        unitValueExport: "5.20",
        unitValueImport: "5,096",
        netPayable: "5,096",
        status: "Saved",
    },
];

export default function EBBillList() {
    const navigate = useNavigate();
    const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
    const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString());

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    const months = [
        { value: "1", label: "January" },
        { value: "2", label: "February" },
        { value: "3", label: "March" },
        { value: "4", label: "April" },
        { value: "5", label: "May" },
        { value: "6", label: "June" },
        { value: "7", label: "July" },
        { value: "8", label: "August" },
        { value: "9", label: "September" },
        { value: "10", label: "October" },
        { value: "11", label: "November" },
        { value: "12", label: "December" },
    ];

    return (
        <div className="p-2 bg-slate-50 min-h-screen font-sans">
            <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="p-3 space-y-2">
                    {/* Page Title */}
                    <div className="flex items-center justify-between pb-1">
                        <h1 className="text-xl font-bold text-slate-800">Client EB Bill</h1>
                    </div>

                    {/* Search Filters */}
                    <div className="space-y-1">
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap gap-2 items-center">
                            <span className="text-sm font-semibold text-slate-600 mr-2">Search</span>
                            <Select>
                                <SelectTrigger className="w-[200px] h-9 bg-white border-slate-300 text-sm">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="wm-001">WM-001</SelectItem>
                                    <SelectItem value="wm-002">WM-002</SelectItem>
                                    <SelectItem value="wm-003">WM-003</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Year Selection */}
                            <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger className="w-[140px] h-9 bg-white border-slate-300 text-sm">
                                    <SelectValue placeholder="Select Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map((year) => (
                                        <SelectItem key={year} value={year.toString()}>
                                            {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Month Selection */}
                            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                <SelectTrigger className="w-[140px] h-9 bg-white border-slate-300 text-sm">
                                    <SelectValue placeholder="Select Month" />
                                </SelectTrigger>
                                <SelectContent>
                                    {months.map((month) => (
                                        <SelectItem key={month.value} value={month.value}>
                                            {month.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className="flex-1"></div>

                            <Button size="sm" className="h-9 text-sm bg-primary hover:bg-primary/90 text-primary-foreground px-4">
                                Search
                            </Button>
                            <Button size="sm" className="h-9 text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-4" onClick={() => navigate("/windmill/eb-bill/add")}>
                                + New
                            </Button>
                            <Button size="sm" className="h-9 text-sm bg-[#DAA520] hover:bg-[#B8860B] text-white px-4">
                                Export Excel
                            </Button>
                            <Button size="sm" className="h-9 text-sm bg-red-600 hover:bg-red-700 text-white px-4">
                                Cancel
                            </Button>
                        </div>
                    </div>

                    {/* Transaction List */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center bg-primary/5 p-2 rounded-t-lg border-b border-primary/10 h-10">
                            <h2 className="text-sm font-semibold text-primary pl-2">EB Bill List</h2>

                            <div className="flex items-center gap-4">
                                {/* Legend */}
                                <div className="flex gap-3 items-center">
                                    <div className="flex items-center gap-1.5">
                                        <Badge className="bg-red-600 hover:bg-red-700 text-white font-bold w-6 h-6 text-[10px] rounded flex items-center justify-center p-0 shadow-sm border-none">S</Badge>
                                        <span className="text-xs font-medium text-slate-600">Saved</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold w-6 h-6 text-[10px] rounded flex items-center justify-center p-0 shadow-sm border-none">P</Badge>
                                        <span className="text-xs font-medium text-slate-600">Posted</span>
                                    </div>
                                </div>

                                <div className="relative w-64">
                                    <Search className="absolute right-2 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Keyword search..."
                                        className="bg-white border-slate-300 pr-8 h-9 text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border border-slate-200 rounded-b-lg overflow-hidden mt-0">
                            <Table>
                                <TableHeader className="bg-sidebar">
                                    <TableRow>
                                        <TableHead className="font-semibold text-white h-10 whitespace-nowrap">Month</TableHead>
                                        <TableHead className="font-semibold text-white h-10 whitespace-nowrap">Windmill Number</TableHead>
                                        <TableHead className="font-semibold text-white h-10 whitespace-nowrap text-center">PDF</TableHead>
                                        <TableHead className="font-semibold text-white h-10 whitespace-nowrap text-center">Comparison Charges</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.map((row) => (
                                        <TableRow key={row.id} className="hover:bg-slate-50">
                                            <TableCell className="py-2 text-sm">{format(new Date(row.readingDate), "MMMM")}</TableCell>
                                            <TableCell className="py-2 text-sm">{row.windmillNumber}</TableCell>
                                            <TableCell className="py-2 text-center">
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50">
                                                    <FileText className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                            <TableCell className="py-2 text-center">
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-500 hover:text-blue-700 hover:bg-blue-50">
                                                    <Scale className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
