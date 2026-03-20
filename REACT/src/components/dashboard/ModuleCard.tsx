
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type ModuleCardVariant =
    | "pink"
    | "yellow"
    | "lavender"
    | "coral"
    | "mint"
    | "peach";

interface ModuleCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    variant?: ModuleCardVariant; // Kept for compatibility but ignored for uniform styling
    hasAlert?: boolean;
    onViewReport: () => void;
}

export function ModuleCard({
    title,
    description,
    icon: Icon,
    hasAlert,
    onViewReport,
}: ModuleCardProps) {
    return (
        <div
            className={cn(
                "rounded-xl p-5 flex flex-col h-full border transition-all duration-300 group hover:shadow-lg",
                "bg-white hover:bg-primary/[0.02]",
                hasAlert ? "border-destructive/30 shadow-destructive/5" : "border-primary/10 shadow-sm"
            )}
        >
            <div className="flex items-start justify-between mb-5">
                <div className={cn(
                    "p-3 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-inner",
                    "bg-primary/10",
                    hasAlert ? "text-destructive" : "text-primary"
                )}>
                    <Icon className="w-6 h-6" />
                </div>
                {hasAlert && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-destructive/10 text-[10px] font-bold text-destructive uppercase tracking-wider">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
                        Alert
                    </div>
                )}
            </div>

            <div className="flex-1">
                <h3 className="text-lg font-bold text-primary mb-1.5 line-clamp-1 group-hover:text-primary/80 transition-colors">
                    {title}
                </h3>
                <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed">
                    {description}
                </p>
            </div>

            <div className="mt-6">
                <Button
                    onClick={onViewReport}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between h-9 text-xs font-bold hover:bg-primary hover:text-white text-primary p-0 px-3 rounded-lg border border-primary/10 hover:border-primary transition-all duration-300"
                >
                    View Insights
                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </Button>
            </div>
        </div>
    );
}
