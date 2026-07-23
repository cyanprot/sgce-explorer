import { useFetchData } from "@/hooks/useFetchData";
import type { FetchState, PubMedArticle } from "@/types/research";

const SEARCH_TERMS =
  "SGCE+OR+DYT11+OR+DYT-SGCE+OR+myoclonus-dystonia+OR+epsilon-sarcoglycan";

const ESEARCH_URL = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=10&sort=date&term=${SEARCH_TERMS}`;

// A malformed esearch body (common when NCBI rate-limits an unauthenticated
// caller) used to yield `[]`, which made `esummaryUrl` null, which disabled the
// second request, which left the hook returning `data: null, error: null`. Every
// render branch in PubMedCard then fell through and the card body was BLANK —
// not even "no results". Throw so the failure reaches the UI.
function extractPmids(data: unknown): string[] {
  const d = data as { esearchresult?: { idlist?: string[] } };
  const list = d?.esearchresult?.idlist;
  if (!Array.isArray(list)) {
    throw new Error("PubMed esearch returned an unexpected response (no idlist)");
  }
  return list;
}

function transformArticles(data: unknown): PubMedArticle[] {
  const d = data as {
    result?: Record<string, unknown> & { uids?: string[] };
  };
  const result = d?.result;
  if (!Array.isArray(result?.uids)) {
    throw new Error("PubMed esummary returned an unexpected response (no uids)");
  }

  return result.uids
    .filter((uid) => result[uid] != null)
    .map((uid) => {
      const entry = result[uid] as {
        uid: string;
        title: string;
        authors: { name: string }[];
        source: string;
        pubdate: string;
        elocationid: string;
      };

      const doiMatch = entry.elocationid?.match(/doi:\s*(.+)/);

      return {
        pmid: entry.uid,
        title: entry.title,
        authors: (entry.authors ?? []).map((a) => a.name),
        journal: entry.source,
        pubDate: entry.pubdate,
        doi: doiMatch ? doiMatch[1].trim() : "",
      };
    });
}

export function usePubMed(): FetchState<PubMedArticle[]> {
  const search = useFetchData<string[]>(ESEARCH_URL, extractPmids);

  const pmids = search.data;
  const esummaryUrl =
    pmids && pmids.length > 0
      ? `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${pmids.join(",")}`
      : null;

  const summary = useFetchData<PubMedArticle[]>(esummaryUrl, transformArticles, {
    enabled: pmids != null && pmids.length > 0,
  });

  return {
    // A search that legitimately matched nothing is an empty result, not an
    // absent one: report [] so the card can say "no results" instead of
    // rendering nothing at all.
    data: pmids !== null && pmids.length === 0 ? [] : summary.data,
    loading: search.loading || summary.loading,
    error: search.error || summary.error,
  };
}
