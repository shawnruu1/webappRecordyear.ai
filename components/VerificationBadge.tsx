import {
  VERIFICATION_TIER_META,
  VOUCHED_META,
  type VerificationTier,
} from "@/types";

// ------------------------------------------------------------
// VerificationBadge — presentational only.
// Renders the honest, public-facing label for a record's tier. All
// copy and color come from VERIFICATION_TIER_META, so this component
// never decides what a tier means — it only draws it.
// ------------------------------------------------------------

interface Props {
  tier: VerificationTier;
  vouched?: boolean;
}

export default function VerificationBadge({ tier, vouched = false }: Props) {
  const meta = VERIFICATION_TIER_META[tier];

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
        title={meta.proves}
        style={{
          background: `${meta.color}14`,
          color: meta.color,
          border: `1px solid ${meta.color}33`,
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: meta.color }}
        />
        {meta.displayLabel}
      </span>

      {vouched && (
        <span
          className="inline-flex items-center text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
          title={VOUCHED_META.proves}
          style={{
            background: `${VOUCHED_META.color}14`,
            color: VOUCHED_META.color,
            border: `1px solid ${VOUCHED_META.color}33`,
          }}
        >
          {VOUCHED_META.label}
        </span>
      )}
    </span>
  );
}
