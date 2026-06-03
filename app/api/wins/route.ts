import { createClient } from "@/lib/supabase/server";
import { extractWins } from "@/lib/extractWins";
import { DEFAULT_USER_ROLE } from "@/types";
import type { UserRole } from "@/types";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { raw_input } = body;
    if (!raw_input?.trim()) {
      return NextResponse.json({ error: "raw_input is required" }, { status: 400 });
    }

    // Look up the user's role to drive role-aware extraction.
    // Falls back to the default if no profile row exists yet.
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const userRole = (profile?.role as UserRole) ?? DEFAULT_USER_ROLE;

    const enriched = await extractWins(raw_input, userRole);

    const rows = enriched.map((w) => ({
      user_id: user.id,
      raw_input,
      title: w.title,
      category: w.category,
      tags: w.tags,
      impact: w.impact,
      arr_amount: w.arr_amount,
      happened_at: w.happened_at,
      verification: { source: "self_reported" },
      role_context: w.role_context ?? null,
    }));

    const { data, error: dbError } = await supabase
      .from("wins")
      .insert(rows)
      .select();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json(data);

  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[/api/wins]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
