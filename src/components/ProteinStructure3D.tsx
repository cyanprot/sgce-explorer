/**
 * ProteinStructure3D — Interactive 3D protein viewer
 *
 * Uses 3Dmol.js to render actual AlphaFold PDB structure
 * with domain coloring, mutation/glycosylation markers, and WT/Mutant toggle.
 */
import { useState, useRef, useEffect, useCallback } from "react";
import * as $3Dmol from "3dmol";
import { COLORS, DOMAINS, PROTEIN_LENGTH, GLYCOSYLATION_SITES, SGCE_DGC_OFFSET } from "@/constants/protein-data";
import { useVariantStore } from "@/store/variantStore";
import { hexWithAlpha } from "@/utils/hexWithAlpha";
import { ToggleButton } from "./ui/ToggleButton";
import { useProteinData } from "@/hooks/useProteinData";
import { useDGCProteins } from "@/hooks/useDGCProteins";
import { hexToInt } from "@/utils/hexToInt";
import { translatePdb } from "@/utils/translatePdb";
import { SequenceViewer } from "./sequence";
import { DGCLegend } from "./DGCLegend";
import type { ViewMode } from "@/types";

export function ProteinStructure3D() {
  const viewerDivRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<$3Dmol.GLViewer | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("wt");
  const [showDGC, setShowDGC] = useState(false);
  const [hoveredDomain, setHoveredDomain] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [viewerReady, setViewerReady] = useState(false);
  const [selectedResidue, setSelectedResidue] = useState<number | null>(null);
  const [hoveredResidue, setHoveredResidue] = useState<number | null>(null);
  const { pdbData, loading, error, retry } = useProteinData();
  const dgc = useDGCProteins(showDGC);
  const variant = useVariantStore((s) => s.selected);
  const consequence = useVariantStore((s) => s.consequence);

  const showMutant = viewMode === "mutant";

  // Three mutant render states. `deriveConsequence` only computes a PTC for
  // variants carrying an exact CDS edit; a declared frameshift/nonsense without
  // one (browse-only catalog entry) has truncated=false and would otherwise be
  // drawn as a full-length 437-aa protein — a scientifically false picture.
  const isTruncatingClass =
    variant.consequence === "frameshift" || variant.consequence === "nonsense";
  const browseOnlyTruncation = isTruncatingClass && !consequence.truncated;
  const mutantLabel = consequence.truncated
    ? `${consequence.truncatedLength} aa`
    : browseOnlyTruncation
      ? "frameshift"
      : `${consequence.mutantProteinLength} aa`;

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
      setViewerReady(true);
    });

    return () => {
      cancelAnimationFrame(raf);
      const viewer = viewerRef.current;
      if (viewer) {
        viewer.spin(false as any);
        viewer.removeAllLabels();
        viewer.removeAllShapes();
        viewer.removeAllModels();
      }
      viewerRef.current = null;
      setViewerReady(false);
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

    // In DGC mode, translate ε-SG to its offset position
    const sgcePdb = showDGC ? translatePdb(pdbData, { x: SGCE_DGC_OFFSET, y: 0, z: 0 }) : pdbData;
    const model = viewer.addModel(sgcePdb, "pdb");

    const domainColorFunc = (atom: any) => {
      const resi = atom.resi;
      if (resi <= DOMAINS.extracellular.end) return hexToInt(COLORS.extracellular);
      if (resi <= DOMAINS.transmembrane.end) return hexToInt(COLORS.transmembrane);
      return hexToInt(COLORS.cytoplasmic);
    };

    if (showMutant) {
      const ptc = consequence.ptcPosition;
      if (consequence.truncated && ptc != null) {
        // Truncating variant with a computed PTC: WT region, aberrant tract, then hidden.
        viewer.setStyle({}, { cartoon: { hidden: true } });
        // Show residues 1..aaPosition (WT region before the change)
        viewer.setStyle(
          { resi: `1-${variant.aaPosition}` } as any,
          { cartoon: { color: hexToInt(COLORS.extracellular) } }
        );
        // Show the aberrant region up to the premature stop
        viewer.setStyle(
          { resi: `${variant.aaPosition + 1}-${ptc}` } as any,
          { cartoon: { color: hexToInt(COLORS.mutant) } }
        );

        // STOP marker at truncation site
        const stopAtoms = model.selectedAtoms({ resi: ptc, atom: "CA" });
        if (stopAtoms.length > 0) {
          const pos = { x: stopAtoms[0].x!, y: stopAtoms[0].y!, z: stopAtoms[0].z! };
          viewer.addSphere({
            center: pos,
            radius: 2.0,
            color: hexToInt(COLORS.danger) as any,
            opacity: 0.7,
          });
          viewer.addLabel(`STOP (pos ${ptc})`, {
            position: pos,
            backgroundColor: hexToInt(COLORS.danger) as any,
            backgroundOpacity: 0.8,
            fontColor: "white",
            fontSize: 12,
          });
        }
      } else {
        // Non-truncating (missense / in-frame) or a frameshift whose exact PTC is
        // not catalogued (browse-only): the mutant is full-length here, so draw the
        // whole structure with domain coloring and mark only the changed residue.
        // Never fabricate a truncation we have not computed.
        viewer.setStyle({}, { cartoon: { colorfunc: domainColorFunc } });
      }

      // Mutation site marker (all mutant states)
      const mutAtoms = model.selectedAtoms({ resi: variant.aaPosition, atom: "CA" });
      if (mutAtoms.length > 0) {
        const pos = { x: mutAtoms[0].x!, y: mutAtoms[0].y!, z: mutAtoms[0].z! };
        viewer.addSphere({
          center: pos,
          radius: 1.5,
          color: hexToInt(COLORS.warn) as any,
          opacity: 0.7,
        });
        viewer.addLabel(`Res ${variant.aaPosition} (${variant.consequence})`, {
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

      // Mutation site marker
      const mutAtoms = model.selectedAtoms({ resi: variant.aaPosition, atom: "CA" });
      if (mutAtoms.length > 0) {
        const pos = { x: mutAtoms[0].x!, y: mutAtoms[0].y!, z: mutAtoms[0].z! };
        viewer.addSphere({
          center: pos,
          radius: 1.5,
          color: hexToInt(COLORS.danger) as any,
          opacity: 0.7,
        });
        viewer.addLabel(`Res ${variant.aaPosition} (mutation)`, {
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

    // ε-SG label in DGC mode
    if (showDGC) {
      const labelText = showMutant ? "ε-SG: MISSING" : "ε-SG";
      const labelColor = showMutant ? COLORS.danger : COLORS.extracellular;
      viewer.addLabel(labelText, {
        position: { x: SGCE_DGC_OFFSET, y: 30, z: 0 },
        backgroundColor: hexToInt(labelColor) as any,
        backgroundOpacity: 0.8,
        fontColor: "white",
        fontSize: 11,
      });
    }

    // DGC partners rendering
    if (showDGC && dgc.allLoaded) {
      for (const partner of dgc.partners) {
        if (!partner.pdbData) continue;
        const translated = translatePdb(partner.pdbData, { x: partner.xOffset, y: 0, z: 0 });
        const partnerModel = viewer.addModel(translated, "pdb");
        partnerModel.setStyle({}, { cartoon: { color: hexToInt(partner.color) } });

        // Label above each partner
        viewer.addLabel(partner.name.replace("-Sarcoglycan", "-SG"), {
          position: { x: partner.xOffset, y: 30, z: 0 },
          backgroundColor: hexToInt(partner.color) as any,
          backgroundOpacity: 0.8,
          fontColor: "white",
          fontSize: 11,
        });
      }

      // Membrane plane — thin amber slab spanning all subunits
      const tmY = 0; // approximate TM center
      viewer.addBox({
        center: { x: 0, y: tmY, z: 0 },
        dimensions: { w: 80, h: 2, d: 40 },
        color: hexToInt(COLORS.transmembrane) as any,
        opacity: 0.15,
      });
      viewer.addLabel("Membrane", {
        position: { x: 40, y: tmY, z: 0 },
        backgroundColor: hexToInt(COLORS.transmembrane) as any,
        backgroundOpacity: 0.6,
        fontColor: "white",
        fontSize: 10,
      });
    }

      // Click-to-select: clicking an atom in 3D highlights the residue in SequenceViewer
      (viewer as any).setClickable({}, {}, (atom: any) => {
        if (atom?.resi) setSelectedResidue(atom.resi);
      });

      viewer.zoomTo();
      viewer.render();
    };

    tryRender();
    return () => clearTimeout(retryTimer);
  }, [pdbData, showMutant, showDGC, dgc.allLoaded, dgc.partners, variant, consequence]);

  // Effect 3: Spin control
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    if (autoRotate) {
      viewer.spin("y" as any, 1);
    } else {
      viewer.spin(false as any);
    }
  }, [autoRotate, pdbData, viewerReady]);

  // Effect 4: Highlight selected residue in 3D viewer
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || selectedResidue == null) return;

    // Zoom to selected residue and add highlight
    viewer.zoomTo({ resi: selectedResidue } as any);
    viewer.render();
  }, [selectedResidue]);

  const handleResidueClick = useCallback((position: number) => {
    setSelectedResidue(position);
  }, []);

  const handleResidueHover = useCallback((position: number | null) => {
    setHoveredResidue(position);
  }, []);

  // Effect 5: Resize
  useEffect(() => {
    const el = viewerDivRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const width = entry?.contentRect.width ?? el.clientWidth;
      const height = entry?.contentRect.height ?? el.clientHeight;
      if (width <= 0 || height <= 0) return;

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
    <div className="flex flex-col h-[calc(100dvh-var(--app-header-h)-80px)] min-h-[400px] sm:min-h-[500px]">
      {/* Controls */}
      <div className="flex gap-3 px-6 py-4 flex-wrap items-center">
        <ToggleButton active={!showMutant} onClick={() => setViewMode("wt")} label={`Wild-type (${PROTEIN_LENGTH} aa)`} color={COLORS.accent} />
        <ToggleButton active={showMutant} onClick={() => setViewMode("mutant")} label={`Mutant (${mutantLabel})`} color={COLORS.danger} />
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

      {/* Sequence viewer */}
      <SequenceViewer
        selectedResidue={selectedResidue}
        hoveredResidue={hoveredResidue}
        onResidueClick={handleResidueClick}
        onResidueHover={handleResidueHover}
        viewMode={viewMode}
      />

      {/* 3D Viewport */}
      <div
        className="flex-1 relative"
        style={{ minHeight: 400 }}
        role="img"
        aria-label={
          showMutant
            ? consequence.truncated
              ? `3D protein structure: mutant ε-sarcoglycan, truncated at residue ${consequence.ptcPosition} of ${PROTEIN_LENGTH} (${(consequence.fractionOfWT * 100).toFixed(1)}%), red region shows the aberrant residues`
              : browseOnlyTruncation
                ? `3D protein structure: ${variant.consequence} variant ${variant.notation}; the exact premature-stop position is not catalogued, so the full-length structure is shown for reference with residue ${variant.aaPosition} highlighted`
                : `3D protein structure: mutant ε-sarcoglycan, full-length ${consequence.mutantProteinLength} of ${PROTEIN_LENGTH} residues, changed residue ${variant.aaPosition} highlighted`
            : `3D protein structure: wild-type ε-sarcoglycan, ${PROTEIN_LENGTH} amino acids. Blue: extracellular domain, amber: transmembrane helix, purple: cytoplasmic tail`
        }
      >
        <div ref={viewerDivRef} className="absolute inset-0" aria-hidden="true" />
        <div className="absolute bottom-4 left-4 rounded-lg p-3 text-xs max-w-xs z-10 pointer-events-none" style={{ background: hexWithAlpha(COLORS.overlay, 0.7) }}>
          {showMutant ? (
            <>
              <div className="font-bold mb-1" style={{ color: COLORS.danger }}>
                {consequence.truncated
                  ? `Truncated — ${consequence.truncatedLength} aa`
                  : browseOnlyTruncation
                    ? `${variant.consequence} — browse-only`
                    : `Mutant — ${consequence.mutantProteinLength} aa`}
              </div>
              <div style={{ color: COLORS.textDim }} className="leading-relaxed">
                {consequence.truncated ? (
                  <>
                    {variant.cNotation} → {variant.consequence} at residue {variant.aaPosition} → PTC at pos {consequence.ptcPosition}.
                    {" "}{(consequence.fractionOfWT * 100).toFixed(1)}% of WT.{consequence.nmdPredicted ? " NMD + degradation." : ""}
                  </>
                ) : browseOnlyTruncation ? (
                  <>
                    {variant.cNotation || variant.notation} → {variant.consequence} at residue {variant.aaPosition}. Exact truncation not in this catalog entry — full structure shown for reference.
                  </>
                ) : (
                  <>
                    {variant.cNotation || variant.notation} → {variant.consequence} at residue {variant.aaPosition}. Full-length product ({consequence.mutantProteinLength} aa).
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="font-bold mb-1" style={{ color: COLORS.accent }}>Wild-type ε-Sarcoglycan — {PROTEIN_LENGTH} aa</div>
              <div style={{ color: COLORS.textDim }} className="leading-relaxed">
                Type I TM glycoprotein. DGC sarcoglycan subcomplex member.
                <span style={{ color: COLORS.success }}> ● </span>Asn200 glycosylation
                <span style={{ color: COLORS.danger }}> ◆ </span>Res {variant.aaPosition} mutation site
              </div>
            </>
          )}
        </div>
        {loading && (
          <div className="absolute top-4 left-4 text-xs px-3 py-1.5 rounded z-10" style={{ background: COLORS.accentDim, color: COLORS.accent }}>
            Loading AlphaFold PDB...
          </div>
        )}
        {showDGC && <DGCLegend partners={dgc.partners} showMutant={showMutant} />}
        {(error || viewerError) && (
          <div className="absolute top-4 left-4 text-xs px-3 py-1.5 rounded z-10 flex items-center gap-2" style={{ background: COLORS.dangerDim, color: COLORS.danger }}>
            <span>{viewerError || error}</span>
            {error && (
              <button
                onClick={retry}
                disabled={loading}
                className="px-2 py-0.5 rounded text-xs font-semibold border cursor-pointer disabled:opacity-50"
                style={{ borderColor: COLORS.danger, color: COLORS.danger }}
              >
                Retry
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Domain Bar sub-component ──
function DomainBar({ showMutant }: { showMutant: boolean }) {
  const variant = useVariantStore((s) => s.selected);
  const consequence = useVariantStore((s) => s.consequence);
  // Only a computed truncation collapses the domain architecture. Full-length
  // and browse-only mutants keep the reference domain bar.
  const showTruncated = showMutant && consequence.truncated;
  const truncLen = consequence.truncatedLength ?? consequence.mutantProteinLength;
  const domains = showTruncated
    ? [
        { pct: truncLen > 0 ? ((variant.aaPosition - 1) / truncLen) * 100 : 0, color: COLORS.extracellular, label: "WT" },
        { pct: truncLen > 0 ? (consequence.novelAaCount / truncLen) * 100 : 0, color: COLORS.mutant, label: "Frameshifted" },
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
            className="flex items-center justify-center text-[10px] font-bold text-white"
          >
            {d.pct > 8 ? d.label : ""}
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] mt-0.5" style={{ color: COLORS.textDim }}>
        <span>1</span>
        {!showTruncated && <span>317|318</span>}
        {!showTruncated && <span>338|339</span>}
        <span>{showTruncated ? truncLen : PROTEIN_LENGTH}</span>
      </div>
    </>
  );
}
