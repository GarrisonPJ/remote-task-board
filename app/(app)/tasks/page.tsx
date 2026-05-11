import { getUserFromSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { listTasks } from "@/services/task.service";
import { TaskList } from "@/components/task/TaskList";
import { TaskFilters } from "@/components/task/TaskFilters";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import Link from "next/link";

type Props = {
  searchParams: Promise<{
    workspaceId?: string;
    projectId?: string;
    status?: string;
    priority?: string;
    q?: string;
    page?: string;
  }>;
};

export default async function TasksPage({ searchParams }: Props) {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const tasks = await listTasks(
    {
      workspaceId: sp.workspaceId,
      projectId: sp.projectId,
      status: sp.status as "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "CANCELED" | undefined,
      priority: sp.priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined,
      q: sp.q,
      page: Number(sp.page ?? 1),
      pageSize: 20,
    },
    user.id
  );

  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams();
    if (sp.workspaceId) params.set("workspaceId", sp.workspaceId);
    if (sp.projectId) params.set("projectId", sp.projectId);
    if (sp.status) params.set("status", sp.status);
    if (sp.priority) params.set("priority", sp.priority);
    if (sp.q) params.set("q", sp.q);
    if (page > 1) params.set("page", String(page));
    return `/tasks?${params.toString()}`;
  };

  const { page, totalPages, total } = tasks.meta;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          {" / "}
          <span>Tasks</span>
        </p>
        <h1 className="text-2xl font-bold mt-1">Tasks</h1>
      </div>

      <TaskFilters />

      <TaskList tasks={tasks.items} />

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            {page > 1 && (
              <PaginationItem>
                <PaginationPrevious href={buildPageUrl(page - 1)} />
              </PaginationItem>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
              .map((p, idx, arr) => (
                <span key={p}>
                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  <PaginationItem>
                    <PaginationLink
                      href={buildPageUrl(p)}
                      isActive={p === page}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                </span>
              ))}
            {page < totalPages && (
              <PaginationItem>
                <PaginationNext href={buildPageUrl(page + 1)} />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}

      <p className="text-sm text-muted-foreground text-center">
        {total} task{total !== 1 ? "s" : ""} found
      </p>
    </div>
  );
}
