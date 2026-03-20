import React, { useState, useEffect } from "react";
import { ArrowLeft, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import api, { BACKEND_API_URL } from "@/services/api";
import { toast } from "sonner";

interface SolarOption {
  id: number;
  windmill_number: string;
}

export default function EBStatementSolarAdd() {
  const navigate = useNavigate();
  const [selectedSolarId, setSelectedSolarId] = useState("");
  const [selectedSolar, setSelectedSolar] = useState("");
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [solarOptions, setSolarOptions] = useState<SolarOption[]>([]);
  const [solarLoading, setSolarLoading] = useState(true);
  const [solarError, setSolarError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  useEffect(() => {
    const loadOptions = async () => {
      try {
        setSolarLoading(true);
        setSolarError(null);

        const res = await api.get("/eb-solar/windmills", { timeout: 30000 });
        if (res.status !== 200) throw new Error(res.data?.detail || `HTTP ${res.status}`);

        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        if (list.length === 0) {
          setSolarError("No solar entries found. Add a solar master first.");
          setSolarOptions([]);
        } else {
          const solarList = list
            .map((itm: { id: number; windmill_number?: string; solar_number?: string }) => ({
              id: itm.id,
              windmill_number: (itm.windmill_number || itm.solar_number || "").trim(),
            }))
            .filter((itm) => itm.windmill_number !== "");

          setSolarOptions(solarList);
          if (solarList.length > 0) {
            setSelectedSolarId(solarList[0].id.toString());
            setSelectedSolar(solarList[0].windmill_number);
          }
        }
      } catch (error) {
        console.error("Solar fetch failed:", error);

        // fallback to windmill route to allow page to render with options
        try {
          const fallback = await api.get("/eb/windmills", { timeout: 30000 });
          if (fallback.status === 200 && Array.isArray(fallback.data?.data)) {
            const list = fallback.data.data as Array<{id:number; windmill_number?:string; solar_number?:string}>;
            const solarList = list
              .map((itm) => ({
                id: itm.id,
                windmill_number: (itm.windmill_number || itm.solar_number || "").trim(),
              }))
              .filter((itm) => itm.windmill_number !== "");
            setSolarOptions(solarList);
            if (solarList.length > 0) {
              setSelectedSolarId(solarList[0].id.toString());
              setSelectedSolar(solarList[0].windmill_number);
            }
          }
        } catch (ferr) {
          console.warn("Fallback windmill fetch failed", ferr);
        }
      } finally {
        setSolarLoading(false);
      }
    };

    loadOptions();
  }, []);

  const disableForm = solarLoading || !!solarError;

  const activeSearchMessage = solarLoading
    ? "Loading solar metadata..."
    : solarError
    ? solarError
    : null;

  const disableSelect = solarLoading || solarError !== null || solarOptions.length === 0;

  console.log("EBStatementSolarAdd render", {
    solarLoading,
    solarError,
    solarOptionsLength: solarOptions.length,
    selectedSolar,
    disableSelect,
  });

  return (
    <div className="p-2 bg-slate-50 min-h-screen font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h1 className="text-lg font-semibold text-indigo-700">EB Statement-Solar - Upload</h1>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-slate-600 border-slate-300 bg-white hover:bg-slate-50 h-8 w-8 p-0"
              onClick={() => navigate("/eb-statement-solar")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {activeSearchMessage && (
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
            <p className={`text-sm ${solarLoading ? "text-slate-700" : "text-red-600"}`}>
              {activeSearchMessage}
            </p>
            {solarError && !solarLoading && (
              <div className="pt-2 space-x-2">
                <Button onClick={() => window.location.reload()} size="sm">
                  Retry
                </Button>
                <Button onClick={() => navigate("/master/windmill/add")} size="sm" variant="outline">
                  Add Solar in Master Windmill
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="p-4">
          <div className="space-y-4 px-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Solar Number</label>
                <Select value={selectedSolarId} onValueChange={(value) => {
                    setSelectedSolarId(value);
                    const item = solarOptions.find((opt) => opt.id.toString() === value);
                    setSelectedSolar(item?.windmill_number || "");
                  }}
                  disabled={disableSelect}
                >
                  <SelectTrigger className="w-full border-slate-300 h-9">
                    <SelectValue placeholder="Select Solar" />
                  </SelectTrigger>
                  <SelectContent>
                    {solarOptions.filter((opt) => opt.windmill_number.trim() !== "").length === 0 ? (
                      <SelectItem value="no-solar" disabled>
                        No solar entries found
                      </SelectItem>
                    ) : (
                      solarOptions
                        .filter((opt) => opt.windmill_number.trim() !== "")
                        .map((opt) => (
                          <SelectItem key={opt.id} value={opt.id.toString()}>
                            {opt.windmill_number}
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Month</label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-full border-slate-300 h-9">
                    <SelectValue placeholder="Select Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Year</label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-full border-slate-300 h-9">
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div
              onClick={() => document.getElementById("solar-file-input")?.click()}
              className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <UploadCloud className="h-12 w-12 text-blue-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">
                Drop PDF file here or <span className="text-blue-600">click to upload</span>
                <input
                  id="solar-file-input"
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    if (f.type !== "application/pdf") {
                      alert("Only PDF files allowed");
                      return;
                    }
                    setSelectedFile(f);
                  }}
                />
              </p>
              <p className="text-xs text-slate-500 mt-1">(Only PDF files, max 10 MB)</p>

              {selectedFile && <p className="text-green-600 text-sm mt-3">Selected: {selectedFile.name}</p>}
            </div>

            <div className="flex justify-center">
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={async () => {
                  if (!selectedFile) {
                    toast.error("Please select a PDF first");
                    return;
                  }

                  if (!selectedSolar) {
                    toast.error("Please select a solar number");
                    return;
                  }

                  if (!selectedYear) {
                    toast.error("Please select a year");
                    return;
                  }

                  setLoading(true);

                  const formData = new FormData();
                  formData.append("file", selectedFile);
                  // solar_id must be numerical master ID for save-details path; selectedSolarId is correct.
                  formData.append("solar_id", selectedSolarId);
                  formData.append("month", selectedMonth);
                  formData.append("year", selectedYear);

                  try {
                    const res = await fetch(`${BACKEND_API_URL}/eb-solar/read-pdf`, {
                      method: "POST",
                      headers: {
                        ...(localStorage.getItem("access_token") ? { Authorization: `Bearer ${localStorage.getItem("access_token")}` } : {}),
                      },
                      body: formData,
                    });

                    const data = await res.json();

                    if (!res.ok) {
                      const message = data?.detail || data?.message || "Upload failed";
                      toast.warning(`Warning: ${message}`);
                      return;
                    }

                    const warningText = data?.warning || data?.parsed?.warning;
                    if (warningText) {
                      toast.warning(`Warning: ${warningText}`);
                      // Prevent navigation to PDF when a warning is present.
                      return;
                    }

                    if (data.filename) {
                      sessionStorage.setItem("ebStatementSolarFile", data.filename);
                      if (data.parsed) {
                        sessionStorage.setItem("ebStatementSolarData", JSON.stringify(data.parsed));
                      }
                      if (data.header_id) {
                        sessionStorage.setItem("ebStatementSolarHeaderId", String(data.header_id));
                      }
                      if (selectedSolarId) {
                        sessionStorage.setItem("ebStatementSolarId", selectedSolarId);
                      }
                      if (selectedSolar) {
                        sessionStorage.setItem("ebStatementSolarNumber", selectedSolar);
                      }
                      sessionStorage.setItem("ebStatementSolarMonth", selectedMonth);
                      sessionStorage.setItem("ebStatementSolarYear", selectedYear);

                      navigate("/eb-statement-solar/pdf");
                    } else {
                      toast.error(data.message || "Upload failed");
                    }
                  } catch (err: unknown) {
                    console.error(err);
                    const message
                      = err && typeof err === "object" && "message" in err
                        ? String((err as { message?: string }).message)
                        : "Upload failed. Check backend.";
                    toast.error(`Warning: ${message}`);
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading || solarLoading || !!solarError}
              >
                {loading ? "Reading PDF..." : "Upload and Read PDF"}
              </Button>
            </div>


          </div>
        </div>
      </div>
    </div>
  );
}
