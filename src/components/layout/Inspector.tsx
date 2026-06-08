/**
 * Inspector Component
 * Right sidebar with model info and controls
 */

import { useMemo, useState } from 'react';
import * as THREE from 'three';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '../ui/tabs';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '../ui/accordion.tsx';
import { useConfiguratorStore } from '../../store/configurator.store';
import { MeshPanel } from '../configurator/MeshPanel';
import { MaterialPanel } from '../configurator/MaterialPanel';
import { AnimationPanel } from '../configurator/AnimationPanel';
// Tooltips removed; using lightweight hover tooltip inside MetricCard

function MetricCard({ label, value, description }: { label: string; value: React.ReactNode; description: string }) {
    const [open, setOpen] = useState(false);

    return (
        <div
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            className="relative p-2 bg-card/30 rounded-sm transition-colors duration-150 hover:bg-accent/10"
        >
            <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground uppercase">{label}</p>
                <p className="text-sm font-semibold text-foreground">{value}</p>
            </div>

            {/* lightweight tooltip shown on hover */}
            <div
                className="absolute z-50 w-48 p-2 rounded bg-popover text-popover-foreground text-xs shadow-md transition-opacity duration-150"
                style={{
                    top: -8,
                    right: 8,
                    transform: 'translateY(-100%)',
                    opacity: open ? 1 : 0,
                    pointerEvents: open ? 'auto' : 'none',
                }}
            >
                {description}
            </div>
        </div>
    );
}

export function Inspector() {
    const store = useConfiguratorStore();

    const modelStats = useMemo(() => {
        if (!store.scene) return { nodes: 0, vertices: 0, triangles: 0, drawCalls: 0 };

        let nodes = 0;
        let vertices = 0;
        let triangles = 0;
        let meshCount = 0;

        // Developer-focused stats
        let textureCount = 0;
        let texturePixels = 0; // rough pixel count
        const seenTextures = new Set<any>();
        let skinnedMeshes = 0;
        let maxBones = 0;
        let morphTargetCount = 0;

        store.scene.traverse((child) => {
            nodes++;
            if (child instanceof THREE.Mesh && child.geometry) {
                meshCount++;
                const geom = child.geometry as any;
                const posAttr = geom.attributes && geom.attributes.position;
                if (posAttr) vertices += posAttr.count;

                if (geom.index) {
                    triangles += geom.index.count / 3;
                } else if (posAttr) {
                    triangles += posAttr.count / 3;
                }

                // morph targets
                if (geom.morphAttributes) {
                    const morphAttrs = Object.values(geom.morphAttributes) as any[];
                    const mt = morphAttrs.reduce((acc: number, arr: any) => acc + (Array.isArray(arr) ? arr.length : 0), 0);
                    morphTargetCount += mt;
                }

                // skinned meshes / bones
                if ((child as any).isSkinnedMesh || child.type === 'SkinnedMesh') {
                    skinnedMeshes++;
                    const bones = (child as any).skeleton ? (child as any).skeleton.bones?.length || 0 : 0;
                    if (bones > maxBones) maxBones = bones;
                }

                // inspect material textures
                const mats = Array.isArray((child as any).material) ? (child as any).material : [(child as any).material];
                mats.forEach((mat: any) => {
                    if (!mat) return;
                    const maps = ['map','normalMap','roughnessMap','metalnessMap','aoMap','emissiveMap','alphaMap','displacementMap'];
                    maps.forEach((k) => {
                        const tex = mat[k];
                        if (tex && !seenTextures.has(tex)) {
                            seenTextures.add(tex);
                            textureCount++;
                            const img = tex.image as any;
                            if (img && img.width && img.height) texturePixels += img.width * img.height;
                        }
                    });
                });
            }
        });

        const drawCalls = store.meshes.length; // Approximation: each mesh registered is a draw call
        const bbox = new THREE.Box3().setFromObject(store.scene);
        const size = new THREE.Vector3();
        bbox.getSize(size);

        const avgTrisPerMesh = meshCount > 0 ? Math.round(triangles / meshCount) : 0;

        return {
            nodes,
            vertices,
            triangles: Math.floor(triangles),
            drawCalls,
            materials: store.materials.length,
            textures: textureCount,
            texturePixels,
            skinnedMeshes,
            maxBones,
            morphTargetCount,
            bboxSize: size,
            avgTrisPerMesh,
        } as any;
    }, [store.scene, store.meshes]);

    return (
        <div className="w-90 bg-card overflow-y-auto rounded-lg shadow-lg p-4">
            <Tabs defaultValue="configurator" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="configurator">Configurator</TabsTrigger>
                    <TabsTrigger value="statistics">Statistics</TabsTrigger>
                </TabsList>

                <TabsContent value="configurator" className="mt-4">
                    <Accordion type="single" collapsible defaultValue="meshes">
                        {/* Meshes */}
                        {store.meshes.length > 0 && (
                            <AccordionItem value="meshes">
                                <AccordionTrigger className="px-4">
                                    <span className="text-sm font-semibold">
                                        Meshes ({store.meshes.length})
                                    </span>
                                </AccordionTrigger>
                                <AccordionContent className="px-0">
                                    <MeshPanel />
                                </AccordionContent>
                            </AccordionItem>
                        )}

                        {/* Materials */}
                        {store.materials.length > 0 && (
                            <AccordionItem value="materials">
                                <AccordionTrigger className="px-4">
                                    <span className="text-sm font-semibold">
                                        Materials ({store.materials.length})
                                    </span>
                                </AccordionTrigger>
                                <AccordionContent className="px-0">
                                    <MaterialPanel />
                                </AccordionContent>
                            </AccordionItem>
                        )}

                        {/* Animations */}
                        {store.animations.length > 0 && (
                            <AccordionItem value="animations">
                                <AccordionTrigger className="px-4">
                                    <span className="text-sm font-semibold">
                                        Animations ({store.animations.length})
                                    </span>
                                </AccordionTrigger>
                                <AccordionContent className="px-4">
                                    <AnimationPanel />
                                </AccordionContent>
                            </AccordionItem>
                        )}
                    </Accordion>
                </TabsContent>

                <TabsContent value="statistics" className="mt-4">
                    <div className="space-y-2 px-3">
                        <div className="grid grid-cols-1 gap-2">
                            <MetricCard
                                label="Triangles"
                                value={modelStats.triangles.toLocaleString()}
                                description="Total triangle count for the model. High values can indicate heavy GPU load; consider LODs or decimation." 
                            />

                            <MetricCard
                                label="Vertices"
                                value={modelStats.vertices.toLocaleString()}
                                description="Total vertex count. Useful for estimating bandwidth and memory requirements." 
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            <MetricCard
                                label="Draw Calls"
                                value={modelStats.drawCalls}
                                description="Approximate number of draw calls (based on registered meshes). Aim to minimize by batching/material reuse." 
                            />

                            <MetricCard
                                label="Nodes"
                                value={modelStats.nodes}
                                description="Total scene graph nodes. High node counts can impact traversal and update times." 
                            />
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-2">
                            <MetricCard
                                label="Materials"
                                value={modelStats.materials}
                                description="Number of unique material entries detected in the model. Helpful for draw call and batching analysis."
                            />

                            <MetricCard
                                label="Textures"
                                value={modelStats.textures}
                                description="Count of distinct texture objects detected (albedo, normal, roughness, etc.)." 
                            />

                            <MetricCard
                                label="BBox (W×H×D m)"
                                value={modelStats.bboxSize ? `${modelStats.bboxSize.x.toFixed(2)} × ${modelStats.bboxSize.y.toFixed(2)} × ${modelStats.bboxSize.z.toFixed(2)}` : '—'}
                                description="Axis-aligned bounding box of the model in scene units (meters if model is authored in meters). Useful for camera framing and physics." 
                            />

                            <MetricCard
                                label="Avg Tris / Mesh"
                                value={modelStats.avgTrisPerMesh}
                                description="Average triangle count per mesh — helps identify heavy meshes for LOD or decimation." 
                            />

                            <MetricCard
                                label="Skinned Meshes"
                                value={modelStats.skinnedMeshes}
                                description="Number of skinned meshes (skeleton-driven). Important for runtime CPU/GPU skinning cost." 
                            />

                            <MetricCard
                                label="Max Bones"
                                value={modelStats.maxBones}
                                description="Maximum bone count found on any skinned mesh. Check against GPU/engine bone limits (typically 50-256)." 
                            />

                            <MetricCard
                                label="Morph Targets"
                                value={modelStats.morphTargetCount}
                                description="Total morph target attributes across meshes. Affects GPU vertex fetch and memory." 
                            />

                            <MetricCard
                                label="Texture Pixels (MP)"
                                value={`${(modelStats.texturePixels / 1_000_000).toFixed(2)} MP`}
                                description="Estimated total texture pixel count (sum width×height). Use to evaluate texture memory budgets." 
                            />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
