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
import { cn } from "@/lib/utils";

// data fetched from backend
// const customerData = [ ... ] removed

export default function CustomerList() {
    const navigate = useNavigate();
    const [searchName, setSearchName] = useState("");
    const [searchSeNumber, setSearchSeNumber] = useState("");
    const [searchKeyword, setSearchKeyword] = useState("");

    const [appliedName, setAppliedName] = useState("");
    const [appliedSeNumber, setAppliedSeNumber] = useState("");

    const [customerData, setCustomerData] = useState<any[]>([]);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // fetch customers from API
    const loadCustomers = async () => {
        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customers/`, {
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            if (res.ok) {
                const data = await res.json();
                setCustomerData(Array.isArray(data) ? data : []);
                setErrorMsg(null);
            } else if (res.status === 401) {
                // not authenticated, redirect to login
                localStorage.removeItem("access_token");
                window.location.href = "/login";
            } else {
                setErrorMsg(`HTTP Error: ${res.status} ${res.statusText}`);
            }
        } catch (err: any) {
            console.error("Failed to load customers", err);
            setErrorMsg(err.message || "Failed to fetch from backend");
        }
    };

    React.useEffect(() => {
        loadCustomers();
    }, []);

    const handleSearch = () => {
        setAppliedName(searchName);
        setAppliedSeNumber(searchSeNumber);
    };

    // ensure SC dropdown options respect chosen customer
    const seOptions = Array.from(
        new Set(
            customerData
                .filter(item => !searchName || item.customer_name === searchName)
                .map(item => item?.se_number)
                .filter(Boolean)
        )
    );

    // clear selected SC number if it no longer applies when customer changes
    React.useEffect(() => {
        if (searchSeNumber && !seOptions.includes(searchSeNumber)) {
            setSearchSeNumber("");
        }
    }, [searchName, customerData]);

    const handleCancel = () => {
        setSearchName("");
        setSearchSeNumber("");
        setSearchKeyword("");
        setAppliedName("");
        setAppliedSeNumber("");
    };

    const toggleCustomerStatus = async (row: any) => {
        const newStatus = Number(row.status) === 1 ? 0 : 1;
        const token = localStorage.getItem("access_token");
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customers/${row.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    customer_name: row.customer_name,
                    city: row.city,
                    phone_no: row.phone_no,
                    email: row.email,
                    address: row.address,
                    gst_number: row.gst_number,
                    status: newStatus,
                    is_submitted: row.is_submitted ?? 0,
                }),
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || `HTTP ${res.status}`);
            }
            setCustomerData((prev) =>
                prev.map((item) => (item.id === row.id ? { ...item, status: newStatus } : item))
            );
        } catch (err: any) {
            console.error("Customer status update failed", err);
            alert("Status update failed");
        }
    };

    const handleExport = async () => {
        try {
            const token = localStorage.getItem("access_token");
            const params = new URLSearchParams();
            if (appliedName) params.append("customer_name", appliedName);
            if (appliedSeNumber) params.append("se_number", appliedSeNumber);

            const res = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/customers/export?${params.toString()}`,
                {
                    headers: {
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                }
            );
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Export failed");
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "customers.xlsx";
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (err: any) {
            console.error("Export error", err);
            alert(err.message || "Failed to export");
        }
    };

    const filteredData = customerData.filter(row => {
        if (!row) return false;
        const matchesName = String(row.customer_name || "")
            .toLowerCase()
            .includes(appliedName.toLowerCase());
        const matchesSeNumber = row.se_number
            ? String(row.se_number).toLowerCase().includes(appliedSeNumber.toLowerCase())
            : true;
        const matchesGlobal = searchKeyword === "" ||
            Object.values(row).some(val => String(val).toLowerCase().includes(searchKeyword.toLowerCase()));

        return matchesName && matchesSeNumber && matchesGlobal;
    });

    return (
        <div className="p-2 bg-slate-50 min-h-screen font-sans">
            <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-3 space-y-2">
                    {/* Page Title */}
                    <div className="flex items-center justify-between pb-2">
                        <h1 className="text-xl font-bold text-slate-800">Master Customers - List</h1>
                    </div>

                    <div className="space-y-1">
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap gap-2 items-center">
                            <span className="text-sm font-semibold text-slate-600 mr-2">Search</span>

                            <div className="w-[200px]">
                                <Select value={searchName} onValueChange={(val) => setSearchName(val === "all" ? "" : val)}>
                                    <SelectTrigger className="bg-white border-slate-200 h-9 text-sm">
                                        <SelectValue placeholder="Select Customer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Customers</SelectItem>
                                        {Array.from(new Set(customerData.map(item => item?.customer_name).filter(Boolean))).map(name => (
                                            <SelectItem key={String(name)} value={String(name)}>{String(name)}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="w-[180px]">
                                <Select
                                    value={searchSeNumber}
                                    onValueChange={(val) => setSearchSeNumber(val === "all" ? "" : val)}
                                    disabled={!searchName}
                                >
                                    <SelectTrigger className="bg-white border-slate-200 h-9 text-sm" disabled={!searchName}>
                                        <SelectValue placeholder={searchName ? "Select SC No" : "Select Customer first"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {seOptions.map(se => (
                                            <SelectItem key={String(se)} value={String(se)}>{String(se)}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex-1"></div>

                            <Button size="sm" className="h-9 text-sm bg-primary hover:bg-primary/90 text-primary-foreground px-4" onClick={handleSearch}>
                                Search
                            </Button>
                            <Button size="sm" className="h-9 text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-4" onClick={() => navigate("/master/customers/add")}>
                                + New
                            </Button>
                            <Button size="sm" className="h-9 text-sm bg-[#DAA520] hover:bg-[#B8860B] text-white px-4" onClick={handleExport}>
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
                            <h2 className="text-sm font-semibold text-primary pl-2">Customer Master Data</h2>

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
                                        <TableHead className="py-2 h-10 font-semibold text-white whitespace-nowrap">Customer Name</TableHead>
                                        <TableHead className="py-2 h-10 font-semibold text-white whitespace-nowrap">City</TableHead>
                                        <TableHead className="py-2 h-10 font-semibold text-white whitespace-nowrap">Phone No</TableHead>
                                        <TableHead className="py-2 h-10 font-semibold text-white whitespace-nowrap">Email</TableHead>
                                        <TableHead className="py-2 h-10 font-semibold text-white whitespace-nowrap">SC Number</TableHead>
                                        <TableHead className="py-2 h-10 font-semibold text-white whitespace-nowrap">Status</TableHead>
                                        <TableHead className="py-2 h-10 font-semibold text-white text-center whitespace-nowrap">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredData.length > 0 ? (
                                        filteredData.map((row, index) => (
                                            <TableRow key={row.id || index} className="hover:bg-slate-50 bg-white">
                                                <TableCell className="py-2 text-slate-600 font-medium text-sm">{row.customer_name}</TableCell>
                                                <TableCell className="py-2 text-slate-600 text-sm">{row.city}</TableCell>
                                                <TableCell className="py-2 text-slate-600 text-sm">{row.phone_no}</TableCell>
                                                <TableCell className="py-2 text-slate-600 text-sm">{row.email}</TableCell>
                                                <TableCell className="py-2 text-slate-600 text-sm">{row.se_number || ""}</TableCell>
                                                <TableCell className="py-2">
                                                    {/** use is_submitted flag ONLY for S/P indicator, NOT status */}
                                                    <Badge
                                                        className={cn(
                                                            "font-bold w-6 h-6 rounded flex items-center justify-center p-0 border-none",
                                                            row.is_submitted === 1
                                                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                                                : "bg-red-600 hover:bg-red-700 text-white"
                                                        )}
                                                    >
                                                        {row.is_submitted === 1 ? "P" : "S"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-2 text-center">
                                                    <div className="flex justify-center gap-1 items-center">
                                                        <StatusSlider
                                                            status={row.status}
                                                            onToggle={() => toggleCustomerStatus(row)}
                                                        />
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className={cn(
                                                                "h-6 w-6 text-primary hover:bg-primary/10",
                                                                (row.is_submitted === 1 || row.status === "Posted" || row.status === 1) && "opacity-50 cursor-not-allowed"
                                                            )} 
                                                            disabled={row.is_submitted === 1 || row.status === "Posted" || row.status === 1}
                                                            onClick={() => { console.log('Edit clicked:', row); navigate(`/master/customers/edit/${row.id}`); }}
                                                            title={(row.is_submitted === 1 || row.status === "Posted" || row.status === 1) ? "Posted records cannot be edited" : "Edit Customer"}
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
                                                {errorMsg ? <div className="text-red-500 font-bold">{errorMsg}</div> : "No records found"}
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
