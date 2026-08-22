import Link from "next/link"

type HomeFooterProps = {
  isAuthenticated: boolean
}

export function HomeFooter({ isAuthenticated }: HomeFooterProps) {
  return (
    <footer className="border-t border-border px-5 py-16 sm:px-8 lg:px-12">
      <div className="mx-auto grid w-full max-w-6xl gap-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3 sm:col-span-2 lg:col-span-1">
          <p className="font-heading text-sm font-semibold tracking-[0.22em] uppercase">
            PDF Editor
          </p>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            A studio for rewriting the PDF you already have — then keeping that
            file.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Product
          </p>
          <Link
            href="#difference"
            className="w-fit text-sm underline-offset-4 hover:underline"
          >
            The difference
          </Link>
          <Link
            href="#capabilities"
            className="w-fit text-sm underline-offset-4 hover:underline"
          >
            In the file
          </Link>
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
                Create account
              </Link>
            </>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Note
          </p>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            Scanned pages can be made editable with Make text editable, then
            saved.
          </p>
        </div>
      </div>
      <div className="mx-auto mt-16 flex w-full max-w-6xl flex-col gap-2 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">© 2026 PDF Editor</p>
        <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          Real content. Real files.
        </p>
      </div>
    </footer>
  )
}
