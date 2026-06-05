"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { playfair } from "@/lib/marketingFonts";

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
        background: "var(--mkt-bg)",
        borderBottom: `1px solid ${scrolled ? "var(--mkt-rule)" : "transparent"}`,
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className={`${playfair.className} text-xl font-bold`}
          style={{ color: "var(--mkt-ink)" }}
        >
          RecordYear
        </Link>

        <div
          className="hidden md:flex items-center gap-8 text-sm"
          style={{ color: "var(--mkt-ink-muted)" }}
        >
          <a href="#how-it-works" className="transition-colors hover:text-[var(--mkt-ink)]">
            How it works
          </a>
          <a href="#trust" className="transition-colors hover:text-[var(--mkt-ink)]">
            Why it matters
          </a>
        </div>

        <Link
          href="/login"
          className="px-4 py-2 rounded-sm text-sm font-medium transition-opacity hover:opacity-90"
          style={{ background: "var(--mkt-ink)", color: "var(--mkt-bg)" }}
        >
          Get early access
        </Link>
      </div>
    </nav>
  );
}
