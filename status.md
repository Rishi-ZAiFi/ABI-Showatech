# Development Status — ShowaTech AR Authoring POC

> Updated: 2026-06-09 (Post-POC improvements to InstructionEditor)  
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

See `slice-05-instruction-editor.md` for full details.

---

## Current Focus

**POC feature-complete.** Post-POC improvement pass in progress on `InstructionEditor`.

---

## Existing Baseline (pre-slice work)

Carried over from previous configurator project:

- `src/store/configurator.store.ts` — Zustand store (model URL, meshes, materials, animations)
- `src/three/` — CanvasRoot, ModelLoader, ModelParser, SceneSetup, useAnimationMixer, useConfiguratorScene
- `src/services/` — file, loader, converter, cache services
- `src/types/` — ConfigMesh, ConfigMaterial, ConfigModel
- `src/app/App.tsx` — layout shell (TopBar, Viewport, Inspector, FileUploader)

These will be assessed and reused/refactored slice by slice per the