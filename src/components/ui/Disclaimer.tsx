import { COLORS } from "@/constants/protein-data";

/**
 * Scope-and-purpose notice for the explorer.
 *
 * Written because a patient in Calgary emailed asking to enrol in "your clinic
 * trials for AAV gene replacement". Nothing on the site had said that no such
 * trial is run here — or anywhere — and several true statements added up to the
 * opposite impression: an AAV construct spec on the Imprinting tab, a Research
 * tab listing recruiting studies, and a contact call-to-action on every page.
 *
 * Deliberately inside the explorer body and styled from the hex `COLORS`
 * tokens, not the OKLCH marketing-chrome classes: per CLAUDE.md the chrome is
 * mirrored from the `arcivus` repo and must not be edited here.
 *
 * Carries no bottom margin on purpose: it is the last child of the dark
 * COLORS.bg wrapper in App.tsx, and a margin here collapses out of that wrapper
 * and leaves a strip of bare white `body` between the explorer and the Footer.
 * The trailing space is the wrapper's padding instead.
 */
export function Disclaimer() {
  return (
    <section
      className="mx-6 rounded-xl border p-4 text-xs leading-relaxed"
      style={{ background: COLORS.panel, borderColor: COLORS.panelBorder, color: COLORS.textDim }}
      aria-labelledby="disclaimer-heading"
    >
      <h2 id="disclaimer-heading" className="text-sm font-bold m-0 mb-2" style={{ color: COLORS.text }}>
        What this site is, and what it is not
      </h2>
      <ul className="m-0 pl-4 space-y-1 list-disc">
        <li>
          This is an <b style={{ color: COLORS.text }}>educational visualization</b> built by one
          individual. It is not a clinic, a laboratory service, or a diagnostic tool.
        </li>
        <li>
          <b style={{ color: COLORS.text }}>No clinical trial is run or recruited from here.</b> As
          of the last review of ClinicalTrials.gov, there is{" "}
          <b style={{ color: COLORS.text }}>no AAV gene-replacement trial for DYT-SGCE anywhere in
          the world</b>. The gene-therapy material in the Imprinting tab describes what the biology
          would permit, not a treatment that exists.
        </li>
        <li>
          The Research tab lists studies and papers pulled live from public databases
          (ClinicalTrials.gov, PubMed, UniProt, STRING). Listing a study here is not an endorsement
          and implies no affiliation with it.
        </li>
        <li>
          Variant interpretations shown here are computed from the reference transcript and public
          annotations. They are{" "}
          <b style={{ color: COLORS.text }}>not a clinical interpretation of your result</b> and can
          disagree with your laboratory report.
        </li>
        <li>
          <b style={{ color: COLORS.text }}>
            Nothing here is medical advice. Discuss your own result with a neurologist and a genetic
            counsellor
          </b>{" "}
          — they can access clinical-grade evidence and your full history, which this page cannot.
        </li>
      </ul>
    </section>
  );
}
