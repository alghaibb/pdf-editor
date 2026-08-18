export function EmptyDocuments() {
  return (
    <div className="flex flex-col gap-2 border border-border px-6 py-10">
      <p className="text-sm font-medium">No documents yet.</p>
      <p className="text-sm text-muted-foreground">
        Upload your first PDF to start editing.
      </p>
    </div>
  )
}
