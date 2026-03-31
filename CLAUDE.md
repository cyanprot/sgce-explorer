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
├── constants/
│   └── protein-data.ts         # Domain boundaries, mutation, colors, sequences
├── types/
│   └── index.ts                # Shared TypeScript interfaces
├── hooks/
│   └── useProteinData.ts       # AlphaFold PDB fetch + parse hook
├── components/
│   ├── ProteinStructure3D.tsx  # 3Dmol.js protein viewer (AlphaFold PDB, WT vs Mutant)
│   ├── CentralDogma.tsx        # 7-step central dogma animation
│   ├── ImprintingPanel.tsx     # Imprinting mechanism visualization
│   ├── SequenceViewer.tsx      # Linear sequence track (TODO)
│   └── ui/
│       ├── ToggleButton.tsx    # Shared toggle button
│       └── InfoCard.tsx        # Shared info card
└── data/                       # PDB files (gitignored)
```

## Improvement Roadmap (for Claude Code)

### Priority 1: Real Structure Data
- [x] Replace procedural Three.js curves with actual AlphaFold PDB coordinates
- [x] Use 3Dmol.js `$3Dmol.createViewer()` to render ribbon/cartoon/surface views
- [x] Color by domain (extracellular blue, TM amber, cytoplasmic purple)
- [x] Highlight mutation site (Val37) and glycosylation (Asn200) as spheres
- [x] Add WT vs Mutant toggle: show full structure vs truncated (residues 1-68 only)
- [ ] Linked click: click residue in 3D → highlight in sequence viewer (deferred to Priority 2)

### Priority 2: Sequence Viewer
- [ ] Linear amino acid sequence track below 3D viewer
- [ ] Color-coded by domain, scrollable
- [ ] Mutation annotation overlay (position 37 frameshift, position 68 PTC)
- [ ] Click interaction linked to 3D model rotation/zoom
- [ ] Show conservation scores if available (ConSurf data)

### Priority 3: Central Dogma Animation
- [ ] Upgrade from static SVG to animated (framer-motion)
- [ ] Ribosome translation animation: mRNA scanning, tRNA delivery, peptide bond
- [ ] Show actual codon sequence around mutation site
- [ ] NMD pathway: animate UPF1 recruitment, mRNA degradation
- [ ] Add audio narration option (Web Speech API)

### Priority 4: External Data Integration
- [ ] PubMed API: fetch latest SGCE/DYT11 papers, show in sidebar
- [ ] ClinicalTrials API: show active DYT-SGCE trials
- [ ] ChEMBL API: target pharmacology for sarcoglycan complex
- [ ] UniProt REST API: live protein annotations
- [ ] STRING DB: protein-protein interaction network for DGC

### Priority 5: Deployment
- [x] Cloudflare Tunnel deployment (arcivus.northprot.com → localhost:3000)
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
- **Live URL**: https://arcivus.northprot.com
- **Method**: Cloudflare Tunnel → localhost:3000
- **Domain**: northprot.com (Cloudflare DNS), subdomain `arcivus`
- Run `npm run dev` on host, Cloudflare Tunnel routes traffic to port 3000

## Notes
- The protein amino acid sequence is in `src/constants/protein-data.ts`
- All scientific claims must cite UniProt O43556 or published literature
- Brain-specific isoform (exon 11b) is relevant for therapeutic targeting
- AAV gene therapy construct: ITR—Promoter—Kozak—SGCE cDNA(~1.3kb)—WPRE—polyA—ITR
