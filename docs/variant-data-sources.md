# SGCE Variant Data Sources (research pipeline)

Systematic, **no-auth REST** pipeline for gathering all known SGCE variants.
No MCP servers, no API keys, no per-session token cost. Every source below was
verified live against SGCE / UniProt O43556.

> Scope: this backs the "all known variants" feature. The shipped app fetches at
> runtime (matching the existing hook pattern) or bakes a snapshot at build time.
> Either way, sources here are the single provenance record.

Verified: 2026-07-15. Re-check counts before shipping a snapshot.

---

## 1. PRIMARY — UniProt Proteins API (protein-coordinate variants)

The backbone. Protein-level variants already keyed to residue position, so they
map directly onto the sequence track (`SequenceViewer`), the 3D structure
(`ProteinStructure3D`), and existing `getDomainForPosition`.

```
GET https://www.ebi.ac.uk/proteins/api/variation/O43556
Accept: application/json
```

- **611** variant features (2026-07-15).
- Clinical significance: 105 Pathogenic, 14 Likely pathogenic, 270 VUS,
  13 Likely benign, 2 Benign, 207 unclassified.
- Consequence: 511 missense, 60 frameshift, 37 stop-gained, 2 insertion,
  1 inframe-deletion. (Patient's c.108dup frameshift lives in the frameshift set.)
- 603/611 carry `genomicLocation`.

Per-feature fields worth modeling:

| Field | Use |
|-------|-----|
| `begin` / `end` | residue position -> domain, sequence cell, 3D residue |
| `wildType` / `mutatedType` / `alternativeSequence` | substitution label |
| `consequenceType` | missense / frameshift / stop_gained / ... |
| `clinicalSignificances[].type` | color / filter by pathogenicity |
| `clinicalSignificances[].sources` | ClinVar / Ensembl / ExAC provenance |
| `genomicLocation` | genomic HGVS, cross-ref to ClinVar |
| `codon` | codon context for the central-dogma view |
| `xrefs` | ClinVar / dbSNP (rsID) deep-links |
| `descriptions` | free-text annotations |

## 2. CROSS-CHECK — NCBI ClinVar (E-utilities)

Genomic-level truth + submitter review status. Use to reconcile counts and pull
clinical detail UniProt doesn't carry.

```
# count
GET https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=clinvar&term=SGCE[gene]&retmax=0
# ids -> esummary for star rating, condition, review status
GET .../esummary.fcgi?db=clinvar&id=<id,id,...>&retmode=json
```

- **795** ClinVar records for `SGCE[gene]` (2026-07-15).
- Add `&api_key=<NCBI key>` only if rate-limited (3 req/s anon -> 10 req/s). Not required.

## 3. DISEASE CONTEXT — Open Targets Platform (GraphQL)

Gene -> disease association scores, for the disease-context / therapy narrative.
SGCE Ensembl ID: `ENSG00000127990`.

```
POST https://api.platform.opentargets.org/api/v4/graphql
Content-Type: application/json
{"query":"{ target(ensemblId:\"ENSG00000127990\"){ approvedSymbol associatedDiseases(page:{index:0,size:5}){ count rows{ score disease{ id name } } } } }"}
```

- Top association: myoclonus-dystonia syndrome (MONDO_0000903), score 0.757.
- 1392 total disease associations.

## 4. Already wired in-app (do not duplicate)

| Hook | Source |
|------|--------|
| `useUniProt` | UniProt entry (O43556) annotations |
| `usePubMed` | PubMed E-utilities (SGCE / DYT11 literature) |
| `useClinicalTrials` | ClinicalTrials.gov v2 |
| `useStringDB` | STRING interactions |
| `useProteinData` | AlphaFold PDB (AF-O43556-F1) |

---

## Recommended strategy

1. **Source of record = UniProt variation (#1).** One call, protein coordinates,
   significance + provenance included. Reuse `getDomainForPosition` for domain mapping.
2. **Enrich pathogenic/likely-pathogenic subset from ClinVar (#2)** for review
   stars + condition names (higher trust than UniProt's aggregated significance).
3. **Open Targets (#3)** only for the disease-context panel, not per-variant.
4. Snapshot to a versioned JSON at build time (mirror `npm run fetch-pdb`) so the
   app has no hard runtime dependency on three external APIs on first paint;
   optionally refresh live behind a cache. Decide with the multi-variant data-model.

## Quick verification recipes

```bash
# variant count + significance histogram (primary)
curl -s "https://www.ebi.ac.uk/proteins/api/variation/O43556" -H "Accept: application/json" \
  | python3 -c "import sys,json,collections;d=json.load(sys.stdin);f=d['features'];c=collections.Counter();[c.update([ (s.get('type')) for s in (x.get('clinicalSignificances') or [{'type':'(none)'}]) ]) for x in f];print(len(f),'variants');[print(v,k) for k,v in c.most_common()]"

# ClinVar record count
curl -s "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=clinvar&term=SGCE%5Bgene%5D&retmax=0" | grep -oE "<Count>[0-9]+</Count>"
```
