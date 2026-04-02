import { DOMAINS } from "@/constants/protein-data";

/** Returns domain info for a 1-indexed amino acid position, or null if out of range. */
export function getDomainForPosition(
  position: number,
): { label: string; color: string } | null {
  for (const domain of Object.values(DOMAINS)) {
    if (position >= domain.start && position <= domain.end) {
      return { label: domain.label, color: domain.color };
    }
  }
  return null;
}
