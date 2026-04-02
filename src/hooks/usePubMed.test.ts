import { renderHook, waitFor } from "@testing-library/react";
import { clearAllCache } from "@/utils/fetchCache";
import { usePubMed } from "@/hooks/usePubMed";

const esearchResponse = {
  esearchresult: {
    idlist: ["11111", "22222", "33333"],
  },
};

const esummaryResponse = {
  result: {
    uids: ["11111", "22222", "33333"],
    "11111": {
      uid: "11111",
      title: "SGCE mutations in dystonia",
      authors: [{ name: "Smith J" }, { name: "Doe A" }],
      source: "Neurology",
      pubdate: "2024 Jan",
      elocationid: "doi: 10.1234/neuro.2024",
    },
    "22222": {
      uid: "22222",
      title: "Myoclonus-dystonia review",
      authors: [{ name: "Park K" }],
      source: "Movement Disorders",
      pubdate: "2023 Dec",
      elocationid: "doi: 10.5678/md.2023",
    },
    "33333": {
      uid: "33333",
      title: "Epsilon-sarcoglycan function",
      authors: [],
      source: "J Biol Chem",
      pubdate: "2023 Jun",
      elocationid: "",
    },
  },
};

function setupFetchMock(
  esearch: unknown = esearchResponse,
  esummary: unknown = esummaryResponse,
) {
  return vi.fn((url: string) => {
    if (url.includes("esearch")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(esearch),
      });
    }
    if (url.includes("esummary")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(esummary),
      });
    }
    return Promise.reject(new Error("Unknown URL"));
  });
}

describe("usePubMed", () => {
  beforeEach(() => {
    clearAllCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("constructs correct ESearch URL with search terms", () => {
    const fetchSpy = setupFetchMock();
    vi.stubGlobal("fetch", fetchSpy);

    renderHook(() => usePubMed());

    const esearchCall = fetchSpy.mock.calls.find((c: string[]) =>
      c[0].includes("esearch"),
    );
    expect(esearchCall).toBeDefined();
    const url = esearchCall![0] as string;
    expect(url).toContain("db=pubmed");
    expect(url).toContain("retmode=json");
    expect(url).toContain("retmax=10");
    expect(url).toContain("sort=date");
    expect(url).toContain("SGCE");
    expect(url).toContain("DYT11");
    expect(url).toContain("myoclonus-dystonia");
    expect(url).toContain("epsilon-sarcoglycan");
  });

  it("passes PMIDs from step 1 to ESummary URL", async () => {
    const fetchSpy = setupFetchMock();
    vi.stubGlobal("fetch", fetchSpy);

    const { result } = renderHook(() => usePubMed());

    await waitFor(() => {
      const esummaryCall = fetchSpy.mock.calls.find((c: string[]) =>
        c[0].includes("esummary"),
      );
      expect(esummaryCall).toBeDefined();
    });

    const esummaryCall = fetchSpy.mock.calls.find((c: string[]) =>
      c[0].includes("esummary"),
    );
    const url = esummaryCall![0] as string;
    expect(url).toContain("id=11111,22222,33333");
    expect(url).toContain("db=pubmed");
    expect(url).toContain("retmode=json");
  });

  it("transforms ESummary response into PubMedArticle array", async () => {
    vi.stubGlobal("fetch", setupFetchMock());

    const { result } = renderHook(() => usePubMed());

    await waitFor(() => expect(result.current.data).not.toBeNull());

    expect(result.current.data).toHaveLength(3);
    expect(result.current.data![0]).toEqual({
      pmid: "11111",
      title: "SGCE mutations in dystonia",
      authors: ["Smith J", "Doe A"],
      journal: "Neurology",
      pubDate: "2024 Jan",
      doi: "10.1234/neuro.2024",
    });
  });

  it("handles partial ESummary failure (some PMIDs missing from result)", async () => {
    const partialSummary = {
      result: {
        uids: ["11111", "22222", "33333"],
        "11111": esummaryResponse.result["11111"],
        // 22222 and 33333 missing from result
      },
    };
    vi.stubGlobal(
      "fetch",
      setupFetchMock(esearchResponse, partialSummary),
    );

    const { result } = renderHook(() => usePubMed());

    await waitFor(() => expect(result.current.data).not.toBeNull());
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].pmid).toBe("11111");
  });

  it("handles empty authors array", async () => {
    vi.stubGlobal("fetch", setupFetchMock());

    const { result } = renderHook(() => usePubMed());

    await waitFor(() => expect(result.current.data).not.toBeNull());

    const noAuthorArticle = result.current.data!.find(
      (a) => a.pmid === "33333",
    );
    expect(noAuthorArticle).toBeDefined();
    expect(noAuthorArticle!.authors).toEqual([]);
  });

  it("returns loading=true while either step is fetching", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(new Promise(() => {})), // never resolves
    );

    const { result } = renderHook(() => usePubMed());

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
  });

  it("returns error when ESearch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error")),
    );

    const { result } = renderHook(() => usePubMed());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeTruthy();
    expect(result.current.data).toBeNull();
  });
});
