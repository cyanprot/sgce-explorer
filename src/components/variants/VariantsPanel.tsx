import { useState } from "react";
import type { ClinicalSignificance, ConsequenceClass, Variant } from "@/types";
import { COLORS } from "@/constants/protein-data";
import { CATALOG_STATS } from "@/constants/variant-catalog";
import { SIG_COLOR, SIG_LABEL, CONSEQUENCE_LABEL } from "@/constants/variant-display";
import { useVariants } from "@/hooks/useVariants";
import { useVariantStore } from "@/store/variantStore";
import { LollipopMap } from "./LollipopMap";
import { VariantFilters } from "./VariantFilters";
import { VariantList } from "./VariantList";

interface VariantsPanelProps {
  onViewStructure?: () => void;
}

export function VariantsPanel({ onViewStructure }: VariantsPanelProps) {
  const [query, setQuery] = useState("");
  const [consequence, setConsequence] = useState<ConsequenceClass | "all">("all");
  const [significance, setSignificance] = useState<ClinicalSignificance | "all">("all");

  const selected = useVariantStore((s) => s.selected);
  const setSelected = useVariantStore((s) => s.setSelected);
  const resetToPatient = useVariantStore((s) => s.resetToPatient);

  const filtered = useVariants({ query, consequence, significance });
  // Lollipop always shows the full catalog for context, regardless of list filters.
  const all = useVariants();

  const pick = (v: Variant) => setSelected(v);

  return (
    <div data-testid="variants-panel" className="p-6 min-h-[calc(100dvh-var(--app-header-h)-80px)]">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
        <h2 className="text-lg font-bold m-0" style={{ color: COLORS.text }}>
          Known SGCE Variants
        </h2>
        <span className="text-xs font-mono" style={{ color: COLORS.textDim }}>
          {CATALOG_STATS.total} catalogued · {CATALOG_STATS.pathogenic} pathogenic/likely · UniProt O43556
        </span>
      </div>
      <p className="text-xs mb-3" style={{ color: COLORS.textDim }}>
        Pick a variant to drive the 3D structure, sequence and central-dogma views. The patient's
        c.108dup is marked ★.
      </p>

      <LollipopMap variants={all} selectedId={selected.id} onSelect={pick} />

      {/* Significance legend */}
      <div className="flex flex-wrap gap-3 my-2 text-[10px]" style={{ color: COLORS.textDim }}>
        {(Object.keys(SIG_LABEL) as ClinicalSignificance[]).map((s) => (
          <span key={s} className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: SIG_COLOR[s] }} />
            {SIG_LABEL[s]}
          </span>
        ))}
      </div>

      {/* Selected summary */}
      <div
        className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-3 py-2 my-3"
        style={{ background: COLORS.panel, borderColor: COLORS.panelBorder }}
      >
        <span className="text-xs" style={{ color: COLORS.textDim }}>Selected:</span>
        <span className="font-mono text-sm" style={{ color: COLORS.accent }}>{selected.notation}</span>
        <span className="text-xs" style={{ color: COLORS.textDim }}>
          {CONSEQUENCE_LABEL[selected.consequence]} · res {selected.aaPosition}
        </span>
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: `${SIG_COLOR[selected.significance]}22`, color: SIG_COLOR[selected.significance] }}>
          {SIG_LABEL[selected.significance]}
        </span>
        {onViewStructure && (
          <button onClick={onViewStructure} className="text-xs font-semibold px-2 py-1 rounded ml-auto" style={{ background: COLORS.accent, color: COLORS.bg }}>
            View in 3D →
          </button>
        )}
        {!selected.isPatient && (
          <button onClick={resetToPatient} className="text-xs px-2 py-1 rounded border" style={{ color: COLORS.textDim, borderColor: COLORS.panelBorder }}>
            Reset to patient
          </button>
        )}
      </div>

      <VariantFilters
        query={query}
        consequence={consequence}
        significance={significance}
        onQuery={setQuery}
        onConsequence={setConsequence}
        onSignificance={setSignificance}
        total={all.length}
        shown={filtered.length}
      />

      <VariantList variants={filtered} selectedId={selected.id} onSelect={pick} />
    </div>
  );
}
