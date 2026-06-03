"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ROLE_OPTIONS, DEFAULT_USER_ROLE } from "@/types";
import type { UserRole } from "@/types";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [role, setRole] = useState<UserRole>(DEFAULT_USER_ROLE);
  const [step, setStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1 — send OTP to email (no emailRedirectTo = 6-digit code, not a link)
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setStep("code");
    }
  };

  // Step 2 — verify 6-digit code
  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email",
    });

    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    // Capture role once at signup. ignoreDuplicates leaves an existing
    // profile (returning user) untouched — only first sign-in writes it.
    if (data.user) {
      await supabase
        .from("profiles")
        .upsert(
          { id: data.user.id, role },
          { onConflict: "id", ignoreDuplicates: true }
        );
    }

    setLoading(false);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#080B14] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center mb-10">
          <span className="text-2xl font-bold text-[#F8F4EC]">
            Record<span style={{ color: "#F59E0B" }}>Year</span>
          </span>
        </Link>

        <div
          className="rounded-2xl p-8"
          style={{
            background: "linear-gradient(160deg,#0E1628 0%,#080B14 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {step === "email" ? (
            <>
              <h1 className="text-xl font-bold text-[#F8F4EC] mb-2">Sign in</h1>
              <p className="text-sm text-[#6B7280] mb-6">
                We&rsquo;ll email you a sign-in code.
              </p>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full px-4 py-3 rounded-xl text-sm text-[#F8F4EC] placeholder-[#4B5563] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/40"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                />
                <div>
                  <label
                    htmlFor="role"
                    className="block text-xs text-[#6B7280] mb-1.5"
                  >
                    What best describes your work?
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-4 py-3 rounded-xl text-sm text-[#F8F4EC] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/40 appearance-none"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option
                        key={opt.value}
                        value={opt.value}
                        className="bg-[#0E1628] text-[#F8F4EC]"
                      >
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg,#F59E0B 0%,#FCD34D 100%)",
                    color: "#080B14",
                  }}
                >
                  {loading ? "Sending..." : "Send code →"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-[#F8F4EC] mb-2">Enter your code</h1>
              <p className="text-sm text-[#6B7280] mb-6">
                We sent a sign-in code to{" "}
                <span className="text-[#F8F4EC]">{email}</span>.
              </p>

              <form onSubmit={handleCodeSubmit} className="space-y-4">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{8}"
                  maxLength={8}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="00000000"
                  required
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl text-sm text-[#F8F4EC] placeholder-[#4B5563] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/40 tracking-[0.5em] text-center font-mono"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                />
                {error && <p className="text-sm text-red-400">{error}</p>}
                <button
                  type="submit"
                  disabled={loading || code.length !== 8}
                  className="w-full py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg,#F59E0B 0%,#FCD34D 100%)",
                    color: "#080B14",
                  }}
                >
                  {loading ? "Verifying..." : "Sign in →"}
                </button>
              </form>

              <button
                onClick={() => { setStep("email"); setCode(""); setError(""); }}
                className="mt-4 w-full text-xs text-[#6B7280] hover:text-[#F8F4EC] transition-colors"
              >
                Use a different email
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
