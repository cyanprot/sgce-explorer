import { useMemo } from "react";
import type { Variant } from "@/types";
import { COLORS, DOMAINS, PROTEIN_LENGTH } from "@/constants/protein-data";
import { SIG_COLOR, significanceTier } from "@/constants/variant-display";

interface LollipopMapProps {
  variants: Variant[];
  selectedId: string;
  onSelect: (v: Variant) => void;
}

const W = 900;
const H = 210;
const MX = 24; // horizontal margin
const BASELINE = 168;
const BAND_TOP = 170;
const BAND_H = 16;
const TIER_Y = [40, 74, 108]; // head y per significance tier
const PLOT_W = W - MX * 2;

function xFor(pos: number): number {
  return MX + ((pos - 1) / (PROTEIN_LENGTH - 1)) * PLOT_W;
}

/**
 * Needle/lollipop map of all catalogued variants along residues 1-437.
 * Visual aid only (aria-hidden); the accessible path is the variant list.
 */
export function LollipopMap({ variants, selectedId, onSelect }: LollipopMapProps) {
  // Draw severe-on-bottom so pathogenic heads paint last (on top).
  const ordered = useMemo(
    () => [...variants].sort((a, b) => significanceTier(b.significance) - significanceTier(a.significance)),
    [variants],
  );

  return (
    <div className="overflow-x-auto no-scrollbar">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", minWidth: 640, height: "auto" }}
        aria-hidden="true"
      >
        {/* Domain bands */}
        {Object.values(DOMAINS).map((d) => {
          const x1 = xFor(d.start);
          const x2 = xFor(d.end);
          return (
            <g key={d.label}>
              <rect
                x={x1}
                y={BAND_TOP}
                width={Math.max(1, x2 - x1)}
                height={BAND_H}
                fill={d.color}
                opacity={0.85}
                rx={2}
              />
              {x2 - x1 > 60 && (
                <text x={(x1 + x2) / 2} y={BAND_TOP + BAND_H + 12} textAnchor="middle" fontSize={9} fill={COLORS.textDim}>
                  {d.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Baseline */}
        <line x1={MX} y1={BASELINE} x2={W - MX} y2={BASELINE} stroke={COLORS.panelBorder} strokeWidth={1} />

        {/* Needles */}
        {ordered.map((v) => {
          const x = xFor(v.aaPosition);
          const y = TIER_Y[significanceTier(v.significance)];
          const isSel = v.id === selectedId;
          const isPatient = v.isPatient;
          const color = SIG_COLOR[v.significance];
          return (
            <g
              key={v.id + v.aaPosition}
              onClick={() => onSelect(v)}
              style={{ cursor: "pointer" }}
            >
              <title>{`${v.notation} · ${v.consequence} · ${v.significance} (res ${v.aaPosition})`}</title>
              <line x1={x} y1={BASELINE} x2={x} y2={y} stroke={color} strokeWidth={isSel || isPatient ? 1.6 : 0.7} opacity={isSel || isPatient ? 1 : 0.5} />
              {isPatient ? (
                <circle cx={x} cy={y} r={7} fill={color} stroke={COLORS.text} strokeWidth={1.5} />
              ) : (
                <circle cx={x} cy={y} r={isSel ? 6 : 3.4} fill={color} stroke={isSel ? COLORS.text : "none"} strokeWidth={isSel ? 1.5 : 0} opacity={isSel ? 1 : 0.85} />
              )}
              {isPatient && (
                <text x={x} y={y - 10} textAnchor="middle" fontSize={9} fontWeight={700} fill={COLORS.text}>
                  ★ patient
                </text>
              )}
            </g>
          );
        })}

        {/* Position axis ticks */}
        {[1, DOMAINS.extracellular.end, DOMAINS.transmembrane.end, PROTEIN_LENGTH].map((p) => (
          <text key={p} x={xFor(p)} y={H - 4} textAnchor="middle" fontSize={8} fill={COLORS.textDim}>
            {p}
          </text>
        ))}
      </svg>
    </div>
  );
}
