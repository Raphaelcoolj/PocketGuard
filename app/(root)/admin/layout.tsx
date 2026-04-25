import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "admin") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold">PocketGuard</span>
          <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{session.user.email}</span>
          
            <a href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground transition">
            ← Back to App
          </a>
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}