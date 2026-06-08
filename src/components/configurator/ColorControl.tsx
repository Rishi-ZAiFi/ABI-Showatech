/**
 * Color Control Component
 * Color picker for material colors
 */

import { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { useConfiguratorStore } from '../../store/configurator.store';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

interface ColorControlProps {
  materialId: string;
  initialColor: string;
  disabled?: boolean;
}

export function ColorControl({ materialId, initialColor, disabled = false }: ColorControlProps) {
  const store = useConfiguratorStore();
  const [color, setColor] = useState(initialColor);

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    store.setMaterialColor(materialId, newColor);
  };

  if (disabled) {
    return (
      <div className="flex items-center gap-2 opacity-50 cursor-not-allowed">
        <div className="w-10 h-10 p-0 border border-border rounded cursor-not-allowed" style={{ backgroundColor: color }} />
        <span className="text-xs text-muted-foreground font-mono">Textured</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-10 h-10 p-0 border border-border cursor-pointer"
            style={{ backgroundColor: color }}
            title="Click to change color"
          >
            <div className="w-full h-full rounded" style={{ backgroundColor: color }} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3">
          <HexColorPicker color={color} onChange={handleColorChange} />
          <div className="mt-2 flex items-center gap-2">
            <input
              type="text"
              value={color}
              onChange={(e) => handleColorChange(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="#000000"
            />
          </div>
        </PopoverContent>
      </Popover>
      <span className="text-sm text-muted-foreground font-mono">{color}</span>
    </div>
  );
}
