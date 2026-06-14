/**
 * Mesh Panel Component
 * Lists all meshes with visibility toggles and click-to-select support.
 * Plain click single-selects; Shift/Ctrl/Cmd click toggles multi-selection (for grouping).
 */

import { useConfiguratorStore } from '../../store/configurator.store';
import { VisibilityToggle } from './VisibilityToggle';
import { MousePointerClick } from 'lucide-react';

export function MeshPanel() {
  const store = useConfiguratorStore();

  if (store.meshes.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4 px-4">
        No meshes loaded
      </div>
    );
  }

  const handleMeshClick = (meshId: string, e: React.MouseEvent) => {
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      store.toggleMeshInSelection(meshId);
    } else {
      store.setSelectedMeshId(
        store.selectedMeshId === meshId && store.selectedMeshIds.length <= 1 ? null : meshId,
      );
    }
  };

  return (
    <div>
      <p className="px-3 pb-1 text-[10px] text-muted-foreground/70 leading-tight">
        Shift / Ctrl-click to select multiple, then group them into a part.
      </p>
      {store.meshes.map((mesh) => {
        const isSelected = store.selectedMeshIds.includes(mesh.id);
        return (
          <div
            key={mesh.id}
            onClick={(e) => handleMeshClick(mesh.id, e)}
            className={`flex items-center justify-between px-3 py-1 rounded-md cursor-pointer transition-colors ${
              isSelected
                ? 'bg-sky-500/15 border border-sky-500/40'
                : 'hover:bg-muted border border-transparent'
            }`}
          >
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full mr-2 flex-shrink-0 transition-colors ${
                isSelected ? 'bg-sky-400' : 'bg-transparent'
              }`}
            />
            <span className="text-sm font-medium text-foreground truncate flex-1">
              {mesh.name}
            </span>
            {!isSelected && (
              <MousePointerClick className="w-3 h-3 text-muted-foreground/40 mr-1 flex-shrink-0" />
            )}
            <span onClick={(e) => e.stopPropagation()}>
              <VisibilityToggle meshId={mesh.id} isVisible={mesh.visible} />
            </span>
          </div>
        );
      })}
    </div>
  );
}
