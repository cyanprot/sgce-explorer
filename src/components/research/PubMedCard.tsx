import { COLORS } from "@/constants/protein-data";
import type { PubMedArticle } from "@/types/research";

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
  const articleCount =
    articles && articles.length > 0 ? ` (${articles.length})` : "";

  return (
    <div
      className="rounded-xl p-4 border"
      style={{ background: COLORS.panel, borderColor: COLORS.panelBorder }}
    >
      <h4 className="text-sm font-bold mb-2.5" style={{ color: COLORS.accent }}>
        PubMed Literature{articleCount}
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

      {!loading && !error && articles && articles.length === 0 && (
        <p className="text-xs" style={{ color: COLORS.textDim }}>
          No articles found
        </p>
      )}

      {!loading && !error && articles && articles.length > 0 && (
        <ul className="space-y-3">
          {articles.map((article) => (
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
