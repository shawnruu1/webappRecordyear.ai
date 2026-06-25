import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SetupForm from "@/components/SetupForm";
import { playfair } from "@/lib/marketingFonts";

// First-run setup. Lives OUTSIDE the (app) route group on purpose, so the
// onboarding gate in (app)/layout.tsx never wraps it — otherwise an un-onboarded
// user would be redirected here and then redirected away again in a loop.
export default async function SetupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Already finished setup → straight into the app (keeps it one-time).
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.onboarding_completed_at) redirect("/capture");

  return (
    <div className="min-h-screen bg-surface-base flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <h1 className={`${playfair.className} text-3xl font-bold text-text-primary mb-2`}>
          Let&rsquo;s set up your record
        </h1>
        <p className="text-sm text-text-tertiary mb-8">
          A few details so your records are attributed to you.
        </p>
        <SetupForm userId={user.id} />
      </div>
    </div>
  );
}
