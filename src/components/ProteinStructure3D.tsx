/**
 * ProteinStructure3D — Interactive 3D protein viewer
 *
 * Uses 3Dmol.js to render actual AlphaFold PDB structure
 * with domain coloring, mutation/glycosylation markers, and WT/Mutant toggle.
 */
import { useState, useRef, useEffect } from "react";
import * as $3Dmol from "3dmol";
import { COLORS, DOMAINS, MUTATION, PROTEIN_LENGTH, GLYCOSYLATION_SITES } from "@/constants/protein-data";
import { ToggleButton } from "./ui/ToggleButton";
import { useProteinData } from "@/hooks/useProteinData";
import { hexToInt } from "@/utils/hexToInt";
import type { ViewMode } from "@/types";

export function ProteinStructure3D() {
  const viewerDivRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<$3Dmol.GLViewer | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("wt");
  const [showDGC, setShowDGC] = useState(false);
  const [hoveredDomain, setHoveredDomain] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const { pdbData, loading, error } = useProteinData();

  const showMutant = viewMode === "mutant";

  // Effect 1: Viewer lifecycle — uses dedicated div, not the React container
  useEffect(() => {
    const el = viewerDivRef.current;
    if (!el) return;

    // Defer creation to next frame so the div has layout dimensions
    const raf = requestAnimationFrame(() => {
      const viewer = $3Dmol.createViewer(el, {
        backgroundColor: COLORS.bg,
      });

      if (!viewer) {
        setViewerError("WebGL not available");
        return;
      }

      viewerRef.current = viewer;
    });

    return () => {
      cancelAnimationFrame(raf);
      viewerRef.current = null;
      if (el) {
        el.innerHTML = "";
      }
    };
  }, []);

  // Effect 2: Model loading + styling
  // Retry on short interval until viewer is ready (deferred by rAF in Effect 1)
  useEffect(() => {
    if (!pdbData) return;

    let retryTimer: ReturnType<typeof setTimeout>;
    const tryRender = () => {
      const viewer = viewerRef.current;
      if (!viewer) {
        retryTimer = setTimeout(tryRender, 50);
        return;
      }
      renderModel(viewer);
    };

    const renderModel = (viewer: $3Dmol.GLViewer) => {

    viewer.removeAllModels();
    viewer.removeAllShapes();
    viewer.removeAllLabels();

    const model = viewer.addModel(pdbData, "pdb");

    const domainColorFunc = (atom: any) => {
      const resi = atom.resi;
      if (resi <= DOMAINS.extracellular.end) return hexToInt(COLORS.extracellular);
      if (resi <= DOMAINS.transmembrane.end) return hexToInt(COLORS.transmembrane);
      return hexToInt(COLORS.cytoplasmic);
    };

    if (showMutant) {
      // Hide everything first
      viewer.setStyle({}, { cartoon: { hidden: true } });
      // Show residues 1-37 (WT region before frameshift)
      viewer.setStyle(
        { resi: `1-${MUTATION.aaPosition}` } as any,
        { cartoon: { color: hexToInt(COLORS.extracellular) } }
      );
      // Show residues 38-68 (frameshifted region)
      viewer.setStyle(
        { resi: `${MUTATION.aaPosition + 1}-${MUTATION.truncationAt}` } as any,
        { cartoon: { color: hexToInt(COLORS.mutant) } }
      );

      // STOP marker at truncation site
      const stopAtoms = model.selectedAtoms({ resi: MUTATION.truncationAt, atom: "CA" });
      if (stopAtoms.length > 0) {
        const pos = { x: stopAtoms[0].x!, y: stopAtoms[0].y!, z: stopAtoms[0].z! };
        viewer.addSphere({
          center: pos,
          radius: 2.0,
          color: hexToInt(COLORS.danger) as any,
          opacity: 0.7,
        });
        viewer.addLabel(`STOP (pos ${MUTATION.truncationAt})`, {
          position: pos,
          backgroundColor: hexToInt(COLORS.danger) as any,
          backgroundOpacity: 0.8,
          fontColor: "white",
          fontSize: 12,
        });
      }

      // Mutation site marker (Val37)
      const mutAtoms = model.selectedAtoms({ resi: MUTATION.aaPosition, atom: "CA" });
      if (mutAtoms.length > 0) {
        const pos = { x: mutAtoms[0].x!, y: mutAtoms[0].y!, z: mutAtoms[0].z! };
        viewer.addSphere({
          center: pos,
          radius: 1.5,
          color: hexToInt(COLORS.warn) as any,
          opacity: 0.7,
        });
        viewer.addLabel(`Val${MUTATION.aaPosition} (frameshift)`, {
          position: pos,
          backgroundColor: hexToInt(COLORS.warn) as any,
          backgroundOpacity: 0.8,
          fontColor: "black",
          fontSize: 11,
        });
      }
    } else {
      // WT: full structure with domain coloring
      viewer.setStyle({}, { cartoon: { colorfunc: domainColorFunc } });

      // Mutation site marker (Val37)
      const mutAtoms = model.selectedAtoms({ resi: MUTATION.aaPosition, atom: "CA" });
      if (mutAtoms.length > 0) {
        const pos = { x: mutAtoms[0].x!, y: mutAtoms[0].y!, z: mutAtoms[0].z! };
        viewer.addSphere({
          center: pos,
          radius: 1.5,
          color: hexToInt(COLORS.danger) as any,
          opacity: 0.7,
        });
        viewer.addLabel(`Val${MUTATION.aaPosition} (mutation)`, {
          position: pos,
          backgroundColor: hexToInt(COLORS.danger) as any,
          backgroundOpacity: 0.8,
          fontColor: "white",
          fontSize: 11,
        });
      }

      // Glycosylation marker (Asn200)
      const glycoSite = GLYCOSYLATION_SITES[0];
      const glycoAtoms = model.selectedAtoms({ resi: glycoSite.position, atom: "CA" });
      if (glycoAtoms.length > 0) {
        const pos = { x: glycoAtoms[0].x!, y: glycoAtoms[0].y!, z: glycoAtoms[0].z! };
        viewer.addSphere({
          center: pos,
          radius: 1.5,
          color: hexToInt(COLORS.success) as any,
          opacity: 0.7,
        });
        viewer.addLabel(`${glycoSite.residue}${glycoSite.position} (${glycoSite.type})`, {
          position: pos,
          backgroundColor: hexToInt(COLORS.success) as any,
          backgroundOpacity: 0.8,
          fontColor: "black",
          fontSize: 11,
        });
      }
    }

      viewer.zoomTo();
      viewer.render();
    };

    tryRender();
    return () => clearTimeout(retryTimer);
  }, [pdbData, showMutant]);

  // Effect 3: Spin control
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    if (autoRotate) {
      viewer.spin("y" as any, 1);
    } else {
      viewer.spin(false as any);
    }
  }, [autoRotate, pdbData]);

  // Effect 4: Resize
  useEffect(() => {
    const el = viewerDivRef.current;
    if (!el) return;

    const observer = new ResizeObserver(() => {
      const viewer = viewerRef.current;
      if (viewer) {
        viewer.resize();
        viewer.render();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 120px)" }}>
      {/* Controls */}
      <div className="flex gap-3 px-6 py-4 flex-wrap items-center">
        <ToggleButton active={!showMutant} onClick={() => setViewMode("wt")} label={`Wild-type (${PROTEIN_LENGTH} aa)`} color={COLORS.accent} />
        <ToggleButton active={showMutant} onClick={() => setViewMode("mutant")} label={`Mutant (${MUTATION.truncationAt} aa)`} color={COLORS.danger} />
        <div className="w-px h-6" style={{ background: COLORS.panelBorder }} />
        <ToggleButton active={showDGC} onClick={() => setShowDGC(!showDGC)} label="DGC Complex" color={COLORS.cytoplasmic} />
        <ToggleButton active={autoRotate} onClick={() => setAutoRotate(!autoRotate)} label="Auto-rotate" color={COLORS.success} />
        {hoveredDomain && (
          <span className="ml-auto text-xs font-mono" style={{ color: COLORS.warn }}>{hoveredDomain}</span>
        )}
      </div>

      {/* Domain bar */}
      <div className="px-6">
        <DomainBar showMutant={showMutant} />
      </div>

      {/* 3D Viewport */}
      <div className="flex-1 relative" style={{ minHeight: 300 }}>
        <div ref={viewerDivRef} className="absolute inset-0" />
        <div className="absolute bottom-4 left-4 rounded-lg p-3 text-xs max-w-xs z-10 pointer-events-none" style={{ background: "rgba(0,0,0,0.7)" }}>
          {showMutant ? (
            <>
              <div className="font-bold mb-1" style={{ color: COLORS.danger }}>Truncated — {MUTATION.truncationAt} aa</div>
              <div style={{ color: COLORS.textDim }} className="leading-relaxed">
                {MUTATION.cNotation} → frameshift at Val{MUTATION.aaPosition} → PTC at pos {MUTATION.truncationAt}.
                Only {((MUTATION.truncationAt / PROTEIN_LENGTH) * 100).toFixed(1)}% of WT. No TM/cyto domain → NMD + degradation.
              </div>
            </>
          ) : (
            <>
              <div className="font-bold mb-1" style={{ color: COLORS.accent }}>Wild-type ε-Sarcoglycan — {PROTEIN_LENGTH} aa</div>
              <div style={{ color: COLORS.textDim }} className="leading-relaxed">
                Type I TM glycoprotein. DGC sarcoglycan subcomplex member.
                <span style={{ color: COLORS.success }}> ● </span>Asn200 glycosylation
                <span style={{ color: COLORS.danger }}> ◆ </span>Val{MUTATION.aaPosition} mutation site
              </div>
            </>
          )}
        </div>
        {loading && (
          <div className="absolute top-4 left-4 text-xs px-3 py-1.5 rounded z-10" style={{ background: COLORS.accentDim, color: COLORS.accent }}>
            Loading AlphaFold PDB...
          </div>
        )}
        {(error || viewerError) && (
          <div className="absolute top-4 left-4 text-xs px-3 py-1.5 rounded z-10" style={{ background: COLORS.dangerDim, color: COLORS.danger }}>
            {viewerError || error}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Domain Bar sub-component ──
function DomainBar({ showMutant }: { showMutant: boolean }) {
  const domains = showMutant
    ? [
        { pct: (MUTATION.aaPosition / MUTATION.truncationAt) * 100, color: COLORS.extracellular, label: "WT" },
        { pct: ((MUTATION.truncationAt - MUTATION.aaPosition) / MUTATION.truncationAt) * 100, color: COLORS.mutant, label: "Frameshifted" },
      ]
    : [
        { pct: (317 / 437) * 100, color: COLORS.extracellular, label: "Extracellular" },
        { pct: (21 / 437) * 100, color: COLORS.transmembrane, label: "TM" },
        { pct: (99 / 437) * 100, color: COLORS.cytoplasmic, label: "Cyto" },
      ];

  return (
    <>
      <div className="flex h-5 rounded overflow-hidden border" style={{ borderColor: COLORS.panelBorder }}>
        {domains.map((d, i) => (
          <div key={i} style={{ width: `${d.pct}%`, background: d.color }}
            className="flex items-center justify-center text-[9px] font-bold text-white"
          >
            {d.pct > 8 ? d.label : ""}
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] mt-0.5" style={{ color: COLORS.textDim }}>
        <span>1</span>
        {!showMutant && <span>317|318</span>}
        {!showMutant && <span>338|339</span>}
        <span>{showMutant ? MUTATION.truncationAt : PROTEIN_LENGTH}</span>
      </div>
    </>
  );
}
