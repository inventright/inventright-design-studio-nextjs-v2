import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "strong";
}

export default function GlassCard({ children, className, variant = "default" }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl p-6 transition-all duration-300",
        variant === "strong" ? "glass-card-strong" : "glass-card",
        className
      )}
    >
      {children}
    </div>
  );
}
