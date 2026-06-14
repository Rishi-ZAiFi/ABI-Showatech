/**
 * PresenterOverlay
 *
 * Fullscreen presenter mode UI. Floats a step card over the 3D viewport.
 * Rendered inside the viewport wrapper so it sits on top of the canvas.
 *
 * Layout:
 *  - Top-right: thin "Exit Presenter" button
 *  - Bottom-left: step card (image, title, instructions, nav, progress)
 *  - Keyboard: ← / → navigate steps, Escape exits
 */

import { useEffect } from 'react';
import { useWorkflowStore } from '../../store/workflow.store';
import { ChevronLeft, ChevronRight, Ghost, X } from 'lucide-react';
import { Button } from '../ui/button';

export function PresenterOverlay() {
  const workflow = useWorkflowStore((s) => s.workflow);
  const steps = useWorkflowStore((s) => s.steps);
  const targets = useWorkflowStore((s) => s.targets);
  const previewStepIndex = useWorkflowStore((s) => s.previewStepIndex);
  const exitPresent = useWorkflowStore((s) => s.exitPresent);
  const nextPreviewStep = useWorkflowStore((s) => s.nextPreviewStep);
  const prevPreviewStep = useWorkflowStore((s) => s.prevPreviewStep);
  const ghostNonTargets = useWorkflowStore((s) => s.ghostNonTargets);
  const toggleGhostNonTargets = useWorkflowStore((s) => s.toggleGhostNonTargets);

  // Keyboard navigation
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextPreviewStep();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prevPreviewStep();
      if (e.key === 'Escape') exitPresent();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [nextPreviewStep, prevPreviewStep, exitPresent]);

  if (!workflow) return null;

  const totalSteps = workflow.stepIds.length;
  const stepId = workflow.stepIds[previewStepIndex];
  const step = stepId ? steps[stepId] : null;
  const progress = totalSteps > 0 ? ((previewStepIndex + 1) / totalSteps) * 100 : 0;

  const stepTargets = step
    ? step.targetIds.map((tid) => targets[tid]).filter(Boolean)
    : [];

  return (
    // Full-screen overlay wrapper (pointer-events: none so orbit still works behind the card)
    <div className="absolute inset-0 z-40 pointer-events-none">

      {/* ── Top-right controls ── */}
      <div className="absolute top-4 right-4 flex items-center gap-2 pointer-events-auto">
        <button
          onClick={toggleGhostNonTargets}
          aria-pressed={ghostNonTargets}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                     backdrop-blur-sm border transition-colors ${
                       ghostNonTargets
                         ? 'bg-amber-400/20 text-amber-300 border-amber-400/40 hover:bg-amber-400/30'
                         : 'bg-black/60 text-white/80 border-white/10 hover:text-white hover:bg-black/80'
                     }`}
          title={ghostNonTargets ? 'Ghosting on — dim non-target parts' : 'Ghosting off'}
        >
          <Ghost className="w-3.5 h-3.5" />
          Ghost
        </button>
        <button
          onClick={exitPresent}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                     bg-black/60 text-white/80 hover:text-white hover:bg-black/80
                     backdrop-blur-sm border border-white/10 transition-colors"
          title="Exit presenter (Esc)"
        >
          <X className="w-3.5 h-3.5" />
          Exit Presenter
        </button>
      </div>

      {/* ── Step counter strip — top center ── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full
                        bg-black/50 backdrop-blur-sm border border-white/10">
          {workflow.stepIds.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === previewStepIndex
                  ? 'bg-amber-400 scale-125'
                  : i < previewStepIndex
                  ? 'bg-amber-400/40'
                  : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── Step card — bottom left ── */}
      <div className="absolute bottom-6 left-6 w-80 pointer-events-auto">
        <div className="rounded-xl overflow-hidden border border-white/10 shadow-2xl
                        bg-black/65 backdrop-blur-md text-white">

          {/* Progress bar */}
          <div className="h-0.5 bg-white/10">
            <div
              className="h-full bg-amber-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="p-4 space-y-3">
            {/* Step badge + title */}
            <div className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-400 text-black
                               text-xs font-bold flex items-center justify-center mt-0.5">
                {previewStepIndex + 1}
              </span>
              <h2 className="text-sm font-semibold leading-snug text-white">
                {step?.title || 'Untitled Step'}
              </h2>
            </div>

            {/* Reference image */}
            {step?.imageDataUrl && (
              <div className="rounded-lg overflow-hidden border border-amber-400/20">
                <img
                  src={step.imageDataUrl}
                  alt="Step reference"
                  className="w-full max-h-36 object-contain bg-black/30"
                />
              </div>
            )}

            {/* Instruction */}
            {step?.instruction && (
              <div
                className={[
                  'text-xs text-white/80 leading-relaxed',
                  'prose prose-xs prose-invert max-w-none',
                  '[&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4',
                  '[&_li]:my-0.5',
                  '[&_strong]:font-semibold [&_em]:italic',
                  '[&_p]:my-0 [&_p+p]:mt-1',
                ].join(' ')}
                dangerouslySetInnerHTML={{ __html: step.instruction }}
              />
            )}

            {/* Focus area chips */}
            {stepTargets.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {stepTargets.map((t) => (
                  <span
                    key={t.id}
                    className="px-2 py-0.5 rounded text-[10px] font-medium
                               bg-amber-400/15 text-amber-300 border border-amber-400/25"
                  >
                    {t.meshName}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="px-4 pb-4 flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs gap-1 bg-white/5 border-white/15 text-white hover:bg-white/15"
              disabled={previewStepIndex === 0}
              onClick={prevPreviewStep}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Prev
            </Button>
            <span className="text-[10px] text-white/40 flex-shrink-0">
              {previewStepIndex + 1} / {totalSteps}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs gap-1 bg-white/5 border-white/15 text-white hover:bg-white/15"
              disabled={previewStepIndex >= totalSteps - 1}
              onClick={nextPreviewStep}
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
