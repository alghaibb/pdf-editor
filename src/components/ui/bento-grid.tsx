import { cn } from "@/lib/utils"

function BentoGrid({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="bento-grid"
      className={cn(
        "grid min-w-0 grid-cols-1 gap-px overflow-hidden border border-border bg-border md:grid-cols-2 lg:grid-cols-6",
        className
      )}
      {...props}
    />
  )
}

function BentoCell({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="bento-cell"
      className={cn("flex min-w-0 flex-col bg-background p-6 sm:p-8", className)}
      {...props}
    />
  )
}

export { BentoCell, BentoGrid }
