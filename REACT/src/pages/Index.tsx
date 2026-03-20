import { StatCard } from "@/components/dashboard/StatCard";
import { ModuleCard } from "@/components/dashboard/ModuleCard";
import {
  CalendarCheck,
  Sun,
  Landmark,
  Truck,
  TrendingUp,
  Layers,
  Building2,
  Wallet,
} from "lucide-react";

const statCards = [
  {
    title: "Total Deals",
    value: "128",
    subtitle: "Active pipeline",
    variant: "blue" as const,
  },
  {
    title: "Pending Dues",
    value: "₹ 12.5 Cr",
    subtitle: "Across all clients",
    variant: "red" as const,
  },
  {
    title: "Shipments",
    value: "46",
    subtitle: "In transit",
    variant: "purple" as const,
  },
  {
    title: "Bank Balance",
    value: "₹ 3.2 Cr",
    subtitle: "Today",
    variant: "green" as const,
  },
];

const moduleCards = [
  {
    title: "Compliance Calendar",
    description: "Upcoming statutory & internal compliance tasks",
    icon: CalendarCheck,
    variant: "pink" as const,
    hasAlert: true,
  },
  {
    title: "Wind & Solar Allocation",
    description: "Unit-wise renewable energy allocation",
    icon: Sun,
    variant: "yellow" as const,
    hasAlert: false,
  },
  {
    title: "Banking Slot-wise",
    description: "Transactions grouped by banking slots",
    icon: Landmark,
    variant: "lavender" as const,
    hasAlert: true,
  },
  {
    title: "Shipments Tracking",
    description: "Real-time shipment status & milestones",
    icon: Truck,
    variant: "peach" as const,
    hasAlert: false,
  },
  {
    title: "Deal Tracking",
    description: "Pipeline deals and conversion status",
    icon: TrendingUp,
    variant: "coral" as const,
    hasAlert: false,
  },
  {
    title: "Yearly & Monthly Dues",
    description: "Outstanding dues summary",
    icon: Layers,
    variant: "coral" as const,
    hasAlert: true,
  },
  {
    title: "Boomlift Company",
    description: "Boomlift operations & utilization",
    icon: Building2,
    variant: "lavender" as const,
    hasAlert: false,
  },
  {
    title: "Daily Bank Balance",
    description: "Daily bank balance overview",
    icon: Wallet,
    variant: "mint" as const,
    hasAlert: false,
  },
];

const Index = () => {
  const handleViewReport = (title: string) => {
    console.log(`Viewing report: ${title}`);
  };

  return (
    <div className="h-screen bg-background p-4 overflow-hidden">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {statCards.map((card) => (
            <StatCard key={card.title} {...card} />
          ))}
        </div>

        {/* Module Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
          {moduleCards.map((module) => (
            <ModuleCard
              key={module.title}
              {...module}
              onViewReport={() => handleViewReport(module.title)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
