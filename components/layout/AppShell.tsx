/**
 * AppShell — 应用主布局（Server Component）
 *
 * Server Component 的特点：
 * - 可以写 async function
 * - 直接在函数体内调用 Prisma / Service 获取数据（无需 fetch）
 * - 不需要 "use client" 指令
 * - 代码不会被打包到客户端 JS 中
 *
 * 你参考文档：Next.js App Router → Server Components
 *
 * 设计文档参考：Section 20 (前端组件设计)
 */

import { getUserFromSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server Component 直接在服务端查 session，不需要 fetch /api/auth/me
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  return (
    <div className="flex h-screen">
      {/* TODO: 替换为 Sidebar 组件 */}
      <aside className="w-64 border-r bg-muted/50 p-4">
        <div className="font-semibold mb-4">Remote Task Board</div>
        <nav className="space-y-1">
          {/* TODO: 实现导航链接：
              - 使用 <Link href="/dashboard"> 导航
              - 使用 usePathname() 高亮当前活跃路由
              - 列出用户拥有的 workspace
              - 每个 workspace 下列出 project
          */}
          <p className="text-sm text-muted-foreground">
            Sidebar — 实现 workspace 和 project 导航
          </p>
        </nav>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* TODO: 替换为 Header 组件 */}
        <header className="flex items-center justify-between border-b px-6 py-3">
          <h1 className="text-lg font-medium">Dashboard</h1>
          <div className="flex items-center gap-4">
            {/* TODO: 显示用户名 + 登出按钮
                用户名：{user.name}
                登出按钮：调用 POST /api/auth/logout 然后 router.push("/login")
            */}
            <span className="text-sm text-muted-foreground">{user.name}</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
