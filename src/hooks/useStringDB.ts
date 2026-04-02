import { useFetchData } from "@/hooks/useFetchData";
import type { FetchState, StringInteraction } from "@/types/research";

const STRING_URL =
  "https://string-db.org/api/json/network?identifiers=SGCE&species=9606&network_type=physical&required_score=400";

function transformInteractions(data: unknown): StringInteraction[] {
  const raw = data as {
    preferredName_A?: string;
    preferredName_B?: string;
    ncbiTaxonId?: number;
    score?: number;
    escore?: number;
    dscore?: number;
  }[];

  if (!Array.isArray(raw)) return [];

  const seen = new Set<string>();
  const result: StringInteraction[] = [];

  for (const item of raw) {
    const a = item.preferredName_A ?? "";
    const b = item.preferredName_B ?? "";

    // Filter self-interactions
    if (a === b) continue;

    // Deduplicate A-B / B-A pairs
    const key = [a, b].sort().join("|");
    if (seen.has(key)) continue;
    seen.add(key);

    result.push({
      preferredName_A: a,
      preferredName_B: b,
      ncbiTaxonId: item.ncbiTaxonId ?? 9606,
      score: item.score ?? 0,
      escore: item.escore ?? 0,
      dscore: item.dscore ?? 0,
    });
  }

  return result;
}

export function useStringDB(): FetchState<StringInteraction[]> {
  return useFetchData<StringInteraction[]>(STRING_URL, transformInteractions);
}
