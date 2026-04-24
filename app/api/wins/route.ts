import { createClient } from "@/lib/supabase/server";
import { extractWins } from "@/lib/extractWins";
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

    const enriched = await extractWins(raw_input);

    const rows = enriched.map((w) => ({
      user_id: user.id,
      raw_input,
      title: w.title,
      category: w.category,
      tags: w.tags,
      impact: w.impact,
      verification: { source: "self" },
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
