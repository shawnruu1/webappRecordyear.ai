import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./DashboardClient";

export default async function CapturePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="w-full max-w-[860px] mx-auto px-6 mt-12">
      {/* Capture — write a win or upload a file. Logged wins live on /records. */}
      <DashboardClient />
    </div>
  );
}
