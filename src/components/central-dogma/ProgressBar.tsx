import { motion } from "framer-motion";
import { COLORS, CENTRAL_DOGMA_STEPS } from "@/constants/protein-data";

interface ProgressBarProps {
  activeStep: number;
  onStepClick: (step: number) => void;
}

const TOTAL = CENTRAL_DOGMA_STEPS.length;

export function ProgressBar({ activeStep, onStepClick }: ProgressBarProps) {
  return (
    <svg viewBox="0 0 700 60" style={{ width: "100%", maxWidth: 700 }}>
      {CENTRAL_DOGMA_STEPS.map((_, i) => {
        const x = 30 + (i / (TOTAL - 1)) * 640;
        const active = i === activeStep;
        const done = i < activeStep;
        return (
          <g
            key={i}
            data-testid={`step-${i}`}
            onClick={() => onStepClick(i)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onStepClick(i); } }}
            tabIndex={0}
            role="button"
            aria-label={`Step ${i + 1}${i === activeStep ? " (current)" : i < activeStep ? " (completed)" : ""}`}
            aria-pressed={i === activeStep}
            style={{ cursor: "pointer", outline: "none" }}
          >
            {i < TOTAL - 1 && (
              <motion.line
                x1={x + 16}
                y1={30}
                x2={30 + ((i + 1) / (TOTAL - 1)) * 640 - 16}
                y2={30}
                stroke={done ? COLORS.accent : COLORS.panelBorder}
                strokeWidth={2}
                animate={{ stroke: done ? COLORS.accent : COLORS.panelBorder }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            )}
            <motion.circle
              cx={x}
              cy={30}
              fill={active ? COLORS.accent : done ? COLORS.accentDim : COLORS.panel}
              stroke={active ? COLORS.accent : done ? COLORS.accent : COLORS.panelBorder}
              strokeWidth={2}
              animate={{ r: active ? 14 : 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            />
            <text
              x={x}
              y={34}
              textAnchor="middle"
              fontSize={10}
              fontWeight={700}
              fill={active || done ? COLORS.text : COLORS.textDim}
            >
              {i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
