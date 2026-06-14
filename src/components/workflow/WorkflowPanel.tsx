/**
 * WorkflowPanel
 */

import { useEffect, useRef, useState } from 'react';
import {
  Plus, Trash2, ChevronRight, GitBranch, ArrowUp, ArrowDown,
  Target as TargetIcon, X, MessageSquarePlus, MapPin, Ban,
  Play, Download, Upload, CheckCircle2, ImagePlus, ChevronDown, Eye, EyeOff,
  Camera, ArrowLeftRight,
} from 'lucide-react';
import { useWorkflowStore } from '../../store/workflow.store';
import { useConfiguratorStore } from '../../store/configurator.store';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { InstructionEditor } from './InstructionEditor';
import { readWorkflowJSON } from '../../services/persistence.service';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../ui/alert-dialog';
import type { Annotation, VisibilityAction } from '../../types/Workflow';

// ---------------------------------------------------------------------------
// New Workflow form
// ---------------------------------------------------------------------------

function NewWorkflowForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('');
  const createWorkflow = useWorkflowStore((s) => s.createWorkflow);

  function handleCreate() {
    createWorkflow(name || 'Untitled Workflow');
    onDone();
  }

  return (
    <div className="flex flex-col gap-2 px-3 py-3">
      <p className="text-xs text-muted-foreground">Workflow name</p>
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        placeholder="e.g. Engine Assembly"
        className="h-8 text-sm"
      />
      <div className="flex gap-2">
        <Button size="sm" className="flex-1" onClick={handleCreate}>Create</Button>
        <Button size="sm" variant="outline" className="flex-1" onClick={onDone}>Cancel</Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function NoWorkflow({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-3">
      <GitBranch className="w-8 h-8 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">
        No workflow yet. Create one to start authoring steps.
      </p>
      <Button size="sm" variant="outline" onClick={onNew}>
        <Plus className="w-4 h-4 mr-1" />
        New Workflow
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// StepRow
// ---------------------------------------------------------------------------

function StepRow({
  stepId, index, total, isActive, onSelect, onRemove, onMoveUp, onMoveDown,
}: {
  stepId: string; index: number; total: number; isActive: boolean;
  onSelect: () => void; onRemove: () => void; onMoveUp: () => void; onMoveDown: () => void;
}) {
  const step = useWorkflowStore((s) => s.steps[stepId]);
  if (!step) return null;

  return (
    <div
      className={`group flex items-center gap-1 px-2 py-1.5 rounded-sm cursor-pointer transition-colors duration-100 ${
        isActive ? 'bg-sky-500/15' : 'hover:bg-accent/10'
      }`}
      onClick={onSelect}
    >
      <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
        isActive ? 'bg-sky-500 text-white' : 'bg-muted text-muted-foreground'
      }`}>
        {index + 1}
      </span>

      <span className={`flex-1 text-xs font-medium truncate ${isActive ? 'text-sky-400' : 'text-foreground'}`}>
        {step.title}
      </span>

      <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
          disabled={index === 0}
          className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-default transition-colors"
          title="Move up">
          <ArrowUp className="w-3 h-3" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
          disabled={index === total - 1}
          className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-default transition-colors"
          title="Move down">
          <ArrowDown className="w-3 h-3" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="p-0.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          title="Remove step">
          <Trash2 className="w-3 h-3" />
        </button>
      </span>

      <ChevronRight className={`w-3 h-3 flex-shrink-0 transition-transform text-muted-foreground ${isActive ? 'rotate-90' : ''}`} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// AnnotationRow — expandable: label rename + image upload + instruction text
// ---------------------------------------------------------------------------

function AnnotationRow({
  annotation, onRemove,
}: {
  annotation: Annotation; onRemove: () => void;
}) {
  const updateAnnotation = useWorkflowStore((s) => s.updateAnnotation);
  const [expanded, setExpanded] = useState(false);
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelDraft, setLabelDraft] = useState(annotation.label);
  const [instructionDraft, setInstructionDraft] = useState(annotation.instruction ?? '');
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function commitLabel() {
    const trimmed = labelDraft.trim() || annotation.label;
    updateAnnotation(annotation.id, { label: trimmed });
    setEditingLabel(false);
  }

  function commitInstruction() {
    updateAnnotation(annotation.id, { instruction: instructionDraft });
  }

  function processImageFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') updateAnnotation(annotation.id, { imageDataUrl: result });
    };
    reader.readAsDataURL(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file);
  }

  return (
    <div className="rounded border border-border/40 bg-muted/20 overflow-hidden text-xs">
      {/* Header row */}
      <div className="flex items-center gap-1 px-2 py-1">
        <MapPin className="w-3 h-3 text-sky-400 flex-shrink-0" />

        {editingLabel ? (
          <input
            autoFocus value={labelDraft}
            onChange={(e) => setLabelDraft(e.target.value)}
            onBlur={commitLabel}
            onKeyDown={(e) => { if (e.key === 'Enter') commitLabel(); if (e.key === 'Escape') setEditingLabel(false); }}
            className="flex-1 bg-transparent border-b border-sky-400 text-foreground text-xs focus:outline-none"
          />
        ) : (
          <button onClick={() => { setLabelDraft(annotation.label); setEditingLabel(true); }}
            className="flex-1 text-left text-foreground truncate hover:text-sky-400 transition-colors"
            title="Click to rename">
            {annotation.label || 'Annotation'}
          </button>
        )}

        {/* Expand toggle */}
        <button onClick={() => setExpanded((v) => !v)}
          className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
          title={expanded ? 'Collapse' : 'Add image & instruction'}>
          <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>

        <button onClick={onRemove}
          className="flex-shrink-0 p-0.5 rounded text-muted-foreground hover:text-destructive transition-colors"
          title="Remove annotation">
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="flex flex-col gap-2 px-2 pb-2 border-t border-border/30 pt-2">

          {/* Image upload */}
          <div>
            <p className="text-[9px] uppercase text-muted-foreground tracking-wide mb-1">Reference Photo</p>

            {annotation.imageDataUrl ? (
              <div className="relative rounded overflow-hidden border border-border/40">
                <img src={annotation.imageDataUrl} alt="ref"
                  className="w-full max-h-28 object-contain bg-black/10" />
                <button onClick={() => updateAnnotation(annotation.id, { imageDataUrl: undefined })}
                  className="absolute top-1 right-1 p-0.5 rounded bg-background/80 text-muted-foreground hover:text-destructive transition-colors"
                  title="Remove photo">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div
                className={`flex flex-col items-center justify-center gap-1 px-2 py-3 rounded border border-dashed cursor-pointer transition-colors
                  ${dragging ? 'border-sky-400 bg-sky-400/10' : 'border-border/40 hover:border-sky-400/50 hover:bg-accent/5'}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
              >
                <ImagePlus className="w-4 h-4 text-muted-foreground/50" />
                <p className="text-[10px] text-muted-foreground text-center leading-tight">
                  Drop JPG/PNG or click
                </p>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={handleFileChange} />
          </div>

          {/* Instruction */}
          <div>
            <p className="text-[9px] uppercase text-muted-foreground tracking-wide mb-1">Operator Instruction</p>
            <textarea
              value={instructionDraft}
              onChange={(e) => setInstructionDraft(e.target.value)}
              onBlur={commitInstruction}
              placeholder='e.g. "Remove these 3 bolts" or "Press the red button"'
              rows={3}
              className="w-full bg-background/50 border border-border/40 rounded text-[10px] text-foreground placeholder:text-muted-foreground/50 px-2 py-1.5 resize-none focus:outline-none focus:border-sky-400/60 transition-colors"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function AnnotationsSection({
  stepAnnotationIds, annotations, isPlacing, onPlace, onCancelPlace, onRemove,
}: {
  stepAnnotationIds: string[]; annotations: Record<string, Annotation>;
  isPlacing: boolean; onPlace: () => void; onCancelPlace: () => void;
  onRemove: (id: string) => void;
}) {
  const stepAnnotations = stepAnnotationIds.map((id) => annotations[id]).filter(Boolean);

  return (
    <div>
      <label className="text-[10px] uppercase text-muted-foreground tracking-wide block mb-1">
        Annotations ({stepAnnotations.length})
      </label>

      {stepAnnotations.length > 0 && (
        <div className="flex flex-col gap-1 mb-2">
          {stepAnnotations.map((ann) => (
            <AnnotationRow
              key={ann.id}
              annotation={ann}
              onRemove={() => onRemove(ann.id)}
            />
          ))}
        </div>
      )}

      {isPlacing ? (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-sky-500/10 border border-sky-500/30 text-xs text-sky-400">
            <MapPin className="w-3 h-3 flex-shrink-0 animate-pulse" />
            <span>Click on the model to place. Esc cancels.</span>
          </div>
          <Button size="sm" variant="outline" className="w-full text-xs h-7" onClick={onCancelPlace}>
            <Ban className="w-3 h-3 mr-1" />
            Cancel Placement
          </Button>
        </div>
      ) : (
        <Button size="sm" variant="outline" className="w-full text-xs h-7" onClick={onPlace}>
          <MessageSquarePlus className="w-3 h-3 mr-1" />
          Place Annotation
        </Button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// StepImageUpload — Enhancement 3 (step-level reference image)
// ---------------------------------------------------------------------------

function StepImageUpload({
  imageDataUrl, onUpdate,
}: {
  stepId: string; imageDataUrl?: string; onUpdate: (url: string | undefined) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function processFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') onUpdate(result);
    };
    reader.readAsDataURL(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  return (
    <div>
      <label className="text-[10px] uppercase text-muted-foreground tracking-wide block mb-1">
        Reference Image
      </label>

      {imageDataUrl ? (
        <div className="relative rounded overflow-hidden border border-border/50">
          <img src={imageDataUrl} alt="Step reference"
            className="w-full max-h-40 object-contain bg-black/10" />
          <button onClick={() => onUpdate(undefined)}
            className="absolute top-1 right-1 p-0.5 rounded bg-background/80 text-muted-foreground hover:text-destructive transition-colors"
            title="Remove image">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div
          className={`flex flex-col items-center justify-center gap-1.5 px-3 py-4 rounded border border-dashed cursor-pointer transition-colors
            ${dragging ? 'border-sky-400 bg-sky-400/10' : 'border-border/50 hover:border-sky-400/50 hover:bg-accent/5'}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <ImagePlus className="w-5 h-5 text-muted-foreground/60" />
          <p className="text-[11px] text-muted-foreground text-center leading-tight">
            Drop a JPG/PNG here<br />or click to browse
          </p>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
        onChange={handleFileChange} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// VisibilitySection — per-step cumulative show/hide of meshes & parts
// ---------------------------------------------------------------------------

function ActionChip({ action, onRemove }: { action: VisibilityAction; onRemove: () => void }) {
  const show = action.action === 'show';
  return (
    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border ${
      show
        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
        : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
    }`}>
      {show ? <Eye className="w-3 h-3 flex-shrink-0" /> : <EyeOff className="w-3 h-3 flex-shrink-0" />}
      <span className="truncate max-w-[8rem]">{action.targetName}</span>
      <button onClick={onRemove} className="p-0.5 rounded hover:text-foreground transition-colors" title="Remove">
        <X className="w-2.5 h-2.5" />
      </button>
    </div>
  );
}

function VisibilitySection({ stepId, visibility }: { stepId: string; visibility: VisibilityAction[] }) {
  const meshes = useConfiguratorStore((s) => s.meshes);
  const partGroups = useConfiguratorStore((s) => s.partGroups);
  const selectedMeshIds = useConfiguratorStore((s) => s.selectedMeshIds);
  const addVisibilityAction = useWorkflowStore((s) => s.addVisibilityAction);
  const removeVisibilityAction = useWorkflowStore((s) => s.removeVisibilityAction);

  const [hideSel, setHideSel] = useState('');
  const [showSel, setShowSel] = useState('');

  function applySwap() {
    if (hideSel) {
      const g = partGroups.find((p) => p.id === hideSel);
      if (g) addVisibilityAction(stepId, 'hide', 'group', g.id, g.name);
    }
    if (showSel) {
      const g = partGroups.find((p) => p.id === showSel);
      if (g) addVisibilityAction(stepId, 'show', 'group', g.id, g.name);
    }
    setHideSel('');
    setShowSel('');
  }

  const selectedMeshes = selectedMeshIds
    .map((id) => meshes.find((m) => m.id === id))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));

  function addForSelected(action: 'show' | 'hide') {
    for (const m of selectedMeshes) {
      addVisibilityAction(stepId, action, 'mesh', m.id, m.name);
    }
  }

  return (
    <div>
      <label className="text-[10px] uppercase text-muted-foreground tracking-wide block mb-1">
        Visibility — cumulative ({visibility.length})
      </label>

      {visibility.length > 0 ? (
        <div className="flex flex-wrap gap-1 mb-2">
          {visibility.map((a) => (
            <ActionChip key={a.id} action={a} onRemove={() => removeVisibilityAction(stepId, a.id)} />
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground mb-2">
          No visibility changes. Add show/hide actions below — they carry forward through the guide.
        </p>
      )}

      {selectedMeshes.length > 0 && (
        <div className="flex items-center gap-1 mb-1.5">
          <span className="text-[10px] text-muted-foreground flex-1 truncate">
            {selectedMeshes.length} selected mesh{selectedMeshes.length !== 1 ? 'es' : ''}
          </span>
          <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 gap-1 text-emerald-400 border-emerald-400/40 hover:bg-emerald-400/10"
            onClick={() => addForSelected('show')}>
            <Eye className="w-3 h-3" /> Show
          </Button>
          <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 gap-1 text-rose-400 border-rose-400/40 hover:bg-rose-400/10"
            onClick={() => addForSelected('hide')}>
            <EyeOff className="w-3 h-3" /> Hide
          </Button>
        </div>
      )}

      {partGroups.length >= 1 && (
        <div className="mb-1.5 rounded border border-border/40 bg-muted/20 px-2 py-1.5">
          <div className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-muted-foreground mb-1">
            <ArrowLeftRight className="w-3 h-3" /> One-step swap
          </div>
          <div className="flex items-center gap-1">
            <select value={hideSel} onChange={(e) => setHideSel(e.target.value)}
              className="flex-1 min-w-0 bg-background/60 border border-border/40 rounded text-[10px] text-foreground px-1 py-1 focus:outline-none focus:border-rose-400/60">
              <option value="">Hide part…</option>
              {partGroups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <select value={showSel} onChange={(e) => setShowSel(e.target.value)}
              className="flex-1 min-w-0 bg-background/60 border border-border/40 rounded text-[10px] text-foreground px-1 py-1 focus:outline-none focus:border-emerald-400/60">
              <option value="">Show part…</option>
              {partGroups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <Button size="sm" variant="outline" className="h-7 px-2 text-[10px] flex-shrink-0"
              disabled={!hideSel && !showSel} onClick={applySwap}>
              Add
            </Button>
          </div>
        </div>
      )}

      {partGroups.length > 0 && (
        <div className="flex flex-col gap-1">
          {partGroups.map((g) => (
            <div key={g.id} className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted/30 text-xs">
              <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0 border border-black/20" style={{ backgroundColor: g.color }} />
              <span className="flex-1 truncate text-foreground">{g.name}</span>
              <button onClick={() => addVisibilityAction(stepId, 'show', 'group', g.id, g.name)}
                className="p-0.5 rounded text-muted-foreground hover:text-emerald-400 transition-colors" title="Show this part at this step">
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => addVisibilityAction(stepId, 'hide', 'group', g.id, g.name)}
                className="p-0.5 rounded text-muted-foreground hover:text-rose-400 transition-colors" title="Hide this part at this step">
                <EyeOff className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {partGroups.length === 0 && selectedMeshes.length === 0 && (
        <p className="text-[11px] text-muted-foreground italic">
          Select meshes in the viewport, or create parts in the Scene tab, to add visibility actions.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// StepEditor
// ---------------------------------------------------------------------------

function StepEditor({ stepId }: { stepId: string }) {
  const step = useWorkflowStore((s) => s.steps[stepId]);
  const targets = useWorkflowStore((s) => s.targets);
  const annotations = useWorkflowStore((s) => s.annotations);
  const updateStep = useWorkflowStore((s) => s.updateStep);
  const addTarget = useWorkflowStore((s) => s.addTarget);
  const removeTarget = useWorkflowStore((s) => s.removeTarget);
  const removeAnnotation = useWorkflowStore((s) => s.removeAnnotation);
  const isPlacingAnnotation = useWorkflowStore((s) => s.isPlacingAnnotation);
  const startAnnotationPlacement = useWorkflowStore((s) => s.startAnnotationPlacement);
  const cancelAnnotationPlacement = useWorkflowStore((s) => s.cancelAnnotationPlacement);

  const requestCameraCapture = useConfiguratorStore((s) => s.requestCameraCapture);
  const clearStepCamera = useWorkflowStore((s) => s.clearStepCamera);

  const selectedMeshId = useConfiguratorStore((s) => s.selectedMeshId);
  const meshes = useConfiguratorStore((s) => s.meshes);

  if (!step) return null;

  function handleTitleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const trimmed = e.target.value.trim();
    updateStep(stepId, { title: trimmed || step!.title });
  }

  const stepTargets = step.targetIds.map((id) => targets[id]).filter(Boolean);
  const selectedMesh = selectedMeshId ? meshes.find((m) => m.id === selectedMeshId) : null;
  const alreadyAssigned = stepTargets.some((t) => t.meshId === selectedMeshId);

  function handleAssignMesh() {
    if (!selectedMesh || alreadyAssigned) return;
    addTarget(stepId, selectedMesh.id, selectedMesh.name);
  }

  return (
    <div className="border-t border-border/50 pt-3 mt-1 flex flex-col gap-3 px-3 pb-3">
      {/* Title */}
      <div>
        <label className="text-[10px] uppercase text-muted-foreground tracking-wide block mb-1">Title</label>
        <Input
          defaultValue={step.title}
          key={stepId}
          onBlur={handleTitleBlur}
          className="h-7 text-xs font-medium"
          placeholder="Step title"
        />
      </div>

      {/* Instruction */}
      <div>
        <label className="text-[10px] uppercase text-muted-foreground tracking-wide block mb-1">Instruction</label>
        <InstructionEditor
          key={stepId}
          value={step.instruction}
          onChange={(html) => updateStep(stepId, { instruction: html })}
        />
      </div>

      {/* Reference image */}
      <StepImageUpload
        stepId={stepId}
        imageDataUrl={step.imageDataUrl}
        onUpdate={(url) => updateStep(stepId, { imageDataUrl: url })}
      />

      {/* Targets */}
      <div>
        <label className="text-[10px] uppercase text-muted-foreground tracking-wide block mb-1">
          Mesh Targets ({stepTargets.length})
        </label>

        {stepTargets.length > 0 ? (
          <div className="flex flex-col gap-1 mb-2">
            {stepTargets.map((target) => (
              <div key={target.id}
                className="flex items-center justify-between px-2 py-1 rounded bg-muted/40 text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <TargetIcon className="w-3 h-3 text-sky-400 flex-shrink-0" />
                  <span className="truncate text-foreground">{target.meshName}</span>
                </div>
                <button onClick={() => removeTarget(target.id)}
                  className="flex-shrink-0 ml-1 p-0.5 rounded text-muted-foreground hover:text-destructive transition-colors"
                  title="Remove target">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground mb-2">
            No targets yet. Click a mesh in the viewport then assign it.
          </p>
        )}

        {selectedMesh ? (
          <Button size="sm" variant="outline" className="w-full text-xs h-7"
            onClick={handleAssignMesh} disabled={alreadyAssigned}>
            <TargetIcon className="w-3 h-3 mr-1" />
            {alreadyAssigned ? `"${selectedMesh.name}" already assigned` : `Assign "${selectedMesh.name}"`}
          </Button>
        ) : (
          <p className="text-[11px] text-muted-foreground italic text-center">
            Select a mesh in the viewport to assign it as a target.
          </p>
        )}
      </div>

      {/* Camera view */}
      <div>
        <label className="text-[10px] uppercase text-muted-foreground tracking-wide block mb-1">Camera View</label>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" className="flex-1 text-xs h-7"
            onClick={() => requestCameraCapture()}>
            <Camera className="w-3 h-3 mr-1" />
            {step.camera ? 'Update saved view' : 'Capture current view'}
          </Button>
          {step.camera && (
            <Button size="sm" variant="outline" className="h-7 px-2 text-xs"
              onClick={() => clearStepCamera(stepId)} title="Clear saved camera">
              Clear
            </Button>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
          {step.camera
            ? 'Saved — the guide flies to this view on this step.'
            : 'Orbit/zoom to frame the part, then capture. Otherwise the guide auto-frames the targets.'}
        </p>
      </div>

      {/* Per-step visibility */}
      <VisibilitySection stepId={stepId} visibility={step.visibility ?? []} />

      {/* Annotations */}
      <AnnotationsSection
        stepAnnotationIds={step.annotationIds}
        annotations={annotations}
        isPlacing={isPlacingAnnotation}
        onPlace={() => startAnnotationPlacement(stepId)}
        onCancelPlace={cancelAnnotationPlacement}
        onRemove={removeAnnotation}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// SaveLoadBar
// ---------------------------------------------------------------------------

function SaveLoadBar() {
  const exportWorkflow = useWorkflowStore((s) => s.exportWorkflow);
  const importWorkflow = useWorkflowStore((s) => s.importWorkflow);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    try {
      const snapshot = await readWorkflowJSON(file);
      importWorkflow(snapshot);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to load file.');
    }
    e.target.value = '';
  }

  return (
    <div className="px-3 py-2 border-b border-border/50 flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-[10px] text-emerald-400">
          <CheckCircle2 className="w-3 h-3" />
          Auto-saved
        </span>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" className="h-6 text-[11px] gap-1 px-2"
            onClick={exportWorkflow} title="Download workflow as JSON file">
            <Download className="w-3 h-3" />
            Save file
          </Button>
          <Button size="sm" variant="outline" className="h-6 text-[11px] gap-1 px-2"
            onClick={() => fileInputRef.current?.click()} title="Load workflow from JSON file">
            <Upload className="w-3 h-3" />
            Load file
          </Button>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden"
            onChange={handleFileChange} />
        </div>
      </div>
      {importError && (
        <p className="text-[10px] text-destructive leading-tight">{importError}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// WorkflowView
// ---------------------------------------------------------------------------

function WorkflowView({ onNew }: { onNew: () => void }) {
  const workflow = useWorkflowStore((s) => s.workflow)!;
  const activeStepId = useWorkflowStore((s) => s.activeStepId);
  const addStep = useWorkflowStore((s) => s.addStep);
  const removeStep = useWorkflowStore((s) => s.removeStep);
  const reorderSteps = useWorkflowStore((s) => s.reorderSteps);
  const setActiveStep = useWorkflowStore((s) => s.setActiveStep);
  const updateWorkflow = useWorkflowStore((s) => s.updateWorkflow);
  const clearWorkflow = useWorkflowStore((s) => s.clearWorkflow);
  const enterPreview = useWorkflowStore((s) => s.enterPreview);
  const isPlacingAnnotation = useWorkflowStore((s) => s.isPlacingAnnotation);
  const cancelAnnotationPlacement = useWorkflowStore((s) => s.cancelAnnotationPlacement);

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(workflow.name);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isPlacingAnnotation) cancelAnnotationPlacement();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isPlacingAnnotation, cancelAnnotationPlacement]);

  function commitName() {
    updateWorkflow({ name: nameValue.trim() || workflow.name });
    setEditingName(false);
  }

  function moveStep(index: number, direction: -1 | 1) {
    const ids = [...workflow.stepIds];
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= ids.length) return;
    [ids[index], ids[swapIndex]] = [ids[swapIndex], ids[index]];
    reorderSteps(ids);
  }

  function handleAddStep() {
    const step = addStep();
    setActiveStep(step.id);
  }

  return (
    <div className="flex flex-col">
      {/* Workflow header */}
      <div className="px-3 py-3 border-b border-border/50">
        {editingName ? (
          <Input autoFocus value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') setEditingName(false); }}
            className="h-7 text-sm font-semibold" />
        ) : (
          <div className="flex items-center justify-between gap-2">
            <button onClick={() => { setNameValue(workflow.name); setEditingName(true); }}
              className="text-sm font-semibold text-foreground text-left truncate hover:text-sky-400 transition-colors"
              title="Click to rename">
              {workflow.name}
            </button>
            <button onClick={() => setConfirmDelete(true)}
              className="flex-shrink-0 p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Delete workflow">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-xs text-muted-foreground">
            {workflow.stepIds.length} step{workflow.stepIds.length !== 1 ? 's' : ''}
          </p>
          <Button size="sm" variant="outline"
            className="h-6 text-[11px] gap-1 px-2 text-amber-400 border-amber-400/40 hover:bg-amber-400/10"
            disabled={workflow.stepIds.length === 0}
            onClick={enterPreview}
            title={workflow.stepIds.length === 0 ? 'Add steps to preview' : 'Preview workflow'}>
            <Play className="w-3 h-3" />
            Preview
          </Button>
        </div>
      </div>

      <SaveLoadBar />

      {/* Step list */}
      <div className="flex flex-col py-1">
        {workflow.stepIds.length === 0 ? (
          <p className="px-3 py-4 text-xs text-muted-foreground text-center">
            No steps yet. Add your first step below.
          </p>
        ) : (
          workflow.stepIds.map((id, idx) => (
            <StepRow
              key={id} stepId={id} index={idx} total={workflow.stepIds.length}
              isActive={activeStepId === id}
              onSelect={() => setActiveStep(activeStepId === id ? null : id)}
              onRemove={() => removeStep(id)}
              onMoveUp={() => moveStep(idx, -1)}
              onMoveDown={() => moveStep(idx, 1)}
            />
          ))
        )}
      </div>

      {/* Add step */}
      <div className="px-3 py-2 border-t border-border/50">
        <Button size="sm" variant="outline" className="w-full" onClick={handleAddStep}>
          <Plus className="w-4 h-4 mr-1" />
          Add Step
        </Button>
      </div>

      {activeStepId && <StepEditor stepId={activeStepId} />}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete workflow?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove &ldquo;{workflow.name}&rdquo; and all its steps,
              targets, and annotations. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { clearWorkflow(); onNew(); }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root panel
// ---------------------------------------------------------------------------

export function WorkflowPanel() {
  const workflow = useWorkflowStore((s) => s.workflow);
  const [creating, setCreating] = useState(false);

  if (creating) return <NewWorkflowForm onDone={() => setCreating(false)} />;
  if (!workflow) return <NoWorkflow onNew={() => setCreating(true)} />;
  return <WorkflowView onNew={() => setCreating(true)} />;
}
