import { renderHook, waitFor } from "@testing-library/react";
import { clearAllCache } from "@/utils/fetchCache";
import { useStringDB } from "@/hooks/useStringDB";

const stringResponse = [
  {
    preferredName_A: "SGCE",
    preferredName_B: "SGCB",
    ncbiTaxonId: 9606,
    score: 0.999,
    escore: 0.874,
    dscore: 0.9,
  },
  {
    preferredName_A: "SGCB",
    preferredName_B: "SGCE",
    ncbiTaxonId: 9606,
    score: 0.999,
    escore: 0.874,
    dscore: 0.9,
  },
  {
    preferredName_A: "SGCE",
    preferredName_B: "SGCG",
    ncbiTaxonId: 9606,
    score: 0.965,
    escore: 0.8,
    dscore: 0.85,
  },
  {
    preferredName_A: "SGCE",
    preferredName_B: "SGCE",
    ncbiTaxonId: 9606,
    score: 1.0,
    escore: 1.0,
    dscore: 1.0,
  },
];

function setupFetchMock(response: unknown = stringResponse) {
  return vi.fn((url: string) =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(response),
    }),
  );
}

describe("useStringDB", () => {
  beforeEach(() => {
    clearAllCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("constructs correct URL with species and score parameters", () => {
    const fetchSpy = setupFetchMock();
    vi.stubGlobal("fetch", fetchSpy);

    renderHook(() => useStringDB());

    expect(fetchSpy).toHaveBeenCalled();
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain("string-db.org/api/json/network");
    expect(url).toContain("identifiers=SGCE");
    expect(url).toContain("species=9606");
    expect(url).toContain("required_score=400");
  });

  it("transforms response array into StringInteraction array", async () => {
    vi.stubGlobal("fetch", setupFetchMock());

    const { result } = renderHook(() => useStringDB());

    await waitFor(() => expect(result.current.data).not.toBeNull());

    const data = result.current.data!;
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty("preferredName_A");
    expect(data[0]).toHaveProperty("preferredName_B");
    expect(data[0]).toHaveProperty("score");
    expect(data[0]).toHaveProperty("escore");
    expect(data[0]).toHaveProperty("dscore");
    expect(data[0]).toHaveProperty("ncbiTaxonId");
  });

  it("deduplicates A-B / B-A pairs (keeps only one)", async () => {
    vi.stubGlobal("fetch", setupFetchMock());

    const { result } = renderHook(() => useStringDB());

    await waitFor(() => expect(result.current.data).not.toBeNull());

    const data = result.current.data!;
    // SGCE-SGCB appears twice (A-B and B-A), should be deduped to one
    const sgcbPairs = data.filter(
      (d) =>
        (d.preferredName_A === "SGCE" && d.preferredName_B === "SGCB") ||
        (d.preferredName_A === "SGCB" && d.preferredName_B === "SGCE"),
    );
    expect(sgcbPairs).toHaveLength(1);
  });

  it("filters out self-interactions (A === B)", async () => {
    vi.stubGlobal("fetch", setupFetchMock());

    const { result } = renderHook(() => useStringDB());

    await waitFor(() => expect(result.current.data).not.toBeNull());

    const data = result.current.data!;
    const selfInteractions = data.filter(
      (d) => d.preferredName_A === d.preferredName_B,
    );
    expect(selfInteractions).toHaveLength(0);
  });

  it("handles empty response array", async () => {
    vi.stubGlobal("fetch", setupFetchMock([]));

    const { result } = renderHook(() => useStringDB());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual([]);
  });

  it("score values preserved as 0-1 floats", async () => {
    vi.stubGlobal("fetch", setupFetchMock());

    const { result } = renderHook(() => useStringDB());

    await waitFor(() => expect(result.current.data).not.toBeNull());

    for (const interaction of result.current.data!) {
      expect(interaction.score).toBeGreaterThanOrEqual(0);
      expect(interaction.score).toBeLessThanOrEqual(1);
    }
  });

  it("returns error on fetch failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 503,
        }),
      ),
    );

    const { result } = renderHook(() => useStringDB());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeTruthy();
    expect(result.current.data).toBeNull();
  });
});
