export default function WorkspaceLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-6 w-48 bg-muted rounded" />
      <div className="h-8 w-96 bg-muted rounded" />
      <div className="h-4 w-32 bg-muted rounded" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-32 bg-muted rounded-lg" />
        <div className="h-32 bg-muted rounded-lg" />
      </div>
    </div>
  );
}
