import React, { useState, useEffect } from "react";
import { ArrowLeft, Calendar as CalendarIcon, X } from "lucide-react";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/services/api";
import { useToast } from "@/hooks/use-toast";

export default function WindmillEdit() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { id } = useParams(); // record ID for editing

    // Form state
    const [date, setDate] = useState<Date>();
    const [resumeDate, setResumeDate] = useState<Date>();
    const [notRunning, setNotRunning] = useState(false);
    const [remarks, setRemarks] = useState("");
    const [region, setRegion] = useState("tamil-nadu");
    const [units, setUnits] = useState<number | "">("");
    const [status, setStatus] = useState("Saved");
    const [windmillNumber, setWindmillNumber] = useState("");
    const [windmillList, setWindmillList] = useState<{ id: number; windmill_number: string }[]>([]);

    // Load windmills
    const fetchWindmills = async () => {
        try {
            const res = await api.get("/daily-generation/windmill-list");
            setWindmillList(res.data);
        } catch (err) {
            console.error("Failed to fetch windmills", err);
        }
    };

    // Load existing record if editing
    const fetchRecord = async (recordId: string) => {
        try {
            const res = await api.get(`/daily-generation/${recordId}`);
            const data = res.data.data;
            setRegion(data.region.toLowerCase().replace(" ", "-"));
            setDate(new Date(data.transaction_date));
            setWindmillNumber(data.windmill_number);
            setUnits(data.units || "");
            setStatus(data.status);
            setNotRunning(data.status === "Not Running");
            setResumeDate(data.expected_resume_date ? new Date(data.expected_resume_date) : undefined);
            setRemarks(data.remarks || "");
        } catch (err) {
            console.error("Failed to fetch record", err);
        }
    };

    useEffect(() => {
        fetchWindmills();
        if (id) fetchRecord(id);
    }, [id]);

    const handleUpdate = async () => {
        if (!id) return;

        if (!windmillNumber) {
            toast({ title: "Windmill required", description: "Please select a windmill before updating.", variant: "destructive" });
            return;
        }

        try {
            const payload = {
                region: region === "tamil-nadu" ? "Tamil Nadu" : "Karnataka",
                transaction_date: date?.toISOString().split("T")[0],
                windmill_number: windmillNumber,
                units: units !== "" ? Number(units) : null,
                expected_resume_date: resumeDate ? resumeDate.toISOString().split("T")[0] : null,
                remarks,
                status: notRunning ? "Not Running" : "Running",
                modified_by: "admin" // replace with actual user
            };

            const res = await api.put(`/daily-generation/update/${id}`, payload);
            toast({ title: "Updated", description: "Windmill transaction updated successfully." });
            navigate("/windmill");
        } catch (err: any) {
            console.error("Update failed", err);
            toast({ title: "Update failed", description: err?.response?.data?.detail || "Unable to update record.", variant: "destructive" });
        }
    };

    const handlePost = async () => {
        if (!id) return;

        if (!windmillNumber) {
            toast({ title: "Windmill required", description: "Please select a windmill before posting.", variant: "destructive" });
            return;
        }

        try {
            const payload = {
                region: region === "tamil-nadu" ? "Tamil Nadu" : "Karnataka",
                transaction_date: date?.toISOString().split("T")[0],
                windmill_number: windmillNumber,
                units: units !== "" ? Number(units) : null,
                expected_resume_date: resumeDate ? resumeDate.toISOString().split("T")[0] : null,
                remarks,
                status: notRunning ? "Not Running" : "Running",
                modified_by: "admin"
            };

            await api.put(`/daily-generation/update/${id}`, payload); // use update route
            toast({ title: "Posted", description: "Windmill transaction posted successfully." });
            navigate("/windmill");
        } catch (err: any) {
            console.error("Post failed", err);
            toast({ title: "Post failed", description: err?.response?.data?.detail || "Unable to post record.", variant: "destructive" });
        }
    };

    return (
        <div className="p-3 bg-slate-50 min-h-screen font-sans">
            <div className="w-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h1 className="text-lg font-semibold text-indigo-700">
                        Windmill Daily Transaction - Update
                    </h1>
                    <div className="flex gap-2">
                        <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white h-8 px-4" onClick={handleUpdate}>
                            Update
                        </Button>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-4" onClick={handlePost}>
                            Post
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-slate-600 border-slate-300 bg-white hover:bg-slate-50 h-8 w-8 p-0"
                            onClick={() => navigate("/windmill")}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Form */}
                <div className="p-4">
                    <div className="space-y-6 px-4 pt-2">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                            {/* Region */}
                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold text-slate-700">Region</Label>
                                <RadioGroup
                                    value={region}
                                    onValueChange={setRegion}
                                    className="flex items-center gap-4 h-9"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="tamil-nadu" id="tn" className="border-primary text-primary" />
                                        <Label htmlFor="tn" className="text-sm font-medium cursor-pointer text-slate-700">Tamil Nadu</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="karnataka" id="ka" className="border-primary text-primary" />
                                        <Label htmlFor="ka" className="text-sm font-medium cursor-pointer text-slate-700">Karnataka</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            {/* Date */}
                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold text-slate-700">Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn("w-full justify-start text-left font-normal border-slate-300 h-9 bg-white", !date && "text-muted-foreground")}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date ? formatDate(date) : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={setDate}
                                            initialFocus
                                            fromDate={startOfMonth(new Date())}
                                            toDate={endOfMonth(new Date())}
                                            showOutsideDays={false}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Wind Mill Number */}
                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold text-slate-700">Wind Mill Number</Label>
                                <Select value={windmillNumber} onValueChange={setWindmillNumber}>
                                    <SelectTrigger className="w-full border-slate-300 h-9 bg-white">
                                        <SelectValue placeholder="Select Wind Mill" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {windmillList.map((wm) => (
                                            <SelectItem key={wm.id} value={wm.windmill_number}>
                                                {wm.windmill_number}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Units */}
                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold text-slate-700">Units</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="w-full border-slate-300 h-9"
                                    placeholder="Enter units"
                                    value={units}
                                    onChange={(e) => setUnits(e.target.value ? Number(e.target.value) : "")}
                                />
                            </div>

                            {/* Status */}
                            <div className="space-y-1.5 flex flex-col justify-end pb-2">
                                <Label className="text-sm font-semibold text-slate-700 mb-1">Status</Label>
                                <RadioGroup
                                    value={notRunning ? "not-running" : "running"}
                                    onValueChange={(val) => setNotRunning(val === "not-running")}
                                    className="flex items-center gap-4"
                                >
                                    <div className="flex items-center gap-2">
                                        <RadioGroupItem value="running" id="running" />
                                        <Label htmlFor="running" className="text-sm font-medium cursor-pointer text-slate-700">Running</Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <RadioGroupItem value="not-running" id="not-running" />
                                        <Label htmlFor="not-running" className="text-sm font-medium cursor-pointer text-slate-700">Not Running</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            {/* Expected Resume Date */}
                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold text-slate-700">Expected Resume Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn("w-full justify-start text-left font-normal border-slate-300 h-9 bg-white", !resumeDate && "text-muted-foreground")}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {resumeDate ? (
                                                <span className="flex items-center justify-between w-full">
                                                    <span>{formatDate(resumeDate)}</span>
                                                    <button
                                                        type="button"
                                                        className="ml-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-400 hover:text-slate-600 focus:outline-none"
                                                        onPointerDown={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setResumeDate(undefined);
                                                        }}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setResumeDate(undefined);
                                                        }}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </span>
                                            ) : (
                                                <span>Pick resume date</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={resumeDate}
                                            onSelect={setResumeDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Remarks */}
                            <div className="col-span-1 md:col-span-3 space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <Label className="text-sm font-semibold text-slate-700">Remarks</Label>
                                    <div className="text-[10px] text-slate-400">{remarks.length}/300 characters</div>
                                </div>
                                <Textarea
                                    className="min-h-[80px] border-slate-300 resize-none w-full"
                                    placeholder="Enter any additional notes..."
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    maxLength={300}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}