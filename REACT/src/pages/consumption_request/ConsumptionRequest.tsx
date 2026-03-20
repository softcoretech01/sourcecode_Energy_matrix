import React, { useState } from "react";
import { Search, Plus, Edit } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BACKEND_API_URL } from "@/services/api";
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
    TableFooter,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const requestData: any[] = [];

export default function ConsumptionRequest() {
    const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
    const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString());
    const [isEditing, setIsEditing] = useState(false);
    const [data, setData] = useState(requestData);
    const [dirtyFields, setDirtyFields] = useState<{ [key: string]: boolean }>({});
    const [modifiedServiceIds, setModifiedServiceIds] = useState<Set<number>>(new Set());
    
    // API data
    const [customers, setCustomers] = useState<any[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<string>("");
    const [appliedCustomer, setAppliedCustomer] = useState<string>("");

    const loadDropdownData = async () => {
        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch(`${BACKEND_API_URL}/consumption-request/dropdown-data`, {
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            if (res.ok) {
                const data = await res.json();
                console.log("Fetched Customers:", data);
                if (Array.isArray(data)) {
                    setCustomers(data);
                } else {
                    console.error("API Error or Invalid format:", data);
                    toast.error(data.error || "Failed to parse customer data");
                    setCustomers([]);
                }
            } else if (res.status === 401) {
                localStorage.removeItem("access_token");
                window.location.href = "/login";
            }
        } catch (err) {
            console.error("Failed to load dropdown data", err);
            setCustomers([]);
        }
    };

    const loadRequestList = async () => {
        try {
            const token = localStorage.getItem("access_token");
            const url = `${BACKEND_API_URL}/consumption-request/list?year=${selectedYear}&month=${selectedMonth}`;
            const res = await fetch(url, {
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            if (res.ok) {
                const data = await res.json();
                console.log("Fetched List:", data);
                if (Array.isArray(data) && data.length > 0) {
                    setData(data); // Use real data if available
                } else {
                    // If no data for this period, we could show empty or fallback
                    // setData([]); 
                }
            }
        } catch (err) {
            console.error("Failed to load request list", err);
        }
    };

    React.useEffect(() => {
        loadDropdownData();
        loadRequestList();
    }, [selectedYear, selectedMonth]);

    const handleFocus = (serviceId: number, field: string) => {
        setDirtyFields(prev => ({ ...prev, [`${serviceId}-${field}`]: false }));
    };

    const handleValueChange = (serviceId: number, field: string, value: string) => {
        // Allow numeric input and decimals
        if (!/^\d*\.?\d*$/.test(value)) return;

        setData(prevData => prevData.map(row => 
            row.service_id === serviceId ? { ...row, [field]: value } : row
        ));
        setDirtyFields(prev => ({ ...prev, [`${serviceId}-${field}`]: true }));
        setModifiedServiceIds(prev => new Set(prev).add(serviceId));
    };

    const handleBlur = (serviceId: number, field: string, value: string) => {
        const key = `${serviceId}-${field}`;
        if (!dirtyFields[key]) return; // Didn't change during this focus

        if (!value || isNaN(Number(value))) return;

        const numValue = parseFloat(value);
        const increasedValue = numValue * 1.08;

        const formattedValue = increasedValue.toFixed(2).replace(/\.00$/, '');

        setData(prevData => prevData.map(row => 
            row.service_id === serviceId ? { ...row, [field]: formattedValue } : row
        ));
        setDirtyFields(prev => ({ ...prev, [key]: false }));
    };

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

    // Calculate Totals
    // Calculate Totals
    const handleSearch = () => {
        setAppliedCustomer(selectedCustomer);
    };

    const filteredData = data.filter(row => {
        if (!appliedCustomer || appliedCustomer === "all") return true;
        return row.customer_name === appliedCustomer;
    });

    const totals = filteredData.reduce((acc, row) => {
        const parseVal = (val: any) => {
            if (typeof val === 'string') return Number(val.replace(/,/g, '')) || 0;
            return Number(val) || 0;
        };
        const c1 = parseVal(row.c1);
        const c2 = parseVal(row.c2);
        const c4 = parseVal(row.c4);
        const c5 = parseVal(row.c5);
        const total = c1 + c2 + c4 + c5;
        return {
            c1: acc.c1 + c1,
            c2: acc.c2 + c2,
            c4: acc.c4 + c4,
            c5: acc.c5 + c5,
            total: acc.total + total,
        };
    }, { c1: 0, c2: 0, c4: 0, c5: 0, total: 0 });

    const handleEditClick = () => {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1; // 1-12

        // Check if selected period matches current period
        if (parseInt(selectedYear) !== currentYear || parseInt(selectedMonth) !== currentMonth) {
            toast.error("You can only edit data for the current month.", {
                description: `Editing ${selectedMonth}/${selectedYear} is not allowed. You can only edit ${currentMonth}/${currentYear}.`
            });
            return;
        }

        // Check if today is past the 20th of the month
        if (today.getDate() > 20) {
            toast.error("It's after 20th, you will not be able to edit the data for this month", {
                description: "Editing is restricted to the first 20 days of the month."
            });
            return;
        }

        setIsEditing(!isEditing);
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem("access_token");
            const payload = {
                year: parseInt(selectedYear),
                month: parseInt(selectedMonth),
                day: new Date().getDate(),
                requests: data
                    .filter(row => modifiedServiceIds.has(row.service_id))
                    .map(row => ({
                        customer_id: row.customer_id,
                        service_id: row.service_id,
                        c1: Number(row.c1) || 0,
                        c2: Number(row.c2) || 0,
                        c4: Number(row.c4) || 0,
                        c5: Number(row.c5) || 0,
                        total: (Number(row.c1) || 0) + (Number(row.c2) || 0) + (Number(row.c4) || 0) + (Number(row.c5) || 0)
                    }))
            };

            if (payload.requests.length === 0) {
                toast.info("No changes to save");
                setIsEditing(false);
                return;
            }

            const res = await fetch(`${BACKEND_API_URL}/consumption-request/save`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                toast.success("Data saved successfully");
                setIsEditing(false);
                setModifiedServiceIds(new Set()); // Clear modified track
                loadRequestList();
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to save data");
            }
        } catch (err) {
            console.error("Save error:", err);
            toast.error("Failed to connect to server");
        }
    };

    return (
        <div className="p-2 bg-slate-50 min-h-screen font-sans">
            <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-3 space-y-2">
                    {/* Page Title */}
                    <div className="flex items-center justify-between pb-1">
                        <h1 className="text-xl font-bold text-slate-800">Customer Consumption Request</h1>
                    </div>

                    {/* Search Filters */}
                    <div className="space-y-1">
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap gap-2 items-center">
                            <span className="text-sm font-semibold text-slate-600 mr-2">Search</span>
                            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                                <SelectTrigger className="w-[200px] h-9 bg-white border-slate-300 text-sm">
                                    <SelectValue placeholder="Select Customer" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Customers</SelectItem>
                                    {Array.from(new Set(customers.map(c => c.customer_name))).map(name => (
                                        <SelectItem key={name} value={name}>{name}</SelectItem>
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

                            <Button 
                                size="sm" 
                                className="h-9 text-sm bg-primary hover:bg-primary/90 text-primary-foreground px-4"
                                onClick={handleSearch}
                            >
                                Search
                            </Button>
                            <Button size="sm" className="h-9 text-sm bg-red-600 hover:bg-red-700 text-white px-4" onClick={handleSave}>
                                Save
                            </Button>
                            <Button size="sm" className="h-9 text-sm bg-[#DAA520] hover:bg-[#B8860B] text-white px-4">
                                Export Excel
                            </Button>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center bg-primary/5 p-2 rounded-t-lg border-b border-primary/10 h-10">
                            <div className="flex items-center gap-3 pl-2">
                                <h2 className="text-sm font-semibold text-primary">Consumption Requests List</h2>
                                <span className="text-[11px] font-semibold text-[#CB4154] bg-red-50 px-2 py-0.5 rounded border border-red-100">* Note: Entered values will automatically add an 8% increase (Value + 8%) on blur. e.g. 250 becomes 270.</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-500 hover:text-slate-700"
                                    onClick={handleEditClick}
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
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
                                        <TableHead className="h-10 font-semibold text-white whitespace-nowrap">Customer</TableHead>
                                        <TableHead className="h-10 font-semibold text-white whitespace-nowrap">SC Number</TableHead>
                                        <TableHead className="h-10 font-semibold text-white text-right whitespace-nowrap">C1</TableHead>
                                        <TableHead className="h-10 font-semibold text-white text-right whitespace-nowrap">C2</TableHead>
                                        <TableHead className="h-10 font-semibold text-white text-right whitespace-nowrap">C4</TableHead>
                                        <TableHead className="h-10 font-semibold text-white text-right whitespace-nowrap">C5</TableHead>
                                        <TableHead className="h-10 font-semibold text-white text-right whitespace-nowrap">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredData.map((row, index) => (
                                        <TableRow key={index} className="hover:bg-slate-50 border-b border-slate-100 font-medium">
                                            <TableCell className="py-2 text-sm text-slate-700">{row.customer_name}</TableCell>
                                            <TableCell className="py-2 text-sm text-slate-700">{row.sc_number}</TableCell>
                                            <TableCell className="py-2 p-1">
                                                <Input
                                                    disabled={!isEditing}
                                                    className="h-8 text-right text-sm border-slate-200 shadow-none focus-visible:ring-1 bg-white disabled:bg-slate-50 disabled:text-slate-500"
                                                    value={row.c1}
                                                    onFocus={() => handleFocus(row.service_id, 'c1')}
                                                    onBlur={(e) => handleBlur(row.service_id, 'c1', e.target.value)}
                                                    onChange={(e) => handleValueChange(row.service_id, 'c1', e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell className="py-2 p-1">
                                                <Input
                                                    disabled={!isEditing}
                                                    className="h-8 text-right text-sm border-slate-200 shadow-none focus-visible:ring-1 bg-white disabled:bg-slate-50 disabled:text-slate-500"
                                                    value={row.c2}
                                                    onFocus={() => handleFocus(row.service_id, 'c2')}
                                                    onBlur={(e) => handleBlur(row.service_id, 'c2', e.target.value)}
                                                    onChange={(e) => handleValueChange(row.service_id, 'c2', e.target.value)}
                                                />
                                            </TableCell>

                                            <TableCell className="py-2 p-1">
                                                <Input
                                                    disabled={!isEditing}
                                                    className="h-8 text-right text-sm border-slate-200 shadow-none focus-visible:ring-1 bg-white disabled:bg-slate-50 disabled:text-slate-500"
                                                    value={row.c4}
                                                    onFocus={() => handleFocus(row.service_id, 'c4')}
                                                    onBlur={(e) => handleBlur(row.service_id, 'c4', e.target.value)}
                                                    onChange={(e) => handleValueChange(row.service_id, 'c4', e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell className="py-2 p-1">
                                                <Input
                                                    disabled={!isEditing}
                                                    className="h-8 text-right text-sm border-slate-200 shadow-none focus-visible:ring-1 bg-white disabled:bg-slate-50 disabled:text-slate-500"
                                                    value={row.c5}
                                                    onFocus={() => handleFocus(row.service_id, 'c5')}
                                                    onBlur={(e) => handleBlur(row.service_id, 'c5', e.target.value)}
                                                    onChange={(e) => handleValueChange(row.service_id, 'c5', e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell className="py-2 p-1">
                                                <Input
                                                    readOnly
                                                    className="h-8 text-right text-sm border-slate-200 shadow-none focus-visible:ring-1 bg-slate-50 text-slate-700 font-semibold"
                                                    value={(Number(row.c1) + Number(row.c2) + Number(row.c4) + Number(row.c5)).toLocaleString()}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                <TableFooter className="bg-slate-100/80 border-t-2 border-slate-200">
                                    <TableRow>
                                        <TableCell colSpan={2} className="h-10 font-bold text-slate-800 text-sm">Net Total</TableCell>
                                        <TableCell className="h-10 font-bold text-indigo-700 text-right text-sm px-3">{totals.c1.toLocaleString()}</TableCell>
                                        <TableCell className="h-10 font-bold text-indigo-700 text-right text-sm px-3">{totals.c2.toLocaleString()}</TableCell>
                                        <TableCell className="h-10 font-bold text-indigo-700 text-right text-sm px-3">{totals.c4.toLocaleString()}</TableCell>
                                        <TableCell className="h-10 font-bold text-indigo-700 text-right text-sm px-3">{totals.c5.toLocaleString()}</TableCell>
                                        <TableCell className="h-10 font-bold text-slate-800 text-right text-sm">{totals.total.toLocaleString()}</TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
