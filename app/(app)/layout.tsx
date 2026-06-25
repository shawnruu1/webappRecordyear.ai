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

  // Onboarding gate — a first-run user (no profile row, or setup not finished)
  // is sent to /setup once. /setup lives OUTSIDE this (app) group, so this
  // redirect can't loop back through here.
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !profile.onboarding_completed_at) {
    redirect("/setup");
  }

  return (
    <div className="min-h-screen bg-surface-base">
      <AppSidebar />
      <main className="ml-[220px] min-h-screen">{children}</main>
    </div>
  );
}
