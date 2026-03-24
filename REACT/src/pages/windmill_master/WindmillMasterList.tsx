import React, { useEffect, useState } from "react";
import { Search, Plus, Edit } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function WindmillMasterList() {
    const navigate = useNavigate();
    const [windmills, setWindmills] = useState<any[]>([]);
    const [wmNumbers, setWmNumbers] = useState<string[]>([]);
    const [edcCircles, setEdcCircles] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [wmNumberSearch, setWmNumberSearch] = useState("");
    const [regionSearch, setRegionSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchWindmills = async () => {
        const token = localStorage.getItem("access_token");
        try {
            setLoading(true);
            setError(null);
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/windmills`, {
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            if (!res.ok) {
                throw new Error(`Failed to load windmills: ${res.status}`);
            }
            const data = await res.json();
            // Show newest records first (based on modified_at / created_at)
            const sorted = Array.isArray(data)
                ? [...data].map((item: any) => ({
                      ...item,
                      status: item.status === "Active" || item.status === "active" || Number(item.status) === 1 ? 1 : 0,
                      windmill_capacity: item.windmill_capacity ?? item._capacity ?? item.capacity ?? item._id ?? "",
                  }))
                    .sort((a, b) => {
                        const aDate = new Date(a.modified_at || a.created_at || 0).getTime();
                        const bDate = new Date(b.modified_at || b.created_at || 0).getTime();
                        return bDate - aDate;
                    })
                : data;

            setWindmills(sorted);
            setWmNumbers(Array.from(new Set(sorted.map((item) => item.windmill_number).filter(Boolean))));
            setError(null);
        } catch (err) {
            console.error(err);
            setError("Failed to load windmills");
        } finally {
            setLoading(false);
        }
    };

    const toggleWindmillStatus = async (row: any) => {
        const newStatus = Number(row.status) === 1 ? 0 : 1;
        const statusText = newStatus === 1 ? "Active" : "Inactive";
        const token = localStorage.getItem("access_token");

        try {
            const existingRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/windmills/${row.id}`, {
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            if (!existingRes.ok) {
                throw new Error(`Failed to fetch windmill for update: ${existingRes.status}`);
            }
            const existing = await existingRes.json();

            const updateRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/windmills/${row.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    ...existing,
                    status: statusText,
                }),
            });
            if (!updateRes.ok) {
                throw new Error(`Failed to update windmill: ${updateRes.status}`);
            }
            setWindmills((prev) => prev.map((item) => (item.id === row.id ? { ...item, status: newStatus } : item)));
        } catch (err) {
            console.error("Failed to toggle windmill status", err);
            alert("Status update failed");
        }
    };

    const fetchEdcCircles = async () => {
        const token = localStorage.getItem("access_token");
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/edc-circle/dropdown`, {
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            if (!res.ok) {
                throw new Error(`Failed to load EDC circles: ${res.status}`);
            }
            const data = await res.json();
            setEdcCircles(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setError("Failed to load EDC circles");
        }
    };

    const location = useLocation();

    // Load data on component mount, with ability to refresh after navigation
    React.useEffect(() => {
        fetchWindmills();
        fetchEdcCircles();
    }, []); // Empty dependency array - only fetch on mount

    // Optional: Refresh data when returning from add/edit (check URL pathname)
    React.useEffect(() => {
        // This effect runs when location changes but triggers refetch with debounce
        const timer = setTimeout(() => {
            // Only refetch if user just came back from a form page
            if (location.pathname === "/master/windmill") {
                fetchWindmills();
                fetchEdcCircles();
            }
        }, 300); // Debounce to prevent rapid refetches

        return () => clearTimeout(timer);
    }, [location.pathname]);

    const [appliedWmNumber, setAppliedWmNumber] = useState("");
    const [appliedRegion, setAppliedRegion] = useState("");

    const handleSearch = () => {
        setAppliedWmNumber(wmNumberSearch);
        setAppliedRegion(regionSearch);
    };

    const handleCancel = () => {
        setWmNumberSearch("");
        setRegionSearch("");
        setSearchTerm("");
        setAppliedWmNumber("");
        setAppliedRegion("");
    };

    const exportToExcel = () => {
        // Export currently displayed (filtered) value set as CSV (opens in Excel).
        const rows = filteredData;
        if (!rows || rows.length === 0) {
            alert("No data available to export.");
            return;
        }

        const headers = [
            "WM Number",
            "Operator",
            "Type",
            "Region",
            "Status",
        ];

        const csvRows = [headers.join(",")];
        for (const row of rows) {
            const line = [
                row.windmill_number ?? "",
                row.operator_name ?? row.operator ?? "",
                row.type ?? row.windmill_type ?? row.windmill_capacity ?? row.capacity ?? "",
                row.edc_name ?? row.region ?? "",
                row.status ?? "",
            ]
                .map((cell) => {
                    const str = String(cell ?? "");
                    if (str.includes(",") || str.includes("\n") || str.includes("\"")) {
                        return `"${str.replace(/"/g, '""')}"`;
                    }
                    return str;
                })
                .join(",");
            csvRows.push(line);
        }

        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "windmill_master_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const filteredData = windmills.filter(row => {
        const wmNumber = (row.windmill_number || "").toString();
        const region = (row.edc_name || row.region || "").toString();

        const matchesWm = wmNumber.toLowerCase().includes(appliedWmNumber.toLowerCase());
        const matchesRegion = appliedRegion === "" || region.toLowerCase().includes(appliedRegion.toLowerCase());
        const matchesGlobal = searchTerm === "" ||
            Object.values(row).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()));

        return matchesWm && matchesRegion && matchesGlobal;
    });

    return (
        <div className="p-2 bg-slate-50 min-h-screen font-sans">
            <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-3 space-y-2">
                    {/* Page Title */}
                    <div className="flex items-center justify-between pb-2">
                        <h1 className="text-xl font-bold text-slate-800">Master Windmill - List</h1>
                    </div>

                    <div className="space-y-1">
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap gap-2 items-center">
                            <span className="text-sm font-semibold text-slate-600 mr-2">Search</span>

                            <div className="w-[150px]">
                                <Select value={wmNumberSearch} onValueChange={(val) => setWmNumberSearch(val === "all" ? "" : val)}>
                                    <SelectTrigger className="bg-white border-slate-200 h-9 text-sm">
                                        <SelectValue placeholder="Select WM" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All WM</SelectItem>
                                        {wmNumbers.map((wm) => (
                                            <SelectItem key={wm} value={wm}>{wm}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Select value={regionSearch} onValueChange={(val) => setRegionSearch(val === "all" ? "" : val)}>
                                <SelectTrigger className="w-[150px] h-9 bg-white border-slate-200 text-sm">
                                    <SelectValue placeholder="Select Region" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Regions</SelectItem>
                                    {edcCircles.map((circle) => (
                                        <SelectItem key={circle.id} value={circle.edc_name}>{circle.edc_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className="flex-1"></div>

                            <Button size="sm" className="h-9 text-sm bg-primary hover:bg-primary/90 text-primary-foreground px-4" onClick={handleSearch}>
                                Search
                            </Button>
                            <Button size="sm" className="h-9 text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-4" onClick={() => navigate("/master/windmill/add")}>
                                + New
                            </Button>
                            <Button size="sm" className="h-9 text-sm bg-[#DAA520] hover:bg-[#B8860B] text-white px-4" onClick={() => exportToExcel()}>
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
                            <h2 className="text-sm font-semibold text-primary pl-2">Windmill Master Data</h2>

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
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border border-slate-200 rounded-b-lg overflow-hidden mt-0">
                            <Table>
                                <TableHeader className="bg-sidebar">
                                    <TableRow>
                                        <TableHead className="py-2 h-10 font-semibold text-white whitespace-nowrap">WM Number</TableHead>
                                        <TableHead className="py-2 h-10 font-semibold text-white whitespace-nowrap">Operator</TableHead>
                                    <TableHead className="py-2 h-10 font-semibold text-white whitespace-nowrap">Type</TableHead>
                                        <TableHead className="py-2 h-10 font-semibold text-white whitespace-nowrap">Region</TableHead>
                                        <TableHead className="py-2 h-10 font-semibold text-white whitespace-nowrap">Status</TableHead>
                                        <TableHead className="py-2 h-10 font-semibold text-white text-center whitespace-nowrap">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-slate-400"></div>
                                                    <span>Loading windmills...</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : error ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-red-500">
                                                {error}
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredData.length > 0 ? (
                                        filteredData.map((row, index) => (
                                            <TableRow key={index} className="hover:bg-slate-50 bg-white">
                                                <TableCell className="py-2 text-slate-600 font-medium text-sm">{row.windmill_number}</TableCell>
                                                <TableCell className="py-2 text-slate-600 text-sm">{row.operator_name || row.operator}</TableCell>
                                                <TableCell className="py-2 text-slate-600 text-sm">{row.type ?? row.windmill_type ?? row.windmill_capacity ?? row.kva_capacity ?? row.capacity ?? ""}</TableCell>
                                                <TableCell className="py-2 text-slate-600 text-sm">{row.edc_name || row.region}</TableCell>
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
                                                    <div className="flex justify-center gap-1 items-center">
                                                        <StatusSlider
                                                            status={row.status}
                                                            onToggle={() => toggleWindmillStatus(row)}
                                                        />
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className={row.is_submitted === 1 ? "h-6 w-6 text-slate-300" : "h-6 w-6 text-primary hover:text-primary hover:bg-primary/10"}
                                                            onClick={() => navigate(`/master/windmill/edit/${row.id}`)}
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
