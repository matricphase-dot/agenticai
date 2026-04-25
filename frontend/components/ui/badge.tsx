import * as React from "react"
import { cn } from "@/lib/utils"

const Badge = ({ className, variant, ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" }) => {
  const variants = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    destructive: "bg-destructive text-destructive-foreground",
    outline: "text-foreground border border-border",
    success: "bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20",
    warning: "bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20",
    info: "bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-black uppercase tracking-widest transition-colors",
        variants[variant || "default"],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
