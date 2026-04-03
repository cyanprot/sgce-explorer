import type { DGCPartnerState } from "@/hooks/useDGCProteins";
import { COLORS } from "@/constants/protein-data";
import { hexWithAlpha } from "@/utils/hexWithAlpha";

interface DGCLegendProps {
  partners: DGCPartnerState[];
  showMutant: boolean;
}

// ε-SG is always present (it's the primary protein being viewed)
const EPSILON: {
  gene: string;
  name: string;
  color: string;
  loaded: true;
} = {
  gene: "SGCE",
  name: "ε-Sarcoglycan",
  color: COLORS.extracellular,
  loaded: true,
};

export function DGCLegend({ partners, showMutant }: DGCLegendProps) {
  // Combine fetched partners + ε-SG into unified rows
  const rows = [
    ...partners.map((p) => ({
      gene: p.gene,
      name: p.name,
      color: p.color,
      loading: p.loading,
      loaded: p.pdbData !== null,
      error: p.error,
    })),
    {
      gene: EPSILON.gene,
      name: EPSILON.name,
      color: EPSILON.color,
      loading: false,
      loaded: true,
      error: null as string | null,
    },
  ];

  return (
    <div
      className="absolute bottom-3 right-3 rounded-lg px-3 py-2 text-xs"
      style={{ backgroundColor: hexWithAlpha(COLORS.overlay, 0.7) }}
    >
      <div className="mb-1.5 font-semibold text-white/90">
        Sarcoglycan Subcomplex
      </div>

      <div className="space-y-1">
        {rows.map((row) => (
          <div key={row.gene} className="flex items-center gap-2">
            <span
              data-testid="sgc-color-dot"
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: row.color }}
            />
            <span className="text-white/80">{row.name}</span>
            {row.loading && (
              <span
                data-testid={`sgc-loading-${row.gene}`}
                className="ml-auto h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white/80"
              />
            )}
            {row.loaded && !row.loading && (
              <span
                data-testid={`sgc-loaded-${row.gene}`}
                className="ml-auto text-emerald-400"
              >
                ✓
              </span>
            )}
            {row.error && !row.loading && (
              <span
                data-testid={`sgc-error-${row.gene}`}
                className="ml-auto text-red-400"
                title={row.error}
              >
                ✕
              </span>
            )}
          </div>
        ))}
      </div>

      {showMutant && (
        <div className="mt-2 border-t border-white/10 pt-1.5 text-red-400">
          ε-SG: truncated — subcomplex disrupted
        </div>
      )}
    </div>
  );
}
