const reasons = [
  {
    icon: "🏆",
    title: "Walk into every review prepared",
    body: "Stop reconstructing your year from memory. Show up with a complete record and talk about impact instead of scrambling to remember what happened.",
  },
  {
    icon: "💰",
    title: "Negotiate from a position of proof",
    body: "Comp conversations change when you can point to specific outcomes. Your record is the leverage you didn't know you were leaving on the table.",
  },
  {
    icon: "🚀",
    title: "Your next move finds you",
    body: "A living portfolio of your work is the strongest signal you can send. Built quietly, shared when the moment calls for it.",
  },
];

export default function Trust() {
  return (
    <section id="trust" className="py-24" style={{ background: "linear-gradient(180deg, #080B14 0%, #0A0F1E 100%)" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-widest text-[#F59E0B] mb-4">Why it matters</p>
          <h2 className="text-4xl lg:text-5xl font-bold text-[#F8F4EC] leading-tight">
            The record is the leverage.
          </h2>
          <p className="text-lg text-[#6B7280] mt-4 max-w-xl mx-auto">
            Top performers don&rsquo;t just close more. They have better evidence of what they&rsquo;ve closed.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {reasons.map((r) => (
            <div
              key={r.title}
              className="rounded-2xl p-6"
              style={{ background: "rgba(245,158,11,0.03)", border: "1px solid rgba(245,158,11,0.1)" }}
            >
              <div className="text-3xl mb-4">{r.icon}</div>
              <h3 className="text-base font-semibold text-[#F8F4EC] mb-2">{r.title}</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">{r.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
