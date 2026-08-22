import { DeferredToaster } from "@/components/deferred-toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import type { Metadata, Viewport } from "next"
import { Geist_Mono, Noto_Sans, Playfair_Display } from "next/font/google"
import "./globals.css"

const playfairDisplayHeading = Playfair_Display({
  subsets: ["latin"],
  weight: ["600"],
  style: ["normal", "italic"],
  variable: "--font-heading",
  display: "swap",
})

const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-geist-mono",
  display: "swap",
  // Step numbers and folio indexes; do not compete with the LCP heading.
  preload: false,
})

export const metadata: Metadata = {
  title: {
    default: "PDF Editor",
    template: "%s | PDF Editor",
  },
  description: "Edit real PDF content in your browser.",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full antialiased font-sans",
        geistMono.variable,
        notoSans.variable,
        playfairDisplayHeading.variable
      )}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <DeferredToaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
