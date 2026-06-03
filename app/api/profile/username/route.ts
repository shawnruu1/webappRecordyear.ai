import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Slugs that would shadow real routes or read poorly as a public handle.
const RESERVED = new Set([
  "api",
  "auth",
  "login",
  "logout",
  "signin",
  "signup",
  "dashboard",
  "portfolio",
  "profile",
  "settings",
  "admin",
  "about",
  "pricing",
  "help",
  "terms",
  "privacy",
  "blog",
  "public",
  "static",
  "www",
  "app",
  "_next",
  "favicon",
  "robots",
  "sitemap",
]);

// 3–30 chars, lowercase alphanumeric + hyphen, must start/end alphanumeric.
const USERNAME_RE = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;

// POST /api/profile/username — claim a username, set display name, and
// flip public_profile_enabled. Availability is enforced by the unique
// index; a conflict returns 409.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const username = String(body?.username ?? "")
    .trim()
    .toLowerCase();
  const displayName = String(body?.display_name ?? "").trim();

  if (!USERNAME_RE.test(username)) {
    return NextResponse.json(
      {
        error:
          "Use 3–30 characters: lowercase letters, numbers, and hyphens.",
      },
      { status: 400 }
    );
  }

  if (RESERVED.has(username)) {
    return NextResponse.json(
      { error: "That username is reserved. Try another." },
      { status: 409 }
    );
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      username,
      display_name: displayName || null,
      public_profile_enabled: true,
    },
    { onConflict: "id" }
  );

  if (error) {
    // 23505 = unique violation on the username index → taken.
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "That username is taken. Try another." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, username });
}
