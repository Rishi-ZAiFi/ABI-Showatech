/**
 * PartGroup
 *
 * A logical "part" that bundles several meshes under one name + tag.
 * Lives in the configurator store alongside `meshes` (model-level metadata).
 * Visibility of the whole group can be toggled in a single step.
 */

export interface PartGroup {
  id: string;
  /** Human-friendly part name, e.g. "Left engine cowling" */
  name: string;
  /** Short category tag, e.g. "fastener", "panel", "assembly" */
  tag: string;
  /** Hex color used for the group swatch / tagging */
  color: string;
  /** ConfigMesh ids belonging to this part */
  meshIds: string[];
}

/** Default palette cycled through when new groups are created. */
export const PART_GROUP_COLORS = [
  '#38bdf8', // sky
  '#f59e0b', // amber
  '#34d399', // emerald
  '#a78bfa', // violet
  '#f472b6', // pink
  '#fb7185', // rose
  '#facc15', // yellow
  '#22d3ee', // cyan
] as const;
