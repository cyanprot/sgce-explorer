import { useMemo } from "react";
import type { Variant } from "@/types";
import { COLORS } from "@/constants/protein-data";
import { hexWithAlpha } from "@/utils/hexWithAlpha";
import { getDomainForPosition } from "@/utils/getDomainForPosition";
import { deriveConsequence, exonForCds } from "@/constants/codon-data";
import { SIG_COLOR, SIG_LABEL, describeVariant } from "@/constants/variant-display";

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
  const facts = useMemo(() => describeVariant(variant, consequence), [variant, consequence]);
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
            <button onClick={onViewStructure} className="variant-action text-xs font-semibold px-2 py-1 rounded" style={{ background: COLORS.accent, color: COLORS.bg }}>
              View in 3D →
            </button>
          )}
          {onReset && !variant.isPatient && (
            <button onClick={onReset} className="variant-action text-xs px-2 py-1 rounded border" style={{ color: COLORS.textDim, borderColor: COLORS.panelBorder }}>
              Reset to patient
            </button>
          )}
        </span>
      </div>

      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <Field
          label="Consequence"
          value={facts.classLabel}
          note={facts.evidenceNote ?? undefined}
        />
        <Field label="Residue" value={`${variant.wildType || "?"}${variant.aaPosition}${variant.mutatedType || ""}`} />
        <Field label="Domain" value={domain ? domain.label : "—"} valueColor={domain?.color} />
        {/* `variant.exon` is the clinical (13-exon) number and is only set on the
            index variant, so this field read "—" for all 607 catalogued rows.
            Derive the transcript-model exon from the CDS coordinate for the rest,
            and say which model each number belongs to — the two do not agree. */}
        <Field
          label="Exon"
          value={
            variant.exon
              ? `exon ${variant.exon}`
              : (() => {
                  const e = exonForCds(variant.cdsPosition);
                  return e ? `exon ${e}` : "—";
                })()
          }
          note={variant.exon ? "clinical gene model" : "NM_003919.3 model"}
        />
      </dl>

      {/* Derived consequence. Three states, matching the 3D view exactly: a
          computed truncation, a computed full-length product, and "not known" —
          which is not the same as "no premature stop". */}
      <div className="mt-3 pt-3 border-t text-xs" style={{ borderColor: COLORS.panelBorder, color: COLORS.textDim }}>
        {consequence.evidence === "reported" ? (
          <p>{facts.outcome}</p>
        ) : facts.truncated ? (
          <p>
            Premature stop at codon <b style={{ color: COLORS.danger }}>{consequence.ptcPosition}</b> →
            truncated product <b style={{ color: COLORS.text }}>{consequence.truncatedLength} aa</b>{" "}
            ({consequence.fractionOfWT !== null ? (consequence.fractionOfWT * 100).toFixed(1) : "—"}% of WT).{" "}
            {consequence.nmdPredicted ? (
              <b style={{ color: COLORS.danger }}>NMD predicted</b>
            ) : (
              <span>Likely escapes NMD (late PTC).</span>
            )}
          </p>
        ) : (
          <p>{facts.outcome}</p>
        )}
        {/* Inheritance. Rendered for every variant including benign ones, so it
            must not overstate: SGCE imprinting is incomplete, and maternally
            transmitted variants show reduced — not absent — penetrance
            (Muller et al. 2002, PMID 12444570). */}
        <p className="mt-1">
          SGCE is maternally imprinted: the <b style={{ color: COLORS.active }}>paternal</b> allele is the
          predominantly expressed one, so pathogenic variants are usually symptomatic only when paternally
          inherited. Imprinting is not absolute — maternal transmission has reduced, not zero, penetrance
          (<a
            href="https://pubmed.ncbi.nlm.nih.gov/12444570/"
            target="_blank"
            rel="noreferrer"
            className="underline"
            style={{ color: COLORS.accent }}
          >
            PMID 12444570
          </a>
          ). This is general background, not an interpretation of your result:{" "}
          <b style={{ color: COLORS.text }}>discuss inheritance and recurrence risk with a genetic counsellor.</b>
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

function Field({
  label,
  value,
  valueColor,
  note,
}: {
  label: string;
  value: string;
  valueColor?: string;
  note?: string;
}) {
  return (
    <div>
      <dt style={{ color: COLORS.textDim }}>{label}</dt>
      <dd className="font-semibold" style={{ color: valueColor || COLORS.text }}>{value}</dd>
      {note && (
        <dd className="text-[10px] font-normal mt-0.5" style={{ color: COLORS.textDim }}>
          {note}
        </dd>
      )}
    </div>
  );
}
