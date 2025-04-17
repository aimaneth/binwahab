import { cn } from "@/lib/utils"

interface PolicyLayoutProps {
  children: React.ReactNode
  className?: string
  heading: string
  subheading?: string
}

export function PolicyLayout({
  children,
  className,
  heading,
  subheading
}: PolicyLayoutProps) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {heading}
        </h1>
        {subheading && (
          <p className="mt-4 text-lg text-muted-foreground">
            {subheading}
          </p>
        )}
      </div>
      <div className={cn(
        "prose prose-gray dark:prose-invert max-w-none",
        "prose-headings:font-semibold prose-headings:tracking-tight",
        "prose-lead:text-muted-foreground",
        "prose-a:text-primary hover:prose-a:text-primary/80",
        className
      )}>
        {children}
      </div>
    </div>
  )
} 