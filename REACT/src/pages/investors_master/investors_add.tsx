import React from "react";
import { ArrowLeft } from "lucide-react";
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

export default function InvestorsAdd() {
    const navigate = useNavigate();
    const [investorName, setInvestorName] = React.useState("");
    const [shareQuantity, setShareQuantity] = React.useState("");
    const [status, setStatus] = React.useState("active");

    const handleSave = async (isSubmitted = false) => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            alert("Not authenticated");
            navigate("/login");
            return;
        }

        if (!investorName.trim()) {
            alert("Investor Name is required");
            return;
        }

        const payload = {
            investor_name: investorName.trim(),
            share_quantity: Number(shareQuantity) || 0,
            status: status === "active" ? 1 : 0,
            is_submitted: isSubmitted ? 1 : 0,
        };

        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/investors/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json().catch(() => null);

            if (!res.ok) {
                const message = data?.detail || data?.message || "Failed to create investor";
                if (res.status === 401 || message === "Token expired") {
                    localStorage.removeItem("access_token");
                    alert("Session expired. Redirecting to login.");
                    navigate("/login");
                    return;
                }
                throw new Error(message);
            }

            if (isSubmitted) {
                alert("Investor posted successfully");
            } else {
                alert("Investor saved successfully");
            }
            navigate("/master/investors");
        } catch (error) {
            console.error(error);
            const errMsg = (error as Error).message || "Error saving investor";
            if (errMsg === "Token expired") {
                localStorage.removeItem("access_token");
                navigate("/login");
            } else {
                alert(errMsg);
            }
        }
    };

    const handlePost = async () => {
        await handleSave(true);
    };

    return (
        <div className="p-3 bg-slate-50 min-h-screen font-sans">
            <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-100/30">
                    <h1 className="text-lg font-bold text-slate-800">Master Investors - Add</h1>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white h-8 px-4 rounded-md transition-all shadow-sm"
                            onClick={() => handleSave(false)}
                        >
                            Save
                        </Button>
                        <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-4 rounded-md transition-all shadow-sm"
                            onClick={handlePost}
                        >
                            Post
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-slate-600 border-slate-300 bg-white hover:bg-slate-50 h-8 w-8 p-0 rounded-md transition-all"
                            onClick={() => navigate("/master/investors")}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Investor Name</label>
                            <Input
                                value={investorName}
                                onChange={(e) => setInvestorName(e.target.value)}
                                placeholder="Enter Investor Name"
                                className="bg-white border-slate-300 h-10 text-sm focus:ring-blue-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Share Quantity</label>
                            <Input
                                value={shareQuantity}
                                onChange={(e) => setShareQuantity(e.target.value)}
                                placeholder="Enter Share Quantity"
                                type="number"
                                className="bg-white border-slate-300 h-10 text-sm focus:ring-blue-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Status</label>
                            <Select value={status} onValueChange={(value) => setStatus(value)}>
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
                </div>
            </div>
        </div>
    );
}

