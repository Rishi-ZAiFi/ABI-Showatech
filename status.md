# Development Status — ShowaTech AR Authoring POC

> Updated: 2026-06-08  
> Project: Browser-based AR Work Instruction Authoring Platform  
> Rules: No backend · No auth · Zustand only · One slice per PR

---

## Slice Status

| # | Slice | Status | Notes |
|---|-------|--------|-------|
| 01 | Viewer | ⬜ Not started | GLB/GLTF load + orbit + basic scene |
| 02 | Mesh Selection | ⬜ Not started | Click-to-select mesh, highlight, inspector panel |
| 03 | Workflow Model | ⬜ Not started | Zustand domain model: Workflow, Step, Target, Annotation |
| 04 | Step Authoring | ⬜ Not started | Create/edit/reorder steps in sidebar |
| 05 | Instruction Editor | ⬜ Not started | Rich text instruction per step |
| 06 | Annotation System | ⬜ Not started | 3D callouts / highlights pinned to mesh targets |
| 07 | Workflow Preview | ⬜ Not started | Play-through mode: step-by-step with 3D context |
| 08 | Persistence | ⬜ Not started | Save/load workflow to localStorage or JSON file |
| 09 | Export | ⬜ Not started | Export workflow package (JSON + assets) |
| 10 | Polish | ⬜ Not started | UX, error states, empty states, responsive layout |

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ⬜ | Not started |
| 🔵 | In progress |
| ✅ | Done |
| 🚫 | Blocked |

---

## Current Focus

**Next up: Slice 01 — Viewer**  
Awaiting `go` command.

---

## Existing Baseline (pre-slice work)

Carried over from previous configurator project:

- `src/store/configurator.store.ts` — Zustand store (model URL, meshes, materials, animations)
- `src/three/` — CanvasRoot, ModelLoader, ModelParser, SceneSetup, useAnimationMixer, useConfiguratorScene
- `src/services/` — file, loader, converter, cache services
- `src/types/` — ConfigMesh, ConfigMaterial, ConfigModel
- `src/app/App.tsx` — layout shell (TopBar, Viewport, Inspector, FileUploader)

These will be assessed and reused/refactored slice by slice per the "reuse before rebuild" rule.
