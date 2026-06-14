# Slice 13 — Per-Step Camera & One-Step Swap

> Status: ✅ Done (post-POC, 2026-06-14)

---

## Objective

Two authoring conveniences that make guides clearer:

1. **One-step swap** — record "hide part A and show part B" on the same step in a single action (the core "hide one / unhide one in a single step" request).
2. **Per-step camera** — save a camera viewpoint on a step so the guide flies to the right angle automatically when that step is reached.

---

## One-step swap

`VisibilitySection` in `WorkflowPanel.tsx` gained a compact "One-step swap" control: two dropdowns of part groups (Hide… / Show…) and an **Add** button. Pressing Add records both a `hide` and a `show` `VisibilityAction` (from Slice 12) on the active step at once. No new data model — it is sugar over `addVisibilityAction`.

---

## Per-step camera

### Domain type

`src/types/Workflow.ts`

```ts
export interface Step {
  // …
  camera?: StepCamera;
}

export interface StepCamera {
  position: { x: number; y: number; z: number };
  target:   { x: number; y: number; z: number };
}
```

### Store

- `workflow.store.ts`: `setStepCamera(stepId, camera)` and `clearStepCamera(stepId)`.
- `configurator.store.ts`: `cameraCaptureRequest` counter + `requestCameraCapture()` — the same "request counter" pattern used by `fitCameraRequest`, so a UI component outside the Canvas can ask the in-Canvas hook to act.

### Capture hook

`src/three/useCameraCapture.ts` (new), wired into `ModelLoader`. When `cameraCaptureRequest` increments, it reads the live camera position and the OrbitControls target and saves them onto the **active** step via `setStepCamera`.

### Playback

`src/three/useCameraFlyTo.ts` updated: when a previewed step has a saved `camera`, it flies straight to that exact position/target. Otherwise it falls back to the existing behaviour of framing the step's target meshes' bounding box.

### UI

`StepEditor` (`WorkflowPanel.tsx`) gained a **Camera View** block: a "Capture current view" / "Update saved view" button (calls `requestCameraCapture`) and a Clear button. Capturing does not move the camera during authoring — it only flies during preview playback.

---

## Files changed

| File | Change |
|------|--------|
| `src/types/Workflow.ts` | `StepCamera` type + `Step.camera` |
| `src/store/workflow.store.ts` | `setStepCamera` / `clearStepCamera` |
| `src/store/configurator.store.ts` | `cameraCaptureRequest` + `requestCameraCapture` |
| `src/three/useCameraCapture.ts` | New — snapshots camera onto the active step |
| `src/three/useCameraFlyTo.ts` | Prefer a saved step camera over auto-framing |
| `src/three/ModelLoader.tsx` | Wire `useCameraCapture` |
| `src/components/workflow/WorkflowPanel.tsx` | Swap control + Camera View block |

---

## Definition of done

- A single control records hide-one + show-another on one step. ✅
- A step's camera can be captured, cleared, and is flown to during preview. ✅
- `tsc -b` and `vite build` pass. ✅
