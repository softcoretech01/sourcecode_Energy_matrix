import React, { useState, useRef } from "react";
import { ArrowLeft, Calendar as CalendarIcon, UploadCloud } from "lucide-react";
import { format } from "date-fns";
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
} from "@/components/ui/table";
import { useNavigate } from "react-router-dom";

export default function EBBillAdd() {
    const navigate = useNavigate();

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);   // ✅ added loading state
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== "application/pdf") {
            alert("Only PDF files allowed");
            return;
        }

        setSelectedFile(file);
    };

    // ✅ Updated function with correct URL + loading state
    const handleReadPdf = async () => {
        if (!selectedFile) {
            alert("Please select PDF first");
            return;
        }

        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            setLoading(true);

            const res = await fetch(
                `${BACKEND_API_URL}/eb-bill/read-pdf`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (!res.ok) throw new Error("Upload failed");

            const data = await res.json();

            // avoid storing the full extracted PDF text in sessionStorage
            const storeData: any = { ...data };
            if (storeData.parsed && storeData.parsed.full_text) {
                delete storeData.parsed.full_text;
                if (Object.keys(storeData.parsed).length === 0) {
                    delete storeData.parsed;
                }
            }

            sessionStorage.setItem("ebData", JSON.stringify(storeData));
                // store a local blob URL so the PDF can be embedded in the PDF view
                try {
                    const pdfUrl = URL.createObjectURL(selectedFile as Blob);
                    sessionStorage.setItem("ebPdfUrl", pdfUrl);
                } catch (err) {
                    console.warn("failed to create object URL for PDF", err);
                }

            navigate("/windmill/eb-bill/pdf");

        } catch (err) {
            console.error(err);
            alert("Failed to read PDF");
        } finally {
            setLoading(false);
        }
    };

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

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    return (
        <div className="p-2 bg-slate-50 min-h-screen font-sans">
            <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h1 className="text-lg font-semibold text-indigo-700">
                        EB Bill - Upload
                    </h1>
                    <div className="flex gap-2">
                        <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white h-8 px-4">
                            Save
                        </Button>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-4">
                            Post
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-slate-600 border-slate-300 bg-white hover:bg-slate-50 h-8 w-8 p-0"
                            onClick={() => navigate("/windmill/eb-bill")}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="p-4">
                    <div className="space-y-4 px-4 pt-2">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-600">Customers</label>
                                <Select>
                                    <SelectTrigger className="w-full border-slate-300 h-9">
                                        <SelectValue placeholder="Select Customer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cust-001">L&T</SelectItem>
                                        <SelectItem value="cust-002">Texmo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-600">SE Number</label>
                                <Select>
                                    <SelectTrigger className="w-full border-slate-300 h-9">
                                        <SelectValue placeholder="Select SE Number" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="se-001">SE-1001</SelectItem>
                                        <SelectItem value="se-002">SE-1002</SelectItem>
                                        <SelectItem value="se-003">SE-2001</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-600">Year</label>
                                <Select defaultValue={currentYear.toString()}>
                                    <SelectTrigger className="w-full border-slate-300 h-9">
                                        <SelectValue placeholder="Select Year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {years.map((year) => (
                                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-600">Month</label>
                                <Select>
                                    <SelectTrigger className="w-full border-slate-300 h-9">
                                        <SelectValue placeholder="Select Month" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {months.map((m) => (
                                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div
                            onClick={handleUploadClick}
                            className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                            <UploadCloud className="h-12 w-12 text-blue-400 mx-auto mb-2" />
                            <p className="text-sm font-medium text-slate-700">
                                Drop PDF file here or <span className="text-blue-600">click to upload</span>
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                (Only PDF files, max 10 MB)
                            </p>

                            {selectedFile && (
                                <p className="mt-3 text-green-600 text-sm font-medium">
                                    Selected: {selectedFile.name}
                                </p>
                            )}
                        </div>

                        <input
                            type="file"
                            accept="application/pdf"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            style={{ display: "none" }}
                        />

                        <div className="flex justify-center">
                            <Button
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={handleReadPdf}
                                disabled={loading}   // ✅ disabled when loading
                            >
                                {loading ? "Reading PDF..." : "Upload and Read PDF"}
                            </Button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}