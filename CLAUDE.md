# SGCE ε-Sarcoglycan Interactive Explorer

## Project Overview
Interactive web visualization of the SGCE (epsilon-sarcoglycan) protein for a DYT-SGCE patient.
Tech stack: Vite + React 18 + TypeScript + 3Dmol.js + Tailwind CSS.

## Patient Context
- **Diagnosis**: DYT-SGCE (Myoclonus-Dystonia)
- **Mutation**: c.108dup (p.Val37SerfsTer32) — 1bp duplication in exon 3
- **Inheritance**: Paternal (maternally imprinted gene → only paternal allele expressed)
- **Consequence**: Complete loss of ε-sarcoglycan function (NOT haploinsufficiency)

## Key Scientific Data (verified from UniProt O43556)

### Protein Structure
- **Total length**: 437 amino acids (49,851 Da)
- **Extracellular domain**: residues 1–317
- **Transmembrane helix**: residues 318–338 (single-pass type I)
- **Cytoplasmic tail**: residues 339–437
- **N-glycosylation**: Asn200 (confirmed by mass spec)
- **No cleavable signal peptide** (uncleaved signal anchor)
- **Gene**: SGCE, chr7q21.3, 13 exons, ~81kb genomic span

### The Mutation: c.108dup
- 1bp adenine duplication at CDS position 108 (exon 3)
- Frameshift starts at Val37 → Ser
- 31 aberrant amino acids before premature stop codon (PTC) at position 68
- Truncated product = 67/437 aa (15.3%) — entirely within extracellular domain
- Missing: transmembrane domain, cytoplasmic tail → no membrane insertion
- NMD: PTC in exon 3 with 10+ downstream EJCs → strong NMD trigger
- Any escaped protein → ER quality control → proteasomal degradation

### Genomic Imprinting
- SGCE is maternally imprinted (maternal allele SILENCED)
- Shared bidirectional CpG island promoter with PEG10 (<100bp apart, divergent transcription)
- Maternal allele: CpG methylated, H3K9me3, H4K20me3 → silent
- Paternal allele: unmethylated, H3K4me2, H3K9ac → active
- ICR = Imprinting Control Region at PEG10-SGCE promoter
- CTCF boundary regulation, maintained by DNMT1 through somatic divisions
- Patient's paternal allele carries mutation → 0/2 functional alleles = COMPLETE LoF

### DGC (Dystrophin-Glycoprotein Complex)
- ε-SG is part of the sarcoglycan subcomplex: β-SG, γ-SG, δ-SG, ε-SG
- Complex sits at neuronal membrane, anchored to dystrophin intracellularly
- ε-SG loss disrupts subcomplex assembly → impaired DGC signaling in striatum
- Brain-specific isoform includes exon 11b (pre/post-synaptic localization)

### AlphaFold Structure
- Predicted structure: AF-O43556-F1
- Fetch: `npm run fetch-pdb` → downloads to `public/data/AF-O43556-F1.pdb` (served at `/data/` in dev; `/data/` at the repo root is gitignored)
- URL: https://alphafold.ebi.ac.uk/files/AF-O43556-F1-model_v6.pdb

## Architecture

```
src/
├── main.tsx                    # Entry point
├── App.tsx                     # Tab router + layout (5 tabs: Structure, Variants, Central Dogma, Imprinting, Research) + URL deep-linking (?tab=&v=)
├── index.css                   # Tailwind + global styles
├── types/
│   ├── index.ts                # Shared TypeScript interfaces
│   └── research.ts             # Research API response types
├── hooks/
│   ├── useProteinData.ts       # AlphaFold PDB fetch + parse hook
│   ├── useFetchData.ts         # Generic fetch hook with caching (SWR-like)
│   ├── usePubMed.ts            # PubMed E-utilities API (SGCE/DYT11 papers)
│   ├── useClinicalTrials.ts    # ClinicalTrials.gov API v2
│   ├── useChEMBL.ts            # ChEMBL target pharmacology (disabled — no SGCE data)
│   ├── useUniProt.ts           # UniProt REST API (O43556 annotations)
│   ├── useStringDB.ts          # STRING DB protein interactions
│   ├── useDGCProteins.ts       # Brain DGC partner AlphaFold PDB fetch (β/ζ/δ-SG; ε-SG itself is loaded separately)
│   └── useVariants.ts          # Filtered view over the variant catalog (query/consequence/significance)
├── store/
│   └── variantStore.ts         # zustand: selected Variant + derived consequence (default: patient c.108dup)
├── data/
│   ├── variant-catalog.json    # Build-time snapshot: {meta, variants[]} — 607 SGCE variants (UniProt). Regen: npm run fetch-variants
│   ├── uniprot-groundtruth.fixture.json   # 16 pinned feed records where consequenceType contradicts locations
│   └── variant-catalog.invariants.test.ts # Data invariants INV-1..14 over the shipped catalog
├── constants/
│   ├── protein-data.ts         # Domains, MUTATION (a Variant), colors, sequence, DGC partners
│   ├── codon-data.ts           # Full NM_003919.3 CDS, exon map, deriveConsequence() engine, codon strips, NMD, narration
│   ├── variant-catalog.ts      # Patient-merged typed Variant[] + stats
│   └── variant-display.ts      # Significance/consequence colors + labels
├── components/
│   ├── ProteinStructure3D.tsx  # 3Dmol.js protein viewer (AlphaFold PDB, WT vs Mutant + DGC subcomplex)
│   ├── DGCLegend.tsx           # DGC subcomplex color legend
│   ├── CentralDogma.tsx        # Orchestrator: composes central-dogma/ sub-components
│   ├── ImprintingPanel.tsx     # Imprinting mechanism visualization
│   ├── ResearchPanel.tsx       # Orchestrator: composes research/ cards
│   ├── central-dogma/
│   │   ├── index.ts            # Barrel export
│   │   ├── ProgressBar.tsx     # Animated SVG step indicators (spring circles)
│   │   ├── StepContent.tsx     # AnimatePresence info cards (fade/slide)
│   │   ├── CodonViewer.tsx     # WT/mutant codon strips with frameshift/PTC markers
│   │   ├── TranslationAnimation.tsx  # Ribosome + mRNA + peptide chain (step 5)
│   │   ├── NMDAnimation.tsx    # UPF1 recruitment + mRNA degradation (step 6)
│   │   └── AudioNarration.tsx  # Web Speech API toggle
│   ├── research/
│   │   ├── index.ts            # Barrel export
│   │   ├── PubMedCard.tsx      # Latest SGCE/DYT11 publications
│   │   ├── TrialsCard.tsx      # Active clinical trials for DYT-SGCE
│   │   ├── PharmacologyCard.tsx # ChEMBL pharmacology (disabled)
│   │   ├── ProteinCard.tsx     # UniProt protein annotations
│   │   └── InteractionsCard.tsx # STRING DB interaction network
│   ├── sequence/
│   │   ├── index.ts            # Barrel export
│   │   ├── SequenceViewer.tsx  # Linear sequence track container (scrollable, 437 residues)
│   │   └── ResidueCell.tsx     # Memoized single amino acid cell
│   ├── variants/
│   │   ├── index.ts            # Barrel export
│   │   ├── VariantsPanel.tsx   # Orchestrator for the Variants tab (lollipop + filters + list + detail)
│   │   ├── LollipopMap.tsx     # Needle map of all variants along residues 1-437 (domain bands, sig color)
│   │   ├── VariantFilters.tsx  # Search + consequence + significance filters
│   │   ├── VariantList.tsx     # Filterable variant rows (sig badges, live-engine flag, capped 200)
│   │   └── VariantDetail.tsx   # Selected-variant detail: derived consequence, domain, citations
│   └── ui/
│       ├── ToggleButton.tsx    # Shared toggle button
│       └── InfoCard.tsx        # Shared info card
├── utils/
│   ├── hexToInt.ts             # Hex color string → integer
│   ├── hexWithAlpha.ts         # Hex color + alpha → rgba string
│   ├── isPdbData.ts            # PDB format validation
│   ├── translatePdb.ts         # PDB coordinate translation (DGC subcomplex positioning)
│   ├── fetchCache.ts           # In-memory fetch cache with TTL
│   └── getDomainForPosition.ts # Position (1-indexed) → domain info
└── data/                       # PDB files (gitignored)
```

## Status (as of 2026-07-23)

Multi-variant feature complete: a `Variant` model + `deriveConsequence()` engine over the full CDS drives every tab from a zustand-selected variant, with a build-time catalog of 607 known SGCE variants (UniProt) behind the Variants tab and URL deep-linking.

**2026-07-23 — correctness pass.** Triggered by a patient email asking to enrol in "your" AAV gene-replacement trial for `c.304C>T (p.Arg102*)`. That variant was in the catalog and rendered as *"Missense — no premature stop, full-length product (101 aa)"*. Root cause: UniProt's `consequenceType` contradicts its own `locations[]` HGVS on 13 of 611 features, the build script trusted the label, and `deriveConsequence()` then gated its truncation verdict on that same label — finding the stop at codon 102 and discarding it. What changed:

- **Classification now reads `locations[].loc`**, never `consequenceType` or `alternativeSequence`. Fixes 9 misclassified rows; `p.Ile289SerfsTer4` is a frameshift, not the "stop gained" the feed calls it. Parse order is load-bearing (truncating tests before `dup`/`ins`/`del`).
- **HGVS is taken from the feed, never synthesized.** Three rows shipped `c.` substitutions that exist in no database for variants that are really insertions.
- **The engine compares against the mutant's own expected stop**, not the WT stop and not the declared class. Every derived field is now `number | null`; `null` means "not known" and no longer 437 aa / 100% of WT for pathogenic frameshifts.
- **`effectiveClass(variant)` is the class the UI must use.** `Variant.consequence` was renamed `reportedConsequence` to mark it as a third party's opinion.
- **`src/data/variant-catalog.invariants.test.ts`** pins INV-1..14 over the shipped data, including agreement with a fixture of the source feed. All fourteen failed before this pass.
- Silent failures closed (research hooks now distinguish "API failed" from "none exist"; the trials card no longer filters to open-only statuses), an `ErrorBoundary` per tab, an explorer-body disclaimer, science-claim corrections with citations (brain DGC = β/ζ/δ-SG + β-DG + Dp71 per PMID 27535350; no CTCF boundary at this locus per PMID 18480470), and CI that actually runs the tests.

### Deferred

- **Code-splitting** — bundle is ~1.20 MB (316 KB gzip) since the catalog JSON ships in the main chunk; App imports it for deep-link hydration, so lazy-loading the Variants tab alone won't defer it. Revisit with a manualChunks/hydration split if size matters.
- **Browse-only variants (71)** — indel/frameshift entries whose `c.` is not a simple substitution carry no engine-ready edit by design. Making them computable means expressing them as `ins`/`del` edits (the `applyEdit` convention is documented in `codon-data.ts`) sourced from the feed's own `c.` string.
- **Stop-lost variants (2)** — dropped at build time; `ConsequenceClass` has no member for them and the UI assumes `aaPosition <= 437`.
- **Conservation scores overlay** (Priority 2) — external data dependency (ConSurf). Newly valuable for missense interpretation.
- **PWA / offline support**, **High-res PNG/SVG export** — revisit when field-use / presentations require.

## Design System

The subdomain wears the same brand chrome as `arcivus.ca/explorer`. Two color systems coexist under a strict boundary:

**Brand ownership**: the marketing chrome here (social URLs, brand colors, logo, wordmark) is **mirrored downstream from `arcivus` — that repo is the brand source of truth**. Do not originate brand changes here; edit `arcivus` first, then copy the value over. This repo is canonical only for its science/domain data (protein, PDB, e-sarcoglycan content).


| Zone | Token source | Scope | File |
|------|--------------|-------|------|
| Marketing chrome (Nav, Footer, UI primitives) | OKLCH Tailwind classes (`text-ink`, `bg-surface`, `text-action`, etc.) | `src/components/layout/**`, `src/components/ui/Logo.tsx`, `src/components/ui/SocialLinks.tsx` | `tailwind.config.js` `theme.extend.colors` |
| Explorer body (3D viewer, central dogma, imprinting, research, sequence, variants) | Hex `COLORS` via inline style | Everything else under `src/components/` | `src/constants/protein-data.ts` (+ `variant-display.ts` for significance/consequence colors) |

**Boundary rule**: never `import { COLORS }` inside the chrome zone; never use OKLCH classes (`text-ink`, etc.) inside the explorer-body zone. `src/App.tsx` keeps Nav/Footer outside the dark `COLORS.bg` wrapper, but nothing lints or tests the rule — it is a **convention held by discipline**, not an enforced boundary. Add an ESLint `no-restricted-imports` rule if it ever drifts.

**Canonical token sources** (read these before any design work — see the table above):
- Marketing chrome tokens: `tailwind.config.js` (`theme.extend.colors`, OKLCH).
- Explorer body tokens: `src/constants/protein-data.ts` (hex `COLORS`).

**Nav link model**: `Explorer` is a self-link to `/` with `aria-current="page"`; all other links point to absolute `https://arcivus.ca/<route>`. No `target="_blank"`.

**Fonts** (loaded via Google Fonts in `index.html`): Plus Jakarta Sans (display), Inter (body), JetBrains Mono (scientific notation).

**Overflow convention**: `App.tsx` publishes two `ResizeObserver`-backed CSS variables — `--app-header-h` (the in-page `<header>`) and `--app-nav-h` (the fixed brand Nav, measured by DOM query since Nav is chrome-owned and must not be edited here). Tab-panel containers read `calc(100dvh - var(--app-header-h) - var(--app-nav-h, 80px))`. The old hardcoded 80px was wrong: the Nav is 98px unscrolled and 68px scrolled, so `main` underlapped it by ~18px at scroll 0. `dvh` stays stable under mobile browser chrome. SequenceViewer and CodonViewer hide their native scrollbars via the `.no-scrollbar` utility in `src/index.css` — fade indicators already communicate scroll affordance.

## Development Commands
```bash
npm install           # Install dependencies
npm run fetch-pdb     # Download AlphaFold PDB structure
npm run fetch-variants # Rebuild the variant catalog from UniProt -> src/data/variant-catalog.json
npm run dev           # Start dev server (localhost:3000)
npm run build         # Production build
npm test              # vitest run (unit/component)
npm run test:coverage # vitest run with coverage
```

## Key Dependencies
- `3dmol`: Primary molecular visualization (AlphaFold PDB cartoon/ribbon rendering)
- `framer-motion`: Animation library for central dogma steps
- `zustand`: State management — the selected-variant store (`src/store/variantStore.ts`) drives all tabs
- `vitest` + `@testing-library/react`: Testing (414 tests across 42 files)

Note: `three`/`@react-three/*`/`recharts` were removed (unused). 3Dmol.js is the only viz lib.

## 3Dmol.js Integration Notes
- 3Dmol viewer div MUST be separate from React overlay children (causes `removeChild` DOM errors)
- Viewer creation must be deferred (rAF) to ensure container has layout dimensions
- `colorfunc` returns integer hex (`0x3b82f6`), not CSS strings — use `parseInt(hex.slice(1), 16)`
- `optimizeDeps: { include: ["3dmol"] }` required in vite.config.ts (UMD package, no ESM export)
- PDB files served from `public/data/` for local dev; `data/` is gitignored
- AlphaFold API versions change — query `https://alphafold.ebi.ac.uk/api/prediction/O43556` for latest URL

## Deployment
- **Live URL**: https://e-sarcoglycan.arcivus.ca
- **Hosting**: Vercel (static, auto-deploy on push to main)
- **DNS**: Cloudflare (A record → 76.76.21.21, DNS only — no proxy)
- **GitHub**: https://github.com/cyanprot/sgce-explorer (public, MIT)

## Notes
- The protein amino acid sequence is in `src/constants/protein-data.ts`
- All scientific claims must cite UniProt O43556 or published literature
- Brain-specific isoform (exon 11b) is relevant for therapeutic targeting
- AAV gene therapy construct: ITR—Promoter—Kozak—SGCE cDNA(~1.3kb)—WPRE—polyA—ITR
