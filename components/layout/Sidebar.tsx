/**
 * Sidebar — 侧边导航栏（Client Component）
 *
 * 为什么是 Client Component：
 * - 需要 usePathname() 来高亮当前路由
 * - 需要交互（折叠/展开）
 *
 * "use client" 标记组件在客户端渲染。
 *
 * 导航模式：
 * - next/link 的 <Link> 用于客户端路由跳转（不刷新页面）
 * - usePathname() 返回当前 URL path，用于高亮判断
 * - shadcn/ui 的 Button( variant="ghost" ) 适合做导航项
 *
 * 你参考文档：shadcn/ui → Button, Separator; next/navigation → usePathname
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// TODO: 从 props 接收 workspace 和 project 列表
// type SidebarProps = {
//   workspaces: WorkspaceDTO[];
// };

export function Sidebar(/* { workspaces }: SidebarProps */) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col">
      <div className="p-4 font-bold">
        <Link href="/dashboard">Remote Task Board</Link>
      </div>
      <Separator />

      <nav className="flex-1 space-y-1 p-2">
        {/* 导航链接示例：active 状态用 variant="secondary"
        <Button
          variant={pathname === "/dashboard" ? "secondary" : "ghost"}
          className="w-full justify-start"
          asChild
        >
          <Link href="/dashboard">Dashboard</Link>
        </Button>
        */}

        {/* TODO: 遍历 workspaces，每个 workspace 展开其 projects
            模式：
            - workspace 名称作为 Section 标题
            - 其下 projects 作为子链接
            - 高亮当前 project 和 workspace
        */}
        <p className="p-2 text-sm text-muted-foreground">
          TODO: 实现 workspace 列表和 project 导航
        </p>
      </nav>

      <Separator />
      <div className="p-4">{/* TODO: 用户信息和登出 */}</div>
    </aside>
  );
}
