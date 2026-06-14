/**
 * Parts Panel
 *
 * Create and manage "parts" — logical groups of meshes tagged under one name.
 * - Multi-select meshes in the viewport (Shift/Ctrl-click) or Scene list, then group them.
 * - Each group can be shown/hidden as a single unit, recoloured, retagged, or deleted.
 */

import { useState } from 'react';
import { Boxes, Plus, Eye, EyeOff, Trash2, Crosshair, X, Check } from 'lucide-react';
import { useConfiguratorStore } from '../../store/configurator.store';
import { PART_GROUP_COLORS, type PartGroup } from '../../types/PartGroup';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

function CreateFromSelection() {
  const selectedMeshIds = useConfiguratorStore((s) => s.selectedMeshIds);
  const createPartGroup = useConfiguratorStore((s) => s.createPartGroup);
  const clearSelection = useConfiguratorStore((s) => s.clearSelection);
  const [name, setName] = useState('');

  const count = selectedMeshIds.length;

  function handleCreate() {
    if (count === 0) return;
    createPartGroup(name || `Part ${Date.now().toString().slice(-4)}`, selectedMeshIds);
    setName('');
    clearSelection();
  }

  if (count === 0) {
    return (
      <p className="px-3 py-3 text-[11px] text-muted-foreground leading-snug">
        Select one or more meshes (Shift / Ctrl-click in the viewport or Scene list),
        then group them into a tagged part.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 px-3 py-3 border-b border-border/40">
      <p className="text-[11px] text-sky-400">
        {count} mesh{count !== 1 ? 'es' : ''} selected
      </p>
      <div className="flex gap-1.5">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          placeholder="Part name (e.g. Front cowling)"
          className="h-7 text-xs"
        />
        <Button size="sm" className="h-7 px-2 text-xs flex-shrink-0" onClick={handleCreate}>
          <Plus className="w-3 h-3 mr-1" />
          Group
        </Button>
      </div>
    </div>
  );
}

function GroupRow({ group }: { group: PartGroup }) {
  const meshes = useConfiguratorStore((s) => s.meshes);
  const updatePartGroup = useConfiguratorStore((s) => s.updatePartGroup);
  const removePartGroup = useConfiguratorStore((s) => s.removePartGroup);
  const togglePartGroupVisibility = useConfiguratorStore((s) => s.togglePartGroupVisibility);
  const selectPartGroup = useConfiguratorStore((s) => s.selectPartGroup);

  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(group.name);
  const [tagDraft, setTagDraft] = useState(group.tag);
  const [pickingColor, setPickingColor] = useState(false);

  const memberSet = new Set(group.meshIds);
  const anyVisible = meshes.some((m) => memberSet.has(m.id) && m.visible);

  function commit() {
    updatePartGroup(group.id, { name: nameDraft.trim() || group.name, tag: tagDraft.trim() });
    setEditing(false);
  }

  return (
    <div className="rounded border border-border/40 bg-muted/20 overflow-hidden">
      <div className="flex items-center gap-1.5 px-2 py-1.5">
        {/* Color swatch / picker */}
        <button
          onClick={() => setPickingColor((v) => !v)}
          className="w-3.5 h-3.5 rounded-sm flex-shrink-0 border border-black/20"
          style={{ backgroundColor: group.color }}
          title="Change colour"
        />

        {editing ? (
          <input
            autoFocus
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
            className="flex-1 bg-transparent border-b border-sky-400 text-foreground text-xs focus:outline-none"
          />
        ) : (
          <button
            onClick={() => { setNameDraft(group.name); setTagDraft(group.tag); setEditing(true); }}
            className="flex-1 text-left text-xs font-medium text-foreground truncate hover:text-sky-400 transition-colors"
            title="Click to rename / retag"
          >
            {group.name}
            {group.tag && (
              <span className="ml-1.5 px-1 py-0.5 rounded bg-background/60 text-[9px] uppercase tracking-wide text-muted-foreground">
                {group.tag}
              </span>
            )}
          </button>
        )}

        <span className="text-[10px] text-muted-foreground flex-shrink-0">{group.meshIds.length}</span>

        <button onClick={() => selectPartGroup(group.id)}
          className="p-0.5 rounded text-muted-foreground hover:text-sky-400 transition-colors"
          title="Select all meshes in this part">
          <Crosshair className="w-3.5 h-3.5" />
        </button>

        <button onClick={() => togglePartGroupVisibility(group.id)}
          className="p-0.5 rounded transition-colors"
          title={anyVisible ? 'Hide part' : 'Show part'}>
          {anyVisible
            ? <Eye className="w-3.5 h-3.5 text-primary" />
            : <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />}
        </button>

        {editing ? (
          <button onClick={commit}
            className="p-0.5 rounded text-emerald-400 hover:text-emerald-300 transition-colors" title="Save">
            <Check className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button onClick={() => removePartGroup(group.id)}
            className="p-0.5 rounded text-muted-foreground hover:text-destructive transition-colors"
            title="Delete part">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {editing && (
        <div className="px-2 pb-2 flex items-center gap-1.5">
          <span className="text-[9px] uppercase tracking-wide text-muted-foreground">Tag</span>
          <input
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
            placeholder="e.g. fastener"
            className="flex-1 bg-background/50 border border-border/40 rounded text-[10px] text-foreground px-1.5 py-0.5 focus:outline-none focus:border-sky-400/60"
          />
          <button onClick={() => setEditing(false)}
            className="p-0.5 rounded text-muted-foreground hover:text-foreground" title="Cancel">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {pickingColor && (
        <div className="px-2 pb-2 flex flex-wrap gap-1.5">
          {PART_GROUP_COLORS.map((c) => (
            <button key={c}
              onClick={() => { updatePartGroup(group.id, { color: c }); setPickingColor(false); }}
              className={`w-4 h-4 rounded-sm border ${group.color === c ? 'border-foreground' : 'border-black/20'}`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function PartsPanel() {
  const partGroups = useConfiguratorStore((s) => s.partGroups);

  return (
    <div className="flex flex-col">
      <CreateFromSelection />

      {partGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center gap-2">
          <Boxes className="w-7 h-7 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">No parts yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1 px-2 py-2">
          {partGroups.map((g) => (
            <GroupRow key={g.id} group={g} />
          ))}
        </div>
      )}
    </div>
  );
}
