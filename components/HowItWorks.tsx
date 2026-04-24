const steps = [
  {
    number: "01",
    title: "Log a win",
    body: "Paste anything — a deal note, a Slack shoutout, a quota number. Takes 30 seconds.",
    color: "#10B981",
  },
  {
    number: "02",
    title: "AI enriches it",
    body: "RecordYear extracts the title, category, tags, and impact statement. Your raw context becomes a clean record entry.",
    color: "#818CF8",
  },
  {
    number: "03",
    title: "Your portfolio builds",
    body: "Every win compounds. Share your portfolio link when it counts — reviews, recruiter calls, negotiations.",
    color: "#F59E0B",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-[#080B14]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-widest text-[#F59E0B] mb-4">How it works</p>
          <h2 className="text-4xl lg:text-5xl font-bold text-[#F8F4EC]">
            Thirty seconds to a permanent record.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-8 left-1/6 right-1/6 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.2), transparent)" }} />

          {steps.map((step) => (
            <div key={step.number} className="text-center relative">
              <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-full text-xl font-black mb-6"
                style={{
                  background: `${step.color}15`,
                  border: `1px solid ${step.color}30`,
                  color: step.color,
                }}
              >
                {step.number}
              </div>
              <h3 className="text-lg font-semibold text-[#F8F4EC] mb-3">{step.title}</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed max-w-xs mx-auto">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
