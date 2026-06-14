# Test Case Catalog — ShowaTech AR Authoring POC

Complete enumeration of the automated test suite (Vitest + jsdom). **103 test
cases across 12 files**, all passing. Run with `npm run test:run`.

Each case has a stable ID, the spec title as written in the test, and the
behaviour it verifies.

| Module | File | Cases |
|--------|------|-------|
| Workflow store | `src/store/workflow.store.test.ts` | 27 |
| Configurator store | `src/store/configurator.store.test.ts` | 19 |
| Toast store | `src/store/toast.store.test.ts` | 6 |
| Persistence service | `src/services/persistence.service.test.ts` | 12 |
| File service | `src/services/file.service.test.ts` | 10 |
| Cache service | `src/services/cache.service.test.ts` | 5 |
| Export service | `src/services/export.service.test.ts` | 2 |
| Loader service | `src/services/loader.service.test.ts` | 3 |
| ThreeUtils | `src/utils/three.utils.test.ts` | 7 |
| Texture utils | `src/utils/texture.utils.test.ts` | 3 |
| `cn` helper | `src/lib/utils.test.ts` | 3 |
| Model parser | `src/three/ModelParser.test.ts` | 6 |

---

## Workflow store — `WF` (27)

| ID | Test | Verifies |
|----|------|----------|
| WF-01 | createWorkflow › creates a workflow with the given name and empty collections | New workflow has the name/description, empty `stepIds`, numeric `createdAt === updatedAt`, and becomes the active workflow. |
| WF-02 | createWorkflow › trims the name and falls back to "Untitled Workflow" when blank | Whitespace-only name → `Untitled Workflow`; surrounding spaces are trimmed. |
| WF-03 | createWorkflow › resets steps/targets/annotations from any previous workflow | Creating a second workflow clears all prior steps. |
| WF-04 | updateWorkflow › patches fields and bumps updatedAt | `name`/`description` update and `updatedAt` advances. |
| WF-05 | updateWorkflow › is a no-op when there is no workflow | No throw, workflow stays `null`. |
| WF-06 | clearWorkflow › wipes all workflow state | Workflow, steps, active step and preview flags all reset. |
| WF-07 | addStep › throws when there is no active workflow | Throws `No active workflow`. |
| WF-08 | addStep › appends steps with incrementing order and default titles | Titles `Step 1`/`Step 2`, order `0`/`1`, appended to `stepIds`. |
| WF-09 | addStep › uses a provided, trimmed title | Custom title is trimmed. |
| WF-10 | updateStep › patches title / instruction / imageDataUrl | All three fields update on the step. |
| WF-11 | updateStep › is a no-op for an unknown step id | No throw for missing id. |
| WF-12 | removeStep › removes the step, cascades its targets + annotations, and reindexes order | Step + its targets + annotations deleted; remaining steps re-ordered. |
| WF-13 | removeStep › clears activeStepId when the active step is removed | `activeStepId` → `null`. |
| WF-14 | reorderSteps › reorders stepIds and rewrites order indices | `stepIds` and each step's `order` reflect the new sequence. |
| WF-15 | annotation placement mode › starts and cancels placement | `isPlacingAnnotation`/`placeAnnotationStepId` set then cleared. |
| WF-16 | preview navigation › does nothing when there are no steps | `enterPreview` is a no-op on an empty workflow. |
| WF-17 | preview navigation › enters at the first step and clamps next/prev to bounds | Starts at index 0; prev clamps at 0, next clamps at last; exit resets. |
| WF-18 | present mode › enters present (also preview) and exits cleanly | `isPresentMode` + `isPreviewMode` toggle together. |
| WF-19 | targets › adds and removes a target, keeping step.targetIds in sync | Target add/remove mirrored in `step.targetIds`. |
| WF-20 | annotations › adds, updates and removes an annotation | Annotation lifecycle mirrored in `step.annotationIds`. |
| WF-21 | per-step visibility actions › keeps exactly one rule per target (later action replaces earlier) | Re-adding a rule for the same target replaces it (one rule per target). |
| WF-22 | per-step visibility actions › tracks distinct targets separately and supports removal | Distinct mesh/group targets coexist; removal leaves the other intact. |
| WF-23 | per-step camera › sets and clears a saved camera | `camera` set, then fully removed from the step. |
| WF-24 | ghost toggle › defaults on and can be set / toggled | `ghostNonTargets` defaults `true`; set + toggle work. |
| WF-25 | export / import › export builds a snapshot including configurator part groups | `downloadWorkflowJSON` called with a v1 snapshot carrying part groups. |
| WF-26 | export / import › import replaces state and restores part groups | Imported workflow/steps applied; part groups pushed to configurator store. |
| WF-27 | export / import › import tolerates a snapshot with no part groups | Missing `partGroups` → empty array, no error. |

## Configurator store — `CFG` (19)

| ID | Test | Verifies |
|----|------|----------|
| CFG-01 | model + scene setters › stores model url and name | `modelUrl`/`modelName` set. |
| CFG-02 | model + scene setters › setMeshes replaces meshes and clears groups + selection | New meshes; `partGroups`/selection reset. |
| CFG-03 | model + scene setters › addMaterial enriches a non-standard material with all-false texture flags | Non-`MeshStandardMaterial` → every `has*Map` flag `false`. |
| CFG-04 | single-mesh selection › setSelectedMeshId mirrors into selectedMeshIds | Single id mirrored to the array; `null` clears it. |
| CFG-05 | multi-mesh selection › toggles meshes in and out and tracks the "primary" id | Add/remove update `selectedMeshIds` and the trailing `selectedMeshId`. |
| CFG-06 | multi-mesh selection › clearSelection empties everything | Selection arrays + primary cleared. |
| CFG-07 | mesh visibility › toggles a single mesh visible flag | `visible` flips on/off. |
| CFG-08 | part groups › creates a group with deduped meshIds and a cycled colour | Duplicate meshIds removed; colour from palette index 0. |
| CFG-09 | part groups › returns null and adds nothing for an empty mesh list | Empty meshIds → `null`, no group added. |
| CFG-10 | part groups › defaults a blank name to "Untitled Part" | Blank name fallback. |
| CFG-11 | part groups › updates and removes a group | `updatePartGroup` patches; `removePartGroup` deletes. |
| CFG-12 | part groups › toggles visibility of every member mesh at once | Group toggle hides/shows all members; non-members untouched. |
| CFG-13 | part groups › selects all member meshes of a group | `selectedMeshIds` = group members. |
| CFG-14 | part groups › setPartGroups replaces wholesale (used on import) | Whole array replaced. |
| CFG-15 | material colour › updates both the ConfigMaterial.color and the live THREE material | `color` string and `THREE.MeshStandardMaterial.color` both update. |
| CFG-16 | material colour › is a no-op for an unknown material id | No throw. |
| CFG-17 | animation + camera request counters › sets animation speed / current / play state / time | Animation fields update; play toggles. |
| CFG-18 | animation + camera request counters › increments fit-camera and camera-capture request counters | Both request counters increment by 1. |
| CFG-19 | reset › returns model + selection + group state to defaults | All model/selection/group state reset. |

## Toast store — `TOAST` (6)

| ID | Test | Verifies |
|----|------|----------|
| TOAST-01 | showToast › adds a toast with the given type and message | Toast pushed with type/message and a string id. |
| TOAST-02 | showToast › auto-dismisses info/success after 3s | Removed at exactly 3000 ms (fake timers). |
| TOAST-03 | showToast › keeps errors on screen for 5s | Still present at 3 s, gone at 5 s. |
| TOAST-04 | showToast › stacks multiple toasts | Two toasts coexist. |
| TOAST-05 | dismissToast › removes a toast by id before its timer fires | Manual dismiss works. |
| TOAST-06 | dismissToast › ignores an unknown id | No-op for missing id. |

## Persistence service — `PERS` (12)

| ID | Test | Verifies |
|----|------|----------|
| PERS-01 | downloadWorkflowJSON › builds an anchor with a name-derived filename and clicks it | Anchor `download` = `My_Flow.showatec.json`; `click()` fired once. |
| PERS-02 | downloadWorkflowJSON › falls back to "workflow" when there is no workflow name | `workflow.showatec.json`. |
| PERS-03 | downloadWorkflowJSON › honours an explicit filename | Uses the supplied filename. |
| PERS-04 | readWorkflowJSON › accepts a valid snapshot file | Parses to a v1 snapshot. |
| PERS-05 | readWorkflowJSON › accepts the .showatec.json extension | Double extension accepted. |
| PERS-06 | readWorkflowJSON › rejects an unsupported file extension | Throws on non-`.json`. |
| PERS-07 | readWorkflowJSON › rejects malformed JSON | Throws `not valid JSON`. |
| PERS-08 | readWorkflowJSON › rejects a non-object top level (null) | Throws `expected a JSON object`. |
| PERS-09 | readWorkflowJSON › rejects an unsupported version | Throws on `version: 2`. |
| PERS-10 | readWorkflowJSON › rejects a file missing the "workflow" field | Throws `missing "workflow" field`. |
| PERS-11 | readWorkflowJSON › rejects when steps is an array rather than a map | Arrays rejected for `steps`. |
| PERS-12 | readWorkflowJSON › rejects when annotations is missing/invalid | `null` `annotations` rejected. |

## File service — `FILE` (10)

| ID | Test | Verifies |
|----|------|----------|
| FILE-01..04 | isSupportedFormat › accepts %s (`.glb`, `.gltf`, `.fbx`, `.obj`) | Each supported extension returns `true` (parameterised `it.each`). |
| FILE-05 | isSupportedFormat › is case-insensitive | `MODEL.GLB` → `true`. |
| FILE-06 | isSupportedFormat › rejects unsupported formats | `.png`/`.zip` → `false`. |
| FILE-07 | getFileExtension › returns the lowercased dotted extension | `Scene.GLTF` → `.gltf`. |
| FILE-08 | readAsArrayBuffer › reads file contents into an ArrayBuffer | Bytes round-trip through `FileReader`. |
| FILE-09 | blob + object-url helpers › wraps an ArrayBuffer in a typed Blob | Blob type + size correct. |
| FILE-10 | blob + object-url helpers › creates and revokes an object URL | `createObjectUrl` returns `blob:…`; `revokeObjectUrl` calls through. |

## Cache service — `CACHE` (5)

| ID | Test | Verifies |
|----|------|----------|
| CACHE-01 | set / get / has › stores and retrieves an entry | Round-trips a cached URL. |
| CACHE-02 | set / get / has › returns null for a missing entry | `get` → `null`, `has` → `false`. |
| CACHE-03 | getStats › reports entry count and accumulated size | Entry count, total size, and 500 MB max. |
| CACHE-04 | eviction › evicts the oldest entry when the budget is exceeded | Oldest entry dropped + its URL revoked when over budget. |
| CACHE-05 | clear › revokes every URL and resets the cache | All URLs revoked, stats zeroed. |

## Export service — `EXP` (2)

| ID | Test | Verifies |
|----|------|----------|
| EXP-01 | exportPackage › produces a zip containing manifest.json, workflow.json and the model GLB | Unzipped package has all three entries; manifest fields correct; download filename sanitised. |
| EXP-02 | exportPackage › round-trips the workflow snapshot inside the package | `workflow.json` parses back to the original; model extension normalised to `.glb`. |

## Loader service — `LOAD` (3)

| ID | Test | Verifies |
|----|------|----------|
| LOAD-01 | loadModelFromFile › returns the cached object URL without re-reading the file | Cache hit short-circuits; no cache write. |
| LOAD-02 | loadModelFromFile › passes a .glb through directly and caches the resulting URL | `.glb` → object URL created and cached under the filename. |
| LOAD-03 | loadModelFromFile › throws on an unsupported file format | Throws `Unsupported file format: .xyz`. |

## ThreeUtils — `THREE` (7)

| ID | Test | Verifies |
|----|------|----------|
| THREE-01 | generateId › produces unique, timestamp-prefixed ids | Unique, matches `\d+_[a-z0-9]+`. |
| THREE-02 | colour conversion › round-trips hex <-> THREE.Color | `#ff0000` → `THREE.Color` → `#ff0000`. |
| THREE-03 | getCameraPosition › looks at the box centre and offsets the camera from it | `lookAt` = centre; x/y offsets match the formula. |
| THREE-04 | fitCameraToObjects › falls back to a default viewpoint when there are no objects | Empty box → camera `(5,5,5)`, target `(0,0,0)`, controls updated. |
| THREE-05 | fitCameraToObjects › frames a real object and updates controls to its centre | Controls target = object centre; finite camera distance. |
| THREE-06 | disposeMesh › disposes geometry and a single material | `geometry.dispose` + `material.dispose` called. |
| THREE-07 | disposeMesh › disposes every material when the mesh has a material array | Each material in the array disposed. |

## Texture utils — `TEX` (3)

| ID | Test | Verifies |
|----|------|----------|
| TEX-01 | extractTexturePreviews › returns an empty object for non-standard materials | Basic/Normal materials → `{}`. |
| TEX-02 | extractTexturePreviews › returns all-undefined previews for a standard material with no maps | Standard material w/o maps → all preview keys `undefined`. |
| TEX-03 | generatePlaceholder › returns a string without throwing | Returns a string (data URL, or `''` when no 2D context). |

## `cn` helper — `CN` (3)

| ID | Test | Verifies |
|----|------|----------|
| CN-01 | cn › joins truthy class names and drops falsy ones | Falsy values filtered. |
| CN-02 | cn › merges conflicting tailwind utilities, keeping the last | `p-2 p-4` → `p-4`. |
| CN-03 | cn › supports conditional object syntax | Object map → active classes only. |

## Model parser — `MP` (6)

| ID | Test | Verifies |
|----|------|----------|
| MP-01 | parse › derives stable, deduplicated mesh ids from names | Ids `Panel`, `Panel__2`, `Bolt`, `Mesh_3`; all visible. |
| MP-02 | parse › de-duplicates shared materials and links meshes to them | Shared material → one `ConfigMaterial`; meshes link correctly. |
| MP-03 | parse › captures material names, colours and (absent) texture flags | Name, hex colour, `hasBaseColorMap=false`; unnamed → `Material_…`. |
| MP-04 | parse › falls back to #CCCCCC for materials with no readable colour | `MeshNormalMaterial` → `#CCCCCC`. |
| MP-05 | parse › returns empty arrays for a scene with no meshes | Empty group → empty arrays. |
| MP-06 | parseAnimations › maps THREE clips to ConfigModel animation clips | Names/durations mapped; unnamed → `Animation 2`; unique ids. |

---

## Out of scope (needs E2E / WebGL)

Not covered by this headless suite — better suited to Playwright/Cypress:
React Three Fiber components and Three hooks (`CanvasRoot`, `ModelLoader`,
`useMeshSelection`, `useStepVisibility`, `useCameraFlyTo`, `usePreviewGhost`,
`useAnnotationPlacement`, `useCameraCapture`), the shadcn/Tiptap UI panels, and
the real geometry output of `ConverterService` / `GLBExporter`.
