# Slice 11 — Part Grouping & Multi-Select

> Status: ✅ Done (post-POC, 2026-06-14)

---

## Objective

Let authors tag several meshes as a single logical **part** so they can be selected, named, recoloured, and shown/hidden as one unit. Raw GLB models arrive as a flat list of meshes; a real "part" (e.g. a cowling, a bracket assembly) is usually several meshes that should behave together.

---

## Implementation

### Domain type

`src/types/PartGroup.ts` (new)

```ts
export interface PartGroup {
  id: string;
  name: string;   // "Left engine cowling"
  tag: string;    // short category, e.g. "fastener" | "panel"
  color: string;  // hex swatch, cycled from PART_GROUP_COLORS
  meshIds: string[];
}
```

`PART_GROUP_COLORS` is an 8-colour palette cycled as new groups are created.

### Store (configurator)

`src/store/configurator.store.ts`

New state:

- `selectedMeshIds: string[]` — multi-selection (the existing `selectedMeshId` remains the single "primary" selection used by the Selection inspector).
- `partGroups: PartGroup[]` — model-level metadata, held in memory alongside `meshes`.

New actions:

| Action | Purpose |
|--------|---------|
| `toggleMeshInSelection(meshId)` | Add/remove a mesh from the multi-selection (modifier-click) |
| `clearSelection()` | Empty the selection |
| `createPartGroup(name, meshIds, tag?)` | Create a group (auto-assigns a palette colour) |
| `updatePartGroup(id, patch)` | Rename / retag / recolour / change members |
| `removePartGroup(id)` | Delete a group |
| `togglePartGroupVisibility(id)` | **Show/hide every member mesh in one step** (if any member is visible → hide all; else show all) |
| `selectPartGroup(id)` | Select all of a group's meshes |
| `setPartGroups(groups)` | Replace all groups (used by import — see Slice 14) |

`setSelectedMeshId` keeps `selectedMeshIds` in sync (`id ? [id] : []`). `setMeshes` resets selection + groups when a new model loads.

### Selection interaction

`src/three/useMeshSelection.ts`

- Plain click → single select (replaces selection).
- **Shift / Ctrl / Cmd + click → toggle the mesh in/out of the multi-selection.**
- Click on empty space (no modifier) → clear selection.
- The overlay effect now iterates `selectedMeshIds` and draws a blue edge overlay on every selected mesh (previously a single mesh).

### UI

`src/components/configurator/PartsPanel.tsx` (new) — rendered as a new **"Parts" accordion** in the Scene tab (`Inspector.tsx`).

- "Create from selection": shows the selected-mesh count, a name field, and a **Group** button.
- Per-group row: colour swatch (opens an 8-colour picker), editable name + tag, member count, **crosshair** (select all members), **eye** (show/hide the whole part in one step), and delete.

`MeshPanel.tsx` updated so its rows reflect the multi-selection and support modifier-click.

---

## Files changed

| File | Change |
|------|--------|
| `src/types/PartGroup.ts` | New — `PartGroup` type + colour palette |
| `src/components/configurator/PartsPanel.tsx` | New — parts management UI |
| `src/store/configurator.store.ts` | Multi-select state + part-group CRUD |
| `src/three/useMeshSelection.ts` | Modifier-click multi-select + multi-overlay |
| `src/components/configurator/MeshPanel.tsx` | Reflect multi-selection |
| `src/components/layout/Inspector.tsx` | "Parts" accordion in the Scene tab |

---

## Definition of done

- Multiple meshes can be selected at once and grouped into a named, tagged part. ✅
- A whole part can be hidden/shown with a single click. ✅
- `tsc -b` and `vite build` pass. ✅
