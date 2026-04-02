import { useFetchData } from "@/hooks/useFetchData";
import type { FetchState, UniProtAnnotation } from "@/types/research";

const UNIPROT_URL = "https://rest.uniprot.org/uniprotkb/O43556.json";
const STALE_TIME = 30 * 60 * 1000; // 30 minutes

function transformAnnotation(data: unknown): UniProtAnnotation {
  const d = data as {
    primaryAccession?: string;
    proteinDescription?: {
      recommendedName?: { fullName?: { value?: string } };
    };
    genes?: { geneName?: { value?: string } }[];
    features?: {
      type?: string;
      description?: string;
      location?: { start?: { value?: number }; end?: { value?: number } };
    }[];
    keywords?: { name?: string }[];
    entryAudit?: { lastAnnotationUpdateDate?: string };
  };

  return {
    accession: d.primaryAccession ?? "",
    proteinName:
      d.proteinDescription?.recommendedName?.fullName?.value ?? "Unknown",
    geneName: d.genes?.[0]?.geneName?.value ?? "Unknown",
    features: (d.features ?? []).map((f) => ({
      type: f.type ?? "",
      description: f.description ?? "",
      start: f.location?.start?.value ?? 0,
      end: f.location?.end?.value ?? 0,
    })),
    keywords: (d.keywords ?? []).map((k) => k.name ?? ""),
    lastModified: d.entryAudit?.lastAnnotationUpdateDate ?? "",
  };
}

export function useUniProt(): FetchState<UniProtAnnotation> {
  return useFetchData<UniProtAnnotation>(UNIPROT_URL, transformAnnotation, {
    staleTime: STALE_TIME,
  });
}
