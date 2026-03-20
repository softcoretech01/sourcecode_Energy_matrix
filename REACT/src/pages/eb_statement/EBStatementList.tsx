import React, { useEffect, useState } from "react";
import { Search as SearchIcon, FileText, Scale } from "lucide-react";
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
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import api from "@/services/api";
import { toast } from "sonner"; // Assuming sonner is used based on typical energy matrix patterns, if not will use alert

interface EBStatement {
    id: number;
    month: string;
    year: number;
    windmill_number: string;
    pdf: string;
    is_submitted: number;
}

interface Windmill {
    id: number;
    windmill_number: string;
}

export default function EBStatementList() {
    const navigate = useNavigate();
    const [statements, setStatements] = useState<EBStatement[]>([]);
    const [windmills, setWindmills] = useState<Windmill[]>([]);
    const [loading, setLoading] = useState(false);

    const [selectedWindmill, setSelectedWindmill] = useState<string>("all");
    const [selectedYear, setSelectedYear] = useState<string>("all");
    const [selectedMonth, setSelectedMonth] = useState<string>("all");
    const [keyword, setKeyword] = useState<string>("");

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    const months = [
        { value: "January", label: "January" },
        { value: "February", label: "February" },
        { value: "March", label: "March" },
        { value: "April", label: "April" },
        { value: "May", label: "May" },
        { value: "June", label: "June" },
        { value: "July", label: "July" },
        { value: "August", label: "August" },
        { value: "September", label: "September" },
        { value: "October", label: "October" },
        { value: "November", label: "November" },
        { value: "December", label: "December" },
    ];

    useEffect(() => {
        fetchWindmills();
        fetchEBStatements();
    }, []);

    const fetchWindmills = async () => {
        try {
            const response = await api.get("/eb/windmills");
            if (response.data.status === "success") {
                setWindmills(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching windmills:", error);
        }
    };

    const fetchEBStatements = async () => {
        setLoading(true);
        try {
            const params = {
                windmill_number: selectedWindmill === "all" ? undefined : selectedWindmill,
                year: selectedYear === "all" ? undefined : parseInt(selectedYear),
                month: selectedMonth === "all" ? undefined : selectedMonth,
                keyword: keyword || undefined
            };
            const response = await api.get("/eb/list", { params });
            if (response.data.status === "success") {
                setStatements(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching EB statements:", error);
            toast.error("Failed to fetch EB statements");
        } finally {
            setLoading(false);
        }
    };



    const handleSearch = () => {
        fetchEBStatements();
    };

    return (
        <div className="p-2 bg-slate-50 min-h-screen font-sans">
            <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="p-3 space-y-2">
                    {/* Page Title */}
                    <div className="flex items-center justify-between pb-1">
                        <h1 className="text-xl font-bold text-slate-800">EB Statement - List</h1>
                    </div>

                    {/* Search Filters */}
                    <div className="space-y-1">
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap gap-2 items-center">
                            <span className="text-sm font-semibold text-slate-600 mr-2">Search</span>
                            <Select value={selectedWindmill} onValueChange={setSelectedWindmill}>
                                <SelectTrigger className="w-[200px] h-9 bg-white border-slate-300 text-sm">
                                    <SelectValue placeholder="Select Windmill" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Windmills</SelectItem>
                                    {windmills.map((wm) => (
                                        <SelectItem key={wm.id} value={wm.windmill_number}>
                                            {wm.windmill_number}
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
                                    <SelectItem value="all">All Years</SelectItem>
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
                                    <SelectItem value="all">All Months</SelectItem>
                                    {months.map((month) => (
                                        <SelectItem key={month.value} value={month.value}>
                                            {month.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className="flex-1"></div>

                            <Button onClick={handleSearch} size="sm" className="h-9 text-sm bg-primary hover:bg-primary/90 text-primary-foreground px-4">
                                Search
                            </Button>
                            <Button size="sm" className="h-9 text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-4" onClick={() => navigate("/eb-statement/add")}>
                                + New
                            </Button>
                            <Button size="sm" className="h-9 text-sm bg-red-600 hover:bg-red-700 text-white px-4" onClick={() => {
                                setSelectedWindmill("all");
                                setSelectedYear("all");
                                setSelectedMonth("all");
                                setKeyword("");
                            }}>
                                Cancel
                            </Button>
                        </div>
                    </div>

                    {/* Transaction List */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center bg-primary/5 p-2 rounded-t-lg border-b border-primary/10 h-10">
                            <h2 className="text-sm font-semibold text-primary pl-2">EB Statement List</h2>

                            <div className="flex items-center gap-4">
                                <div className="relative w-64">
                                    <SearchIcon className="absolute right-2 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Keyword search..."
                                        className="bg-white border-slate-300 pr-8 h-9 text-sm"
                                        value={keyword}
                                        onChange={(e) => setKeyword(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
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
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-10 text-slate-500">
                                                Loading EB Statements...
                                            </TableCell>
                                        </TableRow>
                                    ) : statements.length > 0 ? (
                                        statements.map((row) => (
                                            <TableRow key={row.id} className="hover:bg-slate-50">
                                                <TableCell className="py-2 text-sm">{row.month}</TableCell>
                                                <TableCell className="py-2 text-sm">{row.windmill_number}</TableCell>
                                                <TableCell className="py-2 text-center">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => {
                                                            const filename = row.pdf.split(/[\\/]/).pop();
                                                            window.open(`/eb-statement/pdf?file=${filename}`, "_blank");
                                                        }}
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
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                                                No EB Statements found.
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
