import { redirect } from "next/navigation";

// Moved to /capture under the authenticated (app) layout.
// Kept as a redirect so existing links and the post-login target don't break.
export default function DashboardRedirect() {
  redirect("/capture");
}
