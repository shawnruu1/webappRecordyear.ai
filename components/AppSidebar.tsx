import { createClient } from "@/lib/supabase/server";
import SidebarNav from "@/components/SidebarNav";
import SignOutButton from "@/components/SignOutButton";

// Server component: reads the session server-side for the footer identity.
// Interactive bits (active-state nav, sign out) live in client children.
export default async function AppSidebar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <aside
      className="fixed inset-y-0 left-0 z-20 flex w-[220px] flex-col border-r bg-surface-base"
      style={{ borderColor: "var(--color-border-subtle)" }}
    >
      {/* Wordmark */}
      <div className="px-5 py-5">
        <span className="text-lg font-bold text-text-primary">
          Record<span style={{ color: "var(--color-accent)" }}>Year</span>
        </span>
      </div>

      {/* Nav */}
      <div className="flex-1 px-3">
        <SidebarNav />
      </div>

      {/* Footer — identity + sign out */}
      <div
        className="flex flex-col gap-2 border-t px-5 py-4"
        style={{ borderColor: "var(--color-border-subtle)" }}
      >
        {user?.email && (
          <span className="truncate text-xs text-text-faint" title={user.email}>
            {user.email}
          </span>
        )}
        <SignOutButton />
      </div>
    </aside>
  );
}
