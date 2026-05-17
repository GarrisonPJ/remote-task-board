"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        toast.success("Logged out successfully");
        router.push("/login");
        router.refresh();
      }
    } catch {
      toast.error("Logout failed");
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
    >
      <LogOut className="h-4 w-4" />
      Logout
    </button>
  );
}
