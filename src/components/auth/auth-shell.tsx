import Link from "next/link"

type AuthShellProps = {
  title: string
  description: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export function AuthShell({
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <div className="flex w-full max-w-md flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Link
          href="/"
          className="font-heading text-sm font-semibold tracking-[0.2em] text-foreground uppercase"
        >
          PDF Editor
        </Link>
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      {children}
      {footer ? (
        <div className="text-sm text-muted-foreground">{footer}</div>
      ) : null}
    </div>
  )
}
