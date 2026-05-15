"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { TaskTable } from "./TaskTable";
import { TaskList } from "./TaskList";
import { TaskFilters } from "./TaskFilters";
import { TaskTableSkeleton } from "./TaskTableSkeleton";
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
import type { PaginatedResponse } from "@/types/api";
import type { TaskDTO } from "@/types/domain";

export function TaskListContent() {
  const searchParams = useSearchParams();

  const queryString = searchParams.toString();
  const currentPage = Number(searchParams.get("page") ?? 1);

  const { data, isLoading, error } = useQuery<PaginatedResponse<TaskDTO>>({
    queryKey: ["tasks", queryString],
    queryFn: async () => {
      const res = await fetch(`/api/tasks?${queryString}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Failed to load tasks");
      return json.data;
    },
  });

  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page > 1) params.set("page", String(page));
    else params.delete("page");
    return `/tasks?${params.toString()}`;
  };

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

      {isLoading ? (
        <TaskTableSkeleton />
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-destructive mb-2">Failed to load tasks.</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      ) : data && data.items.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">No tasks found.</p>
      ) : data ? (
        <>
          {/* Mobile: card layout */}
          <div className="md:hidden">
            <TaskList tasks={data.items} />
          </div>
          {/* Desktop: table layout */}
          <div className="hidden md:block">
            <TaskTable tasks={data.items} />
          </div>

          {data.meta.totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                {currentPage > 1 && (
                  <PaginationItem>
                    <PaginationPrevious href={buildPageUrl(currentPage - 1)} />
                  </PaginationItem>
                )}
                {Array.from({ length: data.meta.totalPages }, (_, i) => i + 1)
                  .filter((p) => Math.abs(p - currentPage) <= 2 || p === 1 || p === data.meta.totalPages)
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
                          isActive={p === currentPage}
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    </span>
                  ))}
                {currentPage < data.meta.totalPages && (
                  <PaginationItem>
                    <PaginationNext href={buildPageUrl(currentPage + 1)} />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          )}

          <p className="text-sm text-muted-foreground text-center">
            {data.meta.total} task{data.meta.total !== 1 ? "s" : ""} found
          </p>
        </>
      ) : null}
    </div>
  );
}
