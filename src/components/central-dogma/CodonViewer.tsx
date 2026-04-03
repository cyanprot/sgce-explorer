import { COLORS } from "@/constants/protein-data";
import { hexWithAlpha } from "@/utils/hexWithAlpha";
import { WT_CODONS, MUTANT_CODONS } from "@/constants/codon-data";
import type { Codon } from "@/types";

interface CodonViewerProps {
  visible?: boolean;
  activeCodon?: number;
}

function CodonCell({
  codon,
  prefix,
}: {
  codon: Codon;
  prefix: "wt" | "mut";
}) {
  const bg = codon.isPTC
    ? COLORS.danger
    : codon.isFrameshifted
      ? COLORS.dangerDim
      : COLORS.panel;
  const border = codon.isMutationStart
    ? COLORS.danger
    : codon.isFrameshifted
      ? hexWithAlpha(COLORS.danger, 0.4)
      : COLORS.panelBorder;

  return (
    <div
      data-testid={`${prefix}-codon-${codon.position}`}
      className={`inline-flex flex-col items-center px-1 py-0.5 border rounded text-xs ${codon.isFrameshifted ? "frameshift" : ""}`}
      style={{
        background: bg,
        borderColor: border,
        color: COLORS.text,
        minWidth: 36,
      }}
    >
      <span className="font-mono text-[10px]" style={{ color: COLORS.textDim }}>
        {codon.nucleotides}
      </span>
      <span className="font-bold">{codon.aminoAcid}</span>
      <span className="text-[10px]" style={{ color: COLORS.textDim }}>
        {codon.position}
      </span>
    </div>
  );
}

export function CodonViewer({ visible = true }: CodonViewerProps) {
  if (!visible) return null;

  return (
    <div
      className="rounded-xl p-4 border"
      style={{ background: COLORS.panel, borderColor: COLORS.panelBorder }}
    >
      <div className="mb-3">
        <h4
          className="text-xs font-semibold mb-2"
          style={{ color: COLORS.mrna }}
        >
          Wild Type
        </h4>
        <div className="flex gap-0.5 overflow-x-auto pb-1">
          {WT_CODONS.map((c) => (
            <CodonCell key={c.position} codon={c} prefix="wt" />
          ))}
        </div>
      </div>
      <div>
        <h4
          className="text-xs font-semibold mb-2"
          style={{ color: COLORS.danger }}
        >
          Mutant
        </h4>
        <div className="flex gap-0.5 overflow-x-auto pb-1">
          {MUTANT_CODONS.map((c) => (
            <CodonCell key={c.position} codon={c} prefix="mut" />
          ))}
        </div>
      </div>
    </div>
  );
}
