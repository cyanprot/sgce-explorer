import { render, screen, waitFor } from "@testing-library/react";
import { ResearchPanel } from "./ResearchPanel";
import { clearAllCache } from "@/utils/fetchCache";

// ---------- helpers for unit tests ----------
const mockPubMed = vi.fn();
const mockTrials = vi.fn();
const mockUniProt = vi.fn();
const mockStringDB = vi.fn();

vi.mock("@/hooks/usePubMed", () => ({ usePubMed: (...a: unknown[]) => mockPubMed(...a) }));
vi.mock("@/hooks/useClinicalTrials", () => ({ useClinicalTrials: (...a: unknown[]) => mockTrials(...a) }));
vi.mock("@/hooks/useUniProt", () => ({ useUniProt: (...a: unknown[]) => mockUniProt(...a) }));
vi.mock("@/hooks/useStringDB", () => ({ useStringDB: (...a: unknown[]) => mockStringDB(...a) }));

function setAllIdle() {
  const idle = { data: null, loading: false, error: null };
  mockPubMed.mockReturnValue(idle);
  mockTrials.mockReturnValue(idle);
  mockUniProt.mockReturnValue(idle);
  mockStringDB.mockReturnValue(idle);
}

function setAllLoading() {
  const loading = { data: null, loading: true, error: null };
  mockPubMed.mockReturnValue(loading);
  mockTrials.mockReturnValue(loading);
  mockUniProt.mockReturnValue(loading);
  mockStringDB.mockReturnValue(loading);
}

// ---------- unit tests ----------
describe("ResearchPanel (unit)", () => {
  beforeEach(() => {
    setAllIdle();
  });

  it("renders data-testid='research-panel'", () => {
    render(<ResearchPanel />);
    expect(screen.getByTestId("research-panel")).toBeInTheDocument();
  });

  it("renders all 4 card headings", () => {
    render(<ResearchPanel />);
    expect(screen.getByText("PubMed Literature")).toBeInTheDocument();
    expect(screen.getByText("Clinical Trials")).toBeInTheDocument();
    expect(screen.getByText("UniProt Annotation")).toBeInTheDocument();
    expect(screen.getByText(/Protein Interactions \(STRING\)/)).toBeInTheDocument();
  });

  it("renders responsive grid container", () => {
    render(<ResearchPanel />);
    const panel = screen.getByTestId("research-panel");
    const grid = panel.firstElementChild as HTMLElement;
    expect(grid.className).toContain("grid");
    expect(grid.className).toContain("grid-cols-1");
    expect(grid.className).toContain("md:grid-cols-2");
    expect(grid.className).toContain("lg:grid-cols-3");
  });

  it("passes hook data to correct cards", () => {
    mockPubMed.mockReturnValue({
      data: [{ pmid: "1", title: "PubMed Title", authors: [], journal: "J", pubDate: "2024", doi: "" }],
      loading: false,
      error: null,
    });
    mockTrials.mockReturnValue({
      data: [{ nctId: "NCT001", title: "Trial Title", status: "RECRUITING", phase: "PHASE3", conditions: [], interventions: [], url: "#" }],
      loading: false,
      error: null,
    });
    mockUniProt.mockReturnValue({
      data: { accession: "O43556", proteinName: "Epsilon-sarcoglycan", geneName: "SGCE", features: [], keywords: ["Membrane"], lastModified: "2024-01-01" },
      loading: false,
      error: null,
    });
    mockStringDB.mockReturnValue({
      data: [{ preferredName_A: "SGCE", preferredName_B: "SGCB", ncbiTaxonId: 9606, score: 0.999, escore: 0.8, dscore: 0.9 }],
      loading: false,
      error: null,
    });

    render(<ResearchPanel />);

    expect(screen.getByText("PubMed Title")).toBeInTheDocument();
    expect(screen.getByText("Trial Title")).toBeInTheDocument();
    expect(screen.getByText("Epsilon-sarcoglycan")).toBeInTheDocument();
    expect(screen.getByText("SGCB")).toBeInTheDocument();
  });

  it("shows loading states when hooks are loading", () => {
    setAllLoading();
    render(<ResearchPanel />);
    const loadingTexts = screen.getAllByText("Loading...");
    expect(loadingTexts).toHaveLength(4);
  });
});

// ---------- integration tests ----------
describe("ResearchPanel (integration)", () => {
  // Remove hook mocks for integration tests — re-import the real module
  beforeAll(async () => {
    vi.restoreAllMocks();
    // Dynamically re-enable the real hooks
    vi.doUnmock("@/hooks/usePubMed");
    vi.doUnmock("@/hooks/useClinicalTrials");
    vi.doUnmock("@/hooks/useUniProt");
    vi.doUnmock("@/hooks/useStringDB");
  });

  beforeEach(() => {
    clearAllCache();
    vi.stubGlobal("fetch", createMockFetch());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // Since we use vi.mock at the top level (hoisted), we cannot truly un-mock
  // in the same file. The integration tests therefore live in a separate describe
  // but we use a renderIntegration helper that imports the real component fresh.
  // However vitest hoists vi.mock, so the hooks remain mocked.
  //
  // Strategy: for integration tests, instead of un-mocking, we make the mocked
  // hooks call through to the real implementations via dynamic import.

  // Actually, the cleanest approach: wire the mocks to call real hooks in integration mode.
  // But that's complex. Instead, let's make the mocked hooks call fetch directly
  // by re-implementing a minimal version inline, simulating the full pipeline.

  // Simplest approach: have the mock hooks call the real useFetchData.
  // But useFetchData is not mocked, only the 5 hooks are mocked.
  // So we'll implement integration by having the mocks delegate to real logic.

  // Actually the simplest: un-mock by re-assigning the mock implementations
  // to call the real functions.

  it("renders PubMed articles from mocked fetch", async () => {
    // Manually simulate what usePubMed would return after fetch resolves
    const { usePubMed } = await vi.importActual<typeof import("@/hooks/usePubMed")>("@/hooks/usePubMed");
    mockPubMed.mockImplementation(() => usePubMed());
    // Keep others idle
    mockTrials.mockReturnValue({ data: null, loading: false, error: null });
    mockUniProt.mockReturnValue({ data: null, loading: false, error: null });
    mockStringDB.mockReturnValue({ data: null, loading: false, error: null });

    render(<ResearchPanel />);

    await waitFor(() => {
      expect(screen.getByText("Test Article")).toBeInTheDocument();
    });
  });

  it("renders clinical trials from mocked fetch", async () => {
    const { useClinicalTrials } = await vi.importActual<typeof import("@/hooks/useClinicalTrials")>("@/hooks/useClinicalTrials");
    mockPubMed.mockReturnValue({ data: null, loading: false, error: null });
    mockTrials.mockImplementation(() => useClinicalTrials());
    mockUniProt.mockReturnValue({ data: null, loading: false, error: null });
    mockStringDB.mockReturnValue({ data: null, loading: false, error: null });

    render(<ResearchPanel />);

    await waitFor(() => {
      expect(screen.getByText("Test Trial")).toBeInTheDocument();
    });
  });

  it("renders UniProt annotation from mocked fetch", async () => {
    const { useUniProt } = await vi.importActual<typeof import("@/hooks/useUniProt")>("@/hooks/useUniProt");
    mockPubMed.mockReturnValue({ data: null, loading: false, error: null });
    mockTrials.mockReturnValue({ data: null, loading: false, error: null });
    mockUniProt.mockImplementation(() => useUniProt());
    mockStringDB.mockReturnValue({ data: null, loading: false, error: null });

    render(<ResearchPanel />);

    await waitFor(() => {
      expect(screen.getByText("Epsilon-sarcoglycan")).toBeInTheDocument();
      expect(screen.getByText(/SGCE/)).toBeInTheDocument();
    });
  });

  it("renders STRING interactions from mocked fetch", async () => {
    const { useStringDB } = await vi.importActual<typeof import("@/hooks/useStringDB")>("@/hooks/useStringDB");
    mockPubMed.mockReturnValue({ data: null, loading: false, error: null });
    mockTrials.mockReturnValue({ data: null, loading: false, error: null });
    mockUniProt.mockReturnValue({ data: null, loading: false, error: null });
    mockStringDB.mockImplementation(() => useStringDB());

    render(<ResearchPanel />);

    await waitFor(() => {
      expect(screen.getByText("SGCB")).toBeInTheDocument();
      expect(screen.getByText("0.999")).toBeInTheDocument();
    });
  });
});

// ---------- mock fetch helper ----------
function createMockFetch() {
  return vi.fn((url: string) => {
    if (url.includes("esearch"))
      return okJson({ esearchresult: { idlist: ["111"] } });
    if (url.includes("esummary"))
      return okJson({
        result: {
          uids: ["111"],
          "111": {
            uid: "111",
            title: "Test Article",
            authors: [{ name: "Smith J" }],
            source: "J Test",
            pubdate: "2024",
            elocationid: "doi: 10.1/test",
          },
        },
      });
    if (url.includes("clinicaltrials.gov"))
      return okJson({
        studies: [
          {
            protocolSection: {
              identificationModule: {
                nctId: "NCT001",
                briefTitle: "Test Trial",
              },
              statusModule: { overallStatus: "RECRUITING" },
              designModule: { phases: ["PHASE3"] },
              conditionsModule: { conditions: ["DYT-SGCE"] },
              armsInterventionsModule: {
                interventions: [{ name: "Drug A", type: "Drug" }],
              },
            },
          },
        ],
      });
    if (url.includes("target/search"))
      return okJson({ targets: [{ target_chembl_id: "CHEMBL1" }] });
    if (url.includes("activity.json"))
      return okJson({
        activities: [
          {
            molecule_chembl_id: "CHEMBL2",
            molecule_pref_name: "Compound X",
            target_chembl_id: "CHEMBL1",
            standard_type: "IC50",
            standard_value: 100,
            standard_units: "nM",
          },
        ],
      });
    if (url.includes("uniprot"))
      return okJson({
        primaryAccession: "O43556",
        proteinDescription: {
          recommendedName: {
            fullName: { value: "Epsilon-sarcoglycan" },
          },
        },
        genes: [{ geneName: { value: "SGCE" } }],
        features: [],
        keywords: [{ name: "Membrane" }],
        entryAudit: { lastAnnotationUpdateDate: "2024-01-01" },
      });
    if (url.includes("string-db"))
      return okJson([
        {
          preferredName_A: "SGCE",
          preferredName_B: "SGCB",
          ncbiTaxonId: 9606,
          score: 0.999,
          escore: 0.8,
          dscore: 0.9,
        },
      ]);
    return Promise.resolve({ ok: false, status: 404 } as Response);
  });
}

function okJson(data: unknown) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data),
  } as Response);
}
