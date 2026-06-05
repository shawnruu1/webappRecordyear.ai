import Link from "next/link";
import { playfair } from "@/lib/marketingFonts";

export default function CTA() {
  return (
    <section className="py-32" style={{ background: "var(--mkt-ink)" }}>
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2
          className={`${playfair.className} font-black leading-tight`}
          style={{ color: "var(--mkt-bg)", fontSize: "clamp(2.5rem, 6vw, 4.5rem)" }}
        >
          Start building your record today.
        </h2>

        <div className="mt-10 flex flex-col items-center gap-3">
          <Link
            href="/login"
            className="inline-block px-7 py-3.5 rounded-sm text-sm font-medium transition-opacity hover:opacity-90"
            style={{ background: "var(--mkt-bg)", color: "var(--mkt-ink)" }}
          >
            Get early access →
          </Link>
          <p className="text-xs" style={{ color: "rgba(242,237,228,0.6)" }}>
            Free during beta. No credit card.
          </p>
        </div>
      </div>
    </section>
  );
}
