/**
 * Persistence Service — Slice 08
 *
 * Browser-only helpers for workflow file I/O.
 * No backend, no cloud — localStorage (via Zustand persist) and JSON file download/upload only.
 */

import type { Workflow, Step, Target, Annotation } from '../types/Workflow';
import type { PartGroup } from '../types/PartGroup';

// ---------------------------------------------------------------------------
// Snapshot type (the shape we write to disk / send to localStorage)
// ---------------------------------------------------------------------------

export interface WorkflowSnapshot {
  /** Bumped when the schema changes so loaders can reject stale files. */
  version: 1;
  exportedAt: number;
  workflow: Workflow | null;
  steps: Record<string, Step>;
  targets: Record<string, Target>;
  annotations: Record<string, Annotation>;
  /** Logical part groups (optional; absent in older files). */
  partGroups?: PartGroup[];
}

// ---------------------------------------------------------------------------
// Download
// ---------------------------------------------------------------------------

/**
 * Serialise `snapshot` to a pretty-printed JSON file and trigger a browser
 * "Save file" download without any server round-trip.
 */
export function downloadWorkflowJSON(
  snapshot: WorkflowSnapshot,
  filename?: string,
): void {
  const name =
    filename ??
    `${(snapshot.workflow?.name ?? 'workflow').replace(/\s+/g, '_')}.showatec.json`;

  const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
    type: 'application/json',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  // Must be in the DOM for Firefox and some Chromium builds to honour the click
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke after a tick so the browser has time to initiate the download
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

// ---------------------------------------------------------------------------
// Upload / parse
// ---------------------------------------------------------------------------

/**
 * Read a File object (from <input type="file">) and parse it as a
 * WorkflowSnapshot.  Throws a descriptive Error on any parse or
 * validation failure so callers can show the message to the user.
 */
export async function readWorkflowJSON(file: File): Promise<WorkflowSnapshot> {
  if (!file.name.endsWith('.json') && !file.name.endsWith('.showatec.json')) {
    throw new Error('Please select a .json or .showatec.json file.');
  }

  const text = await file.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('File is not valid JSON.');
  }

  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid workflow file: expected a JSON object.');
  }

  const obj = data as Record<string, unknown>;

  if (obj['version'] !== 1) {
    throw new Error(
      `Unsupported workflow file version: ${obj['version']}. Expected 1.`,
    );
  }

  // Validate `workflow` key existence (it may legitimately be null, but must be present)
  if (!('workflow' in obj)) {
    throw new Error('Invalid workflow file: missing "workflow" field.');
  }

  // Minimal shape check — enough to prevent silent data corruption.
  // Also reject arrays, which satisfy `typeof x === "object"` but are not record maps.
  if (typeof obj['steps'] !== 'object' || obj['steps'] === null || Array.isArray(obj['steps'])) {
    throw new Error('Invalid workflow file: "steps" must be an object map.');
  }
  if (typeof obj['targets'] !== 'object' || obj['targets'] === null || Array.isArray(obj['targets'])) {
    throw new Error('Invalid workflow file: "targets" must be an object map.');
  }
  if (typeof obj['annotations'] !== 'object' || obj['annotations'] === null || Array.isArray(obj['annotations'])) {
    throw new Error('Invalid workflow file: "annotations" must be an object map.');
  }

  return obj as unknown as WorkflowSnapshot;
}
