import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Calendar as CalendarIcon, UploadCloud, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import api, { BACKEND_API_URL } from "@/services/api";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
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
    const [customers, setCustomers] = useState<Array<{ id: number; customer_name: string }>>([]);
    const [serviceNumbers, setServiceNumbers] = useState<Array<{ id: number; service_number: string }>>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
    const [selectedServiceNumberId, setSelectedServiceNumberId] = useState<string>("");
    const [customerLoading, setCustomerLoading] = useState<boolean>(true);
    const [serviceLoading, setServiceLoading] = useState<boolean>(false);
    const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
    const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString());
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const { toast } = useToast();

    const showError = (msg: string) => {
        toast({
            variant: "destructive",
            title: "Validation Error",
            description: msg,
            duration: 5000,
        });
    };

    useEffect(() => {
        const loadCustomers = async () => {
            try {
                setCustomerLoading(true);
                const res = await api.get("/eb-bill/customers", { timeout: 30000 });
                console.debug("EBBillAdd customers response:", res);
                if (res.status !== 200) throw new Error(res.data?.detail || `HTTP ${res.status}`);

                let data = Array.isArray(res.data.data) ? res.data.data : [];

                if (data.length === 0) {
                    // database is empty; try seeding default data in backend and refetch
                    try {
                        const seedRes = await api.post("/eb-bill/seed", null, { timeout: 30000 });
                        if (seedRes.status === 200 && seedRes.data?.status === "success") {
                            // re-fetch after seed
                            const res2 = await api.get("/eb-bill/customers", { timeout: 30000 });
                            data = Array.isArray(res2.data.data) ? res2.data.data : [];
                        }
                    } catch (seedErr: any) {
                        // /seed may be unavailable in some environments; continue with no customers
                        if (seedErr?.response?.status === 404) {
                            console.warn("Seed endpoint not available, skipping seed", seedErr);
                        } else {
                            console.error("Seed customers failed", seedErr);
                        }
                    }
                }

                setCustomers(data);

                if (data.length > 0) {
                    setSelectedCustomerId(String(data[0].id));
                } else {
                    setSelectedCustomerId("");
                }
            } catch (err) {
                console.error("Failed to load customers", err);
                setCustomers([]);
                setSelectedCustomerId("");
            } finally {
                setCustomerLoading(false);
            }
        };

        loadCustomers();
    }, []);

    useEffect(() => {
        if (!selectedCustomerId) {
            setServiceNumbers([]);
            setSelectedServiceNumberId("");
            return;
        }

        const loadServiceNumbers = async () => {
            try {
                setServiceLoading(true);
                const res = await api.get(`/eb-bill/service-numbers/${selectedCustomerId}`, { timeout: 30000 });
                console.debug("EBBillAdd service numbers response:", res);
                if (res.status !== 200) throw new Error(res.data?.detail || `HTTP ${res.status}`);

                const data = Array.isArray(res.data.data) ? res.data.data : [];
                setServiceNumbers(data);

                if (data.length > 0) {
                    setSelectedServiceNumberId(String(data[0].id));
                } else {
                    setSelectedServiceNumberId("");
                }
            } catch (err) {
                console.error("Failed to load service numbers", err);
                setServiceNumbers([]);
                setSelectedServiceNumberId("");
            } finally {
                setServiceLoading(false);
            }
        };

        loadServiceNumbers();
    }, [selectedCustomerId]);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== "application/pdf") {
            showError("Only PDF files allowed");
            return;
        }

        setSelectedFile(file);
    };

    const handleReadPdf = async () => {
        if (!selectedFile) {
            showError("Please select PDF first");
            return;
        }

        if (!selectedCustomerId) {
            showError("Please select a valid customer");
            return;
        }

        if (!selectedServiceNumberId) {
            showError("Please select a valid SE number");
            return;
        }

        if (!selectedYear) {
            showError("Please select a year");
            return;
        }

        if (!selectedMonth) {
            showError("Please select a month");
            return;
        }

        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("customer_id", selectedCustomerId);
        formData.append("service_number_id", selectedServiceNumberId);
        formData.append("year", selectedYear);
        formData.append("month", selectedMonth);

        try {
            setLoading(true);

            const res = await api.post("/eb-bill/read-pdf", formData, {
                timeout: 300000,
            });

            if (res.status !== 200) {
                const message = res.data?.detail || res.data?.message || "Upload failed";
                showError(`Failed to read PDF: ${message}`);
                return;
            }

            const data = res.data;

            // Resolve the display labels from the selected dropdown IDs
            const selectedCustomer = customers.find(c => String(c.id) === selectedCustomerId);
            const selectedServiceNumber = serviceNumbers.find(s => String(s.id) === selectedServiceNumberId);
            const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

            const storeData = {
                ...JSON.parse(JSON.stringify(data)),
                // Override with dropdown selections — these are authoritative
                customer_id: selectedCustomerId,
                service_number_id: selectedServiceNumberId,
                customer_name: selectedCustomer?.customer_name ?? data.customer_name ?? "",
                service_number: selectedServiceNumber?.service_number ?? data.service_number ?? "",
                bill_year: selectedYear,
                bill_month: selectedMonth,
                bill_month_name: monthNames[parseInt(selectedMonth) - 1] ?? "",
            };

            sessionStorage.setItem("ebData", JSON.stringify(storeData));


            try {
                const pdfUrl = URL.createObjectURL(selectedFile as Blob);
                sessionStorage.setItem("ebPdfUrl", pdfUrl);
            } catch (err) {
                console.warn("failed to create object URL for PDF", err);
            }

            navigate("/windmill/eb-bill/pdf");

        } catch (err: any) {
            console.error(err);
            const errorMessage = err.response?.data?.detail || err.message || "Unknown error";
            showError(`${errorMessage}`);
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
                                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                                    <SelectTrigger className="w-full border-slate-300 h-9">
                                        <SelectValue placeholder="Select Customer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {customerLoading ? (
                                            <SelectItem value="loading" disabled>
                                                Loading customers...
                                            </SelectItem>
                                        ) : customers.length === 0 ? (
                                            <SelectItem value="no-customers" disabled>
                                                No customers found
                                            </SelectItem>
                                        ) : (
                                            customers.map((cust) => (
                                                <SelectItem key={cust.id} value={String(cust.id)}>
                                                    {cust.customer_name}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-600">SE Number</label>
                                <Select value={selectedServiceNumberId} onValueChange={setSelectedServiceNumberId}>
                                    <SelectTrigger className="w-full border-slate-300 h-9">
                                        <SelectValue placeholder="Select SE Number" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {serviceLoading ? (
                                            <SelectItem value="loading-se" disabled>
                                                Loading SE numbers...
                                            </SelectItem>
                                        ) : serviceNumbers.length === 0 ? (
                                            <SelectItem value="no-service-number" disabled>
                                                No SE numbers found
                                            </SelectItem>
                                        ) : (
                                            serviceNumbers.map((svc) => (
                                                <SelectItem key={svc.id} value={String(svc.id)}>
                                                    {svc.service_number}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-600">Year</label>
                                <Select value={selectedYear} onValueChange={setSelectedYear}>
                                    <SelectTrigger className="w-full border-slate-300 h-9">
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
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-600">Month</label>
                                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
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
