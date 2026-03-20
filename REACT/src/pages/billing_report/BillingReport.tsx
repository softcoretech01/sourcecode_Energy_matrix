import React, { useState } from "react";
import { Copy, Landmark, CheckCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const billingData1 = [
    { month: "Jan 2024", client: "L&T", consumed: "65,000", unitValue: "5.00", consumptionCharges: "₹ 300,000", invoiceAmount: "₹ 325,000", total: "120,000" },
    { month: "Feb 2024", client: "Texmo", consumed: "60,000", unitValue: "4.80", consumptionCharges: "₹ 260,000", invoiceAmount: "₹ 288,000", total: "120,000" },
    { month: "Mar 2024", client: "Texmo", consumed: "40,000", unitValue: "4.50", consumptionCharges: "₹ 160,000", invoiceAmount: "₹ 1,80,000", total: "120,000" },
    { month: "Mar 2024", client: "Texmo", consumed: "70,000", unitValue: "5.00", consumptionCharges: "₹ 330,000", invoiceAmount: "₹ 350,000", total: "120,000" },
    { month: "Mar 2024", client: "L&T", consumed: "70,000", unitValue: "5.00", consumptionCharges: "₹ 330,000", invoiceAmount: "₹ 350,000", total: "120,000" },
];

const billingData2 = [
    { month: "Jan 2024", client: "L&T", consumed: "65,000", unitValue: "5.00", consumptionCharges: "₹ 300,000", invoiceAmount: "₹ 3,25,000" },
    { month: "Feb 2024", client: "Texmo", consumed: "60,000", unitValue: "4.80", consumptionCharges: "₹ 260,000", invoiceAmount: "₹ 2,88,000" },
    { month: "Mar 2024", client: "Texmo", consumed: "40,000", unitValue: "4.50", consumptionCharges: "₹ 160,000", invoiceAmount: "₹ 1,80,000" },
    { month: "May 2024", client: "Texmo", consumed: "70,000", unitValue: "5.00", consumptionCharges: "₹ 330,000", invoiceAmount: "₹ 350,000" }, // Note: May in screenshot bottom table
];

export default function BillingReport() {
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
            <h1 className="text-lg font-semibold text-slate-800 mb-6">Billing Report</h1>

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

            {/* Billing Overview */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
                <div className="bg-blue-50/50 border-b border-blue-100 p-3 mb-4 -mx-4 -mt-4 rounded-t-lg">
                    <h2 className="text-sm font-semibold text-slate-700">Billing Overview</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-indigo-50 p-4 rounded-lg flex flex-col justify-center border border-indigo-100">
                        <div className="flex items-center gap-2 mb-1">
                            <Copy className="h-5 w-5 text-indigo-600" />
                            <span className="text-sm font-semibold text-indigo-700">Total Allocation:</span>
                        </div>
                        <div className="flex items-center gap-1 mb-1">
                            <span className="text-xl font-bold text-indigo-900">₹ 1,92,200</span>
                        </div>
                        <span className="text-xs text-indigo-500">(Shared 85.3% L&T/Texmo)</span>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-lg flex flex-col justify-center border border-emerald-100">
                        <div className="flex items-center gap-2 mb-1">
                            <Landmark className="h-5 w-5 text-emerald-600" />
                            <span className="text-sm font-semibold text-emerald-700">Total Consumed Units</span>
                        </div>
                        <div className="mb-1">
                            <span className="text-xl font-bold text-emerald-900">₹ 1,92,200</span>
                        </div>
                        <span className="text-xs text-emerald-600">(Shared 85.3% L&T/Texmo)</span>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg flex flex-col justify-center border border-orange-100">
                        <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="h-5 w-5 text-orange-400" />
                            <span className="text-sm font-semibold text-orange-700">Total Outstanding</span>
                        </div>
                        <div>
                            <span className="text-2xl font-bold text-orange-900">0</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actual Client Billing Details (With Search) */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-6">
                <div className="p-3 bg-blue-50/50 border-b border-blue-100 flex justify-between items-center rounded-t-lg">
                    <h2 className="text-sm font-semibold text-slate-700">Actual Client Billing Details</h2>
                    <div className="relative w-64">
                        <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Keyword search..."
                            className="bg-white border-slate-300 pr-10 h-8 text-xs"
                        />
                    </div>
                </div>
                <div className="overflow-hidden">
                    <Table>
                        <TableHeader className="bg-blue-50/30">
                            <TableRow>
                                <TableHead className="text-indigo-900 font-semibold h-10">Month</TableHead>
                                <TableHead className="text-indigo-900 font-semibold h-10">Client</TableHead>
                                <TableHead className="text-indigo-900 font-semibold h-10 text-right">Consumed Units</TableHead>
                                <TableHead className="text-indigo-900 font-semibold h-10 text-right">Unit Value (₹)</TableHead>
                                <TableHead className="text-indigo-900 font-semibold h-10 text-right">Consumption Charges</TableHead>
                                <TableHead className="text-indigo-900 font-semibold h-10 text-right">Invoice Amount (₹)</TableHead>
                                <TableHead className="text-indigo-900 font-semibold h-10 text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {billingData1.map((row, i) => (
                                <TableRow key={i} className="hover:bg-slate-50">
                                    <TableCell className="py-3 text-slate-700">{row.month}</TableCell>
                                    <TableCell className="py-3 text-slate-700">{row.client}</TableCell>
                                    <TableCell className="py-3 text-right text-slate-700">{row.consumed}</TableCell>
                                    <TableCell className="py-3 text-right text-slate-700">{row.unitValue}</TableCell>
                                    <TableCell className="py-3 text-right text-slate-700">{row.consumptionCharges}</TableCell>
                                    <TableCell className="py-3 text-right text-slate-700">{row.invoiceAmount}</TableCell>
                                    <TableCell className="py-3 text-right text-slate-700">{row.total}</TableCell>
                                </TableRow>
                            ))}
                            <TableRow className="bg-blue-50/50 font-bold">
                                <TableCell className="py-3">Total</TableCell>
                                <TableCell className="py-3">Total</TableCell>
                                <TableCell className="py-3 text-right">3,70,000</TableCell>
                                <TableCell className="py-3 text-right">100,000%</TableCell>
                                <TableCell className="py-3 text-right">₹ 15,00,000</TableCell>
                                <TableCell className="py-3 text-right">₹ 16,70,000</TableCell>
                                <TableCell className="py-3 text-right">100%</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Actual Client Billing Details (Bottom Table) */}
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Actual Client Billing Details</h2>
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-6">
                <Table>
                    <TableHeader className="bg-blue-50/30">
                        <TableRow>
                            <TableHead className="text-indigo-900 font-semibold h-10 bg-blue-100/30">Month</TableHead>
                            <TableHead className="text-indigo-900 font-semibold h-10 bg-blue-100/30">Client</TableHead>
                            <TableHead className="text-indigo-900 font-semibold h-10 text-right bg-blue-100/30">Consumed Units</TableHead>
                            <TableHead className="text-indigo-900 font-semibold h-10 text-right bg-blue-100/30">Unit Value (₹)</TableHead>
                            <TableHead className="text-indigo-900 font-semibold h-10 text-right bg-blue-100/30">Consumption Charges</TableHead>
                            <TableHead className="text-indigo-900 font-semibold h-10 text-right bg-blue-100/30">Invoice Amount (₹)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {billingData2.map((row, i) => (
                            <TableRow key={i} className="hover:bg-slate-50 border-b border-slate-100">
                                <TableCell className="py-3 text-slate-700 bg-slate-50/30">{row.month}</TableCell>
                                <TableCell className="py-3 text-slate-700">{row.client}</TableCell>
                                <TableCell className="py-3 text-right text-slate-700 bg-slate-50/30">{row.consumed}</TableCell>
                                <TableCell className="py-3 text-right text-slate-700">{row.unitValue}</TableCell>
                                <TableCell className="py-3 text-right text-slate-700 bg-slate-50/30">{row.consumptionCharges}</TableCell>
                                <TableCell className="py-3 text-right text-slate-700 bg-slate-50/30">{row.invoiceAmount}</TableCell>
                            </TableRow>
                        ))}
                        <TableRow className="bg-blue-50/50 font-bold border-t-2 border-slate-200">
                            <TableCell className="py-3">Total</TableCell>
                            <TableCell className="py-3">Total</TableCell>
                            <TableCell className="py-3 text-right">3,70,000</TableCell>
                            <TableCell className="py-3 text-right">750,000</TableCell>
                            <TableCell className="py-3 text-right">₹ 15,00,000</TableCell>
                            <TableCell className="py-3 text-right">₹ 16,70,000</TableCell>
                            {/* Assuming a total here, or empty if not provided in screenshot clearly (it is cut off). But previous total row had it. I'll Put 1,68,000 to match top table total or leave empty if unsure. Top table has 1,68,000.  */}
                            <TableCell className="py-3 text-right">₹ 1,68,000</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>

        </div>
    );
};
