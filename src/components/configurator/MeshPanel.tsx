/**
 * Mesh Panel Component
 * Lists all meshes with visibility toggles
 */

import { useConfiguratorStore } from '../../store/configurator.store';
import { VisibilityToggle } from './VisibilityToggle';

export function MeshPanel() {
  const store = useConfiguratorStore();

  if (store.meshes.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4 px-4">
        No meshes loaded
      </div>
    );
  }

  return (
    <div>
      {store.meshes.map((mesh) => (
        <div key={mesh.id}>
          <div className="flex items-center justify-between px-3 py-0.5 hover:bg-muted rounded-md">
            <span className="text-sm font-medium text-foreground truncate flex-1">
              {mesh.name}
            </span>
            <VisibilityToggle meshId={mesh.id} isVisible={mesh.visible} />
          </div>
        </div>
      ))}
    </div>
  );
}
