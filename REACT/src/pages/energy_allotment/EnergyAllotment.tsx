import React, { useState } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { Search, Edit, Eye } from "lucide-react";
import { toast } from "sonner";
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
    TableFooter,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const allotmentData = [
    { wm: "WM-001", customer: "L&T", seNumber: "SC-1001", consumption: "600", c1: "250", c1_pp: "300", c1_bank: "110", c2: "100", c2_pp: "150", c2_bank: "50", c4: "75", c4_pp: "100", c4_bank: "40", c5: "50", c5_pp: "80", c5_bank: "30", c1_allot: "0", c2_allot: "0", c4_allot: "0", c5_allot: "0" },
    { wm: "WM-002", customer: "Texmo", seNumber: "SC-2001", consumption: "525", c1: "200", c1_pp: "300", c1_bank: "120", c2: "90", c2_pp: "120", c2_bank: "40", c4: "70", c4_pp: "100", c4_bank: "30", c5: "45", c5_pp: "80", c5_bank: "20", c1_allot: "0", c2_allot: "0", c4_allot: "0", c5_allot: "0" },
    { wm: "WM-003", customer: "L&T", seNumber: "SC-1002", consumption: "450", c1: "150", c1_pp: "200", c1_bank: "80", c2: "80", c2_pp: "120", c2_bank: "40", c4: "60", c4_pp: "90", c4_bank: "30", c5: "40", c5_pp: "70", c5_bank: "20", c1_allot: "0", c2_allot: "0", c4_allot: "0", c5_allot: "0" },
    { wm: "WM-004", customer: "Texmo", seNumber: "SC-2002", consumption: "400", c1: "120", c1_pp: "180", c1_bank: "70", c2: "70", c2_pp: "100", c2_bank: "30", c4: "50", c4_pp: "80", c4_bank: "20", c5: "35", c5_pp: "60", c5_bank: "15", c1_allot: "0", c2_allot: "0", c4_allot: "0", c5_allot: "0" },
    { wm: "WM-005", customer: "L&T", seNumber: "SC-1004", consumption: "500", c1: "180", c1_pp: "250", c1_bank: "90", c2: "85", c2_pp: "130", c2_bank: "45", c4: "65", c4_pp: "100", c4_bank: "35", c5: "45", c5_pp: "75", c5_bank: "25", c1_allot: "0", c2_allot: "0", c4_allot: "0", c5_allot: "0" },
    { wm: "WM-006", customer: "Texmo", seNumber: "SC-2003", consumption: "480", c1: "160", c1_pp: "220", c1_bank: "85", c2: "75", c2_pp: "115", c2_bank: "35", c4: "55", c4_pp: "90", c4_bank: "25", c5: "40", c5_pp: "70", c5_bank: "20", c1_allot: "0", c2_allot: "0", c4_allot: "0", c5_allot: "0" },
    { wm: "WM-007", customer: "L&T", seNumber: "SC-1001", consumption: "550", c1: "210", c1_pp: "280", c1_bank: "95", c2: "95", c2_pp: "140", c2_bank: "55", c4: "70", c4_pp: "110", c4_bank: "45", c5: "50", c5_pp: "85", c5_bank: "35", c1_allot: "0", c2_allot: "0", c4_allot: "0", c5_allot: "0" },
    { wm: "WM-008", customer: "Texmo", seNumber: "SC-2005", consumption: "620", c1: "240", c1_pp: "310", c1_bank: "110", c2: "105", c2_pp: "160", c2_bank: "60", c4: "80", c4_pp: "120", c4_bank: "50", c5: "55", c5_pp: "95", c5_bank: "40", c1_allot: "0", c2_allot: "0", c4_allot: "0", c5_allot: "0" },
    { wm: "SOLAR-001", customer: "L&T", seNumber: "SC-1002", consumption: "420", c1: "140", c1_pp: "200", c1_bank: "75", c2: "65", c2_pp: "100", c2_bank: "35", c4: "45", c4_pp: "75", c4_bank: "25", c5: "30", c5_pp: "55", c5_bank: "15", c1_allot: "0", c2_allot: "0", c4_allot: "0", c5_allot: "0" }
];

// Charge lookup: charges keyed by "customer|seNumber"
const chargesLookup: Record<string, { mrc: number; omc: number; trc: number; oc1: number; kp: number; ec: number; shc: number; other: number; dc: number }> = {
    "L&T|SC-1001": { mrc: 100, omc: 200, trc: 150, oc1: 50, kp: 300, ec: 400, shc: 250, other: 60, dc: 70 },
    "L&T|SC-1002": { mrc: 110, omc: 220, trc: 160, oc1: 55, kp: 320, ec: 420, shc: 270, other: 65, dc: 75 },
    "L&T|SC-1004": { mrc: 130, omc: 240, trc: 175, oc1: 58, kp: 340, ec: 440, shc: 290, other: 75, dc: 85 },
    "Texmo|SC-2001": { mrc: 120, omc: 210, trc: 155, oc1: 52, kp: 310, ec: 410, shc: 260, other: 62, dc: 72 },
    "Texmo|SC-2002": { mrc: 125, omc: 215, trc: 158, oc1: 53, kp: 315, ec: 415, shc: 265, other: 64, dc: 74 },
    "Texmo|SC-2003": { mrc: 128, omc: 218, trc: 162, oc1: 54, kp: 318, ec: 418, shc: 268, other: 66, dc: 76 },
    "Texmo|SC-2005": { mrc: 135, omc: 230, trc: 170, oc1: 57, kp: 330, ec: 430, shc: 280, other: 70, dc: 80 },
    "ABC Corp|SC-3001": { mrc: 140, omc: 260, trc: 185, oc1: 62, kp: 360, ec: 460, shc: 310, other: 82, dc: 92 },
    "ABC Corp|SC-3002": { mrc: 145, omc: 265, trc: 190, oc1: 64, kp: 365, ec: 465, shc: 315, other: 84, dc: 94 },
    "XYZ Ltd|SC-4001": { mrc: 150, omc: 250, trc: 180, oc1: 60, kp: 350, ec: 450, shc: 300, other: 80, dc: 90 },
    "XYZ Ltd|SC-4002": { mrc: 155, omc: 255, trc: 182, oc1: 61, kp: 355, ec: 455, shc: 305, other: 81, dc: 91 },
};

// Customer list and their SE numbers (Restricted to 2 customers)
const customerSEMap: Record<string, string[]> = {
    "L&T": ["SC-1001", "SC-1002", "SC-1004"],
    "Texmo": ["SC-2001", "SC-2002", "SC-2003", "SC-2005"],
};
const customerList = Object.keys(customerSEMap);

// Solar Data: 2 Customers, listed by SE Number
const initialSolarData = [
    { customer: "L&T", seNumber: "SC-1001" },
    { customer: "L&T", seNumber: "SC-1002" },
    { customer: "L&T", seNumber: "SC-1004" },
    { customer: "Texmo", seNumber: "SC-2001" },
    { customer: "Texmo", seNumber: "SC-2002" },
    { customer: "Texmo", seNumber: "SC-2003" },
    { customer: "Texmo", seNumber: "SC-2005" },
];

const windmillNumbers = ["WM-001", "WM-002", "WM-003", "WM-004", "WM-005", "WM-006", "WM-007", "WM-008"];

type ChargeRow = {
    windmill: string;
    customer: string;
    seNumber: string;
    mrc: number; omc: number; trc: number; oc1: number; kp: number; ec: number; shc: number; other: number; dc: number;
};

type SolarRow = {
    isChecked: boolean;
    customer: string;
    seNumber: string;
    mrc: number; omc: number; trc: number; oc1: number; kp: number; ec: number; shc: number; other: number; dc: number;
};

const createEmptyChargeRows = (): ChargeRow[] =>
    windmillNumbers.map(wm => ({
        windmill: wm, customer: "", seNumber: "",
        mrc: 0, omc: 0, trc: 0, oc1: 0, kp: 0, ec: 0, shc: 0, other: 0, dc: 0,
    }));

const createInitialSolarRows = (): SolarRow[] =>
    initialSolarData.map(data => ({
        isChecked: false,
        customer: data.customer,
        seNumber: data.seNumber,
        mrc: 0, omc: 0, trc: 0, oc1: 0, kp: 0, ec: 0, shc: 0, other: 0, dc: 0,
        // Pre-fill charges from lookup if available
        ...(chargesLookup[`${data.customer}|${data.seNumber}`] || {})
    }));


export default function EnergyAllotment() {
    const { open } = useSidebar();
    const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
    const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString());
    const [searchKeyword, setSearchKeyword] = useState("");
    const [isEditing, setIsEditing] = useState(false);

    // State for Uploads
    const [uploads, setUploads] = useState<Record<string, { file: File | null, fileName: string }>>({});

    const handleFileUpload = (wm: string, file: File | null) => {
        setUploads(prev => ({
            ...prev,
            [wm]: { file, fileName: file ? file.name : "" }
        }));
    };

    // State for Charge Allocation (8 windmills)

    // State for Charge Allocation (8 windmills)
    const [chargeAllocationRows, setChargeAllocationRows] = useState<ChargeRow[]>(createEmptyChargeRows());

    // State for Solar Allocation
    const [solarAllocationRows, setSolarAllocationRows] = useState<SolarRow[]>(createInitialSolarRows());

    // State for Energy Allotment List
    const [energyAllotmentData, setEnergyAllotmentData] = useState<(typeof allotmentData[0] & Record<string, any>)[]>(allotmentData);

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
    const totals = allotmentData.reduce((acc, row) => ({
        c1: acc.c1 + Number(row.c1.replace(/,/g, '')),
        c2: acc.c2 + Number(row.c2.replace(/,/g, '')),
        c4: acc.c4 + Number(row.c4.replace(/,/g, '')),
        c5: acc.c5 + Number(row.c5.replace(/,/g, '')),
        consumption: acc.consumption + Number(row.consumption.replace(/,/g, '')),
    }), { c1: 0, c2: 0, c4: 0, c5: 0, consumption: 0 });

    const handleEditClick = () => {
        // Date constraints removed for now as requested
        setIsEditing(!isEditing);
    };

    const handleSave = () => {
        setIsEditing(false);
        toast.success("Data saved successfully");
    };

    const handleChargeCustomerChange = (index: number, customer: string) => {
        const newData = [...chargeAllocationRows];
        newData[index] = { ...newData[index], customer, seNumber: "", mrc: 0, omc: 0, trc: 0, oc1: 0, kp: 0, ec: 0, shc: 0, other: 0, dc: 0 };
        setChargeAllocationRows(newData);
    };

    const handleChargeSEChange = (index: number, seNumber: string) => {
        const newData = [...chargeAllocationRows];
        const customer = newData[index].customer;
        const key = `${customer}|${seNumber}`;
        const charges = chargesLookup[key];
        if (charges) {
            newData[index] = { ...newData[index], seNumber, ...charges };
        } else {
            newData[index] = { ...newData[index], seNumber, mrc: 0, omc: 0, trc: 0, oc1: 0, kp: 0, ec: 0, shc: 0, other: 0, dc: 0 };
        }
        setChargeAllocationRows(newData);
    };

    const handleChargeFieldChange = (index: number, field: string, value: string) => {
        const newData = [...chargeAllocationRows];
        newData[index] = { ...newData[index], [field]: Number(value) || 0 };
        setChargeAllocationRows(newData);
    };

    // Handlers for Solar Allocation
    const handleSolarCheckChange = (index: number, checked: boolean) => {
        const newData = [...solarAllocationRows];
        newData[index].isChecked = checked;
        setSolarAllocationRows(newData);
    };

    const handleSolarFieldChange = (index: number, field: string, value: string) => {
        const newData = [...solarAllocationRows];
        // @ts-ignore
        newData[index][field] = Number(value) || 0;
        setSolarAllocationRows(newData);
    };

    const handleEnergyAllotmentChange = (index: number, field: string, value: string) => {
        const newData = [...energyAllotmentData];
        newData[index] = { ...newData[index], [field]: value };
        setEnergyAllotmentData(newData);
    };

    const handleGridUpdate = (customer: string, seNumber: string, wm: string, field: string, value: string) => {
        const index = energyAllotmentData.findIndex(d => d.customer === customer && d.seNumber === seNumber && d.wm === wm);

        if (index >= 0) {
            // Update existing
            const newData = [...energyAllotmentData];
            newData[index] = { ...newData[index], [field]: value };
            setEnergyAllotmentData(newData);
        } else {
            // Create new entry
            // Find sibling to copy potential static data like consumption if needed, or default
            const sibling = energyAllotmentData.find(d => d.customer === customer && d.seNumber === seNumber);
            const newEntry = {
                wm,
                customer,
                seNumber,
                consumption: sibling ? sibling.consumption : "0",
                c1: "0", c1_pp: "0", c1_bank: "0",
                c2: "0", c2_pp: "0", c2_bank: "0",
                c4: "0", c4_pp: "0", c4_bank: "0",
                c5: "0", c5_pp: "0", c5_bank: "0",
                c1_allot: "0", c2_allot: "0", c4_allot: "0", c5_allot: "0",
                [field]: value
            };
            setEnergyAllotmentData([...energyAllotmentData, newEntry]);
        }
    };

    return (
        <div className="p-2 bg-slate-50 min-h-screen font-sans">
            <div className="max-w-full mx-auto bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-3 space-y-2">
                    {/* Page Title */}
                    <div className="flex items-center justify-between pb-1">
                        <h1 className="text-xl font-bold text-slate-800">Energy Allotment</h1>
                    </div>

                    {/* Search Filters */}
                    <div className="space-y-1">
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex flex-nowrap gap-2 items-center">
                            <span className="text-sm font-semibold text-slate-600 mr-2">Search</span>
                            <Select>
                                <SelectTrigger className="w-[200px] h-9 bg-white border-slate-300 text-sm">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="wm-001">WM-001</SelectItem>
                                    <SelectItem value="wm-002">WM-002</SelectItem>
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

                            <Button size="sm" className="h-9 text-sm bg-[#0E7490] hover:bg-[#0C6159] text-white px-4">
                                Search
                            </Button>
                            <Button size="sm" className="h-9 text-sm bg-red-600 hover:bg-red-700 text-white px-4" onClick={handleSave}>
                                Save
                            </Button>
                            <Button size="sm" className="h-9 text-sm bg-slate-500 hover:bg-slate-600 text-white px-4" onClick={() => setIsEditing(false)}>
                                Cancel
                            </Button>
                            <Button size="sm" className="h-9 text-sm bg-[#DAA520] hover:bg-[#B8860B] text-white px-4">
                                Export Excel
                            </Button>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="space-y-2">
                        <Tabs defaultValue="list" className="w-full">
                            <div className="flex justify-between items-center bg-primary/5 p-2 rounded-t-lg border-b border-primary/10 h-12">
                                <TabsList className="bg-transparent p-0 h-auto">
                                    <TabsTrigger value="list" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-md px-4 py-1.5 text-sm font-semibold text-slate-600">Energy Allotment List</TabsTrigger>
                                    <TabsTrigger value="allocation" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-md px-4 py-1.5 text-sm font-semibold text-slate-600">Charge Allocation</TabsTrigger>
                                    <TabsTrigger value="uploads" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-md px-4 py-1.5 text-sm font-semibold text-slate-600">Allotment Order Upload</TabsTrigger>
                                </TabsList>

                                <div className="flex items-center gap-2">
                                    <div className="relative w-64">
                                        <Search className="absolute right-2 top-2.5 h-4 w-4 text-slate-400" />
                                        <Input
                                            placeholder="Keyword search..."
                                            className="bg-white border-slate-300 pr-8 h-9 text-sm"
                                            value={searchKeyword}
                                            onChange={(e) => setSearchKeyword(e.target.value)}
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-slate-500 hover:text-slate-700"
                                        onClick={handleEditClick}
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <TabsContent value="list" className="mt-0">
                                <div className="flex justify-start gap-4 p-2 bg-white border-x border-slate-200">
                                    <div className="flex items-center gap-1.5 text-xs font-medium">
                                        <span className="font-bold text-amber-500">P</span>
                                        <span className="text-slate-600">- Power Plant Available</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs font-medium">
                                        <span className="font-bold text-red-500">B</span>
                                        <span className="text-slate-600">- Banking Units</span>
                                    </div>
                                </div>
                                <div className="border border-slate-200 rounded-b-lg mt-0 bg-white overflow-x-auto thin-scrollbar" style={{ maxWidth: open ? 'calc(100vw - 18rem)' : 'calc(100vw - 5rem)' }}>
                                    <Table noWrapper className="min-w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                                        <TableHeader className="bg-sidebar sticky top-0 z-40">
                                            <TableRow>
                                                <TableHead rowSpan={2} className="h-10 font-semibold text-white whitespace-nowrap min-w-[120px] w-[120px] border-r border-white/20 bg-sidebar sticky left-0 z-50">Customer</TableHead>
                                                <TableHead rowSpan={2} className="h-10 font-semibold text-white whitespace-nowrap min-w-[120px] w-[120px] border-r border-white/20 bg-sidebar sticky left-[120px] z-50">Service Number</TableHead>
                                                <TableHead rowSpan={2} className="h-10 font-semibold text-white whitespace-nowrap min-w-[120px] w-[120px] border-r border-white/20 bg-sidebar sticky left-[240px] z-50"></TableHead>
                                                {/* Fixed Generator Columns */}
                                                {["WM-001", "WM-002", "WM-003", "WM-004", "WM-005", "WM-006", "WM-007", "WM-008", "SOLAR-001"].map((wm) => {
                                                    return (
                                                        <TableHead key={wm} colSpan={4} className="h-auto font-semibold text-center border-b border-r border-slate-400 last:border-r-0 p-0 align-top bg-white">
                                                            <div className="bg-sidebar text-white h-full flex items-center justify-center py-2">
                                                                {wm}
                                                            </div>
                                                        </TableHead>
                                                    );
                                                })}
                                                <TableHead rowSpan={2} className="h-10 font-semibold text-white text-center border-b border-r border-white/20 align-middle">Total</TableHead>
                                            </TableRow>
                                            <TableRow className="bg-sidebar/85 hover:bg-sidebar/85 border-b-0">
                                                {["WM-001", "WM-002", "WM-003", "WM-004", "WM-005", "WM-006", "WM-007", "WM-008", "SOLAR-001"].map((wm) => {
                                                    const wmItems = energyAllotmentData.filter(d => d.wm === wm);
                                                    const renderColHeader = (col: 'c1' | 'c2' | 'c4' | 'c5', label: string, isLast = false) => {
                                                        const totalPP = wmItems.reduce((acc, curr) => acc + (Number(curr[`${col}_pp`]) || 0), 0);
                                                        const totalBank = wmItems.reduce((acc, curr) => acc + (Number(curr[`${col}_bank`]) || 0), 0);
                                                        const totalAllocated = wmItems.reduce((acc, curr) => acc + (Number(String(curr[col]).replace(/,/g, '')) || 0), 0);
                                                        let displayPower = totalPP - totalAllocated;
                                                        let displayBank = totalBank;
                                                        if (displayPower < 0) {
                                                            displayBank = totalBank - Math.abs(displayPower);
                                                            displayPower = 0;
                                                        }
                                                        return (
                                                            <TableHead key={`${wm}-${col}`} className={`p-1 pt-1.5 pb-1 text-xs font-semibold text-white text-center border-r ${isLast ? 'border-white/20 last:border-r-0' : 'border-white/10'} align-bottom`}>
                                                                <div className="flex flex-col gap-1.5 mb-2 items-start w-fit mx-auto">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="text-xs text-white font-bold w-4 text-right">P:</span>
                                                                        <input type="text" disabled value={displayPower} className="border border-black px-1 bg-white text-red-500 w-[46px] text-center font-bold h-[24px] text-xs focus:outline-none disabled:opacity-100 disabled:cursor-default" />
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="text-xs text-white font-bold w-4 text-right">B:</span>
                                                                        <input type="text" disabled value={displayBank} className="border border-black px-1 bg-white text-red-500 w-[46px] text-center font-bold h-[24px] text-xs focus:outline-none disabled:opacity-100 disabled:cursor-default" />
                                                                    </div>
                                                                </div>
                                                                <div className="pb-0.5">{label}</div>
                                                            </TableHead>
                                                        );
                                                    };

                                                    return (
                                                        <React.Fragment key={wm}>
                                                            {renderColHeader('c1', 'C1')}
                                                            {renderColHeader('c2', 'C2')}
                                                            {renderColHeader('c4', 'C4')}
                                                            {renderColHeader('c5', 'C5', true)}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {/* Group Logic */}
                                            {(() => {
                                                const generators = ["WM-001", "WM-002", "WM-003", "WM-004", "WM-005", "WM-006", "WM-007", "WM-008", "SOLAR-001"];
                                                // Group by Customer then SE Number
                                                // Group by Customer then SE Number
                                                const filteredData = energyAllotmentData.filter(item => {
                                                    if (searchKeyword === "") return true;
                                                    return Object.values(item).some(val =>
                                                        String(val).toLowerCase().includes(searchKeyword.toLowerCase())
                                                    );
                                                });

                                                const groupedData = filteredData.reduce((acc, item) => {
                                                    if (!acc[item.customer]) acc[item.customer] = new Set();
                                                    acc[item.customer].add(item.seNumber);
                                                    return acc;
                                                }, {} as Record<string, Set<string>>);

                                                const renderedOrder: { customer: string, seNumber: string }[] = [];
                                                Object.entries(groupedData).forEach(([c, seSet]) => Array.from(seSet).forEach(se => renderedOrder.push({ customer: c, seNumber: se })));

                                                return (
                                                    <React.Fragment>
                                                        {/* Power Plant Row */}
                                                        <TableRow className="bg-[#e0f2fe] border-b border-white hover:bg-[#e0f2fe]">
                                                            <TableCell colSpan={3} className="py-2 text-sm text-[#0369a1] font-bold border-r bg-[#e0f2fe] align-middle sticky left-0 z-20 text-center uppercase tracking-wide">
                                                                Power Plant
                                                            </TableCell>
                                                            {generators.map((wm) => {
                                                                const wmItems = energyAllotmentData.filter(d => d.wm === wm);
                                                                const renderC = (col: 'c1' | 'c2' | 'c4' | 'c5') => {
                                                                    const totalPP = wmItems.reduce((acc, curr) => acc + (Number(curr[`${col}_pp`]) || 0), 0);
                                                                    return <TableCell key={`${wm}-${col}-pp`} className="p-1 border-r text-center font-bold text-[#0369a1] text-[11px] bg-[#e0f2fe]">{totalPP}</TableCell>
                                                                };
                                                                return (
                                                                    <React.Fragment key={`${wm}-pp`}>
                                                                        {renderC('c1')}
                                                                        {renderC('c2')}
                                                                        {renderC('c4')}
                                                                        {renderC('c5')}
                                                                    </React.Fragment>
                                                                );
                                                            })}
                                                            <TableCell className="p-1 border-r bg-[#e0f2fe] font-bold text-[#0369a1] text-center">-</TableCell>
                                                        </TableRow>

                                                        {/* Banking Row */}
                                                        <TableRow className="bg-[#ffedd5] border-b-2 border-slate-300 hover:bg-[#ffedd5]">
                                                            <TableCell colSpan={3} className="py-2 text-sm text-[#c2410c] font-bold border-r bg-[#ffedd5] align-middle sticky left-0 z-20 text-center uppercase tracking-wide">
                                                                Banking
                                                            </TableCell>
                                                            {generators.map((wm) => {
                                                                const wmItems = energyAllotmentData.filter(d => d.wm === wm);
                                                                const renderC = (col: 'c1' | 'c2' | 'c4' | 'c5') => {
                                                                    const totalBank = wmItems.reduce((acc, curr) => acc + (Number(curr[`${col}_bank`]) || 0), 0);
                                                                    return <TableCell key={`${wm}-${col}-bank`} className="p-1 border-r text-center font-bold text-[#c2410c] text-[11px] bg-[#ffedd5]">{totalBank}</TableCell>
                                                                };
                                                                return (
                                                                    <React.Fragment key={`${wm}-bank`}>
                                                                        {renderC('c1')}
                                                                        {renderC('c2')}
                                                                        {renderC('c4')}
                                                                        {renderC('c5')}
                                                                    </React.Fragment>
                                                                );
                                                            })}
                                                            <TableCell className="p-1 border-r bg-[#ffedd5] font-bold text-[#c2410c] text-center">-</TableCell>
                                                        </TableRow>

                                                        {Object.entries(groupedData).map(([customer, seSet]) => {
                                                            const seList = Array.from(seSet);

                                                            // Calculate Totals for the Customer
                                                            // Requested: Sum of consumption for each unique SE Number
                                                            // Allocated: Sum of c1, c2, c4, c5 for ALL entries of this customer
                                                            const customerEntries = filteredData.filter(d => d.customer === customer);

                                                            // Consumption is per SE. Get one entry per SE to sum consumption.
                                                            const uniqueSEEntries = seList.map(se => customerEntries.find(d => d.seNumber === se)).filter(Boolean);
                                                            const totalRequested = uniqueSEEntries.reduce((acc, curr) => acc + (Number(curr?.consumption?.replace(/,/g, '') || 0)), 0);

                                                            const totalAllocated = customerEntries.reduce((acc, curr) => {
                                                                const c1 = Number(curr.c1?.replace(/,/g, '') || 0);
                                                                const c2 = Number(curr.c2?.replace(/,/g, '') || 0);
                                                                const c4 = Number(curr.c4?.replace(/,/g, '') || 0);
                                                                const c5 = Number(curr.c5?.replace(/,/g, '') || 0);
                                                                return acc + c1 + c2 + c4 + c5;
                                                            }, 0);

                                                            const rows = seList.map((seNumber, seIndex) => {
                                                                const rowItems = filteredData.filter(d => d.customer === customer && d.seNumber === seNumber);
                                                                const rowTotal = rowItems.reduce((acc, d) => acc + (Number(d.c1) || 0) + (Number(d.c2) || 0) + (Number(d.c4) || 0) + (Number(d.c5) || 0), 0);

                                                                return (
                                                                    <React.Fragment key={`${customer}-${seNumber}`}>
                                                                        {/* Row 1: Requested */}
                                                                        <TableRow className="hover:bg-slate-50 border-t border-slate-200 group">
                                                                            {seIndex === 0 && (
                                                                                <TableCell rowSpan={seList.length * 4} className="py-2 text-sm text-indigo-700 font-bold border-r bg-white align-top border-b border-slate-200 sticky left-0 z-20 w-[120px] min-w-[120px]">
                                                                                    {customer}
                                                                                </TableCell>
                                                                            )}
                                                                            <TableCell rowSpan={4} className="py-2 text-sm text-slate-800 font-bold border-r bg-white align-top border-b border-slate-200 sticky left-[120px] z-20 w-[120px] min-w-[120px]">
                                                                                <div className="flex flex-col gap-2">
                                                                                    <span>{seNumber}</span>
                                                                                    <div className="flex flex-col text-[10px] font-semibold gap-1">
                                                                                        <span><span className="text-slate-500">Requested:</span> <span className="text-[#B22222]">{rowItems[0]?.consumption || '0'}</span></span>
                                                                                        <span><span className="text-slate-500">Allocated:</span> <span className="text-[#B22222]">{rowTotal}</span></span>
                                                                                    </div>
                                                                                </div>
                                                                            </TableCell>
                                                                            <TableCell className="py-2 px-2 text-xs text-slate-600 font-semibold border-r bg-white sticky left-[240px] z-20 w-[120px] min-w-[120px]">
                                                                                Requested
                                                                            </TableCell>
                                                                            {generators.map(wm => {
                                                                                const item = filteredData.find(d => d.customer === customer && d.seNumber === seNumber && d.wm === wm);
                                                                                return (
                                                                                    <React.Fragment key={wm}>
                                                                                        <TableCell className="p-1 border-r text-center"><Input disabled={!isEditing} className="h-7 text-center text-xs px-0" value={item ? item.req_c1 || '' : ''} onChange={(e) => handleGridUpdate(customer, seNumber, wm, 'req_c1', e.target.value)} /></TableCell>
                                                                                        <TableCell className="p-1 border-r text-center"><Input disabled={!isEditing} className="h-7 text-center text-xs px-0" value={item ? item.req_c2 || '' : ''} onChange={(e) => handleGridUpdate(customer, seNumber, wm, 'req_c2', e.target.value)} /></TableCell>
                                                                                        <TableCell className="p-1 border-r text-center"><Input disabled={!isEditing} className="h-7 text-center text-xs px-0" value={item ? item.req_c4 || '' : ''} onChange={(e) => handleGridUpdate(customer, seNumber, wm, 'req_c4', e.target.value)} /></TableCell>
                                                                                        <TableCell className="p-1 border-r text-center"><Input disabled={!isEditing} className="h-7 text-center text-xs px-0" value={item ? item.req_c5 || '' : ''} onChange={(e) => handleGridUpdate(customer, seNumber, wm, 'req_c5', e.target.value)} /></TableCell>
                                                                                    </React.Fragment>
                                                                                );
                                                                            })}
                                                                            <TableCell className="p-1 border-r text-center align-middle bg-slate-50 font-bold text-slate-700 text-xs py-2">-</TableCell>
                                                                        </TableRow>

                                                                        {/* Row 2: Allocated */}
                                                                        <TableRow className="hover:bg-slate-50 group">
                                                                            <TableCell className="py-2 px-2 text-xs text-slate-600 font-semibold border-r bg-white sticky left-[240px] z-20 w-[120px] min-w-[120px]">
                                                                                Allocated
                                                                            </TableCell>
                                                                            {generators.map(wm => {
                                                                                const item = filteredData.find(d => d.customer === customer && d.seNumber === seNumber && d.wm === wm);
                                                                                return (
                                                                                    <React.Fragment key={wm}>
                                                                                        <TableCell className="p-1 border-r text-center"><Input disabled={!isEditing} className="h-7 text-center text-xs px-0" value={item ? item.c1 : ''} onChange={(e) => handleGridUpdate(customer, seNumber, wm, 'c1', e.target.value)} /></TableCell>
                                                                                        <TableCell className="p-1 border-r text-center"><Input disabled={!isEditing} className="h-7 text-center text-xs px-0" value={item ? item.c2 : ''} onChange={(e) => handleGridUpdate(customer, seNumber, wm, 'c2', e.target.value)} /></TableCell>
                                                                                        <TableCell className="p-1 border-r text-center"><Input disabled={!isEditing} className="h-7 text-center text-xs px-0" value={item ? item.c4 : ''} onChange={(e) => handleGridUpdate(customer, seNumber, wm, 'c4', e.target.value)} /></TableCell>
                                                                                        <TableCell className="p-1 border-r text-center"><Input disabled={!isEditing} className="h-7 text-center text-xs px-0" value={item ? item.c5 : ''} onChange={(e) => handleGridUpdate(customer, seNumber, wm, 'c5', e.target.value)} /></TableCell>
                                                                                    </React.Fragment>
                                                                                );
                                                                            })}
                                                                            <TableCell className="p-1 border-r text-center align-middle bg-slate-50 font-bold text-slate-700 text-xs py-2">{rowTotal}</TableCell>
                                                                        </TableRow>

                                                                        {/* Row 3: Utilized Power */}
                                                                        <TableRow className="hover:bg-slate-50 group">
                                                                            <TableCell className="py-2 px-2 text-xs text-slate-600 font-semibold border-r bg-white sticky left-[240px] z-20 w-[120px] min-w-[120px]">
                                                                                Utilized Power
                                                                            </TableCell>
                                                                            {generators.map(wm => {
                                                                                const item = filteredData.find(d => d.customer === customer && d.seNumber === seNumber && d.wm === wm);
                                                                                const getUP = (col: string) => {
                                                                                    if (!item) return '-';
                                                                                    const wmItems = filteredData.filter(d => d.wm === wm);
                                                                                    const totalPP = wmItems.reduce((acc, curr) => acc + (Number(curr[`${col}_pp`]) || 0), 0);
                                                                                    const currentIndex = renderedOrder.findIndex(r => r.customer === customer && r.seNumber === seNumber);
                                                                                    let prevAlloc = 0;
                                                                                    for (let i = 0; i < currentIndex; i++) {
                                                                                        const r = renderedOrder[i];
                                                                                        const prevItem = filteredData.find(d => d.customer === r.customer && d.seNumber === r.seNumber && d.wm === wm);
                                                                                        if (prevItem) {
                                                                                            prevAlloc += Number(String(prevItem[col] || '0').replace(/,/g, ''));
                                                                                        }
                                                                                    }
                                                                                    let availablePP = totalPP - prevAlloc;
                                                                                    if (availablePP < 0) availablePP = 0;
                                                                                    const alloc = Number(String(item[col] || '0').replace(/,/g, ''));
                                                                                    return Math.min(alloc, availablePP) || 0;
                                                                                };
                                                                                return (
                                                                                    <React.Fragment key={wm}>
                                                                                        <TableCell className="p-1 border-r text-center text-[#B22222] font-semibold text-xs">{getUP('c1')}</TableCell>
                                                                                        <TableCell className="p-1 border-r text-center text-[#B22222] font-semibold text-xs">{getUP('c2')}</TableCell>
                                                                                        <TableCell className="p-1 border-r text-center text-[#B22222] font-semibold text-xs">{getUP('c4')}</TableCell>
                                                                                        <TableCell className="p-1 border-r text-center text-[#B22222] font-semibold text-xs">{getUP('c5')}</TableCell>
                                                                                    </React.Fragment>
                                                                                );
                                                                            })}
                                                                            <TableCell className="p-1 border-r text-center align-middle bg-slate-50 font-bold text-slate-700 text-xs py-2">-</TableCell>
                                                                        </TableRow>

                                                                        {/* Row 4: Utilized Bank */}
                                                                        <TableRow className="hover:bg-slate-50 border-b border-slate-200 group">
                                                                            <TableCell className="py-2 px-2 text-xs text-slate-600 font-semibold border-r bg-white sticky left-[240px] z-20 w-[120px] min-w-[120px]">
                                                                                Utilized Bank
                                                                            </TableCell>
                                                                            {generators.map(wm => {
                                                                                const item = filteredData.find(d => d.customer === customer && d.seNumber === seNumber && d.wm === wm);
                                                                                const getUB = (col: string) => {
                                                                                    if (!item) return '-';
                                                                                    const wmItems = filteredData.filter(d => d.wm === wm);
                                                                                    const totalPP = wmItems.reduce((acc, curr) => acc + (Number(curr[`${col}_pp`]) || 0), 0);
                                                                                    const totalBank = wmItems.reduce((acc, curr) => acc + (Number(curr[`${col}_bank`]) || 0), 0);
                                                                                    const currentIndex = renderedOrder.findIndex(r => r.customer === customer && r.seNumber === seNumber);
                                                                                    let prevAlloc = 0;
                                                                                    for (let i = 0; i < currentIndex; i++) {
                                                                                        const r = renderedOrder[i];
                                                                                        const prevItem = filteredData.find(d => d.customer === r.customer && d.seNumber === r.seNumber && d.wm === wm);
                                                                                        if (prevItem) {
                                                                                            prevAlloc += Number(String(prevItem[col] || '0').replace(/,/g, ''));
                                                                                        }
                                                                                    }
                                                                                    let availablePP = totalPP - prevAlloc;
                                                                                    if (availablePP < 0) availablePP = 0;
                                                                                    const alloc = Number(String(item[col] || '0').replace(/,/g, ''));
                                                                                    const utilizedPower = Math.min(alloc, availablePP) || 0;
                                                                                    let bankUsedBefore = prevAlloc - totalPP;
                                                                                    if (bankUsedBefore < 0) bankUsedBefore = 0;
                                                                                    let availableBank = totalBank - bankUsedBefore;
                                                                                    if (availableBank < 0) availableBank = 0;
                                                                                    const remainingAlloc = alloc - utilizedPower;
                                                                                    return Math.min(remainingAlloc, availableBank) || 0;
                                                                                };
                                                                                return (
                                                                                    <React.Fragment key={wm}>
                                                                                        <TableCell className="p-1 border-r text-center text-[#B22222] font-semibold text-xs">{getUB('c1')}</TableCell>
                                                                                        <TableCell className="p-1 border-r text-center text-[#B22222] font-semibold text-xs">{getUB('c2')}</TableCell>
                                                                                        <TableCell className="p-1 border-r text-center text-[#B22222] font-semibold text-xs">{getUB('c4')}</TableCell>
                                                                                        <TableCell className="p-1 border-r text-center text-[#B22222] font-semibold text-xs">{getUB('c5')}</TableCell>
                                                                                    </React.Fragment>
                                                                                );
                                                                            })}
                                                                            <TableCell className="p-1 border-r text-center align-middle bg-slate-50 font-bold text-slate-700 text-xs py-2">-</TableCell>
                                                                        </TableRow>
                                                                    </React.Fragment>
                                                                );
                                                            });
                                                            return (
                                                                <React.Fragment key={customer}>
                                                                    {rows}
                                                                    <TableRow className="bg-slate-50/80 border-b-2 border-slate-200">
                                                                        <TableCell className="py-2 text-sm font-bold text-slate-700 text-center border-r sticky left-0 z-20 bg-slate-100 w-[120px] min-w-[120px]">&nbsp;</TableCell>
                                                                        <TableCell className="py-2 text-sm font-bold text-slate-700 text-center border-r sticky left-[120px] z-20 bg-slate-100 w-[120px] min-w-[120px]">Total</TableCell>
                                                                        <TableCell className="py-2 text-sm font-bold text-slate-700 text-center border-r sticky left-[240px] z-20 bg-slate-100 w-[120px] min-w-[120px]">&nbsp;</TableCell>
                                                                        {generators.map(wm => {
                                                                            const total = filteredData
                                                                                .filter(d => d.customer === customer && d.wm === wm)
                                                                                .reduce((acc, curr) => {
                                                                                    const c1 = Number(String(curr.c1).replace(/,/g, '')) || 0;
                                                                                    const c2 = Number(String(curr.c2).replace(/,/g, '')) || 0;
                                                                                    const c4 = Number(String(curr.c4).replace(/,/g, '')) || 0;
                                                                                    const c5 = Number(String(curr.c5).replace(/,/g, '')) || 0;
                                                                                    return acc + c1 + c2 + c4 + c5;
                                                                                }, 0);
                                                                            return <TableCell key={wm} colSpan={4} className="py-2 text-center font-bold text-indigo-700 text-xs border-r">{total}</TableCell>;
                                                                        })}
                                                                        <TableCell className="py-2 text-center font-bold text-indigo-700 text-xs border-r">
                                                                            {filteredData.filter(d => d.customer === customer).reduce((acc, curr) => {
                                                                                const c1 = Number(String(curr.c1).replace(/,/g, '')) || 0;
                                                                                const c2 = Number(String(curr.c2).replace(/,/g, '')) || 0;
                                                                                const c4 = Number(String(curr.c4).replace(/,/g, '')) || 0;
                                                                                const c5 = Number(String(curr.c5).replace(/,/g, '')) || 0;
                                                                                return acc + c1 + c2 + c4 + c5;
                                                                            }, 0)}
                                                                        </TableCell>
                                                                    </TableRow>
                                                                </React.Fragment>
                                                            );
                                                        })}
                                                    </React.Fragment>
                                                );
                                            })()}
                                        </TableBody>

                                    </Table>
                                </div>
                            </TabsContent>

                            <TabsContent value="allocation" className="mt-0">
                                <div className="space-y-6">
                                    {/* Windmill Allocation Table */}
                                    <div className="border border-slate-200 rounded-b-lg overflow-hidden mt-0 bg-white overflow-x-auto thin-scrollbar">
                                        <Table>
                                            <TableHeader className="bg-sidebar">
                                                <TableRow>
                                                    <TableHead className="py-2 h-10 font-semibold text-white whitespace-nowrap pl-3">Windmill No</TableHead>
                                                    <TableHead className="py-2 h-10 font-semibold text-white whitespace-nowrap">Customer</TableHead>
                                                    <TableHead className="py-2 h-10 font-semibold text-white whitespace-nowrap">Service Number</TableHead>
                                                    <TableHead className="py-2 h-10 font-semibold text-white text-right whitespace-nowrap">M.R.C</TableHead>
                                                    <TableHead className="py-2 h-10 font-semibold text-white text-right whitespace-nowrap">O.M.C</TableHead>
                                                    <TableHead className="py-2 h-10 font-semibold text-white text-right whitespace-nowrap">T.R.C</TableHead>
                                                    <TableHead className="py-2 h-10 font-semibold text-white text-right whitespace-nowrap">O.C</TableHead>
                                                    <TableHead className="py-2 h-10 font-semibold text-white text-right whitespace-nowrap">K.P</TableHead>
                                                    <TableHead className="py-2 h-10 font-semibold text-white text-right whitespace-nowrap">E.C</TableHead>
                                                    <TableHead className="py-2 h-10 font-semibold text-white text-right whitespace-nowrap">S.H.C</TableHead>
                                                    <TableHead className="py-2 h-10 font-semibold text-white text-right whitespace-nowrap">O.C</TableHead>
                                                    <TableHead className="py-2 h-10 font-semibold text-white text-right whitespace-nowrap">D.C</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {chargeAllocationRows.map((row, index) => (
                                                    <TableRow key={row.windmill} className="hover:bg-slate-50 border-b border-slate-100">
                                                        <TableCell className="py-2 text-sm text-slate-900 font-bold border-r pl-3 whitespace-nowrap">{row.windmill}</TableCell>
                                                        <TableCell className="py-2 p-1 border-r min-w-[160px]">
                                                            <Select value={row.customer} onValueChange={(val) => handleChargeCustomerChange(index, val)} disabled={!isEditing}>
                                                                <SelectTrigger className="h-8 text-sm bg-white border-slate-200">
                                                                    <SelectValue placeholder="Select Customer" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {customerList.map(c => (
                                                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </TableCell>
                                                        <TableCell className="py-2 p-1 border-r min-w-[150px]">
                                                            <Select value={row.seNumber} onValueChange={(val) => handleChargeSEChange(index, val)} disabled={!isEditing || !row.customer}>
                                                                <SelectTrigger className="h-8 text-sm bg-white border-slate-200">
                                                                    <SelectValue placeholder="Select Service No" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {(customerSEMap[row.customer] || []).map(se => (
                                                                        <SelectItem key={se} value={se}>{se}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </TableCell>
                                                        <TableCell className="py-2 p-1 border-r"><Input disabled={!isEditing} className="h-8 text-right text-sm border-slate-200 shadow-none focus-visible:ring-1 bg-white disabled:bg-slate-50 disabled:text-slate-500" value={row.mrc} onChange={(e) => handleChargeFieldChange(index, 'mrc', e.target.value)} /></TableCell>
                                                        <TableCell className="py-2 p-1 border-r"><Input disabled={!isEditing} className="h-8 text-right text-sm border-slate-200 shadow-none focus-visible:ring-1 bg-white disabled:bg-slate-50 disabled:text-slate-500" value={row.omc} onChange={(e) => handleChargeFieldChange(index, 'omc', e.target.value)} /></TableCell>
                                                        <TableCell className="py-2 p-1 border-r"><Input disabled={!isEditing} className="h-8 text-right text-sm border-slate-200 shadow-none focus-visible:ring-1 bg-white disabled:bg-slate-50 disabled:text-slate-500" value={row.trc} onChange={(e) => handleChargeFieldChange(index, 'trc', e.target.value)} /></TableCell>
                                                        <TableCell className="py-2 p-1 border-r"><Input disabled={!isEditing} className="h-8 text-right text-sm border-slate-200 shadow-none focus-visible:ring-1 bg-white disabled:bg-slate-50 disabled:text-slate-500" value={row.oc1} onChange={(e) => handleChargeFieldChange(index, 'oc1', e.target.value)} /></TableCell>
                                                        <TableCell className="py-2 p-1 border-r"><Input disabled={!isEditing} className="h-8 text-right text-sm border-slate-200 shadow-none focus-visible:ring-1 bg-white disabled:bg-slate-50 disabled:text-slate-500" value={row.kp} onChange={(e) => handleChargeFieldChange(index, 'kp', e.target.value)} /></TableCell>
                                                        <TableCell className="py-2 p-1 border-r"><Input disabled={!isEditing} className="h-8 text-right text-sm border-slate-200 shadow-none focus-visible:ring-1 bg-white disabled:bg-slate-50 disabled:text-slate-500" value={row.ec} onChange={(e) => handleChargeFieldChange(index, 'ec', e.target.value)} /></TableCell>
                                                        <TableCell className="py-2 p-1 border-r"><Input disabled={!isEditing} className="h-8 text-right text-sm border-slate-200 shadow-none focus-visible:ring-1 bg-white disabled:bg-slate-50 disabled:text-slate-500" value={row.shc} onChange={(e) => handleChargeFieldChange(index, 'shc', e.target.value)} /></TableCell>
                                                        <TableCell className="py-2 p-1 border-r"><Input disabled={!isEditing} className="h-8 text-right text-sm border-slate-200 shadow-none focus-visible:ring-1 bg-white disabled:bg-slate-50 disabled:text-slate-500" value={row.other} onChange={(e) => handleChargeFieldChange(index, 'other', e.target.value)} /></TableCell>
                                                        <TableCell className="py-2 p-1 border-r"><Input disabled={!isEditing} className="h-8 text-right text-sm border-slate-200 shadow-none focus-visible:ring-1 bg-white disabled:bg-slate-50 disabled:text-slate-500" value={row.dc} onChange={(e) => handleChargeFieldChange(index, 'dc', e.target.value)} /></TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* Solar Allocation Table */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 px-1">
                                            <h3 className="font-bold text-slate-700">SOLAR</h3>
                                        </div>
                                        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white overflow-x-auto thin-scrollbar">
                                            <Table>
                                                <TableHeader className="bg-sidebar">
                                                    <TableRow>
                                                        <TableHead className="py-2 h-10 w-10 pl-3"></TableHead>
                                                        <TableHead className="py-2 h-10 font-semibold text-white whitespace-nowrap">Customer</TableHead>
                                                        <TableHead className="py-2 h-10 font-semibold text-white whitespace-nowrap">Service Number</TableHead>
                                                        <TableHead className="py-2 h-10 font-semibold text-white text-right whitespace-nowrap">M.R.C</TableHead>
                                                        <TableHead className="py-2 h-10 font-semibold text-white text-right whitespace-nowrap">O.M.C</TableHead>
                                                        <TableHead className="py-2 h-10 font-semibold text-white text-right whitespace-nowrap">T.R.C</TableHead>
                                                        <TableHead className="py-2 h-10 font-semibold text-white text-right whitespace-nowrap">O.C</TableHead>
                                                        <TableHead className="py-2 h-10 font-semibold text-white text-right whitespace-nowrap">K.P</TableHead>
                                                        <TableHead className="py-2 h-10 font-semibold text-white text-right whitespace-nowrap">E.C</TableHead>
                                                        <TableHead className="py-2 h-10 font-semibold text-white text-right whitespace-nowrap">S.H.C</TableHead>
                                                        <TableHead className="py-2 h-10 font-semibold text-white text-right whitespace-nowrap">O.C</TableHead>
                                                        <TableHead className="py-2 h-10 font-semibold text-white text-right whitespace-nowrap">D.C</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {solarAllocationRows.map((row, index) => (
                                                        <TableRow key={`${row.customer}-${row.seNumber}`} className="hover:bg-slate-50 border-b border-slate-100">
                                                            <TableCell className="py-2 pl-3">
                                                                <input
                                                                    type="checkbox"
                                                                    className="accent-indigo-700 h-4 w-4 rounded border-slate-300"
                                                                    checked={row.isChecked}
                                                                    onChange={(e) => handleSolarCheckChange(index, e.target.checked)}
                                                                    disabled={!isEditing}
                                                                />
                                                            </TableCell>
                                                            <TableCell className="py-2 text-sm text-slate-700 font-medium border-r">{row.customer}</TableCell>
                                                            <TableCell className="py-2 text-sm text-slate-600 border-r">{row.seNumber}</TableCell>
                                                            <TableCell className="py-2 p-1 border-r"><Input disabled={!isEditing} className="h-8 text-right text-sm border-slate-200 shadow-none focus-visible:ring-1 bg-white disabled:bg-slate-50 disabled:text-slate-500" value={row.mrc} onChange={(e) => handleSolarFieldChange(index, 'mrc', e.target.value)} /></TableCell>
                                                            <TableCell className="py-2 p-1 border-r"><Input disabled={!isEditing} className="h-8 text-right text-sm border-slate-200 shadow-none focus-visible:ring-1 bg-white disabled:bg-slate-50 disabled:text-slate-500" value={row.omc} onChange={(e) => handleSolarFieldChange(index, 'omc', e.target.value)} /></TableCell>
                                                            <TableCell className="py-2 p-1 border-r"><Input disabled={!isEditing} className="h-8 text-right text-sm border-slate-200 shadow-none focus-visible:ring-1 bg-white disabled:bg-slate-50 disabled:text-slate-500" value={row.trc} onChange={(e) => handleSolarFieldChange(index, 'trc', e.target.value)} /></TableCell>
                                                            <TableCell className="py-2 p-1 border-r"><Input disabled={!isEditing} className="h-8 text-right text-sm border-slate-200 shadow-none focus-visible:ring-1 bg-white disabled:bg-slate-50 disabled:text-slate-500" value={row.oc1} onChange={(e) => handleSolarFieldChange(index, 'oc1', e.target.value)} /></TableCell>
                                                            <TableCell className="py-2 p-1 border-r"><Input disabled={!isEditing} className="h-8 text-right text-sm border-slate-200 shadow-none focus-visible:ring-1 bg-white disabled:bg-slate-50 disabled:text-slate-500" value={row.kp} onChange={(e) => handleSolarFieldChange(index, 'kp', e.target.value)} /></TableCell>
                                                            <TableCell className="py-2 p-1 border-r"><Input disabled={!isEditing} className="h-8 text-right text-sm border-slate-200 shadow-none focus-visible:ring-1 bg-white disabled:bg-slate-50 disabled:text-slate-500" value={row.ec} onChange={(e) => handleSolarFieldChange(index, 'ec', e.target.value)} /></TableCell>
                                                            <TableCell className="py-2 p-1 border-r"><Input disabled={!isEditing} className="h-8 text-right text-sm border-slate-200 shadow-none focus-visible:ring-1 bg-white disabled:bg-slate-50 disabled:text-slate-500" value={row.shc} onChange={(e) => handleSolarFieldChange(index, 'shc', e.target.value)} /></TableCell>
                                                            <TableCell className="py-2 p-1 border-r"><Input disabled={!isEditing} className="h-8 text-right text-sm border-slate-200 shadow-none focus-visible:ring-1 bg-white disabled:bg-slate-50 disabled:text-slate-500" value={row.other} onChange={(e) => handleSolarFieldChange(index, 'other', e.target.value)} /></TableCell>
                                                            <TableCell className="py-2 p-1 border-r"><Input disabled={!isEditing} className="h-8 text-right text-sm border-slate-200 shadow-none focus-visible:ring-1 bg-white disabled:bg-slate-50 disabled:text-slate-500" value={row.dc} onChange={(e) => handleSolarFieldChange(index, 'dc', e.target.value)} /></TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="uploads" className="mt-0">
                                <div className="border border-slate-200 rounded-b-lg overflow-hidden mt-0 bg-white">
                                    <Table>
                                        <TableHeader className="bg-sidebar">
                                            <TableRow>
                                                <TableHead className="h-10 font-semibold text-white whitespace-nowrap pl-4 w-16">#</TableHead>
                                                <TableHead className="h-10 font-semibold text-white whitespace-nowrap">Wind Mill Number</TableHead>
                                                <TableHead className="h-10 font-semibold text-white whitespace-nowrap w-1/3">Upload Files</TableHead>
                                                <TableHead className="h-10 font-semibold text-white whitespace-nowrap w-1/3">File Name</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {["WM-001", "WM-002", "WM-003", "WM-004", "WM-005", "WM-006", "WM-007", "WM-008", "SOLAR-001"].map((wm, index) => (
                                                <TableRow key={index} className="hover:bg-slate-50 border-b border-slate-100">
                                                    <TableCell className="py-3 text-sm text-slate-700 font-medium pl-4">{index + 1}</TableCell>
                                                    <TableCell className="py-3 text-sm text-slate-700 font-medium">{wm}</TableCell>
                                                    <TableCell className="py-3 text-sm text-slate-700">
                                                        <div className="flex items-center gap-2 max-w-sm">
                                                            <Input
                                                                type="file"
                                                                onChange={(e) => handleFileUpload(wm, e.target.files ? e.target.files[0] : null)}
                                                                className="bg-white border-slate-300 h-9 text-xs focus:ring-blue-500 file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                                                            />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-3 text-sm text-slate-600">
                                                        {uploads[wm]?.fileName ? (
                                                            <a
                                                                href={uploads[wm]?.file ? URL.createObjectURL(uploads[wm].file!) : "#"}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                                            >
                                                                {uploads[wm].fileName}
                                                            </a>
                                                        ) : (
                                                            <span className="text-slate-400 italic">No file selected</span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div >
            </div >
        </div >
    );
}
