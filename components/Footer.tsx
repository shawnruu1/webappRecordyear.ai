export default function Footer() {
  return (
    <footer className="border-t py-8" style={{ borderColor: "rgba(255,255,255,0.06)", background: "#080B14" }}>
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <span className="text-sm font-semibold text-[#F8F4EC]">
          Record<span style={{ color: "#F59E0B" }}>Year</span>
        </span>
        <p className="text-xs text-[#374151]">
          © {new Date().getFullYear()} RecordYear. Built for sales professionals who do the work.
        </p>
      </div>
    </footer>
  );
}
