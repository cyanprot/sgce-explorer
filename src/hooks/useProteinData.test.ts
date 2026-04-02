import { renderHook, waitFor } from "@testing-library/react";
import { useProteinData } from "./useProteinData";

const VALID_PDB = "HEADER    PROTEIN\nATOM      1  N   ALA A   1\n";
const HTML_RESPONSE = "<!DOCTYPE html><html><body>Not Found</body></html>";
const LOCAL_URL = "/data/AF-O43556-F1.pdb";
const REMOTE_URL =
  "https://alphafold.ebi.ac.uk/files/AF-O43556-F1-model_v6.pdb";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useProteinData", () => {
  it("has correct initial state: loading=true, pdbData=null, error=null", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})), // never resolves
    );
    const { result } = renderHook(() => useProteinData());
    expect(result.current.loading).toBe(true);
    expect(result.current.pdbData).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("returns PDB data from successful local fetch", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url === LOCAL_URL) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(VALID_PDB),
          });
        }
        return Promise.reject(new Error("should not reach remote"));
      }),
    );

    const { result } = renderHook(() => useProteinData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.pdbData).toBe(VALID_PDB);
    expect(result.current.error).toBeNull();
  });

  it("rejects HTML response from local fetch and falls through to remote", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url === LOCAL_URL) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(HTML_RESPONSE),
          });
        }
        if (url === REMOTE_URL) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(VALID_PDB),
          });
        }
        return Promise.reject(new Error("unexpected URL"));
      }),
    );

    const { result } = renderHook(() => useProteinData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.pdbData).toBe(VALID_PDB);
    expect(result.current.error).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("falls back to AlphaFold when local fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url === LOCAL_URL) {
          return Promise.reject(new Error("network error"));
        }
        if (url === REMOTE_URL) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(VALID_PDB),
          });
        }
        return Promise.reject(new Error("unexpected URL"));
      }),
    );

    const { result } = renderHook(() => useProteinData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.pdbData).toBe(VALID_PDB);
    expect(result.current.error).toBeNull();
  });

  it("sets error when both local and remote fetches fail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url === LOCAL_URL) {
          return Promise.reject(new Error("local failed"));
        }
        if (url === REMOTE_URL) {
          return Promise.resolve({
            ok: false,
            status: 500,
            text: () => Promise.resolve("Internal Server Error"),
          });
        }
        return Promise.reject(new Error("unexpected URL"));
      }),
    );

    const { result } = renderHook(() => useProteinData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.pdbData).toBeNull();
    expect(result.current.error).toBe("HTTP 500");
  });

  it("aborts fetch on unmount without state update errors", async () => {
    let aborted = false;
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init?: RequestInit) => {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            aborted = true;
            const err = new DOMException("The operation was aborted.", "AbortError");
            reject(err);
          });
        });
      }),
    );

    const { unmount } = renderHook(() => useProteinData());
    unmount();

    // Give microtasks time to flush
    await new Promise((r) => setTimeout(r, 50));
    expect(aborted).toBe(true);
  });
});
