import React, { useState } from "react";
import { Search, Save, Wind, Users, CheckCircle } from "lucide-react";
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
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const powerPlantData = [
    { windmillNumber: "WM-001", c1: "200", c2: "100", c4: "60", c5: "50" },
    { windmillNumber: "WM-002", c1: "180", c2: "100", c4: "80", c5: "50" },
];

const allocatedData = [
    { windmillNumber: "WM-001", c1: "130", c2: "60", c4: "50", c5: "30" },
    { windmillNumber: "WM-002", c1: "200", c2: "90", c4: "70", c5: "45" },
];

const systemBankingData = [
    { windmillNumber: "WM-001", c1: "70", c2: "40", c4: "10", c5: "20" },
    { windmillNumber: "WM-002", c1: "-20", c2: "10", c4: "10", c5: "5" },
];

const ebBankingData = [
    { windmillNumber: "WM-001", c1: "60", c2: "30", c4: "20", c5: "10" },
    { windmillNumber: "WM-002", c1: "-10", c2: "10", c4: "5", c5: "15" },
];

type ReportType = 'power-plant' | 'allocated' | 'system-banking' | 'eb-banking';

export default function BankReport() {
    const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
    const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString());
    const [activeReport, setActiveReport] = useState<ReportType>('system-banking');

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
        <div className="p-4 bg-slate-50 min-h-screen font-sans">
            <h1 className="text-lg font-semibold text-indigo-900 mb-4"> Bank Report</h1>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
                {/* Year Selection */}
                <div className="w-[200px]">
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Year</label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="bg-white border-slate-300">
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
                </div>

                {/* Month Selection */}
                <div className="w-[200px]">
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Month</label>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="bg-white border-slate-300">
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
                </div>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div
                    className={`p-4 rounded-lg flex flex-col items-center justify-center border transition-all ${activeReport === 'power-plant' ? 'bg-indigo-100 border-indigo-300 ring-2 ring-indigo-500' : 'bg-indigo-50 border-indigo-100 hover:bg-indigo-100'}`}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Wind className="h-5 w-5 text-indigo-600" />
                        <span className="text-sm font-semibold text-indigo-700">Power Plant Units</span>
                    </div>
                    <span
                        className="text-2xl font-bold text-indigo-900 cursor-pointer hover:underline"
                        onClick={() => setActiveReport('power-plant')}
                    >
                        2,450
                    </span>
                </div>
                <div
                    className={`p-4 rounded-lg flex flex-col items-center justify-center border transition-all ${activeReport === 'allocated' ? 'bg-emerald-100 border-emerald-300 ring-2 ring-emerald-500' : 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100'}`}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Users className="h-5 w-5 text-emerald-600" />
                        <span className="text-sm font-semibold text-emerald-700">Allocated Units</span>
                    </div>
                    <span
                        className="text-2xl font-bold text-emerald-900 cursor-pointer hover:underline"
                        onClick={() => setActiveReport('allocated')}
                    >
                        2,250
                    </span>
                </div>
                <div className="flex flex-col gap-3 h-full">
                    <div
                        className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-between border transition-all ${activeReport === 'system-banking' ? 'bg-orange-100 border-orange-300 ring-2 ring-orange-500' : 'bg-orange-50 border-orange-100 hover:bg-orange-100'}`}
                    >
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-orange-400" />
                            <span className="text-sm font-semibold text-orange-700">System Banking</span>
                        </div>
                        <span
                            className="text-xl font-bold text-orange-900 cursor-pointer hover:underline"
                            onClick={() => setActiveReport('system-banking')}
                        >
                            100
                        </span>
                    </div>
                    <div
                        className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-between border transition-all ${activeReport === 'eb-banking' ? 'bg-orange-100 border-orange-300 ring-2 ring-orange-500' : 'bg-orange-50 border-orange-100 hover:bg-orange-100'}`}
                    >
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-orange-400" />
                            <span className="text-sm font-semibold text-orange-700">EB Banking</span>
                        </div>
                        <span
                            className="text-xl font-bold text-orange-900 cursor-pointer hover:underline"
                            onClick={() => setActiveReport('eb-banking')}
                        >
                            100
                        </span>
                    </div>
                </div>
            </div>

            {/* Breakdown Table */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-6">
                <div className="p-4 bg-blue-50/50 border-b border-blue-100 flex justify-between items-center rounded-t-lg">
                    <h2 className="text-sm font-semibold text-slate-700">
                        {activeReport === 'power-plant' && "Power Plant Breakdown"}
                        {activeReport === 'allocated' && "Allocated Units Breakdown"}
                        {activeReport === 'system-banking' && (
                            <span>
                                System Banking Units Breakdown <span className="text-red-500 text-xs ml-2">(14% will be deducted for bank loss %)</span>
                            </span>
                        )}
                        {activeReport === 'eb-banking' && (
                            <span>
                                EB Banking Units Breakdown <span className="text-red-500 text-xs ml-2">(14% will be deducted for bank loss %)</span>
                            </span>
                        )}
                    </h2>
                    <div className="relative w-64">
                        <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Keyword search..."
                            className="bg-white border-slate-300 pr-10 h-8 text-xs"
                        />
                    </div>
                </div>
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="font-semibold text-slate-700 bg-blue-50/30">Windmill Number</TableHead>
                            <TableHead className="font-semibold text-slate-700 bg-blue-50/30 text-right">C1</TableHead>
                            <TableHead className="font-semibold text-slate-700 bg-blue-50/30 text-right">C2</TableHead>
                            <TableHead className="font-semibold text-slate-700 bg-blue-50/30 text-right">C4</TableHead>
                            <TableHead className="font-semibold text-slate-700 bg-blue-50/30 text-right">C5</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {(activeReport === 'power-plant' ? powerPlantData :
                            activeReport === 'allocated' ? allocatedData :
                                activeReport === 'system-banking' ? systemBankingData :
                                    ebBankingData).map((row, index) => (
                                        <TableRow key={index} className="hover:bg-slate-50">
                                            <TableCell className="py-2">{row.windmillNumber}</TableCell>
                                            <TableCell className="py-2 text-right">{row.c1}</TableCell>
                                            <TableCell className="py-2 text-right">{row.c2}</TableCell>
                                            <TableCell className="py-2 text-right">{row.c4}</TableCell>
                                            <TableCell className="py-2 text-right">{row.c5}</TableCell>
                                        </TableRow>
                                    ))}
                    </TableBody>
                </Table>
            </div>



            {/* Actions */}
            <div className="flex gap-4">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white w-24">
                    Save
                </Button>
                <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white w-24">
                    Cancel
                </Button>
            </div>
        </div>
    );
};
