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
import { cn, formatDate } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

// Mock Data matching the screenshot
const data = [
    {
        id: 1,
        readingDate: "2026-02-18",
        windmillNumber: "WM-001",
        customer: "L&T",
        seNumber: "SC-1001",
        exportedKwh: "1,200",
        consumedKwh: "300",
        unitValueExport: "5",
        unitValueImport: "4,500", // Net payable in screenshot is last col, 4500. Wait. 300 * ?
        netPayable: "4,500",
        status: "Saved",
    },
    {
        id: 2,
        readingDate: "2026-02-21",
        windmillNumber: "WM-002",
        customer: "Texmo",
        seNumber: "SC-1002",
        exportedKwh: "1,050",
        consumedKwh: "290",
        unitValueExport: "4.80",
        unitValueImport: "3,624",
        netPayable: "3,624",
        status: "Posted",
    },
    {
        id: 3,
        readingDate: "2026-02-20",
        windmillNumber: "WM-003",
        customer: "ABC Energy",
        seNumber: "SC-1003",
        exportedKwh: "1,300",
        consumedKwh: "310",
        unitValueExport: "5.20",
        unitValueImport: "5,096",
        netPayable: "5,096",
        status: "Saved",
    },
];

export default function ActualsList() {
    const navigate = useNavigate();
    const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
    const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString());
    const [selectedWm, setSelectedWm] = useState("");
    const [searchKeyword, setSearchKeyword] = useState("");

    const [appliedYear, setAppliedYear] = useState<string>(new Date().getFullYear().toString());
    const [appliedMonth, setAppliedMonth] = useState<string>((new Date().getMonth() + 1).toString());
    const [appliedWm, setAppliedWm] = useState("");

    const handleSearch = () => {
        setAppliedYear(selectedYear);
        setAppliedMonth(selectedMonth);
        setAppliedWm(selectedWm);
    };

    const handleCancel = () => {
        setSelectedYear(currentYear.toString());
        setSelectedMonth((new Date().getMonth() + 1).toString());
        setSelectedWm("");
        setSearchKeyword("");
        setAppliedYear(currentYear.toString());
        setAppliedMonth((new Date().getMonth() + 1).toString());
        setAppliedWm("");
    };

    const filteredData = data.filter(row => {
        const rowDate = new Date(row.readingDate);
        const matchesYear = rowDate.getFullYear().toString() === appliedYear;
        const matchesMonth = (rowDate.getMonth() + 1).toString() === appliedMonth;
        const matchesWm = appliedWm === "" || appliedWm === "all" || row.windmillNumber.toLowerCase() === appliedWm.toLowerCase();
        const matchesGlobal = searchKeyword === "" ||
            Object.values(row).some(val => String(val).toLowerCase().includes(searchKeyword.toLowerCase()));

        return matchesYear && matchesMonth && matchesWm && matchesGlobal;
    });

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
                        <h1 className="text-xl font-bold text-slate-800">Actuals</h1>
                    </div>

                    {/* Search Filters */}
                    <div className="space-y-1">
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap gap-2 items-center">
                            <span className="text-sm font-semibold text-slate-600 mr-2">Search</span>
                            <Select value={selectedWm} onValueChange={(val) => setSelectedWm(val === "all" ? "" : val)}>
                                <SelectTrigger className="w-[200px] h-9 bg-white border-slate-300 text-sm">
                                    <SelectValue placeholder="Select Windmill" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Windmills</SelectItem>
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

                            <Button size="sm" className="h-9 text-sm bg-primary hover:bg-primary/90 text-primary-foreground px-4" onClick={handleSearch}>
                                Search
                            </Button>
                            <Button size="sm" className="h-9 text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-4" onClick={() => navigate("/windmill/actuals/add")}>
                                + New
                            </Button>
                            <Button size="sm" className="h-9 text-sm bg-[#DAA520] hover:bg-[#B8860B] text-white px-4">
                                Export Excel
                            </Button>
                            <Button size="sm" className="h-9 text-sm bg-red-600 hover:bg-red-700 text-white px-4" onClick={handleCancel}>
                                Cancel
                            </Button>
                        </div>
                    </div>

                    {/* Transaction List */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center bg-primary/5 p-2 rounded-t-lg border-b border-primary/10 h-10">
                            <h2 className="text-sm font-semibold text-primary pl-2">Actuals List</h2>

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
                                        value={searchKeyword}
                                        onChange={(e) => setSearchKeyword(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border border-slate-200 rounded-b-lg overflow-hidden mt-0">
                            <Table>
                                <TableHeader className="bg-sidebar">
                                    <TableRow>
                                        <TableHead className="font-semibold text-white h-10 whitespace-nowrap">Month</TableHead>
                                        <TableHead className="font-semibold text-white h-10 whitespace-nowrap">Customer</TableHead>
                                        <TableHead className="font-semibold text-white h-10 whitespace-nowrap">SC Number</TableHead>
                                        <TableHead className="font-semibold text-white h-10 whitespace-nowrap text-center">PDF</TableHead>
                                        <TableHead className="font-semibold text-white h-10 whitespace-nowrap text-center">Auto Reconciled Bill</TableHead>

                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredData.length > 0 ? (
                                        filteredData.map((row) => (
                                            <TableRow key={row.id} className="hover:bg-slate-50">
                                                <TableCell className="py-2 text-sm">{formatDate(new Date(row.readingDate))}</TableCell>
                                                <TableCell className="py-2 text-sm">{row.customer}</TableCell>
                                                <TableCell className="py-2 text-sm">{row.seNumber}</TableCell>
                                                <TableCell className="py-2 text-center">
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50">
                                                        <FileText className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                                <TableCell className="py-2 text-center">
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50">
                                                        <FileText className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-4 text-slate-500">
                                                No records found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
