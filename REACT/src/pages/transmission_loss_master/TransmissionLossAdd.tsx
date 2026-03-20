import React, { useState } from "react";
import { ArrowLeft, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { useEffect } from "react";
import axios from "axios";



export default function TransmissionLossAdd() {
    const navigate = useNavigate();
    const [fromDate, setFromDate] = useState<Date>();
    const [toDate, setToDate] = useState<Date>();
    const [kva, setKva] = useState("");
const [lossPercentage, setLossPercentage] = useState("");
const [remarks, setRemarks] = useState("");
const [loading, setLoading] = useState(false);


const handleSubmit = async (status: "Saved" | "Posted") => {
    try {
        if (!kva || !lossPercentage || !fromDate) {
            alert("Please fill all required fields");
            return;
        }

        const payload = {
            kva,
            loss_percentage: parseFloat(lossPercentage),
            remarks,
            valid_from: fromDate.toISOString().split("T")[0],
            is_submitted: status === "Posted" ? 1 : 0, // ✅ FIX HERE
        };

        await api.post("/transmission/create", payload);

       
        navigate("/master/transmission-loss");

    } catch (err: any) {
        console.error("Error:", err.response?.data);
        alert(err.response?.data?.detail || "Failed to save data");
    }
};
    return (
        <div className="p-3 bg-slate-50 min-h-screen font-sans">
            <div className="w-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h1 className="text-lg font-semibold text-indigo-700">
                        Transmission Loss Master - Add
                    </h1>
                    <div className="flex gap-2">
                       <Button
  size="sm"
  className="bg-red-600 hover:bg-red-700 text-white h-8 px-4"
  onClick={() => handleSubmit("Saved")}
>
  Save
</Button>
                       <Button
  size="sm"
  className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-4"
  onClick={() => handleSubmit("Posted")}
>
  Post
</Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-slate-600 border-slate-300 bg-white hover:bg-slate-50 h-8 w-8 p-0"
                            onClick={() => navigate("/master/transmission-loss")}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="p-4">
                    <div className="space-y-6 px-4 pt-2">
                        {/* Form Fields - 3 column grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold text-slate-700">KVA</Label>
                               <Input
  placeholder="Enter KVA"
  value={kva}
  onChange={(e) => setKva(e.target.value)}
/>

                            </div>


                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold text-slate-700">Loss Percentage (%)</Label>
                               <Input
  placeholder="Enter Loss %"
  value={lossPercentage}
  onChange={(e) => setLossPercentage(e.target.value)}
/>
                            </div>


                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold text-slate-700">Valid From</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal bg-white border-slate-300 h-9 text-xs",
                                                !fromDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-3 w-3" />
                                            {fromDate ? format(fromDate, "P") : <span className="text-xs">dd-mm-yyyy</span>}
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




                            <div className="col-span-1 md:col-span-3 space-y-1.5">
                                <Label className="text-sm font-semibold text-slate-700">Remarks</Label>
                               <Textarea
  placeholder="Enter remarks..."
  value={remarks}
  onChange={(e) => setRemarks(e.target.value)}
/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
