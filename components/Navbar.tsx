"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled
          ? "rgba(8,11,20,0.92)"
          : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold text-[#F8F4EC]">
            Record<span style={{ color: "#F59E0B" }}>Year</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm text-[#6B7280]">
          <a href="#how-it-works" className="hover:text-[#F8F4EC] transition-colors">How it works</a>
          <a href="#trust" className="hover:text-[#F8F4EC] transition-colors">Why it matters</a>
        </div>

        <Link
          href="/login"
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
          style={{
            background: "linear-gradient(135deg,#F59E0B 0%,#FCD34D 100%)",
            color: "#080B14",
          }}
        >
          Get early access
        </Link>
      </div>
    </nav>
  );
}
