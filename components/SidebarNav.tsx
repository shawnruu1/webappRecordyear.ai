"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Thin client wrapper around the nav items — its only job is to read the
// current pathname so the active item can be highlighted. All session /
// data reads stay in the server AppSidebar that renders this.

interface IconProps {
  className?: string;
}

function CaptureIcon({ className }: IconProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RecordsIcon({ className }: IconProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function ProfileIcon({ className }: IconProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M4 21c0-4 3.6-7 8-7s8 3 8 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

const NAV_ITEMS = [
  { href: "/capture", label: "Capture", Icon: CaptureIcon },
  { href: "/records", label: "My Records", Icon: RecordsIcon },
  { href: "/profile", label: "Profile", Icon: ProfileIcon },
] as const;

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`relative flex items-center gap-3 rounded-control px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "text-white bg-white/[0.07]"
                : "text-white/75 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            {active && (
              <span
                className="absolute left-0 top-1 bottom-1 w-[2px] rounded-full bg-accent"
                aria-hidden="true"
              />
            )}
            <Icon className={active ? "text-accent" : ""} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
