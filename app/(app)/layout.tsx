import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppSidebar from "@/components/AppSidebar";

// Layout for all authenticated app routes (/capture, /records, /profile).
// Owns route protection — proxy.ts only refreshes the session, it does not
// gate access. The persistent left sidebar replaces the old per-page header.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-surface-base">
      <AppSidebar />
      <main className="ml-[220px] min-h-screen">{children}</main>
    </div>
  );
}
