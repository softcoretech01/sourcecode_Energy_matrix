import React, { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
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
import { toast } from "@/components/ui/use-toast";

export default function EdcMasterAdd() {
    const navigate = useNavigate();
    const [edcName, setEdcName] = useState("");
    const [saving, setSaving] = useState(false);

    const handleSave = async (isPost: boolean) => {
        if (!edcName.trim()) {
            toast({ variant: "destructive", title: "EDC Circle name is required" });
            return;
        }
        if (saving) return;
        setSaving(true);
        const token = localStorage.getItem("access_token");
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/edc-circle/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    edc_name: edcName.trim(),
                    status: "1",
                    is_submitted: isPost ? 1 : 0,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.detail || data.message || `HTTP ${res.status}`);
            }
            toast({ title: data.message || "EDC Circle saved successfully" });
            navigate("/master/edc-circle");
        } catch (err: any) {
            console.error("Save EDC error", err);
            const desc =
                typeof err === "string"
                    ? err
                    : err?.message || (err?.detail ? JSON.stringify(err.detail) : JSON.stringify(err));
            toast({
                variant: "destructive",
                title: "Failed to save EDC Circle",
                description: desc,
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
                        Master EDC Circle - Add
                    </h1>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white h-8 px-4 rounded-md transition-all shadow-sm"
                            disabled={saving}
                            onClick={() => handleSave(false)}
                        >
                            Save
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">EDC Circle</label>
                            <Input
                                placeholder="Enter EDC Circle"
                                className="bg-white border-slate-300 h-10 text-sm focus:ring-blue-500"
                                value={edcName}
                                onChange={(e) => setEdcName(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
