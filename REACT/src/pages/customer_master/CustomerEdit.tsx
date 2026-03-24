import React, { useState } from "react";
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
import { ArrowLeft, UserPlus, FileText, Phone, Upload, Eye, LayoutGrid, AlertTriangle, Edit } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function CustomerEdit(): JSX.Element {
    const navigate = useNavigate();
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState("customer");
    const [status, setStatus] = useState("active");
    const [isPosted, setIsPosted] = useState(false);
    const [showPostConfirm, setShowPostConfirm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const tabOrder = [
        "customer",
        "se_number",
        "contact_details",
        "uploads",
        "agreed_units",
    ];

    const moveToNextTab = () => {
        const currentIndex = tabOrder.indexOf(activeTab);
        if (currentIndex >= 0 && currentIndex < tabOrder.length - 1) {
            setActiveTab(tabOrder[currentIndex + 1]);
        }
    };
    // Add state for customer fields
    const [customerName, setCustomerName] = useState("");
    const [city, setCity] = useState("");
    const [phoneNo, setPhoneNo] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [gstNumber, setGstNumber] = useState("");

    // Fetch customer data on mount or when id changes
    React.useEffect(() => {
        async function fetchCustomer() {
            const token = localStorage.getItem("access_token");
            // Fetch main customer details
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customers/${id}`, {
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            if (res.ok) {
                const data = await res.json();
                setCustomerName(data.customer_name || "");
                setCity(data.city || "");
                setPhoneNo(data.phone_no || "");
                setEmail(data.email || "");
                setAddress(data.address || "");
                setGstNumber(data.gst_number || "");
                setStatus(data.status === 1 ? "active" : "inactive");
                setIsPosted(data.is_submitted === 1 || data.status === "Posted" || data.status === 1);
                // Optionally: set other state if available
            }
            // Fetch SE numbers
            const seRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customers/${id}/se`, {
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            if (seRes.ok) {
                const seData = await seRes.json();
                const normalized = Array.isArray(seData)
                    ? seData.map((item: any) => ({ ...item, isNew: false }))
                    : [];
                setSeNumbers(normalized);
            }
            // Fetch contact details
            const contactRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customers/${id}/contact`, {
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            if (contactRes.ok) {
                const contactData = await contactRes.json();
                setContacts(contactData || []);
            }
            // Fetch uploaded documents (file names for display)
            const uploadRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customers/${id}/uploads`, {
                headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            });
            if (uploadRes.ok) {
                const uploadData = await uploadRes.json();
                const docNames = [
                    "Upload PPA (Power Purchase Agreement)",
                    "Upload Share Transfer Form Certificate",
                    "Upload Share Certificate",
                    "Pledge agreement",
                    "Share holding agreement",
                ];
                const uploadKeys = [
                    "upload_ppa",
                    "upload_share_transfer_form_certificate",
                    "upload_share_certificate",
                    "pledge_agreement",
                    "share_holding_agreement",
                ];
                setDocuments(docNames.map((name, i) => ({
                    id: i + 1,
                    name: docNames[i],
                    file: null,
                    fileName: uploadData[uploadKeys[i]] || "",
                })));
            }
            // Fetch agreed units
            try {
                const agreedRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customers/${id}/agreed-units`, {
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                });
                if (agreedRes.ok) {
                    const agreedData = await agreedRes.json();
                    console.log("Fetched agreed units:", agreedData);
                    if (agreedData.total_agreed_units !== undefined && agreedData.total_agreed_units !== null) {
                        setTotalAgreedUnits(String(agreedData.total_agreed_units));
                    }
                    if (agreedData.unit_allocation && agreedData.unit_allocation.length > 0) {
                        setUnitAllocation(agreedData.unit_allocation);
                    }
                } else {
                    console.error("Failed to fetch agreed units", await agreedRes.text());
                }
            } catch (err) {
                console.error("Error fetching agreed units", err);
            }
        }
        fetchCustomer();
    }, [id]);

    // SE Number State
    const [seNumbers, setSeNumbers] = useState<Array<{
        id: number;
        seNumber?: string;
        se_number?: string | number;
        service_number?: string | number;
        kva?: string | number;
        kva_id?: string | number;
        edcCircle?: string | number;
        edc_circle_id?: string | number;
        edc_circle?: string | number;
        remarks?: string;
        status?: string | number;
        isNew?: boolean;
    }>>([]);
    const [newSeNumber, setNewSeNumber] = useState("");
    const [newKva, setNewKva] = useState("");
    const [newEdcCircle, setNewEdcCircle] = useState("");
    const [newSeRemarks, setNewSeRemarks] = useState("");
    const [newSeStatus, setNewSeStatus] = useState("active");
    const [editSeId, setEditSeId] = useState<number | null>(null);
    const [edcList, setEdcList] = useState<{ id: number; edc_name?: string; edc_circle?: string }[]>([]);
    const [kvaList, setKvaList] = useState<{ id: number; kva?: string; capacity?: string }[]>([]);

    React.useEffect(() => {
        async function fetchInitialData() {
            try {
                const token = localStorage.getItem("access_token");
                const headers = {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                };

                // Fetch EDC Circles
                const edcRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/edc-circle/dropdown`, { headers });
                if (edcRes.ok) {
                    const edcData = await edcRes.json();
                    setEdcList(edcData || []);
                }

                // Fetch KVA/Capacities from transmission loss master
                const kvaRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/transmission/dropdown`, { headers });
                if (kvaRes.ok) {
                    const kvaData = await kvaRes.json();
                    setKvaList(kvaData || []);
                }
            } catch (err) {
                console.error("Failed to fetch initial data", err);
            }
        }
        fetchInitialData();
    }, []);

    // Contact Details State
    const [contacts, setContacts] = useState<Array<{
        id: number;
        person?: string;
        contact_person?: string;
        contact_person_name?: string;
        number?: string;
        phone?: string;
        phone_number?: string;
    }>>([]);
    const [newContactPerson, setNewContactPerson] = useState("");
    const [newContactNumber, setNewContactNumber] = useState("");
    const [editContactId, setEditContactId] = useState<number | null>(null);

    // Uploads State
    const [documents, setDocuments] = useState([
        { id: 1, name: "Upload PPA (Power Purchase Agreement)", file: null as File | null, fileName: "" },
        { id: 2, name: "Upload Share Transfer Form Certificate", file: null as File | null, fileName: "" },
        { id: 3, name: "Upload Share Certificate", file: null as File | null, fileName: "" },
        { id: 4, name: "Pledge agreement", file: null as File | null, fileName: "" },
        { id: 5, name: "Share holding agreement", file: null as File | null, fileName: "" }
    ]);
    const [viewFile, setViewFile] = useState<{ file: File; name: string } | null>(null);

    const handleFileChange = (id: number, file: File | null) => {
        setDocuments(prev => prev.map(doc =>
            doc.id === id ? { ...doc, file, fileName: file ? file.name : "" } : doc
        ));
    };

    // Agreed Units State
    const [totalAgreedUnits, setTotalAgreedUnits] = useState<string>("");
    const [unitAllocation, setUnitAllocation] = useState(
        ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(month => ({
            month,
            c1: "",
            c2: "",
            c4: "",
            c5: ""
        }))
    );

    const handleAllocationChange = (index: number, field: string, value: string) => {
        const newAllocation = [...unitAllocation];
        // @ts-ignore
        newAllocation[index][field] = value;
        setUnitAllocation(newAllocation);
    };



    const handleAddSeNumber = async () => {
        if (!newSeNumber) return;

        const token = localStorage.getItem("access_token");

        // Update existing SE row
        if (editSeId !== null) {
            try {
                const sePayload = {
                    se_number: newSeNumber,
                    kva: newKva,
                    edc_circle: newEdcCircle,
                    status: newSeStatus === "active" ? 1 : 0,
                    remarks: newSeRemarks,
                    is_submitted: true,
                };
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customers/${id}/se/${editSeId}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify(sePayload),
                });
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(text || `HTTP ${res.status}`);
                }

                // Refresh SE list from backend so UI matches DB
                const seRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customers/${id}/se`, {
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                });
                if (seRes.ok) {
                    const seData = await seRes.json();
                    const normalized = Array.isArray(seData)
                        ? seData.map((item: any) => ({ ...item, isNew: false }))
                        : [];
                    setSeNumbers(normalized);
                }

                setEditSeId(null);
                setNewSeNumber("");
                setNewKva("");
                setNewEdcCircle("");
                setNewSeRemarks("");
                setNewSeStatus("active");
                toast.success("Service Number updated successfully.");
            } catch (err: any) {
                toast.error("Failed to update service number: " + err.message);
                console.error("Update SE error:", err);
            }
            return;
        }

        let isDuplicate = false;
        setSeNumbers(prev => {
            const exists = prev.some(se => {
                const rowSeNum = (se.service_number ?? se.se_number ?? se.seNumber)?.toString().trim();
                const rowKvaId = (se.kva_id ?? kvaList.find(k => (k.kva || k.capacity) === se.kva)?.id ?? se.kva)?.toString();
                const rowEdcId = (se.edc_circle_id ?? se.edc_circle ?? se.edcCircle)?.toString();
                
                return rowSeNum === newSeNumber.toString().trim() &&
                    rowKvaId === (newKva || "").toString() &&
                    rowEdcId === (newEdcCircle || "").toString();
            });

            if (exists) {
                isDuplicate = true;
                return prev;
            }

            return [
                ...prev,
                {
                    id: Date.now(),
                    seNumber: newSeNumber,
                    kva: newKva,
                    edcCircle: newEdcCircle,
                    remarks: newSeRemarks,
                    status: newSeStatus,
                    isNew: true,
                },
            ];
        });

        if (isDuplicate) {
            toast.error("This Service Number with the same KVA and EDC Circle is already added.");
            return;
        }

        setNewSeNumber("");
        setNewKva("");
        setNewEdcCircle("");
        setNewSeRemarks("");
        setNewSeStatus("active");
    };

    const handleAddContact = async () => {
        if (!newContactPerson) return;
        const token = localStorage.getItem("access_token");
        if (editContactId !== null) {
            // Update contact
            const contactPayload = {
                contact_person_name: newContactPerson,
                phone_number: newContactNumber,
                is_submitted: true
            };
            try {
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customers/${id}/contact/${editContactId}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify(contactPayload),
                });
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(text);
                }
                const contactRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customers/${id}/contact`, {
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                });
                if (contactRes.ok) {
                    const list = await contactRes.json();
                    setContacts(list || []);
                }
                setNewContactPerson("");
                setNewContactNumber("");
                setEditContactId(null);
            } catch (err: any) {
                toast.error("Failed to add/update contact: " + err.message);
                console.error("Add/update contact error:", err);
            }
        } else {
            // Add contact logic
            const contactPayload = {
                contact_person_name: newContactPerson,
                phone_number: newContactNumber,
                is_submitted: true
            };
            try {
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customers/${id}/contact`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify(contactPayload),
                });
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(text);
                }
                const contactRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customers/${id}/contact`, {
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                });
                if (contactRes.ok) {
                    const list = await contactRes.json();
                    setContacts(list || []);
                }
                setNewContactPerson("");
                setNewContactNumber("");
            } catch (err: any) {
                toast.error("Failed to add contact: " + err.message);
                console.error("Add contact error:", err);
            }
        }
    };

    // Update handler
    // Update handler
    const handleUpdate = async () => {
        if (activeTab === "agreed_units") {
            const grandTotal = unitAllocation.reduce((sum, row) =>
                sum + (Number(row.c1) || 0) + (Number(row.c2) || 0) + (Number(row.c4) || 0) + (Number(row.c5) || 0), 0);
            const totalAgreed = Number(totalAgreedUnits) || 0;

            if (totalAgreed !== grandTotal) {
                const word = totalAgreed > grandTotal ? "High" : "Less";
                const proceed = window.confirm(`Warning: Total Agreed units is ${word} compared to Grand Total. Do you want to proceed?`);
                if (!proceed) return;
            }
        }
        if (isSaving) return;
        setIsSaving(true);
        try {
            await performSave(false);
        } finally {
            setIsSaving(false);
        }
    };

    const handlePost = async () => {
        if (isSaving) return;
        // require at least one entry in each of the tabs
        if (seNumbers.length === 0) {
            toast.error("Please add at least one service number before posting.");
            return;
        }
        if (contacts.length === 0) {
            toast.error("Please add at least one contact before posting.");
            return;
        }
        if (!totalAgreedUnits) {
            toast.error("Please specify agreed units before posting.");
            return;
        }

        setIsSaving(true);
        try {
            await performSave(true);
        } finally {
            setIsSaving(false);
        }
    };

    // if the user has clicked edit on a row but not pressed the nearby "Add/Update" button,
    // make sure those changes are flushed to the server before the global save runs.
    const flushPendingEdits = async () => {
        if (editSeId !== null && newSeNumber) {
            await handleAddSeNumber();
        }
        if (editContactId !== null && newContactPerson) {
            await handleAddContact();
        }
    };

    const performSave = async (isPosting: boolean) => {
        // commit any in‑progress edit first
        await flushPendingEdits();
        const token = localStorage.getItem("access_token");
        const payload = {
            customer_name: customerName,
            city,
            phone_no: phoneNo,
            email,
            address,
            gst_number: gstNumber,
            status: status === "active" ? 1 : 0,
            is_submitted: isPosting ? 1 : 0,
        };

        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customers/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                let errorMsg = await res.text();
                try {
                    const parsed = JSON.parse(errorMsg);
                    if (parsed.detail && Array.isArray(parsed.detail)) {
                        errorMsg = parsed.detail.map((d: any) => `${d.loc.slice(1).join('.')}: ${d.msg}`).join(', ');
                    } else if (parsed.detail) {
                        errorMsg = parsed.detail;
                    }
                } catch (e) {
                    // Not JSON, keep as is
                }
                toast.error(isPosting ? `Failed to post customer: ${errorMsg}` : `Failed to update customer: ${errorMsg}`);
                return;
            }

            // Save Agreed Units
            let agreedUnitsOk = true;
            try {
                const agreedRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customers/${id}/agreed-units`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({
                        total_agreed_units: Number(totalAgreedUnits),
                        unit_allocation: unitAllocation
                    }),
                });
                if (!agreedRes.ok) agreedUnitsOk = false;
            } catch (e) {
                agreedUnitsOk = false;
            }

            // Save New Service Numbers
            let seSuccess = true;
            const newSeNumbers = seNumbers.filter(se => se.isNew);
            for (const se of newSeNumbers) {
                const sePayload = {
                    se_number: se.seNumber || se.service_number,
                    kva: se.kva || se.kva_id,
                    edc_circle: se.edcCircle ?? se.edc_circle_id ?? se.edc_circle,
                    status: se.status === "active" || se.status === 1 || se.status === "1" ? 1 : 0,
                    remarks: se.remarks,
                    is_submitted: isPosting ? 1 : 0
                };
                const seRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customers/${id}/se`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify(sePayload),
                });
                if (!seRes.ok) seSuccess = false;
            }

            // Refresh SE list from backend to clear isNew flags and avoid duplicates on re-save
            if (seNumbers.some(se => se.isNew)) {
                try {
                    const seRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customers/${id}/se`, {
                        headers: {
                            "Content-Type": "application/json",
                            ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        },
                    });
                    if (seRes.ok) {
                        const seData = await seRes.json();
                        const normalized = Array.isArray(seData)
                            ? seData.map((item: any) => ({ ...item, isNew: false }))
                            : [];
                        setSeNumbers(normalized);
                    }
                } catch (err) {
                    console.error("Error refreshing SE list:", err);
                }
            }

            // Upload Documents
            const uploadFieldNames = ["ppa_upload", "share_transfer_upload", "share_certificate_upload", "pledge_upload", "share_holding_upload"];
            const hasDocs = documents.some(d => d.file);
            let uploadOk = true;
            if (hasDocs) {
                const formData = new FormData();
                documents.forEach((doc, i) => {
                    if (doc.file) formData.append(uploadFieldNames[i], doc.file);
                });
                try {
                    const uploadRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customers/${id}/uploads`, {
                        method: "POST",
                        headers: token ? { Authorization: `Bearer ${token}` } : {},
                        body: formData,
                    });
                    if (!uploadRes.ok) uploadOk = false;
                } catch (e) {
                    uploadOk = false;
                }
            }

            if (seSuccess && agreedUnitsOk && uploadOk) {
                const getSuccessMsg = () => {
                    if (isPosting) return "Customer posted successfully!";
                    switch (activeTab) {
                        case "customer": return "Customer details updated successfully.";
                        case "se_number": return "Service numbers updated successfully.";
                        case "contact_details": return "Contact details updated successfully.";
                        case "uploads": return "Documents uploaded successfully.";
                        case "agreed_units": return "Agreed units updated successfully.";
                        default: return "Customer updated successfully.";
                    }
                };
                
                toast.success(getSuccessMsg());
                
                if (isPosting) {
                    navigate("/master/customers");
                } else {
                    moveToNextTab();
                }
            } else {
                toast.warning("Customer saved, but some components (Agreed Units/Docs/SE) failed.");
            }
        } catch (err) {
            console.error(err);
            toast.error("Error saving customer");
        }
    };
    return (
        <div className="p-3 bg-slate-50 min-h-screen font-sans">
            <div className="w-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-100/30">
                    <h1 className="text-lg font-bold text-slate-800">
                        Master Customer - Update
                    </h1>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            className={cn(
                                "bg-red-600 hover:bg-red-700 text-white h-8 px-4 rounded-md transition-all shadow-sm",
                                isPosted && "opacity-50 cursor-not-allowed"
                            )}
                            onClick={handleUpdate}
                            disabled={isPosted || isSaving}
                        >
                            {isSaving ? "Saving..." : (isPosted ? "Posted" : "Update")}
                        </Button>
                        <Button
                            size="sm"
                            className={cn(
                                "bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-4 rounded-md transition-all shadow-sm",
                                isPosted && "opacity-50 cursor-not-allowed"
                            )}
                            disabled={isPosted}
                            onClick={() => {
                                // validate before showing confirmation dialog
                                if (seNumbers.length === 0 || contacts.length === 0 || !totalAgreedUnits) {
                                    toast.error("Please fill all tabs before posting.");
                                    return;
                                }
                                setShowPostConfirm(true);
                            }}
                        >
                            Post
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-slate-600 border-slate-300 bg-white hover:bg-slate-50 h-8 w-8 p-0 rounded-md transition-all"
                            onClick={() => navigate("/master/customers")}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="p-0">
                    <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
                        <TabsList className="w-full justify-start rounded-none h-auto bg-cyan-50 p-0 border-b border-cyan-100">
                            <TabsTrigger
                                value="customer"
                                className={cn(
                                    "flex items-center gap-3 px-8 py-3.5 rounded-none data-[state=active]:bg-cyan-100 data-[state=active]:shadow-none transition-all",
                                    "text-slate-600 font-medium text-[15px] border-r border-cyan-50"
                                )}
                            >
                                <div className={cn(
                                    "flex items-center justify-center w-8 h-8 rounded-full transition-all",
                                    activeTab === "customer" ? "bg-cyan-700 text-white" : "border-2 border-cyan-700 text-cyan-700 bg-transparent"
                                )}>
                                    <UserPlus className="h-4.5 w-4.5" />
                                </div>
                                <span>Customer</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="se_number"
                                className={cn(
                                    "flex items-center gap-3 px-8 py-3.5 rounded-none data-[state=active]:bg-cyan-100 data-[state=active]:shadow-none transition-all",
                                    "text-slate-600 font-medium text-[15px] border-r border-cyan-50"
                                )}
                            >
                                <div className={cn(
                                    "flex items-center justify-center w-8 h-8 rounded-full transition-all",
                                    activeTab === "se_number" ? "bg-cyan-700 text-white" : "border-2 border-cyan-700 text-cyan-700 bg-transparent"
                                )}>
                                    <FileText className="h-4.5 w-4.5" />
                                </div>
                                <span>Service Number</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="contact_details"
                                className={cn(
                                    "flex items-center gap-3 px-8 py-3.5 rounded-none data-[state=active]:bg-cyan-100 data-[state=active]:shadow-none transition-all",
                                    "text-slate-600 font-medium text-[15px] border-r border-cyan-50"
                                )}
                            >
                                <div className={cn(
                                    "flex items-center justify-center w-8 h-8 rounded-full transition-all",
                                    activeTab === "contact_details" ? "bg-cyan-700 text-white" : "border-2 border-cyan-700 text-cyan-700 bg-transparent"
                                )}>
                                    <Phone className="h-4.5 w-4.5" />
                                </div>
                                <span>Contact Details</span>
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
                                value="agreed_units"
                                className={cn(
                                    "flex items-center gap-3 px-8 py-3.5 rounded-none data-[state=active]:bg-cyan-100 data-[state=active]:shadow-none transition-all",
                                    "text-slate-600 font-medium text-[15px] border-r border-cyan-50"
                                )}
                            >
                                <div className={cn(
                                    "flex items-center justify-center w-8 h-8 rounded-full transition-all",
                                    activeTab === "agreed_units" ? "bg-cyan-700 text-white" : "border-2 border-cyan-700 text-cyan-700 bg-transparent"
                                )}>
                                    <LayoutGrid className="h-4.5 w-4.5" />
                                </div>
                                <span>Agreed Units</span>
                            </TabsTrigger>
                        </TabsList>

                        <div className="p-6">
                            <TabsContent value="customer" className="mt-0 space-y-6 pt-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 max-w-4xl">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Customer Name</label>
                                        <Input
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                            className="bg-white border-slate-300 h-10 text-sm focus:ring-blue-500"
                                            disabled={isPosted}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">City</label>
                                        <Input
                                            value={city}
                                            onChange={(e) => setCity(e.target.value)}
                                            className="bg-white border-slate-300 h-10 text-sm focus:ring-blue-500"
                                            disabled={isPosted}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Phone No</label>
                                        <Input
                                            value={phoneNo}
                                            onChange={(e) => setPhoneNo(e.target.value)}
                                            className="bg-white border-slate-300 h-10 text-sm focus:ring-blue-500"
                                            disabled={isPosted}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Email</label>
                                        <Input
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            type="email"
                                            className="bg-white border-slate-300 h-10 text-sm focus:ring-blue-500"
                                            disabled={isPosted}
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-semibold text-slate-700">Address</label>
                                        <Textarea
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            placeholder="Enter Address"
                                            maxLength={100}
                                            className="bg-white border-slate-300 min-h-[80px] text-sm focus:ring-blue-500"
                                            disabled={isPosted}
                                        />
                                        <div className="text-right text-xs text-slate-500">{address.length}/100</div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">GST Number</label>
                                        <Input
                                            value={gstNumber}
                                            onChange={(e) => setGstNumber(e.target.value)}
                                            placeholder="Enter GST Number"
                                            className="bg-white border-slate-300 h-10 text-sm focus:ring-blue-500"
                                            disabled={isPosted}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Status</label>
                                        <Select value={status} onValueChange={setStatus} disabled={isPosted}>
                                            <SelectTrigger className="bg-white border-slate-300 h-10 text-sm focus:ring-blue-500">
                                                <SelectValue placeholder="Select Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="inactive">Inactive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="se_number" className="mt-0 space-y-6 pt-2">
                                <div className="space-y-6 max-w-4xl">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50 p-4 rounded-lg border border-slate-200">
                                        <div className="md:col-span-3 space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Service Number</label>
                                            <Input
                                                value={newSeNumber}
                                                onChange={(e) => setNewSeNumber(e.target.value)}
                                                placeholder="Enter SE Number"
                                                className="bg-white border-slate-300 h-10 text-sm focus:ring-blue-500"
                                                disabled={isPosted}
                                            />
                                        </div>
                                        <div className="md:col-span-3 space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">KVA</label>
                                            <Select value={newKva} onValueChange={setNewKva} disabled={isPosted}>
                                                <SelectTrigger className="bg-white border-slate-300 h-10 text-sm focus:ring-blue-500">
                                                    <SelectValue placeholder="Select KVA" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {kvaList.length === 0 ? (
                                                        <SelectItem value="no-kva" disabled>No KVA found</SelectItem>
                                                    ) : (
                                                        kvaList.map(kva => (
                                                            // @ts-ignore - kva property from transmission_routes
                                                            <SelectItem key={kva.id} value={String(kva.id)}>
                                                                {kva.kva || kva.capacity}
                                                            </SelectItem>
                                                        ))
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="md:col-span-3 space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">EDC Circle</label>
                                            <Select value={newEdcCircle} onValueChange={setNewEdcCircle} disabled={isPosted}>
                                                <SelectTrigger className="bg-white border-slate-300 h-10 text-sm focus:ring-blue-500">
                                                    <SelectValue placeholder="Select Circle" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {edcList.length === 0 ? (
                                                        <SelectItem value="no-edc" disabled>
                                                            No EDC circles found
                                                        </SelectItem>
                                                    ) : (
                                                        edcList.map(edc => (
                                                            <SelectItem key={edc.id} value={edc.id.toString()}>
                                                                {edc.edc_name || edc.edc_circle || `EDC #${edc.id}`}
                                                            </SelectItem>
                                                        ))
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="md:col-span-3 space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Status</label>
                                            <Select value={newSeStatus} onValueChange={setNewSeStatus} disabled={isPosted}>
                                                <SelectTrigger className="bg-white border-slate-300 h-10 text-sm focus:ring-blue-500">
                                                    <SelectValue placeholder="Select Status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active">Active</SelectItem>
                                                    <SelectItem value="inactive">Inactive</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="md:col-span-12 space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Remarks</label>
                                            <Input
                                                value={newSeRemarks}
                                                onChange={(e) => setNewSeRemarks(e.target.value)}
                                                placeholder="Enter Remarks"
                                                maxLength={50}
                                                className="bg-white border-slate-300 h-10 text-sm focus:ring-blue-500"
                                                disabled={isPosted}
                                            />
                                            <div className="text-right text-xs text-slate-500">{newSeRemarks.length}/50</div>
                                        </div>
                                        <div className="md:col-span-12 flex justify-end pt-2">
                                            <Button
                                                onClick={handleAddSeNumber}
                                                className={cn("bg-cyan-700 hover:bg-cyan-800 text-white gap-2", isPosted && "opacity-50 cursor-not-allowed")}
                                                disabled={isPosted}
                                            >
                                                <UserPlus className="h-4 w-4" /> Add
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="border border-slate-200 rounded-md overflow-hidden">
                                        <table className="w-full text-sm text-left border-collapse">
                                            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                                                <tr>
                                                    <th className="px-4 py-3 w-16 border-r border-slate-200">#</th>
                                                    <th className="px-4 py-3 border-r border-slate-200">SE Number</th>
                                                    <th className="px-4 py-3 border-r border-slate-200">KVA</th>
                                                    <th className="px-4 py-3 border-r border-slate-200">EDC Circle</th>
                                                    <th className="px-4 py-3 border-r border-slate-200">Remarks</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {seNumbers.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                                                            No SE Numbers added yet.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    seNumbers.map((item, index) => (
                                                        <tr key={item.id} className="hover:bg-slate-50">
                                                            <td className="px-4 py-3 text-slate-500 border-r border-slate-100">{index + 1}</td>
                                                            <td className="px-4 py-3 font-medium text-slate-900 border-r border-slate-100">
                                                                {item.service_number ?? item.se_number ?? item.seNumber}
                                                            </td>
                                                            <td className="px-4 py-3 text-slate-600 border-r border-slate-100">
                                                                {/* @ts-ignore - kva from join or lookup */}
                                                                {item.kva || kvaList.find(k => String(k.id) === String(item.kva_id || item.kva))?.kva || item.kva_id || item.kva}
                                                            </td>
                                                            <td className="px-4 py-3 text-slate-600 border-r border-slate-100">
                                                                {edcList.find(e =>
                                                                    e.id.toString() === (
                                                                        item.edc_circle_id ?? item.edc_circle ?? item.edcCircle
                                                                    )?.toString()
                                                                )?.edc_name ||
                                                                    edcList.find(e =>
                                                                        e.id.toString() === (
                                                                            item.edc_circle_id ?? item.edc_circle ?? item.edcCircle
                                                                        )?.toString()
                                                                    )?.edc_circle ||
                                                                    item.edc_circle_id ||
                                                                    item.edc_circle ||
                                                                    item.edcCircle ||
                                                                    ""}
                                                            </td>
                                                            <td className="px-4 py-3 text-slate-600 border-r border-slate-100">{item.remarks}</td>
                                                            <td className="px-4 py-3 text-center flex justify-center gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className={cn("h-8 w-8 text-blue-500 hover:bg-blue-50", isPosted && "opacity-50 cursor-not-allowed")}
                                                                    disabled={isPosted}
                                                                    onClick={() => {
                                                                        setEditSeId(item.id);
                                                                        setNewSeNumber(
                                                                            (item.service_number ?? item.se_number ?? item.seNumber)?.toString() || ""
                                                                        );
                                                                        setNewKva((item.kva_id ?? item.kva)?.toString() || "");
                                                                        setNewEdcCircle(
                                                                            (item.edc_circle_id ?? item.edc_circle ?? item.edcCircle)?.toString() || ""
                                                                        );
                                                                        setNewSeRemarks(item.remarks || "");
                                                                        setNewSeStatus(
                                                                            item.status === 1 ||
                                                                                item.status === "1" ||
                                                                                item.status === "active"
                                                                                ? "active"
                                                                                : "inactive"
                                                                        );
                                                                    }}
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="contact_details" className="mt-0 space-y-6 pt-2">
                                <div className="space-y-6 max-w-6xl">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50 p-4 rounded-lg border border-slate-200">
                                        <div className="md:col-span-4 space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Contact Person</label>
                                            <Input
                                                value={newContactPerson}
                                                onChange={(e) => setNewContactPerson(e.target.value)}
                                                placeholder="Name"
                                                className="bg-white border-slate-300 h-10 text-sm focus:ring-blue-500"
                                                disabled={isPosted}
                                            />
                                        </div>
                                        <div className="md:col-span-4 space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Phone</label>
                                            <Input
                                                value={newContactNumber}
                                                onChange={(e) => setNewContactNumber(e.target.value)}
                                                placeholder="Phone Number"
                                                className="bg-white border-slate-300 h-10 text-sm focus:ring-blue-500"
                                                disabled={isPosted}
                                            />
                                        </div>
                                        <div className="md:col-span-4">
                                            <Button
                                                onClick={handleAddContact}
                                                className={cn("w-full bg-indigo-600 hover:bg-indigo-700 text-white h-10", isPosted && "opacity-50 cursor-not-allowed")}
                                                disabled={isPosted}
                                            >
                                                <UserPlus className="h-4 w-4 mr-2" /> Add
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="border border-slate-200 rounded-md overflow-hidden">
                                        <table className="w-full text-sm text-left border-collapse">
                                            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                                                <tr>
                                                    <th className="px-4 py-3 w-16 border-r border-slate-200">#</th>
                                                    <th className="px-4 py-3 border-r border-slate-200">Person Name</th>
                                                    <th className="px-4 py-3 border-r border-slate-200">Phone</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {contacts.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                                                            No contacts added yet.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    contacts.map((item, index) => (
                                                        <tr key={item.id} className="hover:bg-slate-50">
                                                            <td className="px-4 py-3 text-slate-500 border-r border-slate-100">{index + 1}</td>
                                                            <td className="px-4 py-3 font-medium text-slate-900 border-r border-slate-100">
                                                                {item.person || item.contact_person || item.contact_person_name}
                                                            </td>
                                                            <td className="px-4 py-3 text-slate-600 border-r border-slate-100">
                                                                {item.number || item.phone || item.phone_number}
                                                            </td>
                                                            <td className="px-4 py-3 text-center flex gap-2 justify-center">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className={cn("h-8 w-8 text-blue-500 hover:bg-blue-50", isPosted && "opacity-50 cursor-not-allowed")}
                                                                    disabled={isPosted}
                                                                    onClick={() => {
                                                                        setNewContactPerson(
                                                                            item.person || item.contact_person || item.contact_person_name || ""
                                                                        );
                                                                        setNewContactNumber(
                                                                            item.number || item.phone || item.phone_number || ""
                                                                        );
                                                                        setEditContactId(item.id);
                                                                    }}
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
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
                                                                disabled={isPosted}
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

                            <TabsContent value="agreed_units" className="mt-0 space-y-6 pt-2">
                                <div className="space-y-6 max-w-5xl">
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                        <div className="space-y-2 max-w-xs">
                                            <label className="text-sm font-semibold text-slate-700">Total Agreed Units</label>
                                            <Input
                                                type="number"
                                                value={totalAgreedUnits}
                                                onChange={(e) => setTotalAgreedUnits(e.target.value)}
                                                placeholder="Enter Total Agreed Units"
                                                className="bg-white border-slate-300 h-10 text-sm focus:ring-blue-500"
                                                disabled={isPosted}
                                            />
                                        </div>
                                    </div>

                                    <div className="border border-slate-200 rounded-md overflow-hidden">
                                        <table className="w-full text-sm text-center border-collapse">
                                            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                                                <tr>
                                                    <th className="px-4 py-3 border-r border-slate-200 text-left">Month</th>
                                                    <th className="px-4 py-3 border-r border-slate-200 w-32">C1</th>
                                                    <th className="px-4 py-3 border-r border-slate-200 w-32">C2</th>
                                                    <th className="px-4 py-3 border-r border-slate-200 w-32">C4</th>
                                                    <th className="px-4 py-3 border-r border-slate-200 w-32">C5</th>
                                                    <th className="px-4 py-3 w-32 bg-slate-200/50">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {unitAllocation.map((row, index) => {
                                                    const rowTotal = (Number(row.c1) || 0) + (Number(row.c2) || 0) + (Number(row.c4) || 0) + (Number(row.c5) || 0);
                                                    return (
                                                        <tr key={row.month} className="hover:bg-slate-50">
                                                            <td className="px-4 py-2 font-medium text-slate-900 border-r border-slate-100 text-left">{row.month}</td>
                                                            <td className="px-2 py-2 border-r border-slate-100">
                                                                <Input
                                                                    type="number"
                                                                    value={row.c1}
                                                                    onChange={(e) => handleAllocationChange(index, 'c1', e.target.value)}
                                                                    className="h-8 text-center text-xs"
                                                                    disabled={isPosted}
                                                                />
                                                            </td>
                                                            <td className="px-2 py-2 border-r border-slate-100">
                                                                <Input
                                                                    type="number"
                                                                    value={row.c2}
                                                                    onChange={(e) => handleAllocationChange(index, 'c2', e.target.value)}
                                                                    className="h-8 text-center text-xs"
                                                                    disabled={isPosted}
                                                                />
                                                            </td>
                                                            <td className="px-2 py-2 border-r border-slate-100">
                                                                <Input
                                                                    type="number"
                                                                    value={row.c4}
                                                                    onChange={(e) => handleAllocationChange(index, 'c4', e.target.value)}
                                                                    className="h-8 text-center text-xs"
                                                                    disabled={isPosted}
                                                                />
                                                            </td>
                                                            <td className="px-2 py-2 border-r border-slate-100">
                                                                <Input
                                                                    type="number"
                                                                    value={row.c5}
                                                                    onChange={(e) => handleAllocationChange(index, 'c5', e.target.value)}
                                                                    className="h-8 text-center text-xs"
                                                                    disabled={isPosted}
                                                                />
                                                            </td>
                                                            <td className="px-4 py-2 font-bold text-slate-700 bg-slate-50/50">
                                                                {rowTotal}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                <tr className="bg-slate-100 font-bold border-t border-slate-300">
                                                    <td className="px-4 py-3 text-left">
                                                        <span>Grand Total</span>
                                                    </td>
                                                    <td className="px-4 py-3">{unitAllocation.reduce((sum, row) => sum + (Number(row.c1) || 0), 0)}</td>
                                                    <td className="px-4 py-3">{unitAllocation.reduce((sum, row) => sum + (Number(row.c2) || 0), 0)}</td>
                                                    <td className="px-4 py-3">{unitAllocation.reduce((sum, row) => sum + (Number(row.c4) || 0), 0)}</td>
                                                    <td className="px-4 py-3">{unitAllocation.reduce((sum, row) => sum + (Number(row.c5) || 0), 0)}</td>
                                                    <td className="px-4 py-3 bg-slate-200">
                                                        {unitAllocation.reduce((sum, row) => sum + (Number(row.c1) || 0) + (Number(row.c2) || 0) + (Number(row.c4) || 0) + (Number(row.c5) || 0), 0)}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </div>

            <Dialog open={!!viewFile} onOpenChange={(open) => !open && setViewFile(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                    <DialogHeader>
                        <DialogTitle>{viewFile?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center justify-center p-4">
                        {viewFile?.file && viewFile.file.type.startsWith('image/') ? (
                            <img
                                src={URL.createObjectURL(viewFile.file)}
                                alt={viewFile.name}
                                className="max-w-full h-auto object-contain rounded-md"
                            />
                        ) : viewFile?.file && viewFile.file.type === 'application/pdf' ? (
                            <iframe
                                src={URL.createObjectURL(viewFile.file)}
                                className="w-full h-[600px] border-none rounded-md"
                                title={viewFile.name}
                            />
                        ) : (
                            <div className="text-center py-10 text-slate-500">
                                <p>File type not supported for preview.</p>
                                <p className="text-sm mt-2">{viewFile?.file?.name}</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={showPostConfirm} onOpenChange={setShowPostConfirm}>
                <AlertDialogContent className="max-w-[400px]">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Post Record?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Once posted, the customer record will become immutable. You will not be able to make further edits.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handlePost}
                            className="bg-slate-900 hover:bg-slate-800 text-white"
                        >
                            Post
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div >
    );
}
