import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./DashboardClient";
import { playfair } from "@/lib/marketingFonts";

export default async function CapturePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="w-full max-w-[860px] mx-auto px-6 mt-12">
      <div className="mb-8">
        <h1 className={`${playfair.className} text-3xl font-bold text-text-primary mb-2`}>
          Capture a record
        </h1>
        <p className="text-sm text-text-tertiary">
          Write it, or drop a screenshot, PDF, or export — we&rsquo;ll structure it
          into your record.
        </p>
      </div>
      {/* Logged wins live on /records. */}
      <DashboardClient />
    </div>
  );
}
