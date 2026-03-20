import React, { useState } from "react";
import { Search, Plus, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import api from "@/services/api";



// Mock Data for Email

export default function EmailMasterList() {
    const navigate = useNavigate();
    const [searchEmail, setSearchEmail] = useState("");
    const [searchKeyword, setSearchKeyword] = useState("");

    const [appliedEmail, setAppliedEmail] = useState("");
    const [emailData, setEmailData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = () => {
        setAppliedEmail(searchEmail);
    };

    const handleCancel = () => {
        setSearchEmail("");
        setSearchKeyword("");
        setAppliedEmail("");
    };


    useEffect(() => {
  const initializeData = async () => {
    try {
      setLoading(true);
      setError(null);
      await fetchEmails();
    } catch (err) {
      setError("Failed to load emails. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  initializeData();
}, []);

    const fetchEmails = async () => {
  try {
    const response = await api.get("/email-master/");
    // Handle both direct array response and nested data response
    const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
    setEmailData(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error("Failed to fetch emails:", error);
    setEmailData([]);
    throw error;
  }
};



    const filteredData = emailData.filter((row) => {
  if (!row) return false;
  
  const matchesEmail =
    appliedEmail === "" ||
    (row?.email_id ? row.email_id.toString().toLowerCase().includes(appliedEmail.toLowerCase()) : true);

  const matchesGlobal =
    searchKeyword === "" ||
    Object.values(row || {}).some((val) =>
      val ? String(val).toLowerCase().includes(searchKeyword.toLowerCase()) : false
    );

  return matchesEmail && matchesGlobal;
});

const handleExportExcel = () => {
  if (filteredData.length === 0) {
    alert("No data to export");
    return;
  }

  const header = ["Email ID", "Category", "Time", "Occurrences", "Subject", "Status"];
  const rows = filteredData.map(row => [
    row.email_id,
    row.email_category,
    row.email_time,
    row.occurrences,
    row.email_subject,
    row.is_submitted === 1 ? "Posted" : "Saved"
  ]);

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [header, ...rows].map(e => e.join(",")).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `email_master_${new Date().toISOString()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

    return (
        <div className="p-2 bg-slate-50 min-h-screen font-sans">
            <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-3 space-y-2">
                    {/* Page Title */}
                    <div className="flex items-center justify-between pb-2">
                        <h1 className="text-xl font-bold text-slate-800">Master Email - List</h1>
                    </div>

                    <div className="space-y-1">
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap gap-2 items-center">
                            <span className="text-sm font-semibold text-slate-600 mr-2">Search</span>

                            <div className="w-[200px]">
                                <Select value={searchEmail} onValueChange={(val) => setSearchEmail(val === "all" ? "" : val)}>
                                    <SelectTrigger className="bg-white border-slate-200 h-9 text-sm">
                                        <SelectValue placeholder="Select Email" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Emails</SelectItem>
                                        {Array.from(new Set(emailData.map(item => item.email_id))).map(email => (
                                            <SelectItem key={email} value={email}>{email}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex-1"></div>

                            <Button size="sm" className="h-9 text-sm bg-primary hover:bg-primary/90 text-primary-foreground px-4" onClick={handleSearch}>
                                Search
                            </Button>
                            <Button size="sm" className="h-9 text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-4" onClick={() => navigate("/master/email/add")}>
                                + New
                            </Button>
                            <Button
  size="sm"
  className="h-9 text-sm bg-[#DAA520] hover:bg-[#B8860B] text-white px-4"
  onClick={handleExportExcel}
>
  Export Excel
</Button>
                            <Button size="sm" className="h-9 text-sm bg-red-600 hover:bg-red-700 text-white px-4" onClick={handleCancel}>
                                Cancel
                            </Button>
                        </div>
                    </div>

                    {/* List Table Section */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center bg-primary/5 p-2 rounded-t-lg border-b border-primary/10 h-10">
                            <h2 className="text-sm font-semibold text-primary pl-2">Email Master Data</h2>

                            <div className="flex items-center gap-4">
                                <div className="flex gap-3 items-center">
                                    <div className="flex items-center gap-1.5">
                                        <Badge className="bg-red-600 hover:bg-red-700 text-white font-bold w-6 h-6 text-[10px] rounded flex items-center justify-center p-0 shadow-sm border-none">S</Badge>
                                        <span className="text-xs font-medium text-slate-600">Saved</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold w-6 h-6 text-[10px] rounded flex items-center justify-center p-0 shadow-sm border-none">P</Badge>
                                        <span className="text-xs font-medium text-slate-600">Posted</span>
                                    </div>
                                </div>

                                <div className="relative w-64">
                                    <Search className="absolute right-2 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Keyword search..."
                                        className="bg-white border-slate-300 pr-8 h-9 text-sm"
                                        value={searchKeyword}
                                        onChange={(e) => setSearchKeyword(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border border-slate-200 rounded-b-lg overflow-hidden mt-0">
                            <Table>
                                <TableHeader className="bg-sidebar">
                                    <TableRow>
                                        <TableHead className="py-2 h-10 font-semibold text-white whitespace-nowrap">Email ID</TableHead>
                                        <TableHead className="py-2 h-10 font-semibold text-white whitespace-nowrap">Category</TableHead>
                                        <TableHead className="py-2 h-10 font-semibold text-white whitespace-nowrap">Time</TableHead>
                                        <TableHead className="py-2 h-10 font-semibold text-white whitespace-nowrap">Occurrences</TableHead>
                                        <TableHead className="py-2 h-10 font-semibold text-white whitespace-nowrap">Subject</TableHead>
                                        <TableHead className="py-2 h-10 font-semibold text-white whitespace-nowrap">Status</TableHead>
                                        <TableHead className="py-2 h-10 font-semibold text-white text-center whitespace-nowrap w-24">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-slate-400"></div>
                                                    <span>Loading emails...</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : error ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-red-500">
                                                {error}
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredData.length > 0 ? (
                                        filteredData.map((row) => (
                                            <TableRow key={row.id} className="hover:bg-slate-50 bg-white">
                                                <TableCell className="py-2 text-slate-600 font-medium text-sm">{row.email_id}</TableCell>
                                                <TableCell className="py-2 text-slate-600 text-sm">{row.email_category}</TableCell>
                                                <TableCell className="py-2 text-slate-600 text-sm">{row.email_time}</TableCell>
                                                <TableCell className="py-2 text-slate-600 text-sm">{row.occurrences}</TableCell>
                                                <TableCell className="py-2 text-slate-600 text-sm">{row.email_subject}</TableCell>
                                                <TableCell className="py-2">
                                                    <Badge
  className={cn(
    "font-bold w-6 h-6 rounded flex items-center justify-center p-0 border-none",
    row.is_submitted === 1
      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
      : "bg-red-600 hover:bg-red-700 text-white"
  )}
>
  {row.is_submitted === 1 ? "P" : "S"}
</Badge>
                                                </TableCell>
                                                <TableCell className="py-2 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <Button
  variant="ghost"
  size="icon"
  disabled={row.is_submitted === 1}
  className={cn(
    "h-6 w-6",
    row.is_submitted === 1
      ? "text-gray-400 cursor-not-allowed"
      : "text-primary hover:text-primary hover:bg-primary/10"
  )}
  onClick={() => navigate(`/master/email/edit/${row.id}`)}
>
  <Edit className="h-4 w-4" />
</Button>
                                      </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-4 text-slate-500">
                                                No records found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
