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
- 32 aberrant amino acids before premature stop codon (PTC) at position 68
- Truncated product = 68/437 aa (15.6%) — entirely within extracellular domain
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
- Fetch: `npm run fetch-pdb` → downloads to data/AF-O43556-F1.pdb
- URL: https://alphafold.ebi.ac.uk/files/AF-O43556-F1-model_v6.pdb

## Architecture

```
src/
├── main.tsx                    # Entry point
├── App.tsx                     # Tab router + layout
├── index.css                   # Tailwind + global styles
├── types/
│   └── index.ts                # Shared TypeScript interfaces
├── hooks/
│   └── useProteinData.ts       # AlphaFold PDB fetch + parse hook
├── constants/
│   ├── protein-data.ts         # Domain boundaries, mutation, colors, sequences
│   └── codon-data.ts           # CDS sequence, WT/mutant codons, NMD sub-steps, narration scripts
├── components/
│   ├── ProteinStructure3D.tsx  # 3Dmol.js protein viewer (AlphaFold PDB, WT vs Mutant)
│   ├── CentralDogma.tsx        # Orchestrator: composes central-dogma/ sub-components
│   ├── ImprintingPanel.tsx     # Imprinting mechanism visualization
│   ├── central-dogma/
│   │   ├── index.ts            # Barrel export
│   │   ├── ProgressBar.tsx     # Animated SVG step indicators (spring circles)
│   │   ├── StepContent.tsx     # AnimatePresence info cards (fade/slide)
│   │   ├── CodonViewer.tsx     # WT/mutant codon strips with frameshift/PTC markers
│   │   ├── TranslationAnimation.tsx  # Ribosome + mRNA + peptide chain (step 5)
│   │   ├── NMDAnimation.tsx    # UPF1 recruitment + mRNA degradation (step 6)
│   │   └── AudioNarration.tsx  # Web Speech API toggle
│   ├── sequence/
│   │   ├── index.ts            # Barrel export
│   │   ├── SequenceViewer.tsx  # Linear sequence track container (scrollable, 437 residues)
│   │   └── ResidueCell.tsx     # Memoized single amino acid cell
│   └── ui/
│       ├── ToggleButton.tsx    # Shared toggle button
│       └── InfoCard.tsx        # Shared info card
├── utils/
│   ├── hexToInt.ts             # Hex color string → integer
│   ├── isPdbData.ts            # PDB format validation
│   └── getDomainForPosition.ts # Position (1-indexed) → domain info
└── data/                       # PDB files (gitignored)
```

## Improvement Roadmap (for Claude Code)

### Priority 1: Real Structure Data
- [x] Replace procedural Three.js curves with actual AlphaFold PDB coordinates
- [x] Use 3Dmol.js `$3Dmol.createViewer()` to render ribbon/cartoon/surface views
- [x] Color by domain (extracellular blue, TM amber, cytoplasmic purple)
- [x] Highlight mutation site (Val37) and glycosylation (Asn200) as spheres
- [x] Add WT vs Mutant toggle: show full structure vs truncated (residues 1-68 only)
- [x] Linked click: click residue in sequence viewer → 3D viewer zoom

### Priority 2: Sequence Viewer
- [x] Linear amino acid sequence track below 3D viewer (SequenceViewer + ResidueCell)
- [x] Color-coded by domain, scrollable (getDomainForPosition utility)
- [x] Mutation annotation overlay (position 37 frameshift, position 68 PTC, aberrant region 38-67)
- [x] Click interaction linked to 3D model zoom (selectedResidue → viewer.zoomTo)
- [ ] Show conservation scores if available (ConSurf data) — deferred, external data dependency

### Priority 3: Central Dogma Animation
- [x] Upgrade from static SVG to animated (framer-motion) — ProgressBar spring + StepContent AnimatePresence
- [x] Ribosome translation animation: 80S ribosome scanning mRNA, peptide chain growth, frameshift marker
- [x] Show actual codon sequence around mutation site (CodonViewer: WT/mutant, PTC at 68)
- [x] NMD pathway: 4-step animation (PTC recognition → UPF1 → phosphorylation → degradation)
- [x] Add audio narration option (Web Speech API) — toggle per step
- [x] Adaptive autoplay (per-step setTimeout with STEP_DURATIONS)

### Priority 4: External Data Integration
- [ ] PubMed API: fetch latest SGCE/DYT11 papers, show in sidebar
- [ ] ClinicalTrials API: show active DYT-SGCE trials
- [ ] ChEMBL API: target pharmacology for sarcoglycan complex
- [ ] UniProt REST API: live protein annotations
- [ ] STRING DB: protein-protein interaction network for DGC

### Priority 5: Deployment
- [x] Cloudflare Tunnel deployment (e-sarcoglycan.arcivus.ca → localhost:3000)
- [ ] PWA support for offline access
- [ ] Export visualizations as high-res PNG/SVG for presentations

## Development Commands
```bash
npm install           # Install dependencies
npm run fetch-pdb     # Download AlphaFold PDB structure
npm run dev           # Start dev server (localhost:3000)
npm run build         # Production build
```

## Key Dependencies
- `3dmol`: Primary molecular visualization (AlphaFold PDB cartoon/ribbon rendering)
- `@react-three/fiber` + `drei`: React Three.js bindings (currently unused, may be needed for future features)
- `framer-motion`: Animation library for central dogma steps
- `zustand`: Lightweight state management (shared viewer state)
- `recharts`: Charts for any data visualization needs

## 3Dmol.js Integration Notes
- 3Dmol viewer div MUST be separate from React overlay children (causes `removeChild` DOM errors)
- Viewer creation must be deferred (rAF) to ensure container has layout dimensions
- `colorfunc` returns integer hex (`0x3b82f6`), not CSS strings — use `parseInt(hex.slice(1), 16)`
- `optimizeDeps: { include: ["3dmol"] }` required in vite.config.ts (UMD package, no ESM export)
- PDB files served from `public/data/` for local dev; `data/` is gitignored
- AlphaFold API versions change — query `https://alphafold.ebi.ac.uk/api/prediction/O43556` for latest URL

## Deployment
- **Live URL**: https://e-sarcoglycan.arcivus.ca (custom domain)
- **Method**: Vercel (static hosting) + Cloudflare DNS (A record → 76.76.21.21, DNS only)
- **GitHub**: https://github.com/cyanprot/sgce-explorer (auto-deploy on push)

## Notes
- The protein amino acid sequence is in `src/constants/protein-data.ts`
- All scientific claims must cite UniProt O43556 or published literature
- Brain-specific isoform (exon 11b) is relevant for therapeutic targeting
- AAV gene therapy construct: ITR—Promoter—Kozak—SGCE cDNA(~1.3kb)—WPRE—polyA—ITR
