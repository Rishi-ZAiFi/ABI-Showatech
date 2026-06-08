/**
 * Viewport Component
 * Contains the main 3D Canvas
 */

import { CanvasRoot } from '../../three/CanvasRoot';
import { useState, useRef, useEffect } from 'react';
import { useConfiguratorStore } from '../../store/configurator.store';
import * as THREE from 'three';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import { Grid, Sun, Maximize2, Box } from 'lucide-react';
import { Slider } from '../ui/slider';

function ViewModeToolbar() {
  const store = useConfiguratorStore();
  const scene = store.scene;
  const hdriIntensity = (store as any).hdriIntensity ?? 1;
  const setHdriIntensity = (store as any).setHdriIntensity ?? (() => { });
  const [mode, setMode] = useState<'default' | 'wireframe'>('default');
  const originalsRef = useRef<Map<string, THREE.Material | THREE.Material[]>>(new Map());
  const edgesRef = useRef<Map<string, THREE.Object3D>>(new Map());

  const saveOriginal = (mesh: THREE.Mesh) => {
    if (!originalsRef.current.has(mesh.uuid)) {
      const mat = mesh.material as any;
      if (Array.isArray(mat)) {
        originalsRef.current.set(mesh.uuid, mat.map((m: any) => (m?.clone ? m.clone() : m)));
      } else {
        originalsRef.current.set(mesh.uuid, mat?.clone ? mat.clone() : mat);
      }
    }
  };

  const restoreAll = () => {
    if (!scene) return;
    scene.traverse((obj) => {
      if ((obj as any).isMesh) {
        const mesh = obj as THREE.Mesh;
        const orig = originalsRef.current.get(mesh.uuid);
        const currentMat = mesh.material;

        if (orig) {
          mesh.material = orig as any;
          const m = mesh.material as any;
          if (m) m.needsUpdate = true;
        } else {
          // reset common flags if no original stored
          const mat = mesh.material as any;
          if (mat) {
            if ('wireframe' in mat) mat.wireframe = false;
            if ('flatShading' in mat) mat.flatShading = false;
            mat.needsUpdate = true;
          }
        }
        // remove any generated edge helpers
        const edgeObj = edgesRef.current.get(mesh.uuid);
        if (edgeObj) {
          if (edgeObj.parent) edgeObj.parent.remove(edgeObj);
          // dispose geometry/material if present
          (edgeObj as any).traverse((child: any) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
          });
          edgesRef.current.delete(mesh.uuid);
        }

        // dispose generated depth-only material if it wasn't the original
        try {
          if (currentMat && currentMat !== orig) {
            if (Array.isArray(currentMat)) {
              currentMat.forEach((m: any) => m?.dispose && m.dispose());
            } else if (currentMat?.dispose) {
              currentMat.dispose();
            }
          }
        } catch (e) {
          // ignore disposal errors
        }
      }
    });
    originalsRef.current.clear();
  };

  const applyMode = (next: 'default' | 'wireframe') => {
    if (!scene) return;
    if (next === 'default') {
      restoreAll();
      setMode('default');
      return;
    }

    scene.traverse((obj) => {
      if ((obj as any).isMesh) {
        const mesh = obj as THREE.Mesh;
        // ensure original material saved
        saveOriginal(mesh);

        if (next === 'wireframe') {
          // replace material with depth-only unlit material so no shading is visible
          const depthMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: false });
          depthMat.depthWrite = true;
          depthMat.depthTest = true;
          depthMat.colorWrite = false; // write depth only, not color
          mesh.material = depthMat as any;

          // create and add edge lines if not already created
          if (!edgesRef.current.has(mesh.uuid) && (mesh.geometry as any)) {
            try {
              const geo = new THREE.EdgesGeometry((mesh.geometry as THREE.BufferGeometry), 15 * (Math.PI / 180));
              const matLine = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });
              matLine.depthTest = true;
              matLine.depthWrite = false;
              matLine.transparent = true;
              const lines = new THREE.LineSegments(geo, matLine);
              lines.renderOrder = 999;
              mesh.add(lines);
              edgesRef.current.set(mesh.uuid, lines);
            } catch (e) {
              // fallback: enable material wireframe if edges creation fails
              const fm = mesh.material as any;
              if (Array.isArray(fm)) fm.forEach((m: any) => (m.wireframe = true));
              else if (fm) fm.wireframe = true;
            }
          }
        }
      }
    });

    setMode(next);
  };

  // Apply HDRI intensity to all standard materials in the scene
  const applyHdriIntensityToScene = (intensity: number) => {
    if (!scene) return;
    scene.traverse((obj) => {
      if ((obj as any).isMesh) {
        const mesh = obj as THREE.Mesh;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m: any) => {
          try {
            if (m && m.isMeshStandardMaterial) {
              m.envMapIntensity = intensity;
              m.needsUpdate = true;
            }
          } catch (e) {
            // ignore
          }
        });
      }
    });
  };

  useEffect(() => {
    applyHdriIntensityToScene(hdriIntensity);
  }, [scene, hdriIntensity]);

  return (
    <div className="absolute top-3 right-3 z-20 flex gap-2">
      <div className="flex items-center gap-2 px-2 bg-card/70 rounded-md border border-border py-1">
        <Sun className="w-4 h-4 text-muted-foreground" />

        <div className="w-40">
          <Slider
            min={0}
            max={2}
            step={0.01}
            value={[Number(hdriIntensity ?? 1)]}
            onValueChange={(vals: number[]) => {
              const v = Number(vals[0] ?? 1);
              setHdriIntensity(v);
              applyHdriIntensityToScene(v);
            }}
          />
        </div>
      </div>
      <button
        className="p-2 rounded-md bg-card/80 border border-border text-sm hover:bg-card/90"
        onClick={() => store.requestFitCamera()}
        title="Fit camera to model"
        aria-label="Fit camera"
      >
        <Maximize2 className="w-4 h-4" />
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="p-2 rounded-md bg-card/80 border border-border text-sm hover:bg-card/90"
            title={mode === 'wireframe' ? 'Wireframe view' : 'Default view'}
            aria-label="View options"
          >
            {mode === 'wireframe' ? <Grid className="w-4 h-4" /> : <Box className="w-4 h-4" />}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent sideOffset={8} align="end">
          <DropdownMenuItem onSelect={() => applyMode('default')}>
            <Box className="mr-2" />
            Default
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={() => applyMode('wireframe')}>
            <Grid className="mr-2" />
            Wireframe
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function Viewport() {
  return (
    <div className="flex-1 rounded-lg bg-card shadow-lg relative overflow-hidden">
      <CanvasRoot className="w-full h-full" />
      <ViewModeToolbar />
    </div>
  );
}
