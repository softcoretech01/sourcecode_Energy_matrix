
import { cn } from "@/lib/utils";

type StatCardVariant = "blue" | "red" | "purple" | "green";

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  variant?: StatCardVariant; // Kept for compatibility
}

export function StatCard({ title, value, subtitle }: StatCardProps) {
  return (
    <div className="rounded-xl p-4 bg-primary/5 border border-primary/10 shadow-sm transition-all duration-300 hover:shadow-md hover:bg-primary/[0.07]">
      <h3 className="text-sm font-bold text-primary/70 mb-1 uppercase tracking-wider">
        {title}
      </h3>
      <p className="text-2xl font-black text-primary">{value}</p>
      <p className="text-xs text-primary/60 mt-1 font-medium">{subtitle}</p>
    </div>
  );
}