
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet, useLocation } from "react-router-dom";

export default function Layout() {
    const location = useLocation();

    // Map routes to titles. Can be expanded for other pages.
    const getPageTitle = (pathname: string) => {
        if (pathname === "/windmill") return "";
        return "InstaMIS";
    };

    const getPageDescription = (pathname: string) => {
        if (pathname === "/windmill") return "";
        return "";
    };

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>

                <div className="flex-1 overflow-x-hidden">
                    <Outlet />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
