import { renderHook, waitFor, act } from "@testing-library/react";
import { useDGCProteins } from "@/hooks/useDGCProteins";
import { clearAllCache } from "@/utils/fetchCache";

const FAKE_PDB = "HEADER    SARCOGLYCAN\nATOM      1  N   MET A   1      10.000  20.000  30.000  1.00  0.00           N\nEND";

function mockFetchPdb(pdb = FAKE_PDB) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    text: () => Promise.resolve(pdb),
  });
}

describe("useDGCProteins", () => {
  beforeEach(() => {
    clearAllCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("enabled=false: no fetch calls, partners idle", () => {
    const fetchSpy = mockFetchPdb();
    vi.stubGlobal("fetch", fetchSpy);

    const { result } = renderHook(() => useDGCProteins(false));
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.current.allLoaded).toBe(false);
    expect(result.current.anyLoading).toBe(false);
    for (const p of result.current.partners) {
      expect(p.pdbData).toBeNull();
      expect(p.loading).toBe(false);
    }
  });

  it("enabled=true: fetches 3 PDBs (beta, gamma, delta — not epsilon)", async () => {
    const fetchSpy = mockFetchPdb();
    vi.stubGlobal("fetch", fetchSpy);

    const { result } = renderHook(() => useDGCProteins(true));

    await waitFor(() => expect(result.current.allLoaded).toBe(true));
    expect(fetchSpy).toHaveBeenCalledTimes(3);

    // Verify URLs contain sarcoglycan UniProt IDs
    const urls = fetchSpy.mock.calls.map((c: any[]) => c[0] as string);
    expect(urls.some((u: string) => u.includes("Q16585"))).toBe(true); // beta
    expect(urls.some((u: string) => u.includes("Q13326"))).toBe(true); // gamma
    expect(urls.some((u: string) => u.includes("Q92629"))).toBe(true); // delta
    // Should NOT fetch epsilon (O43556)
    expect(urls.some((u: string) => u.includes("O43556"))).toBe(false);
  });

  it("returns allLoaded=true when all 3 complete", async () => {
    vi.stubGlobal("fetch", mockFetchPdb());
    const { result } = renderHook(() => useDGCProteins(true));

    await waitFor(() => expect(result.current.allLoaded).toBe(true));
    for (const p of result.current.partners) {
      expect(p.pdbData).not.toBeNull();
      expect(p.loading).toBe(false);
      expect(p.error).toBeNull();
    }
  });

  it("anyLoading=true while any is still fetching", () => {
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
    const { result } = renderHook(() => useDGCProteins(true));

    expect(result.current.anyLoading).toBe(true);
    expect(result.current.allLoaded).toBe(false);
  });

  it("error in one partner doesn't block others", async () => {
    const fetchImpl = vi.fn().mockImplementation((url: string) => {
      if (url.includes("Q16585")) {
        // beta fails
        return Promise.resolve({ ok: false, status: 500, text: () => Promise.resolve("") });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve(FAKE_PDB),
      });
    });
    vi.stubGlobal("fetch", fetchImpl);

    const { result } = renderHook(() => useDGCProteins(true));

    await waitFor(() => expect(result.current.anyLoading).toBe(false));

    const beta = result.current.partners.find((p) => p.gene === "SGCB");
    expect(beta?.error).toBeTruthy();
    expect(beta?.pdbData).toBeNull();

    // gamma and delta should succeed
    const gamma = result.current.partners.find((p) => p.gene === "SGCG");
    const delta = result.current.partners.find((p) => p.gene === "SGCD");
    expect(gamma?.pdbData).not.toBeNull();
    expect(delta?.pdbData).not.toBeNull();
  });

  it("aborts all fetches on unmount", () => {
    const abortSpy = vi.spyOn(AbortController.prototype, "abort");
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));

    const { unmount } = renderHook(() => useDGCProteins(true));
    unmount();

    // 3 controllers aborted
    expect(abortSpy).toHaveBeenCalledTimes(3);
  });

  it("aborts when enabled goes false", async () => {
    const abortSpy = vi.spyOn(AbortController.prototype, "abort");
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));

    const { rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) => useDGCProteins(enabled),
      { initialProps: { enabled: true } },
    );

    rerender({ enabled: false });
    expect(abortSpy).toHaveBeenCalled();
  });

  it("validates PDB with isPdbData, rejects invalid data", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve("<html>Not Found</html>"),
    }));

    const { result } = renderHook(() => useDGCProteins(true));

    await waitFor(() => expect(result.current.anyLoading).toBe(false));
    for (const p of result.current.partners) {
      expect(p.error).toBeTruthy();
      expect(p.pdbData).toBeNull();
    }
  });

  it("uses fetchCache — second render doesn't re-fetch", async () => {
    const fetchSpy = mockFetchPdb();
    vi.stubGlobal("fetch", fetchSpy);

    const { result: r1, unmount } = renderHook(() => useDGCProteins(true));
    await waitFor(() => expect(r1.current.allLoaded).toBe(true));
    expect(fetchSpy).toHaveBeenCalledTimes(3);
    unmount();

    // Second render — should use cache
    fetchSpy.mockClear();
    const { result: r2 } = renderHook(() => useDGCProteins(true));
    expect(r2.current.allLoaded).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("has 3 partners with correct genes", () => {
    vi.stubGlobal("fetch", mockFetchPdb());
    const { result } = renderHook(() => useDGCProteins(false));

    const genes = result.current.partners.map((p) => p.gene);
    expect(genes).toEqual(["SGCB", "SGCG", "SGCD"]);
  });
});
