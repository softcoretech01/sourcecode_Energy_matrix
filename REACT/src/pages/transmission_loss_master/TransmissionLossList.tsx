import React, { useState } from "react";
import { Search, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusSlider } from "@/components/StatusSlider";
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
import { useNavigate, useLocation } from "react-router-dom";
import { cn, formatDate } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import api from "@/services/api";
import { useEffect } from "react";



// Mock Data
export default function TransmissionLossList() {
    const navigate = useNavigate();
    const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
    const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString());
    const [searchKva, setSearchKva] = useState("");
    const [searchKeyword, setSearchKeyword] = useState("");

    const [appliedYear, setAppliedYear] = useState<string>(new Date().getFullYear().toString());
    const [appliedMonth, setAppliedMonth] = useState<string>((new Date().getMonth() + 1).toString());
    const [appliedKva, setAppliedKva] = useState("");
    const [lossData, setLossData] = useState<any[]>([]); // <-- instead of const lossData = [...]
    const [avgLoss, setAvgLoss] = useState(0);
    const location = useLocation();

    const fetchTransmissionLoss = async () => {
        try {
            const res = await api.get("/transmission/list");
            setLossData(res.data.map((item: any) => ({ ...item, status: Number(item.status) === 1 ? 1 : 0 })));
        } catch (err) {
            console.error("Failed to fetch transmission loss:", err);
        }
    };

    const fetchAvgLoss = async () => {
        try {
            const res = await api.get("/transmission/avg-loss");
            setAvgLoss(res.data.avg_loss);
        } catch (err) {
            console.error("Failed to fetch avg loss", err);
        }
    };

    useEffect(() => {
        fetchTransmissionLoss();
        fetchAvgLoss();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (location.pathname === "/master/transmission-loss") {
                fetchTransmissionLoss();
                fetchAvgLoss();
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [location.pathname]);

  const toggleTransmissionStatus = async (row: any) => {
    const newStatus = Number(row.status) === 1 ? 0 : 1;

    try {
      await api.put(`/transmission/update/${row.id}`, {
        kva: row.kva,
        loss_percentage: row.loss_percentage,
        valid_from: row.valid_from,
        remarks: row.remarks,
        is_submitted: row.is_submitted ?? 0,
        status: newStatus,
      });

      setLossData((prev) =>
        prev.map((item) => (item.id === row.id ? { ...item, status: newStatus } : item))
      );
    } catch (err) {
      console.error("Failed to update transmission status", err);
      // optional: revert or notify
    }
  };





const handleDelete = async (id: number) => {

    try {
        await api.delete(`/transmission/delete/${id}`);

        setLossData(prev => prev.filter(item => item.id !== id));

        // ✅ refresh avg loss
        const res = await api.get("/transmission/avg-loss");
        setAvgLoss(res.data.avg_loss);

    } catch (err) {
        console.error("Delete failed:", err);
    }
};

    const handleSearch = () => {
        setAppliedYear(selectedYear);
        setAppliedMonth(selectedMonth);
        setAppliedKva(searchKva);
    };

    const handleCancel = () => {
        setSelectedYear(new Date().getFullYear().toString());
        setSelectedMonth((new Date().getMonth() + 1).toString());
        setSearchKva("");
        setSearchKeyword("");
        setAppliedYear(new Date().getFullYear().toString());
        setAppliedMonth((new Date().getMonth() + 1).toString());
        setAppliedKva("");
    };



const handleExportExcel = () => {
    if (filteredData.length === 0) {
        alert("No data to export");
        return;
    }

    // ✅ CSV Header
    const header = [
        "KVA",
        "From Date",
        "Loss %",
        "Submission Status"
    ];

    // ✅ Rows
    const rows = filteredData.map((row) => [
        row.kva,
        row.valid_from,
        row.loss_percentage,
        row.is_submitted === 1 ? "Posted" : "Saved"
    ]);

    // ✅ Convert to CSV
    const csvContent =
        "data:text/csv;charset=utf-8," +
        [header, ...rows].map((e) => e.join(",")).join("\n");

    // ✅ Download file
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");

    link.setAttribute("href", encodedUri);
    link.setAttribute(
        "download",
        `transmission_loss_${new Date().toISOString()}.csv`
    );

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};



    const filteredData = lossData.filter(row => {
  const matchesKva = row.kva?.toLowerCase().includes(appliedKva.toLowerCase());
  const matchesGlobal =
    searchKeyword === "" ||
    Object.values(row).some(val => String(val).toLowerCase().includes(searchKeyword.toLowerCase()));

  if (!row.valid_from) return false;

  const [year, month, day] = row.valid_from.split("-"); // format: yyyy-mm-dd
  const matchesYear = year === appliedYear;
  const matchesMonth = parseInt(month, 10).toString() === appliedMonth;

  return matchesKva && matchesGlobal && matchesYear && matchesMonth;
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
            <div className="w-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-3 space-y-2">
                    {/* Page Title */}
                    <div className="flex items-center justify-between pb-2">
                        <h1 className="text-xl font-bold text-slate-800">Transmission Loss Master - List</h1>
                    </div>

                    <div className="space-y-1">
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap gap-2 items-center">
                            <span className="text-sm font-semibold text-slate-600 mr-2">Search</span>

                            <div className="w-[200px]">
                                <Select value={searchKva} onValueChange={(val) => setSearchKva(val === "all" ? "" : val)}>
                                    <SelectTrigger className="bg-white border-slate-200 h-9 text-sm">
                                        <SelectValue placeholder="Select KVA" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All KVA</SelectItem>
                                        {Array.from(new Set(lossData.map(item => item.kva))).map(kva => (
                                            <SelectItem key={kva} value={kva}>{kva}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

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
                            <Button size="sm" className="h-9 text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-4" onClick={() => navigate("/master/transmission-loss/add")}>
                                + New
                            </Button>
                           <Button
    size="sm"
    className="h-9 text-sm bg-[#DAA520] hover:bg-[#B8860B] text-white px-4"
    onClick={handleExportExcel}
>
    Export Excel
</Button>
                            <Button size="sm" className="h-9 text-sm bg-red-600 hover:bg-red-700 text-white px-4" onClick={handleCancel}>
                                Cancel
                            </Button>
                        </div>
                    </div>

                    {/* Transaction List Header with Legend */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center bg-primary/5 p-2 rounded-t-lg border-b border-primary/10 h-10">
                            <div className="flex items-center gap-4 pl-2">
                                <h2 className="text-sm font-semibold text-primary">Transmission Loss Data</h2>
                               <span className="font-bold text-[#B22222] text-xs">
    Average Transmission loss: {avgLoss?.toFixed(2)}%
</span>
                            </div>

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
                                        <TableHead className="font-semibold text-white h-10 whitespace-nowrap">KVA</TableHead>
                                        <TableHead className="font-semibold text-white h-10 whitespace-nowrap">From Date</TableHead>
                                        
                                        <TableHead className="font-semibold text-white h-10 whitespace-nowrap">Loss %</TableHead>
                                        <TableHead className="font-semibold text-white h-10 whitespace-nowrap">Status</TableHead>
                                        <TableHead className="font-semibold text-white text-center h-10 whitespace-nowrap">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredData.length > 0 ? (
                                        filteredData.map((row, index) => (
                                            <TableRow key={index} className="hover:bg-slate-50 bg-white">
                                                <TableCell className="py-2 text-sm">{row.kva}</TableCell>
                                                <TableCell className="py-2 text-sm">{row.valid_from ? formatDate(new Date(row.valid_from)) : "-"}</TableCell>
                                               
<TableCell className="py-2 text-sm">{row.loss_percentage}</TableCell>
                                                <TableCell className="py-2">
  <Badge
  className={cn(
    "font-bold w-6 h-6 rounded flex items-center justify-center p-0 border-none",
    row.is_submitted === 1
      ? "bg-emerald-600 text-white" // Posted
      : "bg-red-600 text-white"     // Saved
  )}
>
  {row.is_submitted === 1 ? "P" : "S"}
</Badge>
</TableCell>
                                                <TableCell className="py-2 text-center">
                                                    <div className="flex justify-center gap-1 items-center">
                                                        <StatusSlider
                                                            status={row.status}
                                                            onToggle={() => toggleTransmissionStatus(row)}
                                                        />
                                                        <Button
  variant="ghost"
  size="icon"
  className="h-6 w-6 text-primary hover:text-primary hover:bg-primary/10"
  onClick={() => navigate(`/master/transmission-loss/edit/${row.id}`)}
  disabled={row.is_submitted === 1}
title={row.is_submitted === 1 ? "Cannot edit posted record" : "Edit"}
>
  <Edit className="h-4 w-4" />
</Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-4 text-slate-500">
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
