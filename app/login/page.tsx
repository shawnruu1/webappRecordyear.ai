"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ROLE_OPTIONS, DEFAULT_USER_ROLE } from "@/types";
import type { UserRole } from "@/types";
import Link from "next/link";
import { playfair, dmSans } from "@/lib/marketingFonts";

// Shared editorial field styling: cream field, warm-grey rule border that
// darkens to ink on focus (no glow), ink text, square-ish corners.
const FIELD_CLASS =
  "w-full px-4 py-3 rounded-sm text-sm border border-[#D4CBC0] focus:border-[#0D0D0D] focus:outline-none";
const FIELD_STYLE = { background: "#F2EDE4", color: "#0D0D0D" } as const;

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
    <div
      className={`${dmSans.className} min-h-screen flex flex-col items-center justify-center px-6`}
      style={{ background: "#F2EDE4" }}
    >
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center">
          <span
            className={`${playfair.className} text-2xl font-bold`}
            style={{ color: "#0D0D0D" }}
          >
            RecordYear
          </span>
        </Link>

        <div className="mt-14">
          {step === "email" ? (
            <>
              <h1
                className={`${playfair.className} text-4xl font-bold mb-2`}
                style={{ color: "#0D0D0D" }}
              >
                Sign in
              </h1>
              <p className="text-sm mb-8" style={{ color: "#6B6560" }}>
                We&rsquo;ll email you a sign-in code.
              </p>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className={`${FIELD_CLASS} placeholder-[#A39C94]`}
                  style={FIELD_STYLE}
                />
                <div>
                  <label
                    htmlFor="role"
                    className="block text-xs mb-1.5"
                    style={{ color: "#6B6560" }}
                  >
                    What best describes your work?
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className={`${FIELD_CLASS} appearance-none`}
                    style={FIELD_STYLE}
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                {error && (
                  <p className="text-sm" style={{ color: "#B42318" }}>
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-sm text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: "#0D0D0D", color: "#F2EDE4" }}
                >
                  {loading ? "Sending..." : "Send code →"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1
                className={`${playfair.className} text-4xl font-bold mb-2`}
                style={{ color: "#0D0D0D" }}
              >
                Enter your code
              </h1>
              <p className="text-sm mb-8" style={{ color: "#6B6560" }}>
                We sent a sign-in code to{" "}
                <span style={{ color: "#0D0D0D" }}>{email}</span>.
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
                  className={`${FIELD_CLASS} placeholder-[#A39C94] tracking-[0.5em] text-center font-mono`}
                  style={FIELD_STYLE}
                />
                {error && (
                  <p className="text-sm" style={{ color: "#B42318" }}>
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loading || code.length !== 8}
                  className="w-full py-3 rounded-sm text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: "#0D0D0D", color: "#F2EDE4" }}
                >
                  {loading ? "Verifying..." : "Sign in →"}
                </button>
              </form>

              <button
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setError("");
                }}
                className="mt-6 w-full text-xs transition-colors hover:text-[#0D0D0D]"
                style={{ color: "#6B6560" }}
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
