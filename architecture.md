# Architecture — ShowaTech AR Authoring POC

## Stack

| Layer | Technology |
|-------|-----------|
| UI framework | React 18 + TypeScript |
| 3D rendering | Three.js via React Three Fiber (`@react-three/fiber`, `@react-three/drei`) |
| State management | Zustand (no backend, browser-only) |
| Rich text editing | Tiptap v3 (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-placeholder`) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Build | Vite |
| Export | fflate (ZIP packaging) |

---

## Domain Model

```
Workflow
  └── Step[]
        ├── title: string
        ├── instruction: string  (HTML — authored in InstructionEditor)
        ├── targetIds: string[]      → Target { meshId, meshName }
        ├── annotationIds: string[]  → Annotation { position: Vector3, label }
        ├── visibility?: VisibilityAction[]   (Slice 12 — cumulative show/hide)
        └── camera?: StepCamera               (Slice 13 — saved viewpoint)

PartGroup[]   (Slice 11 — model-level, in configurator store)
  └── { name, tag, color, meshIds[] }   // a logical "part" = several meshes
```

All state lives in two Zustand stores:

- `configurator.store.ts` — model URL, meshes, materials, animations, **multi-selection (`selectedMeshIds`), part groups (`partGroups`)**
- `workflow.store.ts` — workflows, steps, targets, annotations, preview/placement modes, **per-step visibility & camera actions**

Mesh ids are **derived from mesh names** (deduped) in `ModelParser`, so targets, part groups, and visibility re-link when the same model is reloaded (Slice 14).

Persistence via Zustand `persist` middleware → `localStorage`. Manual save/load via JSON file (`.showatec.json`); ZIP export bundles `workflow.json` (incl. part groups) + `model.glb`. Per-step visibility & camera persist inline on `Step`.

---

## Component Tree

```
App
├── TopBar
├── Viewport (Canvas)
│   ├── SceneSetup
│   ├── ModelLoader → ModelParser
│   │     ├── useMeshSelection      (multi-select via modifier-click — Slice 11)
│   │     ├── usePreviewHighlight   (amber overlays — Slice 07)
│   │     ├── useStepVisibility     (cumulative show/hide in preview — Slice 12)
│   │     ├── useCameraFlyTo        (saved-camera or auto-frame — Slice 13)
│   │     └── useCameraCapture      (snapshot camera onto active step — Slice 13)
│   ├── AnnotationLayer        (Slice 06 — sphere pins + HTML callouts)
│   └── useAnnotationPlacement (Slice 06 — raycasting click handler)
└── Inspector
    ├── MeshPanel / PartsPanel / MaterialPanel / AnimationPanel  (Scene tab — PartsPanel = Slice 11)
    └── WorkflowPanel
          ├── SaveLoadBar
          ├── StepRow[]
          ├── StepEditor
          │     ├── InstructionEditor   (Tiptap rich text)
          │     ├── MeshTargets
          │     ├── VisibilitySection   (per-step show/hide + one-step swap — Slices 12/13)
          │     ├── Camera View block   (capture/clear — Slice 13)
          │     └── AnnotationsSection
          └── PreviewPanel             (Slice 07)
```

---

## InstructionEditor — design notes

`src/components/workflow/InstructionEditor.tsx`

- Content stored as **HTML string** — no extra serialisation layer vs. the `Step` type.
- `key={stepId}` on the call site forces a full remount when the active step changes (Tiptap `content` prop is not reactive after init).
- Toolbar buttons use `onMouseDown + e.preventDefault()` to avoid stealing editor focus.

### Placeholder

Uses `@tiptap/extension-placeholder` — renders via CSS `::before` on `.tiptap p.is-editor-empty:first-child`. Style defined in `src/index.css` using `var(--muted-foreground)` so it respects both light and dark themes.

Do not revert to a manual `absolute`-positioned div overlay; it flickers on focus transitions.

### Theme-aware prose

`prose-invert` is conditionally applied based on `resolvedTheme` from `next-themes`. Because `editorProps.attributes.class` is set once at Tiptap init, a `useEffect` calls `editor.setOptions()` on theme change to keep the class in sync:

```ts
useEffect(() => {
  editor?.setOptions({ editorProps: { attributes: { class: editorClass(isDark) } } });
}, [isDark, editor]);
```

### Word/character counter

Live stats (`words · chars`) are maintained in a `useState` updated via Tiptap's `onUpdate` callback. Initialised from the incoming `value` prop so the count is correct before any edits.

---

## Key patterns

**No backend** — all data stays in the browser. Export produces a self-contained ZIP.

**Zustand slices** — stores are split by domain (configurator vs. workflow). Cross-store reads use direct selector imports, not a combined store.

**React Three Fiber HTML overlay** — `@react-three/drei`'s `<Html>` component is used for annotation callout labels so they stay anchored to 3D positions without a manual projection loop.

**Vite** — dev server on `localhost:5173`. Single-page app with no routing.
