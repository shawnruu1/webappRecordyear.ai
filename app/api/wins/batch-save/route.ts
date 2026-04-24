import { createClient } from "@/lib/supabase/server";
import { saveApprovedWins } from "@/lib/saveApprovedWins";
import { NextResponse } from "next/server";
import type { BatchRecord } from "@/types";

export async function POST(request: Request) {
  // ---- Auth ----
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ---- Parse body ----
  let records: BatchRecord[];
  try {
    const body = await request.json() as { records?: unknown };
    if (!Array.isArray(body.records) || body.records.length === 0) {
      return NextResponse.json(
        { error: "records array is required and must not be empty." },
        { status: 400 }
      );
    }
    records = body.records as BatchRecord[];
  } catch {
    return NextResponse.json(
      { error: "Invalid request body. Expected JSON with a records array." },
      { status: 400 }
    );
  }

  // ---- Save ----
  const result = await saveApprovedWins(records, user.id);

  if (result.errors.length > 0 && result.saved === 0) {
    return NextResponse.json(
      { error: result.errors[0] },
      { status: 500 }
    );
  }

  return NextResponse.json({
    saved: result.saved,
    deletedFiles: result.deletedFiles,
    // Surface non-fatal errors (e.g. Storage cleanup failed but records saved)
    warnings: result.errors.length > 0 ? result.errors : undefined,
  });
}
