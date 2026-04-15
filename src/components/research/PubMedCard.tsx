import { useState, useMemo } from "react";
import { COLORS } from "@/constants/protein-data";
import type { PubMedArticle } from "@/types/research";

type SortMode = "recent" | "relevance";

const RELEVANCE_KEYWORDS = ["sgce", "sarcoglycan", "myoclonus", "dystonia", "dyt11", "dyt-sgce", "imprinting"];

function relevanceScore(title: string): number {
  const lower = title.toLowerCase();
  return RELEVANCE_KEYWORDS.reduce((score, kw) => score + (lower.includes(kw) ? 1 : 0), 0);
}

interface Props {
  articles: PubMedArticle[] | null;
  loading: boolean;
  error: string | null;
}

function formatAuthors(authors: string[]): string {
  if (authors.length <= 3) return authors.join(", ");
  return `${authors.slice(0, 3).join(", ")} +${authors.length - 3} more`;
}

export function PubMedCard({ articles, loading, error }: Props) {
  const [sortMode, setSortMode] = useState<SortMode>("recent");

  const sortedArticles = useMemo(() => {
    if (!articles) return null;
    if (sortMode === "recent") return articles;
    return [...articles].sort((a, b) => relevanceScore(b.title) - relevanceScore(a.title));
  }, [articles, sortMode]);

  const articleCount =
    articles && articles.length > 0 ? ` (${articles.length})` : "";

  return (
    <div
      className="rounded-xl p-4 border"
      style={{ background: COLORS.panel, borderColor: COLORS.panelBorder }}
    >
      <div className="flex items-center justify-between mb-2.5">
        <h4 className="text-sm font-bold" style={{ color: COLORS.accent }}>
          PubMed Literature{articleCount}
        </h4>
        {articles && articles.length > 0 && (
          <div className="flex gap-1" role="group" aria-label="Sort articles">
            <button
              onClick={() => setSortMode("recent")}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer border ${sortMode === "recent" ? "border-current" : "border-transparent"}`}
              style={{ color: sortMode === "recent" ? COLORS.accent : COLORS.textDim }}
            >
              Recent
            </button>
            <button
              onClick={() => setSortMode("relevance")}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer border ${sortMode === "relevance" ? "border-current" : "border-transparent"}`}
              style={{ color: sortMode === "relevance" ? COLORS.accent : COLORS.textDim }}
            >
              Relevance
            </button>
          </div>
        )}
      </div>

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

      {!loading && !error && sortedArticles && sortedArticles.length === 0 && (
        <p className="text-xs" style={{ color: COLORS.textDim }}>
          No articles found
        </p>
      )}

      {!loading && !error && sortedArticles && sortedArticles.length > 0 && (
        <ul className="space-y-3 max-h-[600px] overflow-y-auto pr-1 no-scrollbar">
          {sortedArticles.map((article) => (
            <li key={article.pmid}>
              <a
                href={`https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium hover:underline"
                style={{ color: COLORS.text }}
              >
                {article.title}
              </a>
              {article.authors.length > 0 && (
                <p className="text-xs mt-0.5" style={{ color: COLORS.textDim }}>
                  {formatAuthors(article.authors)}
                </p>
              )}
              <p className="text-xs mt-0.5" style={{ color: COLORS.textDim }}>
                {article.journal} &middot; {article.pubDate}
              </p>
              {article.doi && (
                <a
                  href={`https://doi.org/${article.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs hover:underline"
                  style={{ color: COLORS.accent }}
                >
                  {article.doi}
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
