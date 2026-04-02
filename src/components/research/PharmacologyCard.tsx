import { COLORS } from "@/constants/protein-data";
import type { ChEMBLActivity } from "@/types/research";

interface Props {
  activities: ChEMBLActivity[] | null;
  loading: boolean;
  error: string | null;
}

function formatValue(value: number | null, units: string): string {
  if (value === null) return "N/A";
  return `${value} ${units}`.trim();
}

export function PharmacologyCard({ activities, loading, error }: Props) {
  const activityCount =
    activities && activities.length > 0 ? ` (${activities.length})` : "";

  return (
    <div
      className="rounded-xl p-4 border"
      style={{ background: COLORS.panel, borderColor: COLORS.panelBorder }}
    >
      <h4 className="text-sm font-bold mb-2.5" style={{ color: COLORS.accent }}>
        Pharmacology (ChEMBL){activityCount}
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

      {!loading && !error && activities && activities.length === 0 && (
        <p className="text-xs" style={{ color: COLORS.textDim }}>
          No activities found
        </p>
      )}

      {!loading && !error && activities && activities.length > 0 && (
        <ul className="space-y-3">
          {activities.map((activity) => (
            <li key={`${activity.moleculeChemblId}-${activity.standardType}`}>
              <p
                className="text-xs font-semibold"
                style={{ color: COLORS.text }}
              >
                {activity.moleculeName}
              </p>
              <p className="text-xs mt-0.5" style={{ color: COLORS.textDim }}>
                <span style={{ color: COLORS.accent }}>
                  {activity.standardType}
                </span>
                {" "}
                {formatValue(activity.standardValue, activity.standardUnits)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
