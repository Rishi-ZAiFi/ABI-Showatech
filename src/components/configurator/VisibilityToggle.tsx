/**
 * Visibility Toggle Component
 * UI for toggling mesh visibility
 */

import { Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/button';
import { useConfiguratorStore } from '../../store/configurator.store';

interface VisibilityToggleProps {
  meshId: string;
  isVisible: boolean;
}

export function VisibilityToggle({ meshId, isVisible }: VisibilityToggleProps) {
  const store = useConfiguratorStore();

  const handleToggle = () => {
    store.toggleMeshVisibility(meshId);
  };

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={handleToggle}
      className="p-1"
      title={isVisible ? 'Hide' : 'Show'}
    >
      {isVisible ? (
        <Eye className="w-4 h-4 text-primary" />
      ) : (
        <EyeOff className="w-4 h-4 text-muted-foreground" />
      )}
    </Button>
  );
}
