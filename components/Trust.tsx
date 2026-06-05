import { playfair } from "@/lib/marketingFonts";

const reasons = [
  {
    quote: "Walk into every review prepared",
    body: "Stop reconstructing your year from memory. Show up with a complete record and talk about impact instead of scrambling to remember what happened.",
  },
  {
    quote: "Negotiate from a position of proof",
    body: "Comp conversations change when you can point to specific outcomes. Your record is the leverage you didn't know you were leaving on the table.",
  },
  {
    quote: "Your next move finds you",
    body: "A living portfolio of your work is the strongest signal you can send. Built quietly, shared when the moment calls for it.",
  },
];

export default function Trust() {
  return (
    <section id="trust" className="py-32" style={{ background: "var(--mkt-bg)" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-20 max-w-2xl mx-auto">
          <h2
            className={`${playfair.className} font-black leading-tight`}
            style={{ color: "var(--mkt-ink)", fontSize: "clamp(2.25rem, 5vw, 3.75rem)" }}
          >
            The record is the leverage.
          </h2>
          <p className="mt-4 text-lg leading-relaxed" style={{ color: "var(--mkt-ink-muted)" }}>
            Top performers don&rsquo;t just close more. They have better evidence of
            what they&rsquo;ve closed.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-10">
          {reasons.map((r) => (
            <div key={r.quote} className="pt-6" style={{ borderTop: "1px solid var(--mkt-rule)" }}>
              <p
                className={`${playfair.className} italic font-bold`}
                style={{ color: "var(--mkt-gold)", fontSize: "1.5rem", lineHeight: 1.25 }}
              >
                {r.quote}
              </p>
              <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--mkt-ink-muted)" }}>
                {r.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
