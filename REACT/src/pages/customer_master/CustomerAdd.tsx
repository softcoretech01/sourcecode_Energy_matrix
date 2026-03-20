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
import { useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus, FileText, Phone, Upload, Eye, LayoutGrid, AlertTriangle } from "lucide-react";
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

export default function CustomerAdd() {
    // Store the created customer ID for use in other tabs
    const [createdCustomerId, setCreatedCustomerId] = useState<string | null>(null);
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("customer");
    const [status, setStatus] = useState("active");
    const [showPostConfirm, setShowPostConfirm] = useState(false);

    // basic customer info
    const [customerName, setCustomerName] = useState("");
    const [city, setCity] = useState("");
    const [phoneNo, setPhoneNo] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [gstNumber, setGstNumber] = useState("");

    // SE Number State
    const [seNumbers, setSeNumbers] = useState<{ id: number; seNumber: string; kva: string; edcCircle: number; remarks: string; status: string }[]>([]);
    const [newSeNumber, setNewSeNumber] = useState("");
    const [newKva, setNewKva] = useState("");
    const [newEdcCircle, setNewEdcCircle] = useState(""); // keep as string for Select, convert to number on save
    const [newSeRemarks, setNewSeRemarks] = useState("");
    const [newSeStatus, setNewSeStatus] = useState("active");
    const [edcList, setEdcList] = useState<{id: number; edc_name?: string; edc_circle?: string}[]>([]);
    const [kvaList, setKvaList] = useState<{ id: number; kva?: string; capacity?: string }[]>([]);

    React.useEffect(() => {
        async function fetchInitialData() {
            try {
                const token = localStorage.getItem("access_token");
                const headers = {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                };

                // Fetch EDC Circles
                const edcRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/edc-circle/`, { headers });
                if (edcRes.ok) {
                    const edcData = await edcRes.json();
                    setEdcList(edcData || []);
                }

                // Fetch KVA/Capacities from transmission loss master
                const kvaRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/transmission/list`, { headers });
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
    const [contacts, setContacts] = useState<{ id: number; person: string; number: string }[]>([]);
    const [newContactPerson, setNewContactPerson] = useState("");
    const [newContactNumber, setNewContactNumber] = useState("");

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



    const handleAddSeNumber = () => {
        if (!newSeNumber) {
            toast.error("Please enter a Service Number.");
            return;
        }
        if (!newKva) {
            toast.error("Please select a KVA.");
            return;
        }
        if (!newEdcCircle) {
            toast.error("Please select an EDC Circle.");
            return;
        }

        // Prevent adding exact duplicate SE (same number & KVA & EDC)
        const exists = seNumbers.some(se =>
            se.seNumber.toString() === newSeNumber.toString() &&
            se.kva.toString() === (newKva || "").toString() &&
            (se.edcCircle ?? "").toString() === (newEdcCircle || "").toString()
        );
        if (exists) {
            toast.error("This Service Number with the same KVA and EDC Circle is already added.");
            return;
        }

        setSeNumbers([
            ...seNumbers,
            {
                id: Date.now(),
                seNumber: newSeNumber,
                kva: newKva,
                edcCircle: newEdcCircle ? parseInt(newEdcCircle, 10) : (null as any), // Store as number or null
                remarks: newSeRemarks,
                status: newSeStatus
            },
        ]);
        setNewSeNumber("");
        setNewKva("");
        setNewEdcCircle("");
        setNewSeRemarks("");
        setNewSeStatus("active");
    };

    // save customer to backend
    // Save only the active tab
    const handleSave = async () => {
        let success = false;
        if (activeTab === "customer") {
            success = await saveCustomer();
        } else if (activeTab === "se_number") {
            success = await saveServiceNumber();
        } else if (activeTab === "contact_details") {
            success = await saveContactDetails();
        } else if (activeTab === "uploads") {
            success = await saveUploads();
        } else if (activeTab === "agreed_units") {
            success = await saveAgreedUnits();
        } else {
            toast.info("Nothing to save on this tab.");
            return;
        }

        if (success) {
            const tabSequence = ["customer", "se_number", "contact_details", "uploads", "agreed_units"];
            const currentIndex = tabSequence.indexOf(activeTab);
            if (currentIndex !== -1 && currentIndex < tabSequence.length - 1) {
                setActiveTab(tabSequence[currentIndex + 1]);
            }
        }
    };

    // Save Customer Tab
    const saveCustomer = async () => {
        if (email && !/^\S+@\S+\.\S+$/.test(email)) {
            toast.error("Please enter a valid email address.");
            return false;
        }
        const token = localStorage.getItem("access_token");
        if (!token) {
            toast.error("Not authenticated – please log in first.");
            navigate("/login");
            return false;
        }
        const payload: any = {
            customer_name: customerName,
            city,
            phone_no: phoneNo,
            address,
            gst_number: gstNumber,
            status: status === "active" ? 1 : 0,
            is_submitted: 0,
        };
        if (email) {
            payload.email = email;
        }
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customers`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            console.log("CustomerAdd saveCustomer response:", data);
            // Debug: Log ID assignment
            if (res.ok && data.id) {
                console.log('Setting createdCustomerId to', data.id);
            }
            if (res.ok) {
                if (data.id) {
                    setCreatedCustomerId(data.id.toString());
                }
                toast.success("Customer created successfully!");
                return true;
            } else {
                let errorMsg = "Failed to save customer";
                if (Array.isArray(data.detail)) {
                    errorMsg = data.detail.map(d => `${d.loc ? d.loc.join('.') : ''} ${d.msg}`).join(', ');
                } else if (data.detail) {
                    errorMsg = data.detail;
                }
                toast.error(errorMsg);
                return false;
            }
        } catch (err) {
            console.error(err);
            toast.error("Error connecting to backend");
            return false;
        }
    };

    // Save Service Number Tab
    const saveServiceNumber = async () => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            toast.error("Not authenticated – please log in first.");
            navigate("/login");
            return false;
        }
        // Use remembered customer ID if available
        let customerId = createdCustomerId;
        if (!customerId) {
            toast.error("Customer ID is required. Please save a customer first.");
            return false;
        }
        try {
            for (const se of seNumbers) {
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customers/${customerId}/se`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({
                        se_number: se.seNumber,
                        kva: se.kva,
                        edc_circle: se.edcCircle, // Already a number
                        status: se.status === "Active" || se.status === "active" ? 1 : 0,
                        remarks: se.remarks,
                    }),
                });
                let data = null;
                let text = await res.text();
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    data = text;
                }
                if (!res.ok) {
                    toast.error(`Error saving service number: ${text}`);
                    return false;
                }
            }
            toast.success("Service number(s) saved successfully.");
            return true;
        } catch (err) {
            console.error(err);
            toast.error("Error saving service number(s)");
            return false;
        }
    };

    // Save Contact Details Tab
    const saveContactDetails = async () => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            toast.error("Not authenticated – please log in first.");
            navigate("/login");
            return false;
        }
        // Use remembered customer ID if available
        let customerId = createdCustomerId;
        if (!customerId) {
            toast.error("Customer ID is required. Please save a customer first.");
            return false;
        }
        try {
            for (const c of contacts) {
                await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customers/${customerId}/contact`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({
                        contact_person_name: c.person,
                        phone_number: c.number,
                    }),
                });
            }
            toast.success("Contact(s) saved successfully.");
            return true;
        } catch (err) {
            console.error(err);
            toast.error("Error saving contact(s)");
            return false;
        }
    };

    const saveUploads = async () => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            toast.error("Not authenticated – please log in first.");
            navigate("/login");
            return false;
        }
        const customerId = createdCustomerId;
        if (!customerId) {
            toast.error("Save the customer first, then upload documents.");
            return false;
        }
        const hasFiles = documents.some(d => d.file);
        if (!hasFiles) {
            toast.info("No documents selected to upload.");
            return false;
        }
        const uploadFieldNames = [
            "ppa_upload",
            "share_transfer_upload",
            "share_certificate_upload",
            "pledge_upload",
            "share_holding_upload",
        ];
        const formData = new FormData();
        documents.forEach((doc, i) => {
            if (doc.file) formData.append(uploadFieldNames[i], doc.file);
        });
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customers/${customerId}/uploads`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            if (res.ok) {
                toast.success("Documents uploaded successfully.");
                return true;
            } else {
                const text = await res.text();
                toast.error("Upload failed: " + text);
                return false;
            }
        } catch (err) {
            console.error(err);
            toast.error("Error uploading documents");
            return false;
        }
    };

    const saveAgreedUnits = async () => {
        // 🔍 VALIDATION: Check if Total Agreed Units matches Grand Total
        const grandTotal = unitAllocation.reduce((sum, row) => 
            sum + (Number(row.c1) || 0) + (Number(row.c2) || 0) + (Number(row.c4) || 0) + (Number(row.c5) || 0), 0);
        
        const totalAgreed = Number(totalAgreedUnits) || 0;

        if (totalAgreed !== grandTotal) {
            const word = totalAgreed > grandTotal ? "High" : "Less";
            const proceed = window.confirm(`Warning: Total Agreed units is ${word} compared to Grand Total. Do you want to proceed?`);
            if (!proceed) return false;
        }

        const token = localStorage.getItem("access_token");
        if (!token) {
            toast.error("Not authenticated – please log in first.");
            navigate("/login");
            return false;
        }
        let customerId = createdCustomerId;
        if (!customerId) {
            toast.error("Customer ID is required. Please save a customer first.");
            return false;
        }
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customers/${customerId}/agreed-units`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    total_agreed_units: totalAgreedUnits,
                    unit_allocation: unitAllocation
                }),
            });
            if (res.ok) {
                toast.success("Agreed units saved successfully.");
                return true;
            } else {
                const text = await res.text();
                toast.error("Failed to save agreed units: " + text);
                return false;
            }
        } catch (err) {
            console.error(err);
            toast.error("Error saving agreed units");
            return false;
        }
    };

    const handlePost = async () => {
        const customerId = createdCustomerId;
        if (!customerId) {
            toast.error("Please save the customer details first before posting.");
            return;
        }

        const token = localStorage.getItem("access_token");
        const payload: any = {
            customer_name: customerName,
            city,
            phone_no: phoneNo,
            address,
            gst_number: gstNumber,
            status: status === "active" ? 1 : 0,
            is_submitted: 1,
        };
        if (email) payload.email = email;

        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customers/${customerId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                toast.success("Customer posted successfully!");
                navigate("/master/customers");
            } else {
                const text = await res.text();
                toast.error("Failed to post customer: " + text);
            }
        } catch (err) {
            console.error(err);
            toast.error("Error connecting to backend");
        }
    };

    const handleAddContact = () => {
        if (!newContactPerson) return;
        setContacts([
            ...contacts,
            {
                id: Date.now(),
                person: newContactPerson,
                number: newContactNumber
            }
        ]);
        setNewContactPerson("");
        setNewContactNumber("");
    };

    return (
        <div className="p-3 bg-slate-50 min-h-screen font-sans">
            {createdCustomerId && (
                <div className="mb-2 text-sm text-green-700 font-semibold">Current Customer ID: {createdCustomerId}</div>
            )}
            <div className="w-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-100/30">
                    <h1 className="text-lg font-bold text-slate-800">
                        Master Customer - Add
                    </h1>
                    <div className="flex gap-2">
                        <Button
    size="sm"
    className="bg-red-600 hover:bg-red-700 text-white h-8 px-4 rounded-md transition-all shadow-sm"
    onClick={handleSave}
>
    Save
</Button>
                        <Button
    size="sm"
    className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-4 rounded-md transition-all shadow-sm"
    onClick={() => setShowPostConfirm(true)}
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
    placeholder="Enter Customer Name"
    className="bg-white border-slate-300 h-10 text-sm focus:ring-blue-500"
/>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">City</label>
                                        <Input
    value={city}
    onChange={(e) => setCity(e.target.value)}
    placeholder="Enter City"
    className="bg-white border-slate-300 h-10 text-sm focus:ring-blue-500"
/>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Phone No</label>
                                        <Input
    value={phoneNo}
    onChange={(e) => setPhoneNo(e.target.value)}
    placeholder="Enter Phone No"
    className="bg-white border-slate-300 h-10 text-sm focus:ring-blue-500"
/>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Email</label>
                                        <Input
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    placeholder="Enter Email"
    type="email"
    className="bg-white border-slate-300 h-10 text-sm focus:ring-blue-500"
/>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-semibold text-slate-700">Address</label>
                                        <Textarea
    value={address}
    onChange={(e) => setAddress(e.target.value)}
    placeholder="Enter Address"
    className="bg-white border-slate-300 min-h-[80px] text-sm focus:ring-blue-500"
/>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">GST Number</label>
                                        <Input
    value={gstNumber}
    onChange={(e) => setGstNumber(e.target.value)}
    placeholder="Enter GST Number"
    className="bg-white border-slate-300 h-10 text-sm focus:ring-blue-500"
/>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Status</label>
                                        <Select value={status} onValueChange={setStatus}>
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
                                <div className="space-y-6 max-w-6xl">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50 p-4 rounded-lg border border-slate-200">
                                        <div className="md:col-span-3 space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Service Number</label>
                                            <Input
                                                value={newSeNumber}
                                                onChange={(e) => setNewSeNumber(e.target.value)}
                                                placeholder="Enter SE Number"
                                                className="bg-white border-slate-300 h-10 text-sm focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="md:col-span-3 space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">KVA</label>
                                            <Select value={newKva} onValueChange={setNewKva}>
                                                <SelectTrigger className="bg-white border-slate-300 h-10 text-sm focus:ring-blue-500">
                                                    <SelectValue placeholder="Select KVA" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {kvaList.length === 0 ? (
                                                        <SelectItem value="no-kva" disabled>No KVA found</SelectItem>
                                                    ) : (
                                                        kvaList.map(kva => (
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
                                            <Select value={newEdcCircle} onValueChange={setNewEdcCircle}>
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
                                            <Select value={newSeStatus} onValueChange={setNewSeStatus}>
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
                                                className="bg-white border-slate-300 h-10 text-sm focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="md:col-span-2 md:col-start-11">
                                            <Button
                                                onClick={handleAddSeNumber}
                                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-10"
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
                                                    <th className="px-4 py-3 border-r border-slate-200">SE Number</th>
                                                    <th className="px-4 py-3 border-r border-slate-200">KVA</th>
                                                    <th className="px-4 py-3 border-r border-slate-200">EDC Circle</th>
                                                    <th className="px-4 py-3 border-r border-slate-200">Status</th>
                                                    <th className="px-4 py-3 border-r border-slate-200">Remarks</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {seNumbers.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                                                            No SE Numbers added yet.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    seNumbers.map((item, index) => (
                                                        <tr key={item.id} className="hover:bg-slate-50">
                                                            <td className="px-4 py-3 text-slate-500 border-r border-slate-100">{index + 1}</td>
                                                            <td className="px-4 py-3 font-medium text-slate-900 border-r border-slate-100">{item.seNumber}</td>
                                                            <td className="px-4 py-3 text-slate-600 border-r border-slate-100">{item.kva}</td>
                                                            <td className="px-4 py-3 text-slate-600 border-r border-slate-100">
                                                                {edcList.find(e => e.id === item.edcCircle)?.edc_name ||
                                                                 edcList.find(e => e.id === item.edcCircle)?.edc_circle ||
                                                                 item.edcCircle}
                                                            </td>
                                                            <td className="px-4 py-3 text-slate-600 border-r border-slate-100 capitalize">{item.status}</td>
                                                            <td className="px-4 py-3 text-slate-600 border-r border-slate-100">{item.remarks}</td>
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
                                            />
                                        </div>
                                        <div className="md:col-span-4 space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Phone</label>
                                            <Input
                                                value={newContactNumber}
                                                onChange={(e) => setNewContactNumber(e.target.value)}
                                                placeholder="Phone Number"
                                                className="bg-white border-slate-300 h-10 text-sm focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="md:col-span-4">
                                            <Button
                                                onClick={handleAddContact}
                                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-10"
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
                                                            <td className="px-4 py-3 font-medium text-slate-900 border-r border-slate-100">{item.person}</td>
                                                            <td className="px-4 py-3 text-slate-600 border-r border-slate-100">{item.number}</td>
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
                                                                />
                                                            </td>
                                                            <td className="px-2 py-2 border-r border-slate-100">
                                                                <Input
                                                                    type="number"
                                                                    value={row.c2}
                                                                    onChange={(e) => handleAllocationChange(index, 'c2', e.target.value)}
                                                                    className="h-8 text-center text-xs"
                                                                />
                                                            </td>
                                                            <td className="px-2 py-2 border-r border-slate-100">
                                                                <Input
                                                                    type="number"
                                                                    value={row.c4}
                                                                    onChange={(e) => handleAllocationChange(index, 'c4', e.target.value)}
                                                                    className="h-8 text-center text-xs"
                                                                />
                                                            </td>
                                                            <td className="px-2 py-2 border-r border-slate-100">
                                                                <Input
                                                                    type="number"
                                                                    value={row.c5}
                                                                    onChange={(e) => handleAllocationChange(index, 'c5', e.target.value)}
                                                                    className="h-8 text-center text-xs"
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
