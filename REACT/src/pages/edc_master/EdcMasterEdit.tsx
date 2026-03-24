import React, { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";

export default function EdcMasterEdit() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [edcName, setEdcName] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const load = async () => {
            if (!id) return;
            const token = localStorage.getItem("access_token");
            try {
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/edc-circle/${id}`, {
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                    throw new Error(data.detail || data.message || `HTTP ${res.status}`);
                }
                setEdcName(data.edc_name || "");
                setIsSubmitted(data.is_submitted ?? 0);
            } catch (err: any) {
                console.error("Load EDC error", err);
                toast({
                    variant: "destructive",
                    title: "Failed to load EDC Circle",
                    description: err.message ?? String(err),
                });
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const handleSave = async (post: boolean) => {
        if (!edcName.trim()) {
            toast({ variant: "destructive", title: "EDC Circle name is required" });
            return;
        }
        if (!id || saving) return;
        setSaving(true);
        const token = localStorage.getItem("access_token");
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/edc-circle/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    edc_name: edcName.trim(),
                    status: "1",
                    is_submitted: post ? 1 : isSubmitted,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.detail || data.message || `HTTP ${res.status}`);
            }
            toast({ title: data.message || "EDC Circle updated successfully" });
            navigate("/master/edc-circle");
        } catch (err: any) {
            console.error("Update EDC error", err);
            toast({
                variant: "destructive",
                title: "Failed to update EDC Circle",
                description: err.message ?? String(err),
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-3 bg-slate-50 min-h-screen font-sans">
            <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-100/30">
                    <h1 className="text-lg font-bold text-slate-800">
                        Master EDC Circle - Update
                    </h1>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white h-8 px-4 rounded-md transition-all shadow-sm"
                            disabled={saving}
                            onClick={() => handleSave(false)}
                        >
                            Update
                        </Button>
                        <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-4 rounded-md transition-all shadow-sm"
                            disabled={saving}
                            onClick={() => handleSave(true)}
                        >
                            Post
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-slate-600 border-slate-300 bg-white hover:bg-slate-50 h-8 w-8 p-0 rounded-md transition-all"
                            onClick={() => navigate("/master/edc-circle")}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="text-center text-sm text-slate-500">Loading...</div>
                    ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">EDC Circle</label>
                            <Input
                                value={edcName}
                                onChange={(e) => setEdcName(e.target.value)}
                                className="bg-white border-slate-300 h-10 text-sm focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    )}
                </div>
            </div>
        </div>
    );
}
