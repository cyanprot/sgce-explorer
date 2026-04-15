import { useEffect, useRef, useCallback, useState } from "react";
import { SEQUENCE, MUTATION, COLORS, DOMAINS } from "@/constants/protein-data";
import { getDomainForPosition } from "@/utils/getDomainForPosition";
import { ResidueCell } from "./ResidueCell";
import type { ViewMode } from "@/types";

export interface SequenceViewerProps {
  selectedResidue: number | null;
  hoveredResidue: number | null;
  onResidueClick: (position: number) => void;
  onResidueHover: (position: number | null) => void;
  viewMode: ViewMode;
}

export function SequenceViewer({
  selectedResidue,
  hoveredResidue,
  onResidueClick,
  onResidueHover,
  viewMode,
}: SequenceViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Scroll to selected residue when it changes externally
  useEffect(() => {
    if (selectedResidue == null) return;
    const el = scrollRef.current?.querySelector(
      `[data-testid="residue-${selectedResidue}"]`,
    );
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [selectedResidue]);

  const updateScrollIndicators = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollIndicators);
    updateScrollIndicators();
    return () => el.removeEventListener("scroll", updateScrollIndicators);
  }, [updateScrollIndicators]);

  const handleMouseLeave = useCallback(() => {
    onResidueHover(null);
  }, [onResidueHover]);

  return (
    <div className="px-6 py-2">
      {/* Legend + mutation label */}
      <div className="flex items-center gap-4 mb-1 text-[10px]" style={{ color: COLORS.textDim }}>
        {Object.values(DOMAINS).map((d) => (
          <span key={d.label} className="flex items-center gap-1">
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: d.color }}
            />
            {d.label}
          </span>
        ))}
        <span className="ml-auto font-mono" style={{ color: COLORS.danger }}>
          {MUTATION.notation}
        </span>
      </div>

      {/* Scrollable sequence track */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="overflow-x-auto no-scrollbar"
          aria-label="Amino acid sequence, 437 residues. Click any residue to zoom the 3D viewer to that position."
          role="region"
          style={{
            whiteSpace: "nowrap",
            maxHeight: 80,
            border: `1px solid ${COLORS.panelBorder}`,
            borderRadius: 6,
            background: COLORS.panel,
          }}
        >
          {Array.from(SEQUENCE).map((residue, idx) => {
            const position = idx + 1;
            const domain = getDomainForPosition(position);
            const color = domain?.color ?? COLORS.textDim;

            return (
              <ResidueCell
                key={position}
                residue={residue}
                position={position}
                color={color}
                isSelected={selectedResidue === position}
                isHovered={hoveredResidue === position}
                isMutationSite={position === MUTATION.aaPosition}
                isPTC={position === MUTATION.truncationAt}
                isAberrant={
                  position > MUTATION.aaPosition && position < MUTATION.truncationAt
                }
                onClick={onResidueClick}
                onMouseEnter={onResidueHover}
                onMouseLeave={handleMouseLeave}
              />
            );
          })}
        </div>
        <div
          data-testid="scroll-indicator-left"
          className={`absolute left-0 top-0 bottom-0 w-8 pointer-events-none rounded-l-md transition-opacity ${canScrollLeft ? "opacity-100" : "opacity-0"}`}
          style={{ background: `linear-gradient(to left, transparent, ${COLORS.panel})` }}
        >
          <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px]" style={{ color: COLORS.textDim }}>←</span>
        </div>
        <div
          data-testid="scroll-indicator-right"
          className={`absolute right-0 top-0 bottom-0 w-8 pointer-events-none rounded-r-md transition-opacity ${canScrollRight ? "opacity-100" : "opacity-0"}`}
          style={{ background: `linear-gradient(to right, transparent, ${COLORS.panel})` }}
        >
          <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px]" style={{ color: COLORS.textDim }}>→</span>
        </div>
        <div
          data-testid="scroll-fade"
          className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none rounded-r-md"
          style={{ background: `linear-gradient(to right, transparent, ${COLORS.panel})` }}
        />
      </div>
    </div>
  );
}
