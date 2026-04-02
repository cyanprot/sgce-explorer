import { AnimatePresence, motion } from "framer-motion";
import { COLORS, MUTATION } from "@/constants/protein-data";
import type { CentralDogmaStep } from "@/types";

interface StepContentProps {
  step: CentralDogmaStep;
}

export function StepContent({ step }: StepContentProps) {
  return (
    <AnimatePresence initial={false}>
      <motion.div
        key={step.title}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="grid grid-cols-2 gap-4"
      >
        <div
          className="rounded-xl p-5 border"
          style={{ background: COLORS.panel, borderColor: COLORS.panelBorder }}
        >
          <h3 className="text-base font-bold mt-0 mb-1">{step.title}</h3>
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
            borderColor: COLORS.danger + "33",
          }}
        >
          <h3
            className="text-sm font-bold mt-0 mb-2"
            style={{ color: COLORS.danger }}
          >
            Your mutation — {MUTATION.cNotation}
          </h3>
          <p className="text-sm leading-relaxed m-0">{step.mutationNote}</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
