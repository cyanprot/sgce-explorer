import { useMemo } from "react";
import type { Variant } from "@/types";
import { COLORS } from "@/constants/protein-data";
import { hexWithAlpha } from "@/utils/hexWithAlpha";
import { getDomainForPosition } from "@/utils/getDomainForPosition";
import { deriveConsequence } from "@/constants/codon-data";
import { SIG_COLOR, SIG_LABEL, CONSEQUENCE_LABEL } from "@/constants/variant-display";

interface VariantDetailProps {
  variant: Variant;
  onViewStructure?: () => void;
  onReset?: () => void;
}

function xrefLink(xref: string): { label: string; href?: string } {
  const [db, id] = xref.split(/:(.+)/);
  if (db === "dbSNP") return { label: `dbSNP ${id}`, href: `https://www.ncbi.nlm.nih.gov/snp/${id}` };
  if (db === "ClinVar")
    return { label: `ClinVar ${id}`, href: `https://www.ncbi.nlm.nih.gov/clinvar/?term=${encodeURIComponent(id)}` };
  if (db === "ClinGen")
    return {
      label: `ClinGen ${id}`,
      href: `https://reg.clinicalgenome.org/redmine/projects/registry/genboree_registry/by_caid?caid=${id}`,
    };
  return { label: xref };
}

export function VariantDetail({ variant, onViewStructure, onReset }: VariantDetailProps) {
  const consequence = useMemo(() => deriveConsequence(variant), [variant]);
  const domain = getDomainForPosition(variant.aaPosition);
  const sig = SIG_COLOR[variant.significance];

  return (
    <div
      className="rounded-xl border p-4 my-3"
      style={{ background: COLORS.panel, borderColor: variant.isPatient ? COLORS.danger : COLORS.panelBorder }}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
        <span className="font-mono text-base font-bold" style={{ color: COLORS.accent }}>
          {variant.notation}
        </span>
        {variant.cNotation && (
          <span className="font-mono text-xs" style={{ color: COLORS.textDim }}>{variant.cNotation}</span>
        )}
        <span
          className="text-[11px] font-semibold px-2 py-0.5 rounded"
          style={{ background: hexWithAlpha(sig, 0.18), color: sig }}
        >
          {SIG_LABEL[variant.significance]}
        </span>
        {variant.isPatient && (
          <span className="text-[11px] font-bold" style={{ color: COLORS.danger }}>★ patient index variant</span>
        )}
        <span className="ml-auto flex gap-2">
          {onViewStructure && (
            <button onClick={onViewStructure} className="text-xs font-semibold px-2 py-1 rounded" style={{ background: COLORS.accent, color: COLORS.bg }}>
              View in 3D →
            </button>
          )}
          {onReset && !variant.isPatient && (
            <button onClick={onReset} className="text-xs px-2 py-1 rounded border" style={{ color: COLORS.textDim, borderColor: COLORS.panelBorder }}>
              Reset to patient
            </button>
          )}
        </span>
      </div>

      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <Field label="Consequence" value={CONSEQUENCE_LABEL[variant.consequence]} />
        <Field label="Residue" value={`${variant.wildType || "?"}${variant.aaPosition}${variant.mutatedType || ""}`} />
        <Field label="Domain" value={domain ? domain.label : "—"} valueColor={domain?.color} />
        <Field label="Exon" value={variant.exon ? `exon ${variant.exon}` : "—"} />
      </dl>

      {/* Derived consequence */}
      <div className="mt-3 pt-3 border-t text-xs" style={{ borderColor: COLORS.panelBorder, color: COLORS.textDim }}>
        {consequence.truncated ? (
          <p>
            Premature stop at codon <b style={{ color: COLORS.danger }}>{consequence.ptcPosition}</b> →
            truncated product <b style={{ color: COLORS.text }}>{consequence.truncatedLength} aa</b>{" "}
            ({(consequence.fractionOfWT * 100).toFixed(1)}% of WT).{" "}
            {consequence.nmdPredicted ? (
              <b style={{ color: COLORS.danger }}>NMD predicted</b>
            ) : (
              <span>Likely escapes NMD (late PTC).</span>
            )}
          </p>
        ) : variant.edit ? (
          <p>
            Single-residue change; no premature stop. Full-length product ({consequence.mutantProteinLength} aa).
          </p>
        ) : (
          <p>Browse-only entry — exact coding change not in the source feed, so the engine does not recompute it.</p>
        )}
        <p className="mt-1">
          SGCE is maternally imprinted: only the <b style={{ color: COLORS.active }}>paternal</b> allele is expressed,
          so a variant is phenotypically relevant only on that allele. SGCE shows essentially no genotype-phenotype
          correlation — pathogenic variants converge on the same loss-of-function outcome.
        </p>
      </div>

      {/* Citations */}
      {variant.xrefs && variant.xrefs.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          {variant.xrefs.map((x) => {
            const { label, href } = xrefLink(x);
            return href ? (
              <a
                key={x}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="px-1.5 py-0.5 rounded border underline"
                style={{ color: COLORS.accent, borderColor: COLORS.panelBorder }}
              >
                {label}
              </a>
            ) : (
              <span key={x} className="px-1.5 py-0.5 rounded border" style={{ color: COLORS.textDim, borderColor: COLORS.panelBorder }}>
                {label}
              </span>
            );
          })}
        </div>
      )}
      <p className="mt-2 text-[10px]" style={{ color: COLORS.textDim }}>
        Source: {variant.source || "—"}
      </p>
    </div>
  );
}

function Field({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div>
      <dt style={{ color: COLORS.textDim }}>{label}</dt>
      <dd className="font-semibold" style={{ color: valueColor || COLORS.text }}>{value}</dd>
    </div>
  );
}
