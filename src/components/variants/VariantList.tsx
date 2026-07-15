import { memo } from "react";
import type { Variant } from "@/types";
import { COLORS } from "@/constants/protein-data";
import { hexWithAlpha } from "@/utils/hexWithAlpha";
import { SIG_COLOR, SIG_LABEL, CONSEQUENCE_LABEL } from "@/constants/variant-display";

const CAP = 200; // keep the list responsive; refine search to see more

interface VariantListProps {
  variants: Variant[];
  selectedId: string;
  onSelect: (v: Variant) => void;
}

const VariantRow = memo(function VariantRow({
  v,
  selected,
  onSelect,
}: {
  v: Variant;
  selected: boolean;
  onSelect: (v: Variant) => void;
}) {
  const sig = SIG_COLOR[v.significance];
  return (
    <button
      onClick={() => onSelect(v)}
      aria-current={selected ? "true" : undefined}
      className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-md border transition-colors"
      style={{
        background: selected ? hexWithAlpha(COLORS.accent, 0.14) : COLORS.panel,
        borderColor: selected ? COLORS.accent : COLORS.panelBorder,
      }}
    >
      <span className="font-mono text-xs w-10 shrink-0" style={{ color: COLORS.textDim }}>
        {v.aaPosition}
      </span>
      <span className="font-mono text-sm shrink-0 w-28" style={{ color: COLORS.text }}>
        {v.notation}
      </span>
      <span className="text-xs shrink-0 w-24" style={{ color: COLORS.textDim }}>
        {CONSEQUENCE_LABEL[v.consequence]}
      </span>
      <span
        className="text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0"
        style={{ background: hexWithAlpha(sig, 0.18), color: sig }}
      >
        {SIG_LABEL[v.significance]}
      </span>
      {v.isPatient && (
        <span className="text-[10px] font-bold ml-auto shrink-0" style={{ color: COLORS.danger }}>
          ★ patient
        </span>
      )}
      {!v.isPatient && v.edit && (
        <span className="text-[9px] ml-auto shrink-0" style={{ color: COLORS.success }} title="Consequence engine can recompute this variant">
          ● live
        </span>
      )}
    </button>
  );
});

export function VariantList({ variants, selectedId, onSelect }: VariantListProps) {
  const capped = variants.slice(0, CAP);
  return (
    <div>
      <div
        className="flex flex-col gap-1 overflow-y-auto no-scrollbar pr-1"
        style={{ maxHeight: "min(46vh, 420px)" }}
        role="list"
      >
        {capped.map((v) => (
          <div role="listitem" key={v.id + v.aaPosition}>
            <VariantRow v={v} selected={v.id === selectedId} onSelect={onSelect} />
          </div>
        ))}
        {capped.length === 0 && (
          <p className="text-sm py-6 text-center" style={{ color: COLORS.textDim }}>
            No variants match the current filters.
          </p>
        )}
      </div>
      {variants.length > CAP && (
        <p className="text-xs mt-2 text-center" style={{ color: COLORS.textDim }}>
          Showing first {CAP} of {variants.length}. Refine your search to narrow the list.
        </p>
      )}
    </div>
  );
}
