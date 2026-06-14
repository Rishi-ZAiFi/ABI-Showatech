# Next-Features Prompt — ShowaTech AR Authoring POC

> Paste everything below the line into a new chat to continue building this project.
> It is written as an instruction prompt for an AI coding assistant.

---

## Context

You are working on **ShowaTech**, a browser-based POC for an **Aerospace AR Work Instruction Authoring Platform**. Engineers author step-by-step guides layered on top of an interactive 3D model; operators then play the guide back.

**Project location:** `01_ProductStudio/` (React 18 + TypeScript + Three.js via React Three Fiber + Zustand + Tailwind v4 / shadcn, built with Vite).

**Rules (keep following them):** no backend, no auth, Zustand only, **one slice per PR**. Each slice gets a `slice-NN-name.md` doc matching the style of the existing ones (objective, implementation, files changed, definition of done). Update `status.md` and `roadmap.md` when a slice is done. Verify every slice with `npx tsc -b` and `npx vite build` before marking it complete.

**Already implemented (slices 1–14):** GLB viewer, mesh selection, workflow/step model, rich-text instructions, 3D annotations, preview/present mode with amber highlight + camera fly, localStorage + JSON + ZIP persistence, polish — plus: **part grouping & multi-select (tagged `PartGroup`s)**, **per-step cumulative visibility** (`useStepVisibility`), **per-step camera capture** + **one-step hide/show swap**, and **stable name-derived mesh ids** so references survive reload. Read `architecture.md` and the `slice-*.md` files before starting.

**Key files to know:**
`src/store/configurator.store.ts` (model, meshes, `selectedMeshIds`, `partGroups`), `src/store/workflow.store.ts` (workflow/steps/visibility/camera), `src/three/ModelParser.ts`, `src/three/usePreviewHighlight.ts`, `src/three/useStepVisibility.ts`, `src/three/useCameraFlyTo.ts`, `src/components/workflow/WorkflowPanel.tsx`, `src/components/configurator/PartsPanel.tsx`, `src/components/workflow/PreviewPanel.tsx`, `src/types/Workflow.ts`, `src/types/PartGroup.ts`.

---

## What to build

Implement the following improvements, **one slice per PR**, in the suggested order. Confirm the plan for each slice with me before writing code, then build, verify, and document it.

### A. Operator comprehension (the person consuming a guide)

1. **Ghost/dim non-target parts during a step.** Today `usePreviewHighlight.ts` only adds an amber overlay to the step's targets. Add the inverse: while previewing, set every *non-target* mesh to low opacity (clone the material, `transparent: true`, e.g. opacity ≈ 0.15) so the relevant part visually pops out of the assembly. Restore original materials on step change / preview exit. Make it a toggle in the preview toolbar. *(Highest comprehension impact.)*

2. **Exploded view.** New `useExplodedView` hook + a slider in the preview/scene toolbar that offsets each `PartGroup` outward from the model centroid by a factor (animate `mesh.position`, remember originals, restore at 0). Explode by part group, not individual mesh.

3. **Section / clipping plane.** Use `THREE.Plane` + `renderer.clippingPlanes` (`localClippingEnabled = true`) with an axis selector + position slider to cut through the model and reveal internals.

4. **Animated show/hide.** In `useStepVisibility.ts`, fade `material.opacity` over ~300 ms when a part appears/disappears instead of flipping `.visible`, so the operator sees *what changed*.

5. **Preview navigation polish.** Extend `PreviewPanel`: progress bar, "Step N of M", a clickable step list to jump, keyboard arrow nav, and an optional per-step "Done ✓" confirmation that gates progress.

6. **Per-step parts/tools list + time estimate.** Add `estimatedSeconds` and a tools/BOM field to `Step`; surface them in the preview.

7. **Touch/tablet support.** Verify pinch-zoom / touch-orbit and make the Inspector layout responsive (the runtime targets tablets).

8. **(Stretch) Real AR via WebXR** using `@react-three/xr` for phone/headset passthrough.

### B. Author / developer experience (the person building guides)

1. **Undo/redo** via `zundo` temporal middleware on the Zustand stores — `removeStep`, `removePartGroup`, `clearWorkflow` are destructive with no recovery.

2. **Auto-suggest parts from the glTF hierarchy.** `ModelParser.ts` currently flattens the scene. Read the parent `Group`/node tree and auto-propose `PartGroup`s from named sub-assemblies, so authors don't Shift-click hundreds of meshes by hand. *(Biggest authoring time-saver.)*

3. **Search/filter + rename in the mesh & parts lists.** `MeshPanel` renders every mesh flat; add a filter box and an editable display alias for meshes named like `Object_147`.

4. **Drag-to-reorder steps** (replace up/down arrows with `@dnd-kit`); same for parts.

5. **Multiple workflows per model.** The store holds exactly one `workflow`; support a library of guides (`workflows: Record<id, Workflow>`) with a switcher.

6. **Guide-health / validation panel.** Flag steps with no instruction/target/visibility change, orphan annotations, and visibility actions referencing deleted parts.

7. **Duplicate/clone a step** + step templates.

8. **Refactor `WorkflowPanel.tsx` (~900 lines)** into per-section files and add **`vitest`** unit tests for the store logic — especially the cumulative visibility replay in `useStepVisibility` and `togglePartGroupVisibility`.

9. **Backend persistence (README Module 3)** with snapshot **schema versioning + migrations** (`WorkflowSnapshot.version` is hardcoded `1` with no migration path).

---

## Suggested starting order

1. **Ghost non-target parts** (A1) — biggest operator win, small change.
2. **Exploded view** (A2) — shares the preview-rendering layer with A1.
3. **Auto-suggest parts from glTF hierarchy** (B2) — removes the most tedious authoring step.
4. **Undo/redo** (B1) — safety net before bigger refactors.

Start with slice 15 = A1 (ghosting). Propose the data/UI changes, then implement, verify with `tsc -b` + `vite build`, and write `slice-15-ghosting.md`.
