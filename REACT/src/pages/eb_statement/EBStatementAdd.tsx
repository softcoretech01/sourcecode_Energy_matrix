import React, { useEffect, useState } from "react";
import { ArrowLeft, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { toast } from "sonner";

interface Windmill {
    id: number;
    windmill_number: string;
}

export default function EBStatementAdd() {
    const navigate = useNavigate();

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedWindmillId, setSelectedWindmillId] = useState<string>("");
    const [selectedMonth, setSelectedMonth] = useState("");
    const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
    const [windmills, setWindmills] = useState<Windmill[]>([]);
    const [uploading, setUploading] = useState(false);

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    const months = [
        { value: "January", label: "January" },
        { value: "February", label: "February" },
        { value: "March", label: "March" },
        { value: "April", label: "April" },
        { value: "May", label: "May" },
        { value: "June", label: "June" },
        { value: "July", label: "July" },
        { value: "August", label: "August" },
        { value: "September", label: "September" },
        { value: "October", label: "October" },
        { value: "November", label: "November" },
        { value: "December", label: "December" },
    ];

    useEffect(() => {
        fetchWindmills();
    }, []);

    const fetchWindmills = async () => {
        try {
            const response = await api.get("/eb/windmills");
            if (response.data.status === "success") {
                setWindmills(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching windmills:", error);
            toast.error("Failed to fetch windmills");
        }
    };

    // handle file select
    const handlePdfUpload = (file: File) => {
        if (file.type !== "application/pdf") {
            toast.error("Only PDF files allowed");
            return;
        }
        setSelectedFile(file);
    };

    // drag drop
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) handlePdfUpload(file);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    // ✅ Upload + open viewer
    const handleUploadAndRead = async () => {
        if (!selectedFile) {
            toast.error("Upload PDF first");
            return;
        }

        if (!selectedWindmillId) {
            toast.error("Select windmill");
            return;
        }

        if (!selectedMonth) {
            toast.error("Select month");
            return;
        }

        if (!selectedYear) {
            toast.error("Select year");
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("windmill_id", selectedWindmillId);
        formData.append("year", selectedYear);
        formData.append("month", selectedMonth);

        try {
            const res = await api.post("/eb/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            if (res.data.filename) {
                toast.success("EB Statement uploaded successfully");
                // Open in a new tab
                window.open(`/eb-statement/pdf?file=${res.data.filename}`, "_blank");
            } else {
                toast.error(res.data.message || "Upload failed");
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.detail || "Upload failed. Check backend.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-2 bg-slate-50 min-h-screen font-sans">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">

                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h1 className="text-lg font-semibold text-indigo-700">
                        EB Statements - Upload
                    </h1>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-4"
                            onClick={handleUploadAndRead}
                            disabled={uploading}
                        >
                            {uploading ? "Uploading..." : "Upload & Read"}
                        </Button>

                        <Button
                            size="sm"
                            variant="outline"
                            className="text-slate-600 border-slate-300 bg-white hover:bg-slate-50 h-8 w-8 p-0"
                            onClick={() => navigate("/eb-statement")}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="p-4">
                    <div className="space-y-4 px-4 pt-2">

                        {/* Windmill + Year + Month */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-600">
                                    Windmill Number
                                </label>
                                <Select onValueChange={setSelectedWindmillId}>
                                    <SelectTrigger className="w-full border-slate-300 h-9">
                                        <SelectValue placeholder="Select Windmill" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {windmills.map((wm) => (
                                            <SelectItem key={wm.id} value={wm.id.toString()}>
                                                {wm.windmill_number}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-600">
                                    Year
                                </label>
                                <Select value={selectedYear} onValueChange={setSelectedYear}>
                                    <SelectTrigger className="w-full border-slate-300 h-9">
                                        <SelectValue placeholder="Select Year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {years.map((y) => (
                                            <SelectItem key={y} value={y.toString()}>
                                                {y}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-600">
                                    Month
                                </label>
                                <Select onValueChange={setSelectedMonth}>
                                    <SelectTrigger className="w-full border-slate-300 h-9">
                                        <SelectValue placeholder="Select Month" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {months.map((m) => (
                                            <SelectItem key={m.value} value={m.value}>
                                                {m.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Upload Area */}
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                            <UploadCloud className="h-12 w-12 text-blue-400 mx-auto mb-2" />

                            <p className="text-sm font-medium text-slate-700">
                                Drop PDF file here or{" "}
                                <label className="text-blue-600 underline cursor-pointer">
                                    click to upload
                                    <input
                                        type="file"
                                        accept="application/pdf"
                                        className="hidden"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                                handlePdfUpload(e.target.files[0]);
                                            }
                                        }}
                                    />
                                </label>
                            </p>

                            <p className="text-xs text-slate-500 mt-1">
                                (Only PDF files, max 10 MB)
                            </p>

                            {selectedFile && (
                                <p className="text-green-600 text-sm mt-3">
                                    Selected: {selectedFile.name}
                                </p>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}