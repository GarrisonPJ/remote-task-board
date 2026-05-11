/**
 * Dashboard 页面 — Server Component
 *
 * Server Component 数据获取模式：
 *   1. async function 直接调用 Service 或 Prisma（不需要 fetch）
 *   2. 数据在服务端获取，渲染后 HTML 传给客户端
 *   3. 没有网络往返开销
 *
 * 你需要展示三块内容：
 * 1. 用户的工作区列表 — 调用 workspaceService.listMyWorkspaces(user.id)
 * 2. 最近的 Task — 调用 taskService.listTasks({ page: 1, pageSize: 5 }, user.id)
 * 3. 最近的 Activity — 可选（需要 ActivityLog 查询）
 *
 * 错误处理：
 *   Server Component 中的错误可以用 error.tsx 文件处理（Next.js error boundary）
 *
 * 你参考文档：
 *   - Next.js → Server Components → Fetching Data
 *   - Next.js → error.tsx（错误边界）
 *   - Next.js → loading.tsx（loading 状态）
 */

import { getUserFromSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { listMyWorkspaces } from "@/services/workspace.service";
import { listTasks } from "@/services/task.service";
import { WorkspaceCard } from "@/components/workspace/WorkspaceCard";
import { TaskList } from "@/components/task/TaskList";
import { FolderKanban, Clock, Search, ListTodo } from "lucide-react";

export default async function DashboardPage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  const [workspaces, recentTasks, allTasks] = await Promise.all([
    listMyWorkspaces(user.id),
    listTasks({ page: 1, pageSize: 5 }, user.id),
    listTasks({ page: 1, pageSize: 100 }, user.id),
  ]);

  const openTasks = allTasks.items.filter(
    (t) => t.status !== "DONE" && t.status !== "CANCELED"
  ).length;
  const inReview = allTasks.items.filter((t) => t.status === "IN_REVIEW").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back, {user.name}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-slide-up">
        <div className="rounded-lg border bg-card p-4 hover:border-primary/30 transition-colors duration-200 stagger-1">
          <FolderKanban className="h-5 w-5 text-primary/60 mb-2" />
          <div className="text-2xl font-bold tracking-tight">{workspaces.length}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Workspaces</div>
        </div>
        <div className="rounded-lg border bg-card p-4 hover:border-primary/30 transition-colors duration-200 stagger-2">
          <ListTodo className="h-5 w-5 text-chart-2/70 mb-2" />
          <div className="text-2xl font-bold tracking-tight">{allTasks.meta.total}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Total Tasks</div>
        </div>
        <div className="rounded-lg border bg-card p-4 hover:border-primary/30 transition-colors duration-200 stagger-3">
          <Clock className="h-5 w-5 text-chart-3/70 mb-2" />
          <div className="text-2xl font-bold tracking-tight">{openTasks}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Open Tasks</div>
        </div>
        <div className="rounded-lg border bg-card p-4 hover:border-primary/30 transition-colors duration-200 stagger-4">
          <Search className="h-5 w-5 text-chart-4/70 mb-2" />
          <div className="text-2xl font-bold tracking-tight">{inReview}</div>
          <div className="text-xs text-muted-foreground mt-0.5">In Review</div>
        </div>
      </div>

      <section className="animate-slide-up">
        <h2 className="text-lg font-semibold mb-3">Your Workspaces</h2>
        {workspaces.length === 0 ? (
          <p className="text-muted-foreground">
            No workspaces yet. Create one to get started.
          </p>
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
    </div>
  );
}
