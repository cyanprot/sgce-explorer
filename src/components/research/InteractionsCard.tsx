import { COLORS } from "@/constants/protein-data";
import type { StringInteraction } from "@/types/research";

interface Props {
  interactions: StringInteraction[] | null;
  loading: boolean;
  error: string | null;
}

const DGC_MEMBERS = new Set(["SGCB", "SGCG", "SGCD", "SGCA", "DAG1", "DMD"]);

function getPartnerName(interaction: StringInteraction): string {
  if (interaction.preferredName_A === "SGCE")
    return interaction.preferredName_B;
  if (interaction.preferredName_B === "SGCE")
    return interaction.preferredName_A;
  return `${interaction.preferredName_A} \u2014 ${interaction.preferredName_B}`;
}

export function InteractionsCard({ interactions, loading, error }: Props) {
  return (
    <div
      className="rounded-xl p-4 border"
      style={{ background: COLORS.panel, borderColor: COLORS.panelBorder }}
    >
      <h4
        className="text-sm font-bold mb-2.5"
        style={{ color: COLORS.accent }}
      >
        Protein Interactions (STRING)
        {interactions ? ` (${interactions.length})` : ""}
      </h4>

      {loading && (
        <p className="text-xs" style={{ color: COLORS.textDim }}>
          Loading...
        </p>
      )}

      {error && (
        <p className="text-xs" style={{ color: COLORS.danger }}>
          {error}
        </p>
      )}

      {!loading && !error && !interactions && (
        <p className="text-xs" style={{ color: COLORS.textDim }}>
          No interaction data
        </p>
      )}

      {!loading && !error && interactions && (
        <ul className="space-y-2">
          {interactions.map((interaction) => {
            const partner = getPartnerName(interaction);
            const isDGC = DGC_MEMBERS.has(partner);
            const widthPct = `${(interaction.score * 100).toFixed(1)}%`;

            return (
              <li key={`${interaction.preferredName_A}-${interaction.preferredName_B}`}>
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className="text-xs font-semibold"
                    style={{ color: isDGC ? COLORS.accent : COLORS.text }}
                  >
                    {partner}
                  </span>
                  {isDGC && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                      style={{
                        background: COLORS.accentDim,
                        color: COLORS.accent,
                      }}
                    >
                      DGC
                    </span>
                  )}
                  <span
                    className="text-xs ml-auto"
                    style={{ color: COLORS.textDim }}
                  >
                    {interaction.score.toFixed(3)}
                  </span>
                </div>
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: COLORS.panelBorder }}
                >
                  <div
                    data-testid="score-bar"
                    className="h-full rounded-full"
                    style={{
                      width: widthPct,
                      background: COLORS.accent,
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
