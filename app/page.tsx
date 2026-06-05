import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import MarqueeDivider from "@/components/MarqueeDivider";
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
  position: "relative",
} as React.CSSProperties;

export default function Home() {
  return (
    <div className={`${dmSans.className} mkt-grain`} style={marketingStyle}>
      <style>{`
        .mkt-grain::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 100;
          opacity: 0.035;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 128px 128px;
        }
      `}</style>
      <Navbar />
      <main>
        <Hero />
        <MarqueeDivider />
        <Problem />
        <HowItWorks />
        <Trust />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
