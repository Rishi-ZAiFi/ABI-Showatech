# Slice 15 — Ghost / Dim Non-Target Parts

> Status: ✅ Done (post-POC, 2026-06-14)

---

## Objective

Improve operator comprehension while a guide is played back. `usePreviewHighlight`
already adds an amber overlay to the **targets** of the active step. This slice adds
the inverse: every mesh that is **not** a target of the active step is dimmed to low
opacity (≈ 0.15) so the relevant part visually pops out of the surrounding assembly.

Ghosting is a view preference exposed as a toggle, **on by default**, available in both
preview (sidebar) and present (fullscreen overlay) modes.

---

## Data / state

`src/store/workflow.store.ts`

```ts
ghostNonTargets: boolean;            // ephemeral view preference, default true
setGhostNonTargets: (v: boolean) => void;
toggleGhostNonTargets: () => void;
```

It is intentionally **left out of `partialize`**, so it is not written to localStorage —
it is a per-session view option (the same way `isPreviewMode` / `previewStepIndex` live
in the store but are not persisted). It resets to `true` each session.

No domain-model (`Workflow` / `Step`) changes — ghosting derives entirely from the
existing per-step `targetIds`.

---

## Rendering

`src/three/usePreviewGhost.ts` (new), wired into `ModelLoader` after `useStepVisibility`.

While `isPreviewMode && ghostNonTargets` and there is an active step:

1. Resolve the active step's target mesh set (`step.targetIds → targets[tid].meshId`).
2. For every **other** registered mesh, remember its original material reference (keyed by
   the `THREE.Mesh` object) and swap in a **cloned** material with `transparent = true`,
   `opacity = 0.15`, `depthWrite = false`.
3. Targets keep their original material untouched, so the amber highlight overlay still
   reads cleanly on top of them.

The originals are restored — and the cloned ghost materials disposed — whenever the step
changes, the toggle is switched off, preview/present is exited, or the hook unmounts.
The restore map is keyed by the mesh object (not the `meshes` array) so the unmount
cleanup can never reference a stale snapshot.

Notes / interactions:

- **Array materials** are handled (each sub-material is cloned / disposed).
- **Shared materials**: cloning is per-mesh, and the *original* reference is stored, so
  meshes that share a material restore correctly and a target sharing a material with a
  ghosted mesh stays bright.
- **Visibility actions** (Slice 12): meshes hidden by `useStepVisibility` simply stay
  hidden — dimming a hidden mesh is harmless, so there is no ordering dependency between
  the two hooks.
- **Highlight overlays** (`usePreviewHighlight`) are child objects of targets and are not
  in the configurator `meshes` list, so they are never dimmed.

---

## UI

- `PreviewPanel.tsx` — a `Ghost`-icon toggle in the header (amber when active,
  muted when off), next to the Exit button.
- `PresenterOverlay.tsx` — a matching "Ghost" pill in the top-right control group. The
  inspector/`PreviewPanel` is hidden during present mode, so the operator needs an in-mode
  control there.

Both call `toggleGhostNonTargets` and reflect `ghostNonTargets` via styling +
`aria-pressed`.

---

## Files changed

| File | Change |
|------|--------|
| `src/store/workflow.store.ts` | `ghostNonTargets` flag + `setGhostNonTargets` / `toggleGhostNonTargets` (not persisted) |
| `src/three/usePreviewGhost.ts` | New — clones & dims non-target mesh materials during preview; restores/disposes on change/exit |
| `src/three/ModelLoader.tsx` | Wire `usePreviewGhost()` |
| `src/components/workflow/PreviewPanel.tsx` | Ghost toggle in header |
| `src/components/workflow/PresenterOverlay.tsx` | Ghost toggle in top-right controls |

---

## Definition of done

- Non-target parts dim to ~0.15 opacity while a step is previewed/presented; the target
  pops out. ✅
- Toggle works in both preview and present modes; on by default. ✅
- Original materials restored (and clones disposed) on step change, toggle-off, and exit. ✅
- `tsc -b` and `vite build` pass. ✅
