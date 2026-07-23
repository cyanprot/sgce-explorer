import { COLORS } from "@/constants/protein-data";
import { SIG_LABEL, CONSEQUENCE_LABEL } from "@/constants/variant-display";
import type { ClinicalSignificance, ConsequenceClass } from "@/types";

interface VariantFiltersProps {
  query: string;
  consequence: ConsequenceClass | "all";
  significance: ClinicalSignificance | "all";
  onQuery: (v: string) => void;
  onConsequence: (v: ConsequenceClass | "all") => void;
  onSignificance: (v: ClinicalSignificance | "all") => void;
  total: number;
  shown: number;
}

const selectStyle = {
  background: COLORS.panel,
  color: COLORS.text,
  borderColor: COLORS.panelBorder,
} as const;

export function VariantFilters({
  query,
  consequence,
  significance,
  onQuery,
  onConsequence,
  onSignificance,
  total,
  shown,
}: VariantFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-3">
      <input
        type="search"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        placeholder="Search notation or residue…"
        aria-label="Search variants by notation or residue position"
        className="px-3 py-1.5 text-sm rounded-md border flex-1 min-w-[180px] outline-none focus-visible:ring-2"
        style={selectStyle}
      />
      <select
        value={consequence}
        onChange={(e) => onConsequence(e.target.value as ConsequenceClass | "all")}
        aria-label="Filter by consequence"
        className="px-2 py-1.5 text-sm rounded-md border"
        style={selectStyle}
      >
        <option value="all">All consequences</option>
        {(Object.keys(CONSEQUENCE_LABEL) as ConsequenceClass[]).map((c) => (
          <option key={c} value={c}>{CONSEQUENCE_LABEL[c]}</option>
        ))}
      </select>
      <select
        value={significance}
        onChange={(e) => onSignificance(e.target.value as ClinicalSignificance | "all")}
        aria-label="Filter by clinical significance"
        className="px-2 py-1.5 text-sm rounded-md border"
        style={selectStyle}
      >
        <option value="all">All significance</option>
        {(Object.keys(SIG_LABEL) as ClinicalSignificance[]).map((s) => (
          <option key={s} value={s}>{SIG_LABEL[s]}</option>
        ))}
      </select>
      {/* role="status" so a screen-reader user typing in the search box hears the
          result count change. Without it, filtering was silent: the only feedback
          was a number that never announced itself. */}
      <span
        className="text-xs font-mono ml-auto"
        style={{ color: COLORS.textDim }}
        role="status"
        aria-live="polite"
      >
        <span aria-hidden="true">
          {shown} / {total}
        </span>
        <span className="sr-only">
          {shown} of {total} variants shown
        </span>
      </span>
    </div>
  );
}
