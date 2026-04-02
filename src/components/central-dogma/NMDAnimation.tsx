import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { COLORS } from "@/constants/protein-data";
import { NMD_SUB_STEPS } from "@/constants/codon-data";

interface NMDAnimationProps {
  active: boolean;
  onComplete: () => void;
}

const WIDTH = 680;
const HEIGHT = 160;
const MRNA_Y = 80;
const SUB_STEP_DURATION = 1500;

// EJC positions (downstream exon-exon junctions)
const EJC_POSITIONS = [0.3, 0.45, 0.55, 0.65, 0.75, 0.85];

export function NMDAnimation({ active, onComplete }: NMDAnimationProps) {
  const [subStep, setSubStep] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!active) return;

    setSubStep(0);
    timerRef.current = setInterval(() => {
      setSubStep((s) => {
        if (s >= NMD_SUB_STEPS.length - 1) {
          clearInterval(timerRef.current);
          onComplete();
          return s;
        }
        return s + 1;
      });
    }, SUB_STEP_DURATION);

    return () => clearInterval(timerRef.current);
  }, [active, onComplete]);

  if (!active) return null;

  const showUPF1 = subStep >= 1;
  const showDegradation = subStep >= 3;
  const currentLabel = NMD_SUB_STEPS[subStep]?.label ?? "";

  return (
    <div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={{ width: "100%", maxWidth: WIDTH }}
      >
        {/* mRNA strand */}
        <g data-testid="nmd-mrna">
          {showDegradation ? (
            // Fragmented mRNA
            <>
              {[0, 0.2, 0.4, 0.6, 0.8].map((offset, i) => (
                <motion.line
                  key={i}
                  x1={10 + offset * (WIDTH - 20)}
                  y1={MRNA_Y}
                  x2={10 + offset * (WIDTH - 20) + 80}
                  y2={MRNA_Y}
                  stroke={COLORS.mrna}
                  strokeWidth={4}
                  strokeLinecap="round"
                  initial={{ opacity: 1, y: 0 }}
                  animate={{
                    opacity: 0,
                    y: 10 + Math.random() * 20,
                  }}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.1,
                    ease: "easeOut",
                  }}
                />
              ))}
            </>
          ) : (
            <line
              x1={10}
              y1={MRNA_Y}
              x2={WIDTH - 10}
              y2={MRNA_Y}
              stroke={COLORS.mrna}
              strokeWidth={4}
              strokeLinecap="round"
            />
          )}

          {/* PTC marker */}
          <rect
            x={20}
            y={MRNA_Y - 14}
            width={30}
            height={12}
            rx={3}
            fill={COLORS.danger}
          />
          <text
            x={35}
            y={MRNA_Y - 5}
            textAnchor="middle"
            fontSize={7}
            fontWeight={700}
            fill="#fff"
          >
            PTC
          </text>

          {/* EJC markers */}
          {EJC_POSITIONS.map((pos, i) => (
            <g key={i} data-testid={`ejc-${i}`}>
              <circle
                cx={10 + pos * (WIDTH - 20)}
                cy={MRNA_Y - 16}
                r={8}
                fill={COLORS.warn}
                opacity={0.8}
              />
              <text
                x={10 + pos * (WIDTH - 20)}
                y={MRNA_Y - 13}
                textAnchor="middle"
                fontSize={6}
                fontWeight={700}
                fill="#000"
              >
                EJC
              </text>
            </g>
          ))}
        </g>

        {/* UPF1 protein */}
        {showUPF1 && (
          <motion.g
            data-testid="upf1"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 120, damping: 15 }}
          >
            <ellipse
              cx={80}
              cy={MRNA_Y - 36}
              rx={22}
              ry={14}
              fill={COLORS.accent}
              opacity={0.9}
            />
            <text
              x={80}
              y={MRNA_Y - 33}
              textAnchor="middle"
              fontSize={8}
              fontWeight={700}
              fill="#fff"
            >
              UPF1
            </text>
          </motion.g>
        )}
      </svg>

      {/* Sub-step label */}
      <div className="text-center mt-2">
        <motion.span
          key={subStep}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs font-semibold px-3 py-1 rounded-full inline-block"
          style={{ background: COLORS.accentDim, color: COLORS.accent }}
        >
          {currentLabel}
        </motion.span>
      </div>
    </div>
  );
}
