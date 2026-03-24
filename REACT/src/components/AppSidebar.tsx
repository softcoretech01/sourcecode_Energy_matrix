import React from "react";

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarHeader,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    CloudSun,
    CreditCard,
    ClipboardList,
    Zap,
    Scale,
    FileText,
    BarChart,
    ReceiptText,
    Fan,
    Settings,
    ChevronRight,
    Wind,
    Activity,
    Users,
    PieChart,
    LogOut
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";

export function AppSidebar() {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        // Call logout endpoint (best effort - don't wait for response)
        try {
            const token = localStorage.getItem("access_token");
            if (token) {
                // Call logout endpoint
                await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/logout`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ token }),
                });
            }
        } catch (error) {
            console.warn("Logout endpoint call failed:", error);
        }

        // Clear token and session data and send to login
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
    };

    const items = [
        {
            title: "Master",
            url: "#",
            icon: Settings,
            items: [
                {
                    title: "Transmission Loss",
                    url: "/master/transmission-loss",
                    icon: Activity,
                },
                {
                    title: "EDC Circle",
                    url: "/master/edc-circle",
                    icon: ClipboardList,
                },
                {
                    title: "Capacity",
                    url: "/master/capacity",
                    icon: Zap,
                },
                {
                    title: "Windmill",
                    url: "/master/windmill",
                    icon: Wind,
                },
                {
                    title: "Customers",
                    url: "/master/customers",
                    icon: Users,
                },
                {
                    title: "Investors",
                    url: "/master/investors",
                    icon: Users,
                },
                {
                    title: "Share Holdings",
                    url: "/master/share-holdings",
                    icon: PieChart,
                },
                {
                    title: "Consumption Charges",
                    url: "/master/consumption-charges",
                    icon: Zap,
                },
                {
                    title: "Email",
                    url: "/master/email",
                    icon: Zap,
                },

            ]
        },
        {
            title: "Windmill",
            url: "#",
            icon: Fan,
            items: [
                //{
                //   title: "Dashboard",
                //   url: "/",
                //   icon: LayoutDashboard,
                //},
                {
                    title: "Daily Generation",
                    url: "/windmill",
                    icon: CloudSun,
                },
                //{
                //   title: "EB Statement",
                //   url: "/eb-statement",
                //    icon: FileText,
                //},
                //{
                //    title: "Cust Cons Req",
                //    url: "/consumption-request",
                //    icon: ClipboardList,
                //},
                //{
                //   title: "Energy Allotment",
                //   url: "/energy-allotment",
                //    icon: Zap,
                //},
                //{
                //    title: "Client EB Bill",
                //    url: "/windmill/eb-bill",
                //   icon: CreditCard,
                //},

                //{
                //    title: "Client Invoice",
                //    url: "/windmill/client-invoice",
                //    icon: ReceiptText,
                //},
                //{
                //    title: "Actual Allotment",
                //    url: "/windmill/actuals",
                //    icon: CreditCard,
                //},


            ]
        },
        //{
        //    title: "Solar",
        //    url: "#",
        //    icon: CloudSun,
        //    items: [
        //{
        //    title: "EB Statement-Solar",
        //    url: "/eb-statement-solar",
        //    icon: CreditCard,
        //},
        //]
        //},
        // {
        //     title: "SOP",
        //     url: "#",
        //     icon: ClipboardList,
        //     items: [
        //         {
        //             title: "Customer",
        //             url: "/sop/customer",
        //             icon: Users,
        //         },
        //         {
        //             title: "Shareholdings",
        //             url: "/sop/shareholdings",
        //             icon: PieChart,
        //         }
        //     ]
        // },
        // {
        //     title: "Report",
        //     url: "#",
        //     icon: FileText,
        //     items: [
        //         {
        //             title: "Bank Report",
        //             url: "/bank-report",
        //             icon: FileText,
        //         },
        //         {
        //             title: "Forecast Report",
        //             url: "/forecast-report",
        //             icon: BarChart,
        //         },
        //         {
        //             title: "Billing Report",
        //             url: "/billing-bank-report",
        //             icon: ReceiptText,
        //         },
        //         {
        //             title: "Invoice",
        //             url: "/invoice",
        //             icon: ReceiptText,
        //         },
        //     ]
        // }
    ];

    const isChildActive = (itemItems: any[]) => {
        return itemItems?.some(subItem =>
            subItem.url === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(subItem.url)
        );
    };

    return (
        <Sidebar collapsible="icon" className="border-r-sidebar-border/50">
            <SidebarHeader className="border-b border-sidebar-border/50 px-6 py-4 bg-sidebar-accent/30 group-data-[collapsible=icon]:px-2">
                <div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center">
                    {/* clicking logo clears token and sends to login */}
                    <button
                        onClick={handleLogout}
                        className="text-xl font-bold tracking-tight text-sidebar-foreground group-data-[collapsible=icon]:hidden text-left"
                    >
                        EnergyMatrix
                    </button>
                    <SidebarTrigger className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
                </div>
            </SidebarHeader>
            <SidebarContent className="bg-sidebar">
                <SidebarGroup className="pt-0">
                    <SidebarMenu className="px-2 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:items-center">
                        {items.map((item) => (
                            <Collapsible
                                key={item.title}
                                asChild
                                defaultOpen={isChildActive(item.items)}
                                className="group/collapsible"
                            >
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton
                                            tooltip={item.title}
                                            className="h-11 hover:bg-sidebar-accent/50 text-sidebar-foreground data-[state=open]:bg-sidebar-accent/40 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center"
                                        >
                                            <div className="p-1.5 rounded-md bg-white/10">
                                                <item.icon className="w-4 h-4 text-sidebar-foreground" />
                                            </div>
                                            <span className="font-semibold group-data-[collapsible=icon]:hidden">{item.title}</span>
                                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenuSub className="border-l-0 ml-0 pl-4 pr-2 space-y-1 mt-1">
                                            {item.items?.map((subItem: any) => {
                                                const splitPath = location.pathname.split('/');
                                                const splitUrl = subItem.url.split('/');
                                                const isActive = subItem.url === "/"
                                                    ? location.pathname === "/"
                                                    : location.pathname === subItem.url ||
                                                    (location.pathname.startsWith(subItem.url + "/") && splitPath[splitUrl.length] !== 'eb-bill' && splitPath[splitUrl.length] !== 'client-invoice' && splitPath[splitUrl.length] !== 'actuals') && subItem.url !== "#";

                                                return (
                                                    <SidebarMenuSubItem key={subItem.title}>
                                                        <SidebarMenuSubButton
                                                            asChild
                                                            isActive={isActive}
                                                            className={cn(
                                                                "h-9 rounded-lg transition-all duration-200",
                                                                isActive
                                                                    ? "bg-white/20 text-white shadow-sm"
                                                                    : "text-sidebar-foreground/80 hover:bg-white/10 hover:text-white"
                                                            )}
                                                        >
                                                            <Link to={subItem.url} className="flex items-center gap-3">
                                                                <subItem.icon className={cn(
                                                                    "w-4 h-4 transition-colors",
                                                                    isActive ? "text-white" : "text-sidebar-foreground/60"
                                                                )} />
                                                                <span className="font-medium">
                                                                    {subItem.title}
                                                                </span>
                                                            </Link>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                )
                                            })}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>

                {/* logout button at bottom */}
                <SidebarGroup className="mt-auto">
                    <SidebarMenu className="px-2 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:items-center">
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                onClick={handleLogout}
                                className="h-11 hover:bg-red-600/20 text-sidebar-foreground group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center"
                            >
                                <div className="p-1.5 rounded-md bg-white/10">
                                    <LogOut className="w-4 h-4 text-sidebar-foreground" />
                                </div>
                                <span className="font-semibold group-data-[collapsible=icon]:hidden">Logout</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                    <div className="px-4 py-2 text-xs text-sidebar-foreground/70 text-center group-data-[collapsible=icon]:hidden">
                        version 1.1
                    </div>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}
