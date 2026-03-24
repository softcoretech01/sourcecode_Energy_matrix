import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/services/api";
import { useParams } from "react-router-dom";

type Customer = {
    id: number;
    customer_name: string;
};

export default function ShareHoldingsEdit() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [currentCustomer, setCurrentCustomer] = useState("");
    const [currentQuantity, setCurrentQuantity] = useState("");
    const [totalCustomerShares, setTotalCustomerShares] = useState<number>(0);

    const calculatedPercentage = Number(totalCustomerShares) > 0
        ? ((Number(currentQuantity || 0) / totalCustomerShares) * 100).toFixed(2)
        : "0.00";

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const res = await api.get("/customer-shares/customers");
                setCustomers(res.data);
            } catch (error) {
                console.error("Customer fetch error", error);
            }
        };

        const fetchTotalCustomerShares = async () => {
            try {
                const res = await api.get("/total-shares");
                if (Array.isArray(res.data) && res.data.length > 0) {
                    setTotalCustomerShares(Number(res.data[0].total_customer_shares || 0));
                }
            } catch (error) {
                console.error("Total shares fetch error", error);
            }
        };

        fetchCustomers();
        fetchTotalCustomerShares();
    }, []);

    useEffect(() => {
        if (!id) return;

        const fetchCustomerShare = async () => {
            try {
                const res = await api.get(`/customer-shares/${id}`);
                setCurrentCustomer(res.data.customer_id.toString());
                setCurrentQuantity(res.data.share_quantity.toString());
            } catch (error) {
                console.error("Customer share fetch error", error);
            }
        };

        fetchCustomerShare();
    }, [id]);

    const handleUpdateCustomerShare = async () => {
        if (!id) return;

        try {
            await api.put(`/customer-shares/${id}`, {
                share_quantity: Number(currentQuantity),
                share_percentage: Number(calculatedPercentage),
                status: 1,
                is_submitted: 0,
            });

            navigate("/master/share-holdings");
        } catch (error: unknown) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
            console.error((error as any)?.response?.data || error);
        }
    };

    const handlePostCustomerShare = async () => {
        if (!id) return;

        try {
            await api.put(`/customer-shares/${id}`, {
                share_quantity: Number(currentQuantity),
                share_percentage: Number(calculatedPercentage),
                status: 1,
                is_submitted: 1,
            });

            navigate("/master/share-holdings");
        } catch (error: unknown) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
            console.error((error as any)?.response?.data || error);
        }
    };

    return (
        <div className="p-3 bg-slate-50 min-h-screen font-sans">
            <div className="w-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h1 className="text-lg font-semibold text-indigo-700">Share Holdings - Edit</h1>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white h-8 px-4"
                            onClick={handleUpdateCustomerShare}
                        >
                            Update
                        </Button>
                        <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-4"
                            onClick={handlePostCustomerShare}
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
                    {/* Shareholder Mapping */}
                    <div>
                        <div className="flex items-center gap-4 mb-4">
                            <h2 className="text-sm font-semibold text-slate-800">Update Shareholder Mapping</h2>
                        </div>
                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="space-y-1.5 flex-1">
                                <label className="text-sm font-semibold text-slate-700">Customer Name</label>
                                <Select value={currentCustomer} onValueChange={setCurrentCustomer}>
                                    <SelectTrigger className="w-full bg-white border-slate-300 h-9 text-xs">
                                        <SelectValue placeholder="Select Customer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {customers.map((customer) => (
                                            <SelectItem key={customer.id} value={customer.id.toString()}>
                                                {customer.customer_name}
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
