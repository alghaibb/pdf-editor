export default function EditorLoading() {
  return (
    <div className="flex h-dvh flex-col bg-background">
      <div className="h-14 border-b border-border" />
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading editor…</p>
      </div>
    </div>
  )
}
