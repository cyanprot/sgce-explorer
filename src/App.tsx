import { useState } from "react";
import { ProteinStructure3D } from "@/components/ProteinStructure3D";
import { CentralDogma } from "@/components/CentralDogma";
import { ImprintingPanel } from "@/components/ImprintingPanel";
import { COLORS, MUTATION } from "@/constants/protein-data";
import type { TabId } from "@/types";

const TABS: { id: TabId; label: string }[] = [
  { id: "structure", label: "3D Structure" },
  { id: "dogma", label: "Central Dogma" },
  { id: "imprinting", label: "Imprinting" },
];

export default function App() {
  const [tab, setTab] = useState<TabId>("structure");

  return (
    <div className="min-h-screen" style={{ background: COLORS.bg, color: COLORS.text }}>
      {/* Header */}
      <div className="px-6 pt-5 border-b" style={{ borderColor: COLORS.panelBorder }}>
        <div className="flex items-baseline gap-3 mb-1">
          <h1 className="text-xl font-bold tracking-tight m-0">
            SGCE <span style={{ color: COLORS.accent }}>ε-Sarcoglycan</span> Explorer
          </h1>
          <span className="text-xs font-mono px-2 py-0.5 rounded"
            style={{ color: COLORS.danger, background: COLORS.dangerDim }}>
            {MUTATION.cNotation} · {MUTATION.notation}
          </span>
        </div>
        <p className="text-xs mb-4" style={{ color: COLORS.textDim }}>
          Interactive visualization — DYT-SGCE with maternal imprinting → complete loss of function
        </p>
        <div className="flex">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-5 py-2.5 text-sm font-semibold cursor-pointer rounded-t-lg -mb-px transition-all"
              style={{
                background: tab === t.id ? COLORS.panel : "transparent",
                color: tab === t.id ? COLORS.accent : COLORS.textDim,
                borderTop: tab === t.id ? `2px solid ${COLORS.accent}` : "2px solid transparent",
                borderBottom: tab === t.id ? `2px solid ${COLORS.panel}` : "none",
                border: "none",
                borderTopStyle: "solid",
                borderTopWidth: 2,
                borderTopColor: tab === t.id ? COLORS.accent : "transparent",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {tab === "structure" && <ProteinStructure3D />}
      {tab === "dogma" && <CentralDogma />}
      {tab === "imprinting" && <ImprintingPanel />}
    </div>
  );
}
