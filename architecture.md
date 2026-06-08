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
        ├── targetIds: string[]  → Target { meshId, meshName }
        └── annotationIds: string[] → Annotation { position: Vector3, label }
```

All state lives in two Zustand stores:

- `configurator.store.ts` — model URL, meshes, materials, animations
- `workflow.store.ts` — workflows, steps, targets, annotations, preview/placement modes

Persistence via Zustand `persist` middleware → `localStorage`. Manual save/load via JSON file (`.showatec.json`).

---

## Component Tree

```
App
├── TopBar
├── Viewport (Canvas)
│   ├── SceneSetup
│   ├── ModelLoader → ModelParser
│   ├── AnnotationLayer        (Slice 06 — sphere pins + HTML callouts)
│   └── useAnnotationPlacement (Slice 06 — raycasting click handler)
└── Inspector
    ├── MeshPanel / MaterialPanel / AnimationPanel  (configurator tabs)
    └── WorkflowPanel
          ├── SaveLoadBar
          ├── StepRow[]
          ├── StepEditor
          │     ├── InstructionEditor   (Tiptap rich text)
          │     ├── MeshTargets
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
