/**
 * TaskFilters — 搜索/筛选栏（Client Component）
 *
 * URL search params 驱动筛选模式：
 * 不是把筛选条件存在 React state 中，而是把筛选条件存在 URL 的 query string 中。
 * 这样做的好处：
 * - 刷新页面后筛选条件不丢失
 * - 可以复制 URL 分享筛选结果
 * - Server Component 可以通过 searchParams 直接读取筛选值来查询数据
 *
 * 实现模式：
 * 1. 用 useSearchParams() 读取当前 URL 的筛选值
 * 2. 用 useRouter().push() 更新 URL（触发 Server Component 重新渲染）
 * 3. 用 usePathname() 获取当前路径
 *
 * 你参考文档：
 *   - Next.js → useSearchParams, useRouter, usePathname
 *   - shadcn/ui → Input, Select
 *
 * debounce 优化（可选）：用 setTimeout 延迟搜索输入 300ms，避免每次按键都触发 URL 更新。
 */

"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TaskFiltersProps = {
  /** 筛选器不负责数据获取，只是更新 URL */
};

export function TaskFilters({}: TaskFiltersProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // 从 URL 读取当前筛选值
  const currentStatus = searchParams.get("status") ?? "ALL";
  const currentPriority = searchParams.get("priority") ?? "ALL";
  const currentQuery = searchParams.get("q") ?? "";

  /**
   * 更新 URL 中的某个筛选参数，保留其他参数。
   * 更新时重置页码到第 1 页（因为筛选条件变了需要从头看）。
   */
  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value === "ALL" || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }

      // 每次筛选条件变化时重置页码
      if (key !== "page") {
        params.delete("page");
      }

      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, pathname, router]
  );

  return (
    <div className="flex flex-wrap gap-4">
      {/* 搜索框 — 按标题搜索
      <Input
        placeholder="Search tasks..."
        defaultValue={currentQuery}
        onChange={(e) => {
          // TODO: 实现 debounce 搜索（300ms 延迟）
          updateFilter("q", e.target.value);
        }}
        className="max-w-xs"
      />
      */}

      {/* 状态筛选器
      <Select value={currentStatus} onValueChange={(v) => updateFilter("status", v)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Statuses</SelectItem>
          <SelectItem value="TODO">To Do</SelectItem>
          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
          <SelectItem value="IN_REVIEW">In Review</SelectItem>
          <SelectItem value="DONE">Done</SelectItem>
          <SelectItem value="CANCELED">Canceled</SelectItem>
        </SelectContent>
      </Select>
      */}

      {/* 优先级筛选器（类似 status） */}

      <p className="w-full text-sm text-muted-foreground">
        TODO: 取消注释实现搜索框和筛选器
      </p>
    </div>
  );
}
