const pains = [
  {
    icon: "⏱",
    title: "Review time arrives. Your memory doesn't.",
    body: "Six months of closed deals, champion relationships, and hard-won skills — gone from memory. You scramble through old emails instead of walking in prepared.",
  },
  {
    icon: "📉",
    title: "Your comp is negotiated against incomplete evidence.",
    body: "Your manager remembers the Q3 miss. Not the three enterprise logos you landed. You leave money on the table every cycle because your record isn't built.",
  },
  {
    icon: "🔍",
    title: "Your next opportunity can't find you.",
    body: "Recruiters and hiring managers want proof, not claims. Without a record of your actual work, your value is whatever you can remember to say on a call.",
  },
];

export default function Problem() {
  return (
    <section className="py-24 bg-[#080B14]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-widest text-[#F59E0B] mb-4">The problem</p>
          <h2 className="text-4xl lg:text-5xl font-bold text-[#F8F4EC] leading-tight">
            You do the work.<br />
            <span className="text-[#6B7280]">The record disappears.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {pains.map((pain) => (
            <div
              key={pain.title}
              className="rounded-2xl p-6"
              style={{
                background: "linear-gradient(160deg,#0E1628 0%,#080B14 100%)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div className="text-3xl mb-4">{pain.icon}</div>
              <h3 className="text-base font-semibold text-[#F8F4EC] mb-2">{pain.title}</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">{pain.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
