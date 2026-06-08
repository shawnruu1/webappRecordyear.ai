import { createClient } from "@/lib/supabase/server";
import SidebarNav from "@/components/SidebarNav";
import SignOutButton from "@/components/SignOutButton";
import { playfair } from "@/lib/marketingFonts";

// Server component: reads the session server-side for the footer identity.
// Interactive bits (active-state nav, sign out) live in client children.
export default async function AppSidebar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <aside
      className="fixed inset-y-0 left-0 z-20 flex w-[220px] flex-col bg-surface-sidebar"
      style={{
        // On a dark UI a faint LIGHT edge delineates a panel far better than a
        // dark seam (dark-on-dark reads as nothing); the shadow adds depth.
        borderRight: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "8px 0 24px -12px rgba(0,0,0,0.55)",
      }}
    >
      {/* Wordmark */}
      <div className="px-5 py-5">
        <span className={`${playfair.className} text-lg font-bold text-text-primary`}>
          RecordYear
        </span>
      </div>

      {/* Nav */}
      <div className="flex-1 px-3">
        <SidebarNav />
      </div>

      {/* Footer — identity + sign out */}
      <div
        className="flex flex-col gap-2 border-t px-5 py-4"
        style={{ borderColor: "rgba(0,0,0,0.3)" }}
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
