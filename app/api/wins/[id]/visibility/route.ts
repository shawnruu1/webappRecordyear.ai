import { createClient } from "@/lib/supabase/server";
import { RECORD_VISIBILITIES, type RecordVisibility } from "@/types";
import { NextResponse } from "next/server";

// PATCH /api/wins/[id]/visibility — set one record's public visibility.
// RLS already scopes wins to the owner; the explicit user_id filter is
// defense-in-depth.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const visibility = body?.visibility as RecordVisibility | undefined;

  if (!visibility || !RECORD_VISIBILITIES.includes(visibility)) {
    return NextResponse.json(
      { error: "Invalid visibility value" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("wins")
    .update({ visibility })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, visibility });
}
