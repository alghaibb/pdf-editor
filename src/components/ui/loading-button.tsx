import type { ComponentProps, ReactNode } from "react"
import { Loader2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type LoadingButtonProps = ComponentProps<typeof Button> & {
  loading?: boolean
  loadingText?: ReactNode
}

function LoadingButton({
  loading = false,
  loadingText,
  children,
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(className)}
      {...props}
    >
      {loading ? (
        <>
          <Loader2Icon className="animate-spin" data-icon="inline-start" />
          {loadingText ? <span>{loadingText}</span> : null}
        </>
      ) : (
        children
      )}
    </Button>
  )
}

export { LoadingButton }
