import React, { useState } from "react";
import { Search, Edit, Trash2, Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { formatDate } from "@/lib/utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
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

import api from "@/services/api";
import { useEffect } from "react";
import axios from "axios";



// Mock Data

export default function WindmillList() {
    const navigate = useNavigate();
    const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
    const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString());
    const [fromDate, setFromDate] = useState<Date>();
    const [toDate, setToDate] = useState<Date>();
    const [selectedWm, setSelectedWm] = useState("");
    const [searchKeyword, setSearchKeyword] = useState("");

    const [appliedYear, setAppliedYear] = useState<string>(new Date().getFullYear().toString());
    const [appliedMonth, setAppliedMonth] = useState<string>((new Date().getMonth() + 1).toString());
    const [appliedFromDate, setAppliedFromDate] = useState<Date>();
    const [appliedToDate, setAppliedToDate] = useState<Date>();
    const [appliedWm, setAppliedWm] = useState("")
    const [data, setData] = useState<any[]>([]);
    const [windmills, setWindmills] = useState<any[]>([]);
    
    useEffect(() => {
    fetchGeneration();
    fetchWindmills();
}, []);

   const handleSearch = () => {
  setAppliedYear(selectedYear);
  setAppliedMonth(selectedMonth);
  setAppliedFromDate(fromDate);
  setAppliedToDate(toDate);
  setAppliedWm(selectedWm);

  fetchGeneration();
};
    const handleCancel = () => {
        setSelectedYear(currentYear.toString());
        setSelectedMonth((new Date().getMonth() + 1).toString());
        setFromDate(undefined);
        setToDate(undefined);
        setSelectedWm("");
        setSearchKeyword("");
        setAppliedYear(currentYear.toString());
        setAppliedMonth((new Date().getMonth() + 1).toString());
        setAppliedFromDate(undefined);
        setAppliedToDate(undefined);
        setAppliedWm("");
    };

    const formatDateForAPI = (date?: Date) => {
  if (!date) return undefined;
  return date.toISOString().split("T")[0];
};


useEffect(() => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    navigate("/login");
    return;
  }

  fetchGeneration();
  fetchWindmills();
}, [navigate]);


const handleDelete = async (id) => {
  try {
    await api.delete(`/daily-generation/delete/${id}`);
    fetchGeneration();
  } catch (error) {
    console.error("Delete failed:", error);
  }
};


const fetchGeneration = async () => {
  try {
    const response = await api.get("/daily-generation", {
      params: {
        from_date: formatDateForAPI(fromDate),
        to_date: formatDateForAPI(toDate),
      },
    });

    setData(response.data);
  } catch (error) {
    console.error("Error fetching data:", error);
    // Optional: handle 401
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      alert("Session expired. Please login again.");
      navigate("/login");
    }
  }
};

const fetchWindmills = async () => {
  try {
    const response = await api.get("/daily-generation/windmill-list");
    setWindmills(response.data);
  } catch (error) {
    console.error("Error fetching windmills:", error);
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      alert("Session expired. Please login again.");
      navigate("/login");
    }
  }
};

const handleExportExcel = () => {
  if (filteredData.length === 0) {
    alert("No data to export");
    return;
  }

  const header = ["Date", "Wind Mill Number", "Units", "Status"];
  const rows = filteredData.map((row) => [
    row.transaction_date,
    row.windmill_number,
    row.units,
    row.is_submitted === 1 ? "Posted" : "Saved",
  ]);

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [header, ...rows].map((e) => e.join(",")).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `windmill_data_${new Date().toISOString()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

    const filteredData = data.filter(row => {
        const rowDate = new Date(row.transaction_date);
        let dateMatch = true;

        if (appliedFromDate && appliedToDate) {
            dateMatch = rowDate >= appliedFromDate && rowDate <= appliedToDate;
        } else {
            const matchesYear = rowDate.getFullYear().toString() === appliedYear;
            const matchesMonth = (rowDate.getMonth() + 1).toString() === appliedMonth;
            dateMatch = matchesYear && matchesMonth;
        }

        const matchesWm = appliedWm === "" || appliedWm === "all" ||row.windmill_number.toLowerCase() === appliedWm.toLowerCase();

        const matchesGlobal = searchKeyword === "" ||
            Object.values(row).some(val => String(val).toLowerCase().includes(searchKeyword.toLowerCase()));

        return dateMatch && matchesWm && matchesGlobal;
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
                <div className="p-3 space-y-2">
                    {/* Page Title */}
                    <div className="flex items-center justify-between pb-2">
                        <h1 className="text-xl font-bold text-slate-800">Daily Operator Generation</h1>
                    </div>

                    <div className="space-y-1">
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex gap-2 items-center">

                            <Select value={selectedWm} onValueChange={(val) => setSelectedWm(val === "all" ? "" : val)}>
                                <SelectTrigger className="w-[150px] h-9 bg-white border-slate-200 text-sm">
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
                                <SelectTrigger className="w-[100px] h-9 bg-white border-slate-300 text-sm">
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
                                <SelectTrigger className="w-[120px] h-9 bg-white border-slate-300 text-sm">
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

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-[120px] justify-start text-left font-normal bg-white border-slate-300 h-9 text-sm px-2",
                                            !fromDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                                        {fromDate ? formatDate(fromDate) : <span className="text-xs">From Date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={fromDate}
                                        onSelect={setFromDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-[120px] justify-start text-left font-normal bg-white border-slate-300 h-9 text-sm px-2",
                                            !toDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                                        {toDate ? formatDate(toDate) : <span className="text-xs">To Date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={toDate}
                                        onSelect={setToDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>

                            <Button size="sm" className="h-9 text-sm bg-primary hover:bg-primary/90 text-primary-foreground px-3 shrink-0" onClick={handleSearch}>
                                Search
                            </Button>
                            <Button size="sm" className="h-9 text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-3" onClick={() => navigate("/windmill/add")}>
                                + New
                            </Button>
                           <Button
  size="sm"
  className="h-9 text-sm bg-[#DAA520] hover:bg-[#B8860B] text-white px-3"
  onClick={handleExportExcel}
>
  Export Excel
</Button>
                            <Button size="sm" className="h-9 text-sm bg-red-600 hover:bg-red-700 text-white px-3" onClick={handleCancel}>
                                Cancel
                            </Button>
                        </div>
                    </div>

                    {/* Transaction List */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center bg-primary/5 p-2 rounded-t-lg border-b border-primary/10 h-10">
                            <h2 className="text-sm font-semibold text-primary pl-2">
                                Generation List - <span className="text-[10px] font-normal text-slate-500 italic ml-1">Auto Generated Report @ 6:30 PM</span>
                            </h2>

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
                                        <TableHead className="font-semibold text-white h-10 whitespace-nowrap">Date</TableHead>
                                        <TableHead className="font-semibold text-white h-10 whitespace-nowrap">Wind Mill Number</TableHead>
                                        <TableHead className="font-semibold text-white h-10 whitespace-nowrap">Units</TableHead>
                                        <TableHead className="font-semibold text-white h-10 whitespace-nowrap">Status</TableHead>
                                        <TableHead className="font-semibold text-white text-center h-10 whitespace-nowrap">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredData.length > 0 ? (
                                        filteredData.map((row) => (
                                            <TableRow key={row.id} className="hover:bg-slate-50">
                                                <TableCell className="py-2 text-sm">{formatDate(new Date(row.transaction_date))}</TableCell>
                                                <TableCell className="py-2 text-sm">{row.windmill_number}</TableCell>
                                                <TableCell className="py-2 text-sm">{row.units}</TableCell>
                                                <TableCell className="py-2">
                                                    <Badge
                                                        className={cn(
                                                            "font-bold w-6 h-6 rounded flex items-center justify-center p-0 border-none",
                                                            (row.is_submitted === 1 || row.is_submitted === true)
                                                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                                                : "bg-red-600 hover:bg-red-700 text-white"
                                                        )}
                                                    >
                                                        {(row.is_submitted === 1 || row.is_submitted === true) ? "P" : "S"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-2 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <Button
  variant="ghost"
  size="icon"
  disabled={row.status === "Posted"}
  className={cn(
    "h-6 w-6",
    row.status === "Posted"
      ? "text-gray-400 cursor-not-allowed"
      : "text-primary hover:text-primary hover:bg-primary/10"
  )}
  onClick={() => navigate(`/windmill/edit/${row.id}`)}
>
  <Edit className="h-4 w-4" />
</Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-4 text-slate-500">
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
