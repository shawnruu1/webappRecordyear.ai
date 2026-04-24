import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RecordYear.ai — Career proof infrastructure for sales professionals",
  description:
    "RecordYear passively captures your work, uses AI to organize it into a career portfolio, and lets you approve it weekly. Turn your wins into permanent proof.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[#080B14] text-[#F8F4EC]">{children}</body>
    </html>
  );
}
