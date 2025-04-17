import Link from "next/link";
import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";

interface Step {
  title: string;
  href: string;
  status: "complete" | "current" | "upcoming";
}

interface StepsProps {
  steps: Step[];
}

export function Steps({ steps }: StepsProps) {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center justify-center">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className={cn(
              index !== steps.length - 1 ? "pr-8 sm:pr-20" : "",
              "relative flex flex-col items-center"
            )}
          >
            <div className="relative flex items-center">
              {/* Connector line */}
              {index !== 0 && (
                <div 
                  className="absolute right-full w-[calc(100%+5rem)] sm:w-[calc(100%+8rem)] h-0.5 top-4 transition-colors duration-200"
                  aria-hidden="true"
                >
                  <div className={cn(
                    "h-full w-full",
                    step.status === "complete" ? "bg-primary" : "bg-border"
                  )} />
                </div>
              )}
              
              {/* Step indicator */}
              {step.status === "complete" ? (
                <Link
                  href={step.href}
                  className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary hover:bg-primary/90 transition-colors duration-200"
                >
                  <CheckIcon className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
                  <span className="sr-only">{step.title}</span>
                </Link>
              ) : step.status === "current" ? (
                <div
                  className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background"
                  aria-current="step"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                  <span className="sr-only">{step.title}</span>
                </div>
              ) : (
                <div className="group relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-muted bg-background hover:border-muted-foreground transition-colors duration-200">
                  <span
                    className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-muted-foreground transition-colors duration-200"
                    aria-hidden="true"
                  />
                  <span className="sr-only">{step.title}</span>
                </div>
              )}
            </div>
            {/* Step title */}
            <span 
              className={cn(
                "mt-4 text-sm font-medium",
                step.status === "complete" ? "text-foreground" : 
                step.status === "current" ? "text-foreground" : 
                "text-muted-foreground"
              )}
            >
              {step.title}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
} 