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
import { CreateWorkspaceDialog } from "@/components/workspace/CreateWorkspaceDialog";
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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-5 animate-slide-up hover:border-primary hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 active:scale-95 stagger-1">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
            <FolderKanban className="h-5 w-5 text-primary" />
          </div>
          <div className="text-2xl font-bold tracking-tight">{workspaces.length}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Workspaces</div>
        </div>
        <div className="rounded-xl border bg-card p-5 animate-slide-up hover:border-primary hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 active:scale-95 stagger-2">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
            <ListTodo className="h-5 w-5 text-primary" />
          </div>
          <div className="text-2xl font-bold tracking-tight">{allTasks.meta.total}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Total Tasks</div>
        </div>
        <div className="rounded-xl border bg-card p-5 animate-slide-up hover:border-primary hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 active:scale-95 stagger-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div className="text-2xl font-bold tracking-tight">{openTasks}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Open Tasks</div>
        </div>
        <div className="rounded-xl border bg-card p-5 animate-slide-up hover:border-primary hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 active:scale-95 stagger-4">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
            <Search className="h-5 w-5 text-primary" />
          </div>
          <div className="text-2xl font-bold tracking-tight">{inReview}</div>
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
    </div>
  );
}
