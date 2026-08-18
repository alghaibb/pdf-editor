import { ThemeToggle } from "@/components/theme-toggle"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-full flex-1 flex-col bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,var(--muted)_0%,transparent_55%)] opacity-80" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,transparent_49%,color-mix(in_oklch,var(--border)_55%,transparent)_50%,transparent_51%),linear-gradient(to_bottom,transparent_0%,transparent_49%,color-mix(in_oklch,var(--border)_55%,transparent)_50%,transparent_51%)] bg-size-[48px_48px] opacity-40" />
      <div className="relative z-10 flex justify-end px-6 pt-6">
        <ThemeToggle />
      </div>
      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-10">
        {children}
      </main>
    </div>
  )
}
