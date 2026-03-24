import React, { useState } from "react";
import { ArrowLeft, Calendar as CalendarIcon, Save, X } from "lucide-react";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function WindmillAdd() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [date, setDate] = useState<Date>();
    const [resumeDate, setResumeDate] = useState<Date>();
    const [notRunning, setNotRunning] = useState(false);
    const [remarks, setRemarks] = useState("");
    const [region, setRegion] = useState("tamil-nadu");
    const [windmillNumber, setWindmillNumber] = useState("");
    const [units, setUnits] = useState("");
    const [windmills, setWindmills] = useState<any[]>([]);


useEffect(() => {
  fetchWindmills();
}, []);

const fetchWindmills = async () => {
  try {
    const res = await api.get("/daily-generation/windmill-list");
    setWindmills(res.data);
  } catch (error) {
    console.error("Failed to fetch windmills", error);
  }
};



const handleSave = async () => {
  const unitsValue = parseFloat(units?.toString() || "");
  if (!windmillNumber) {
    toast({ title: "Windmill required", description: "Please select a windmill before saving.", variant: "destructive" });
    return;
  }

  try {
    const payload = {
      region: region === "tamil-nadu" ? "Tamil Nadu" : "Karnataka",
      transaction_date: date ? format(date, "yyyy-MM-dd") : null,
      windmill_number: windmillNumber,
      units: units ? unitsValue : null,
      expected_resume_date: resumeDate
        ? format(resumeDate, "yyyy-MM-dd")
        : null,
      remarks: remarks,
      status: notRunning ? "Not Running" : "Running",
      created_by: "admin",
    };

    await api.post("/daily-generation/save", payload);
    toast({ title: "Saved", description: "Windmill transaction saved successfully." });
    navigate("/windmill");
  } catch (error: any) {
    console.error("Save failed", error);
    toast({ title: "Save failed", description: error?.response?.data?.detail || "Unable to save record." , variant: "destructive" });
  }
};



const handlePost = async () => {
  const unitsValue = parseFloat(units?.toString() || "");
  if (!windmillNumber) {
    toast({ title: "Windmill required", description: "Please select a windmill before posting.", variant: "destructive" });
    return;
  }

  try {
    const payload = {
      region: region === "tamil-nadu" ? "Tamil Nadu" : "Karnataka",
      transaction_date: date ? format(date, "yyyy-MM-dd") : null,
      windmill_number: windmillNumber,
      units: units ? unitsValue : null,
      expected_resume_date: resumeDate
        ? format(resumeDate, "yyyy-MM-dd")
        : null,
      remarks: remarks,
      status: notRunning ? "Not Running" : "Running",
      created_by: "admin",
    };

    await api.post("/daily-generation/post", payload);
    toast({ title: "Posted", description: "Windmill transaction posted successfully." });
    navigate("/windmill");
  } catch (error: any) {
    console.error("Post failed", error);
    toast({ title: "Post failed", description: error?.response?.data?.detail || "Unable to post record." , variant: "destructive" });
  }
};



    return (
        <div className="p-3 bg-slate-50 min-h-screen font-sans">
            <div className="w-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h1 className="text-lg font-semibold text-indigo-700">
                        Windmill Daily Transaction - Add
                    </h1>
                    <div className="flex gap-2">
                        <Button
  size="sm"
  className="bg-red-600 hover:bg-red-700 text-white h-8 px-4"
  onClick={handleSave}
>
  Save
</Button>
                        <Button
  size="sm"
  className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-4"
  onClick={handlePost}
>
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

                <div className="p-4">
                    <div className="space-y-6 px-4 pt-2">
                        {/* Form Fields - 3 column grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">

                            {/* Region */}
                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold text-slate-700">
                                    Region
                                </Label>
                                <RadioGroup
                                    defaultValue="tamil-nadu"
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
                                <Label className="text-sm font-semibold text-slate-700">
                                    Date
                                </Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal border-slate-300 h-9 bg-white",
                                                !date && "text-muted-foreground"
                                            )}
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
                                <Label className="text-sm font-semibold text-slate-700">
                                    Wind Mill Number
                                </Label>
                               <Select value={windmillNumber} onValueChange={setWindmillNumber}>
  <SelectTrigger className="w-full border-slate-300 h-9 bg-white">
    <SelectValue placeholder="Select Wind Mill" />
  </SelectTrigger>
  <SelectContent>
    {windmills.map((wm) => (
      <SelectItem key={wm.id} value={wm.windmill_number}>
        {wm.windmill_number}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
                            </div>

                            {/* Units */}
                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold text-slate-700">
                                    Units
                                </Label>
                                <Input
  type="number"
  step="0.01"
  min="0"
  className="w-full border-slate-300 h-9"
  placeholder="Enter units"
  value={units}
  onChange={(e) => setUnits(e.target.value)}
/>
                            </div>

                            {/* Status selector */}
                            <div className="space-y-1.5 flex flex-col justify-end pb-2">
                                <Label className="text-sm font-semibold text-slate-700 mb-1">
                                    Status
                                </Label>
                                <RadioGroup
                                    value={notRunning ? "not-running" : "running"}
                                    onValueChange={(val) => setNotRunning(val === "not-running")}
                                    className="flex items-center gap-4"
                                >
                                    <div className="flex items-center gap-2">
                                        <RadioGroupItem value="running" id="running" />
                                        <Label htmlFor="running" className="text-sm font-medium cursor-pointer text-slate-700">
                                            Running
                                        </Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <RadioGroupItem value="not-running" id="not-running" />
                                        <Label htmlFor="not-running" className="text-sm font-medium cursor-pointer text-slate-700">
                                            Not Running
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            {/* Expected Resume Date */}
                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold text-slate-700">
                                    Expected Resume Date
                                </Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal border-slate-300 h-9 bg-white",
                                                !resumeDate && "text-muted-foreground"
                                            )}
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

                            {/* Remarks - spanning 3 columns */}
                            <div className="col-span-1 md:col-span-3 space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <Label className="text-sm font-semibold text-slate-700">
                                        Remarks
                                    </Label>
                                    <div className="text-[10px] text-slate-400">
                                        {remarks.length}/300 characters
                                    </div>
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
