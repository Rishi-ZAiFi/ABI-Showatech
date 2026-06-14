/**
 * PreviewPanel — Slice 07 (Enhanced)
 */

import { useWorkflowStore } from '../../store/workflow.store';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight, Ghost, X } from 'lucide-react';

export function PreviewPanel() {
  const workflow = useWorkflowStore((s) => s.workflow);
  const steps = useWorkflowStore((s) => s.steps);
  const targets = useWorkflowStore((s) => s.targets);
  const previewStepIndex = useWorkflowStore((s) => s.previewStepIndex);
  const exitPreview = useWorkflowStore((s) => s.exitPreview);
  const nextPreviewStep = useWorkflowStore((s) => s.nextPreviewStep);
  const prevPreviewStep = useWorkflowStore((s) => s.prevPreviewStep);
  const ghostNonTargets = useWorkflowStore((s) => s.ghostNonTargets);
  const toggleGhostNonTargets = useWorkflowStore((s) => s.toggleGhostNonTargets);

  if (!workflow) return null;

  const totalSteps = workflow.stepIds.length;
  const stepId = workflow.stepIds[previewStepIndex];
  const step = stepId ? steps[stepId] : null;

  const stepTargets = step
    ? step.targetIds.map((tid) => targets[tid]).filter(Boolean)
    : [];

  const progress = totalSteps > 0 ? ((previewStepIndex + 1) / totalSteps) * 100 : 0;

  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 shrink-0">
        <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">
          Preview Mode
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={`h-6 w-6 ${
              ghostNonTargets
                ? 'text-amber-400 hover:text-amber-300'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title={ghostNonTargets ? 'Ghosting on — dim non-target parts' : 'Ghosting off'}
            aria-pressed={ghostNonTargets}
            onClick={toggleGhostNonTargets}
          >
            <Ghost className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            title="Exit Preview"
            onClick={exitPreview}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted/30 shrink-0">
        <div
          className="h-full bg-amber-400 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step counter */}
      <div className="px-3 pt-3 pb-1 shrink-0">
        <span className="text-xs text-muted-foreground">
          Step {previewStepIndex + 1} of {totalSteps}
        </span>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-3">
        {step ? (
          <>
            {/* Title */}
            <h2 className="text-sm font-semibold text-foreground leading-snug">
              {step.title || 'Untitled Step'}
            </h2>

            {/* Reference image */}
            {step.imageDataUrl && (
              <div className="rounded overflow-hidden border border-amber-400/20">
                <img
                  src={step.imageDataUrl}
                  alt="Step reference"
                  className="w-full max-h-44 object-contain bg-black/20"
                />
              </div>
            )}

            {/* Instruction HTML */}
            {step.instruction ? (
              <div
                className={[
                  'text-xs text-foreground/90 leading-relaxed',
                  'prose prose-xs prose-invert max-w-none',
                  '[&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4',
                  '[&_li]:my-0.5',
                  '[&_strong]:font-semibold [&_em]:italic',
                  '[&_p]:my-0 [&_p+p]:mt-1',
                ].join(' ')}
                dangerouslySetInnerHTML={{ __html: step.instruction }}
              />
            ) : (
              <p className="text-xs text-muted-foreground italic">No instructions provided.</p>
            )}

            {/* Target mesh chips */}
            {stepTargets.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">
                  Focus areas ({stepTargets.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {stepTargets.map((t) => (
                    <span
                      key={t.id}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs
                                 bg-amber-400/10 text-amber-300 border border-amber-400/30"
                    >
                      {t.meshName}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-xs text-muted-foreground">No steps in this workflow.</p>
        )}
      </div>

      {/* Navigation */}
      <div className="shrink-0 px-3 py-2 border-t border-border/50 flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1"
          disabled={previewStepIndex === 0}
          onClick={prevPreviewStep}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Prev
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1"
          disabled={previewStepIndex >= totalSteps - 1}
          onClick={nextPreviewStep}
        >
          Next
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
