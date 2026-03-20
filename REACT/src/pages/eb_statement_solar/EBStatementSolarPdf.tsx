import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BACKEND_API_URL } from "@/services/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, FileText, Info, Briefcase, Zap, Calculator, Loader2, Hash } from "lucide-react";

type SolarSlots = {
    C1?: string;
    C2?: string;
    C4?: string;
    C5?: string;
};

type SolarCharge = {
    name: string;
    amount: string;
};

type SolarStatementData = {
    company_name?: string;
    windmill_number?: string;
    slots?: SolarSlots;
    charges?: SolarCharge[];
};

export default function EBStatementSolarPdf() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [solarId, setSolarId] = useState<string>("");
    const [solarHeaderId, setSolarHeaderId] = useState<number | null>(null);
    const [solarFile, setSolarFile] = useState<string>("");
    const [data, setData] = useState<SolarStatementData | null>(null);

    useEffect(() => {
        const rawParsed = sessionStorage.getItem("ebStatementSolarData") || sessionStorage.getItem("ebStatementData");
        const savedSolarId = sessionStorage.getItem("ebStatementSolarId");
        const savedHeaderId = sessionStorage.getItem("ebStatementSolarHeaderId");

        if (savedSolarId) {
            setSolarId(savedSolarId);
        }

        let headerFromSession: number | null = null;
        if (savedHeaderId) {
            const headerInt = parseInt(savedHeaderId, 10);
            if (!Number.isNaN(headerInt)) {
                headerFromSession = headerInt;
                setSolarHeaderId(headerInt);
            }
        }

        if (rawParsed) {
            try {
                setData(JSON.parse(rawParsed));
            } catch (err) {
                setData(rawParsed as unknown as SolarStatementData);
            }
        }

        const savedSolarFile = sessionStorage.getItem("ebStatementSolarFile");
        if (savedSolarFile) {
            setSolarFile(savedSolarFile);
        }

        const resolveHeaderFromFile = async () => {
            if (!savedSolarFile) return;

            try {
                const res = await fetch(`${BACKEND_API_URL}/eb-solar/read-metadata?filename=${encodeURIComponent(savedSolarFile)}`);
                if (!res.ok) return;
                const json = await res.json();
                if (json && json.header_id) {
                    setSolarHeaderId(Number(json.header_id));
                    sessionStorage.setItem("ebStatementSolarHeaderId", String(json.header_id));
                }
                if (json && json.parsed) {
                    setData(json.parsed);
                    sessionStorage.setItem("ebStatementSolarData", JSON.stringify(json.parsed));
                }
            } catch (e) {
                console.warn("Failed to resolve solar header ID from metadata", e);
            }
        };

        resolveHeaderFromFile().finally(() => setLoading(false));
    }, [params]);

    const parseNumber = (value?: string | number): number => {
        if (typeof value === "number") return value;
        const normalized = String(value || "0").replace(/,/g, "");
        const parsed = parseFloat(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const totalNet = (): string => {
        const slots = data?.slots;
        if (!slots) return "0";
        const total = parseNumber(slots.C1) + parseNumber(slots.C2) + parseNumber(slots.C4) + parseNumber(slots.C5);
        return total.toLocaleString();
    };

    const totalCharges = (): string => {
        if (!data?.charges?.length) return "0.00";
        const total = data.charges.reduce((acc, c) => acc + parseNumber(c.amount), 0);
        return total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const handleSave = async () => {
        console.log("Solar save details:", { solarHeaderId, solarId, data });

        if (!data) {
            alert("No parsed data available. Cannot save.");
            return;
        }

        let resolvedHeaderId = solarHeaderId;
        if ((!resolvedHeaderId || resolvedHeaderId <= 0) && solarFile) {
            try {
                const res = await fetch(`${BACKEND_API_URL}/eb-solar/read-metadata?filename=${encodeURIComponent(solarFile)}`);
                if (res.ok) {
                    const json = await res.json();
                    if (json?.header_id) {
                        resolvedHeaderId = Number(json.header_id);
                        setSolarHeaderId(resolvedHeaderId);
                        sessionStorage.setItem("ebStatementSolarHeaderId", String(resolvedHeaderId));
                    }
                }
            } catch (e) {
                console.warn("Could not resolve solar header id before save", e);
            }
        }

        if (!solarId || Number.isNaN(Number(solarId))) {
            alert("No solar master ID available. Please re-open from upload page.");
            return;
        }

        // If header id is still missing, allow backend fallback using solar_id lookup.
        if (!resolvedHeaderId || resolvedHeaderId <= 0) {
            console.warn("Header id missing, allowing backend to resolve via solar_id");
        }

        setSaving(true);

        try {
            const payload = {
                eb_header_id: resolvedHeaderId && resolvedHeaderId > 0 ? resolvedHeaderId : undefined,
                company_name: data.company_name || "",
                solar_id: parseInt(solarId, 10),
                slots: data.slots || { C1: "0", C2: "0", C4: "0", C5: "0" },
                banking_slots: { C1: "0", C2: "0", C4: "0", C5: "0" },
                banking_units: 0,
                charges: data.charges ? data.charges.map((c) => ({ name: c.name, amount: parseNumber(c.amount), code: "" })) : [],
            };

            const res = await fetch(`${BACKEND_API_URL}/eb-solar/save-details`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(localStorage.getItem("access_token") ? { Authorization: `Bearer ${localStorage.getItem("access_token")}` } : {}),
                },
                body: JSON.stringify(payload),
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.detail || result.message || "Save failed");

            setSaved(true);
            toast.success("Solar EB statement saved to database successfully.");

            const returnMonth = sessionStorage.getItem("ebStatementSolarMonth") || String(new Date().getMonth() + 1);
            const returnYear = sessionStorage.getItem("ebStatementSolarYear") || String(new Date().getFullYear());

            const savedRow = {
                id: solarHeaderId || null,
                solar_id: Number(solarId) || null,
                solar_number: sessionStorage.getItem("ebStatementSolarNumber") || data.windmill_number || "",
                month: returnMonth,
                year: returnYear,
                pdf_file_path: solarFile || "",
                is_submitted: 0,
            };
            sessionStorage.setItem("ebStatementSolarLastSaved", JSON.stringify(savedRow));

            navigate(`/eb-statement-solar`);
        } catch (err: unknown) {
            console.error(err);
            const message = err && typeof err === "object" && "message" in err ? String((err as { message?: string }).message) : "Failed to save EB statement.";
            alert(message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-lg">Reading Statement...</span>
            </div>
        );
    }

    const isInvalidResponse = (resp: unknown): resp is { detail?: string; error?: string } => {
        if (typeof resp !== "object" || resp === null) return false;
        const r = resp as Record<string, unknown>;
        return typeof r.detail === "string" || typeof r.error === "string";
    };

    if (!data || isInvalidResponse(data)) {
        return (
            <div className="flex h-screen flex-col items-center justify-center space-y-4">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <h2 className="text-xl font-semibold">Statement data not found</h2>
                <p className="text-sm text-slate-500">No valid parsed statement data was found (detail/error entries are ignored).</p>
                <Button onClick={() => navigate("/eb-statement-solar")}>Go Back</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="mx-auto max-w-5xl space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button variant="ghost" onClick={() => navigate("/eb-statement-solar") }>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <h1 className="text-2xl font-bold text-slate-900">EB Statement - Solar</h1>
                    </div>
                    <div className="space-x-2">
                        <Button
                            onClick={handleSave}
                            disabled={saving || saved || loading}
                            className={saved ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}
                        >
                            {saving ? "Saving..." : saved ? "Saved" : "Save Statement"}
                        </Button>
                    </div>
                </div>

                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center space-x-2 bg-slate-100/50 pb-2">
                        <Info className="h-5 w-5 text-blue-600" />
                        <CardTitle className="text-lg">Header Information</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex justify-between border-b pb-2 md:border-b-0 md:border-r md:pr-4">
                                <span className="flex items-center text-sm font-medium text-slate-500">
                                    <Briefcase className="mr-2 h-4 w-4" /> Company Name
                                </span>
                                <span className="text-sm font-semibold">{data.company_name || "N/A"}</span>
                            </div>
                            <div className="flex justify-between pb-2 md:pb-0 md:pl-4">
                                <span className="flex items-center text-sm font-medium text-slate-500">
                                    <Hash className="mr-2 h-4 w-4" /> Solar Number
                                </span>
                                <span className="text-sm font-semibold font-mono text-blue-700">{data.windmill_number || "N/A"}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center space-x-2 bg-slate-100/50 pb-2">
                        <Zap className="h-5 w-5 text-green-600" />
                        <CardTitle className="text-lg">Slot Wise Net Generation</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead className="font-bold text-center">C1</TableHead>
                                    <TableHead className="font-bold text-center">C2</TableHead>
                                    <TableHead className="font-bold text-center">C4</TableHead>
                                    <TableHead className="font-bold text-center">C5</TableHead>
                                    <TableHead className="font-bold text-right pr-4">Total Net</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow className="hover:bg-slate-50/50">
                                    <TableCell className="text-center font-medium">{data.slots?.C1 || "0"}</TableCell>
                                    <TableCell className="text-center font-medium">{data.slots?.C2 || "0"}</TableCell>
                                    <TableCell className="text-center font-medium">{data.slots?.C4 || "0"}</TableCell>
                                    <TableCell className="text-center font-medium">{data.slots?.C5 || "0"}</TableCell>
                                    <TableCell className="text-right pr-4 font-bold text-green-700">{totalNet()}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center space-x-2 bg-slate-100/50 pb-2">
                        <Calculator className="h-5 w-5 text-red-600" />
                        <CardTitle className="text-lg">Applicable Charges</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead className="pl-6">Charge Description</TableHead>
                                    <TableHead className="text-right pr-6">Amount (₹)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.charges && data.charges.length > 0 ? (
                                    data.charges.map((charge, idx) => (
                                        <TableRow key={idx} className="hover:bg-slate-50/50 border-b">
                                            <TableCell className="pl-6 font-medium text-slate-700">{charge.name}</TableCell>
                                            <TableCell className="text-right pr-6 font-semibold text-red-600 tabular-nums">
                                                {parseNumber(charge.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center py-8 text-slate-400 italic">
                                            No explicit charges found in the statement summary.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {data.charges && data.charges.length > 0 && (
                                    <TableRow className="bg-slate-50 font-bold border-t-2">
                                        <TableCell className="pl-6">Total Charges</TableCell>
                                        <TableCell className="text-right pr-6 text-lg text-red-700">
                                            ₹ {totalCharges()}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
