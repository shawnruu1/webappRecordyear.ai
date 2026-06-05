import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Placeholder — displays the user's identity for now. Public-profile
// controls, sharing, and settings get built out here next.
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
        We&apos;ll build this out next.
      </p>

      <dl
        className="rounded-card p-6 space-y-5"
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
        <div>
          <dt className="text-[10px] uppercase tracking-widest text-text-faint mb-1">
            Username
          </dt>
          <dd className="text-sm text-text-primary">
            {profile?.username ? `@${profile.username}` : "Not set"}
          </dd>
        </div>
      </dl>
    </div>
  );
}
