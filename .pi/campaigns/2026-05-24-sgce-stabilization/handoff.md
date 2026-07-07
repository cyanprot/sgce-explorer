# SGCE Stabilization Handoff

Updated: 2026-06-01T14:39:24-07:00

## Current state

- Worktree: `~/.config/worktrees/sgce-explorer/sgce-stabilization`
- Branch: `fix/sgce-stabilization`
- Sprint 1 complete: `c0759d9` (`fix: align pdb fetch path with vite public assets`).
- Sprint 2 complete: `ebb3705` (`fix: stabilize 3dmol viewer lifecycle`).
- Sprint 3 complete: `9e2e29b` (`fix: align clinical trials query with active status copy`).
- Sprints 4-5 complete in Claude Code per user confirmation.
- Campaign state: complete. Pi state reconciled on 2026-06-01 without rerunning verification.

## Batch 1 verification

- Baseline worktree tests: `npm run test` passed (37 files / 337 tests).
- Sprint 1:
  - script-path assertion failed before implementation and passed after
  - `npm run fetch-pdb` downloaded `public/data/AF-O43556-F1.pdb` (290951 bytes)
  - `npm run test -- src/hooks/useProteinData.test.ts src/utils/isPdbData.test.ts` passed
  - `npm run build` passed
- Sprint 2:
  - auto-rotate and zero-size resize regression tests failed before implementation and passed after
  - `npm run test -- src/components/ProteinStructure3D.test.tsx` passed (30 tests)
  - `npm run build` passed
  - Browser tab churn smoke found no repeated `GL_INVALID_FRAMEBUFFER_OPERATION`; unrelated Central Dogma Framer Motion SVG radius console warnings/errors remain
- Sprint 3:
  - active-trials URL test failed before implementation and passed after
  - `npm run test -- src/hooks/useClinicalTrials.test.ts src/components/research/TrialsCard.test.tsx src/components/ResearchPanel.test.tsx` passed (27 tests)
  - `npm run build` passed

## Next action

None. Campaign complete.
