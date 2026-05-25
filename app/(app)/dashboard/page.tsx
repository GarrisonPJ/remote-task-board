/**
 * Dashboard page — Server Component with Suspense streaming
 *
 * The static heading renders immediately. Data-fetching content is
 * wrapped in <Suspense> so the loading skeleton streams in first
 * and progressively replaces with real data.
 */

import { Suspense } from "react";
import { getUserFromSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { listMyWorkspaces } from "@/services/workspace.service";
import { listTasks, getTaskStats } from "@/services/task.service";
import { WorkspaceCard } from "@/components/workspace/WorkspaceCard";
import { TaskList } from "@/components/task/TaskList";
import { TaskActivityFeed } from "@/components/task/TaskActivityFeed";
import { CreateWorkspaceDialog } from "@/components/workspace/CreateWorkspaceDialog";
import { FolderKanban, Clock, Search, ListTodo } from "lucide-react";
import DashboardLoading from "./loading";

async function DashboardContent() {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  const [workspaces, recentTasks, stats] = await Promise.all([
    listMyWorkspaces(user.id),
    listTasks({ page: 1, pageSize: 5 }, user.id),
    getTaskStats(user.id),
  ]);

  return (
    <>
      <p className="text-muted-foreground">Welcome back, {user.name}</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-5 animate-slide-up hover:border-primary hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 active:scale-95 shadow-sm stagger-1">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
            <FolderKanban className="h-5 w-5 text-primary" />
          </div>
          <div className="text-2xl font-bold tracking-tight">{workspaces.length}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Workspaces</div>
        </div>
        <div className="rounded-xl border bg-card p-5 animate-slide-up hover:border-primary hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 active:scale-95 shadow-sm stagger-2">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
            <ListTodo className="h-5 w-5 text-primary" />
          </div>
          <div className="text-2xl font-bold tracking-tight">{stats.total}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Total Tasks</div>
        </div>
        <div className="rounded-xl border bg-card p-5 animate-slide-up hover:border-primary hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 active:scale-95 shadow-sm stagger-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div className="text-2xl font-bold tracking-tight">{stats.openTasks}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Open Tasks</div>
        </div>
        <div className="rounded-xl border bg-card p-5 animate-slide-up hover:border-primary hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 active:scale-95 shadow-sm stagger-4">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
            <Search className="h-5 w-5 text-primary" />
          </div>
          <div className="text-2xl font-bold tracking-tight">{stats.inReview}</div>
          <div className="text-xs text-muted-foreground mt-0.5">In Review</div>
        </div>
      </div>

      <section className="animate-slide-up">
        <h2 className="text-lg font-semibold mb-3">Your Workspaces</h2>
        {workspaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-card">
            <svg className="h-16 w-16 text-muted-foreground/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-lg font-medium">No workspaces yet</p>
            <p className="text-muted-foreground mt-1 mb-4">
              Create a workspace to start managing your tasks.
            </p>
            <CreateWorkspaceDialog variant="inline" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((ws) => (
              <WorkspaceCard key={ws.id} workspace={ws} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Recent Tasks</h2>
        {recentTasks.items.length === 0 ? (
          <p className="text-muted-foreground">No tasks yet.</p>
        ) : (
          <TaskList tasks={recentTasks.items} />
        )}
      </section>

      {workspaces.some((ws) => ws.role === "OWNER") && (
        <section className="rounded-xl border bg-card p-5 shadow-sm">
          <TaskActivityFeed />
        </section>
      )}
    </>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>
      <Suspense fallback={<DashboardLoading />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
