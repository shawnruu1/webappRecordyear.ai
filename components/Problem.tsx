import { playfair } from "@/lib/marketingFonts";

const pains = [
  {
    label: "REVIEW TIME",
    body: "Six months of closed deals, champion relationships, and hard-won skills — gone from memory. You scramble through old emails instead of walking in prepared.",
  },
  {
    label: "COMP & NEGOTIATION",
    body: "Your manager remembers the Q3 miss. Not the three enterprise logos you landed. You leave money on the table every cycle because your record isn't built.",
  },
  {
    label: "YOUR NEXT MOVE",
    body: "Recruiters and hiring managers want proof, not claims. Without a record of your actual work, your value is whatever you can remember to say on a call.",
  },
];

export default function Problem() {
  return (
    <section className="py-32" style={{ background: "var(--mkt-bg)" }}>
      <div className="max-w-3xl mx-auto px-6">
        <h2
          className={`${playfair.className} font-black text-center leading-tight`}
          style={{ color: "var(--mkt-ink)", fontSize: "clamp(2.25rem, 5vw, 3.75rem)" }}
        >
          You do the work.
          <br />
          <span style={{ color: "var(--mkt-ink-muted)" }}>The record disappears.</span>
        </h2>

        <div className="mt-16">
          {pains.map((p) => (
            <div
              key={p.label}
              className="py-7"
              style={{ borderTop: "1px solid var(--mkt-rule)" }}
            >
              <p
                className="text-xs font-medium mb-2"
                style={{ color: "var(--mkt-gold)", letterSpacing: "0.18em" }}
              >
                {p.label}
              </p>
              <p className="text-lg leading-relaxed" style={{ color: "var(--mkt-ink)" }}>
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
