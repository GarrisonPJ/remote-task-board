/**
 * 登录页面 — Client Component
 *
 * 你需要实现的表单流程：
 * 1. 收集 email + password
 * 2. POST /api/auth/login
 * 3. 成功 → router.push("/dashboard")
 * 4. 失败 → toast.error 显示错误消息
 *
 * shadcn/ui 组件：Input, Button, Card（居中卡片布局）
 * sonner toast：toast.error("Invalid email or password")
 *
 * API 调用模式：
 *   const res = await fetch("/api/auth/login", {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify({ email, password }),
 *   });
 *   const json = await res.json();
 *   if (!json.success) {
 *     toast.error(json.error?.message);
 *     return;
 *   }
 *   // 登录成功 — json.data 是 UserDTO
 *   router.push("/dashboard");
 *
 * "use client" 指令：
 *   放在文件第一行。标记这是客户端组件，可以使用 useState、useEffect、
 *   事件处理器、浏览器 API。没有这个指令，Next.js 默认服务端渲染。
 *
 * 你参考文档：
 *   - Next.js → Client Components
 *   - shadcn/ui → Card, Input, Button
 *   - sonner → toast
 *   - next/navigation → useRouter
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();

      if (!json.success) {
        toast.error(json.error?.message ?? "Login failed");
        return;
      }

      // 登录成功 — json.data 包含 { id, name, email }
      toast.success(`Welcome back, ${json.data.name}!`);
      router.push("/dashboard");
      router.refresh(); // 刷新 layout 中的 session 状态
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alice@test.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password123"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Logging in..." : "Login"}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="underline">
                Register
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
