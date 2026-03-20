import React, { useState } from "react";
import * as XLSX from "xlsx";
import { Search, Plus, Edit } from "lucide-react";
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
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function InvestorsList() {
    const navigate = useNavigate();
    const [investorsData, setInvestorsData] = useState<any[]>([]);
    const [searchInvestor, setSearchInvestor] = useState("");
    const [searchKeyword, setSearchKeyword] = useState("");
    const [appliedInvestor, setAppliedInvestor] = useState("");

    const fetchInvestors = async () => {
        const token = localStorage.getItem("access_token");
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/investors/list`, {
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            if (!res.ok) throw new Error(`Failed to load investors (${res.status})`);
            const data = await res.json();
            const normalized = Array.isArray(data)
                ? data
                    .map((item) => ({
                        ...item,
                        investorName: item.investor_name || "",
                        shareQuantity: item.share_quantity || 0,
                        activeStatus: item.status === 1 ? "active" : "inactive",
                        is_submitted: Number(item.is_submitted) || 0,
                    }))
                    .sort((a, b) => Number(b.id) - Number(a.id))
                : [];

            setInvestorsData(normalized);
        } catch (err) {
            console.error(err);
            alert("Unable to load investors. Check console for details.");
        }
    };

    React.useEffect(() => {
        fetchInvestors();
    }, []);

    const handleSearch = () => {
        setAppliedInvestor(searchInvestor);
    };

    const handleCancel = () => {
        setSearchInvestor("");
        setSearchKeyword("");
        setAppliedInvestor("");
    };

    const filteredData = investorsData.filter(row => {
        const matchesInvestor = row.investorName.toLowerCase().includes(appliedInvestor.toLowerCase());
        const matchesGlobal = searchKeyword === "" ||
            Object.values(row).some(val => String(val).toLowerCase().includes(searchKeyword.toLowerCase()));

        return matchesInvestor && matchesGlobal;
    });

    const handleExportExcel = () => {
        const exportData = filteredData.map((row) => ({
            "Investor Name": row.investorName,
            "Share Quantity": row.shareQuantity,
            "Status": row.activeStatus === "active" ? "Active" : "Inactive",
            "Post Status": row.is_submitted === 1 ? "Posted" : "Saved",
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Investors");
        XLSX.writeFile(workbook, "Investors_Master_Details.xlsx");
    };

    return (
        <div className="p-2 bg-slate-50 min-h-screen font-sans">
            <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-3 space-y-2">
                    {/* Page Title */}
                    <div className="flex items-center justify-between pb-2">
                        <h1 className="text-xl font-bold text-slate-800">Master Investors - List</h1>
                    </div>

                    <div className="space-y-1">
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap gap-2 items-center">
                            <span className="text-sm font-semibold text-slate-600 mr-2">Search</span>

                            <div className="w-[200px]">
                                <Select value={searchInvestor} onValueChange={(val) => setSearchInvestor(val === "all" ? "" : val)}>
                                    <SelectTrigger className="bg-white border-slate-200 h-9 text-sm">
                                        <SelectValue placeholder="Select Investor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Investors</SelectItem>
                                        {Array.from(new Set(investorsData.map(item => item.investorName))).map(investor => (
                                            <SelectItem key={investor} value={investor}>{investor}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex-1"></div>

                            <Button size="sm" className="h-9 text-sm bg-primary hover:bg-primary/90 text-primary-foreground px-4" onClick={handleSearch}>
                                Search
                            </Button>
                            <Button size="sm" className="h-9 text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-4" onClick={() => navigate("/master/investors/add")}>
                                + New
                            </Button>
                            <Button size="sm" className="h-9 text-sm bg-[#DAA520] hover:bg-[#B8860B] text-white px-4" onClick={handleExportExcel}>
                                Export Excel
                            </Button>
                            <Button size="sm" className="h-9 text-sm bg-red-600 hover:bg-red-700 text-white px-4" onClick={handleCancel}>
                                Cancel
                            </Button>
                        </div>
                    </div>

                    {/* List Table Section */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center bg-primary/5 p-2 rounded-t-lg border-b border-primary/10 h-10">
                            <h2 className="text-sm font-semibold text-primary pl-2">Investors Master Data</h2>


                            <div className="flex items-center gap-4">
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
                                        <TableHead className="py-2 h-10 font-semibold text-white whitespace-nowrap">Investor Name</TableHead>
                                        <TableHead className="py-2 h-10 font-semibold text-white whitespace-nowrap">Share Quantity</TableHead>
                                        <TableHead className="py-2 h-10 font-semibold text-white whitespace-nowrap"></TableHead>
                                        <TableHead className="py-2 h-10 font-semibold text-white whitespace-nowrap">Status</TableHead>
                                        <TableHead className="py-2 h-10 font-semibold text-white text-center whitespace-nowrap w-24">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredData.length > 0 ? (
                                        filteredData.map((row) => (
                                            <TableRow key={row.id} className="hover:bg-slate-50 bg-white">
                                                <TableCell className="py-2 text-slate-600 font-medium text-sm">{row.investorName}</TableCell>
                                                <TableCell className="py-2 text-slate-600 font-medium text-sm">{row.shareQuantity}</TableCell>
                                                <TableCell className="py-2">
                                                    <Badge
                                                        className={cn(
                                                            "font-bold px-2 py-0.5 rounded text-xs border-none",
                                                            row.activeStatus === "active" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-red-100 text-red-700 hover:bg-red-200"
                                                        )}
                                                    >
                                                        {row.activeStatus === "active" ? "Active" : "Inactive"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-2">
                                                    <Badge
                                                        className={cn(
                                                            "font-bold w-6 h-6 rounded flex items-center justify-center p-0 border-none",
                                                            row.is_submitted === 1 ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"
                                                        )}
                                                    >
                                                        {row.is_submitted === 1 ? "P" : "S"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-2 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className={row.is_submitted === 1 ? "h-6 w-6 text-slate-300" : "h-6 w-6 text-primary hover:text-primary hover:bg-primary/10"}
                                                            onClick={() => navigate(`/master/investors/edit/${row.id}`)}
                                                            disabled={row.is_submitted === 1}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </div>
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
}
