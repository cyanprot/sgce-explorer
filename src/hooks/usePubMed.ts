import { useFetchData } from "@/hooks/useFetchData";
import type { FetchState, PubMedArticle } from "@/types/research";

const SEARCH_TERMS =
  "SGCE+OR+DYT11+OR+DYT-SGCE+OR+myoclonus-dystonia+OR+epsilon-sarcoglycan";

const ESEARCH_URL = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=10&sort=date&term=${SEARCH_TERMS}`;

function extractPmids(data: unknown): string[] {
  const d = data as { esearchresult?: { idlist?: string[] } };
  return d?.esearchresult?.idlist ?? [];
}

function transformArticles(data: unknown): PubMedArticle[] {
  const d = data as {
    result?: Record<string, unknown> & { uids?: string[] };
  };
  const result = d?.result;
  if (!result?.uids) return [];

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
    data: summary.data,
    loading: search.loading || summary.loading,
    error: search.error || summary.error,
  };
}
