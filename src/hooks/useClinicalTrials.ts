import { useFetchData } from "@/hooks/useFetchData";
import type { FetchState, ClinicalTrial } from "@/types/research";

const CLINICAL_TRIALS_URL =
  "https://clinicaltrials.gov/api/v2/studies?query.cond=DYT-SGCE+OR+myoclonus-dystonia+OR+SGCE&filter.overallStatus=RECRUITING,ACTIVE_NOT_RECRUITING,ENROLLING_BY_INVITATION,COMPLETED&pageSize=10";

function transformStudies(data: unknown): ClinicalTrial[] {
  const d = data as {
    studies?: {
      protocolSection?: {
        identificationModule?: { nctId?: string; briefTitle?: string };
        statusModule?: { overallStatus?: string };
        designModule?: { phases?: string[] };
        conditionsModule?: { conditions?: string[] };
        armsInterventionsModule?: {
          interventions?: { name: string; type: string }[];
        };
      };
    }[];
  };

  const studies = d?.studies;
  if (!studies) return [];

  return studies.map((study) => {
    const proto = study.protocolSection;
    const nctId = proto?.identificationModule?.nctId ?? "";
    const phases = proto?.designModule?.phases;

    return {
      nctId,
      title: proto?.identificationModule?.briefTitle ?? "",
      status: proto?.statusModule?.overallStatus ?? "UNKNOWN",
      phase: phases && phases.length > 0 ? phases.join(", ") : "N/A",
      conditions: proto?.conditionsModule?.conditions ?? [],
      interventions:
        proto?.armsInterventionsModule?.interventions?.map((i) => i.name) ?? [],
      url: `https://clinicaltrials.gov/study/${nctId}`,
    };
  });
}

export function useClinicalTrials(): FetchState<ClinicalTrial[]> {
  return useFetchData<ClinicalTrial[]>(CLINICAL_TRIALS_URL, transformStudies);
}
