import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Problem from "@/components/Problem";
import HowItWorks from "@/components/HowItWorks";
import Trust from "@/components/Trust";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import { dmSans } from "@/lib/marketingFonts";

// Marketing-only design tokens, scoped to the landing tree (cascades to
// every component below). DM Sans is the base typeface; headlines opt into
// Playfair per-component. Product app tokens in globals.css are untouched.
const marketingStyle = {
  "--mkt-bg": "#F2EDE4",
  "--mkt-ink": "#0D0D0D",
  "--mkt-ink-muted": "#6B6560",
  "--mkt-gold": "#C8960C",
  "--mkt-rule": "#D4CBC0",
  background: "var(--mkt-bg)",
} as React.CSSProperties;

export default function Home() {
  return (
    <div className={dmSans.className} style={marketingStyle}>
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <Trust />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
