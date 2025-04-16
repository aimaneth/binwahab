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
        {steps.map((step, stepIdx) => (
          <li
            key={step.title}
            className={cn(
              stepIdx !== steps.length - 1 ? "pr-8 sm:pr-20" : "",
              "relative flex flex-col items-center"
            )}
          >
            <div className="relative flex items-center">
              <div 
                className={cn(
                  "absolute top-4 -left-[50%] w-[100%]",
                  stepIdx === 0 ? "hidden" : "block"
                )}
                aria-hidden="true"
              >
                <div className={cn(
                  "h-0.5 w-full",
                  step.status === "complete" ? "bg-primary" : "bg-gray-200"
                )} />
              </div>
              {step.status === "complete" ? (
                <Link
                  href={step.href}
                  className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary hover:bg-primary/80"
                >
                  <CheckIcon className="h-5 w-5 text-white" aria-hidden="true" />
                  <span className="sr-only">{step.title}</span>
                </Link>
              ) : step.status === "current" ? (
                <div
                  className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-white"
                  aria-current="step"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                  <span className="sr-only">{step.title}</span>
                </div>
              ) : (
                <div className="group relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white hover:border-gray-400">
                  <span
                    className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-gray-300"
                    aria-hidden="true"
                  />
                  <span className="sr-only">{step.title}</span>
                </div>
              )}
            </div>
            <span className="mt-4 text-sm font-medium text-gray-900">
              {step.title}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
} 