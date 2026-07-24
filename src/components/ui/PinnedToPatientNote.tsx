import { COLORS, MUTATION } from "@/constants/protein-data";
import { useVariantStore } from "@/store/variantStore";

/**
 * Disclosure banner for panels whose content is pinned to the patient's own
 * variant rather than the reader's current selection.
 *
 * Rendered BY the pinned panel, not by its parent, so the pin and the disclosure
 * cannot be separated by a later edit. The Central Dogma tab had this note; the
 * Imprinting tab was pinned the same way and never got one, so selecting a VUS
 * and opening Imprinting showed "★ c.108dup HERE", a section headed "Consequence
 * for Patient", and "0/2 functional alleles = COMPLETE loss of function" — while
 * the header chip displayed the reader's own selection.
 *
 * Renders nothing when the selection IS the patient variant.
 */
export function PinnedToPatientNote({ what }: { what: string }) {
  const selected = useVariantStore((s) => s.selected);
  if (selected.isPatient) return null;

  return (
    <div
      className="rounded-lg px-4 py-2 mb-4 text-xs border"
      style={{ background: COLORS.accentDim, borderColor: COLORS.panelBorder, color: COLORS.text }}
      role="note"
    >
      {what} follows the site author's own variant{" "}
      <span className="font-mono">{MUTATION.cNotation}</span> ({MUTATION.notation}) — not your
      selection. Your current selection{" "}
      <span className="font-mono">{selected.cNotation || selected.notation}</span> is shown in the
      Structure and Variants tabs.
    </div>
  );
}
