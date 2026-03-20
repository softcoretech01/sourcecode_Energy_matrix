import React, { useState } from "react";
import { Search, Wind, Users, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const reconciliationData = [
    { windmillNumber: "WM-001", exported: "1,200", consumed: "1,200", difference: "0" },
    { windmillNumber: "WM-001", exported: "1,200", consumed: "1,200", difference: "0" }, // Matched image values
    { windmillNumber: "WM-002", exported: "1,200", consumed: "1,200", difference: "0" },
];

export default function EnergyReconcilation() {
    const [remark, setRemark] = useState("");
    const [searchKeyword, setSearchKeyword] = useState("");

    const filteredData = reconciliationData.filter(row =>
        Object.values(row).some(val => String(val).toLowerCase().includes(searchKeyword.toLowerCase()))
    );

    return (
        <div className="p-4 bg-slate-50 min-h-screen font-sans">
            <h1 className="text-lg font-semibold text-slate-800 mb-6">Consumption Energy Reconciliation</h1>

            {/* Reconciliation Overview */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
                <div className="bg-blue-50/50 border-b border-blue-100 p-3 mb-4 -mx-4 -mt-4 rounded-t-lg">
                    <h2 className="text-sm font-semibold text-slate-700">Reconciliation Overview</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-indigo-50 p-4 rounded-lg flex flex-col items-center justify-center border border-indigo-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Wind className="h-5 w-5 text-indigo-600" />
                            <span className="text-sm font-semibold text-indigo-700">Total Exported Units</span>
                        </div>
                        <span className="text-2xl font-bold text-indigo-900">2,250</span>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-lg flex flex-col items-center justify-center border border-emerald-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="h-5 w-5 text-emerald-600" />
                            <span className="text-sm font-semibold text-emerald-700">Total Customer Consumption</span>
                        </div>
                        <span className="text-2xl font-bold text-emerald-900">2,250</span>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg flex flex-col items-center justify-center border border-red-100">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                            <span className="text-sm font-semibold text-red-700">Difference in Units</span>
                        </div>
                        <span className="text-2xl font-bold text-red-900">0</span>
                    </div>
                </div>

                {/* List inside the overview box */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="p-2 bg-blue-50/50 border-b border-blue-100 flex justify-between items-center">
                        <h2 className="text-sm font-semibold text-slate-700 pl-2">Consumption Reconciliation List</h2>
                        <div className="relative w-64">
                            <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Keyword search..."
                                className="bg-white border-slate-300 pr-10 h-8 text-xs"
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                            />
                        </div>
                    </div>
                    <Table>
                        <TableHeader className="bg-sidebar">
                            <TableRow>
                                <TableHead className="font-semibold text-white ">Wind Mill Number</TableHead>
                                <TableHead className="font-semibold text-white  text-right">Total Exported Units</TableHead>
                                <TableHead className="font-semibold text-white  text-right">Total Customer Consumption</TableHead>
                                <TableHead className="font-semibold text-white  text-right">Difference</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredData.map((row, index) => (
                                <TableRow key={index} className="hover:bg-slate-50 border-b border-slate-100">
                                    <TableCell className="py-2 text-slate-700">{row.windmillNumber}</TableCell>
                                    <TableCell className="py-2 text-slate-700 text-right">{row.exported}</TableCell>
                                    <TableCell className="py-2 text-slate-700 text-right">{row.consumed}</TableCell>
                                    <TableCell className="py-2 text-slate-700 text-right">{row.difference}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Remarks */}
                <div className="mb-6 mt-6">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-semibold text-slate-700">Remarks</span>
                        <span className="text-xs text-slate-500">{remark.length}/300 characters</span>
                    </div>
                    <Textarea
                        className="min-h-[100px] resize-none border-slate-200"
                        maxLength={300}
                        value={remark}
                        onChange={(e) => setRemark(e.target.value)}
                    />
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
        </div>
    );
};
