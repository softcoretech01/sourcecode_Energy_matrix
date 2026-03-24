import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useNavigate, useParams } from "react-router-dom";
import { Calendar as CalendarIcon, ArrowLeft, Upload, Eye, FileText, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn, formatDate } from "@/lib/utils";
import { format } from "date-fns";

export default function WindmillMasterEdit() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [fromDate, setFromDate] = useState<Date>();
    const [toDate, setToDate] = useState<Date>();
    const [insuranceFromDate, setInsuranceFromDate] = useState<Date>();
    const [insuranceToDate, setInsuranceToDate] = useState<Date>();
    const [unitsExpiring, setUnitsExpiring] = useState("monthly");
    const [type, setType] = useState("windmill");
    const [transactionLoss, setTransactionLoss] = useState("4.50");
    const [activeTab, setActiveTab] = useState("windmill_details");
    const [edcCircle, setEdcCircle] = useState("South Circle");
    const [isPosted, setIsPosted] = useState(false);

    // Windmill form state
    const [windmillNumber, setWindmillNumber] = useState("");
    const [windmillName, setWindmillName] = useState("");
    const [status, setStatus] = useState("Active");
    const [operatorName, setOperatorName] = useState("");
    const [contactNumber, setContactNumber] = useState("");
    const [aeNumber, setAeNumber] = useState("");
    const [aeName, setAeName] = useState("");
    const [kvaId, setKvaId] = useState("");
    const [windmillCapacity, setWindmillCapacity] = useState("");
    const [capacityId, setCapacityId] = useState("");
    const [minimumLevelGeneration, setMinimumLevelGeneration] = useState("");
    const [portalUrl, setPortalUrl] = useState("");
    const [portalUsername, setPortalUsername] = useState("");
    const [portalPassword, setPortalPassword] = useState("");

    // AMC / Insurance fields that must persist through edit/update
    const [amcType, setAmcType] = useState("comprehensive");
    const [amcHead, setAmcHead] = useState("");
    const [amcHeadContact, setAmcHeadContact] = useState("");
    const [insurancePolicyNumber, setInsurancePolicyNumber] = useState("");
    const [insurancePersonName, setInsurancePersonName] = useState("");
    const [insurancePersonPhone, setInsurancePersonPhone] = useState("");

    const [edcCircles, setEdcCircles] = useState<any[]>([]);
    const [kvaOptions, setKvaOptions] = useState<any[]>([]);
    const [capacityOptions, setCapacityOptions] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isPosting, setIsPosting] = useState(false);
    const [isUploadingDocs, setIsUploadingDocs] = useState(false);

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

    useEffect(() => {
        if (kvaId && kvaOptions.length > 0) {
            applyTransmissionLossFromKva(kvaId);
        }
    }, [kvaId, kvaOptions]);

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

    // Uploads State
    const [documents, setDocuments] = useState([
        { id: 1, name: "Upload Commissioning certificate", file: null as File | null, fileName: "", existingFilePath: "" },
        { id: 2, name: "Name transfer document", file: null as File | null, fileName: "", existingFilePath: "" },
        { id: 3, name: "PPA", file: null as File | null, fileName: "", existingFilePath: "" },
        { id: 4, name: "Wheeling agreement", file: null as File | null, fileName: "", existingFilePath: "" },
        { id: 5, name: "Upload AMC document", file: null as File | null, fileName: "", existingFilePath: "" },
        { id: 6, name: "Insurance Policy", file: null as File | null, fileName: "", existingFilePath: "" }
    ]);
    const [viewFile, setViewFile] = useState<{ file: File; name: string } | null>(null);

    React.useEffect(() => {
        const token = localStorage.getItem("access_token");
        const headers = {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const loadEdcCircles = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/transmission/dropdown`, { headers });
                if (!res.ok) throw new Error("Failed to load kva options");
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

        const loadWindmill = async () => {
            if (!id) return;
            try {
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/windmills/${id}`, { headers });
                const data = await res.json().catch(() => null);
                if (!res.ok) {
                    if (handleAuthError(res.status, data)) return;
                    throw new Error(data?.detail || data?.message || "Failed to load windmill");
                }
                setWindmillNumber(data.windmill_number || "");
                setWindmillName(data.windmill_name || "");
                setStatus(data.status || "Active");
                setOperatorName(data.operator_name || "");
                setContactNumber(data.contact_number || data.operator_number || "");
                setAeNumber(data.ae_number || "");
                setAeName(data.ae_name || data.am_name || "");
                setKvaId(data.kva_id ? String(data.kva_id) : data.kva ? String(data.kva) : "");
                setCapacityId(data.capacity_mw_id ? String(data.capacity_mw_id) : data.capacity_mw_id ? String(data.capacity_mw_id) : "");
                setWindmillCapacity(
                    data.windmill_capacity
                        ? String(data.windmill_capacity)
                        : data.capacity
                            ? String(data.capacity)
                            : ""
                );
                setCapacityId(data.capacity_mw_id ? String(data.capacity_mw_id) : "");
                setEdcCircle(
                    data.edc_circle_id
                        ? String(data.edc_circle_id)
                        : data.edc_circle
                            ? String(data.edc_circle)
                            : ""
                );
                setTransactionLoss(
                    data.transmission_loss !== undefined && data.transmission_loss !== null
                        ? String(data.transmission_loss)
                        : "0.00"
                );
                setMinimumLevelGeneration(data.minimum_level_generation ? String(data.minimum_level_generation) : "");
                setUnitsExpiring(data.units_expiring ? String(data.units_expiring).toLowerCase() : "monthly");
                setPortalUrl(data.open_access_portal || data.portal_url || "");
                setPortalUsername(data.portal_username || data.username || "");
                setPortalPassword(data.portal_password || data.password || "");
                setIsPosted(data.is_submitted === 1 || data.status === "Posted" || data.status === "posted");
                setType(data.type && data.type.toLowerCase() === "solar" ? "solar" : "windmill");

                // Keep AMC/insurance values in state to avoid overwriting them on update
                setAmcType(data.amc_type || "comprehensive");
                setAmcHead(data.amc_head || "");
                setAmcHeadContact(data.amc_head_contact || "");
                setFromDate(data.amc_from_date ? new Date(data.amc_from_date) : undefined);
                setToDate(data.amc_to_date ? new Date(data.amc_to_date) : undefined);
                setInsurancePolicyNumber(data.insurance_policy_number || "");
                setInsurancePersonName(data.insurance_person_name || data.insurance_company_name || "");
                setInsurancePersonPhone(data.insurance_person_phone || data.insurance_company_number || "");
                setInsuranceFromDate(data.insurance_from_date ? new Date(data.insurance_from_date) : undefined);
                setInsuranceToDate(data.insurance_to_date ? new Date(data.insurance_to_date) : undefined);

                // if capacity list has item matching the loaded value, set it so dropdown shows selection
                if (data.windmill_capacity) {
                    const match = capacityOptions.find((c) =>
                        String(c.capacity_mw ?? c.capacity ?? "") === String(data.windmill_capacity)
                    );
                    if (match) setCapacityId(String(match.id));
                }

                // load existing uploaded docs for this windmill
                const uploadsRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/windmills/${id}/uploads`, { headers });
                if (uploadsRes.ok) {
                    const uploads = await uploadsRes.json();
                    // map existing uploads into our document slots using a fixed lookup
                    const typeMap: Record<number, string> = {
                        1: "COMMISSION_CERTIFICATE",
                        2: "NAME_TRANSFER_DOCUMENT",
                        3: "PPA",
                        4: "WHEELING_AGREEMENT",
                        5: "AMC_DOCUMENT",
                        6: "INSURANCE_POLICY",
                    };
                    setDocuments((prev) =>
                        prev.map((doc) => {
                            const key = typeMap[doc.id];
                            const found = key ? uploads.find((u: any) => u.document_type === key) : null;
                            if (!found) return doc;

                            // Normalize stored paths (Windows may use backslashes) and show just the file name.
                            const normalizedPath = found.file_path?.replace(/\\/g, "/") || "";
                            const displayName =
                                found.file_name ||
                                normalizedPath.split("/").pop() ||
                                "";

                            return {
                                ...doc,
                                fileName: displayName,
                                existingFilePath: normalizedPath,
                            };
                        })
                    );
                }
            } catch (err) {
                console.error(err);
            }
        };

        // run sequence so that we have capacity options ready before trying to
        // map the windmill to them. we don't need to await edc and kva but it
        // doesn't hurt either.
        (async () => {
            await loadEdcCircles();
            await loadKvaOptions();
            await loadCapacityOptions();
            await loadWindmill();
        })();
    }, [id]);

    const handleFileChange = (id: number, file: File | null) => {
        setDocuments(documents.map(doc =>
            doc.id === id
                ? {
                      ...doc,
                      file: file,
                      fileName: file ? file.name : "",
                      // if we select a new file we no longer need the existing path
                      existingFilePath: file ? undefined : doc.existingFilePath,
                  }
                : doc
        ));
    };

    // helper to upload any selected files after the main record has been saved
    const uploadDocs = async () => {
        if (!id) return true;
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
                `${import.meta.env.VITE_BACKEND_URL}/api/windmills/${id}/uploads`,
                {
                    method: "POST",
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    body: formData,
                }
            );

            if (!res.ok) {
                // Try to show a meaningful message from the backend for debugging.
                const text = await res.text().catch(() => "");
                console.error("uploadDocs failed", res.status, text);
                alert(`Document upload failed (${res.status}).\n${text}`);
                return false;
            }

            return true;
        } catch (e) {
            console.error("uploadDocs error", e);
            alert("Document upload failed. See console for details.");
            return false;
        }
    };

    const updateWindmill = async (isSubmitted: boolean) => {
        if (isPosted) {
            alert("This windmill has been posted and cannot be edited.");
            return;
        }

        if (!id) {
            alert("Invalid windmill id");
            return;
        }

        const token = localStorage.getItem("access_token");
        if (!token) {
            alert("Not authenticated – please log in first.");
            navigate("/login");
            return;
        }

        // Basic required field validation (prevents 422)
        if (!windmillNumber?.trim()) {
            alert("Windmill Number is required");
            return;
        }
        if (!kvaId) {
            alert("Please select a KVA");
            return;
        }

        // Ensure all tabs are filled before posting
        if (isSubmitted) {
            const missingDocs = documents.filter((d) => !d.fileName).map((d) => d.name);
            const missingDates: string[] = [];

            if (!fromDate || !toDate) missingDates.push("AMC dates");
            if (!insuranceFromDate || !insuranceToDate) missingDates.push("Insurance dates");

            if (missingDocs.length > 0 || missingDates.length > 0) {
                const parts: string[] = [];
                if (missingDocs.length > 0) parts.push(`documents (${missingDocs.join(", ")})`);
                if (missingDates.length > 0) parts.push(missingDates.join(", "));

                alert(
                    `Please complete all required fields before posting. Missing: ${parts.join("; ")}`
                );
                return;
            }
        }

        if (isSubmitted) {
            setIsPosting(true);
        } else {
            setIsSaving(true);
        }
        const safeString = (value: any) => {
            if (value === undefined || value === null) return undefined;
            const str = String(value);
            // MySQL INTEGER columns reject empty string; send undefined (null) instead.
            return str.trim() === "" ? undefined : str;
        };

        const payload: any = {
            windmill_number: safeString(windmillNumber),
            windmill_name: safeString(windmillName),
            status: safeString(status),
            operator_name: safeString(operatorName),
            contact_number: safeString(contactNumber),
            operator_number: safeString(contactNumber),
            ae_number: safeString(aeNumber),
            ae_name: safeString(aeName),
            kva_id: kvaId ? parseInt(kvaId, 10) : undefined,
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
            type: safeString(type),
        };

        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/windmills/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (res.ok) {
                if (documents.some((d) => d.file)) {
                    setIsUploadingDocs(true);
                    uploadDocs()
                        .then((docsOk) => {
                            if (!docsOk) {
                                alert("Windmill updated but some document uploads failed");
                            }
                        })
                        .finally(() => setIsUploadingDocs(false));
                }

                alert(isSubmitted ? "Windmill posted successfully" : "Windmill updated successfully");
                if (isSubmitted) {
                    navigate("/master/windmill");
                } else {
                    // After uploads tab, return to list; otherwise move to next tab
                    if (activeTab === "uploads") {
                        navigate("/master/windmill");
                    } else {
                        setActiveTab((prev) => {
                            const tabOrder = ["windmill_details", "uploads", "shift_timings"];
                            const idx = tabOrder.indexOf(prev);
                            if (idx !== -1 && idx < tabOrder.length - 1) {
                                return tabOrder[idx + 1];
                            }
                            return prev;
                        });
                    }
                }
            } else {
                console.debug("Windmill update failed", res.status, data);

                const detail = data?.detail;
                let msg = data?.message || "Failed to update windmill";

                if (Array.isArray(detail)) {
                    msg = detail
                        .map((d: any) => {
                            if (d.loc) {
                                return `${d.loc.join(".")}: ${d.msg}`;
                            }
                            return d.msg || JSON.stringify(d);
                        })
                        .join("\n");
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
                        Master Windmill - Update
                    </h1>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white h-8 px-4 rounded-md transition-all shadow-sm"
                            onClick={() => updateWindmill(false)}
                            disabled={isPosted || isSaving || isPosting || isUploadingDocs}
                        >
                            {isSaving ? "Saving..." : "Update"}
                        </Button>
                        <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-4 rounded-md transition-all shadow-sm"
                            onClick={() => updateWindmill(true)}
                            disabled={isPosted || isSaving || isPosting || isUploadingDocs}
                        >
                            {isPosting ? "Posting..." : "Post"}
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-slate-600 border-slate-300 bg-white hover:bg-slate-50 h-8 w-8 p-0 rounded-md transition-all"
                            onClick={() => navigate("/master/windmill")}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="p-0">
                    <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
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
                                                disabled={isPosted}
                                                className="bg-white border-slate-300 h-9 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">Windmill Name</label>
                                            <Input
                                                value={windmillName}
                                                onChange={(e) => setWindmillName(e.target.value)}
                                                placeholder="Enter Windmill Name"
                                                disabled={isPosted}
                                                className="bg-white border-slate-300 h-9 text-xs"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">Status</label>
                                            <Select value={status} onValueChange={setStatus} disabled={isPosted}>
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
                                            <label className="text-sm font-semibold text-slate-700">KVA </label>
                                            <Select
                                                value={kvaId}
                                                onValueChange={(value) => {
                                                    setKvaId(value);
                                                    applyTransmissionLossFromKva(value);
                                                }}
                                                disabled={isPosted}
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
                                            <label className="text-sm font-semibold text-slate-700">Capacity</label>
                                            <Select value={capacityId} onValueChange={(val) => {
                                                setCapacityId(val);
                                                const selected = capacityOptions.find((c) => String(c.id) === val);
                                                setWindmillCapacity(selected ? (selected.capacity_mw ?? selected.capacity ?? "") : "");
                                            }} disabled={isPosted}>
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
                                            <label className="text-sm font-semibold text-slate-700">Transmission Loss</label>
                                            <div className="h-9 px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs text-red-700 font-medium">
                                                {transactionLoss}%
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">EDC Circle</label>
                                            <Select value={edcCircle} onValueChange={setEdcCircle} disabled={isPosted}>
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
                                                disabled={isPosted}
                                                className="bg-white border-slate-300 h-9 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">AE Number</label>
                                            <Input
                                                value={aeNumber}
                                                onChange={(e) => setAeNumber(e.target.value)}
                                                placeholder="Enter AE Number"
                                                disabled={isPosted}
                                                className="bg-white border-slate-300 h-9 text-xs"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">Operator Name</label>
                                            <Input
                                                value={operatorName}
                                                onChange={(e) => setOperatorName(e.target.value)}
                                                placeholder="Enter Operator Name"
                                                disabled={isPosted}
                                                className="bg-white border-slate-300 h-9 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">Operator Number</label>
                                            <Input
                                                value={contactNumber}
                                                onChange={(e) => setContactNumber(e.target.value)}
                                                placeholder="Enter Contact Number"
                                                disabled={isPosted}
                                                className="bg-white border-slate-300 h-9 text-xs"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 pt-4 border-t border-slate-100">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">AMC Type</label>
                                            <Select value={amcType} onValueChange={setAmcType} disabled={isPosted}>
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
                                                disabled={isPosted}
                                                className="bg-white border-slate-300 h-9 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">AMC Head Contact Number</label>
                                            <Input
                                                value={amcHeadContact}
                                                onChange={(e) => setAmcHeadContact(e.target.value)}
                                                placeholder="Enter AMC Head Contact"
                                                disabled={isPosted}
                                                className="bg-white border-slate-300 h-9 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">AMC From Date</label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant={"outline"}
                                                        disabled={isPosted}
                                                        className={cn(
                                                            "w-full justify-start text-left font-normal bg-white border-slate-300 h-9",
                                                            !fromDate && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-3 w-3" />
                                                        {fromDate ? formatDate(fromDate) : <span className="text-xs text-slate-400">dd-mm-yyyy</span>}
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
                                                        disabled={isPosted}
                                                        className={cn(
                                                            "w-full justify-start text-left font-normal bg-white border-slate-300 h-9",
                                                            !toDate && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-3 w-3" />
                                                        {toDate ? formatDate(toDate) : <span className="text-xs text-slate-400">dd-mm-yyyy</span>}
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
                                                placeholder="Enter Insurance Policy Number"
                                                disabled={isPosted}
                                                className="bg-white border-slate-300 h-9 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">Insurance Company Name</label>
                                            <Input
                                                value={insurancePersonName}
                                                onChange={(e) => setInsurancePersonName(e.target.value)}
                                                placeholder="Enter Insurance Company Name"
                                                disabled={isPosted}
                                                className="bg-white border-slate-300 h-9 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">Insurance Company Phone Number</label>
                                            <Input
                                                value={insurancePersonPhone}
                                                onChange={(e) => setInsurancePersonPhone(e.target.value)}
                                                placeholder="Enter Insurance Company Phone Number"
                                                disabled={isPosted}
                                                className="bg-white border-slate-300 h-9 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">Insurance From Date</label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant={"outline"}
                                                        disabled={isPosted}
                                                        className={cn(
                                                            "w-full justify-start text-left font-normal bg-white border-slate-300 h-9",
                                                            !insuranceFromDate && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-3 w-3" />
                                                        {insuranceFromDate ? formatDate(insuranceFromDate) : <span className="text-xs text-slate-400">dd-mm-yyyy</span>}
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
                                                        disabled={isPosted}
                                                        className={cn(
                                                            "w-full justify-start text-left font-normal bg-white border-slate-300 h-9",
                                                            !insuranceToDate && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-3 w-3" />
                                                        {insuranceToDate ? formatDate(insuranceToDate) : <span className="text-xs text-slate-400">dd-mm-yyyy</span>}
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

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-4 border-t border-slate-100">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">Minimum Level Generation</label>
                                            <Input
                                                value={minimumLevelGeneration}
                                                onChange={(e) => setMinimumLevelGeneration(e.target.value)}
                                                placeholder="Enter Min Level Generation"
                                                className="bg-white border-slate-300 h-9 text-xs"
                                                disabled={isPosted}
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
                                                disabled={isPosted}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">Username</label>
                                            <Input
                                                value={portalUsername}
                                                onChange={(e) => setPortalUsername(e.target.value)}
                                                placeholder="Enter Username"
                                                className="bg-white border-slate-300 h-9 text-xs"
                                                disabled={isPosted}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">Password</label>
                                            <Input
                                                type="text"
                                                value={portalPassword}
                                                onChange={(e) => setPortalPassword(e.target.value)}
                                                placeholder="Enter Password"
                                                className="bg-white border-slate-300 h-9 text-xs"
                                                disabled={isPosted}
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
                                                                disabled={isPosted}
                                                                className="bg-white border-slate-300 h-9 text-xs focus:ring-blue-500 file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-600 border-r border-slate-100">
                                                            {item.fileName ? (
                                                                <a
                                                                    href={
                                                                        item.file
                                                                            ? URL.createObjectURL(item.file)
                                                                            : item.existingFilePath
                                                                            ? `${import.meta.env.VITE_BACKEND_URL}/${item.existingFilePath}`
                                                                            : "#"
                                                                    }
                                                                    download={item.fileName || undefined}
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
