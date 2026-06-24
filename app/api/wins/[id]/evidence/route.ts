import { createClient } from "@/lib/supabase/server";
import { getSignedEvidenceUrl, isEvidenceError } from "@/lib/evidence";
import { NextResponse } from "next/server";

// GET /api/wins/[id]/evidence
//
// Returns a short-lived signed URL for the record's `source_file`, scoped
// to the authenticated owner. RLS scopes both the win row and the storage
// object to the owner; the explicit ownership check in getSignedEvidenceUrl
// is defense-in-depth. The URL is always signed — never public.
export async function GET(
  _request: Request,
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

  const result = await getSignedEvidenceUrl(id, user.id, supabase);

  if (isEvidenceError(result)) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result);
}
