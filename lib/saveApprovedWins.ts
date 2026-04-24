import { createClient } from "@/lib/supabase/server";
import type { BatchRecord, WinVerification } from "@/types";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

export interface SaveResult {
  saved: number;
  deletedFiles: number;
  errors: string[];
}

// ------------------------------------------------------------
// saveApprovedWins
//
// Responsibilities:
//  1. Batch-insert approved records into the `wins` table.
//  2. Delete source files from Storage where every record from
//     that file was rejected (partial approval keeps the file).
//
// Called from API route — server-side only.
// ------------------------------------------------------------

export async function saveApprovedWins(
  records: BatchRecord[],
  userId: string
): Promise<SaveResult> {
  const supabase = await createClient();
  const errors: string[] = [];

  // ---- 1. Identify approved records ----
  const approved = records.filter((r) => r.approval === "approved");

  if (approved.length === 0) {
    // Still handle Storage cleanup even if nothing was approved
    const deletedFiles = await deleteRejectedFiles(records, supabase, errors);
    return { saved: 0, deletedFiles, errors };
  }

  // ---- 2. Map to wins rows ----
  const rows = approved.map((r) => {
    const verification: WinVerification = {
      source: "artifact",
      ref_id: r.source_file,
    };

    return {
      user_id: userId,
      raw_input: r.edited.raw_excerpt,
      title: r.edited.title,
      category: r.edited.category,
      tags: r.edited.tags,
      impact: r.edited.impact,
      arr_amount: r.edited.arr_amount,
      happened_at: r.edited.happened_at ?? null,
      recorded_at: new Date().toISOString(),
      source_file: r.source_file,
      source_hash: r.source_hash,
      verification,
    };
  });

  // ---- 3. Batch insert ----
  const { error: insertError } = await supabase.from("wins").insert(rows);

  if (insertError) {
    errors.push(`Failed to save wins: ${insertError.message}`);
    // Don't delete files if the DB write failed — user can retry
    return { saved: 0, deletedFiles: 0, errors };
  }

  // ---- 4. Delete fully-rejected source files from Storage ----
  const deletedFiles = await deleteRejectedFiles(records, supabase, errors);

  return { saved: approved.length, deletedFiles, errors };
}

// ------------------------------------------------------------
// deleteRejectedFiles
//
// A source file is deleted only when ALL records from that file
// are rejected. Partial approval (some approved, some rejected)
// keeps the file — it's still evidence for the approved records.
// ------------------------------------------------------------

async function deleteRejectedFiles(
  records: BatchRecord[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  errors: string[]
): Promise<number> {
  // Group records by source_file path
  const byFile = new Map<string, BatchRecord[]>();
  for (const r of records) {
    if (!byFile.has(r.source_file)) byFile.set(r.source_file, []);
    byFile.get(r.source_file)!.push(r);
  }

  // Find files where every record is rejected
  const toDelete: string[] = [];
  for (const [filePath, fileRecords] of byFile.entries()) {
    const allRejected = fileRecords.every((r) => r.approval === "rejected");
    if (allRejected) toDelete.push(filePath);
  }

  if (toDelete.length === 0) return 0;

  const { error } = await supabase.storage
    .from("win-source-files")
    .remove(toDelete);

  if (error) {
    errors.push(`Storage cleanup failed: ${error.message}`);
    return 0;
  }

  return toDelete.length;
}
