/**
 * Dashboard loading skeleton — mirrors the real dashboard layout structure
 * with animate-pulse placeholders so the user sees a faithful outline immediately.
 */

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Welcome text placeholder */}
      <div className="h-4 w-56 rounded bg-muted/60 animate-pulse" />

      {/* 4 stat card skeletons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-muted/60 animate-pulse mb-3" />
            <div className="h-6 w-12 rounded bg-muted/60 animate-pulse" />
            <div className="h-3 w-20 rounded bg-muted/60 animate-pulse mt-2" />
          </div>
        ))}
      </div>

      {/* Your Workspaces section */}
      <section>
        <div className="h-5 w-36 rounded bg-muted/60 animate-pulse mb-3" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="h-4 w-3/4 rounded bg-muted/60 animate-pulse" />
              <div className="h-3 w-full rounded bg-muted/60 animate-pulse mt-3" />
              <div className="h-3 w-2/3 rounded bg-muted/60 animate-pulse mt-2" />
              <div className="flex gap-2 mt-4">
                <div className="h-5 w-16 rounded-full bg-muted/60 animate-pulse" />
                <div className="h-5 w-12 rounded-full bg-muted/60 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Tasks section */}
      <section>
        <div className="h-5 w-28 rounded bg-muted/60 animate-pulse mb-3" />
        <div className="rounded-xl border bg-card divide-y">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4">
              <div className="h-4 w-4 rounded bg-muted/60 animate-pulse shrink-0" />
              <div className="h-4 w-2/5 rounded bg-muted/60 animate-pulse" />
              <div className="h-4 w-16 rounded-full bg-muted/60 animate-pulse ml-auto" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
