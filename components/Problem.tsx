import { playfair } from "@/lib/marketingFonts";

const pains = [
  {
    label: "YOU CLOSE THE DEAL",
    body: "You multi-thread the org, fight through procurement, and bring it home. The number lands in a CRM with the company's name on it — not yours.",
  },
  {
    label: "THE CREDIT MOVES",
    body: "The comp plan changes after the deal is signed. Or someone attaches themselves to it at the finish line. The win was yours; the system now says otherwise.",
  },
  {
    label: "YOU LEAVE",
    body: "You move on, or you're walked out. The decision isn't always yours, and the timing almost never is.",
  },
  {
    label: "ACCESS GOES DARK",
    body: "Same day, the logins die. CRM, email, dashboards — every system that held the evidence of your work is gone by the afternoon.",
  },
  {
    label: "ALL THAT'S LEFT IS YOUR WORD",
    body: "In the next interview you recount the biggest deals of your career from memory. No numbers, no proof — just your word against a blank page.",
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

        <p
          className="mt-12 text-lg font-medium leading-relaxed"
          style={{ color: "var(--mkt-ink)" }}
        >
          RecordYear doesn&rsquo;t prevent any of this. It makes sure you walk
          away with the receipts.
        </p>
      </div>
    </section>
  );
}
