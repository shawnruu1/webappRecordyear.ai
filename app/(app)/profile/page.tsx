import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import UsernameClaim from "@/components/UsernameClaim";

// Placeholder — identity + public-profile claim for now. Sharing and
// settings get built out here next.
export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-text-primary mb-2">Profile</h1>
      <p className="text-sm text-text-tertiary mb-10">
        Your public profile and account.
      </p>

      <div className="space-y-4">
        {/* Public profile — claim / live link */}
        <UsernameClaim
          initialUsername={profile?.username ?? null}
          initialDisplayName={profile?.display_name ?? null}
        />

        <dl
          className="rounded-card p-6"
          style={{
            background: "var(--gradient-surface-card)",
            border: "1px solid var(--color-border-subtle)",
          }}
        >
          <div>
            <dt className="text-[10px] uppercase tracking-widest text-text-faint mb-1">
              Email
            </dt>
            <dd className="text-sm text-text-primary">{user.email}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
