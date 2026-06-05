import { Playfair_Display, DM_Sans } from "next/font/google";

// Marketing-only typefaces. Editorial "record book" direction:
// Playfair Display for display headlines, DM Sans for body/UI.
// Imported per marketing component; next/font de-dupes the loaders.

export const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

export const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});
