import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { Calendar as CalendarIcon, ArrowLeft, Upload, Eye, FileText, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function WindmillMasterAdd() {
    const navigate = useNavigate();
    const [fromDate, setFromDate] = React.useState<Date>();
    const [toDate, setToDate] = React.useState<Date>();
    const [insuranceFromDate, setInsuranceFromDate] = React.useState<Date>();
    const [insuranceToDate, setInsuranceToDate] = React.useState<Date>();
    const [unitsExpiring, setUnitsExpiring] = React.useState("monthly");
    const [type, setType] = React.useState("windmill");
    const [transactionLoss, setTransactionLoss] = React.useState("0.00");
    const [minimumLevelGeneration, setMinimumLevelGeneration] = React.useState("");
    const [portalUrl, setPortalUrl] = React.useState("");
    const [portalUsername, setPortalUsername] = React.useState("");
    const [portalPassword, setPortalPassword] = React.useState("");

    // AMC / Insurance fields for Add form
    const [amcType, setAmcType] = React.useState("comprehensive");
    const [amcHead, setAmcHead] = React.useState("");
    const [amcHeadContact, setAmcHeadContact] = React.useState("");
    const [insurancePolicyNumber, setInsurancePolicyNumber] = React.useState("");
    const [insurancePersonName, setInsurancePersonName] = React.useState("");
    const [insurancePersonPhone, setInsurancePersonPhone] = React.useState("");

    const [activeTab, setActiveTab] = React.useState("windmill_details");
    const [edcCircle, setEdcCircle] = React.useState("");

    // Windmill form state
    const [windmillNumber, setWindmillNumber] = React.useState("");
    const [windmillName, setWindmillName] = React.useState("");
    const [status, setStatus] = React.useState("Active");
    const [operatorName, setOperatorName] = React.useState("");
    const [operatorNumber, setOperatorNumber] = React.useState("");
    const [contactNumber, setContactNumber] = React.useState("");
    const [aeName, setAeName] = React.useState("");
    const [aeNumber, setAeNumber] = React.useState("");
    const [kvaId, setKvaId] = React.useState("");
    const [windmillCapacity, setWindmillCapacity] = React.useState("");
    const [capacityId, setCapacityId] = React.useState("");

    const [edcCircles, setEdcCircles] = React.useState<any[]>([]);
    const [kvaOptions, setKvaOptions] = React.useState<any[]>([]);
    const [capacityOptions, setCapacityOptions] = React.useState<any[]>([]);
    const [isSaving, setIsSaving] = React.useState(false);
    const [isPosting, setIsPosting] = React.useState(false);
    const [isUploadingDocs, setIsUploadingDocs] = React.useState(false);
    const [createdWindmillId, setCreatedWindmillId] = React.useState<number | null>(null);

    const applyTransmissionLossFromKva = (kvaIdValue: string) => {
        const selected = kvaOptions.find((opt) => String(opt.id) === String(kvaIdValue));
        if (selected && (selected.loss_percentage !== undefined && selected.loss_percentage !== null)) {
            setTransactionLoss(String(selected.loss_percentage));
        } else if (selected && (selected.lossPercentage !== undefined && selected.lossPercentage !== null)) {
            setTransactionLoss(String(selected.lossPercentage));
        } else {
            setTransactionLoss("0.00");
        }
    };

    React.useEffect(() => {
        const token = localStorage.getItem("access_token");
        const headers = {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const loadEdcCircles = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/edc-circle/dropdown`, { headers });
                if (!res.ok) throw new Error("Failed to load EDC circles");
                const data = await res.json();
                setEdcCircles(data);
            } catch (err) {
                console.error(err);
            }
        };

        const loadKvaOptions = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/transmission/dropdown`, { headers });
                if (!res.ok) {
                    const data = await res.json().catch(() => null);
                    if (handleAuthError(res.status, data)) return;
                    const msg = data?.detail || data?.message || `HTTP ${res.status}`;
                    alert(`Unable to load KVA options: ${msg}`);
                    return;
                }
                const data = await res.json();
                setKvaOptions(data);
            } catch (err) {
                console.error(err);
                alert("Unable to load KVA options. Check console for details.");
            }
        };

        const loadCapacityOptions = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/capacity/dropdown`, { headers });
                if (!res.ok) {
                    const data = await res.json().catch(() => null);
                    if (handleAuthError(res.status, data)) return;
                    const msg = data?.detail || data?.message || `HTTP ${res.status}`;
                    alert(`Unable to load capacity options: ${msg}`);
                    return;
                }
                const data = await res.json();
                setCapacityOptions(data);
            } catch (err) {
                console.error(err);
                alert("Unable to load capacity options. Check console for details.");
            }
        };

        // run parallel; no dependency ordering needed here
        loadEdcCircles();
        loadKvaOptions();
        loadCapacityOptions();
    }, []);

    // Uploads State
    const [documents, setDocuments] = React.useState([
        { id: 1, name: "Upload Commissioning certificate", file: null as File | null, fileName: "" },
        { id: 2, name: "Name transfer document", file: null as File | null, fileName: "" },
        { id: 3, name: "PPA", file: null as File | null, fileName: "" },
        { id: 4, name: "Wheeling agreement", file: null as File | null, fileName: "" },
        { id: 5, name: "Upload AMC document", file: null as File | null, fileName: "" },
        { id: 6, name: "Insurance Policy", file: null as File | null, fileName: "" }
    ]);
    const [viewFile, setViewFile] = React.useState<{ file: File; name: string } | null>(null);

    const handleFileChange = (id: number, file: File | null) => {
        setDocuments(documents.map(doc =>
            doc.id === id ? { ...doc, file: file, fileName: file ? file.name : "" } : doc
        ));
    };

    const handleAuthError = (status: number, data: any) => {
        const tokenExpired = data?.detail === "Token expired" || data?.message === "Token expired";
        if (status === 401 || tokenExpired) {
            localStorage.removeItem("access_token");
            alert("Session expired. Please log in again.");
            navigate("/login");
            return true;
        }
        return false;
    };

    // helper for uploading any docs after a fresh record has been created
    const uploadDocs = async (windmillId: number) => {
        const token = localStorage.getItem("access_token");
        if (!token) return false;

        const uploadFieldNames = [
            "commision_certificate_upload",
            "name_transfer_document_upload",
            "ppa_upload",
            "wheeling_agreement_upload",
            "amc_document_upload",
            "insurance_policy_upload",
        ];

        const hasFiles = documents.some((d) => d.file);
        if (!hasFiles) return true;

        const formData = new FormData();
        documents.forEach((doc, i) => {
            if (doc.file) {
                formData.append(uploadFieldNames[i], doc.file);
            }
        });

        try {
            const res = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/windmills/${windmillId}/uploads`,
                {
                    method: "POST",
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    body: formData,
                }
            );
            return res.ok;
        } catch (e) {
            console.error("uploadDocs error", e);
            return false;
        }
    };

    const saveWindmill = async (isSubmitted: boolean) => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            alert("Not authenticated – please log in first.");
            navigate("/login");
            return;
        }

        // Quick client-side validation for required fields (prevents 422 from FastAPI)
        if (!windmillNumber?.trim()) {
            alert("Windmill Number is required");
            return;
        }
        if (!kvaId) {
            alert("Please select a KVA");
            return;
        }

        if (isSubmitted) {
            setIsPosting(true);
        } else {
            setIsSaving(true);
        }

        const safeString = (value: any) =>
            value === undefined || value === null ? undefined : String(value);

        const payload: any = {
            type: safeString(type),
            windmill_number: safeString(windmillNumber),
            windmill_name: safeString(windmillName),
            status: safeString(status),
            operator_name: safeString(operatorName),
            operator_number: safeString(operatorNumber),
            contact_number: safeString(contactNumber),
            ae_name: safeString(aeName),
            ae_number: safeString(aeNumber),
            kva_id: kvaId ? parseInt(kvaId, 10) : undefined,
            transmission_loss: transactionLoss ? parseFloat(transactionLoss) : undefined,
            windmill_capacity: windmillCapacity ? parseFloat(windmillCapacity) : undefined,
            capacity_id: capacityId ? parseInt(capacityId, 10) : undefined,
            edc_circle_id: edcCircle ? parseInt(edcCircle, 10) : undefined,
            amc_type: safeString(amcType),
            amc_head: safeString(amcHead),
            amc_head_contact: safeString(amcHeadContact),
            amc_from_date: fromDate ? format(fromDate, "yyyy-MM-dd") : undefined,
            amc_to_date: toDate ? format(toDate, "yyyy-MM-dd") : undefined,
            insurance_policy_number: safeString(insurancePolicyNumber),
            insurance_person_name: safeString(insurancePersonName),
            insurance_person_phone: safeString(insurancePersonPhone),
            insurance_from_date: insuranceFromDate ? format(insuranceFromDate, "yyyy-MM-dd") : undefined,
            insurance_to_date: insuranceToDate ? format(insuranceToDate, "yyyy-MM-dd") : undefined,
            minimum_level_generation: safeString(minimumLevelGeneration),
            units_expiring: safeString(unitsExpiring),
            portal_url: safeString(portalUrl),
            username: safeString(portalUsername),
            password: safeString(portalPassword),
            is_submitted: isSubmitted ? 1 : 0,
        };

        console.debug("Saving windmill", payload);
        try {
            const endpoint = createdWindmillId
                ? `${import.meta.env.VITE_BACKEND_URL}/api/windmills/${createdWindmillId}`
                : `${import.meta.env.VITE_BACKEND_URL}/api/windmills`;
            const method = createdWindmillId ? "PUT" : "POST";

            const res = await fetch(endpoint, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (res.ok) {
                // Keep created windmill ID for subsequent saves/uploads
                if (!createdWindmillId && data.id) {
                    setCreatedWindmillId(data.id);
                }

                const windmillIdToUse = createdWindmillId || data.id;

                // immediate navigation response, docs upload in background (if any files selected)
                if (windmillIdToUse && documents.some((d) => d.file)) {
                    setIsUploadingDocs(true);
                    uploadDocs(windmillIdToUse)
                        .then((docsOk) => {
                            if (!docsOk) {
                                alert("Windmill saved but some document uploads failed");
                            }
                        })
                        .finally(() => setIsUploadingDocs(false));
                }

                alert(data.message || (createdWindmillId ? "Windmill updated successfully" : "Windmill saved successfully"));

                // If submitted (posted), go to list; otherwise advance to next tab
                if (isSubmitted) {
                    navigate("/master/windmill");
                } else {
                    // Advance to next tab
                    setActiveTab((prev) => {
                        const tabOrder = ["windmill_details", "uploads", "shift_timings"];
                        const idx = tabOrder.indexOf(prev);
                        if (idx !== -1 && idx < tabOrder.length - 1) {
                            return tabOrder[idx + 1];
                        }
                        return prev;
                    });
                }
            } else {
                console.debug("Windmill save failed", res.status, data);

                if (handleAuthError(res.status, data)) {
                    return;
                }

                // `detail` from FastAPI validation errors can be array/object/string
                const detail = data?.detail;
                let msg = data?.message || "Failed to save windmill";

                if (Array.isArray(detail)) {
                    msg = detail.map((d: any) => d.msg || JSON.stringify(d)).join("\n");
                } else if (detail && typeof detail === "object") {
                    msg = JSON.stringify(detail, null, 2);
                } else if (typeof detail === "string") {
                    msg = detail;
                }

                alert(`Error ${res.status}: ${msg}`);
            }
        } catch (err) {
            console.error(err);
            alert("Error connecting to backend");
        } finally {
            if (isSubmitted) {
                setIsPosting(false);
            } else {
                setIsSaving(false);
            }
        }
    };

    return (
        <div className="p-3 bg-slate-50 min-h-screen font-sans">
            <div className="w-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h1 className="text-lg font-semibold text-indigo-700">
                        Master Windmill - Add
                    </h1>
                    <div className="flex gap-2">
                        <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white h-8 px-4" onClick={() => saveWindmill(false)} disabled={isSaving || isPosting || isUploadingDocs}>
                            {isSaving ? "Saving..." : "Save"}
                        </Button>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-4" onClick={() => saveWindmill(true)} disabled={isSaving || isPosting || isUploadingDocs}>
                            {isPosting ? "Posting..." : "Post"}
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-slate-600 border-slate-300 bg-white hover:bg-slate-50 h-8 w-8 p-0"
                            onClick={() => navigate("/master/windmill")}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="p-0">
                    <Tabs defaultValue="windmill_details" className="w-full" onValueChange={setActiveTab}>
                        <TabsList className="w-full justify-start rounded-none h-auto bg-cyan-50 p-0 border-b border-cyan-100">
                            <TabsTrigger
                                value="windmill_details"
                                className={cn(
                                    "flex items-center gap-3 px-8 py-3.5 rounded-none data-[state=active]:bg-cyan-100 data-[state=active]:shadow-none transition-all",
                                    "text-slate-600 font-medium text-[15px] border-r border-cyan-50"
                                )}
                            >
                                <div className={cn(
                                    "flex items-center justify-center w-8 h-8 rounded-full transition-all",
                                    activeTab === "windmill_details" ? "bg-cyan-700 text-white" : "border-2 border-cyan-700 text-cyan-700 bg-transparent"
                                )}>
                                    <FileText className="h-4.5 w-4.5" />
                                </div>
                                <span>Windmill Details</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="uploads"
                                className={cn(
                                    "flex items-center gap-3 px-8 py-3.5 rounded-none data-[state=active]:bg-cyan-100 data-[state=active]:shadow-none transition-all",
                                    "text-slate-600 font-medium text-[15px] border-r border-cyan-50"
                                )}
                            >
                                <div className={cn(
                                    "flex items-center justify-center w-8 h-8 rounded-full transition-all",
                                    activeTab === "uploads" ? "bg-cyan-700 text-white" : "border-2 border-cyan-700 text-cyan-700 bg-transparent"
                                )}>
                                    <Upload className="h-4.5 w-4.5" />
                                </div>
                                <span>Upload Docs</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="shift_timings"
                                className={cn(
                                    "flex items-center gap-3 px-8 py-3.5 rounded-none data-[state=active]:bg-cyan-100 data-[state=active]:shadow-none transition-all",
                                    "text-slate-600 font-medium text-[15px] border-r border-cyan-50"
                                )}
                            >
                                <div className={cn(
                                    "flex items-center justify-center w-8 h-8 rounded-full transition-all",
                                    activeTab === "shift_timings" ? "bg-cyan-700 text-white" : "border-2 border-cyan-700 text-cyan-700 bg-transparent"
                                )}>
                                    <Clock className="h-4.5 w-4.5" />
                                </div>
                                <span>Slot Timings</span>
                            </TabsTrigger>
                        </TabsList>

                        <div className="p-6">
                            <TabsContent value="windmill_details" className="mt-0 space-y-6 pt-2">
                                <div className="space-y-6 px-4 pt-2">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                                        <div className="space-y-1.5 md:col-span-3">
                                            <label className="text-sm font-semibold text-slate-700">Type</label>
                                            <div className="flex gap-4">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="type"
                                                        value="windmill"
                                                        checked={type === "windmill"}
                                                        onChange={(e) => setType(e.target.value)}
                                                        className="w-4 h-4 text-indigo-600"
                                                    />
                                                    <span className="text-sm text-slate-700">Windmill</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="type"
                                                        value="solar"
                                                        checked={type === "solar"}
                                                        onChange={(e) => setType(e.target.value)}
                                                        className="w-4 h-4 text-indigo-600"
                                                    />
                                                    <span className="text-sm text-slate-700">Solar</span>
                                                </label>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">Windmill Number</label>
                                            <Input
                                                value={windmillNumber}
                                                onChange={(e) => setWindmillNumber(e.target.value)}
                                                placeholder="Enter WM Number"
                                                className="bg-white border-slate-300 h-9 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">Windmill Name</label>
                                            <Input
                                                value={windmillName}
                                                onChange={(e) => setWindmillName(e.target.value)}
                                                placeholder="Enter Windmill Name"
                                                className="bg-white border-slate-300 h-9 text-xs"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">Status</label>
                                            <Select value={status} onValueChange={setStatus}>
                                                <SelectTrigger className="bg-white border-slate-300 h-9 text-xs">
                                                    <SelectValue placeholder="Active" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Active">Active</SelectItem>
                                                    <SelectItem value="Inactive">Inactive</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">KVA</label>
                                            <Select
                                                value={kvaId}
                                                onValueChange={(value) => {
                                                    setKvaId(value);
                                                    applyTransmissionLossFromKva(value);
                                                }}
                                            >
                                                <SelectTrigger className="bg-white border-slate-300 h-9 text-xs">
                                                    <SelectValue placeholder="Select KVA" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {kvaOptions.map((opt) => (
                                                        <SelectItem key={opt.id} value={String(opt.id)}>
                                                            {opt.kva}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">Transmission Loss</label>
                                            <div className="h-9 px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs text-red-700 font-medium">
                                                {transactionLoss}%
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">Capacity </label>
                                            <Select value={capacityId} onValueChange={(val) => {
                                                setCapacityId(val);
                                                const selected = capacityOptions.find((c) => String(c.id) === val);
                                                setWindmillCapacity(selected ? (selected.capacity_mw ?? selected.capacity ?? "") : "");
                                            }}>
                                                <SelectTrigger className="bg-white border-slate-300 h-9 text-xs">
                                                    <SelectValue placeholder="Select Capacity" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {capacityOptions.map((opt) => (
                                                        <SelectItem key={opt.id} value={String(opt.id)}>
                                                            {opt.capacity_mw ?? opt.capacity ?? opt.capacity_value ?? ""}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">EDC Circle</label>
                                            <Select value={edcCircle} onValueChange={setEdcCircle}>
                                                <SelectTrigger className="bg-white border-slate-300 h-9 text-xs">
                                                    <SelectValue placeholder="Select EDC Circle" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {edcCircles.map((edc) => (
                                                        <SelectItem key={edc.id} value={String(edc.id)}>
                                                            {edc.edc_name || edc.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                                                                <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">AE Name</label>
                                            <Input
                                                value={aeName}
                                                onChange={(e) => setAeName(e.target.value)}
                                                placeholder="Enter AE Name"
                                                className="bg-white border-slate-300 h-9 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">AE Number</label>
                                            <Input
                                                value={aeNumber}
                                                onChange={(e) => setAeNumber(e.target.value)}
                                                placeholder="Enter AE Number"
                                                className="bg-white border-slate-300 h-9 text-xs"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">Operator Name</label>
                                            <Input
                                                value={operatorName}
                                                onChange={(e) => setOperatorName(e.target.value)}
                                                placeholder="Enter Operator Name"
                                                className="bg-white border-slate-300 h-9 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">Operator Number</label>
                                            <Input
                                                value={operatorNumber}
                                                onChange={(e) => setOperatorNumber(e.target.value)}
                                                placeholder="Enter Operator Number"
                                                className="bg-white border-slate-300 h-9 text-xs"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 pt-4 border-t border-slate-100">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">AMC Type</label>
                                            <Select value={amcType} onValueChange={setAmcType}>
                                                <SelectTrigger className="bg-white border-slate-300 h-9 text-xs">
                                                    <SelectValue placeholder="Comprehensive" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="comprehensive">Comprehensive</SelectItem>
                                                    <SelectItem value="non-comprehensive">Non-Comprehensive</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">AMC Head</label>
                                            <Input
                                                value={amcHead}
                                                onChange={(e) => setAmcHead(e.target.value)}
                                                placeholder="Enter AMC Head"
                                                className="bg-white border-slate-300 h-9 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">AMC Head Contact Number</label>
                                            <Input
                                                value={amcHeadContact}
                                                onChange={(e) => setAmcHeadContact(e.target.value)}
                                                placeholder="Enter Contact Number"
                                                className="bg-white border-slate-300 h-9 text-xs"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">AMC From Date</label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full justify-start text-left font-normal bg-white border-slate-300 h-9",
                                                            !fromDate && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-3 w-3" />
                                                        {fromDate ? formatDate(fromDate) : <span className="text-xs text-slate-400">Pick a date</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0">
                                                    <Calendar
                                                        mode="single"
                                                        selected={fromDate}
                                                        onSelect={setFromDate}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">AMC To Date</label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full justify-start text-left font-normal bg-white border-slate-300 h-9",
                                                            !toDate && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-3 w-3" />
                                                        {toDate ? formatDate(toDate) : <span className="text-xs text-slate-400">Pick a date</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0">
                                                    <Calendar
                                                        mode="single"
                                                        selected={toDate}
                                                        onSelect={setToDate}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 pt-4 border-t border-slate-100">

                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">Insurance Policy Number</label>
                                            <Input
                                                value={insurancePolicyNumber}
                                                onChange={(e) => setInsurancePolicyNumber(e.target.value)}
                                                placeholder="Enter Policy Number"
                                                className="bg-white border-slate-300 h-9 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">Insurance Company Name</label>
                                            <Input
                                                value={insurancePersonName}
                                                onChange={(e) => setInsurancePersonName(e.target.value)}
                                                placeholder="Enter Insurance Company Name"
                                                className="bg-white border-slate-300 h-9 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">Insurance Company Phone Number</label>
                                            <Input
                                                value={insurancePersonPhone}
                                                onChange={(e) => setInsurancePersonPhone(e.target.value)}
                                                placeholder="Enter Insurance Company Phone Number"
                                                className="bg-white border-slate-300 h-9 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">Insurance From Date</label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full justify-start text-left font-normal bg-white border-slate-300 h-9",
                                                            !insuranceFromDate && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-3 w-3" />
                                                        {insuranceFromDate ? formatDate(insuranceFromDate) : <span className="text-xs text-slate-400">Pick a date</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0">
                                                    <Calendar
                                                        mode="single"
                                                        selected={insuranceFromDate}
                                                        onSelect={setInsuranceFromDate}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">Insurance To Date</label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full justify-start text-left font-normal bg-white border-slate-300 h-9",
                                                            !insuranceToDate && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-3 w-3" />
                                                        {insuranceToDate ? formatDate(insuranceToDate) : <span className="text-xs text-slate-400">Pick a date</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0">
                                                    <Calendar
                                                        mode="single"
                                                        selected={insuranceToDate}
                                                        onSelect={setInsuranceToDate}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 pt-4 border-t border-slate-100">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">Minimum Level Generation</label>
                                            <Input
                                                value={minimumLevelGeneration}
                                                onChange={(e) => setMinimumLevelGeneration(e.target.value)}
                                                placeholder="Enter Min Level Generation"
                                                className="bg-white border-slate-300 h-9 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">Units Expiring</label>
                                            <div className="flex gap-4 h-9 items-center">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="unitsExpiring"
                                                        value="monthly"
                                                        checked={unitsExpiring === "monthly"}
                                                        onChange={(e) => setUnitsExpiring(e.target.value)}
                                                        className="w-4 h-4 text-indigo-600"
                                                    />
                                                    <span className="text-sm text-slate-700">Monthly</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="unitsExpiring"
                                                        value="yearly"
                                                        checked={unitsExpiring === "yearly"}
                                                        onChange={(e) => setUnitsExpiring(e.target.value)}
                                                        className="w-4 h-4 text-indigo-600"
                                                    />
                                                    <span className="text-sm text-slate-700">Yearly</span>
                                                </label>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">Open Access Portal (Website)</label>
                                            <Input
                                                value={portalUrl}
                                                onChange={(e) => setPortalUrl(e.target.value)}
                                                placeholder="Enter Website URL"
                                                className="bg-white border-slate-300 h-9 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">Username</label>
                                            <Input
                                                value={portalUsername}
                                                onChange={(e) => setPortalUsername(e.target.value)}
                                                placeholder="Enter Username"
                                                className="bg-white border-slate-300 h-9 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">Password</label>
                                            <Input
                                                value={portalPassword}
                                                onChange={(e) => setPortalPassword(e.target.value)}
                                                type="text"
                                                placeholder="Enter Password"
                                                className="bg-white border-slate-300 h-9 text-xs"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="uploads" className="mt-0 space-y-6 pt-2">
                                <div className="space-y-6 max-w-5xl">
                                    <div className="border border-slate-200 rounded-md overflow-hidden">
                                        <table className="w-full text-sm text-left border-collapse">
                                            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                                                <tr>
                                                    <th className="px-4 py-3 w-16 border-r border-slate-200">#</th>
                                                    <th className="px-4 py-3 border-r border-slate-200">Document Name</th>
                                                    <th className="px-4 py-3 border-r border-slate-200 w-1/3">Upload</th>
                                                    <th className="px-4 py-3 border-r border-slate-200 w-1/3">File Name</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {documents.map((item, index) => (
                                                    <tr key={item.id} className="hover:bg-slate-50">
                                                        <td className="px-4 py-3 text-slate-500 border-r border-slate-100">{index + 1}</td>
                                                        <td className="px-4 py-3 font-medium text-slate-900 border-r border-slate-100">{item.name}</td>
                                                        <td className="px-4 py-3 border-r border-slate-100">
                                                            <Input
                                                                type="file"
                                                                onChange={(e) => handleFileChange(item.id, e.target.files ? e.target.files[0] : null)}
                                                                className="bg-white border-slate-300 h-9 text-xs focus:ring-blue-500 file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-600 border-r border-slate-100">
                                                            {item.fileName ? (
                                                                <a
                                                                    href={item.file ? URL.createObjectURL(item.file) : "#"}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                                                >
                                                                    {item.fileName}
                                                                </a>
                                                            ) : (
                                                                <span className="text-slate-400 italic">No file selected</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="shift_timings" className="mt-0 space-y-6 pt-2">
                                <div className="space-y-6 px-4 pt-4 max-w-5xl">
                                    <div className="flex flex-col gap-y-4">
                                        <div>
                                            <span className="text-sm font-semibold text-slate-700">C1 (Morning Peak): </span>
                                            <span className="text-sm font-semibold text-[#CB4154]">06:00 AM to 10:00 AM</span>
                                        </div>
                                        <div>
                                            <span className="text-sm font-semibold text-slate-700">C2 (Evening Peak): </span>
                                            <span className="text-sm font-semibold text-[#CB4154]">06:00 PM (18:00) to 10:00 PM (22:00)</span>
                                        </div>
                                        <div>
                                            <span className="text-sm font-semibold text-slate-700">C4 (Normal Hours): </span>
                                            <span className="text-sm font-semibold text-[#CB4154]">05:00 AM to 06:00 AM AND 10:00 AM to 06:00 PM (18:00)</span>
                                        </div>
                                        <div>
                                            <span className="text-sm font-semibold text-slate-700">C5 (Night Hours): </span>
                                            <span className="text-sm font-semibold text-[#CB4154]">10:00 PM (22:00) to 05:00 AM (next day)</span>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </div >
        </div >
    );
}
