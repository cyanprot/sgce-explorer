import { renderHook, waitFor } from "@testing-library/react";
import { clearAllCache } from "@/utils/fetchCache";
import { useClinicalTrials } from "@/hooks/useClinicalTrials";

const mockStudiesResponse = {
  studies: [
    {
      protocolSection: {
        identificationModule: {
          nctId: "NCT12345678",
          briefTitle: "DBS for Myoclonus-Dystonia",
        },
        statusModule: {
          overallStatus: "RECRUITING",
        },
        designModule: {
          phases: ["PHASE2", "PHASE3"],
        },
        conditionsModule: {
          conditions: ["Myoclonus-Dystonia", "DYT-SGCE"],
        },
        armsInterventionsModule: {
          interventions: [
            { name: "Deep Brain Stimulation", type: "DEVICE" },
            { name: "Sham Stimulation", type: "DEVICE" },
          ],
        },
      },
    },
    {
      protocolSection: {
        identificationModule: {
          nctId: "NCT87654321",
          briefTitle: "Natural History of SGCE",
        },
        statusModule: {
          overallStatus: "COMPLETED",
        },
        designModule: {
          phases: ["NA"],
        },
        conditionsModule: {
          conditions: ["SGCE Mutation"],
        },
        armsInterventionsModule: {
          interventions: [],
        },
      },
    },
  ],
};

function setupFetchMock(response: unknown = mockStudiesResponse) {
  return vi.fn((url: string) =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(response),
    }),
  );
}

describe("useClinicalTrials", () => {
  beforeEach(() => {
    clearAllCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("constructs correct API URL with conditions and status filter", () => {
    const fetchSpy = setupFetchMock();
    vi.stubGlobal("fetch", fetchSpy);

    renderHook(() => useClinicalTrials());

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain("clinicaltrials.gov/api/v2/studies");
    expect(url).toContain("DYT-SGCE");
    expect(url).toContain("myoclonus-dystonia");
    expect(url).toContain("SGCE");
    expect(url).toContain("RECRUITING");
    expect(url).toContain("COMPLETED");
    expect(url).toContain("pageSize=10");
  });

  it("transforms study response into ClinicalTrial array", async () => {
    vi.stubGlobal("fetch", setupFetchMock());

    const { result } = renderHook(() => useClinicalTrials());

    await waitFor(() => expect(result.current.data).not.toBeNull());

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data![0]).toEqual({
      nctId: "NCT12345678",
      title: "DBS for Myoclonus-Dystonia",
      status: "RECRUITING",
      phase: "PHASE2, PHASE3",
      conditions: ["Myoclonus-Dystonia", "DYT-SGCE"],
      interventions: ["Deep Brain Stimulation", "Sham Stimulation"],
      url: "https://clinicaltrials.gov/study/NCT12345678",
    });
  });

  it("handles missing statusModule gracefully (default to UNKNOWN)", async () => {
    const noStatus = {
      studies: [
        {
          protocolSection: {
            identificationModule: {
              nctId: "NCT00000001",
              briefTitle: "No Status Study",
            },
            designModule: { phases: ["PHASE1"] },
            conditionsModule: { conditions: ["Dystonia"] },
            armsInterventionsModule: { interventions: [] },
          },
        },
      ],
    };
    vi.stubGlobal("fetch", setupFetchMock(noStatus));

    const { result } = renderHook(() => useClinicalTrials());

    await waitFor(() => expect(result.current.data).not.toBeNull());
    expect(result.current.data![0].status).toBe("UNKNOWN");
  });

  it("handles missing studies key (returns empty array)", async () => {
    vi.stubGlobal("fetch", setupFetchMock({}));

    const { result } = renderHook(() => useClinicalTrials());

    await waitFor(() => expect(result.current.data).not.toBeNull());
    expect(result.current.data).toEqual([]);
  });

  it("handles missing designModule.phases (returns N/A)", async () => {
    const noPhases = {
      studies: [
        {
          protocolSection: {
            identificationModule: {
              nctId: "NCT00000002",
              briefTitle: "No Phase Study",
            },
            statusModule: { overallStatus: "RECRUITING" },
            conditionsModule: { conditions: [] },
            armsInterventionsModule: { interventions: [] },
          },
        },
      ],
    };
    vi.stubGlobal("fetch", setupFetchMock(noPhases));

    const { result } = renderHook(() => useClinicalTrials());

    await waitFor(() => expect(result.current.data).not.toBeNull());
    expect(result.current.data![0].phase).toBe("N/A");
  });

  it("handles missing armsInterventionsModule (returns empty interventions)", async () => {
    const noArms = {
      studies: [
        {
          protocolSection: {
            identificationModule: {
              nctId: "NCT00000003",
              briefTitle: "No Arms Study",
            },
            statusModule: { overallStatus: "COMPLETED" },
            designModule: { phases: ["PHASE4"] },
            conditionsModule: { conditions: ["Dystonia"] },
          },
        },
      ],
    };
    vi.stubGlobal("fetch", setupFetchMock(noArms));

    const { result } = renderHook(() => useClinicalTrials());

    await waitFor(() => expect(result.current.data).not.toBeNull());
    expect(result.current.data![0].interventions).toEqual([]);
  });

  it("returns error on fetch failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error")),
    );

    const { result } = renderHook(() => useClinicalTrials());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeTruthy();
    expect(result.current.data).toBeNull();
  });
});
