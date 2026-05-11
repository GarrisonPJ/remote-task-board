export default function TaskLoading() {
  return (
    <div className="space-y-8 max-w-2xl animate-pulse">
      <div className="h-6 w-48 bg-muted rounded" />
      <div className="h-8 w-96 bg-muted rounded" />
      <div className="flex gap-2">
        <div className="h-6 w-20 bg-muted rounded-full" />
        <div className="h-6 w-20 bg-muted rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full bg-muted rounded" />
        <div className="h-4 w-3/4 bg-muted rounded" />
      </div>
    </div>
  );
}
