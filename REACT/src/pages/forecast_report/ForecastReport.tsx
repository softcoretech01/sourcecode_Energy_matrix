import React, { useState } from "react";
import { Wind, Users, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const allocationData = [
    { month: "Jan 2024", lt: "65,000", pct: "43.3%", texmo: "55,000", total: "120,000" },
    { month: "Feb 2024", lt: "60,000", pct: "46.2%", texmo: "40,000", total: "120,000" },
    { month: "Mar 2024", lt: "70,000", pct: "50.0%", texmo: "40,000", total: "120,000" },
    { month: "Apr 2024", lt: "58,000", pct: "52.3%", texmo: "20,000", total: "120,000" },
    { month: "May 2024", lt: "62,000", pct: "51.7%", texmo: "30,000", total: "120,000" },
    { month: "Jun 2024", lt: "54,000", pct: "55.1%", texmo: "205,000", total: "750,000" }, // Note: Sum of June seems way off in screenshot if total is 750k. 54k+205k != 750k. Screenshot Total row says 750,000. Wait, 750k is the column total logic but placed on Jun row? Or Jun row total is 259k? The screenshot shows Jun row Total as 750,000. I will copy screenshot values exactly.
];

export default function ForecastReport() {
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
        <div className="p-4 bg-slate-50 min-h-screen font-sans">
            <h1 className="text-lg font-semibold text-slate-800 mb-6">Forecast Report</h1>

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

            {/* Monthly Forecast Section */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
                <div className="bg-blue-50/50 border-b border-blue-100 p-3 mb-4 -mx-4 -mt-4 rounded-t-lg">
                    <h2 className="text-sm font-semibold text-slate-700">Monthly Allocation Forecast for 2024</h2>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-indigo-50 p-4 rounded-lg flex flex-col justify-center border border-indigo-100">
                        <div className="flex items-center gap-2 mb-1">
                            <Wind className="h-5 w-5 text-indigo-600" />
                            <span className="text-sm font-semibold text-indigo-700">Total Allocation:</span>
                        </div>
                        <div className="flex items-end gap-1 mb-1">
                            <span className="text-2xl font-bold text-indigo-900">750,000</span>
                            <span className="text-xs text-indigo-700 mb-1">Units</span>
                        </div>
                        <span className="text-xs text-indigo-500">(Shared 85.3% L&T / Texmo)</span>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-lg flex flex-col justify-center border border-emerald-100">
                        <div className="flex items-center gap-2 mb-1">
                            <Users className="h-5 w-5 text-emerald-600" />
                            <span className="text-sm font-semibold text-emerald-700">Total Consumed Units</span>
                        </div>
                        <div className="mb-1">
                            <span className="text-2xl font-bold text-emerald-900">2,450</span>
                        </div>
                        <span className="text-xs text-emerald-600">(Shared 85.3% L&T % Texmo)</span>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg flex flex-col justify-center border border-orange-100">
                        <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="h-5 w-5 text-orange-400" />
                            <span className="text-sm font-semibold text-orange-700">Difference</span>
                        </div>
                        <div>
                            <span className="text-2xl font-bold text-orange-900">0</span>
                        </div>
                    </div>
                </div>

                {/* Allocation Progress */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-2">
                    <h3 className="text-sm font-medium text-slate-700 mb-4">Allocation Breakdown by Customer</h3>

                    <div className="grid grid-cols-12 gap-4 items-center mb-4">
                        <div className="col-span-1 text-sm font-semibold text-slate-600">L&T</div>
                        <div className="col-span-1 text-sm font-bold text-indigo-600">49.3%</div>
                        <div className="col-span-1 text-sm font-semibold text-slate-600">Texmo</div>
                        <div className="col-span-8">
                            <div className="flex items-center gap-2">
                                <Progress value={70} className="h-3 bg-blue-100 data-[state=indeterminate]:bg-blue-100 [&>*]:bg-blue-500" />
                                <span className="text-xs font-semibold">100%</span>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-1 text-sm font-semibold text-slate-600">Total</div>
                        <div className="col-span-1 text-sm font-bold text-indigo-600">369,000</div>
                        <div className="col-span-1"></div>
                        <div className="col-span-8">
                            <div className="flex items-center gap-2">
                                <Progress value={60} className="h-3 bg-blue-100 data-[state=indeterminate]:bg-blue-100 [&>*]:bg-blue-400" />
                                <span className="text-xs font-semibold">100%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Allocation Breakdown Table */}
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Allocation Breakdown by Customer</h2>
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-6">
                <Table>
                    <TableHeader className="bg-sidebar">
                        <TableRow>
                            <TableHead className="text-white font-semibold h-10">Month</TableHead>
                            <TableHead className="text-white font-semibold h-10 text-right">L&T Allocation</TableHead>
                            <TableHead className="text-white font-semibold h-10 text-center">% of Allocation</TableHead>
                            <TableHead className="text-white font-semibold h-10 text-right">Texmo Allocation</TableHead>
                            <TableHead className="text-white font-semibold h-10 text-right">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {allocationData.map((row, i) => (
                            <TableRow key={i} className={i === allocationData.length - 1 ? "bg-blue-50/30 hover:bg-blue-100/30 font-bold" : "hover:bg-slate-50"}>
                                <TableCell className="py-3 text-indigo-900">{row.month}</TableCell>
                                <TableCell className="py-3 text-right">{row.lt}</TableCell>
                                <TableCell className="py-3 text-center">{row.pct}</TableCell>
                                <TableCell className="py-3 text-right">{row.texmo}</TableCell>
                                <TableCell className="py-3 text-right">{row.total}</TableCell>
                            </TableRow>
                        ))}
                        <TableRow className="bg-blue-50/50 font-bold">
                            <TableCell className="py-3 text-indigo-900">Total</TableCell>
                            <TableCell className="py-3 text-right">369,000</TableCell>
                            <TableCell className="py-3 text-center">100,000%</TableCell>
                            <TableCell className="py-3 text-right">750,000</TableCell>
                            <TableCell className="py-3 text-right">750,000</TableCell>
                        </TableRow>
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
