import { useCallback, useDeferredValue, useState } from "react";
import type { ClinicalSignificance, ConsequenceClass, Variant } from "@/types";
import { COLORS } from "@/constants/protein-data";
import { CATALOG_STATS } from "@/constants/variant-catalog";
import { SIG_COLOR, SIG_LABEL } from "@/constants/variant-display";
import { useVariants } from "@/hooks/useVariants";
import { useVariantStore } from "@/store/variantStore";
import { LollipopMap } from "./LollipopMap";
import { VariantFilters } from "./VariantFilters";
import { VariantList } from "./VariantList";
import { VariantDetail } from "./VariantDetail";

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

  // The search box stays responsive while filtering 600+ rows: React renders the
  // keystroke immediately and the filtered list at a lower priority.
  const deferredQuery = useDeferredValue(query);
  const filtered = useVariants({ query: deferredQuery, consequence, significance });
  // Lollipop always shows the full catalog for context, regardless of list filters.
  const all = useVariants();

  // Stable identity: a fresh closure here re-rendered every memoized row (and the
  // ~2,400-node lollipop) on each keystroke, defeating the memo entirely.
  const pick = useCallback((v: Variant) => setSelected(v), [setSelected]);

  return (
    <div data-testid="variants-panel" className="p-6 min-h-[calc(100dvh-var(--app-header-h)-var(--app-nav-h,80px))]">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
        <h2 className="text-lg font-bold m-0" style={{ color: COLORS.text }}>
          Known SGCE Variants
        </h2>
        {/* Provenance is split deliberately: the feed has no record for the
            patient's c.108dup, so `total` is one higher than UniProt's own
            count. Reading "608 catalogued · UniProt O43556" credited the feed
            with a row it does not contain. */}
        <span className="text-xs font-mono" style={{ color: COLORS.textDim }}>
          {CATALOG_STATS.fromUniProt} from UniProt O43556 + the patient's index variant ·{" "}
          {CATALOG_STATS.pathogenic} pathogenic/likely
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

      {/* Selected variant detail */}
      <VariantDetail variant={selected} onViewStructure={onViewStructure} onReset={resetToPatient} />

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
