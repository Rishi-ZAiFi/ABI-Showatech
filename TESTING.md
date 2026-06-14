# Testing

Automated unit/integration tests for the ShowaTech AR Authoring POC, written with
[Vitest](https://vitest.dev) + jsdom. They cover the deterministic, framework-free
core of the app: the Zustand stores, the file/persistence/export/cache/loader
services, the shared utilities, and the model parser.

## Running

```bash
npm install          # installs vitest, jsdom, @vitest/coverage-v8 (added to devDependencies)
npm test             # watch mode
npm run test:run     # one-shot run (CI-friendly)
npm run coverage     # one-shot run + coverage report (./coverage/index.html)
```

The config lives in `vitest.config.ts`; global polyfills/stubs are in
`src/test/setup.ts`. A full case-by-case catalog is in `TEST-CASES.md`.

## What is covered (103 tests)

| Area | File | Focus |
|------|------|-------|
| Workflow store | `src/store/workflow.store.test.ts` | create/update/clear workflow; add/update/remove/reorder steps (with cascade delete + order reindex); targets; annotations; preview & present navigation with bounds clamping; per-step visibility (one-rule-per-target dedupe); per-step camera set/clear; ghost toggle; export/import round-trip + part-group restore |
| Configurator store | `src/store/configurator.store.test.ts` | model/scene setters; single + multi mesh selection; mesh visibility; part groups (dedupe, colour cycling, empty->null, update/remove, group show/hide, select); material colour edit (state + live THREE material); animation/camera request counters; reset |
| Toast store | `src/store/toast.store.test.ts` | add/stack toasts; type-based auto-dismiss timing (error 5s vs info/success 3s) with fake timers; manual dismiss |
| Persistence service | `src/services/persistence.service.test.ts` | JSON download filename derivation; defensive `readWorkflowJSON` validation (extension, bad JSON, non-object, version, missing/!map fields) |
| File service | `src/services/file.service.test.ts` | supported-format detection (case-insensitive); extension parse; `readAsArrayBuffer`; blob + object-URL helpers |
| Cache service | `src/services/cache.service.test.ts` | set/get/has; stats; budget eviction of oldest entry (with URL revoke); clear |
| Export service | `src/services/export.service.test.ts` | ZIP package structure (manifest/workflow/model.glb), manifest fields, filename sanitising, snapshot round-trip (GLB exporter mocked, zip unpacked to assert) |
| Loader service | `src/services/loader.service.test.ts` | cache short-circuit; `.glb` pass-through + cache write; unsupported-format error |
| ThreeUtils | `src/utils/three.utils.test.ts` | id generation; hex<->Color; camera framing (incl. empty-scene fallback); geometry/material disposal |
| Texture utils | `src/utils/texture.utils.test.ts` | material-type guards; no-maps path; placeholder no-throw |
| `cn` helper | `src/lib/utils.test.ts` | clsx join + tailwind-merge conflict resolution |
| Model parser | `src/three/ModelParser.test.ts` | stable name-derived mesh ids (deduped); shared-material de-dup; colour/texture-flag extraction; `#CCCCCC` fallback; animation mapping |

## Notes / not covered

These rely on a real WebGL context or browser rendering and are out of scope for a
headless jsdom runner (better suited to Playwright/Cypress E2E):

- React Three Fiber components and Three hooks (`CanvasRoot`, `ModelLoader`,
  `useMeshSelection`, `useStepVisibility`, `useCameraFlyTo`, ghosting, etc.)
- shadcn/Tiptap UI components and the inspector/workflow panels
- The `ConverterService` FBX/OBJ/GLTF loaders and `GLBExporter` actual geometry
  output (the exporter is mocked where its result is needed)
