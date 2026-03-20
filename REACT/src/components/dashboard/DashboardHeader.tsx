import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw, Search } from "lucide-react";

interface DashboardHeaderProps {
  onRefresh?: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export function DashboardHeader({
  onRefresh,
  searchValue = "",
  onSearchChange,
}: DashboardHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">InstaMIS</h1>
          <p className="text-xs text-muted-foreground">
            Management Information System – Real-time Insights
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search modules..."
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="pl-8 h-8 text-sm w-[180px] bg-card border-border"
          />
        </div>
        <Button onClick={onRefresh} size="sm" className="bg-primary hover:bg-primary/90 h-8">
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Refresh
        </Button>
      </div>
    </header>
  );
}