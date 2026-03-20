import React, { useState, useEffect } from "react";
import { Search, Edit, Trash2, Upload, FileText, Scale } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api, { BACKEND_UPLOAD_URL, BACKEND_API_URL } from "@/services/api";
import { useSearchParams } from "react-router-dom";
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

export default function EBStatementSolarList() {
    const initialYear = "all";
    const initialMonth = "all";
    const initialSolarNumber = "all";

    const [selectedYear, setSelectedYear] = useState<string>(initialYear);
    const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth);
    const [selectedSolarNumber, setSelectedSolarNumber] = useState<string>(initialSolarNumber);
    const [solarNumberOptions, setSolarNumberOptions] = useState<Array<{id: number; solar_number: string}>>([]);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const normalizeMonth = (monthValue: string | undefined): string => {
        if (!monthValue) return "";
        const normalized = monthValue.trim();
        if (normalized === "") return "";

        const monthIndex = Number(normalized);
        if (!Number.isNaN(monthIndex) && monthIndex >= 1 && monthIndex <= 12) {
            return monthIndex.toString();
        }

        const monthNames = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
        ];

        const normalizedLower = normalized.toLowerCase();
        const foundName = monthNames.find((m) => m.toLowerCase() === normalizedLower);
        return foundName ? String(monthNames.indexOf(foundName) + 1) : normalized;
    };

    const filterRowsByMonthYear = (items: Array<Record<string, unknown>>) => {
        const monthTarget = (selectedMonth && selectedMonth !== "all") ? normalizeMonth(selectedMonth) : "";
        const yearTarget = (selectedYear && selectedYear !== "all") ? String(selectedYear).trim() : "";

        return items.filter((row) => {
            const rowMonthValue = row.month;
            const rowYearValue = row.year;
            if (monthTarget && !rowMonthValue) return false;
            if (yearTarget && (rowYearValue === undefined || rowYearValue === null)) return false;

            const monthMatch = monthTarget
                ? normalizeMonth(String(rowMonthValue)) === monthTarget
                : true;
            const yearMatch = yearTarget
                ? (rowYearValue === undefined || rowYearValue === null ? true : String(rowYearValue) === yearTarget)
                : true;

            return monthMatch && yearMatch;
        });
    };

    const fetchSolarStatements = async () => {
        setLoading(true);
        try {
            const res = await api.get("/eb-solar/search", {
                params: {
                    solar_number: selectedSolarNumber && selectedSolarNumber !== "all" ? selectedSolarNumber : undefined,
                    year: selectedYear && selectedYear !== "all" ? selectedYear : undefined,
                    month: selectedMonth && selectedMonth !== "all" ? selectedMonth : undefined,
                },
            });

            if (res.status === 200 && Array.isArray(res.data?.items)) {
                let apiRows = res.data.items;

                // If search returns empty (e.g., year filter against created_at), fallback to all rows and apply month/year filtering locally.
                if (apiRows.length === 0) {
                    try {
                        const fallback = await api.get("/eb-solar/all");
                        if (fallback.status === 200 && Array.isArray(fallback.data?.items)) {
                            apiRows = filterRowsByMonthYear(fallback.data.items);
                        }
                    } catch (fallbackErr) {
                        console.warn("Fallback fetch failed for eb-solar/all", fallbackErr);
                    }
                }

                // Include last-saved row if API does not already contain it.
                const lastSaved = sessionStorage.getItem("ebStatementSolarLastSaved");
                if (lastSaved) {
                    try {
                        const lastSavedRow = JSON.parse(lastSaved);
                        if (lastSavedRow && lastSavedRow.solar_id) {
                            const duplicate = apiRows.some((r: any) => {
                                return (
                                    (r.id !== undefined && lastSavedRow.id !== undefined && r.id === lastSavedRow.id) ||
                                    (r.pdf_file_path && lastSavedRow.pdf_file_path && r.pdf_file_path === lastSavedRow.pdf_file_path) ||
                                    (r.solar_id == lastSavedRow.solar_id && r.month == lastSavedRow.month && r.year == lastSavedRow.year)
                                );
                            });
                            if (!duplicate) {
                                apiRows = [lastSavedRow, ...apiRows];
                            }
                            sessionStorage.removeItem("ebStatementSolarLastSaved");
                        }
                    } catch (parseErr) {
                        console.warn("Could not parse ebStatementSolarLastSaved", parseErr);
                    }
                }

                setRows(apiRows);
                return;
            }

            // If no rows, check last-saved row from session and include it if present.
            const lastSaved = sessionStorage.getItem("ebStatementSolarLastSaved");
            if (lastSaved) {
                try {
                    const lastSavedRow = JSON.parse(lastSaved);
                    if (lastSavedRow && lastSavedRow.solar_id) {
                        setRows([lastSavedRow]);
                        sessionStorage.removeItem("ebStatementSolarLastSaved");
                        return;
                    }
                } catch (parseErr) {
                    console.warn("Could not parse ebStatementSolarLastSaved", parseErr);
                }
            }

            // Fallback to all rows when search returns none (or year isn't stored in table)
            const fallback = await api.get("/eb-solar/all");
            if (fallback.status === 200 && Array.isArray(fallback.data?.items)) {
                setRows(filterRowsByMonthYear(fallback.data.items));
            } else {
                setRows([]);
            }
        } catch (error) {
            console.error("Failed to load solar EB statements", error);
            try {
                const fallback = await api.get("/eb-solar/all");
                if (fallback.status === 200 && Array.isArray(fallback.data?.items)) {
                    setRows(filterRowsByMonthYear(fallback.data.items));
                } else {
                    setRows([]);
                }
            } catch (fallbackError) {
                console.error("Fallback fetch failed for eb-solar/all", fallbackError);
                setRows([]);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Force defaults on page load/refresh.
        setSelectedYear("all");
        setSelectedMonth("all");
        setSelectedSolarNumber("all");

        fetchSolarStatements();

        const loadSolarNumberOptions = async () => {
            try {
                const res = await api.get("/eb-solar/windmills");
                if (res.status === 200 && res.data?.status === "success" && Array.isArray(res.data.data)) {
                    setSolarNumberOptions(res.data.data);
                }
            } catch (error) {
                console.warn("Failed to load solar numbers", error);
            }
        };

        loadSolarNumberOptions();
    }, []);

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
                    <div className="flex items-center justify-between pb-1">
                        <h1 className="text-xl font-bold text-slate-800">EB Statement-Solar - List</h1>
                    </div>

                    <div className="space-y-1">
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap gap-2 items-center">
                            <span className="text-sm font-semibold text-slate-600 mr-2">Search</span>
                            <Select value={selectedSolarNumber} onValueChange={setSelectedSolarNumber}>
                                <SelectTrigger className="w-[200px] h-9 bg-white border-slate-300 text-sm">
                                    <SelectValue placeholder="Solar Number" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Solar Numbers</SelectItem>
                                    {solarNumberOptions.map((item) => (
                                        <SelectItem key={item.id} value={String(item.solar_number)}>
                                            {item.solar_number}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger className="w-[140px] h-9 bg-white border-slate-300 text-sm">
                                    <SelectValue placeholder="Year" />
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

                            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                <SelectTrigger className="w-[140px] h-9 bg-white border-slate-300 text-sm">
                                    <SelectValue placeholder="Month" />
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

                            <Button size="sm" className="h-9 text-sm bg-primary hover:bg-primary/90 text-primary-foreground px-4" onClick={fetchSolarStatements}>
                                Search
                            </Button>
                            <Button size="sm" className="h-9 text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-4" onClick={() => navigate("/eb-statement-solar/add")}>
                                + New
                            </Button>

                            <Button size="sm" className="h-9 text-sm bg-red-600 hover:bg-red-700 text-white px-4">
                                Cancel
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center bg-primary/5 p-2 rounded-t-lg border-b border-primary/10 h-10">
                            <h2 className="text-sm font-semibold text-primary pl-2">Solar EB Statement List</h2>

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
                                        <TableHead className="font-semibold text-white h-10 whitespace-nowrap">Solar Number</TableHead>
                                        <TableHead className="font-semibold text-white h-10 whitespace-nowrap text-center">PDF</TableHead>
                                        <TableHead className="font-semibold text-white h-10 whitespace-nowrap text-center">Comparison Charges</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rows.map((row) => (
                                        <TableRow key={row.id} className="hover:bg-slate-50">
                                            <TableCell className="py-2 text-sm">{row.month || row.year || "-"}</TableCell>
                                            <TableCell className="py-2 text-sm">{row.solar_number || row.solar_id || "-"}</TableCell>
                                            <TableCell className="py-2 text-center">
                                                {(() => {
                                                    const pdfPath = row.pdf_file_path || row.pdf || "";
                                                    const filename = pdfPath ? pdfPath.split("/").pop() : "Not available";

                                                    const openPdfViewer = async () => {
                                                        if (!pdfPath) {
                                                            alert("PDF file not available for this record.");
                                                            return;
                                                        }

                                                        // store context for PDF page
                                                        sessionStorage.setItem("ebStatementSolarFile", pdfPath);
                                                        if (row.id != null) sessionStorage.setItem("ebStatementSolarHeaderId", String(row.id));
                                                        if (row.solar_id != null) sessionStorage.setItem("ebStatementSolarId", String(row.solar_id));
                                                        if (row.solar_number != null) sessionStorage.setItem("ebStatementSolarNumber", String(row.solar_number));
                                                        if (row.month != null) sessionStorage.setItem("ebStatementSolarMonth", String(row.month));
                                                        if (row.year != null) sessionStorage.setItem("ebStatementSolarYear", String(row.year));

                                                        try {
                                                            const res = await fetch(`${BACKEND_API_URL}/eb-solar/read-metadata?filename=${encodeURIComponent(pdfPath)}`);
                                                            if (res.ok) {
                                                                const json = await res.json();
                                                                if (json && json.parsed) {
                                                                    sessionStorage.setItem("ebStatementSolarData", JSON.stringify(json.parsed));
                                                                }
                                                            }
                                                        } catch (err) {
                                                            console.warn("Failed to load parsed statement data", err);
                                                        }

                                                        navigate("/eb-statement-solar/pdf");
                                                    };

                                                    return (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                            title={filename}
                                                            onClick={openPdfViewer}
                                                        >
                                                            <FileText className="h-4 w-4" />
                                                        </Button>
                                                    );
                                                })()}
                                            </TableCell>
                                            <TableCell className="py-2 text-center">
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-500 hover:text-blue-700 hover:bg-blue-50">
                                                    <Scale className="h-4 w-4" />
                                                </Button>
                                            </TableCell>

                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
