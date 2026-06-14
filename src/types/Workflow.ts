/**
 * Workflow domain types
 *
 * Workflow  ->  Steps  ->  Targets  ->  Annotations
 */

export interface Workflow {
  id: string;
  name: string;
  description: string;
  stepIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Step {
  id: string;
  workflowId: string;
  title: string;
  instruction: string;
  /** Optional reference image (base64 data URL) */
  imageDataUrl?: string;
  targetIds: string[];
  annotationIds: string[];
  /** Cumulative show/hide actions applied when this step is reached in preview. */
  visibility?: VisibilityAction[];
  /** Optional saved camera framing for this step. */
  camera?: StepCamera;
  order: number;
}

/** A saved camera viewpoint (world-space) used to frame a step. */
export interface StepCamera {
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
}

/**
 * A single visibility change recorded on a step. Applied cumulatively in preview:
 * stepping forward layers each step's actions on top of the previous state.
 */
export interface VisibilityAction {
  id: string;
  /** Whether the target is a single mesh or a tagged part group. */
  targetKind: 'mesh' | 'group';
  /** ConfigMesh id (mesh) or PartGroup id (group). */
  targetId: string;
  /** Display name snapshot, so the action reads correctly even if the source is renamed. */
  targetName: string;
  action: 'show' | 'hide';
}

export interface Target {
  id: string;
  stepId: string;
  meshId: string;
  meshName: string;
}

/**
 * An Annotation is a labelled 3D callout pinned to a surface point.
 * In the 3D viewer it renders as a billboard card: image + instruction + label,
 * connected to the world-space position by a visible leader line.
 */
export interface Annotation {
  id: string;
  stepId: string;
  targetId: string;
  /** Short location label shown as the card header (e.g. "Panel screw A") */
  label: string;
  /** Optional reference photo shown at the top of the callout card */
  imageDataUrl?: string;
  /** Operator instruction shown in the callout card (e.g. "Remove these 3 ribs") */
  instruction?: string;
  position: { x: number; y: number; z: number };
}
