import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileDiff, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";

export default function EBBillPdf() {
    const navigate = useNavigate();
    const [ebData, setEbData] = useState<any>(null);

    const oaRows = ebData?.matched_rows || [];
    const columns = ebData?.columns || [];

    useEffect(() => {
        const stored = sessionStorage.getItem("ebData");
        if (!stored) {
            console.warn("No ebData in sessionStorage, redirecting...");
            navigate("/windmill/eb-bill/add", { replace: true });
            return;
        }
        try {
            const parsed = JSON.parse(stored);
            setEbData(parsed);
        } catch (e) {
            console.error("Failed to parse ebData:", e);
            navigate("/windmill/eb-bill/add", { replace: true });
        }
    }, [navigate]);

    const handleSave = async () => {
        if (!ebData || !ebData.header_id) {
            alert("Record header missing, cannot save.");
            return;
        }

        try {
            const payload = {
                header_id: ebData.header_id,
                customer_id: ebData.customer_id,
                service_number_id: ebData.service_number_id,
                self_generation_tax: ebData.self_generation_tax,
                columns: ebData.columns,
                matched_rows: ebData.matched_rows
            };

            const res = await api.post("/eb-bill/save-all", payload);
            if (res.status === 200) {
                alert("EB Bill details saved successfully!");
                navigate("/windmill/eb-bill");
            } else {
                alert(`Failed to save: ${res.data?.detail || "Unknown error"}`);
            }
        } catch (err: any) {
            console.error("Save failed", err);
            alert(`Error saving details: ${err?.message || "Check console"}`);
        }
    };

    // Show error state if no data
    if (!ebData || !ebData.matched_rows) {
        return (
            <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
                    <p className="text-gray-600 mb-4 text-lg">No PDF data available</p>
                    <p className="text-gray-500 mb-6">Please go back and upload a PDF first.</p>
                    <Button onClick={() => navigate("/windmill/eb-bill/add")}>Go to Upload</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">

            {/* Header buttons */}
            <div className="flex items-center justify-between mb-4">
                <Button variant="outline" onClick={() => navigate(-1)} className="bg-white">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>

                <div className="flex gap-2">
                    {!ebData.isViewMode && (
                        <>
                            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
                                <Save className="h-4 w-4 mr-2" /> Save
                            </Button>

                            <Button>
                                <FileDiff className="h-4 w-4 mr-2" /> Comparison
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Main Card */}
            <div className="bg-white mx-auto p-8 shadow-lg max-w-[210mm]">

                <h1 className="text-center font-bold text-xl mb-6">
                    Energy Allotment Order Charges
                </h1>

                {/* Customer Details */}
                {ebData && (
                    <div className="mb-6 text-sm border border-gray-300 p-3">
                        <div><strong>Customer:</strong> {ebData.customer_name || "-"}</div>
                        <div><strong>Service No:</strong> {ebData.service_number || "-"}</div>
                        <div><strong>Year:</strong> {ebData.bill_year || "-"}</div>
                        <div><strong>Month:</strong> {ebData.bill_month_name || "-"}</div>
                        <div><strong>Self Generation Tax:</strong> ₹ {ebData.self_generation_tax || "0"}</div>
                    </div>
                )}

                {/* Applicable Charges Section */}
                <div className="mb-8">
                    <h2 className="flex items-center text-lg font-semibold text-gray-800 mb-4">
                        <span className="text-red-600 mr-2">📋</span> Abstract for OA Adjustment Charges
                    </h2>

                    {oaRows.length === 0 ? (
                        <div className="text-center p-8 text-gray-500">
                            No windmill charges found
                        </div>
                    ) : (
                        <div className="overflow-x-auto border border-gray-300 rounded-lg">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-100 border-b border-gray-300">
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700 border-r border-gray-300">Windmill</th>
                                        {/* Skip columns[0] ('CHARGES') — the windmill col is already rendered above */}
                                        {columns.slice(1).map((col: string, i: number) => (
                                            <th key={i} className="px-4 py-3 text-right font-semibold text-gray-700 border-r border-gray-300 text-center text-xs">
                                                {col}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {oaRows.map((row: any, rowIdx: number) => (
                                        <tr key={rowIdx} className="border-b border-gray-200 hover:bg-gray-50">
                                            <td className="px-4 py-2.5 text-gray-900 font-semibold border-r border-gray-200">{row.windmill}</td>
                                            {/* charges[0]=C001, charges[1]=C002 ... charges[9]=WHLC — aligned with columns.slice(1) */}
                                            {columns.slice(1).map((_: string, colIdx: number) => (
                                                <td key={colIdx} className="px-4 py-2.5 text-right text-gray-900 border-r border-gray-200">
                                                    {Number(row.charges?.[colIdx] ?? "0").toFixed(2)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                    {/* Total row */}
                                    <tr className="bg-blue-50 border-t-2 border-gray-400 font-semibold">
                                        <td className="px-4 py-3 text-gray-800 border-r border-gray-300">Total</td>
                                        {columns.slice(1).map((_: string, colIdx: number) => (
                                            <td key={colIdx} className="px-4 py-3 text-right text-blue-900 border-r border-gray-300">
                                                {oaRows.reduce((sum: number, r: any) => {
                                                    return sum + (parseFloat(r.charges?.[colIdx] ?? "0") || 0);
                                                }, 0).toFixed(2)}
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}