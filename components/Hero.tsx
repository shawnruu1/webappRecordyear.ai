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
          You had a record year.
          <br />
          Where&rsquo;s the proof?
        </h1>

        <p
          className="mx-auto leading-relaxed"
          style={{ color: "var(--mkt-ink-muted)", fontSize: "18px", maxWidth: "540px" }}
        >
          RecordYear captures every win — deals closed, quotas hit, recognition
          earned — and builds a permanent, portable career record. So when the
          moment comes, you&rsquo;re ready.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3">
          <Link
            href="/login"
            className="inline-block px-7 py-3.5 rounded-sm text-sm font-medium transition-opacity hover:opacity-90"
            style={{ background: "var(--mkt-ink)", color: "var(--mkt-bg)" }}
          >
            Get early access →
          </Link>
          <p className="text-xs" style={{ color: "var(--mkt-ink-muted)" }}>
            Free during beta · No credit card required
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-24">
        <hr style={{ border: "none", borderTop: "1px solid var(--mkt-rule)" }} />
      </div>
    </section>
  );
}
