import React, { useState, useEffect } from "react";
import { Search, Edit, Upload, FileText, Scale } from "lucide-react";
import { format } from "date-fns";
import api from "@/services/api";
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

// Mock data is no longer needed

export default function EBBillList() {
    const navigate = useNavigate();
    const [ebBills, setEbBills] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState<string>("");
    const [selectedMonth, setSelectedMonth] = useState<string>("");
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                // Fetch customers for dropdown — same source as the Add page
                const custRes = await api.get("/eb-bill/customers");
                if (custRes.data?.status === "success" && Array.isArray(custRes.data.data)) {
                    setCustomers(custRes.data.data);
                }

                // Initial fetch for bills
                const res = await api.get("/eb-bill/list");
                if (res.data?.status === "success") {
                    setEbBills(res.data.data);
                }
            } catch (err) {
                console.error("Failed to fetch initial data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    const handleSearch = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (selectedCustomerId && selectedCustomerId !== "none") params.customer_id = selectedCustomerId;
            if (selectedYear) params.year = selectedYear;
            if (selectedMonth) params.month = selectedMonth;

            const res = await api.get("/eb-bill/list", { params });
            if (res.data?.status === "success") {
                setEbBills(res.data.data);
            }
        } catch (err) {
            console.error("Search failed", err);
            alert("Failed to search bills");
        } finally {
            setLoading(false);
        }
    };

    const handleViewPdf = async (id: number) => {
        try {
            const res = await api.get(`/eb-bill/view/${id}`);
            if (res.status === 200) {
                const viewData = { ...res.data, isViewMode: true };
                sessionStorage.setItem("ebData", JSON.stringify(viewData));
                navigate("/windmill/eb-bill/pdf");
            }
        } catch (err) {
            console.error("Failed to view EB bill", err);
            alert("Error loading EB bill details");
        }
    };

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
                            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                                <SelectTrigger className="w-[200px] h-9 bg-white border-slate-300 text-sm">
                                    <SelectValue placeholder="Select Customer" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">All Customers</SelectItem>
                                    {customers.map((c) => (
                                        <SelectItem key={c.id} value={c.id.toString()}>
                                            {c.customer_name}
                                        </SelectItem>
                                    ))}
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
                            <Button size="sm" className="h-9 text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-4" onClick={() => navigate("/windmill/eb-bill/add")}>
                                + New
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
                                        <TableHead className="font-semibold text-white h-10 whitespace-nowrap">Customer Name</TableHead>
                                        <TableHead className="font-semibold text-white h-10 whitespace-nowrap text-center">PDF</TableHead>
                                        <TableHead className="font-semibold text-white h-10 whitespace-nowrap text-center">Comparison Charges</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-4 text-slate-500">
                                                Loading EB Bills...
                                            </TableCell>
                                        </TableRow>
                                    ) : ebBills.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-4 text-slate-500">
                                                No EB Bills found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        ebBills.map((row, idx) => (
                                            <TableRow key={idx} className="hover:bg-slate-50">
                                                <TableCell className="py-2 text-sm font-medium">
                                                    {months.find(m => m.value === String(row.bill_month))?.label || row.bill_month}
                                                </TableCell>
                                                <TableCell className="py-2 text-sm">
                                                    {row.customer_name}
                                                </TableCell>
                                                <TableCell className="py-2 text-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleViewPdf(row.id)}
                                                    >
                                                        <FileText className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                                <TableCell className="py-2 text-center">
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-500 hover:text-blue-700 hover:bg-blue-50">
                                                        <Scale className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
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
