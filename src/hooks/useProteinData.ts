import { useState, useEffect } from "react";

const ALPHAFOLD_URL =
  "https://alphafold.ebi.ac.uk/files/AF-O43556-F1-model_v6.pdb";

interface UseProteinDataResult {
  pdbData: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Fetches AlphaFold predicted structure for SGCE (O43556).
 * Falls back to local file in data/ if fetch fails.
 */
export function useProteinData(): UseProteinDataResult {
  const [pdbData, setPdbData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const isPdbData = (text: string) =>
      /^(HEADER|ATOM|MODEL|REMARK)/m.test(text);

    async function fetchPDB() {
      try {
        // Try local file first
        const localRes = await fetch("/data/AF-O43556-F1.pdb", {
          signal: controller.signal,
        }).catch(() => null);

        if (localRes?.ok) {
          const text = await localRes.text();
          if (isPdbData(text)) {
            setPdbData(text);
            setLoading(false);
            return;
          }
        }

        // Fallback: fetch from AlphaFold
        const res = await fetch(ALPHAFOLD_URL, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        if (!isPdbData(text)) throw new Error("Invalid PDB data received");
        setPdbData(text);
      } catch (e: any) {
        if (e.name !== "AbortError") {
          setError(e.message || "Failed to fetch PDB");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchPDB();
    return () => controller.abort();
  }, []);

  return { pdbData, loading, error };
}
