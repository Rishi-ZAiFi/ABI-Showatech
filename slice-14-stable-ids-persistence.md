# Slice 14 — Stable Mesh IDs & Part-Group Persistence

> Status: ✅ Done (post-POC, 2026-06-14)

---

## Objective

Make part groups, mesh targets, and per-step visibility survive a save → reload cycle, and include part groups in the exported package. Previously these all keyed on a random mesh id generated fresh on every parse, so any reference dangled once the model was reloaded.

---

## Implementation

### 1. Stable, name-derived mesh ids

`src/three/ModelParser.ts`

Mesh ids were `ThreeUtils.generateId()` (random). Now each `ConfigMesh.id` is derived from the mesh **name**, deduped:

```ts
const meshName = node.name || `Mesh_${meshes.length}`;
let stableId = meshName, i = 2;
while (usedMeshIds.has(stableId)) stableId = `${meshName}__${i++}`;
```

Because targets, part groups, and `VisibilityAction.targetId` (mesh kind) all key on `ConfigMesh.id`, they now re-link correctly when the **same** model is reloaded.

### 2. Part groups in the snapshot

`src/services/persistence.service.ts` — `WorkflowSnapshot` gained an optional field:

```ts
partGroups?: PartGroup[];   // optional → older files still load
```

`src/store/workflow.store.ts`:

- `exportWorkflow()` now includes `partGroups` read from the configurator store.
- `importWorkflow(snapshot)` restores them via `configurator.setPartGroups(snapshot.partGroups ?? [])`.

`src/components/layout/TopBar.tsx` — the ZIP package snapshot (`handleExportPackage`) also includes `store.partGroups`, so `workflow.json` inside the `.showatec-pkg.zip` carries them.

Per-step `visibility` and `camera` ride along automatically because they live inline on `Step`.

---

## Operational note

When restoring a saved guide: **load the matching 3D model first, then import the workflow JSON.** Loading a model calls `setMeshes`, which resets part groups; importing afterwards repopulates them, and the stable name-based ids line up with the freshly parsed meshes.

---

## Files changed

| File | Change |
|------|--------|
| `src/three/ModelParser.ts` | Stable, name-derived, deduped mesh ids |
| `src/services/persistence.service.ts` | `partGroups?` on `WorkflowSnapshot` |
| `src/store/configurator.store.ts` | `setPartGroups` |
| `src/store/workflow.store.ts` | Export/import bridge for part groups |
| `src/components/layout/TopBar.tsx` | Include part groups in the ZIP snapshot |

---

## Known limitations / future work

- Mesh identity is by **name**; models with non-unique or auto-generated names (`Object_123`) get deduped suffixes but remain brittle across re-exports of the model itself. A future improvement is a stable author-assigned alias per mesh.
- The configurator store is still in-memory only (not in `localStorage`); the model must be re-loaded each session before a localStorage-restored workflow fully re-links.

---

## Definition of done

- Targets, parts, and visibility re-link after reloading the same model. ✅
- Part groups are written to and read from both the JSON file and the ZIP package. ✅
- `tsc -b` and `vite build` pass. ✅
