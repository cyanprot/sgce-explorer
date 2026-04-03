import React from "react";
import { COLORS } from "@/constants/protein-data";

export interface ResidueCellProps {
  residue: string;
  position: number;
  color: string;
  isSelected: boolean;
  isHovered: boolean;
  isMutationSite: boolean;
  isPTC: boolean;
  isAberrant: boolean;
  onClick: (position: number) => void;
  onMouseEnter: (position: number) => void;
  onMouseLeave: () => void;
}

export const ResidueCell = React.memo(function ResidueCell({
  residue,
  position,
  color,
  isSelected,
  isHovered,
  isMutationSite,
  isPTC,
  isAberrant,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: ResidueCellProps) {
  // Determine background color: special states override domain color
  let bgColor = color;
  if (isPTC) {
    bgColor = COLORS.danger;
  } else if (isMutationSite) {
    bgColor = COLORS.warn;
  }

  // Build class list
  const classNames = ["residue-cell"];
  if (isSelected) classNames.push("selected");
  if (isHovered) classNames.push("hovered");
  if (isAberrant) classNames.push("aberrant");
  if (isMutationSite) classNames.push("mutation-site");
  if (isPTC) classNames.push("ptc");

  const ariaLabel = `${residue}${position}${isMutationSite ? " (frameshift start)" : isPTC ? " (premature stop codon)" : isAberrant ? " (aberrant frameshift region)" : ""}`;

  return (
    <div
      data-testid={`residue-${position}`}
      className={classNames.join(" ")}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-pressed={isSelected}
      style={{
        display: "inline-block",
        width: 24,
        height: 60,
        backgroundColor: bgColor,
        color: COLORS.text,
        fontSize: 12,
        fontFamily: "monospace",
        textAlign: "center",
        lineHeight: "60px",
        cursor: "pointer",
        position: "relative",
        border: isMutationSite || isPTC ? "2px solid currentColor" : "none",
        transform: isSelected ? "scale(1.15)" : "none",
        opacity: isAberrant ? 0.6 : 1,
        transition: "transform 0.1s, opacity 0.1s",
      }}
      onClick={() => onClick(position)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(position); } }}
      onMouseEnter={() => onMouseEnter(position)}
      onMouseLeave={onMouseLeave}
    >
      {residue}
      {(isSelected || isHovered) && (
        <span
          style={{
            position: "absolute",
            top: -16,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 9,
            color: COLORS.textDim,
            whiteSpace: "nowrap",
          }}
        >
          {position}
        </span>
      )}
    </div>
  );
});
