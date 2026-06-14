/**
 * Workflow Store
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Workflow, Step, Target, Annotation, VisibilityAction, StepCamera } from '../types/Workflow';
import {
  downloadWorkflowJSON,
  type WorkflowSnapshot,
} from '../services/persistence.service';
import { useConfiguratorStore } from './configurator.store';

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export interface WorkflowState {
  workflow: Workflow | null;
  steps: Record<string, Step>;
  targets: Record<string, Target>;
  annotations: Record<string, Annotation>;

  activeStepId: string | null;
  isPlacingAnnotation: boolean;
  placeAnnotationStepId: string | null;
  isPreviewMode: boolean;
  previewStepIndex: number;
  isPresentMode: boolean;

  /** View preference (ephemeral, not persisted): dim non-target parts while previewing. */
  ghostNonTargets: boolean;
  setGhostNonTargets: (value: boolean) => void;
  toggleGhostNonTargets: () => void;

  createWorkflow: (name: string, description?: string) => Workflow;
  updateWorkflow: (patch: Partial<Pick<Workflow, 'name' | 'description'>>) => void;
  clearWorkflow: () => void;

  exportWorkflow: () => void;
  importWorkflow: (snapshot: WorkflowSnapshot) => void;

  addStep: (title?: string) => Step;
  updateStep: (stepId: string, patch: Partial<Pick<Step, 'title' | 'instruction' | 'imageDataUrl'>>) => void;
  removeStep: (stepId: string) => void;
  reorderSteps: (orderedStepIds: string[]) => void;
  setActiveStep: (stepId: string | null) => void;

  startAnnotationPlacement: (stepId: string) => void;
  cancelAnnotationPlacement: () => void;

  enterPreview: () => void;
  exitPreview: () => void;
  nextPreviewStep: () => void;
  prevPreviewStep: () => void;

  enterPresent: () => void;
  exitPresent: () => void;

  addTarget: (stepId: string, meshId: string, meshName: string) => Target;
  removeTarget: (targetId: string) => void;

  addAnnotation: (
    stepId: string,
    targetId: string,
    label: string,
    position: { x: number; y: number; z: number },
  ) => Annotation;
  updateAnnotation: (
    annotationId: string,
    patch: Partial<Pick<Annotation, 'label' | 'position' | 'imageDataUrl' | 'instruction'>>,
  ) => void;
  removeAnnotation: (annotationId: string) => void;

  addVisibilityAction: (
    stepId: string,
    action: 'show' | 'hide',
    targetKind: 'mesh' | 'group',
    targetId: string,
    targetName: string,
  ) => void;
  removeVisibilityAction: (stepId: string, actionId: string) => void;

  setStepCamera: (stepId: string, camera: StepCamera) => void;
  clearStepCamera: (stepId: string) => void;
}

const STORAGE_KEY = 'showatec-workflow-v1';

export const useWorkflowStore = create<WorkflowState>()(
  persist(
    (set, get) => ({
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

      setGhostNonTargets: (value) => set({ ghostNonTargets: value }),
      toggleGhostNonTargets: () => set((s) => ({ ghostNonTargets: !s.ghostNonTargets })),

      createWorkflow: (name, description = '') => {
        const now = Date.now();
        const workflow: Workflow = {
          id: uid(),
          name: name.trim() || 'Untitled Workflow',
          description,
          stepIds: [],
          createdAt: now,
          updatedAt: now,
        };
        set({ workflow, steps: {}, targets: {}, annotations: {}, activeStepId: null });
        return workflow;
      },

      updateWorkflow: (patch) => {
        set((state) => {
          if (!state.workflow) return {};
          return { workflow: { ...state.workflow, ...patch, updatedAt: Date.now() } };
        });
      },

      clearWorkflow: () =>
        set({
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
        }),

      exportWorkflow: () => {
        const { workflow, steps, targets, annotations } = get();
        const snapshot: WorkflowSnapshot = {
          version: 1,
          exportedAt: Date.now(),
          workflow,
          steps,
          targets,
          annotations,
          partGroups: useConfiguratorStore.getState().partGroups,
        };
        downloadWorkflowJSON(snapshot);
      },

      importWorkflow: (snapshot) => {
        set({
          workflow: snapshot.workflow,
          steps: snapshot.steps,
          targets: snapshot.targets,
          annotations: snapshot.annotations,
          activeStepId: null,
          isPlacingAnnotation: false,
          placeAnnotationStepId: null,
          isPreviewMode: false,
          previewStepIndex: 0,
          isPresentMode: false,
        });
        // Restore part groups (load the matching model first so mesh ids line up).
        useConfiguratorStore.getState().setPartGroups(snapshot.partGroups ?? []);
      },

      addStep: (title = '') => {
        const state = get();
        if (!state.workflow) throw new Error('No active workflow');
        const order = state.workflow.stepIds.length;
        const step: Step = {
          id: uid(),
          workflowId: state.workflow.id,
          title: title.trim() || `Step ${order + 1}`,
          instruction: '',
          targetIds: [],
          annotationIds: [],
          order,
        };
        set((s) => ({
          steps: { ...s.steps, [step.id]: step },
          workflow: s.workflow
            ? { ...s.workflow, stepIds: [...s.workflow.stepIds, step.id], updatedAt: Date.now() }
            : s.workflow,
        }));
        return step;
      },

      updateStep: (stepId, patch) => {
        set((state) => {
          const step = state.steps[stepId];
          if (!step) return {};
          return { steps: { ...state.steps, [stepId]: { ...step, ...patch } } };
        });
      },

      removeStep: (stepId) => {
        set((state) => {
          if (!state.workflow) return {};
          const step = state.steps[stepId];
          const targetIdsToRemove = step ? new Set(step.targetIds) : new Set<string>();
          const annotationIdsToRemove = step ? new Set(step.annotationIds) : new Set<string>();
          const newSteps = { ...state.steps };
          delete newSteps[stepId];
          const newTargets = Object.fromEntries(
            Object.entries(state.targets).filter(([id]) => !targetIdsToRemove.has(id)),
          );
          const newAnnotations = Object.fromEntries(
            Object.entries(state.annotations).filter(([id]) => !annotationIdsToRemove.has(id)),
          );
          const newStepIds = state.workflow.stepIds.filter((id) => id !== stepId);
          newStepIds.forEach((id, idx) => {
            if (newSteps[id]) newSteps[id] = { ...newSteps[id], order: idx };
          });
          return {
            steps: newSteps,
            targets: newTargets,
            annotations: newAnnotations,
            workflow: { ...state.workflow, stepIds: newStepIds, updatedAt: Date.now() },
            activeStepId: state.activeStepId === stepId ? null : state.activeStepId,
          };
        });
      },

      reorderSteps: (orderedStepIds) => {
        set((state) => {
          if (!state.workflow) return {};
          const newSteps = { ...state.steps };
          orderedStepIds.forEach((id, idx) => {
            if (newSteps[id]) newSteps[id] = { ...newSteps[id], order: idx };
          });
          return {
            steps: newSteps,
            workflow: { ...state.workflow, stepIds: orderedStepIds, updatedAt: Date.now() },
          };
        });
      },

      setActiveStep: (stepId) => set({ activeStepId: stepId }),

      startAnnotationPlacement: (stepId) =>
        set({ isPlacingAnnotation: true, placeAnnotationStepId: stepId }),

      cancelAnnotationPlacement: () =>
        set({ isPlacingAnnotation: false, placeAnnotationStepId: null }),

      enterPreview: () => {
        const { workflow } = get();
        if (!workflow || workflow.stepIds.length === 0) return;
        const firstStepId = workflow.stepIds[0];
        set({
          isPreviewMode: true,
          previewStepIndex: 0,
          activeStepId: firstStepId,
          isPlacingAnnotation: false,
          placeAnnotationStepId: null,
        });
      },

      exitPreview: () =>
        set({ isPreviewMode: false, previewStepIndex: 0, activeStepId: null, isPresentMode: false }),

      enterPresent: () => {
        const { workflow } = get();
        if (!workflow || workflow.stepIds.length === 0) return;
        const firstStepId = workflow.stepIds[0];
        set({
          isPreviewMode: true,
          isPresentMode: true,
          previewStepIndex: 0,
          activeStepId: firstStepId,
          isPlacingAnnotation: false,
          placeAnnotationStepId: null,
        });
      },

      exitPresent: () =>
        set({ isPresentMode: false, isPreviewMode: false, previewStepIndex: 0, activeStepId: null }),

      nextPreviewStep: () => {
        const { workflow, previewStepIndex } = get();
        if (!workflow) return;
        const nextIndex = previewStepIndex + 1;
        if (nextIndex >= workflow.stepIds.length) return;
        set({ previewStepIndex: nextIndex, activeStepId: workflow.stepIds[nextIndex] });
      },

      prevPreviewStep: () => {
        const { workflow, previewStepIndex } = get();
        if (!workflow) return;
        const prevIndex = previewStepIndex - 1;
        if (prevIndex < 0) return;
        set({ previewStepIndex: prevIndex, activeStepId: workflow.stepIds[prevIndex] });
      },

      addTarget: (stepId, meshId, meshName) => {
        const target: Target = { id: uid(), stepId, meshId, meshName };
        set((state) => {
          const step = state.steps[stepId];
          if (!step) return {};
          return {
            targets: { ...state.targets, [target.id]: target },
            steps: {
              ...state.steps,
              [stepId]: { ...step, targetIds: [...step.targetIds, target.id] },
            },
          };
        });
        return target;
      },

      removeTarget: (targetId) => {
        set((state) => {
          const target = state.targets[targetId];
          if (!target) return {};
          const step = state.steps[target.stepId];
          const newTargets = { ...state.targets };
          delete newTargets[targetId];
          return {
            targets: newTargets,
            steps: step
              ? {
                  ...state.steps,
                  [target.stepId]: {
                    ...step,
                    targetIds: step.targetIds.filter((id) => id !== targetId),
                  },
                }
              : state.steps,
          };
        });
      },

      addAnnotation: (stepId, targetId, label, position) => {
        const annotation: Annotation = { id: uid(), stepId, targetId, label, position };
        set((state) => {
          const step = state.steps[stepId];
          if (!step) return {};
          return {
            annotations: { ...state.annotations, [annotation.id]: annotation },
            steps: {
              ...state.steps,
              [stepId]: { ...step, annotationIds: [...step.annotationIds, annotation.id] },
            },
          };
        });
        return annotation;
      },

      updateAnnotation: (annotationId, patch) => {
        set((state) => {
          const ann = state.annotations[annotationId];
          if (!ann) return {};
          return { annotations: { ...state.annotations, [annotationId]: { ...ann, ...patch } } };
        });
      },

      removeAnnotation: (annotationId) => {
        set((state) => {
          const ann = state.annotations[annotationId];
          if (!ann) return {};
          const step = state.steps[ann.stepId];
          const newAnnotations = { ...state.annotations };
          delete newAnnotations[annotationId];
          return {
            annotations: newAnnotations,
            steps: step
              ? {
                  ...state.steps,
                  [ann.stepId]: {
                    ...step,
                    annotationIds: step.annotationIds.filter((id) => id !== annotationId),
                  },
                }
              : state.steps,
          };
        });
      },

      addVisibilityAction: (stepId, action, targetKind, targetId, targetName) => {
        set((state) => {
          const step = state.steps[stepId];
          if (!step) return {};
          const existing = step.visibility ?? [];
          // Drop any prior action on the same target so a step has one rule per target.
          const filtered = existing.filter(
            (a) => !(a.targetKind === targetKind && a.targetId === targetId),
          );
          const entry: VisibilityAction = {
            id: uid(),
            action,
            targetKind,
            targetId,
            targetName,
          };
          return {
            steps: {
              ...state.steps,
              [stepId]: { ...step, visibility: [...filtered, entry] },
            },
          };
        });
      },

      removeVisibilityAction: (stepId, actionId) => {
        set((state) => {
          const step = state.steps[stepId];
          if (!step?.visibility) return {};
          return {
            steps: {
              ...state.steps,
              [stepId]: {
                ...step,
                visibility: step.visibility.filter((a) => a.id !== actionId),
              },
            },
          };
        });
      },

      setStepCamera: (stepId, camera) => {
        set((state) => {
          const step = state.steps[stepId];
          if (!step) return {};
          return { steps: { ...state.steps, [stepId]: { ...step, camera } } };
        });
      },

      clearStepCamera: (stepId) => {
        set((state) => {
          const step = state.steps[stepId];
          if (!step) return {};
          const { camera: _omit, ...rest } = step;
          void _omit;
          return { steps: { ...state.steps, [stepId]: rest as typeof step } };
        });
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        workflow: state.workflow,
        steps: state.steps,
        targets: state.targets,
        annotations: state.annotations,
      }),
    },
  ),
);
