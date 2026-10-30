import { cn } from "@/lib/utils/cn";

interface BadgeProps { children: React.ReactNode; variant?: string; className?: string; }

const VARIANTS: Record<string, string> = {
  default: "bg-stone-100 text-stone-700",
  success: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
  purple: "bg-purple-100 text-purple-700",
  outline: "border border-stone-300 text-stone-600 bg-transparent",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", VARIANTS[variant] ?? VARIANTS.default, className)}>
      {children}
    </span>
  );
}
