/**
 * CentralDogma — 7-step animated central dogma visualization
 *
 * Orchestrator composing sub-components:
 * - ProgressBar: animated step indicators
 * - StepContent: info cards with AnimatePresence transitions
 * - CodonViewer: WT/mutant codon comparison (steps 4-6)
 * - TranslationAnimation: ribosome scanning mRNA (step 5)
 * - NMDAnimation: UPF1 recruitment + mRNA degradation (step 6)
 * - AudioNarration: Web Speech API toggle
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { COLORS, CENTRAL_DOGMA_STEPS } from "@/constants/protein-data";
import { ProgressBar } from "./central-dogma/ProgressBar";
import { StepContent } from "./central-dogma/StepContent";
import { CodonViewer } from "./central-dogma/CodonViewer";
import { TranslationAnimation } from "./central-dogma/TranslationAnimation";
import { NMDAnimation } from "./central-dogma/NMDAnimation";
import { AudioNarration } from "./central-dogma/AudioNarration";

// Adaptive durations per step (ms)
const STEP_DURATIONS = [4000, 4000, 4000, 4000, 8000, 8000, 4000];

export function CentralDogma() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [translationProgress, setTranslationProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const animFrameRef = useRef<number>();

  // Schedule next autoplay step
  const scheduleNext = useCallback((currentStep: number) => {
    if (currentStep >= CENTRAL_DOGMA_STEPS.length - 1) {
      setPlaying(false);
      return;
    }
    timerRef.current = setTimeout(() => {
      setStep((s) => s + 1);
    }, STEP_DURATIONS[currentStep]);
  }, []);

  useEffect(() => {
    if (playing) {
      scheduleNext(step);
    }
    return () => clearTimeout(timerRef.current);
  }, [playing, step, scheduleNext]);

  // Translation animation progress (step 4 = ribosome translation)
  useEffect(() => {
    if (step !== 4) {
      setTranslationProgress(0);
      return;
    }
    const duration = 6000;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const p = Math.min(elapsed / duration, 1);
      setTranslationProgress(p);
      if (p < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [step]);

  const handleNMDComplete = useCallback(() => {
    // NMD animation finished — if autoplay, advance
    if (playing) {
      setStep((s) => Math.min(s + 1, CENTRAL_DOGMA_STEPS.length - 1));
    }
  }, [playing]);

  const current = CENTRAL_DOGMA_STEPS[step];

  return (
    <div className="p-6">
      {/* Playback controls */}
      <div className="flex gap-2 mb-5 items-center">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          className="px-4 py-2 rounded-md text-xs font-semibold border cursor-pointer"
          style={{
            background: COLORS.panel,
            color: COLORS.text,
            borderColor: COLORS.panelBorder,
          }}
        >
          ◀ Prev
        </button>
        <button
          onClick={() => setPlaying(!playing)}
          className="px-4 py-2 rounded-md text-xs font-semibold border cursor-pointer"
          style={{
            background: playing ? COLORS.danger : COLORS.accent,
            color: "#fff",
            borderColor: "transparent",
          }}
        >
          {playing ? "⏸ Pause" : "▶ Play"}
        </button>
        <button
          onClick={() =>
            setStep(Math.min(CENTRAL_DOGMA_STEPS.length - 1, step + 1))
          }
          className="px-4 py-2 rounded-md text-xs font-semibold border cursor-pointer"
          style={{
            background: COLORS.panel,
            color: COLORS.text,
            borderColor: COLORS.panelBorder,
          }}
        >
          Next ▶
        </button>
        <span className="ml-3 text-xs" style={{ color: COLORS.textDim }}>
          Step {step + 1} / {CENTRAL_DOGMA_STEPS.length}
        </span>
        <div className="ml-auto">
          <AudioNarration stepIndex={step} />
        </div>
      </div>

      {/* Step progress bar */}
      <div
        className="rounded-xl p-5 mb-5 border"
        style={{ background: COLORS.panel, borderColor: COLORS.panelBorder }}
      >
        <ProgressBar activeStep={step} onStepClick={setStep} />
      </div>

      {/* Codon viewer (visible at steps 4-6: translation, NMD, result) */}
      {step >= 3 && step <= 5 && (
        <div className="mb-5">
          <CodonViewer />
        </div>
      )}

      {/* Translation animation (step 5) */}
      {step === 4 && (
        <div
          className="rounded-xl p-5 mb-5 border"
          style={{
            background: COLORS.panel,
            borderColor: COLORS.panelBorder,
          }}
        >
          <TranslationAnimation progress={translationProgress} />
        </div>
      )}

      {/* NMD animation (step 6) */}
      {step === 5 && (
        <div
          className="rounded-xl p-5 mb-5 border"
          style={{
            background: COLORS.panel,
            borderColor: COLORS.panelBorder,
          }}
        >
          <NMDAnimation active={step === 5} onComplete={handleNMDComplete} />
        </div>
      )}

      {/* Info cards */}
      <StepContent step={current} />
    </div>
  );
}
