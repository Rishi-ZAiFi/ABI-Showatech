# Slice 12 — Per-Step Visibility (Cumulative)

> Status: ✅ Done (post-POC, 2026-06-14)

---

## Objective

Make a guide *drive* what the operator sees. Previously visibility was global and lived only in the configurator store — a step could highlight meshes but could not say "hide the cover, reveal the bolts." Now each step records show/hide actions that are replayed automatically during preview.

---

## Model

**Cumulative semantics** (chosen over absolute snapshots): each step records only what *changes* at that step; stepping forward layers each step's actions on top of the previous state, like a real assembly/disassembly sequence. Stepping back recomputes from the author baseline so the result is always correct.

### Domain type

`src/types/Workflow.ts`

```ts
export interface Step {
  // …existing fields…
  visibility?: VisibilityAction[];   // applied cumulatively in preview
  // …
}

export interface VisibilityAction {
  id: string;
  targetKind: 'mesh' | 'group';   // a single mesh or a tagged part group
  targetId: string;               // ConfigMesh id or PartGroup id
  targetName: string;             // display snapshot (survives renames)
  action: 'show' | 'hide';
}
```

Because `visibility` lives inline on `Step`, it is persisted automatically by the existing Zustand `persist` middleware and by the JSON / ZIP export.

### Store (workflow)

`src/store/workflow.store.ts`

- `addVisibilityAction(stepId, action, targetKind, targetId, targetName)` — adds a rule; **replaces any prior rule on the same target** so a step has at most one rule per target.
- `removeVisibilityAction(stepId, actionId)`.

### Runtime hook

`src/three/useStepVisibility.ts` (new), wired into `ModelLoader`.

While `isPreviewMode` is active:

1. Start from the author baseline (`ConfigMesh.visible`).
2. Replay every step's actions for steps `0 … previewStepIndex` in order, resolving group actions to their member mesh ids.
3. Apply the result directly to the live meshes via `mesh.ref.visible` — **without** mutating the author's saved state.

On exit (or when not in preview) the author baseline is restored. Recomputing from the baseline on every step change means jumping/seeking is always consistent.

### Authoring UI

`VisibilitySection` added to `StepEditor` (`WorkflowPanel.tsx`):

- Lists the step's current actions as green (show) / red (hide) chips with remove buttons.
- "Show / Hide" buttons that add actions for the currently selected mesh(es).
- A row per part group with quick Show / Hide buttons.

---

## Interaction with existing hooks

`useConfiguratorScene` applies `mesh.ref.visible = mesh.visible` only when the configurator store's `meshes` change — which does not happen during preview — so it does not fight `useStepVisibility`. Highlight overlays (`usePreviewHighlight`) are independent.

---

## Files changed

| File | Change |
|------|--------|
| `src/types/Workflow.ts` | `VisibilityAction` type + `Step.visibility` |
| `src/store/workflow.store.ts` | `addVisibilityAction` / `removeVisibilityAction` |
| `src/three/useStepVisibility.ts` | New — cumulative replay in preview |
| `src/three/ModelLoader.tsx` | Wire `useStepVisibility` |
| `src/components/workflow/WorkflowPanel.tsx` | `VisibilitySection` in the step editor |

---

## Definition of done

- A step can show/hide individual meshes or whole parts. ✅
- Preview applies visibility cumulatively and restores the baseline on exit. ✅
- `tsc -b` and `vite build` pass. ✅
