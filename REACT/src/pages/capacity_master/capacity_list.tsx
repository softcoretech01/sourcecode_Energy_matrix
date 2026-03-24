import React, { useState } from "react";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusSlider } from "@/components/StatusSlider";
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


// Mock Data for Capacity
import { useEffect } from "react";
import api from "@/services/api";

export default function CapacityList() {
    const navigate = useNavigate();
    const [searchCapacity, setSearchCapacity] = useState("");
    const [searchKeyword, setSearchKeyword] = useState("");
    const [appliedCapacity, setAppliedCapacity] = useState("");
    const [capacityData, setCapacityData] = useState([]);


    useEffect(() => {
    fetchCapacity();
}, []);

const fetchCapacity = async () => {
    try {
        const res = await api.get("/capacity/list");
        setCapacityData(res.data);
    } catch (error) {
        console.error("Error fetching capacity", error);
    }
};


const handleDelete = async (id) => {
    try {
        await api.delete(`/capacity/delete/${id}`);
        fetchCapacity(); // refresh table
    } catch (error) {
        console.error("Delete failed:", error);
        alert("Delete failed");
    }
};

const toggleCapacityStatus = async (row) => {
    const newStatus = Number(row.status) === 1 ? 0 : 1;
    try {
        await api.put(`/capacity/update/${row.id}`, {
            capacity: row.capacity,
            status: newStatus,
            is_submitted: row.is_submitted ?? 0,
        });
        setCapacityData((prev) =>
            prev.map((item) => (item.id === row.id ? { ...item, status: newStatus } : item))
        );
    } catch (error) {
        console.error("Toggle status failed:", error);
        alert("Status update failed");
    }
};

    const handleSearch = () => {
        setAppliedCapacity(searchCapacity);
    };

    const handleCancel = () => {
        setSearchCapacity("");
        setSearchKeyword("");
        setAppliedCapacity("");
    };

    const filteredData = capacityData.filter(row => {
  const matchesCapacity = String(row.capacity).toLowerCase().includes(appliedCapacity.toLowerCase());
  const matchesGlobal = searchKeyword === "" ||
      Object.values(row).some(val => String(val).toLowerCase().includes(searchKeyword.toLowerCase()));
  return matchesCapacity && matchesGlobal;
});

const handleExportExcel = () => {
  if (filteredData.length === 0) {
    alert("No data to export");
    return;
  }

  // Define CSV headers
  const header = ["Capacity", "Status"];

  // Map filtered data to rows
  const rows = filteredData.map((row) => [
    row.capacity,
    row.status === 0 ? "Active" : "Inactive",
    row.is_submitted === 1 ? "Posted" : "Saved",
  ]);

  // Combine header + rows into CSV string
  const csvContent =
    "data:text/csv;charset=utf-8," +
    [header, ...rows].map((e) => e.join(",")).join("\n");

  // Encode URI and trigger download
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute(
    "download",
    `capacity_data_${new Date().toISOString()}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

    return (
        <div className="p-2 bg-slate-50 min-h-screen font-sans">
            <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-3 space-y-2">
                    {/* Page Title */}
                    <div className="flex items-center justify-between pb-2">
                        <h1 className="text-xl font-bold text-slate-800">Master Capacity - List</h1>
                    </div>

                    <div className="space-y-1">
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap gap-2 items-center">
                            <span className="text-sm font-semibold text-slate-600 mr-2">Search</span>

                            <div className="w-[200px]">
                                <Select value={searchCapacity} onValueChange={(val) => setSearchCapacity(val === "all" ? "" : val)}>
                                    <SelectTrigger className="bg-white border-slate-200 h-9 text-sm">
                                        <SelectValue placeholder="Select Capacity" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Capacities</SelectItem>
                                        {Array.from(new Set(capacityData.map(item => item.capacity))).map(capacity => (
                                            <SelectItem key={capacity} value={capacity}>{capacity}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex-1"></div>

                            <Button size="sm" className="h-9 text-sm bg-primary hover:bg-primary/90 text-primary-foreground px-4" onClick={handleSearch}>
                                Search
                            </Button>
                            <Button size="sm" className="h-9 text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-4" onClick={() => navigate("/master/capacity/add")}>
                                + New
                            </Button>
                           <Button
  size="sm"
  className="h-9 text-sm bg-[#DAA520] hover:bg-[#B8860B] text-white px-3"
  onClick={handleExportExcel}
>
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
                            <h2 className="text-sm font-semibold text-primary pl-2">Capacity Master Data</h2>


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
                                        <TableHead className="py-2 h-10 font-semibold text-white whitespace-nowrap">Capacity</TableHead>
                                        <TableHead className="py-2 h-10 font-semibold text-white whitespace-nowrap">Status</TableHead>
                                        <TableHead className="py-2 h-10 font-semibold text-white text-center whitespace-nowrap w-24">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredData.length > 0 ? (
                                        filteredData.map((row) => (
                                            <TableRow key={row.id} className="hover:bg-slate-50 bg-white">
                                                <TableCell className="py-2 text-slate-600 font-medium text-sm">{row.capacity}</TableCell>
                                                <TableCell className="py-2">
                                                  <Badge
 className={cn(
   "font-bold w-6 h-6 rounded flex items-center justify-center p-0 border-none",
   row.is_submitted === 1
     ? "bg-emerald-600 text-white"
     : "bg-red-600 text-white"
 )}
>
 {row.is_submitted === 1 ? "P" : "S"}
</Badge>
                                                </TableCell>
                                                <TableCell className="py-2 text-center">
                                                    <div className="flex justify-center gap-1 items-center">
                                                        <StatusSlider
                                                            status={row.status}
                                                            onToggle={() => toggleCapacityStatus(row)}
                                                        />
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            disabled={row.is_submitted === 1}
                                                            className={cn(
                                                                "h-6 w-6",
                                                                row.is_submitted === 1
                                                                    ? "text-gray-400 cursor-not-allowed"
                                                                    : "text-primary hover:text-primary hover:bg-primary/10"
                                                            )}
                                                            onClick={() => navigate(`/master/capacity/edit/${row.id}`)}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-4 text-slate-500">
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
