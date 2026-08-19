"use client"

import { useSyncExternalStore } from "react"
import { useTheme } from "next-themes"
import { ChevronDownIcon, MonitorIcon, MoonIcon, SunIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

type ThemeToggleProps = {
  className?: string
  variant?: "icon" | "label"
}

const THEMES = [
  { id: "light", label: "Light", icon: SunIcon },
  { id: "dark", label: "Dark", icon: MoonIcon },
  { id: "system", label: "System", icon: MonitorIcon },
] as const

function subscribe() {
  return () => {}
}

function useHasMounted() {
  return useSyncExternalStore(subscribe, () => true, () => false)
}

export function ThemeToggle({
  className,
  variant = "icon",
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const mounted = useHasMounted()
  const activeTheme = THEMES.find((option) => option.id === theme) ?? THEMES[2]
  const TriggerIcon =
    !mounted || resolvedTheme !== "dark" ? SunIcon : MoonIcon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({
            variant: variant === "label" ? "outline" : "ghost",
            size: variant === "label" ? "sm" : "icon",
          }),
          variant === "label" && "gap-2 px-3",
          className
        )}
        aria-label="Change appearance"
      >
        {variant === "label" ? (
          <>
            <activeTheme.icon className="size-3.5" />
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase">
              {mounted ? activeTheme.label : "Theme"}
            </span>
            <ChevronDownIcon className="size-3.5" />
          </>
        ) : (
          <TriggerIcon className="size-4" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        <DropdownMenuRadioGroup
          value={mounted ? (theme ?? "system") : "system"}
          onValueChange={(value) => {
            if (value === "light" || value === "dark" || value === "system") {
              setTheme(value)
            }
          }}
        >
          {THEMES.map((option) => (
            <DropdownMenuRadioItem key={option.id} value={option.id}>
              <option.icon />
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
