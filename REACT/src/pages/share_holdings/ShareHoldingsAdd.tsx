import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import api from "@/services/api";

export default function ShareHoldingsAdd() {
    const navigate = useNavigate();

    const [totalShares, setTotalShares] = useState<string>("");
    const [totalInvestorShares, setTotalInvestorShares] = useState<string>("0");
    const [computedInvestorShares, setComputedInvestorShares] = useState<number>(0);
    const totalCustomerShares = (Number(totalShares || 0) - computedInvestorShares).toString();

    const [currentCustomer, setCurrentCustomer] = useState("");
    const [currentQuantity, setCurrentQuantity] = useState("");
    const [customers, setCustomers] = useState([]);
    const [allocatedShares, setAllocatedShares] = useState<number>(0);
    const [totalId, setTotalId] = useState<number | null>(null);
    const [savingTotal, setSavingTotal] = useState(false);

    const remainingCustomerShare = Number(totalCustomerShares) - allocatedShares - Number(currentQuantity || 0);

    const calculatedPercentage = Number(totalCustomerShares) > 0
        ? ((Number(currentQuantity || 0) / Number(totalCustomerShares)) * 100).toFixed(2)
        : "0.00";

    useEffect(() => {
        fetchCustomers();
        fetchTotalShares();
        fetchInvestorTotal();
        fetchAllocatedShares();
    }, []);

    const fetchCustomers = async () => {
        try {
            const res = await api.get("/customer-shares/customers");
            setCustomers(res.data);
        } catch (error) {
            console.error("Error fetching customers", error);
        }
    };

    const fetchAllocatedShares = async () => {
        try {
            const res = await api.get("/customer-shares/");
            const total = res.data.reduce((sum: number, share: any) => sum + Number(share.share_quantity || 0), 0);
            setAllocatedShares(total);
        } catch (error) {
            console.error("Error fetching allocated shares", error);
        }
    };

    const fetchInvestorTotal = async () => {
        try {
            const res = await api.get("/investors/list");
            const investors = res.data as Array<{ share_quantity?: number }>;
            const total = investors.reduce((sum, inv) => sum + Number(inv.share_quantity || 0), 0);
            setComputedInvestorShares(total);
        } catch (error) {
            console.error("Error fetching investor shares", error);
        }
    };

    const fetchTotalShares = async () => {
        try {
            const res = await api.get("/total-shares");
            if (Array.isArray(res.data) && res.data.length > 0) {
                const first = res.data[0];
                setTotalShares(String(first.total_company_shares ?? ""));
                setTotalInvestorShares(String(first.total_investor_shares ?? first.investor_shares ?? "0"));
                setTotalId(first.id);

                // If there are extra rows, delete them so only one row exists
                if (res.data.length > 1) {
                    for (let i = 1; i < res.data.length; i++) {
                        const duplicateId = res.data[i]?.id;
                        if (duplicateId) {
                            try {
                                await api.delete(`/total-shares/${duplicateId}`);
                            } catch (deleteError) {
                                console.warn(`Failed to delete duplicate total shares row ${duplicateId}`, deleteError);
                            }
                        }
                    }
                }

                return first.id;
            }
        } catch (error) {
            console.error("Error fetching total shares", error);
        }

        return null;
    };

    const handleSaveTotal = async () => {
        if (savingTotal) return;

        if (!totalShares || Number(totalShares) <= 0) {
            toast({
                variant: "destructive",
                title: "Total company shares is required",
            });
            return;
        }

        setSavingTotal(true);

        try {
            let id = totalId;
            if (!id) {
                id = await fetchTotalShares();
            }

            const payload = {
                total_company_shares: Number(totalShares),
                investor_shares: Number(computedInvestorShares || Number(totalInvestorShares || 0)),
                is_submitted: 0,
            };

            if (id) {
                await api.put(`/total-shares/${id}`, payload);
            } else {
                const res = await api.post("/total-shares/", payload);
                id = res.data?.id ?? null;
                setTotalId(id);
            }

            // Refresh values from DB so the UI always reflects what is stored
            await fetchTotalShares();

            // Refresh values from DB + investor actual total so UI stays consistent
            await fetchTotalShares();
            await fetchInvestorTotal();

            toast({ title: "Total shares stored" });
        } catch (error: unknown) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
            const err = error as any;
            console.error(err.response?.data || err);
            toast({
                variant: "destructive",
                title: "Failed to store total shares",
                description:
                    err?.response?.data?.detail ||
                    err?.response?.data?.message ||
                    err?.message ||
                    "An unexpected error occurred.",
            });
        } finally {
            setSavingTotal(false);
        }
    };
const handleAddCustomerShare = async () => {
    if (!currentCustomer || !currentQuantity) {
        toast({
            variant: "destructive",
            title: "Missing required fields",
            description: "Please select a customer and enter a share quantity.",
        });
        return;
    }

    if (Number(currentQuantity) <= 0) {
        toast({
            variant: "destructive",
            title: "Invalid share quantity",
            description: "Share quantity must be greater than zero.",
        });
        return;
    }

    if (remainingCustomerShare < 0) {
        toast({
            variant: "destructive",
            title: "Share quantity exceeds remaining",
            description: "Please enter a smaller quantity or increase total shares.",
        });
        return;
    }

    try {
        await api.post("/customer-shares/", {
            customer_id: Number(currentCustomer),
            share_quantity: Number(currentQuantity),
            is_submitted: 0,
        });

        setCurrentCustomer("");
        setCurrentQuantity("");
        
        // Refresh allocated shares to update remaining customer share
        await fetchAllocatedShares();

        toast({
            title: "Share mapping saved",
        });

        // After saving, navigate back to the list view
        navigate("/master/share-holdings");
    } catch (error: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
        const err = error as any;
        console.error(err?.response?.data || err);
        toast({
            variant: "destructive",
            title: "Failed to save mapping",
            description:
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                err?.message ||
                "An unexpected error occurred.",
        });
    }
};



const handlePost = async () => {
    if (!currentCustomer || !currentQuantity) {
        toast({
            variant: "destructive",
            title: "Missing required fields",
            description: "Please select a customer and enter a share quantity.",
        });
        return;
    }

    if (Number(currentQuantity) <= 0) {
        toast({
            variant: "destructive",
            title: "Invalid share quantity",
            description: "Share quantity must be greater than zero.",
        });
        return;
    }

    if (remainingCustomerShare < 0) {
        toast({
            variant: "destructive",
            title: "Share quantity exceeds remaining",
            description: "Please enter a smaller quantity or increase total shares.",
        });
        return;
    }

    try {
        await api.post("/customer-shares/", {
            customer_id: Number(currentCustomer),
            share_quantity: Number(currentQuantity),
            is_submitted: 1,
        });

        toast({ title: "Share mapping posted" });
        
        // Refresh allocated shares before navigating away
        await fetchAllocatedShares();
        
        navigate("/master/share-holdings");
    } catch (error: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
        const err = error as any;
        console.error(err?.response?.data || err);
        toast({
            variant: "destructive",
            title: "Failed to post mapping",
            description:
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                err?.message ||
                "An unexpected error occurred.",
        });
    }
};

    return (
        <div className="p-3 bg-slate-50 min-h-screen font-sans">
            <div className="w-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h1 className="text-lg font-semibold text-indigo-700">
                        Share Holdings - Add
                    </h1>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white h-8 px-4"
                            disabled={!currentCustomer || !currentQuantity}
                            onClick={handleAddCustomerShare}
                        >
                            Save
                        </Button>
                        <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-4"
                            disabled={!currentCustomer || !currentQuantity}
                            onClick={handlePost}
                        >
                            Post
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-slate-600 border-slate-300 bg-white hover:bg-slate-50 h-8 w-8 p-0"
                            onClick={() => navigate("/master/share-holdings")}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="p-4 space-y-8">
                    {/* First Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700">Total No of Shares in the Company</label>
                            <Input
                                value={totalShares}
                                onChange={(e) => setTotalShares(e.target.value)}
                                placeholder="Enter total shares in company"
                                type="number"
                                className="bg-white border-slate-300 h-9 text-xs"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700">Total Investor Shares</label>
                            <Input
                                value={totalInvestorShares}
                                readOnly
                                placeholder="Calculated automatically"
                                className="bg-slate-100 border-slate-300 h-9 text-xs text-slate-500 font-medium"
                            />
                            {Number(totalInvestorShares || 0) !== computedInvestorShares && (
                                <p className="text-[11px] font-medium text-red-600">Please save Total share since investors are updated.</p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700">Total No of Customer Shares</label>
                            <Input
                                value={Number(totalShares || 0) ? totalCustomerShares : "0"}
                                readOnly
                                placeholder="Calculated automatically"
                                className="bg-slate-100 border-slate-300 h-9 text-xs text-slate-500 font-medium"
                            />
                        </div>
                    </div>

                    <div className="flex justify-start">
                       <Button
size="sm"
className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-8"
disabled={savingTotal}
onClick={handleSaveTotal}
>
Save Total Shares
</Button>
                    </div>

                    <div className="border-t border-slate-200"></div>

                    {/* Second Row */}
                    <div>
                        <div className="flex items-center gap-4 mb-4">
                            <h2 className="text-sm font-semibold text-slate-800">Add Shareholder Mapping</h2>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-700">
                                    Remaining Customer Share: <span className="text-[#cb4154]">{remainingCustomerShare}</span>
                                </span>
                                {remainingCustomerShare === 0 && Number(totalCustomerShares) > 0 && (
                                    <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium border border-red-200">
                                        No remaining shares
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="space-y-1.5 flex-1">
                                <label className="text-sm font-semibold text-slate-700">Customer Name</label>
                                <Select value={currentCustomer} onValueChange={setCurrentCustomer}>
                                    <SelectTrigger className="w-full bg-white border-slate-300 h-9 text-xs">
                                        <SelectValue placeholder="Select Customer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                       {customers.map((cust) => (
    <SelectItem key={cust.id} value={cust.id}>
        {cust.customer_name}
    </SelectItem>
))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5 flex-1">
                                <label className="text-sm font-semibold text-slate-700">Share Quantity</label>
                                <Input
                                    value={currentQuantity}
                                    onChange={(e) => setCurrentQuantity(e.target.value)}
                                    placeholder="Enter quantity"
                                    type="number"
                                    className="bg-white border-slate-300 h-9 text-xs"
                                />
                            </div>
                            <div className="space-y-1.5 flex-1">
                                <label className="text-sm font-semibold text-slate-700">Share Percentage</label>
                                <Input
                                    value={calculatedPercentage}
                                    readOnly
                                    placeholder="Calculated automatically"
                                    className="bg-slate-100 border-slate-300 h-9 text-xs text-slate-500 font-medium"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
