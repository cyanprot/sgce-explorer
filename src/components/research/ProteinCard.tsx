import { COLORS } from "@/constants/protein-data";
import type { UniProtAnnotation, UniProtFeature } from "@/types/research";

interface Props {
  annotation: UniProtAnnotation | null;
  loading: boolean;
  error: string | null;
}

function groupFeatures(
  features: UniProtFeature[],
): Record<string, UniProtFeature[]> {
  const groups: Record<string, UniProtFeature[]> = {};
  for (const f of features) {
    if (!groups[f.type]) groups[f.type] = [];
    groups[f.type].push(f);
  }
  return groups;
}

export function ProteinCard({ annotation, loading, error }: Props) {
  return (
    <div
      className="rounded-xl p-4 border"
      style={{ background: COLORS.panel, borderColor: COLORS.panelBorder }}
    >
      <h4
        className="text-sm font-bold mb-2.5"
        style={{ color: COLORS.accent }}
      >
        UniProt Annotation
        {annotation ? ` (${annotation.accession})` : ""}
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

      {!loading && !error && !annotation && (
        <p className="text-xs" style={{ color: COLORS.textDim }}>
          No annotation data
        </p>
      )}

      {!loading && !error && annotation && (
        <div className="space-y-3">
          {/* Protein + Gene name */}
          <div>
            <p
              className="text-xs font-semibold"
              style={{ color: COLORS.text }}
            >
              {annotation.proteinName}
            </p>
            <p className="text-xs mt-0.5" style={{ color: COLORS.textDim }}>
              Gene: <span style={{ color: COLORS.accent }}>{annotation.geneName}</span>
            </p>
          </div>

          {/* Features grouped by type */}
          {Object.entries(groupFeatures(annotation.features)).map(
            ([type, features]) => (
              <div key={type}>
                <p
                  className="text-xs font-semibold mb-1"
                  style={{ color: COLORS.text }}
                >
                  {type}
                </p>
                <ul className="space-y-0.5">
                  {features.map((f, i) => (
                    <li
                      key={`${f.type}-${f.start}-${f.end}-${i}`}
                      className="text-xs flex justify-between"
                      style={{ color: COLORS.textDim }}
                    >
                      <span>{f.description}</span>
                      <span style={{ color: COLORS.accent }}>
                        {`${f.start}\u2013${f.end}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ),
          )}

          {/* Keywords */}
          {annotation.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {annotation.keywords.map((kw) => (
                <span
                  key={kw}
                  className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{
                    background: COLORS.accentDim,
                    color: COLORS.accent,
                  }}
                >
                  {kw}
                </span>
              ))}
            </div>
          )}

          {/* Last modified */}
          <p className="text-[10px]" style={{ color: COLORS.textDim }}>
            Updated: {annotation.lastModified}
          </p>
        </div>
      )}
    </div>
  );
}
