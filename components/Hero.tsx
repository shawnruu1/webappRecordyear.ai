import Link from "next/link";
import { playfair } from "@/lib/marketingFonts";

export default function Hero() {
  return (
    <section className="pt-36 pb-20" style={{ background: "var(--mkt-bg)" }}>
      <div className="max-w-4xl mx-auto px-6 text-center pt-16">
        <h1
          className={`${playfair.className} font-black tracking-tight max-w-3xl mx-auto mb-10`}
          style={{
            color: "var(--mkt-ink)",
            fontSize: "clamp(3rem, 8vw, 7rem)",
            lineHeight: 1.04,
          }}
        >
          More than your word.
        </h1>

        <p
          className="mx-auto leading-relaxed"
          style={{ color: "var(--mkt-ink-muted)", fontSize: "18px", maxWidth: "540px" }}
        >
          When the comp plan changes after you closed. When someone snakes your
          deal at the finish line. When you&rsquo;re walked out and the CRM goes
          dark the same day. Your wins shouldn&rsquo;t live and die inside a
          system you don&rsquo;t own. RecordYear is the permanent, portable
          record of your career, built yours from the start.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3">
          <Link
            href="/login"
            className="inline-block px-7 py-3.5 rounded-sm text-sm font-medium transition-opacity hover:opacity-90"
            style={{ background: "var(--mkt-ink)", color: "var(--mkt-bg)" }}
          >
            Get started →
          </Link>
          <p className="text-xs" style={{ color: "var(--mkt-ink-muted)" }}>
            Free · No credit card required
          </p>
        </div>

        <div className="mx-auto mt-12" style={{ maxWidth: "520px" }}>
          <p className="text-sm leading-relaxed" style={{ color: "var(--mkt-ink-muted)" }}>
            &ldquo;At my last company I had no real comp plan, no leverage when I
            left, and no record of what I&rsquo;d actually closed. RecordYear is
            the proof I wish I&rsquo;d kept.&rdquo;
          </p>
          <p className="mt-2 text-xs" style={{ color: "var(--mkt-ink-muted)" }}>
            — Shawn, founder
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-24">
        <hr style={{ border: "none", borderTop: "1px solid var(--mkt-rule)" }} />
      </div>
    </section>
  );
}
