/**
 * Header — 顶部导航栏（Server Component）
 *
 * 显示当前页面标题 + 用户信息 + 登出按钮。
 * 登出按钮自身是一个 Client Component（LogoutButton），因为它需要 onClick 交互。
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";

type HeaderProps = {
  userName?: string;
};

export function Header({ userName }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b px-6 py-3">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-medium">Dashboard</h1>
      </div>

      <div className="flex items-center gap-4">
        {userName ? (
          <>
            <span className="text-sm text-muted-foreground">{userName}</span>
            {/*
            TODO: LogoutButton（Client Component）：
            - "use client"
            - onClick → fetch("/api/auth/logout", { method: "POST" })
            - 成功后 router.push("/login") 或 router.refresh()
            - 用 sonner toast 提示错误

            import { useRouter } from "next/navigation";
            import { toast } from "sonner";

            async function handleLogout() {
              try {
                await fetch("/api/auth/logout", { method: "POST" });
                router.push("/login");
              } catch {
                toast.error("Failed to logout");
              }
            }
            */}
            <Button variant="outline" size="sm">Logout</Button>
          </>
        ) : (
          <Link href="/login" className="inline-flex items-center">
            <Button variant="outline" size="sm">Login</Button>
          </Link>
        )}
      </div>
    </header>
  );
}
