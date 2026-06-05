const TICKER =
  "DEAL CLOSED · RECORD YEAR · QUOTA HIT · PERMANENT RECORD · RECOGNITION EARNED · CAREER PROOF · DEAL CLOSED · RECORD YEAR · QUOTA HIT · PERMANENT RECORD · RECOGNITION EARNED · CAREER PROOF · ";

// Stadium-scoreboard ticker between Hero and Problem. CSS-only marquee:
// two identical copies side by side, the flex track slid left by 50%
// (one copy width) on a linear infinite loop, so the seam is invisible.
export default function MarqueeDivider() {
  return (
    <div className="w-full overflow-hidden py-3" style={{ background: "#0D0D0D" }}>
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>

      <div className="flex w-max" style={{ animation: "marquee 28s linear infinite" }}>
        <span
          className="text-sm uppercase whitespace-nowrap"
          style={{ color: "#C8960C", letterSpacing: "0.2em" }}
        >
          {TICKER}
        </span>
        <span
          aria-hidden="true"
          className="text-sm uppercase whitespace-nowrap"
          style={{ color: "#C8960C", letterSpacing: "0.2em" }}
        >
          {TICKER}
        </span>
      </div>
    </div>
  );
}
