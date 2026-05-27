"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#080B14] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center mb-10">
          <span className="text-2xl font-bold text-[#F8F4EC]">
            Record<span style={{ color: "#F59E0B" }}>Year</span>
          </span>
        </Link>

        <div className="rounded-2xl p-8"
          style={{ background: "linear-gradient(160deg,#0E1628 0%,#080B14 100%)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {!sent ? (
            <>
              <h1 className="text-xl font-bold text-[#F8F4EC] mb-2">Sign in</h1>
              <p className="text-sm text-[#6B7280] mb-6">We&rsquo;ll send a magic link to your email.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com" required
                  className="w-full px-4 py-3 rounded-xl text-sm text-[#F8F4EC] placeholder-[#4B5563] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/40"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#F59E0B 0%,#FCD34D 100%)", color: "#080B14" }}>
                  {loading ? "Sending..." : "Send magic link →"}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="text-3xl mb-4">✉️</div>
              <h2 className="text-lg font-bold text-[#F8F4EC] mb-2">Check your email</h2>
              <p className="text-sm text-[#6B7280]">
                We sent a magic link to <span className="text-[#F8F4EC]">{email}</span>.
                Click it to sign in.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
