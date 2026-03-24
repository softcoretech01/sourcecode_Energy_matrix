import React, { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";

export default function EmailMasterAdd() {

const [formData, setFormData] = useState({
  email_id: "",
  email_category: "",
  email_time: "",
  occurrences: "",
  email_to: "",
  email_cc: "",
  email_subject: "",
  email_content: "",
  status: 1,
  is_submitted: 0
});

const navigate = useNavigate();



const handleChange = (e) => {
  const { name, value } = e.target;

  setFormData({
  ...formData,
  [name]: name === "occurrences" ? Number(value) : value
});
};


const handleSave = async () => {
  try {
    await api.post("/email-master/", {
      ...formData,
      occurrences: Number(formData.occurrences),
      email_time: formData.email_time + ":00",
      status: 1,
      is_submitted: 0
    });

    
    navigate("/master/email");

  } catch (error) {
    console.error("Save failed:", error.response?.data);
  }
};


const handlePost = async () => {
  try {
    await api.post("/email-master/", {
      ...formData,
      status: 1,
      is_submitted: 1
    });

   
    navigate("/master/email");

  } catch (error) {
    console.error("Post failed:", error);
  }
};
    return (
        <div className="p-3 bg-slate-50 min-h-screen font-sans">
            <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-100/30">
                    <h1 className="text-lg font-bold text-slate-800">
                        Master Email - Add
                    </h1>
                    <div className="flex gap-2">
                        <Button
  size="sm"
  className="bg-primary hover:bg-primary/90 text-white"
  onClick={handleSave}
>
  Save
</Button>
                        <Button
  size="sm"
  className="bg-emerald-600 hover:bg-emerald-700 text-white"
  onClick={handlePost}
>
  Post
</Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-slate-600 border-slate-300 bg-white hover:bg-slate-50 h-8 w-8 p-0 rounded-md transition-all"
                            onClick={() => navigate("/master/email")}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Email ID</label>
                            <Input
  name="email_id"
  value={formData.email_id}
  onChange={handleChange}
  placeholder="Enter Email ID"
  type="email"
/>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Email Category</label>
                            <Input
  name="email_category"
  value={formData.email_category}
  onChange={handleChange}
  placeholder="Enter Category"
/>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Email Time</label>
                          <Input
  name="email_time"
  type="time"
  value={formData.email_time}
  onChange={handleChange}
/>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Occurrences</label>
                            <Input
  name="occurrences"
  value={formData.occurrences}
  onChange={handleChange}
  type="number"
/>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Email To</label>
                            <Input
  name="email_to"
  value={formData.email_to}
  onChange={handleChange}
/>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Email CC</label>
                           <Input
  name="email_cc"
  value={formData.email_cc}
  onChange={handleChange}
  placeholder="Enter CC Recipients"
/>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-semibold text-slate-700">Email Subject</label>
                           <Input
  name="email_subject"
  value={formData.email_subject}
  onChange={handleChange}
  placeholder="Enter Subject"
/>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-semibold text-slate-700">Email Content</label>
                           <Textarea
  name="email_content"
  value={formData.email_content}
  onChange={handleChange}
  placeholder="Enter Email Content"
/>
                            
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
