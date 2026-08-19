import Link from "next/link"

type HomeFooterProps = {
  isAuthenticated: boolean
}

export function HomeFooter({ isAuthenticated }: HomeFooterProps) {
  return (
    <footer className="border-t border-border px-5 py-16 sm:px-8 lg:px-12">
      <div className="mx-auto grid w-full max-w-6xl gap-12 sm:grid-cols-3">
        <div className="flex flex-col gap-3">
          <p className="font-heading text-sm font-semibold tracking-[0.22em] uppercase">
            PDF Editor
          </p>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            Edit real content. Keep the file.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Product
          </p>
          <Link
            href="#how-it-works"
            className="w-fit text-sm underline-offset-4 hover:underline"
          >
            How it works
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Account
          </p>
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="w-fit text-sm underline-offset-4 hover:underline"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="w-fit text-sm underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="w-fit text-sm underline-offset-4 hover:underline"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
      <p className="mx-auto mt-16 w-full max-w-6xl text-xs text-muted-foreground">
        © 2026 PDF Editor
      </p>
    </footer>
  )
}
