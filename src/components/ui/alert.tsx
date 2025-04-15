import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

interface AlertProps {
  children?: React.ReactNode;
  className?: string;
  variant?: "default" | "destructive";
}

export function Alert({ children, className, variant = "default" }: AlertProps) {
  return (
    <div className={cn(
      "rounded-lg border p-4",
      variant === "destructive" && "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      className
    )}>
      {children}
    </div>
  );
}

export function AlertDescription({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("text-sm [&_p]:leading-relaxed", className)}>
      {children}
    </div>
  );
} 