/**
 * Tests for the Workflow store — the core domain model that drives
 * step authoring, targets, annotations, preview/present navigation,
 * per-step visibility, camera capture and import/export.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { useWorkflowStore } from './workflow.store';
import { useConfiguratorStore } from './configurator.store';
import { downloadWorkflowJSON, type WorkflowSnapshot } from '../services/persistence.service';

// Mock only the download side-effect; keep the rest of the module real.
vi.mock('../services/persistence.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/persistence.service')>();
  return { ...actual, downloadWorkflowJSON: vi.fn() };
});

function resetStores() {
  useWorkflowStore.setState({
    workflow: null,
    steps: {},
    targets: {},
    annotations: {},
    activeStepId: null,
    isPlacingAnnotation: false,
    placeAnnotationStepId: null,
    isPreviewMode: false,
    previewStepIndex: 0,
    isPresentMode: false,
    ghostNonTargets: true,
  });
  useConfiguratorStore.setState({ partGroups: [] });
  localStorage.clear();
  (downloadWorkflowJSON as Mock).mockClear();
}

const wf = () => useWorkflowStore.getState();

beforeEach(resetStores);

describe('createWorkflow', () => {
  it('creates a workflow with the given name and empty collections', () => {
    const created = wf().createWorkflow('Engine Teardown', 'desc');
    expect(created.name).toBe('Engine Teardown');
    expect(created.description).toBe('desc');
    expect(created.stepIds).toEqual([]);
    expect(created.createdAt).toBeTypeOf('number');
    expect(created.createdAt).toBe(created.updatedAt);
    expect(wf().workflow?.id).toBe(created.id);
  });

  it('trims the name and falls back to "Untitled Workflow" when blank', () => {
    expect(wf().createWorkflow('   ').name).toBe('Untitled Workflow');
    expect(wf().createWorkflow('  Trimmed  ').name).toBe('Trimmed');
  });

  it('resets steps/targets/annotations from any previous workflow', () => {
    wf().createWorkflow('A');
    wf().addStep('S1');
    wf().createWorkflow('B');
    expect(Object.keys(wf().steps)).toHaveLength(0);
    expect(wf().workflow?.name).toBe('B');
  });
});

describe('updateWorkflow', () => {
  it('patches fields and bumps updatedAt', async () => {
    const created = wf().createWorkflow('Old');
    await new Promise((r) => setTimeout(r, 2));
    wf().updateWorkflow({ name: 'New', description: 'd2' });
    expect(wf().workflow?.name).toBe('New');
    expect(wf().workflow?.description).toBe('d2');
    expect(wf().workflow!.updatedAt).toBeGreaterThanOrEqual(created.updatedAt);
  });

  it('is a no-op when there is no workflow', () => {
    expect(() => wf().updateWorkflow({ name: 'x' })).not.toThrow();
    expect(wf().workflow).toBeNull();
  });
});

describe('clearWorkflow', () => {
  it('wipes all workflow state', () => {
    wf().createWorkflow('A');
    wf().addStep();
    wf().clearWorkflow();
    expect(wf().workflow).toBeNull();
    expect(wf().steps).toEqual({});
    expect(wf().activeStepId).toBeNull();
    expect(wf().isPreviewMode).toBe(false);
  });
});

describe('addStep', () => {
  it('throws when there is no active workflow', () => {
    expect(() => wf().addStep()).toThrow(/No active workflow/);
  });

  it('appends steps with incrementing order and default titles', () => {
    wf().createWorkflow('A');
    const s1 = wf().addStep();
    const s2 = wf().addStep();
    expect(s1.title).toBe('Step 1');
    expect(s2.title).toBe('Step 2');
    expect(s1.order).toBe(0);
    expect(s2.order).toBe(1);
    expect(wf().workflow?.stepIds).toEqual([s1.id, s2.id]);
  });

  it('uses a provided, trimmed title', () => {
    wf().createWorkflow('A');
    expect(wf().addStep('  Remove cowling ').title).toBe('Remove cowling');
  });
});

describe('updateStep', () => {
  it('patches title / instruction / imageDataUrl', () => {
    wf().createWorkflow('A');
    const s = wf().addStep();
    wf().updateStep(s.id, { title: 'T2', instruction: '<p>hi</p>', imageDataUrl: 'data:img' });
    const updated = wf().steps[s.id];
    expect(updated.title).toBe('T2');
    expect(updated.instruction).toBe('<p>hi</p>');
    expect(updated.imageDataUrl).toBe('data:img');
  });

  it('is a no-op for an unknown step id', () => {
    wf().createWorkflow('A');
    expect(() => wf().updateStep('nope', { title: 'x' })).not.toThrow();
  });
});

describe('removeStep', () => {
  it('removes the step, cascades its targets + annotations, and reindexes order', () => {
    wf().createWorkflow('A');
    const s1 = wf().addStep();
    const s2 = wf().addStep();
    const s3 = wf().addStep();
    const t = wf().addTarget(s2.id, 'mesh-1', 'Mesh 1');
    const a = wf().addAnnotation(s2.id, t.id, 'Label', { x: 0, y: 0, z: 0 });

    wf().removeStep(s2.id);

    expect(wf().steps[s2.id]).toBeUndefined();
    expect(wf().targets[t.id]).toBeUndefined();
    expect(wf().annotations[a.id]).toBeUndefined();
    expect(wf().workflow?.stepIds).toEqual([s1.id, s3.id]);
    // s3 was index 2, now index 1
    expect(wf().steps[s3.id].order).toBe(1);
  });

  it('clears activeStepId when the active step is removed', () => {
    wf().createWorkflow('A');
    const s = wf().addStep();
    wf().setActiveStep(s.id);
    wf().removeStep(s.id);
    expect(wf().activeStepId).toBeNull();
  });
});

describe('reorderSteps', () => {
  it('reorders stepIds and rewrites order indices', () => {
    wf().createWorkflow('A');
    const s1 = wf().addStep();
    const s2 = wf().addStep();
    const s3 = wf().addStep();
    wf().reorderSteps([s3.id, s1.id, s2.id]);
    expect(wf().workflow?.stepIds).toEqual([s3.id, s1.id, s2.id]);
    expect(wf().steps[s3.id].order).toBe(0);
    expect(wf().steps[s1.id].order).toBe(1);
    expect(wf().steps[s2.id].order).toBe(2);
  });
});

describe('annotation placement mode', () => {
  it('starts and cancels placement', () => {
    wf().createWorkflow('A');
    const s = wf().addStep();
    wf().startAnnotationPlacement(s.id);
    expect(wf().isPlacingAnnotation).toBe(true);
    expect(wf().placeAnnotationStepId).toBe(s.id);
    wf().cancelAnnotationPlacement();
    expect(wf().isPlacingAnnotation).toBe(false);
    expect(wf().placeAnnotationStepId).toBeNull();
  });
});

describe('preview navigation', () => {
  it('does nothing when there are no steps', () => {
    wf().createWorkflow('A');
    wf().enterPreview();
    expect(wf().isPreviewMode).toBe(false);
  });

  it('enters at the first step and clamps next/prev to bounds', () => {
    wf().createWorkflow('A');
    const s1 = wf().addStep();
    const s2 = wf().addStep();
    wf().enterPreview();
    expect(wf().isPreviewMode).toBe(true);
    expect(wf().previewStepIndex).toBe(0);
    expect(wf().activeStepId).toBe(s1.id);

    wf().prevPreviewStep(); // already at 0 -> clamp
    expect(wf().previewStepIndex).toBe(0);

    wf().nextPreviewStep();
    expect(wf().previewStepIndex).toBe(1);
    expect(wf().activeStepId).toBe(s2.id);

    wf().nextPreviewStep(); // at last -> clamp
    expect(wf().previewStepIndex).toBe(1);

    wf().exitPreview();
    expect(wf().isPreviewMode).toBe(false);
    expect(wf().activeStepId).toBeNull();
  });
});

describe('present mode', () => {
  it('enters present (also preview) and exits cleanly', () => {
    wf().createWorkflow('A');
    wf().addStep();
    wf().enterPresent();
    expect(wf().isPresentMode).toBe(true);
    expect(wf().isPreviewMode).toBe(true);
    wf().exitPresent();
    expect(wf().isPresentMode).toBe(false);
    expect(wf().isPreviewMode).toBe(false);
  });
});

describe('targets', () => {
  it('adds and removes a target, keeping step.targetIds in sync', () => {
    wf().createWorkflow('A');
    const s = wf().addStep();
    const t = wf().addTarget(s.id, 'm1', 'Mesh 1');
    expect(wf().steps[s.id].targetIds).toContain(t.id);
    wf().removeTarget(t.id);
    expect(wf().targets[t.id]).toBeUndefined();
    expect(wf().steps[s.id].targetIds).not.toContain(t.id);
  });
});

describe('annotations', () => {
  it('adds, updates and removes an annotation', () => {
    wf().createWorkflow('A');
    const s = wf().addStep();
    const t = wf().addTarget(s.id, 'm1', 'Mesh 1');
    const a = wf().addAnnotation(s.id, t.id, 'Screw A', { x: 1, y: 2, z: 3 });
    expect(wf().steps[s.id].annotationIds).toContain(a.id);

    wf().updateAnnotation(a.id, { label: 'Screw B', instruction: 'Remove' });
    expect(wf().annotations[a.id].label).toBe('Screw B');
    expect(wf().annotations[a.id].instruction).toBe('Remove');

    wf().removeAnnotation(a.id);
    expect(wf().annotations[a.id]).toBeUndefined();
    expect(wf().steps[s.id].annotationIds).not.toContain(a.id);
  });
});

describe('per-step visibility actions', () => {
  it('keeps exactly one rule per target (later action replaces earlier)', () => {
    wf().createWorkflow('A');
    const s = wf().addStep();
    wf().addVisibilityAction(s.id, 'hide', 'mesh', 'm1', 'Mesh 1');
    wf().addVisibilityAction(s.id, 'show', 'mesh', 'm1', 'Mesh 1'); // same target
    const vis = wf().steps[s.id].visibility!;
    expect(vis).toHaveLength(1);
    expect(vis[0].action).toBe('show');
  });

  it('tracks distinct targets separately and supports removal', () => {
    wf().createWorkflow('A');
    const s = wf().addStep();
    wf().addVisibilityAction(s.id, 'hide', 'mesh', 'm1', 'Mesh 1');
    wf().addVisibilityAction(s.id, 'show', 'group', 'g1', 'Group 1');
    expect(wf().steps[s.id].visibility).toHaveLength(2);

    const meshAction = wf().steps[s.id].visibility!.find((v) => v.targetId === 'm1')!;
    wf().removeVisibilityAction(s.id, meshAction.id);
    const remaining = wf().steps[s.id].visibility!;
    expect(remaining).toHaveLength(1);
    expect(remaining[0].targetId).toBe('g1');
  });
});

describe('per-step camera', () => {
  it('sets and clears a saved camera', () => {
    wf().createWorkflow('A');
    const s = wf().addStep();
    wf().setStepCamera(s.id, {
      position: { x: 1, y: 2, z: 3 },
      target: { x: 0, y: 0, z: 0 },
    });
    expect(wf().steps[s.id].camera).toBeDefined();
    wf().clearStepCamera(s.id);
    expect(wf().steps[s.id].camera).toBeUndefined();
    expect('camera' in wf().steps[s.id]).toBe(false);
  });
});

describe('ghost toggle (ephemeral view preference)', () => {
  it('defaults on and can be set / toggled', () => {
    expect(wf().ghostNonTargets).toBe(true);
    wf().setGhostNonTargets(false);
    expect(wf().ghostNonTargets).toBe(false);
    wf().toggleGhostNonTargets();
    expect(wf().ghostNonTargets).toBe(true);
  });
});

describe('export / import', () => {
  it('export builds a snapshot including configurator part groups', () => {
    wf().createWorkflow('Export Me');
    wf().addStep();
    useConfiguratorStore.setState({
      partGroups: [{ id: 'g1', name: 'Cowling', tag: 'panel', color: '#fff', meshIds: ['m1'] }],
    });

    wf().exportWorkflow();

    expect(downloadWorkflowJSON as Mock).toHaveBeenCalledTimes(1);
    const snapshot = (downloadWorkflowJSON as Mock).mock.calls[0][0] as WorkflowSnapshot;
    expect(snapshot.version).toBe(1);
    expect(snapshot.workflow?.name).toBe('Export Me');
    expect(snapshot.partGroups).toHaveLength(1);
  });

  it('import replaces state and restores part groups', () => {
    const snapshot: WorkflowSnapshot = {
      version: 1,
      exportedAt: Date.now(),
      workflow: {
        id: 'w1',
        name: 'Imported',
        description: '',
        stepIds: ['s1'],
        createdAt: 1,
        updatedAt: 1,
      },
      steps: {
        s1: {
          id: 's1',
          workflowId: 'w1',
          title: 'Step 1',
          instruction: '',
          targetIds: [],
          annotationIds: [],
          order: 0,
        },
      },
      targets: {},
      annotations: {},
      partGroups: [{ id: 'g1', name: 'P', tag: '', color: '#fff', meshIds: ['m1'] }],
    };

    wf().importWorkflow(snapshot);

    expect(wf().workflow?.name).toBe('Imported');
    expect(wf().steps.s1.title).toBe('Step 1');
    expect(useConfiguratorStore.getState().partGroups).toHaveLength(1);
  });

  it('import tolerates a snapshot with no part groups', () => {
    const snapshot = {
      version: 1,
      exportedAt: 0,
      workflow: null,
      steps: {},
      targets: {},
      annotations: {},
    } as WorkflowSnapshot;
    wf().importWorkflow(snapshot);
    expect(useConfiguratorStore.getState().partGroups).toEqual([]);
  });
});
