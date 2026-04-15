import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ProteinStructure3D } from "@/components/ProteinStructure3D";
import { CentralDogma } from "@/components/CentralDogma";
import { ImprintingPanel } from "@/components/ImprintingPanel";
import { ResearchPanel } from "@/components/ResearchPanel";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import { COLORS, MUTATION } from "@/constants/protein-data";
import type { TabId } from "@/types";

const TABS: { id: TabId; label: string }[] = [
  { id: "structure", label: "3D Structure" },
  { id: "dogma", label: "Central Dogma" },
  { id: "imprinting", label: "Imprinting" },
  { id: "research", label: "Research" },
];

export default function App() {
  const [tab, setTab] = useState<TabId>("structure");
  const headerRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const applyHeight = (h: number) => {
      document.documentElement.style.setProperty("--app-header-h", `${h}px`);
    };
    applyHeight(el.getBoundingClientRect().height);
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) applyHeight(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    document.title = "Arcivus Explorer — SGCE ε-Sarcoglycan";
  }, []);

  return (
    <div className="overflow-x-hidden">
      <Nav />
      <main id="main-content" className="pt-[80px]">
        <div style={{ background: COLORS.bg, color: COLORS.text }}>
          <a
            href={`#tabpanel-${tab}`}
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded focus:text-sm"
            style={{ background: COLORS.accent, color: COLORS.bg }}
          >
            Skip to content
          </a>

          <header
            ref={headerRef}
            className="px-6 pt-5 border-b"
            style={{ borderColor: COLORS.panelBorder }}
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
              <h1 className="text-2xl font-bold tracking-tight m-0">
                SGCE <span style={{ color: COLORS.accent }}>ε-Sarcoglycan</span> Explorer
              </h1>
              <span
                className="inline-flex text-xs font-mono px-2 py-0.5 rounded"
                style={{ color: COLORS.danger, background: COLORS.dangerDim }}
                aria-label={`Mutation: ${MUTATION.cNotation}, ${MUTATION.notation}`}
              >
                <span className="sm:hidden">{MUTATION.cNotation}</span>
                <span className="hidden sm:inline">
                  {MUTATION.cNotation} · {MUTATION.notation}
                </span>
              </span>
            </div>
            <p className="text-xs mb-4" style={{ color: COLORS.textDim }}>
              Interactive visualization — DYT-SGCE with maternal imprinting → complete loss of function
            </p>
            <nav
              role="tablist"
              aria-label="Explorer sections"
              className="flex overflow-x-auto no-scrollbar"
            >
              {TABS.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  aria-controls={`tabpanel-${t.id}`}
                  id={`tab-${t.id}`}
                  onClick={() => setTab(t.id)}
                  className="px-3 sm:px-5 py-2.5 text-sm font-semibold cursor-pointer rounded-t-lg -mb-px transition-all whitespace-nowrap"
                  style={{
                    background: tab === t.id ? COLORS.panel : "transparent",
                    color: tab === t.id ? COLORS.accent : COLORS.textDim,
                    borderTop: tab === t.id ? `2px solid ${COLORS.accent}` : "2px solid transparent",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </nav>
          </header>

          <section aria-label="Tab panels">
            <div
              id="tabpanel-structure"
              role="tabpanel"
              aria-labelledby="tab-structure"
              hidden={tab !== "structure"}
            >
              {tab === "structure" && <ProteinStructure3D />}
            </div>
            <div
              id="tabpanel-dogma"
              role="tabpanel"
              aria-labelledby="tab-dogma"
              hidden={tab !== "dogma"}
            >
              {tab === "dogma" && <CentralDogma />}
            </div>
            <div
              id="tabpanel-imprinting"
              role="tabpanel"
              aria-labelledby="tab-imprinting"
              hidden={tab !== "imprinting"}
            >
              {tab === "imprinting" && <ImprintingPanel />}
            </div>
            <div
              id="tabpanel-research"
              role="tabpanel"
              aria-labelledby="tab-research"
              hidden={tab !== "research"}
            >
              {tab === "research" && <ResearchPanel />}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
