/**
 * CentralDogma — 7-step animated central dogma visualization
 *
 * Current: Static SVG diagrams with step navigation
 * TODO: Upgrade to framer-motion animations (see CLAUDE.md Priority 3)
 */
import { useState, useEffect, useRef } from "react";
import { COLORS, MUTATION, CENTRAL_DOGMA_STEPS } from "@/constants/protein-data";

export function CentralDogma() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setStep((s) => {
          if (s >= CENTRAL_DOGMA_STEPS.length - 1) {
            setPlaying(false);
            return s;
          }
          return s + 1;
        });
      }, 4000);
    }
    return () => clearInterval(timerRef.current);
  }, [playing]);

  const current = CENTRAL_DOGMA_STEPS[step];

  return (
    <div className="p-6">
      {/* Playback controls */}
      <div className="flex gap-2 mb-5 items-center">
        <button onClick={() => setStep(Math.max(0, step - 1))} className="px-4 py-2 rounded-md text-xs font-semibold border cursor-pointer"
          style={{ background: COLORS.panel, color: COLORS.text, borderColor: COLORS.panelBorder }}>
          ◀ Prev
        </button>
        <button onClick={() => setPlaying(!playing)} className="px-4 py-2 rounded-md text-xs font-semibold border cursor-pointer"
          style={{ background: playing ? COLORS.danger : COLORS.accent, color: "#fff", borderColor: "transparent" }}>
          {playing ? "⏸ Pause" : "▶ Play"}
        </button>
        <button onClick={() => setStep(Math.min(CENTRAL_DOGMA_STEPS.length - 1, step + 1))} className="px-4 py-2 rounded-md text-xs font-semibold border cursor-pointer"
          style={{ background: COLORS.panel, color: COLORS.text, borderColor: COLORS.panelBorder }}>
          Next ▶
        </button>
        <span className="ml-3 text-xs" style={{ color: COLORS.textDim }}>
          Step {step + 1} / {CENTRAL_DOGMA_STEPS.length}
        </span>
      </div>

      {/* Step progress bar */}
      <div className="rounded-xl p-5 mb-5 border" style={{ background: COLORS.panel, borderColor: COLORS.panelBorder }}>
        <svg viewBox="0 0 700 60" style={{ width: "100%", maxWidth: 700 }}>
          {CENTRAL_DOGMA_STEPS.map((_, i) => {
            const x = 30 + (i / (CENTRAL_DOGMA_STEPS.length - 1)) * 640;
            const active = i === step;
            const done = i < step;
            return (
              <g key={i} onClick={() => setStep(i)} style={{ cursor: "pointer" }}>
                {i < CENTRAL_DOGMA_STEPS.length - 1 && (
                  <line x1={x + 16} y1={30} x2={30 + ((i + 1) / (CENTRAL_DOGMA_STEPS.length - 1)) * 640 - 16} y2={30}
                    stroke={done ? COLORS.accent : COLORS.panelBorder} strokeWidth={2} />
                )}
                <circle cx={x} cy={30} r={active ? 14 : 10}
                  fill={active ? COLORS.accent : done ? COLORS.accentDim : COLORS.panel}
                  stroke={active ? COLORS.accent : done ? COLORS.accent : COLORS.panelBorder} strokeWidth={2} />
                <text x={x} y={34} textAnchor="middle" fontSize={10} fontWeight={700}
                  fill={active || done ? "#fff" : COLORS.textDim}>{i + 1}</text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl p-5 border" style={{ background: COLORS.panel, borderColor: COLORS.panelBorder }}>
          <h3 className="text-base font-bold mt-0 mb-1">{current.title}</h3>
          <p className="text-xs mb-3" style={{ color: COLORS.accent }}>{current.subtitle}</p>
          <p className="text-sm leading-relaxed m-0" style={{ color: COLORS.textDim }}>{current.detail}</p>
        </div>
        <div className="rounded-xl p-5 border" style={{ background: COLORS.dangerDim, borderColor: COLORS.danger + "33" }}>
          <h3 className="text-sm font-bold mt-0 mb-2" style={{ color: COLORS.danger }}>
            Your mutation — {MUTATION.cNotation}
          </h3>
          <p className="text-sm leading-relaxed m-0">{current.mutationNote}</p>
        </div>
      </div>
    </div>
  );
}
