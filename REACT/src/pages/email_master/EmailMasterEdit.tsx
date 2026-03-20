import React, { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/services/api";

export default function EmailMasterEdit() {

  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    email_id: "",
    email_category: "",
    email_time: "",
    occurrences: "",
    email_to: "",
    email_cc: "",
    email_subject: "",
    email_content: "",
    is_submitted: 0
  });

  useEffect(() => {
  if (id) {
    fetchEmail();
  }
}, [id]);

  const fetchEmail = async () => {
  try {
    const response = await api.get(`/email-master/${id}`);

    const { id: _, ...data } = response.data;

    setFormData(data);
  } catch (error) {
    console.error("Fetch failed:", error);
  }
};

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleUpdate = async () => {
  try {

    const payload = {
      ...formData,
      email_time:
        formData.email_time.length === 5
          ? formData.email_time + ":00"
          : formData.email_time,
      occurrences: Number(formData.occurrences)
    };

    await api.put(`/email-master/${id}`, payload);

    navigate("/master/email");

  } catch (error) {
    console.error("Update failed:", error);
  }
};



const handlePost = async () => {
  try {

    const payload = {
      email_id: formData.email_id,
      email_category: formData.email_category,
      email_time:
        formData.email_time.length === 5
          ? formData.email_time + ":00"
          : formData.email_time,
      occurrences: Number(formData.occurrences),
      email_to: formData.email_to,
      email_cc: formData.email_cc,
      email_subject: formData.email_subject,
      email_content: formData.email_content,
      is_submitted: 1
    };

    console.log("POST DATA:", payload);

    await api.put(`/email-master/${id}`, payload);

    navigate("/master/email");

  } catch (error) {
    console.error("Post failed:", error.response?.data || error);
  }
};

  return (
    <div className="p-3 bg-slate-50 min-h-screen font-sans">

      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">

        {/* Header */}

        <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-100/30">

          <h1 className="text-lg font-bold text-slate-800">
            Master Email - Update
          </h1>

          <div className="flex gap-2">

            <Button
              size="sm"
              onClick={handleUpdate}
              className="bg-red-600 hover:bg-red-700 text-white h-8 px-4 rounded-md"
            >
              Update
            </Button>

            <Button
  size="sm"
  onClick={handlePost}
  className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-4 rounded-md"
>
  Post
</Button>

            <Button
              size="sm"
              variant="outline"
              className="text-slate-600 border-slate-300 bg-white hover:bg-slate-50 h-8 w-8 p-0"
              onClick={() => navigate("/master/email")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

          </div>

        </div>

        {/* Form */}

        <div className="p-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div className="space-y-2">
              <label>Email ID</label>
              <Input
                name="email_id"
                value={formData.email_id}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <label>Email Category</label>
              <Input
                name="email_category"
                value={formData.email_category}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <label>Email Time</label>
              <Input
  type="time"
  name="email_time"
  value={formData.email_time}
  onChange={handleChange}
/>
            </div>

            <div className="space-y-2">
              <label>Occurrences</label>
              <Input
  type="number"
  name="occurrences"
  value={formData.occurrences}
  onChange={handleChange}
/>
            </div>

            <div className="space-y-2">
              <label>Email To</label>
              <Input
                name="email_to"
                value={formData.email_to}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <label>Email CC</label>
              <Input
                name="email_cc"
                value={formData.email_cc}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label>Email Subject</label>
              <Input
                name="email_subject"
                value={formData.email_subject}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label>Email Content</label>
              <Textarea
                name="email_content"
                value={formData.email_content}
                onChange={handleChange}
              />
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}