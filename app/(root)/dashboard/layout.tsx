import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { CurrencyProvider } from "@/components/providers/CurrencyProvider";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await connectDB();
  const dbUser = await User.findById(session.user.id).lean();

  if (!dbUser?.onboardingComplete) redirect("/onboarding");

  return (
    <CurrencyProvider initialCurrency={(dbUser as any)?.currency}>
      {/* Desktop layout */}
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar user={session.user} role={(dbUser as any)?.role} />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>
      </div>
    </CurrencyProvider>
  );
}