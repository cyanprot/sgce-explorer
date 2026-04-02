import { useFetchData } from "@/hooks/useFetchData";
import type { FetchState, ChEMBLActivity } from "@/types/research";

const TARGET_SEARCH_URL =
  "https://www.ebi.ac.uk/chembl/api/data/target/search.json?q=dystroglycan&format=json&limit=5";

function extractTargetIds(data: unknown): string[] {
  const d = data as { targets?: { target_chembl_id: string }[] };
  return (d?.targets ?? []).map((t) => t.target_chembl_id);
}

function transformActivities(data: unknown): ChEMBLActivity[] {
  const d = data as {
    activities?: {
      molecule_chembl_id: string;
      molecule_pref_name: string | null;
      target_chembl_id: string;
      standard_type: string | null;
      standard_value: number | null;
      standard_units: string | null;
    }[];
  };
  return (d?.activities ?? []).map((a) => ({
    moleculeChemblId: a.molecule_chembl_id,
    moleculeName: a.molecule_pref_name || "Unknown",
    targetChemblId: a.target_chembl_id,
    standardType: a.standard_type || "",
    standardValue: a.standard_value,
    standardUnits: a.standard_units || "",
  }));
}

export function useChEMBL(): FetchState<ChEMBLActivity[]> {
  const targets = useFetchData<string[]>(TARGET_SEARCH_URL, extractTargetIds);

  const targetIds = targets.data;
  const activitiesUrl =
    targetIds && targetIds.length > 0
      ? `https://www.ebi.ac.uk/chembl/api/data/activity.json?target_chembl_id__in=${targetIds.join(",")}&format=json&limit=20`
      : null;

  const activities = useFetchData<ChEMBLActivity[]>(
    activitiesUrl,
    transformActivities,
    { enabled: targetIds != null && targetIds.length > 0 },
  );

  return {
    data: activities.data,
    loading: targets.loading || activities.loading,
    error: targets.error || activities.error,
  };
}
