import { useState, useEffect, useMemo, useCallback } from "react";
import { DGC_PARTNERS } from "@/constants/protein-data";
import { getCache, setCache } from "@/utils/fetchCache";
import { isPdbData } from "@/utils/isPdbData";

const ALPHAFOLD_URL = (uniprot: string) =>
  `https://alphafold.ebi.ac.uk/files/AF-${uniprot}-F1-model_v6.pdb`;

const STALE_TIME = 5 * 60 * 1000;

// Filter to sarcoglycan partners with uniprot (exclude ε-SG and non-sarcoglycans)
const SARCOGLYCAN_PARTNERS = DGC_PARTNERS.filter(
  (p): p is typeof p & { uniprot: string; xOffset: number } =>
    "uniprot" in p && "xOffset" in p,
);

export interface DGCPartnerState {
  gene: string;
  name: string;
  color: string;
  xOffset: number;
  pdbData: string | null;
  loading: boolean;
  error: string | null;
}

export interface UseDGCProteinsResult {
  partners: DGCPartnerState[];
  allLoaded: boolean;
  anyLoading: boolean;
  retry: (gene: string) => void;
}

export function useDGCProteins(enabled: boolean): UseDGCProteinsResult {
  const [states, setStates] = useState<Record<string, { pdbData: string | null; loading: boolean; error: string | null }>>(() => {
    const init: Record<string, { pdbData: string | null; loading: boolean; error: string | null }> = {};
    for (const p of SARCOGLYCAN_PARTNERS) {
      init[p.gene] = { pdbData: null, loading: false, error: null };
    }
    return init;
  });

  const [retryCounters, setRetryCounters] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!enabled) {
      // Reset states when disabled
      setStates((prev) => {
        const next = { ...prev };
        for (const gene of Object.keys(next)) {
          next[gene] = { pdbData: null, loading: false, error: null };
        }
        return next;
      });
      return;
    }

    const controllers: AbortController[] = [];

    for (const partner of SARCOGLYCAN_PARTNERS) {
      const url = ALPHAFOLD_URL(partner.uniprot);

      // Check cache first
      const cached = getCache(url, STALE_TIME);
      if (cached !== null) {
        setStates((prev) => ({
          ...prev,
          [partner.gene]: { pdbData: cached as string, loading: false, error: null },
        }));
        continue;
      }

      const controller = new AbortController();
      controllers.push(controller);

      setStates((prev) => ({
        ...prev,
        [partner.gene]: { pdbData: null, loading: true, error: null },
      }));

      (async () => {
        try {
          const res = await fetch(url, { signal: controller.signal });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const text = await res.text();
          if (!isPdbData(text)) throw new Error("Invalid PDB data");
          setCache(url, text);
          setStates((prev) => ({
            ...prev,
            [partner.gene]: { pdbData: text, loading: false, error: null },
          }));
        } catch (e: any) {
          if (e.name === "AbortError") return;
          setStates((prev) => ({
            ...prev,
            [partner.gene]: { pdbData: null, loading: false, error: e.message || "Fetch failed" },
          }));
        }
      })();
    }

    return () => {
      for (const c of controllers) c.abort();
    };
  }, [enabled, retryCounters]);

  const retry = useCallback((gene: string) => {
    setRetryCounters((prev) => ({ ...prev, [gene]: (prev[gene] ?? 0) + 1 }));
  }, []);

  const partners = useMemo<DGCPartnerState[]>(
    () =>
      SARCOGLYCAN_PARTNERS.map((p) => ({
        gene: p.gene,
        name: p.name,
        color: p.color,
        xOffset: p.xOffset,
        pdbData: states[p.gene]?.pdbData ?? null,
        loading: states[p.gene]?.loading ?? false,
        error: states[p.gene]?.error ?? null,
      })),
    [states],
  );

  const allLoaded = partners.every((p) => p.pdbData !== null);
  const anyLoading = partners.some((p) => p.loading);

  return { partners, allLoaded, anyLoading, retry };
}
