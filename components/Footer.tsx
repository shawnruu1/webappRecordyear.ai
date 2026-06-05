import { playfair } from "@/lib/marketingFonts";

export default function Footer() {
  return (
    <footer
      className="py-8"
      style={{ background: "var(--mkt-bg)", borderTop: "1px solid var(--mkt-rule)" }}
    >
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <span
          className={`${playfair.className} text-base font-bold`}
          style={{ color: "var(--mkt-ink)" }}
        >
          RecordYear
        </span>
        <p className="text-xs" style={{ color: "var(--mkt-ink-muted)" }}>
          © {new Date().getFullYear()} RecordYear. Built for sales professionals who
          do the work.
        </p>
      </div>
    </footer>
  );
}
