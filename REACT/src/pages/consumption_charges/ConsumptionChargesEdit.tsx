import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, useParams } from "react-router-dom";
import { Calendar as CalendarIcon, ArrowLeft } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn, formatDate } from "@/lib/utils";
import api from "@/services/api";
import { format } from "date-fns";

export default function ConsumptionChargesEdit() {
    const navigate = useNavigate();
    const { id } = useParams();
   const [energyType, setEnergyType] = useState("windmill");
   
const [chargeCode, setChargeCode] = useState("");
const [chargeName, setChargeName] = useState("");
const [cost, setCost] = useState("");
const [uom, setUom] = useState("per_unit");
const [type, setType] = useState("unit");
const [description, setDescription] = useState("");
const [validUpto, setValidUpto] = useState<Date>();
const [discount, setDiscount] = useState("50");
const [showFormula, setShowFormula] = useState(false);
   
    const getUomLabel = (val: string) => {
        if (val === "per_unit") return "unit";
        if (val === "paisa") return "paisa";
        if (val === "per_month_per_windmill") return "month/windmill";
        if (val === "per_megawatt") return "megawatt";
        return "uom";
    };

    const costDisplay = `${cost || "Cost"}/${uom ? getUomLabel(uom) : "uom"}/${type || "type"}`;

   useEffect(() => {
  if (id) {
    fetchConsumption();
  }
}, []);

const fetchConsumption = async () => {
  try {
    const res = await api.get(`/consumption/${id}`);
    const data = res.data;

    setEnergyType(data.energy_type);
    setChargeCode(data.charge_code);
    setChargeName(data.charge_name);
    setCost(data.cost?.toString() || "");
    setUom(data.uom);
    setType(data.type);
    setDescription(data.charge_description || "");
    setDiscount("50");

    if (data.valid_upto) {
      setValidUpto(new Date(data.valid_upto));
    }

  } catch (error) {
    console.error("Error loading consumption", error);
  }
};

  const handleUpdate = async () => {
  try {
    const payload = {
      energy_type: energyType,
      charge_code: chargeCode,
      charge_name: chargeName,
      cost: parseFloat(cost) || 0,
      uom: uom,
      type: type,
      charge_description: description,
      valid_upto: validUpto ? format(validUpto, "yyyy-MM-dd") : null,
      discount_charges: 50,
      is_submitted: 0,
    };

    await api.put(`/consumption/update/${id}`, payload);

    navigate("/master/consumption-charges");

  } catch (error) {
    console.error(error);
    alert("Update failed");
  }
};
 const handlePost = async () => {
  try {
    const payload = {
      energy_type: energyType,
      charge_code: chargeCode,
      charge_name: chargeName,
      cost: parseFloat(cost) || 0,
      uom: uom,
      type: type,
      charge_description: description,
      valid_upto: validUpto ? format(validUpto, "yyyy-MM-dd") : null,
      discount_charges: 50,
      is_submitted: 1,
    };

    await api.put(`/consumption/update/${id}`, payload);

    navigate("/master/consumption-charges");

  } catch (error) {
    console.error(error);
  }
};
    return (
        <div className="p-3 bg-slate-50 min-h-screen font-sans">
            <div className="w-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h1 className="text-lg font-semibold text-indigo-700">
                        Consumption Charges - Update
                    </h1>
                    <div className="flex gap-2">
                         <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white h-8 px-4"
              onClick={handleUpdate}
            >
              Update
            </Button>
                         <Button
              size="sm"
              className="bg-emerald-600 text-white"
              onClick={handlePost}
            >
              Post
            </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-slate-600 border-slate-300 bg-white hover:bg-slate-50 h-8 w-8 p-0"
                            onClick={() => navigate("/master/consumption-charges")}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="p-4">
                    <div className="space-y-6 px-4 pt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700">Energy</label>
                                <div className="flex gap-4 items-center h-9">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                       <input
  type="radio"
  value="windmill"
  checked={energyType === "windmill"}
  onChange={() => setEnergyType("windmill")}
/>
                                        <span className="text-sm text-slate-700">Windmill</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
  type="radio"
  value="solar"
  checked={energyType === "solar"}
  onChange={() => setEnergyType("solar")}
/>
                                        <span className="text-sm text-slate-700">Solar</span>
                                    </label>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700">Charge Code</label>
                               <Input value={chargeCode} onChange={(e) => setChargeCode(e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700">Charge Name</label>
                                <Input value={chargeName} onChange={(e) => setChargeName(e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700">Cost</label>
                               <Input value={cost} onChange={(e) => setCost(e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700">UOM</label>
                                
                                <Select value={uom} onValueChange={setUom}>
                                    <SelectTrigger className="bg-white border-slate-300 h-9 text-xs">
                                        <SelectValue placeholder="Select UOM" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="per_unit">Per Unit</SelectItem>
                                        <SelectItem value="paisa">Paisa</SelectItem>
                                        <SelectItem value="per_month_per_windmill">Per Month Per Windmill</SelectItem>
                                        <SelectItem value="per_megawatt">Per Megawatt</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700">Type</label>
                                <Select value={type} onValueChange={setType}>
                                    <SelectTrigger className="bg-white border-slate-300 h-9 text-xs">
                                        <SelectValue placeholder="Select Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="day">Day</SelectItem>
                                        <SelectItem value="unit">Unit</SelectItem>
                                        <SelectItem value="year">Year</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700">Charge Description</label>
                               
                                <Input value={description} onChange={(e) => setDescription(e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700">Valid upto</label>
                               <Popover>
  <PopoverTrigger asChild>
    <Button
      variant="outline"
      className={cn(
        "w-full justify-start text-left font-normal bg-white border-slate-300 h-9",
        !validUpto && "text-muted-foreground"
      )}
    >
      <CalendarIcon className="mr-2 h-4 w-4" />
      {validUpto ? formatDate(validUpto) : "Select date"}
    </Button>
  </PopoverTrigger>

  <PopoverContent className="w-auto p-0">
    <Calendar
      mode="single"
      selected={validUpto}
      onSelect={setValidUpto}
      initialFocus
    />
  </PopoverContent>
</Popover>
                            </div>
                            <div className="space-y-1.5 flex flex-col">
                                <label className="text-sm font-semibold text-slate-700">Discount Charges</label>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center justify-center px-4 py-2 bg-slate-100 border border-slate-300 rounded h-9 min-w-[120px] text-sm font-medium text-slate-700">
                                        50%
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowFormula(!showFormula)}
                                        className="h-9 px-3 bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 whitespace-nowrap text-xs shadow-sm"
                                    >
                                        {showFormula ? "Hide" : "Show Formula"}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {showFormula && (
                            <div className="pt-6 mt-6 border-t border-slate-200">
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 inline-block animate-in fade-in zoom-in duration-200">
                                    <div className="flex items-center gap-6 text-sm">
                                        <span className="font-bold text-slate-700 uppercase tracking-widest text-xs">Formula</span>
                                        <div className="flex flex-col items-center justify-center font-medium text-slate-800">
                                            <div className="pb-2 border-b-2 border-slate-300 w-full text-center">
                                                <span className="bg-white px-2 py-1 rounded shadow-sm border border-slate-200 mr-2">( {costDisplay} / 2 )</span>
                                                <span className="mx-1 text-slate-500">×</span>
                                                <span className="ml-2">365 <span className="text-xs text-slate-500 font-normal italic">(Days in a year)</span></span>
                                                <span className="mx-2 text-slate-500">×</span>
                                                <span className="text-slate-800">No. of days in a month</span>
                                            </div>
                                            <div className="pt-2 text-center">
                                                <span>Total units generated by windmill per month</span>
                                                <span className="mx-2 text-slate-500">−</span>
                                                <span className="text-slate-500 font-light">(</span>
                                                <span>Total units generated by windmill per month</span>
                                                <span className="mx-2 text-slate-500">×</span>
                                                <span>Transmission Loss</span>
                                                <span className="text-slate-500 font-light">)</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

