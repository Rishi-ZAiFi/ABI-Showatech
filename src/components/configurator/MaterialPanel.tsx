/**
 * Material Panel Component
 * Lists all materials with color pickers and texture indicators
 */

import { useConfiguratorStore } from '../../store/configurator.store';
import { ColorControl } from './ColorControl';
import { TextureMapIndicator } from './TextureMapIndicator';
import { Separator } from '../ui/separator';

export function MaterialPanel() {
  const store = useConfiguratorStore();

  if (store.materials.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4 px-4">
        No materials loaded
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {store.materials.map((material, idx) => (
        <div key={material.id}>
          <div className="flex flex-col gap-3 px-4 py-3 hover:bg-muted rounded">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground truncate flex-1">
                {material.name}
              </span>
              <TextureMapIndicator material={material} />
            </div>
            <ColorControl
              materialId={material.id}
              initialColor={material.color}
              disabled={material.hasBaseColorMap}
            />
          </div>
          {idx < store.materials.length - 1 && <Separator />}
        </div>
      ))}
    </div>
  );
}
