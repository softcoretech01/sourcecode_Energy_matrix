import React, { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, useParams } from "react-router-dom";

export default function InvestorsEdit() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [investorName, setInvestorName] = useState("");
    const [shareQuantity, setShareQuantity] = useState("");
    const [isPosted, setIsPosted] = useState(false);

    const handleAuthError = (statusCode: number, data: any) => {
        const tokenExpired = data?.detail === "Token expired" || data?.message === "Token expired";
        if (statusCode === 401 || tokenExpired) {
            localStorage.removeItem("access_token");
            alert("Session expired. Please log in again.");
            navigate("/login");
            return true;
        }
        return false;
    };

    const loadInvestor = async () => {
        if (!id) return;

        const token = localStorage.getItem("access_token");
        if (!token) {
            navigate("/login");
            return;
        }

        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/investors/${id}`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json().catch(() => null);
            if (!res.ok) {
                if (handleAuthError(res.status, data)) return;
                throw new Error(data?.detail || data?.message || "Failed to load investor data");
            }

            setInvestorName(data?.investor_name || "");
            setShareQuantity(String(data?.share_quantity ?? ""));
            setIsPosted(Number(data?.is_submitted || 0) === 1);
        } catch (error) {
            console.error(error);
            alert((error as Error).message || "Error loading investor");
        }
    };

    useEffect(() => {
        loadInvestor();
    }, [id]);

    const updateInvestor = async (isSubmitted = false) => {
        if (!id) return;

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
            status: 1,
        };

        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/investors/update/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json().catch(() => null);
            if (!res.ok) {
                if (handleAuthError(res.status, data)) return;
                throw new Error(data?.detail || data?.message || "Failed to update investor");
            }

            if (isSubmitted) {
                const submitRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/investors/submit/${id}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                const submitData = await submitRes.json().catch(() => null);
                if (!submitRes.ok) {
                    if (handleAuthError(submitRes.status, submitData)) return;
                    throw new Error(submitData?.detail || submitData?.message || "Failed to submit investor");
                }

                alert("Investor posted successfully");
                navigate("/master/investors");
                return;
            }

            alert("Investor updated successfully");
            setIsPosted(false);
            navigate("/master/investors");
        } catch (error) {
            console.error(error);
            alert((error as Error).message || "Error updating investor");
        }
    };

    return (
        <div className="p-3 bg-slate-50 min-h-screen font-sans">
            <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-100/30">
                    <h1 className="text-lg font-bold text-slate-800">Master Investors - Update</h1>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white h-8 px-4 rounded-md transition-all shadow-sm"
                            onClick={() => updateInvestor(false)}
                            disabled={isPosted}
                        >
                            Update
                        </Button>
                        <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-4 rounded-md transition-all shadow-sm"
                            onClick={() => updateInvestor(true)}
                            disabled={isPosted}
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
                                disabled={isPosted}
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
                                disabled={isPosted}
                            />
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

