import { motion } from "framer-motion";
import { COLORS } from "@/constants/protein-data";

interface TranslationAnimationProps {
  progress: number; // 0–1
  active?: boolean;
}

const WIDTH = 680;
const HEIGHT = 140;
const MRNA_Y = 80;
const RIBOSOME_SIZE = 36;
const TOTAL_CODONS = 68; // translation stops at PTC position 68
const FRAMESHIFT_CODON = 37;

export function TranslationAnimation({
  progress,
  active = true,
}: TranslationAnimationProps) {
  if (!active) return null;

  const ribosomeX = 20 + progress * (WIDTH - 60);
  const currentCodon = Math.floor(progress * TOTAL_CODONS);
  const showFrameshift = currentCodon >= FRAMESHIFT_CODON;
  const showPTC = progress >= 1;

  // Peptide chain: one circle per ~5 codons translated
  const peptideCount = Math.floor(currentCodon / 2);
  const peptides = Array.from({ length: Math.min(peptideCount, 34) }, (_, i) => i);

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      style={{ width: "100%", maxWidth: WIDTH }}
    >
      {/* mRNA strand */}
      <g data-testid="mrna-strand">
        <line
          x1={10}
          y1={MRNA_Y}
          x2={WIDTH - 10}
          y2={MRNA_Y}
          stroke={COLORS.mrna}
          strokeWidth={4}
          strokeLinecap="round"
        />
        {/* Codon tick marks */}
        {Array.from({ length: 14 }, (_, i) => {
          const x = 20 + (i / 13) * (WIDTH - 60);
          return (
            <line
              key={i}
              x1={x}
              y1={MRNA_Y - 4}
              x2={x}
              y2={MRNA_Y + 4}
              stroke={COLORS.mrna}
              strokeWidth={1}
              opacity={0.5}
            />
          );
        })}
        {/* 5' and 3' labels */}
        <text x={4} y={MRNA_Y + 16} fontSize={9} fill={COLORS.textDim}>
          5&apos;
        </text>
        <text x={WIDTH - 16} y={MRNA_Y + 16} fontSize={9} fill={COLORS.textDim}>
          3&apos;
        </text>
      </g>

      {/* Frameshift marker */}
      {showFrameshift && (
        <g data-testid="frameshift-marker">
          <line
            x1={20 + (FRAMESHIFT_CODON / TOTAL_CODONS) * (WIDTH - 60)}
            y1={MRNA_Y - 20}
            x2={20 + (FRAMESHIFT_CODON / TOTAL_CODONS) * (WIDTH - 60)}
            y2={MRNA_Y + 12}
            stroke={COLORS.danger}
            strokeWidth={2}
            strokeDasharray="4 2"
          />
          <text
            x={20 + (FRAMESHIFT_CODON / TOTAL_CODONS) * (WIDTH - 60)}
            y={MRNA_Y - 24}
            textAnchor="middle"
            fontSize={8}
            fontWeight={700}
            fill={COLORS.danger}
          >
            FRAMESHIFT
          </text>
        </g>
      )}

      {/* PTC marker */}
      {showPTC && (
        <g data-testid="ptc-marker">
          <rect
            x={WIDTH - 50}
            y={MRNA_Y - 18}
            width={36}
            height={16}
            rx={3}
            fill={COLORS.danger}
          />
          <text
            x={WIDTH - 32}
            y={MRNA_Y - 7}
            textAnchor="middle"
            fontSize={8}
            fontWeight={700}
            fill={COLORS.text}
          >
            PTC
          </text>
        </g>
      )}

      {/* Peptide chain */}
      <g>
        {peptides.map((i) => {
          const isAberrant = i >= Math.floor(FRAMESHIFT_CODON / 2);
          return (
            <motion.circle
              key={i}
              data-testid={`peptide-${i}`}
              cx={20 + i * 12}
              cy={20}
              r={4}
              fill={isAberrant ? COLORS.danger : COLORS.accent}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: i * 0.02 }}
            />
          );
        })}
      </g>

      {/* Ribosome */}
      <motion.g
        data-testid="ribosome"
        animate={{ x: ribosomeX }}
        transition={{ duration: 0.3, ease: "linear" }}
      >
        {/* Large subunit */}
        <ellipse
          cx={0}
          cy={MRNA_Y - 18}
          rx={RIBOSOME_SIZE / 2}
          ry={RIBOSOME_SIZE / 2.5}
          fill={COLORS.ribosome}
          opacity={0.85}
        />
        {/* Small subunit */}
        <ellipse
          cx={0}
          cy={MRNA_Y + 10}
          rx={RIBOSOME_SIZE / 2.5}
          ry={RIBOSOME_SIZE / 4}
          fill={COLORS.ribosome}
          opacity={0.65}
        />
        <text
          x={0}
          y={MRNA_Y - 14}
          textAnchor="middle"
          fontSize={8}
          fontWeight={700}
          fill={COLORS.text}
        >
          80S
        </text>
      </motion.g>
    </svg>
  );
}
