import { redirect } from "next/navigation";

// The authenticated portfolio now lives at /records (resolved from the
// session, no UUID in the URL). Public profiles live at /[username].
// Kept as a redirect so existing /portfolio/* links don't break.
export default function PortfolioRedirect() {
  redirect("/records");
}
