import { renderHook, waitFor } from "@testing-library/react";
import { clearAllCache } from "@/utils/fetchCache";
import { useChEMBL } from "@/hooks/useChEMBL";

const targetSearchResponse = {
  targets: [
    {
      target_chembl_id: "CHEMBL2111389",
      pref_name: "Sarcoglycan epsilon",
      target_type: "SINGLE PROTEIN",
    },
  ],
};

const multiTargetResponse = {
  targets: [
    {
      target_chembl_id: "CHEMBL2111389",
      pref_name: "Sarcoglycan epsilon",
      target_type: "SINGLE PROTEIN",
    },
    {
      target_chembl_id: "CHEMBL9999",
      pref_name: "Sarcoglycan beta",
      target_type: "SINGLE PROTEIN",
    },
  ],
};

const activityResponse = {
  activities: [
    {
      molecule_chembl_id: "CHEMBL1234",
      molecule_pref_name: "COMPOUND A",
      target_chembl_id: "CHEMBL2111389",
      standard_type: "IC50",
      standard_value: 100.0,
      standard_units: "nM",
    },
    {
      molecule_chembl_id: "CHEMBL5678",
      molecule_pref_name: null,
      target_chembl_id: "CHEMBL2111389",
      standard_type: "Ki",
      standard_value: null,
      standard_units: "nM",
    },
  ],
};

function setupFetchMock(
  targets: unknown = targetSearchResponse,
  activities: unknown = activityResponse,
) {
  return vi.fn((url: string) => {
    if (url.includes("target/search")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(targets),
      });
    }
    if (url.includes("activity")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(activities),
      });
    }
    return Promise.reject(new Error("Unknown URL"));
  });
}

describe("useChEMBL", () => {
  beforeEach(() => {
    clearAllCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("constructs correct target search URL", () => {
    const fetchSpy = setupFetchMock();
    vi.stubGlobal("fetch", fetchSpy);

    renderHook(() => useChEMBL());

    const searchCall = fetchSpy.mock.calls.find((c: string[]) =>
      c[0].includes("target/search"),
    );
    expect(searchCall).toBeDefined();
    const url = searchCall![0] as string;
    expect(url).toContain("target/search.json");
    expect(url).toContain("q=dystroglycan");
    expect(url).toContain("format=json");
    expect(url).toContain("limit=5");
  });

  it("passes target IDs from step 1 to activities URL", async () => {
    const fetchSpy = setupFetchMock();
    vi.stubGlobal("fetch", fetchSpy);

    renderHook(() => useChEMBL());

    await waitFor(() => {
      const activityCall = fetchSpy.mock.calls.find((c: string[]) =>
        c[0].includes("activity"),
      );
      expect(activityCall).toBeDefined();
    });

    const activityCall = fetchSpy.mock.calls.find((c: string[]) =>
      c[0].includes("activity"),
    );
    const url = activityCall![0] as string;
    expect(url).toContain("target_chembl_id__in=CHEMBL2111389");
    expect(url).toContain("format=json");
    expect(url).toContain("limit=20");
  });

  it("transforms activity response into ChEMBLActivity array", async () => {
    vi.stubGlobal("fetch", setupFetchMock());

    const { result } = renderHook(() => useChEMBL());

    await waitFor(() => expect(result.current.data).not.toBeNull());

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data![0]).toEqual({
      moleculeChemblId: "CHEMBL1234",
      moleculeName: "COMPOUND A",
      targetChemblId: "CHEMBL2111389",
      standardType: "IC50",
      standardValue: 100.0,
      standardUnits: "nM",
    });
    // null molecule_pref_name → "Unknown"
    expect(result.current.data![1].moleculeName).toBe("Unknown");
  });

  it("handles target found but no activities", async () => {
    vi.stubGlobal(
      "fetch",
      setupFetchMock(targetSearchResponse, { activities: [] }),
    );

    const { result } = renderHook(() => useChEMBL());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("handles multiple targets (concatenates IDs)", async () => {
    const fetchSpy = setupFetchMock(multiTargetResponse);
    vi.stubGlobal("fetch", fetchSpy);

    renderHook(() => useChEMBL());

    await waitFor(() => {
      const activityCall = fetchSpy.mock.calls.find((c: string[]) =>
        c[0].includes("activity"),
      );
      expect(activityCall).toBeDefined();
    });

    const activityCall = fetchSpy.mock.calls.find((c: string[]) =>
      c[0].includes("activity"),
    );
    const url = activityCall![0] as string;
    expect(url).toContain("target_chembl_id__in=CHEMBL2111389,CHEMBL9999");
  });

  it("handles empty target results", async () => {
    vi.stubGlobal(
      "fetch",
      setupFetchMock({ targets: [] }),
    );

    const { result } = renderHook(() => useChEMBL());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("returns error when target search fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error")),
    );

    const { result } = renderHook(() => useChEMBL());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeTruthy();
    expect(result.current.data).toBeNull();
  });
});
