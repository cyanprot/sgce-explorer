/**
 * ImprintingPanel — Genomic imprinting visualization
 *
 * Shows maternal vs paternal allele, CpG methylation, ICR mechanism,
 * and why paternal mutation = complete loss of function.
 */
import { useState } from "react";
import { COLORS, MUTATION } from "@/constants/protein-data";
import { ToggleButton } from "./ui/ToggleButton";
import { InfoCard } from "./ui/InfoCard";
import type { AlleleHighlight } from "@/types";

export function ImprintingPanel() {
  const [highlight, setHighlight] = useState<AlleleHighlight>("both");

  return (
    <div className="p-6">
      <div className="flex gap-2 mb-5">
        <ToggleButton active={highlight === "both"} onClick={() => setHighlight("both")} label="Both alleles" color={COLORS.accent} />
        <ToggleButton active={highlight === "paternal"} onClick={() => setHighlight("paternal")} label="Paternal (active)" color={COLORS.active} />
        <ToggleButton active={highlight === "maternal"} onClick={() => setHighlight("maternal")} label="Maternal (silenced)" color={COLORS.silenced} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: SVG diagram */}
        <div className="rounded-xl p-5 border" style={{ background: COLORS.panel, borderColor: COLORS.panelBorder }}>
          <svg
            viewBox="0 0 500 480"
            style={{ width: "100%" }}
            role="img"
            aria-label="SGCE genomic imprinting diagram at 7q21.3 showing paternal allele (active, carries mutation) and maternal allele (silenced by CpG methylation), resulting in complete loss of ε-sarcoglycan function"
          >
            <text x={250} y={20} textAnchor="middle" fontSize={14} fill={COLORS.text} fontWeight={700}>
              SGCE Genomic Imprinting at 7q21.3
            </text>

            {/* Paternal allele */}
            <g data-testid="paternal-allele" opacity={highlight === "maternal" ? 0.2 : 1}>
              <text x={20} y={55} fontSize={12} fill={COLORS.active} fontWeight={700}>PATERNAL ALLELE (active)</text>
              <rect x={20} y={65} width={460} height={55} rx={8} fill={COLORS.active} opacity={0.05} stroke={COLORS.active} strokeWidth={1} />
              <rect x={150} y={75} width={120} height={16} rx={4} fill="transparent" stroke={COLORS.active} strokeWidth={1} />
              <text x={210} y={87} textAnchor="middle" fontSize={8} fill={COLORS.active}>CpG island (unmethylated)</text>
              {[0,1,2,3,4,5].map(i => (
                <circle key={i} cx={160 + i * 20} cy={100} r={4} fill="none" stroke={COLORS.active} strokeWidth={1.5} />
              ))}
              <rect x={30} y={75} width={80} height={16} rx={4} fill={COLORS.active} opacity={0.3} />
              <text x={70} y={87} textAnchor="middle" fontSize={9} fill={COLORS.active} fontWeight={600}>← PEG10</text>
              <rect x={290} y={75} width={180} height={16} rx={4} fill={COLORS.danger} opacity={0.4} stroke={COLORS.danger} strokeWidth={1} />
              <text x={380} y={87} textAnchor="middle" fontSize={9} fill={COLORS.danger} fontWeight={700}>SGCE →</text>
              <text x={380} y={110} textAnchor="middle" fontSize={8} fill={COLORS.danger}>★ {MUTATION.cNotation} HERE</text>
              <text x={30} y={128} fontSize={8} fill={COLORS.textDim}>
                <tspan fill={COLORS.active}>H3K4me2</tspan> · <tspan fill={COLORS.active}>H3K9ac</tspan> → transcriptionally active
              </text>
              <text x={420} y={128} fontSize={16} fill={COLORS.active}>▶</text>
              <text x={440} y={128} fontSize={8} fill={COLORS.active}>ON</text>
            </g>

            {/* Maternal allele */}
            <g data-testid="maternal-allele" opacity={highlight === "paternal" ? 0.2 : 1}>
              <text x={20} y={170} fontSize={12} fill={COLORS.silenced} fontWeight={700}>MATERNAL ALLELE (silenced)</text>
              <rect x={20} y={180} width={460} height={55} rx={8} fill={COLORS.silenced} opacity={0.05} stroke={COLORS.silenced} strokeWidth={1} />
              <rect x={150} y={190} width={120} height={16} rx={4} fill={COLORS.methylation} opacity={0.15} stroke={COLORS.methylation} strokeWidth={1} />
              <text x={210} y={202} textAnchor="middle" fontSize={8} fill={COLORS.methylation}>CpG island (METHYLATED)</text>
              {[0,1,2,3,4,5].map(i => (
                <g key={i}>
                  <circle cx={160 + i * 20} cy={215} r={4} fill={COLORS.methylation} opacity={0.7} />
                  <text x={160 + i * 20} y={218} textAnchor="middle" fontSize={5} fill={COLORS.text} fontWeight={700}>Me</text>
                </g>
              ))}
              <rect x={30} y={190} width={80} height={16} rx={4} fill={COLORS.silenced} opacity={0.2} />
              <text x={70} y={202} textAnchor="middle" fontSize={9} fill={COLORS.silenced}>← PEG10</text>
              <rect x={290} y={190} width={180} height={16} rx={4} fill={COLORS.silenced} opacity={0.2} />
              <text x={380} y={202} textAnchor="middle" fontSize={9} fill={COLORS.silenced}>SGCE →</text>
              <text x={380} y={224} textAnchor="middle" fontSize={8} fill={COLORS.silenced}>(WT but permanently silenced)</text>
              <text x={30} y={243} fontSize={8} fill={COLORS.textDim}>
                <tspan fill={COLORS.methylation}>H3K9me3</tspan> · <tspan fill={COLORS.methylation}>H4K20me3</tspan> → transcriptionally silent
              </text>
              <text x={420} y={243} fontSize={16} fill={COLORS.silenced}>⊘</text>
              <text x={440} y={243} fontSize={8} fill={COLORS.silenced}>OFF</text>
            </g>

            {/* Consequence flow */}
            <line x1={20} y1={270} x2={480} y2={270} stroke={COLORS.panelBorder} strokeWidth={1} />
            <text x={250} y={295} textAnchor="middle" fontSize={13} fill={COLORS.text} fontWeight={700}>Consequence for Patient</text>

            {/* Paternal path */}
            <rect x={30} y={310} width={130} height={45} rx={6} fill={COLORS.active} opacity={0.1} stroke={COLORS.active} strokeWidth={1} />
            <text x={95} y={328} textAnchor="middle" fontSize={9} fill={COLORS.active} fontWeight={600}>Paternal allele</text>
            <text x={95} y={342} textAnchor="middle" fontSize={8} fill={COLORS.danger}>{MUTATION.cNotation} mutant</text>
            <text x={180} y={335} fontSize={16} fill={COLORS.textDim}>→</text>
            <rect x={200} y={310} width={100} height={45} rx={6} fill={COLORS.danger} opacity={0.1} stroke={COLORS.danger} strokeWidth={1} />
            <text x={250} y={328} textAnchor="middle" fontSize={9} fill={COLORS.danger} fontWeight={600}>Frameshift</text>
            <text x={250} y={342} textAnchor="middle" fontSize={8} fill={COLORS.danger}>PTC → NMD</text>
            <text x={318} y={335} fontSize={16} fill={COLORS.textDim}>→</text>
            <rect x={340} y={310} width={130} height={45} rx={6} fill={COLORS.danger} opacity={0.15} stroke={COLORS.danger} strokeWidth={2} />
            <text x={405} y={328} textAnchor="middle" fontSize={9} fill={COLORS.danger} fontWeight={700}>NO ε-SG protein</text>
            <text x={405} y={342} textAnchor="middle" fontSize={8} fill={COLORS.danger}>complete LoF</text>

            {/* Maternal path */}
            <rect x={30} y={370} width={130} height={45} rx={6} fill={COLORS.silenced} opacity={0.1} stroke={COLORS.silenced} strokeWidth={1} />
            <text x={95} y={388} textAnchor="middle" fontSize={9} fill={COLORS.silenced} fontWeight={600}>Maternal allele</text>
            <text x={95} y={402} textAnchor="middle" fontSize={8} fill={COLORS.silenced}>WT sequence</text>
            <text x={180} y={395} fontSize={16} fill={COLORS.textDim}>→</text>
            <rect x={200} y={370} width={100} height={45} rx={6} fill={COLORS.silenced} opacity={0.1} stroke={COLORS.silenced} strokeWidth={1} />
            <text x={250} y={388} textAnchor="middle" fontSize={9} fill={COLORS.silenced} fontWeight={600}>Imprinted</text>
            <text x={250} y={402} textAnchor="middle" fontSize={8} fill={COLORS.silenced}>CpG methylated</text>
            <text x={318} y={395} fontSize={16} fill={COLORS.textDim}>→</text>
            <rect x={340} y={370} width={130} height={45} rx={6} fill={COLORS.silenced} opacity={0.1} stroke={COLORS.silenced} strokeWidth={1} />
            <text x={405} y={388} textAnchor="middle" fontSize={9} fill={COLORS.silenced} fontWeight={600}>NOT expressed</text>
            <text x={405} y={402} textAnchor="middle" fontSize={8} fill={COLORS.silenced}>silent backup</text>

            <text x={250} y={445} textAnchor="middle" fontSize={11} fill={COLORS.warn} fontWeight={700}>
              Not haploinsufficiency — COMPLETE loss of function
            </text>
            <text x={250} y={465} textAnchor="middle" fontSize={10} fill={COLORS.success}>
              Gene replacement therapy bypasses both: deliver functional cDNA via AAV
            </text>
          </svg>
        </div>

        {/* Right: Info cards */}
        <div className="flex flex-col gap-4">
          <InfoCard
            title="Imprinting Control Region (ICR)"
            items={[
              "PEG10 and SGCE share a single CpG island at their divergent promoters (<100bp apart)",
              "Maternal germline methylation established during oogenesis",
              "ICR acts as CTCF boundary — regulates chromatin domain organization",
              "Methylation maintained through somatic divisions by DNMT1",
            ]}
          />
          <InfoCard
            title="Why this is NOT haploinsufficiency"
            items={[
              "Most autosomal genes: 2 active copies → losing 1 = 50% expression",
              "SGCE: imprinted → only 1 active copy (paternal) at baseline",
              "Paternal copy: c.108dup → NMD → no protein",
              "Maternal copy: silenced by methylation → no transcription",
              "Result: 0/2 functional alleles = COMPLETE loss of function",
            ]}
          />
          <InfoCard
            title="Therapeutic implication"
            items={[
              "Demethylation of maternal allele: theoretically possible but risky (affects PEG10 + other imprinted genes)",
              "Gene replacement via AAV: deliver SGCE cDNA under neuron-specific promoter → bypass imprinting",
              "AAV construct: ITR — Promoter — Kozak — SGCE cDNA (~1.3kb) — WPRE — polyA — ITR",
              "~1.3kb cDNA fits well within AAV packaging limit (~4.7kb)",
            ]}
          />
        </div>
      </div>
    </div>
  );
}
