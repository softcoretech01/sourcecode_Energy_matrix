import React, { useState } from "react";
import { Search, Plus, Edit } from "lucide-react";
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
import { cn, formatDate } from "@/lib/utils";
import api from "@/services/api";
import { useEffect } from "react";
import { format } from "date-fns";


// Mock Data


export default function ConsumptionChargesList() {
    const navigate = useNavigate();
    const [searchCode, setSearchCode] = useState("");
    const [searchName, setSearchName] = useState("");
    const [searchKeyword, setSearchKeyword] = useState("");

    const [appliedCode, setAppliedCode] = useState("");
    const [appliedName, setAppliedName] = useState("");
    const [data, setData] = useState<any[]>([]);

    const handleSearch = () => {
        setAppliedCode(searchCode);
        setAppliedName(searchName);
    };

    const handleCancel = () => {
        setSearchCode("");
        setSearchName("");
        setSearchKeyword("");
        setAppliedCode("");
        setAppliedName("");
    };

useEffect(() => {
    fetchData();
}, []);

    const fetchData = async () => {
    try {
        const res = await api.get("/consumption/list");

    const formatted = res.data.map((item: any) => ({
    chargeCode: item.charge_code,
    chargeName: item.charge_name,
    description: item.charge_description,
    date: item.valid_upto || "-",
    status: Number(item.status) === 1 ? 1 : 0,
    is_submitted: item.is_submitted,
    id: item.id,
    // Store all fields for update operation
    energy_type: item.energy_type,
    cost: item.cost,
    uom: item.uom,
    type: item.type,
    discount_charges: item.discount_charges,
}));

        setData(formatted);

    } catch (err) {
        console.error("Fetch error", err);
    }
};

const toggleConsumptionStatus = async (row: any) => {
    const newStatus = Number(row.status) === 1 ? 0 : 1;
    try {
      const payload = {
        energy_type: row.energy_type,
        charge_code: row.chargeCode,
        charge_name: row.chargeName,
        cost: row.cost,
        uom: row.uom,
        type: row.type,
        charge_description: row.description,
        valid_upto: row.date,
        discount_charges: row.discount_charges,
        status: newStatus,
        is_submitted: row.is_submitted ?? 0,
      };
      await api.put(`/consumption/update/${row.id}`, payload);
      setData((prev) => prev.map((item) => (item.id === row.id ? { ...item, status: newStatus } : item)));
    } catch (error) {
      console.error("Status toggle failed", error);
      alert("Status update failed");
    }
};


const handleExportExcel = () => {
    if (filteredData.length === 0) {
        alert("No data to export");
        return;
    }

    const header = [
        "Charge Code",
        "Charge Name",
        "Description",
        "Date",
        "Status"
    ];

    const rows = filteredData.map((row) => [
        row.chargeCode,
        row.chargeName,
        row.description,
        row.date,
        row.status
    ]);

    const csvContent =
        "data:text/csv;charset=utf-8," +
        [header, ...rows]
            .map((e) => e.join(","))
            .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");

    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "consumption_charges.csv");
    document.body.appendChild(link);

    link.click();
    document.body.removeChild(link);
};


   const filteredData = data.filter((row: any) => {
    
    return (
        (appliedCode === "" || row.chargeCode === appliedCode) &&
        (appliedName === "" || row.chargeName === appliedName) &&
        (
            searchKeyword === "" ||
            Object.values(row).some(val =>
                String(val).toLowerCase().includes(searchKeyword.toLowerCase())
            )
        )
    );
});

    return (
        <div className="p-2 bg-slate-50 min-h-screen font-sans">
            <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-3 space-y-2">
                    {/* Page Title */}
                    <div className="flex items-center justify-between pb-2">
                        <h1 className="text-xl font-bold text-slate-800">Consumption Charges - List</h1>
                    </div>

                    <div className="space-y-1">
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap gap-2 items-center">
                            <span className="text-sm font-semibold text-slate-600 mr-2">Search</span>

                            <div className="w-[180px]">
                                <Select value={searchCode} onValueChange={(val) => setSearchCode(val === "all" ? "" : val)}>
    <SelectTrigger>
        <SelectValue placeholder="Select Charge Code" />
    </SelectTrigger>

    <SelectContent>
        <SelectItem value="all">All Charge Codes</SelectItem>

        {data.map((item: any) => (
            <SelectItem key={item.id} value={item.chargeCode}>
                {item.chargeCode}
            </SelectItem>
        ))}
    </SelectContent>
</Select>
                            </div>

                            <div className="w-[180px]">
                               <Select value={searchName} onValueChange={(val) => setSearchName(val === "all" ? "" : val)}>
    <SelectTrigger>
        <SelectValue placeholder="Select Charge Name" />
    </SelectTrigger>

    <SelectContent>
        <SelectItem value="all">All Charge Names</SelectItem>

        {data.map((item: any) => (
            <SelectItem key={item.id} value={item.chargeName}>
                {item.chargeName}
            </SelectItem>
        ))}
    </SelectContent>
</Select>
                            </div>

                            <div className="flex-1"></div>

                            <Button size="sm" className="h-9 text-sm bg-primary hover:bg-primary/90 text-primary-foreground px-4" onClick={handleSearch}>
                                Search
                            </Button>
                            <Button size="sm" className="h-9 text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-4" onClick={() => navigate("/master/consumption-charges/add")}>
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

                    {/* List Table Section */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center bg-primary/5 p-2 rounded-t-lg border-b border-primary/10 h-10">
                            <h2 className="text-sm font-semibold text-primary pl-2">Consumption Charges Data</h2>

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
                                        <TableHead className="py-2 h-10 font-semibold text-white whitespace-nowrap">Charge Code</TableHead>
                                        <TableHead className="py-2 h-10 font-semibold text-white whitespace-nowrap">Charge Name</TableHead>
                                        <TableHead className="py-2 h-10 font-semibold text-white whitespace-nowrap">Description</TableHead>
                                        <TableHead className="py-2 h-10 font-semibold text-white whitespace-nowrap">Valid Upto</TableHead>
                                        <TableHead className="py-2 h-10 font-semibold text-white whitespace-nowrap">Status</TableHead>
                                        <TableHead className="py-2 h-10 font-semibold text-white text-center whitespace-nowrap">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredData.length > 0 ? (
                                        filteredData.map((row, index) => (
                                            
                                            
                                            <TableRow key={index} className="hover:bg-slate-50 bg-white">
                                                <TableCell className="py-2 text-slate-600 font-medium text-sm">{row.chargeCode}</TableCell>
                                                <TableCell className="py-2 text-slate-600 text-sm">{row.chargeName}</TableCell>
                                                <TableCell className="py-2 text-slate-600 text-sm">{row.description}</TableCell>
                                                <TableCell className="py-2 text-slate-600 text-sm">{formatDate(new Date(row.date))}</TableCell>
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
                                                            onToggle={() => toggleConsumptionStatus(row)}
                                                        />
                                                       <Button
  variant="ghost"
  size="icon"
  className="h-6 w-6 text-primary hover:text-primary hover:bg-primary/10"
  onClick={() => navigate(`/master/consumption-charges/edit/${row.id}`)}
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
}

