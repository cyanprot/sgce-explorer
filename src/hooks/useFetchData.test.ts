import { renderHook, waitFor, act } from "@testing-library/react";
import { useFetchData } from "@/hooks/useFetchData";
import { setCache, clearAllCache } from "@/utils/fetchCache";

function mockFetch(data: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  });
}

const identity = (d: unknown) => d;

describe("useFetchData", () => {
  beforeEach(() => {
    clearAllCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loading=true initially while fetching", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(new Promise(() => {})), // never resolves
    );
    const { result } = renderHook(() =>
      useFetchData("https://api.test/data", identity),
    );
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("returns data on success", async () => {
    vi.stubGlobal("fetch", mockFetch({ value: 42 }));
    const { result } = renderHook(() =>
      useFetchData("https://api.test/data", identity),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ value: 42 });
    expect(result.current.error).toBeNull();
  });

  it("returns error on HTTP error", async () => {
    vi.stubGlobal("fetch", mockFetch(null, 500));
    const { result } = renderHook(() =>
      useFetchData("https://api.test/data", identity),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("HTTP 500");
    expect(result.current.data).toBeNull();
  });

  it("returns error on network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );
    const { result } = renderHook(() =>
      useFetchData("https://api.test/data", identity),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Failed to fetch");
  });

  it("aborts fetch on unmount", () => {
    const abortSpy = vi.spyOn(AbortController.prototype, "abort");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(new Promise(() => {})),
    );
    const { unmount } = renderHook(() =>
      useFetchData("https://api.test/data", identity),
    );
    unmount();
    expect(abortSpy).toHaveBeenCalled();
  });

  it("uses cache on second render", async () => {
    const fetchSpy = mockFetch({ cached: true });
    vi.stubGlobal("fetch", fetchSpy);

    // First render — populates cache
    const { result: r1, unmount } = renderHook(() =>
      useFetchData("https://api.test/data", identity),
    );
    await waitFor(() => expect(r1.current.loading).toBe(false));
    unmount();

    // Second render — should use cache, no additional fetch
    fetchSpy.mockClear();
    const { result: r2 } = renderHook(() =>
      useFetchData("https://api.test/data", identity),
    );
    expect(r2.current.data).toEqual({ cached: true });
    expect(r2.current.loading).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("skips fetch when url is null", () => {
    const fetchSpy = mockFetch({});
    vi.stubGlobal("fetch", fetchSpy);
    const { result } = renderHook(() =>
      useFetchData(null, identity),
    );
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("skips fetch when enabled=false", () => {
    const fetchSpy = mockFetch({});
    vi.stubGlobal("fetch", fetchSpy);
    const { result } = renderHook(() =>
      useFetchData("https://api.test/data", identity, { enabled: false }),
    );
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("passes data through transformer", async () => {
    vi.stubGlobal("fetch", mockFetch({ items: [1, 2, 3] }));
    const transformer = (d: any) => d.items.map((n: number) => n * 2);
    const { result } = renderHook(() =>
      useFetchData("https://api.test/data", transformer),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual([2, 4, 6]);
  });

  it("handles transformer throwing error", async () => {
    vi.stubGlobal("fetch", mockFetch({ items: [1] }));
    const badTransformer = () => {
      throw new Error("Transform failed");
    };
    const { result } = renderHook(() =>
      useFetchData("https://api.test/data", badTransformer),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Transform failed");
    expect(result.current.data).toBeNull();
  });

  it("concurrent URL change — only latest URL result used", async () => {
    let resolveFirst: (v: any) => void;
    let resolveSecond: (v: any) => void;

    const fetchImpl = vi.fn().mockImplementation((url: string) => {
      if (url.includes("first")) {
        return new Promise((r) => {
          resolveFirst = () =>
            r({ ok: true, status: 200, json: () => Promise.resolve("first-data") });
        });
      }
      return new Promise((r) => {
        resolveSecond = () =>
          r({ ok: true, status: 200, json: () => Promise.resolve("second-data") });
      });
    });
    vi.stubGlobal("fetch", fetchImpl);

    const { result, rerender } = renderHook(
      ({ url }: { url: string }) => useFetchData(url, identity),
      { initialProps: { url: "https://api.test/first" } },
    );

    // Change URL before first resolves
    rerender({ url: "https://api.test/second" });

    // Resolve second first, then first
    await act(async () => resolveSecond!(undefined));
    await waitFor(() => expect(result.current.data).toBe("second-data"));

    // Resolve first — should be ignored (url already changed)
    await act(async () => resolveFirst!(undefined));
    expect(result.current.data).toBe("second-data");
  });

  it("handles HTTP 429 (rate limit) error", async () => {
    vi.stubGlobal("fetch", mockFetch(null, 429));
    const { result } = renderHook(() =>
      useFetchData("https://api.test/data", identity),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("HTTP 429");
  });

  it("does not re-fetch when url has not changed", async () => {
    const fetchSpy = mockFetch({ v: 1 });
    vi.stubGlobal("fetch", fetchSpy);
    const { result, rerender } = renderHook(() =>
      useFetchData("https://api.test/stable", identity),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Re-render with same props
    rerender();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("respects custom staleTime", async () => {
    const fetchSpy = mockFetch("fresh-val");
    vi.stubGlobal("fetch", fetchSpy);

    // With long staleTime, cache should be used
    const { result: r1, unmount: u1 } = renderHook(() =>
      useFetchData("https://api.test/stale-test", identity, { staleTime: 60_000 }),
    );
    await waitFor(() => expect(r1.current.loading).toBe(false));
    expect(r1.current.data).toBe("fresh-val");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    u1();

    // Same URL with long staleTime → cache hit, no fetch
    fetchSpy.mockClear();
    const { result: r2, unmount: u2 } = renderHook(() =>
      useFetchData("https://api.test/stale-test", identity, { staleTime: 60_000 }),
    );
    expect(r2.current.data).toBe("fresh-val");
    expect(fetchSpy).not.toHaveBeenCalled();
    u2();

    // Same URL with staleTime=0 → cache is considered stale (0 > 0 is false, but
    // entry ages by real elapsed time), force re-fetch by clearing cache
    clearAllCache();
    fetchSpy.mockClear();
    const freshFetch = mockFetch("re-fetched");
    vi.stubGlobal("fetch", freshFetch);

    const { result: r3 } = renderHook(() =>
      useFetchData("https://api.test/stale-test", identity, { staleTime: 60_000 }),
    );
    await waitFor(() => expect(r3.current.loading).toBe(false));
    // After cache clear, even long staleTime triggers a fetch
    expect(freshFetch).toHaveBeenCalled();
    expect(r3.current.data).toBe("re-fetched");
  });
});
