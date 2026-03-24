import React, { useState, useEffect } from "react";
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
import api from "@/services/api";


export default function CapacityAdd() {

const navigate = useNavigate();

const [capacity, setCapacity] = useState("");

const handleSave = async () => {
  try {

    const payload = {
      capacity: capacity,
      status: 1,
      is_submitted: 0
    };

    await api.post("/capacity/create", payload);

    
    navigate("/master/capacity");

  } catch (error) {
    console.error(error);
    alert("Failed to create capacity");
  }
};

const handlePost = async () => {
  try {

    const payload = {
      capacity: capacity,
      status: 1,
      is_submitted: 1
    };

    await api.post("/capacity/create", payload);

    
    navigate("/master/capacity");

  } catch (error) {
    console.error(error);
  }
};

return (
<div className="p-3 bg-slate-50 min-h-screen font-sans">
<div className="max-w-5xl mx-auto bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">

<div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-100/30">
<h1 className="text-lg font-bold text-slate-800">
Master Capacity - Add
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
className="text-slate-600 border-slate-300 bg-white hover:bg-slate-50 h-8 w-8 p-0 rounded-md"
onClick={() => navigate("/master/capacity")}
>
<ArrowLeft className="h-4 w-4" />
</Button>

</div>
</div>

<div className="p-6">

<div className="grid grid-cols-1 md:grid-cols-2 gap-6">

<div className="space-y-2">
<label className="text-sm font-semibold text-slate-700">
Capacity(mW)
</label>

<Input
placeholder="Enter Capacity"
type="number"
step="0.01"
value={capacity}
onChange={(e) => setCapacity(e.target.value)}
className="bg-white border-slate-300 h-10 text-sm"
/>

</div>



</div>

</div>
</div>
</div>
);
}