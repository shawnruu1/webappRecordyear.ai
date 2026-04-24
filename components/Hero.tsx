"use client";

import { useState, useEffect } from "react";

const signals = [
  { label: "Deal moved to Closed Won", source: "CRM", color: "#10B981" },
  { label: "QBR — VP of Engineering", source: "Calendar", color: "#818CF8" },
  { label: "Renewal thread with Acme", source: "Email", color: "#F59E0B" },
  { label: "Called out in #wins", source: "Slack", color: "#EC4899" },
  { label: "Multi-thread discovery call", source: "Gong", color: "#8B5CF6" },
];

const entries = [
  {
    icon: "✦", color: "#10B981", bg: "rgba(16,185,129,0.1)",
    title: "Deal closed — $180K ARR",
    tags: ["Enterprise sales", "Procurement negotiation"],
  },
  {
    icon: "◆", color: "#818CF8", bg: "rgba(129,140,248,0.1)",
    title: "Skills inferred this month",
    tags: ["Exec storytelling", "Multi-threading"],
  },
  {
    icon: "▲", color: "#F59E0B", bg: "rgba(245,158,11,0.1)",
    title: "Promoted — Enterprise AE",
    tags: ["Career milestone"],
  },
];

export default function Hero() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [activeSignal, setActiveSignal] = useState(0);
  const [activeEntry, setActiveEntry] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActiveSignal((s) => (s + 1) % signals.length), 1800);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActiveEntry((e) => (e + 1) % entries.length), 2600);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    console.log("Hero CTA submitted:", email);
    setSubmitted(true);
  };

  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-20 overflow-hidden bg-[#080B14]">
      <style>{`
        @keyframes spin-slow    { to { transform: rotate(360deg); } }
        @keyframes spin-reverse { to { transform: rotate(-360deg); } }
        @keyframes pulse-core {
          0%,100% { box-shadow: 0 0 20px rgba(245,158,11,0.35); }
          50%      { box-shadow: 0 0 44px rgba(245,158,11,0.65); }
        }
        @keyframes particle {
          0%   { opacity:0; transform:translateX(0); }
          15%  { opacity:1; }
          85%  { opacity:.7; }
          100% { opacity:0; transform:translateX(100px); }
        }
      `}</style>

      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 70% 50% at 50% -5%, rgba(245,158,11,0.11) 0%, transparent 65%)",
      }} />
      <div className="absolute inset-0 pointer-events-none opacity-[0.025]" style={{
        backgroundImage: "linear-gradient(rgba(248,244,236,1) 1px,transparent 1px),linear-gradient(90deg,rgba(248,244,236,1) 1px,transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      <div className="relative max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        {/* LEFT: Copy */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium mb-8"
            style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", color: "#FCD34D" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse" />
            Now in private beta
          </div>

          <h1 className="text-5xl lg:text-6xl font-bold leading-[1.08] tracking-tight mb-6 text-[#F8F4EC]">
            Stop losing<br />
            your wins the<br />
            <span style={{ color: "#F59E0B" }}>moment you make them.</span>
          </h1>

          <p className="text-lg text-[#6B7280] leading-relaxed mb-4 max-w-md">
            You close deals, hit quota, and build your reputation. Then review time comes and you can&rsquo;t remember what you did six months ago.
          </p>
          <p className="text-lg text-[#8B909E] leading-relaxed mb-10 max-w-md">
            RecordYear captures every win automatically. Weekly digest. Permanent record.
          </p>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="flex gap-3 max-w-md">
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Your work email" required
                className="flex-1 px-4 py-3 rounded-xl text-sm text-[#F8F4EC] placeholder-[#4B5563] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/40"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
              <button type="submit"
                className="px-6 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all hover:opacity-90 hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg,#F59E0B 0%,#FCD34D 100%)", color: "#080B14", boxShadow: "0 0 24px -4px rgba(245,158,11,0.5)" }}>
                Get early access →
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl max-w-md"
              style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <span className="text-[#F59E0B] text-lg">✓</span>
              <p className="text-sm text-[#F8F4EC]">You&rsquo;re on the list. We&rsquo;ll be in touch.</p>
            </div>
          )}
          <p className="text-xs text-[#374151] mt-4">Free during beta · No credit card required</p>
        </div>

        {/* RIGHT: Animated visual */}
        <div className="flex justify-center lg:justify-end">
          <div className="w-full max-w-sm flex flex-col gap-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#374151] text-center">
              How it works — live
            </p>

            {/* Signal feed */}
            <div className="rounded-2xl p-4"
              style={{ background: "linear-gradient(160deg,#0E1628 0%,#080B14 100%)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#374151] mb-3">Your activity</p>
              <div className="space-y-2">
                {signals.slice(0, 3).map((s, i) => {
                  const isActive = i === activeSignal % 3;
                  return (
                    <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-400"
                      style={{
                        background: isActive ? `${s.color}10` : "rgba(255,255,255,0.02)",
                        border: `1px solid ${isActive ? s.color + "30" : "rgba(255,255,255,0.04)"}`,
                        opacity: isActive ? 1 : 0.3,
                      }}>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                        style={{ background: `${s.color}18`, color: s.color }}>{s.source}</span>
                      <span className="text-[11px] text-[#6B7280] truncate">{s.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Engine */}
            <div className="flex items-center justify-center gap-4 py-1 relative">
              <div className="flex-1 relative h-6 overflow-hidden">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                    style={{ background: "linear-gradient(90deg,#F59E0B,#FCD34D)", left: 0, opacity: 0,
                      animation: `particle 1.4s ease-in-out ${i * 0.45}s infinite` }} />
                ))}
                <div className="absolute top-1/2 left-0 right-0 h-px" style={{ background: "rgba(245,158,11,0.12)" }} />
              </div>

              <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: 72, height: 72 }}>
                <div className="absolute inset-0 rounded-full" style={{ border: "1px dashed rgba(245,158,11,0.2)", animation: "spin-slow 7s linear infinite" }} />
                <div className="absolute rounded-full" style={{ inset: 8, border: "1px solid rgba(245,158,11,0.12)", animation: "spin-reverse 4s linear infinite" }} />
                <div className="relative z-10 flex flex-col items-center justify-center rounded-full w-11 h-11"
                  style={{ background: "radial-gradient(circle at 40% 35%,#1a2540,#0a0f1e)", border: "1px solid rgba(245,158,11,0.3)", animation: "pulse-core 2.5s ease-in-out infinite" }}>
                  <span className="text-[10px] font-bold" style={{ color: "#F59E0B" }}>AI</span>
                </div>
              </div>

              <div className="flex-1 relative h-6 overflow-hidden">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                    style={{ background: "linear-gradient(90deg,#FCD34D,#F59E0B)", left: 0, opacity: 0,
                      animation: `particle 1.4s ease-in-out ${i * 0.45 + 0.2}s infinite` }} />
                ))}
                <div className="absolute top-1/2 left-0 right-0 h-px" style={{ background: "rgba(245,158,11,0.12)" }} />
              </div>
            </div>

            {/* Portfolio output */}
            <div className="rounded-2xl p-4"
              style={{ background: "linear-gradient(160deg,#0E1628 0%,#080B14 100%)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#374151] mb-3">Your portfolio — building</p>
              {entries.slice(0, 2).map((entry, i) => (
                <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg mb-2"
                  style={{
                    background: i === activeEntry % 2 ? `${entry.color}08` : "rgba(255,255,255,0.02)",
                    border: `1px solid ${i === activeEntry % 2 ? entry.color + "25" : "rgba(255,255,255,0.04)"}`,
                    opacity: i === activeEntry % 2 ? 0.9 : 0.28,
                  }}>
                  <span className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] flex-shrink-0"
                    style={{ background: entry.bg, color: entry.color }}>{entry.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-[#C4C9D4] truncate">{entry.title}</p>
                    <div className="flex gap-1 mt-0.5">
                      {entry.tags.map((t) => (
                        <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full"
                          style={{ background: `${entry.color}12`, color: entry.color }}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              <div key={activeEntry} className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
                style={{ background: `${entries[activeEntry].color}10`, border: `1px solid ${entries[activeEntry].color}35` }}>
                <span className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] flex-shrink-0 animate-pulse"
                  style={{ background: entries[activeEntry].bg, color: entries[activeEntry].color }}>{entries[activeEntry].icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold truncate" style={{ color: entries[activeEntry].color }}>
                    {entries[activeEntry].title}
                  </p>
                </div>
                <span className="text-[#F59E0B] text-xs">✓</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
