import { cn } from "@/lib/utils"

type DashboardCropFrameProps = {
  children: React.ReactNode
  className?: string
}

export function DashboardCropFrame({
  children,
  className,
}: DashboardCropFrameProps) {
  return (
    <div className={cn("relative", className)}>
      <span
        aria-hidden="true"
        className="absolute -top-2 -left-2 size-4 border-t border-l border-foreground"
      />
      <span
        aria-hidden="true"
        className="absolute -top-2 -right-2 size-4 border-t border-r border-foreground"
      />
      <span
        aria-hidden="true"
        className="absolute -bottom-2 -left-2 size-4 border-b border-l border-foreground"
      />
      <span
        aria-hidden="true"
        className="absolute -bottom-2 -right-2 size-4 border-b border-r border-foreground"
      />
      {children}
    </div>
  )
}
