/**
 * Top Bar Component
 * Main navigation and actions
 */

import { useConfiguratorStore } from '../../store/configurator.store';
import { GLBExporter } from '../../three/exporters/exportToGLB';
import { ThemeSwitcher } from '../theme/ThemeSwitcher';
import { Button } from '../ui/button';
import { Package, Upload } from 'lucide-react';

export function TopBar() {
  const store = useConfiguratorStore();

  const handleReset = () => {
    store.reset();
  };

  const handleExport = async () => {
    if (!store.scene) return;

    try {
      await GLBExporter.downloadGlb(store.scene, `${store.modelName}.glb`);
    } catch (error) {
      console.error('Failed to export:', error);
      alert('Failed to export model');
    }
  };

  return (
    <div className="rounded-lg bg-card px-6 py-3 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold text-foreground">Product Configurator</h1>
      </div>

      <div className="flex items-center gap-2">
        {store.modelUrl && (
          <>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{store.modelName}</span>
            </div>

            <div className="flex gap-2 border-l border-border pl-4">
              <Button
                size="sm"
                variant="outline"
                onClick={handleReset}
                title="Reset to empty state"
              >
                Open New 3D Model
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handleExport}
                title="Export as GLB"
                className='gap-2 flex items-center'
              >
                Export and go
                <Package className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}

        {!store.modelUrl && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const input = document.querySelector('input[type="file"]') as HTMLInputElement;
              input?.click();
            }}
          >
            <Upload className="w-4 h-4 mr-2" />
            Open Model
          </Button>
        )}

        {/* Theme Switcher */}
        <div className="border-l border-border pl-4">
          <ThemeSwitcher />
        </div>
      </div>
    </div>
  );
}
