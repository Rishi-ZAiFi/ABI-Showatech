# Development Status — ShowaTech AR Authoring POC

> Updated: 2026-06-14 (Post-POC guide-authoring features: slices 11–15)  
> Project: Browser-based AR Work Instruction Authoring Platform  
> Rules: No backend · No auth · Zustand only · One slice per PR

---

## Slice Status

| # | Slice | Status | Notes |
|---|-------|--------|-------|
| 01 | Viewer | ✅ Done | GLB/GLTF load + orbit + basic scene |
| 02 | Mesh Selection | ✅ Done | Click-to-select mesh, highlight, inspector panel |
| 03 | Workflow Model | ✅ Done | Zustand domain model: Workflow, Step, Target, Annotation + WorkflowPanel UI |
| 04 | Step Authoring | ✅ Done | Title edit, reorder up/down, mesh target assign/remove (instruction upgraded in Slice 05) |
| 05 | Instruction Editor | ✅ Done | Tiptap rich-text editor: Bold, Italic, Bullet/Ordered list, Undo/Redo |
| 06 | Annotation System | ✅ Done | 3D sphere pins + Html callout labels; placement mode; inline rename/remove in sidebar |
| 07 | Workflow Preview | ✅ Done | PreviewPanel, usePreviewHighlight (amber overlays), enterPreview/exitPreview/next/prev actions |
| 08 | Persistence | ✅ Done | Auto-save to localStorage (zustand persist) + Save/Load JSON file |
| 09 | Export | ✅ Done | ZIP package: manifest.json + workflow.json + model.glb via fflate |
| 10 | Polish | ✅ Done | Toast system (replaces alert()), Viewport loading overlay, delete-workflow confirm dialog, Escape key cancels annotation placement |
| 11 | Part Grouping & Multi-Select | ✅ Done | Shift/Ctrl-click multi-select; tagged `PartGroup`s (name/tag/colour); show/hide a whole part in one click. See `slice-11-part-grouping.md` |
| 12 | Per-Step Visibility | ✅ Done | Cumulative show/hide actions per step (meshes or parts); `useStepVisibility` replays them in preview. See `slice-12-step-visibility.md` |
| 13 | Per-Step Camera & Swap | ✅ Done | Capture/clear a camera view per step (flown to in preview); one-step hide-A/show-B swap control. See `slice-13-camera-and-swap.md` |
| 14 | Stable IDs & Group Persistence | ✅ Done | Name-derived mesh ids so refs survive reload; part groups in JSON + ZIP export. See `slice-14-stable-ids-persistence.md` |
| 15 | Ghost Non-Target Parts | ✅ Done | Dim non-target meshes to ~0.15 opacity during preview/present so the target pops out; on-by-default toggle in PreviewPanel + PresenterOverlay. See `slice-15-ghosting.md` |

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ⬜ | Not started |
| 🔵 | In progress |
| ✅ | Done |
| 🚫 | Blocked |

---

## Post-POC Improvements

Applied after initial POC completion. All changes are in `InstructionEditor.tsx`.

| Date | Change | Files |
|------|--------|-------|
| 2026-06-09 | Replaced fragile custom placeholder div with `@tiptap/extension-placeholder` (CSS `::before`) | `InstructionEditor.tsx`, `index.css`, `package.json` |
| 2026-06-09 | Added live word/character counter footer strip | `InstructionEditor.tsx` |
| 2026-06-09 | Fixed `prose-invert` hardcoded in dark mode — now theme-reactive via `useTheme` + `editor.setOptions` | `InstructionEditor.tsx` |
| 2026-06-14 | Part grouping & multi-select (Slice 11) | `PartGroup.ts`, `PartsPanel.tsx`, `configurator.store.ts`, `useMeshSelection.ts`, `MeshPanel.tsx`, `Inspector.tsx` |
| 2026-06-14 | Per-step cumulative visibility (Slice 12) | `Workflow.ts`, `workflow.store.ts`, `useStepVisibility.ts`, `ModelLoader.tsx`, `WorkflowPanel.tsx` |
| 2026-06-14 | Per-step camera + one-step swap (Slice 13) | `Workflow.ts`, `workflow.store.ts`, `configurator.store.ts`, `useCameraCapture.ts`, `useCameraFlyTo.ts`, `ModelLoader.tsx`, `WorkflowPanel.tsx` |
| 2026-06-14 | Stable mesh ids + part-group persistence (Slice 14) | `ModelParser.ts`, `persistence.service.ts`, `configurator.store.ts`, `workflow.store.ts`, `TopBar.tsx` |
| 2026-06-14 | Ghost non-target parts in preview (Slice 15) | `workflow.store.ts`, `usePreviewGhost.ts`, `ModelLoader.tsx`, `PreviewPanel.tsx`, `PresenterOverlay.tsx` |

See the matching `slice-*.md` files for full details.

---

## Current Focus

**POC feature-complete + guide-authoring extensions (slices 11–14) done. Operator-comprehension work started: slice 15 (ghosting) done.** Next up per `NEXT-FEATURES-PROMPT.md`: exploded view (A2), then auto-suggest parts from glTF hierarchy (B2) and undo/redo (B1).

---

## Existing Baseline (pre-slice work)

Carried over from previous configurator project:

- `src/store/configurator.store.ts` — Zustand store (model URL, meshes, materials, animations)
- `src/three/` — CanvasRoot, ModelLoader, ModelParser, SceneSetup, useAnimationMixer, useConfiguratorScene
- `src/services/` — file, loader, converter, cache services
- `src/types/` — ConfigMesh, ConfigMaterial, ConfigModel
- `src/app/App.tsx` — layout shell (TopBar, Viewport, Inspector, FileUploader)

These will be assessed and reused/refactored slice by slice per the