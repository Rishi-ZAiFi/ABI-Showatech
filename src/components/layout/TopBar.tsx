/**
 * Top Bar Component
 */

import { useState } from 'react';
import { useConfiguratorStore } from '../../store/configurator.store';
import { useWorkflowStore } from '../../store/workflow.store';
import { GLBExporter } from '../../three/exporters/exportToGLB';
import { exportPackage } from '../../services/export.service';
import { useToast } from '../../store/toast.store';
import { ThemeSwitcher } from '../theme/ThemeSwitcher';
import { Button } from '../ui/button';
import { Package, Upload, Archive, Loader2, Presentation } from 'lucide-react';

export function TopBar() {
  const store = useConfiguratorStore();
  const workflowState = useWorkflowStore();
  const enterPresent = useWorkflowStore((s) => s.enterPresent);
  const [isExportingPackage, setIsExportingPackage] = useState(false);
  const toast = useToast();

  const handleReset = () => {
    store.reset();
  };

  const handleExport = async () => {
    if (!store.scene) return;
    try {
      await GLBExporter.downloadGlb(store.scene, `${store.modelName}.glb`);
      toast.success('GLB exported successfully.');
    } catch (error) {
      console.error('Failed to export:', error);
      toast.error('Failed to export model. See console for details.');
    }
  };

  const handleExportPackage = async () => {
    if (!store.scene || !workflowState.workflow) return;
    setIsExportingPackage(true);
    try {
      const snapshot = {
        version: 1 as const,
        exportedAt: Date.now(),
        workflow: workflowState.workflow,
        steps: workflowState.steps,
        targets: workflowState.targets,
        annotations: workflowState.annotations,
        partGroups: store.partGroups,
      };
      await exportPackage(store.scene, snapshot, store.modelName);
      toast.success('Package exported successfully.');
    } catch (error) {
      console.error('Failed to export package:', error);
      toast.error('Failed to export package. See console for details.');
    } finally {
      setIsExportingPackage(false);
    }
  };

  return (
    <div className="rounded-lg bg-card px-6 py-3 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold text-foreground">ShowaTech AR Authoring</h1>
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
                title="Export scene as GLB"
                className="gap-2 flex items-center"
              >
                Export GLB
                <Package className="w-4 h-4" />
              </Button>

              {workflowState.workflow && workflowState.workflow.stepIds.length > 0 && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={enterPresent}
                  title="Enter fullscreen presenter mode"
                  className="gap-2 flex items-center bg-amber-500 hover:bg-amber-600 text-white"
                >
                  <Presentation className="w-4 h-4" />
                  Present
                </Button>
              )}

              {workflowState.workflow && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleExportPackage}
                  disabled={isExportingPackage}
                  title="Export workflow + model as a ZIP package"
                  className="gap-2 flex items-center bg-sky-600 hover:bg-sky-700 text-white"
                >
                  {isExportingPackage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Archive className="w-4 h-4" />
                  )}
                  {isExportingPackage ? 'Exporting...' : 'Export Package'}
                </Button>
              )}
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

        <div className="border-l border-border pl-4">
          <ThemeSwitcher />
        </div>
      </div>
    </div>
  );
}
