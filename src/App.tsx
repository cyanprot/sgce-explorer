import { useState } from "react";
import { ProteinStructure3D } from "@/components/ProteinStructure3D";
import { CentralDogma } from "@/components/CentralDogma";
import { ImprintingPanel } from "@/components/ImprintingPanel";
import { ResearchPanel } from "@/components/ResearchPanel";
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

  return (
    <div className="min-h-screen" style={{ background: COLORS.bg, color: COLORS.text }}>
      <a
        href={`#tabpanel-${tab}`}
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded focus:text-sm"
        style={{ background: COLORS.accent, color: COLORS.bg }}
      >
        Skip to content
      </a>

      {/* Header */}
      <header className="px-6 pt-5 border-b" style={{ borderColor: COLORS.panelBorder }}>
        <div className="flex items-baseline gap-3 mb-1">
          <h1 className="text-2xl font-bold tracking-tight m-0">
            SGCE <span style={{ color: COLORS.accent }}>ε-Sarcoglycan</span> Explorer
          </h1>
          <span
            className="sr-only sm:not-sr-only sm:inline-flex text-xs font-mono px-2 py-0.5 rounded"
            style={{ color: COLORS.danger, background: COLORS.dangerDim }}
            aria-label={`Mutation: ${MUTATION.cNotation}, ${MUTATION.notation}`}
          >
            {MUTATION.cNotation} · {MUTATION.notation}
          </span>
        </div>
        <p className="text-xs mb-4" style={{ color: COLORS.textDim }}>
          Interactive visualization — DYT-SGCE with maternal imprinting → complete loss of function
        </p>
        <nav role="tablist" aria-label="Explorer sections" className="flex overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              aria-controls={`tabpanel-${t.id}`}
              id={`tab-${t.id}`}
              onClick={() => setTab(t.id)}
              className="px-5 py-2.5 text-sm font-semibold cursor-pointer rounded-t-lg -mb-px transition-all"
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

      {/* Tab content */}
      <main>
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
      </main>
    </div>
  );
}
