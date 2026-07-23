import { useFetchData } from "@/hooks/useFetchData";
import type { FetchState, ClinicalTrial } from "@/types/research";

// No status filter, deliberately.
//
// This URL used to pin `filter.overallStatus=RECRUITING,ACTIVE_NOT_RECRUITING,
// ENROLLING_BY_INVITATION`, so the card could only ever show studies that look
// joinable — completed and terminated trials were invisible. On a site a patient
// may read as a route into a trial, that is the most consequential filter in the
// codebase. Show every study and let the status badge tell the truth.
const CLINICAL_TRIALS_URL =
  "https://clinicaltrials.gov/api/v2/studies?query.cond=DYT-SGCE+OR+myoclonus-dystonia+OR+SGCE&pageSize=20";

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
  // A missing `studies` key means the response was not what we asked for — a
  // rate-limit body, an error envelope, a proxy page. Returning [] made that
  // indistinguishable from "no trials exist for DYT-SGCE", which is a claim this
  // card is in no position to make. Throw so the UI renders a failure.
  if (!Array.isArray(studies)) {
    throw new Error("ClinicalTrials.gov returned an unexpected response (no studies array)");
  }

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
