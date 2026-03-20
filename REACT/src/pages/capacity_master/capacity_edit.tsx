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
import { useNavigate, useParams } from "react-router-dom";
import api from "@/services/api";

export default function CapacityEdit() {

const navigate = useNavigate();
const { id } = useParams();

const [capacity, setCapacity] = useState("");
const [status, setStatus] = useState("");

useEffect(() => {
fetchCapacity();
}, []);

const fetchCapacity = async () => {
try {

const res = await api.get(`/capacity/${id}`);

setCapacity(res.data.capacity);
setStatus(res.data.status === 0 ? "active" : "inactive");

} catch (error) {
console.error("Error loading capacity", error);
}
};



const handleUpdate = async () => {
    try {
        const payload = {
            capacity: parseFloat(capacity),
            status: status === "active" ? 0 : 1,
            is_submitted: 0 // ✅ SAVE
        };

        await api.put(`/capacity/update/${id}`, payload);

        navigate("/master/capacity");

    } catch (error) {
        console.error(error);
        alert("Update failed");
    }
};



const handlePost = async () => {
    try {
        const payload = {
            capacity: parseFloat(capacity),
            status: status === "active" ? 0 : 1,
            is_submitted: 1
        };

        console.log("POST PAYLOAD:", payload);

        await api.put(`/capacity/update/${id}`, payload);

       

        navigate("/master/capacity");

    } catch (error) {
        console.error(error);
        
    }
};




return (
<div className="p-3 bg-slate-50 min-h-screen font-sans">

<div className="max-w-5xl mx-auto bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">

{/* Header */}

<div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-100/30">

<h1 className="text-lg font-bold text-slate-800">
Master Capacity - Update
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
onClick={() => navigate("/master/capacity")}
>
<ArrowLeft className="h-4 w-4" />
</Button>

</div>

</div>

{/* Form */}

<div className="p-6">

<div className="grid grid-cols-1 md:grid-cols-2 gap-6">

<div className="space-y-2">

<label className="text-sm font-semibold text-slate-700">
Capacity
</label>

<Input
type="number"
step="0.01"
value={capacity}
onChange={(e) => setCapacity(e.target.value)}
className="bg-white border-slate-300 h-10 text-sm"
/>

</div>

<div className="space-y-2">

<label className="text-sm font-semibold text-slate-700">
Status
</label>

<Select value={status} onValueChange={setStatus}>

<SelectTrigger className="bg-white border-slate-300 h-10 text-sm">
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