import { COLORS } from "@/constants/protein-data";
import type { ClinicalTrial } from "@/types/research";

interface Props {
  trials: ClinicalTrial[] | null;
  loading: boolean;
  error: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  RECRUITING: "#22c55e",
  ACTIVE_NOT_RECRUITING: "#3b82f6",
  ENROLLING_BY_INVITATION: "#f59e0b",
  COMPLETED: "#9ca3af",
};

function getStatusColor(status: string): string {
  return STATUS_COLORS[status] ?? COLORS.textDim;
}

export function TrialsCard({ trials, loading, error }: Props) {
  const trialCount =
    trials && trials.length > 0 ? ` (${trials.length})` : "";

  return (
    <div
      className="rounded-xl p-4 border"
      style={{ background: COLORS.panel, borderColor: COLORS.panelBorder }}
    >
      <h4 className="text-sm font-bold mb-2.5" style={{ color: COLORS.accent }}>
        Clinical Trials{trialCount}
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

      {!loading && !error && trials && trials.length === 0 && (
        <p className="text-xs" style={{ color: COLORS.textDim }}>
          No trials found
        </p>
      )}

      {!loading && !error && trials && trials.length > 0 && (
        <ul className="space-y-3">
          {trials.map((trial) => (
            <li key={trial.nctId}>
              <a
                href={trial.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium hover:underline"
                style={{ color: COLORS.text }}
              >
                {trial.title}
              </a>
              <p className="text-xs mt-0.5">
                <span
                  className="font-semibold"
                  style={{ color: getStatusColor(trial.status) }}
                >
                  {trial.status}
                </span>
                <span style={{ color: COLORS.textDim }}> · {trial.phase}</span>
              </p>
              {trial.conditions.length > 0 && (
                <p className="text-xs mt-0.5" style={{ color: COLORS.textDim }}>
                  {trial.conditions.join(", ")}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
