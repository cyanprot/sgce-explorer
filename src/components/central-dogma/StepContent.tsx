import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { COLORS, MUTATION } from "@/constants/protein-data";
import { hexWithAlpha } from "@/utils/hexWithAlpha";
import type { CentralDogmaStep } from "@/types";

interface StepContentProps {
  step: CentralDogmaStep;
}

// The central-dogma walkthrough narrates the patient's disease mechanism, so the
// step prose (CENTRAL_DOGMA_STEPS) is fixed to c.108dup. Pin the mutation badge to
// the same variant rather than the store selection, so header and body never disagree.
export function StepContent({ step }: StepContentProps) {
  const reduce = useReducedMotion();
  const variant = MUTATION;
  return (
    <AnimatePresence initial={false} mode="popLayout">
      <motion.div
        key={step.title}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduce ? 0 : 0.2, ease: "easeOut" }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        <div
          className="rounded-xl p-5 border"
          style={{ background: COLORS.panel, borderColor: COLORS.panelBorder }}
        >
          <h3 className="text-lg font-semibold mt-0 mb-1">{step.title}</h3>
          <p className="text-xs mb-3" style={{ color: COLORS.accent }}>
            {step.subtitle}
          </p>
          <p
            className="text-sm leading-relaxed m-0"
            style={{ color: COLORS.textDim }}
          >
            {step.detail}
          </p>
        </div>
        <div
          className="rounded-xl p-5 border"
          style={{
            background: COLORS.dangerDim,
            borderColor: hexWithAlpha(COLORS.danger, 0.2),
          }}
        >
          <h3
            className="text-sm font-bold mt-0 mb-2"
            style={{ color: COLORS.danger }}
          >
            This mutation — {variant.cNotation}
          </h3>
          <p className="text-sm leading-relaxed m-0">{step.mutationNote}</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
