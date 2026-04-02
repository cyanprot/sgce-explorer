import { usePubMed } from "@/hooks/usePubMed";
import { useClinicalTrials } from "@/hooks/useClinicalTrials";
import { useChEMBL } from "@/hooks/useChEMBL";
import { useUniProt } from "@/hooks/useUniProt";
import { useStringDB } from "@/hooks/useStringDB";
import {
  PubMedCard,
  TrialsCard,
  PharmacologyCard,
  ProteinCard,
  InteractionsCard,
} from "@/components/research";

export function ResearchPanel() {
  const pubmed = usePubMed();
  const trials = useClinicalTrials();
  const chembl = useChEMBL();
  const uniprot = useUniProt();
  const stringdb = useStringDB();

  return (
    <div data-testid="research-panel" className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <PubMedCard
          articles={pubmed.data}
          loading={pubmed.loading}
          error={pubmed.error}
        />
        <TrialsCard
          trials={trials.data}
          loading={trials.loading}
          error={trials.error}
        />
        <PharmacologyCard
          activities={chembl.data}
          loading={chembl.loading}
          error={chembl.error}
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
