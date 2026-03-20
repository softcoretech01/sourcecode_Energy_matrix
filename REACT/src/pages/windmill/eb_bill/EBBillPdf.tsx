import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileDiff } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function EBBillPdf() {
    const navigate = useNavigate();
    const [ebData, setEbData] = useState<any>(null);

    const oaRows = ebData?.matched_rows || [];
    const columns = ebData?.columns || [];

    useEffect(() => {
        const stored = sessionStorage.getItem("ebData");
        if (stored) setEbData(JSON.parse(stored));
    }, []);

    return (
        <div className="min-h-screen bg-gray-100 p-8">

            {/* Header buttons */}
            <div className="mb-4 flex justify-between items-center max-w-[210mm] mx-auto">
                <Button variant="outline" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4" /> Back
                </Button>

                <Button>
                    <FileDiff className="h-4 w-4" /> Comparison
                </Button>
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
                        <div><strong>Self Generation Tax:</strong> ₹ {ebData.self_generation_tax || "0"}</div>
                    </div>
                )}

                {/* Table wrapper for horizontal scroll */}
                <div className="overflow-x-auto">

                    <table className="min-w-full text-xs border-collapse border border-gray-300">

                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border p-2">Windmill</th>
                                {columns.map((col: string, i: number) => (
                                    <th key={i} className="border p-2">
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {oaRows.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={columns.length + 1}
                                        className="text-center p-4"
                                    >
                                        No windmill charges found
                                    </td>
                                </tr>
                            ) : (
                                oaRows.map((row: any, idx: number) => (
                                    <tr key={idx}>
                                        <td className="border p-2">{row.windmill}</td>

                                        {columns.map((_, i: number) => (
                                            <td key={i} className="border p-2">
                                                {row.charges?.[i] ?? "0.00"}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>

                    </table>

                </div>

            </div>
        </div>
    );
}