/**
 * Texture Map Indicator Component
 * Shows which texture maps are applied to a material with previews in a modal
 */

import { useState } from 'react';
import { Image, Layers, X, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import type { ConfigMaterial } from '../../types/ConfigMaterial';
import { generatePlaceholder } from '../../utils/texture.utils';

interface TextureMapIndicatorProps {
  material: ConfigMaterial;
}

interface TextureInfo {
  label: string;
  description: string;
  preview?: string;
  hasMap: boolean;
  category: 'color' | 'detail' | 'surface';
  colorHint?: string;
}

export function TextureMapIndicator({ material }: TextureMapIndicatorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const textures: TextureInfo[] = [
    {
      label: 'Base Color',
      description: 'Albedo/Diffuse texture - controls the primary color and appearance',
      preview: material.texturePreviewBaseColorMap,
      hasMap: material.hasBaseColorMap,
      category: 'color',
      colorHint: '#C0C0C0',
    },
    {
      label: 'Normal',
      description: 'Surface detail - adds fine geometric detail without additional geometry',
      preview: material.texturePreviewNormalMap,
      hasMap: material.hasNormalMap,
      category: 'detail',
      colorHint: '#8080FF',
    },
    {
      label: 'Roughness',
      description: 'Surface smoothness - controls how rough or glossy the surface appears',
      preview: material.texturePreviewRoughnessMap,
      hasMap: material.hasRoughnessMap,
      category: 'surface',
      colorHint: '#FFFFFF',
    },
    {
      label: 'Metallic',
      description: 'Metallic properties - determines metallic appearance and reflectivity',
      preview: material.texturePreviewMetallicMap,
      hasMap: material.hasMetallicMap,
      category: 'surface',
      colorHint: '#000000',
    },
    {
      label: 'Ambient Occlusion',
      description: 'Ambient shadows - adds realistic shadowing in crevices and corners',
      preview: material.texturePreviewAoMap,
      hasMap: material.hasAmbientOcclusionMap,
      category: 'surface',
      colorHint: '#FFFFFF',
    },
  ];

  const activeTextures = textures.filter((t) => t.hasMap);
  
  // (grouping removed — using compact grid for all active textures)

  if (activeTextures.length === 0) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors cursor-pointer"
      >
        <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
          {activeTextures.length} {activeTextures.length === 1 ? 'Map' : 'Maps'}
        </span>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-lg">
              <Image className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span>{material.name}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Texture Count */}
            <div className="text-sm text-muted-foreground">
              {activeTextures.length} texture{activeTextures.length !== 1 ? 's' : ''} applied
            </div>
            {/* Compact Grid Layout for All Texture Maps */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {activeTextures.map((texture) => (
                <TextureCard key={texture.label} texture={texture} />
              ))}
            </div>

            <Separator />

            {/* Info Section */}
            {material.hasBaseColorMap && (
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex gap-3">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-0.5">
                    Base Color Texture Applied
                  </p>
                  <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                    Color control is disabled to preserve texture integrity.
                  </p>
                </div>
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-end pt-1">
              <Button
                onClick={() => setIsOpen(false)}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface TextureCardProps {
  texture: TextureInfo;
}

function TextureCard({ texture }: TextureCardProps) {
  const categoryColors = {
    color: 'bg-blue-500',
    detail: 'bg-purple-500',
    surface: 'bg-green-500',
  };

  return (
    <div className="group relative rounded-lg border border-border bg-card hover:border-primary/50 transition-all duration-200 overflow-hidden">
      {/* Texture Preview */}
      <div className="aspect-square w-full bg-muted/30 relative overflow-hidden">
        <img
          src={
            texture.preview ||
            generatePlaceholder(texture.colorHint || '#808080')
          }
          alt={`${texture.label} preview`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Category Badge */}
        <div className="absolute top-2 right-2">
          <div className={`w-2 h-2 rounded-full ${categoryColors[texture.category]} shadow-sm`} />
        </div>
      </div>

      {/* Texture Info */}
      <div className="p-3 space-y-1">
        <h4 className="font-semibold text-sm text-foreground truncate">{texture.label}</h4>

      </div>
    </div>
  );
}
