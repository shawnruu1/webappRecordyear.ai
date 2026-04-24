"use client";

import { useState } from "react";
import Link from "next/link";

export default function CTA() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    console.log("CTA submitted:", email);
    setSubmitted(true);
  };

  return (
    <section className="py-32 bg-[#080B14]">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <div className="rounded-3xl p-12"
          style={{
            background: "linear-gradient(160deg,#0E1628 0%,#080B14 100%)",
            border: "1px solid rgba(245,158,11,0.15)",
            boxShadow: "0 0 80px -20px rgba(245,158,11,0.12)",
          }}>
          <p className="text-xs font-bold uppercase tracking-widest text-[#F59E0B] mb-4">Private beta</p>
          <h2 className="text-4xl font-bold text-[#F8F4EC] mb-4 leading-tight">
            Start building your record today.
          </h2>
          <p className="text-[#6B7280] mb-8 max-w-md mx-auto">
            Free during beta. No credit card. Your wins start compounding the moment you log the first one.
          </p>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="flex gap-3 max-w-sm mx-auto">
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Your work email" required
                className="flex-1 px-4 py-3 rounded-xl text-sm text-[#F8F4EC] placeholder-[#4B5563] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/40"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
              <button type="submit"
                className="px-6 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#F59E0B 0%,#FCD34D 100%)", color: "#080B14" }}>
                Join →
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl max-w-sm mx-auto"
              style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <span className="text-[#F59E0B]">✓</span>
              <p className="text-sm text-[#F8F4EC]">You&rsquo;re on the list.</p>
            </div>
          )}

          <p className="text-xs text-[#374151] mt-4">
            Already have access?{" "}
            <Link href="/login" className="text-[#F59E0B] hover:underline">Sign in →</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
