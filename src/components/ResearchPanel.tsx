import { usePubMed } from "@/hooks/usePubMed";
import { useClinicalTrials } from "@/hooks/useClinicalTrials";
import { useUniProt } from "@/hooks/useUniProt";
import { useStringDB } from "@/hooks/useStringDB";
import {
  PubMedCard,
  TrialsCard,
  ProteinCard,
  InteractionsCard,
} from "@/components/research";

export function ResearchPanel() {
  const pubmed = usePubMed();
  const trials = useClinicalTrials();
  const uniprot = useUniProt();
  const stringdb = useStringDB();

  return (
    <div data-testid="research-panel" className="p-6 min-h-[calc(100vh-var(--app-header-h)-80px)]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <PubMedCard
            articles={pubmed.data}
            loading={pubmed.loading}
            error={pubmed.error}
          />
        </div>
        <TrialsCard
          trials={trials.data}
          loading={trials.loading}
          error={trials.error}
        />
        <ProteinCard
          annotation={uniprot.data}
          loading={uniprot.loading}
          error={uniprot.error}
        />
        <InteractionsCard
          interactions={stringdb.data}
          loading={stringdb.loading}
          error={stringdb.error}
        />
      </div>
    </div>
  );
}
