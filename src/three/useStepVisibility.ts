/**
 * useStepVisibility
 *
 * Drives mesh visibility from the workflow while previewing/presenting a guide.
 *
 * Cumulative model: the authoring visibility (each ConfigMesh.visible) is the
 * baseline. Entering preview, we replay every step's show/hide actions from
 * step 0 up to the current preview step, layering them in order. Stepping
 * forward/back recomputes from the baseline so the result is always correct.
 *
 * Visibility is applied directly to the THREE meshes (ref.visible) so it does
 * not disturb the author's saved state. On exit the baseline is restored.
 */

import { useEffect } from 'react';
import { useWorkflowStore } from '../store/workflow.store';
import { useConfiguratorStore } from '../store/configurator.store';

export function useStepVisibility() {
  const meshes = useConfiguratorStore((s) => s.meshes);
  const partGroups = useConfiguratorStore((s) => s.partGroups);

  const isPreviewMode = useWorkflowStore((s) => s.isPreviewMode);
  const previewStepIndex = useWorkflowStore((s) => s.previewStepIndex);
  const workflow = useWorkflowStore((s) => s.workflow);
  const steps = useWorkflowStore((s) => s.steps);

  useEffect(() => {
    const applyBaseline = () => {
      for (const m of meshes) m.ref.visible = m.visible;
    };

    if (!isPreviewMode || !workflow) {
      applyBaseline();
      return;
    }

    // Start from the author's baseline visibility.
    const visibleMap = new Map<string, boolean>();
    for (const m of meshes) visibleMap.set(m.id, m.visible);

    const resolveMeshIds = (kind: 'mesh' | 'group', targetId: string): string[] => {
      if (kind === 'mesh') return [targetId];
      const group = partGroups.find((g) => g.id === targetId);
      return group ? group.meshIds : [];
    };

    // Replay steps 0..previewStepIndex inclusive.
    for (let i = 0; i <= previewStepIndex && i < workflow.stepIds.length; i++) {
      const step = steps[workflow.stepIds[i]];
      if (!step?.visibility) continue;
      for (const act of step.visibility) {
        for (const meshId of resolveMeshIds(act.targetKind, act.targetId)) {
          visibleMap.set(meshId, act.action === 'show');
        }
      }
    }

    for (const m of meshes) {
      m.ref.visible = visibleMap.get(m.id) ?? m.visible;
    }
  }, [isPreviewMode, previewStepIndex, workflow, steps, meshes, partGroups]);

  // Restore author baseline on unmount.
  useEffect(() => {
    return () => {
      for (const m of meshes) m.ref.visible = m.visible;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
