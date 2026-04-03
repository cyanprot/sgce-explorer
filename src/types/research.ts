export interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface FetchConfig {
  enabled?: boolean;        // default true, when false skip fetch
  staleTime?: number;       // cache TTL in ms, default 5 * 60 * 1000
  timeout?: number;         // fetch timeout in ms, default 10000
  responseType?: "json" | "text"; // default "json"
}

export interface PubMedArticle {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  pubDate: string;
  doi: string;
}

export interface ClinicalTrial {
  nctId: string;
  title: string;
  status: string;
  phase: string;
  conditions: string[];
  interventions: string[];
  url: string;
}

export interface ChEMBLActivity {
  moleculeChemblId: string;
  moleculeName: string;
  targetChemblId: string;
  standardType: string;
  standardValue: number | null;
  standardUnits: string;
}

export interface UniProtFeature {
  type: string;
  description: string;
  start: number;
  end: number;
}

export interface UniProtAnnotation {
  accession: string;
  proteinName: string;
  geneName: string;
  features: UniProtFeature[];
  keywords: string[];
  lastModified: string;
}

export interface StringInteraction {
  preferredName_A: string;
  preferredName_B: string;
  ncbiTaxonId: number;
  score: number;      // 0-1 float
  escore: number;
  dscore: number;
}
