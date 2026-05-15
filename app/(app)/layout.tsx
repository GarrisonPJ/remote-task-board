import { getUserFromSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { QueryProvider } from "@/components/layout/QueryProvider";
import { CreateWorkspaceDialog } from "@/components/workspace/CreateWorkspaceDialog";
import { MobileNav } from "@/components/layout/MobileNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  return (
    <div className="flex h-screen">
      <aside className="hidden md:flex w-64 border-r bg-muted/50 p-4 flex flex-col">
        <div className="font-semibold mb-6 text-lg">Remote Task Board</div>
        <nav className="space-y-1 flex-1">
          <a
            href="/dashboard"
            className="block px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors"
          >
            Dashboard
          </a>
          <CreateWorkspaceDialog />
        </nav>
        <div className="border-t pt-3 space-y-2">
          <p className="text-sm text-muted-foreground px-3">{user.name}</p>
          <LogoutButton />
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b px-4 md:px-6 py-3">
          <div className="flex items-center gap-3">
            <MobileNav userName={user.name} />
            <h1 className="text-lg font-medium">Remote Task Board</h1>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
              <QueryProvider>{children}</QueryProvider>
            </main>
      </div>
    </div>
  );
}
