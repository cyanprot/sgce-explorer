import { useState, useEffect, useRef } from "react";
import { getCache, setCache } from "@/utils/fetchCache";
import type { FetchState, FetchConfig } from "@/types/research";

const DEFAULT_STALE_TIME = 5 * 60 * 1000;

export function useFetchData<T>(
  url: string | null,
  transformer: (data: unknown) => T,
  config?: FetchConfig,
): FetchState<T> {
  const enabled = config?.enabled ?? true;
  const staleTime = config?.staleTime ?? DEFAULT_STALE_TIME;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const urlRef = useRef(url);

  useEffect(() => {
    urlRef.current = url;

    if (!url || !enabled) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    const cached = getCache(url, staleTime);
    if (cached !== null) {
      setData(cached as T);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const transformed = transformer(json);
        // Only apply if this URL is still current
        if (urlRef.current === url) {
          setCache(url, transformed);
          setData(transformed);
          setError(null);
        }
      } catch (e: any) {
        if (e.name === "AbortError") return;
        if (urlRef.current === url) {
          setError(e.message || "Fetch failed");
        }
      } finally {
        if (urlRef.current === url) {
          setLoading(false);
        }
      }
    })();

    return () => controller.abort();
  }, [url, enabled, staleTime]);

  return { data, loading, error };
}
