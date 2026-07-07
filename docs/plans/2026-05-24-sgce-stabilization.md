# SGCE Explorer Stabilization Implementation Plan

> **For Pi:** REQUIRED NEXT SKILL: Use `execute-flow` to implement this plan task-by-task after `plancheck-flow` passes.

**Goal:** Stabilize the SGCE Explorer starter workspace by fixing local PDB setup, WebGL lifecycle noise, research-tab semantics, design-token drift, and dependency/security hygiene without changing scientific claims or visual identity.

**Architecture:** Keep the existing Vite + React tab architecture. Make targeted changes in the smallest affected modules, preserving `src/constants/protein-data.ts` as the explorer-body source of truth and leaving `.claude/*` as legacy advisory material only. Every behavior change gets a focused regression test or a deterministic verification command before implementation.

**Tech Stack:** Vite 6, React 18, TypeScript 5.6, Tailwind CSS 3.4, 3Dmol.js, Vitest + React Testing Library, Playwright smoke checks.

---

## Ground Rules

- Run from `/home/cyan/projects/sgce-explorer`.
- Do not modify `.claude/settings*.json`; those are Claude Code/plugin-specific.
- Do not modify existing uncommitted `CLAUDE.md` unless the user explicitly requests it.
- Treat `src/constants/protein-data.ts` and tests as source of truth; treat `.claude/skills/*` as advisory checklists.
- No new libraries are introduced by this plan, so no Context7 lookup is required.
- Before committing, run the relevant unit tests plus `npm run build` for the sprint.

## Baseline Evidence

Current observed baseline before this plan:

```bash
npm run test     # 37 test files, 337 tests passing
npm run build    # passes; warns about 3Dmol eval and large bundle
npm audit --audit-level=moderate # fails: vite, postcss, lodash advisories
```

Browser smoke finding:

- Main tabs render.
- Console has repeated WebGL warnings after tab switches: `GL_INVALID_FRAMEBUFFER_OPERATION: Framebuffer is incomplete: Attachment has zero size`.

---

## Sprint 1: Local AlphaFold PDB Setup Consistency

**Feature:** Make `npm run fetch-pdb` populate the same path that Vite serves at `/data/AF-O43556-F1.pdb`.

**Files:**
- Modify: `package.json`
- Test/verify: `public/data/AF-O43556-F1.pdb` path behavior

### Task 1.1: Write a failing script-path check

**Step 1: Verify current mismatch**

Run:

```bash
node -e "const p=require('./package.json'); if(!p.scripts['fetch-pdb'].includes('public/data/AF-O43556-F1.pdb')) { console.error(p.scripts['fetch-pdb']); process.exit(1); }"
```

Expected before implementation: FAIL and prints current script using `data/AF-O43556-F1.pdb`.

**Step 2: Implement minimal package script fix**

In `package.json`, change:

```json
"fetch-pdb": "curl -o data/AF-O43556-F1.pdb https://alphafold.ebi.ac.uk/files/AF-O43556-F1-model_v6.pdb"
```

to:

```json
"fetch-pdb": "mkdir -p public/data && curl -L -o public/data/AF-O43556-F1.pdb https://alphafold.ebi.ac.uk/files/AF-O43556-F1-model_v6.pdb"
```

**Step 3: Verify script path**

Run:

```bash
node -e "const p=require('./package.json'); if(!p.scripts['fetch-pdb'].includes('public/data/AF-O43556-F1.pdb')) process.exit(1); console.log(p.scripts['fetch-pdb'])"
```

Expected: PASS and prints the `public/data` script.

**Step 4: Verify fetch command still works**

Run:

```bash
npm run fetch-pdb
node -e "const fs=require('fs'); const p='public/data/AF-O43556-F1.pdb'; const s=fs.statSync(p); if(s.size < 100000) throw new Error('PDB file too small'); console.log(s.size)"
```

Expected: downloaded PDB is >100 KB.

**Step 5: Full sprint verification**

Run:

```bash
npm run test -- src/hooks/useProteinData.test.ts src/utils/isPdbData.test.ts
npm run build
```

Expected: PASS.

**Step 6: Commit**

```bash
git add package.json
git diff --cached --stat
git commit -m "fix: align pdb fetch path with vite public assets"
```

Note: `public/data/*.pdb` is intentionally gitignored. Do not force-add the PDB unless the user explicitly approves offline bundling. Do not add `package-lock.json` unless it actually changed.

---

## Sprint 2: 3Dmol WebGL Lifecycle Stabilization

**Feature:** Stop render/spin activity before unmount and avoid resize/render operations on zero-size containers.

**Files:**
- Modify: `src/components/ProteinStructure3D.tsx`
- Test: `src/components/ProteinStructure3D.test.tsx`

### Task 2.1: Add cleanup regression test

**Step 1: Write failing test**

Add near existing lifecycle tests in `src/components/ProteinStructure3D.test.tsx`:

```ts
it("starts auto-rotate after deferred viewer creation, then stops spin before cleanup", async () => {
  const $3Dmol = await import("3dmol");
  const mockViewer = ($3Dmol as any).__mockViewer;
  mockUseProteinData.mockReturnValue({ pdbData: "HEADER mock pdb", loading: false, error: null });

  const { unmount } = render(<ProteinStructure3D />);

  await waitFor(() => expect(($3Dmol as any).createViewer).toHaveBeenCalled());
  await waitFor(() => expect(mockViewer.spin).toHaveBeenCalledWith("y", 1));
  mockViewer.spin.mockClear();
  unmount();

  expect(mockViewer.spin).toHaveBeenCalledWith(false);
});
```

**Step 2: Run failing test**

Run:

```bash
npm run test -- src/components/ProteinStructure3D.test.tsx -t "starts auto-rotate"
```

Expected before implementation: FAIL; deferred viewer creation currently means initial auto-rotate may not start, and cleanup currently nulls ref/clears DOM but does not explicitly stop spin.

### Task 2.2: Implement viewer cleanup guard

**Step 1: Track deferred viewer readiness and add safe cleanup**

In `src/components/ProteinStructure3D.tsx`, add viewer readiness state near the other state declarations:

```ts
const [viewerReady, setViewerReady] = useState(false);
```

Inside the `requestAnimationFrame` callback, after assigning `viewerRef.current = viewer;`, add:

```ts
setViewerReady(true);
```

Then update Effect 1 cleanup from:

```ts
return () => {
  cancelAnimationFrame(raf);
  viewerRef.current = null;
  if (el) {
    el.innerHTML = "";
  }
};
```

to:

```ts
return () => {
  cancelAnimationFrame(raf);
  const viewer = viewerRef.current;
  if (viewer) {
    viewer.spin(false as any);
    viewer.removeAllLabels();
    viewer.removeAllShapes();
    viewer.removeAllModels();
  }
  viewerRef.current = null;
  setViewerReady(false);
  if (el) {
    el.innerHTML = "";
  }
};
```

Finally update Effect 3 dependencies so spin control reruns after deferred viewer creation:

```ts
}, [autoRotate, pdbData, viewerReady]);
```

**Step 2: Run cleanup/auto-rotate test**

Run:

```bash
npm run test -- src/components/ProteinStructure3D.test.tsx -t "starts auto-rotate"
```

Expected: PASS.

### Task 2.3: Guard resize/render on zero-size containers

**Step 1: Write failing test**

Add to `src/components/ProteinStructure3D.test.tsx`:

```ts
it("does not call viewer.resize when observed viewer div has zero size", async () => {
  const $3Dmol = await import("3dmol");
  const mockViewer = ($3Dmol as any).__mockViewer;
  mockUseProteinData.mockReturnValue({ pdbData: "HEADER mock pdb", loading: false, error: null });

  const callbacks: ResizeObserverCallback[] = [];
  const OriginalResizeObserver = globalThis.ResizeObserver;
  class MockResizeObserver {
    constructor(cb: ResizeObserverCallback) { callbacks.push(cb); }
    observe = vi.fn();
    disconnect = vi.fn();
  }
  globalThis.ResizeObserver = MockResizeObserver as any;

  try {
    render(<ProteinStructure3D />);
    await waitFor(() => expect(($3Dmol as any).createViewer).toHaveBeenCalled());
    mockViewer.resize.mockClear();
    callbacks.at(-1)?.([{ contentRect: { width: 0, height: 0 } } as ResizeObserverEntry], {} as ResizeObserver);

    expect(mockViewer.resize).not.toHaveBeenCalled();
  } finally {
    globalThis.ResizeObserver = OriginalResizeObserver;
  }
});
```

**Step 2: Run failing test**

```bash
npm run test -- src/components/ProteinStructure3D.test.tsx -t "zero size"
```

Expected before implementation: FAIL if the resize observer calls `resize()` unconditionally.

**Step 3: Implement guard in Effect 5**

Change the ResizeObserver callback in `src/components/ProteinStructure3D.tsx` from:

```ts
const observer = new ResizeObserver(() => {
  const viewer = viewerRef.current;
  if (viewer) {
    viewer.resize();
    viewer.render();
  }
});
```

to:

```ts
const observer = new ResizeObserver((entries) => {
  const entry = entries[0];
  const width = entry?.contentRect.width ?? el.clientWidth;
  const height = entry?.contentRect.height ?? el.clientHeight;
  if (width <= 0 || height <= 0) return;

  const viewer = viewerRef.current;
  if (viewer) {
    viewer.resize();
    viewer.render();
  }
});
```

**Step 4: Run sprint tests**

```bash
npm run test -- src/components/ProteinStructure3D.test.tsx
npm run build
```

Expected: PASS.

### Task 2.4: Browser smoke check

Run dev server:

```bash
npm run dev -- --host 127.0.0.1
```

Then via Playwright/manual:

1. Open local URL.
2. Click all four tabs twice.
3. Return to `3D Structure`.
4. Check console messages.

Expected: no repeated `GL_INVALID_FRAMEBUFFER_OPERATION` warnings after tab churn. If warnings remain, inspect whether they happen only during initial zero-layout render or continuous spin after unmount.

**Commit:**

```bash
git add src/components/ProteinStructure3D.tsx src/components/ProteinStructure3D.test.tsx
git commit -m "fix: stabilize 3dmol viewer lifecycle"
```

---

## Sprint 3: Research Tab ClinicalTrials Semantics

**Feature:** Make ClinicalTrials behavior match UI copy: active/recruiting trials only, unless the user explicitly wants completed studies shown.

**Files:**
- Modify: `src/hooks/useClinicalTrials.ts`
- Test: `src/hooks/useClinicalTrials.test.ts`
- Optional docs: `README.md` only if copy changes instead of query behavior

### Task 3.1: Add URL regression test

**Step 1: Write failing test**

In `src/hooks/useClinicalTrials.test.ts`, add or update a URL assertion:

```ts
it("does not request completed clinical trials for active-trials card", async () => {
  const fetchSpy = setupFetchMock();
  vi.stubGlobal("fetch", fetchSpy);
  renderHook(() => useClinicalTrials());

  await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
  const url = fetchSpy.mock.calls[0][0] as string;

  expect(url).toContain("filter.overallStatus=RECRUITING,ACTIVE_NOT_RECRUITING,ENROLLING_BY_INVITATION");
  expect(url).not.toContain("COMPLETED");
});
```

**Step 2: Run failing test**

```bash
npm run test -- src/hooks/useClinicalTrials.test.ts -t "does not request completed"
```

Expected before implementation: FAIL because current URL includes `COMPLETED`. Also update the existing URL assertion in this file that currently expects `COMPLETED` in the status filter.

### Task 3.2: Implement URL fix

Change in `src/hooks/useClinicalTrials.ts`:

```ts
"...&filter.overallStatus=RECRUITING,ACTIVE_NOT_RECRUITING,ENROLLING_BY_INVITATION,COMPLETED&pageSize=10";
```

to:

```ts
"...&filter.overallStatus=RECRUITING,ACTIVE_NOT_RECRUITING,ENROLLING_BY_INVITATION&pageSize=10";
```

### Task 3.3: Verify research hook suite

Run:

```bash
npm run test -- src/hooks/useClinicalTrials.test.ts src/components/research/TrialsCard.test.tsx src/components/ResearchPanel.test.tsx
npm run build
```

Expected: PASS.

**Commit:**

```bash
git add src/hooks/useClinicalTrials.ts src/hooks/useClinicalTrials.test.ts
git commit -m "fix: align clinical trials query with active status copy"
```

---

## Sprint 4: Explorer Design Token Boundary Cleanup

**Feature:** Remove Tailwind color utilities from explorer-body components where they violate the documented `COLORS` boundary.

**Files:**
- Modify: `src/components/DGCLegend.tsx`
- Modify: `src/index.css`
- Test: `src/components/DGCLegend.test.tsx` and/or static grep verification

### Task 4.1: Add DGCLegend color-boundary tests

**Step 1: Write failing tests**

In `src/components/DGCLegend.test.tsx`, add tests asserting semantic inline colors rather than Tailwind utility classes:

```ts
it("uses COLORS.success for loaded state instead of Tailwind color utilities", () => {
  render(<DGCLegend partners={allPartners} showMutant={false} />);
  const loaded = screen.getByTestId("sgc-loaded-SGCB");
  expect(loaded).toHaveStyle({ color: COLORS.success });
  expect(loaded.className).not.toContain("text-emerald-400");
});

it("uses COLORS.danger for error state and mutant disruption note", () => {
  const partners = [
    makePartner({ gene: "SGCB", name: "β-Sarcoglycan", error: "HTTP 500" }),
    loaded({ gene: "SGCG", name: "γ-Sarcoglycan", color: "#a78bfa", xOffset: -10 }),
    loaded({ gene: "SGCD", name: "δ-Sarcoglycan", color: "#fb923c", xOffset: 30 }),
  ];
  render(<DGCLegend partners={partners} showMutant={true} />);
  const error = screen.getByTestId("sgc-error-SGCB");
  expect(error).toHaveStyle({ color: COLORS.danger });
  expect(error.className).not.toContain("text-red-400");
  expect(screen.getByText(/subcomplex disrupted/i)).toHaveStyle({ color: COLORS.danger });
});
```

Adjust fixture names to match the existing test file.

**Step 2: Run failing tests**

```bash
npm run test -- src/components/DGCLegend.test.tsx
```

Expected before implementation: FAIL due `text-emerald-400` / `text-red-400`.

### Task 4.2: Implement DGCLegend inline token colors

In `src/components/DGCLegend.tsx`:

- Replace `text-white/90` with `style={{ color: hexWithAlpha(COLORS.text, 0.9) }}`.
- Replace `text-white/80` with `style={{ color: hexWithAlpha(COLORS.text, 0.8) }}`.
- Replace `border-white/30 border-t-white/80` with inline `borderColor` plus a token-compatible top border style if needed.
- Replace loaded check class `text-emerald-400` with `style={{ color: COLORS.success }}`.
- Replace error and mutant note class `text-red-400` with `style={{ color: COLORS.danger }}`.
- Replace `border-white/10` with `style={{ borderColor: hexWithAlpha(COLORS.text, 0.1), color: COLORS.danger }}`.

Example shape:

```tsx
<span
  data-testid={`sgc-loaded-${row.gene}`}
  className="ml-auto"
  style={{ color: COLORS.success }}
>
  ✓
</span>
```

### Task 4.3: Replace hardcoded focus color with CSS var

In `src/index.css`, add the CSS variable to the existing top-level `:root` block:

```css
:root {
  --app-header-h: 125px;
  --sgce-accent: #60a5fa;
  /* existing duration/easing variables stay here */
}
```

Then replace the focus rule with:

```css
.residue-cell:focus-visible {
  outline: 2px solid var(--sgce-accent);
  outline-offset: 1px;
  z-index: 1;
}
```

Note: do not create a second `:root` block. Keep this scoped and simple; do not refactor the whole color system.

### Task 4.4: Static boundary verification

Run:

```bash
rg -n "text-(emerald|red|white)|border-white|#[0-9a-fA-F]{6}" src/components/DGCLegend.tsx src/index.css
npm run test -- src/components/DGCLegend.test.tsx src/components/sequence/SequenceViewer.test.tsx
npm run build
```

Expected:

- No `text-emerald-400`, `text-red-400`, or `border-white/*` in `DGCLegend.tsx`.
- `#60a5fa` appears only as `--sgce-accent` in CSS, or is accepted as a CSS variable bridge.
- Tests/build pass.

**Commit:**

```bash
git add src/components/DGCLegend.tsx src/components/DGCLegend.test.tsx src/index.css
git commit -m "fix: align dgc legend with explorer color tokens"
```

---

## Sprint 5: Dependency and Audit Hygiene

**Feature:** Remove avoidable audit failures and identify unused dependencies without broad framework upgrades.

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Optional: no source changes unless dependency removal requires it

### Task 5.1: Capture dependency baseline

Run:

```bash
npm audit --audit-level=moderate || true
npm outdated || true
node -e "const p=require('./package.json'); console.log(Object.keys(p.dependencies)); console.log(Object.keys(p.devDependencies));"
```

Expected: current audit failures include Vite, PostCSS, lodash.

### Task 5.2: Apply non-breaking audit fix

Run:

```bash
npm audit fix
npm audit --audit-level=moderate
```

Expected: PASS or only advisories requiring breaking upgrades remain. If `npm audit fix` proposes React/Vite major upgrades, stop and use a separate migration plan instead.

### Task 5.3: Confirm source imports before removing unused deps

Run:

```bash
for pkg in zustand recharts three @react-three/fiber @react-three/drei; do
  echo "--- $pkg";
  rg -n "from ['\"]$pkg|import .*['\"]$pkg|require\(['\"]$pkg" src package.json || true;
done
```

If imports are source-empty and tests/build pass without them, remove only truly unused runtime deps. Remove the React Three stack together if all are unused, because `@react-three/drei`, `@react-three/fiber`, and `three` are peer/transitive-related:

```bash
npm uninstall zustand recharts @react-three/drei @react-three/fiber three
```

If `@types/three` is still present only for the removed Three stack and no source/tests import Three types, remove it too:

```bash
npm uninstall -D @types/three
```

Do not remove `3dmol`, React, Vite, Tailwind, or test libraries. Do not use `npm audit fix --force`.

### Task 5.4: Verify full suite

Run:

```bash
npm run test
npm run build
npm audit --audit-level=moderate
```

Expected: tests/build pass; audit passes or remaining advisories are documented with reason.

**Commit:**

```bash
git add package.json package-lock.json
git commit -m "chore: clean dependency audit baseline"
```

---

## Final Verification Checklist

After all sprints:

```bash
git status --short
npm run test
npm run build
npm audit --audit-level=moderate
```

Browser smoke:

1. Start dev server: `npm run dev -- --host 127.0.0.1`.
2. Open local URL.
3. Verify tabs: `3D Structure`, `Central Dogma`, `Imprinting`, `Research`.
4. Toggle WT/mutant, DGC, auto-rotate.
5. At 390px width, verify sequence area remains usable and no critical label obscures controls.
6. Check console: no errors and no repeated WebGL framebuffer warnings after tab churn.

Scientific regression guard:

- Do not alter SGCE mutation facts, domain boundaries, sequence, or imprinting mechanism unless backed by UniProt/literature.
- `src/constants/protein-data.test.ts` and `src/constants/codon-data.test.ts` must remain green.

## Execution Order Summary

1. Sprint 1: PDB path consistency.
2. Sprint 2: WebGL lifecycle stabilization.
3. Sprint 3: ClinicalTrials active-status semantics.
4. Sprint 4: Design token boundary cleanup.
5. Sprint 5: Dependency/security hygiene.

## Open Decisions

- Whether to commit `public/data/AF-O43556-F1.pdb` for offline/local deterministic rendering or keep it gitignored and rely on `npm run fetch-pdb` + remote fallback.
- Whether completed ClinicalTrials studies should be available via a future “include completed” toggle. Not in scope for this stabilization plan.
