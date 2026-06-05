import { playfair } from "@/lib/marketingFonts";

const steps = [
  {
    number: "01",
    title: "Log a win",
    body: "Paste anything — a deal note, a Slack shoutout, a quota number. Takes 30 seconds.",
  },
  {
    number: "02",
    title: "AI enriches it",
    body: "RecordYear extracts the title, category, tags, and impact statement. Your raw context becomes a clean record entry.",
  },
  {
    number: "03",
    title: "Your portfolio builds",
    body: "Every win compounds. Share your portfolio link when it counts — reviews, recruiter calls, negotiations.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-32" style={{ background: "var(--mkt-ink)" }}>
      <div className="max-w-6xl mx-auto px-6">
        <h2
          className={`${playfair.className} font-black text-center leading-tight`}
          style={{ color: "var(--mkt-bg)", fontSize: "clamp(2.25rem, 5vw, 3.5rem)" }}
        >
          Thirty seconds to a permanent record.
        </h2>

        <div className="mt-24 grid md:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={step.number}
              className={`relative px-8 pb-8 ${i > 0 ? "md:border-l" : ""}`}
              style={{ borderColor: "rgba(242,237,228,0.15)" }}
            >
              <span
                aria-hidden="true"
                className={`${playfair.className} italic font-black absolute top-0 left-6 select-none pointer-events-none`}
                style={{
                  color: "rgba(242,237,228,0.15)",
                  fontSize: "5.5rem",
                  lineHeight: 1,
                }}
              >
                {step.number}
              </span>

              <div className="relative pt-14">
                <h3
                  className={`${playfair.className} font-bold`}
                  style={{ color: "var(--mkt-bg)", fontSize: "1.5rem" }}
                >
                  {step.title}
                </h3>
                <p
                  className="mt-3 text-sm leading-relaxed"
                  style={{ color: "rgba(242,237,228,0.6)" }}
                >
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
