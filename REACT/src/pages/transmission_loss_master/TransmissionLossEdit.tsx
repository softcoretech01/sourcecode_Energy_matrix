import React, { useState, useEffect } from "react";
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
import { useNavigate, useParams } from "react-router-dom";
import api from "@/services/api";

export default function TransmissionLossEdit() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [kva, setKva] = useState("");
    const [lossPercentage, setLossPercentage] = useState("");
    const [remarks, setRemarks] = useState("");
    const [fromDate, setFromDate] = useState<Date | undefined>();

    // ✅ FETCH DATA
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get(`/transmission/${id}`);
                const data = res.data[0];

                setKva(data.kva);
                setLossPercentage(data.loss_percentage);
                setRemarks(data.remarks);
                setFromDate(new Date(data.valid_from));

            } catch (err) {
                console.error("Fetch failed", err);
            }
        };

        if (id) fetchData();
    }, [id]);

    // ✅ UPDATE FUNCTION
    const handleUpdate = async (isSubmitted: number) => {
        try {
           await api.put(`/transmission/update/${id}`, {
    kva,
    loss_percentage: parseFloat(lossPercentage),
    valid_from: fromDate ? format(fromDate, "yyyy-MM-dd") : null,
    remarks,
    is_submitted: isSubmitted
});

    

            navigate("/master/transmission-loss");

        } catch (err) {
            console.error("Update failed", err);
        }
    };

    return (
        <div className="p-3 bg-slate-50 min-h-screen font-sans">
            <div className="w-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">

                {/* Header */}
                <div className="px-4 py-3 border-b flex justify-between items-center bg-slate-50">
                    <h1 className="text-lg font-semibold text-indigo-700">
                        Transmission Loss Master - Update
                    </h1>

                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            className="bg-red-600 text-white"
                            onClick={() => handleUpdate(0)} // SAVE
                        >
                            Update
                        </Button>

                        <Button
                            size="sm"
                            className="bg-emerald-600 text-white"
                            onClick={() => handleUpdate(1)} // POST
                        >
                            Post
                        </Button>

                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate("/master/transmission-loss")}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                        {/* KVA */}
                        <div>
                            <Label>KVA</Label>
                            <Input
                                value={kva}
                                onChange={(e) => setKva(e.target.value)}
                            />
                        </div>

                        {/* LOSS */}
                        <div>
                            <Label>Loss %</Label>
                            <Input
                                value={lossPercentage}
                                onChange={(e) => setLossPercentage(e.target.value)}
                            />
                        </div>

                        {/* DATE */}
                        <div>
                            <Label>Valid From</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button className="w-full justify-start">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {fromDate ? format(fromDate, "yyyy-MM-dd") : "Select date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent>
                                    <Calendar
                                        mode="single"
                                        selected={fromDate}
                                        onSelect={setFromDate}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* REMARKS */}
                        <div className="col-span-3">
                            <Label>Remarks</Label>
                            <Textarea
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                            />
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}