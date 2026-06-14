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
import { PartsPanel } from '../configurator/PartsPanel';
import { MaterialPanel } from '../configurator/MaterialPanel';
import { AnimationPanel } from '../configurator/AnimationPanel';
import { MousePointerClick, Box } from 'lucide-react';
import { WorkflowPanel } from '../workflow/WorkflowPanel';
import { PreviewPanel } from '../workflow/PreviewPanel';
import { useWorkflowStore } from '../../store/workflow.store';

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

function SelectedMeshPanel() {
    const store = useConfiguratorStore();

    if (!store.selectedMeshId) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-3">
                <MousePointerClick className="w-8 h-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                    Click a mesh in the viewport or in the Scene tab to inspect it.
                </p>
            </div>
        );
    }

    const configMesh = store.meshes.find((m) => m.id === store.selectedMeshId);
    if (!configMesh) return null;

    const mesh = configMesh.ref;
    const geom = mesh.geometry as THREE.BufferGeometry | undefined;

    const vertexCount = geom?.attributes?.position?.count ?? 0;
    const triangleCount = geom?.index
        ? Math.floor(geom.index.count / 3)
        : Math.floor(vertexCount / 3);

    const configMat = store.materials.find((m) => m.id === configMesh.materialId);
    const matName = configMat?.name
        ?? (Array.isArray(mesh.material)
            ? mesh.material.map((m) => m.name || 'unnamed').join(', ')
            : (mesh.material as THREE.Material | undefined)?.name)
        ?? 'unnamed';

    const bbox = new THREE.Box3().setFromObject(mesh);
    const size = new THREE.Vector3();
    bbox.getSize(size);

    const rows: { label: string; value: string }[] = [
        { label: 'Name', value: configMesh.name || 'unnamed' },
        { label: 'Triangles', value: triangleCount.toLocaleString() },
        { label: 'Vertices', value: vertexCount.toLocaleString() },
        { label: 'Material', value: matName },
        { label: 'Size (m)', value: size.x.toFixed(3) + ' x ' + size.y.toFixed(3) + ' x ' + size.z.toFixed(3) },
        { label: 'Visible', value: configMesh.visible ? 'Yes' : 'No' },
    ];

    return (
        <div className="px-3 py-3 space-y-1">
            <div className="flex items-center gap-2 mb-3">
                <Box className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <span className="text-sm font-semibold text-foreground truncate">
                    {configMesh.name || 'Unnamed Mesh'}
                </span>
            </div>
            {rows.map(({ label, value }) => (
                <div
                    key={label}
                    className="flex items-start justify-between py-1 border-b border-border/50 last:border-0"
                >
                    <span className="text-xs text-muted-foreground uppercase tracking-wide w-24 flex-shrink-0">
                        {label}
                    </span>
                    <span className="text-xs text-foreground font-medium text-right break-all">
                        {value}
                    </span>
                </div>
            ))}
        </div>
    );
}

export function Inspector() {
    const store = useConfiguratorStore();
    const isPreviewMode = useWorkflowStore((s) => s.isPreviewMode);

    const modelStats = useMemo(() => {
        if (!store.scene) return { nodes: 0, vertices: 0, triangles: 0, drawCalls: 0, materials: 0, textures: 0, texturePixels: 0, skinnedMeshes: 0, maxBones: 0, morphTargetCount: 0, bboxSize: null, avgTrisPerMesh: 0 };

        let nodes = 0;
        let vertices = 0;
        let triangles = 0;
        let meshCount = 0;
        let textureCount = 0;
        let texturePixels = 0;
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
                if (geom.morphAttributes) {
                    const morphAttrs = Object.values(geom.morphAttributes) as any[];
                    const mt = morphAttrs.reduce((acc: number, arr: any) => acc + (Array.isArray(arr) ? arr.length : 0), 0);
                    morphTargetCount += mt;
                }
                if ((child as any).isSkinnedMesh || child.type === 'SkinnedMesh') {
                    skinnedMeshes++;
                    const bones = (child as any).skeleton ? (child as any).skeleton.bones?.length || 0 : 0;
                    if (bones > maxBones) maxBones = bones;
                }
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

        const drawCalls = store.meshes.length;
        const bbox = new THREE.Box3().setFromObject(store.scene);
        const size = new THREE.Vector3();
        bbox.getSize(size);
        const avgTrisPerMesh = meshCount > 0 ? Math.round(triangles / meshCount) : 0;

        return { nodes, vertices, triangles: Math.floor(triangles), drawCalls, materials: store.materials.length, textures: textureCount, texturePixels, skinnedMeshes, maxBones, morphTargetCount, bboxSize: size, avgTrisPerMesh };
    }, [store.scene, store.meshes]);

    if (isPreviewMode) {
        return (
            <div className="w-90 bg-card rounded-lg shadow-lg overflow-hidden flex flex-col h-full max-h-[calc(100vh-4rem)]">
                <PreviewPanel />
            </div>
        );
    }

    return (
        <div className="w-90 bg-card overflow-y-auto rounded-lg shadow-lg p-4">
            <Tabs defaultValue="workflow" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="workflow">Workflow</TabsTrigger>
                    <TabsTrigger value="selection">Selection</TabsTrigger>
                    <TabsTrigger value="configurator">Scene</TabsTrigger>
                    <TabsTrigger value="statistics">Stats</TabsTrigger>
                </TabsList>

                <TabsContent value="workflow" className="mt-4">
                    <WorkflowPanel />
                </TabsContent>

                <TabsContent value="selection" className="mt-4">
                    <SelectedMeshPanel />
                </TabsContent>

                <TabsContent value="configurator" className="mt-4">
                    <Accordion type="single" collapsible defaultValue="meshes">
                        {store.meshes.length > 0 && (
                            <AccordionItem value="meshes">
                                <AccordionTrigger className="px-4">
                                    <span className="text-sm font-semibold">Meshes ({store.meshes.length})</span>
                                </AccordionTrigger>
                                <AccordionContent className="px-0">
                                    <MeshPanel />
                                </AccordionContent>
                            </AccordionItem>
                        )}
                        {store.meshes.length > 0 && (
                            <AccordionItem value="parts">
                                <AccordionTrigger className="px-4">
                                    <span className="text-sm font-semibold">Parts ({store.partGroups.length})</span>
                                </AccordionTrigger>
                                <AccordionContent className="px-0">
                                    <PartsPanel />
                                </AccordionContent>
                            </AccordionItem>
                        )}
                        {store.materials.length > 0 && (
                            <AccordionItem value="materials">
                                <AccordionTrigger className="px-4">
                                    <span className="text-sm font-semibold">Materials ({store.materials.length})</span>
                                </AccordionTrigger>
                                <AccordionContent className="px-0">
                                    <MaterialPanel />
                                </AccordionContent>
                            </AccordionItem>
                        )}
                        {store.animations.length > 0 && (
                            <AccordionItem value="animations">
                                <AccordionTrigger className="px-4">
                                    <span className="text-sm font-semibold">Animations ({store.animations.length})</span>
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
                            <MetricCard label="Triangles" value={modelStats.triangles.toLocaleString()} description="Total triangle count. High values indicate heavy GPU load." />
                            <MetricCard label="Vertices" value={modelStats.vertices.toLocaleString()} description="Total vertex count. Useful for bandwidth and memory estimation." />
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            <MetricCard label="Draw Calls" value={modelStats.drawCalls} description="Approximate draw calls based on registered meshes." />
                            <MetricCard label="Nodes" value={modelStats.nodes} description="Total scene graph nodes." />
                        </div>
                        <div className="mt-3 grid grid-cols-1 gap-2">
                            <MetricCard label="Materials" value={modelStats.materials} description="Unique material count." />
                            <MetricCard label="Textures" value={modelStats.textures} description="Distinct texture objects (albedo, normal, roughness, etc.)." />
                            <MetricCard label="BBox W x H x D" value={modelStats.bboxSize ? (modelStats.bboxSize.x.toFixed(2) + ' x ' + modelStats.bboxSize.y.toFixed(2) + ' x ' + modelStats.bboxSize.z.toFixed(2)) : 'n/a'} description="Axis-aligned bounding box in scene units." />
                            <MetricCard label="Avg Tris/Mesh" value={modelStats.avgTrisPerMesh} description="Average triangles per mesh." />
                            <MetricCard label="Skinned Meshes" value={modelStats.skinnedMeshes} description="Skeleton-driven meshes." />
                            <MetricCard label="Max Bones" value={modelStats.maxBones} description="Maximum bone count on any skinned mesh." />
                            <MetricCard label="Morph Targets" value={modelStats.morphTargetCount} description="Total morph target attributes across meshes." />
                            <MetricCard label="Texture MP" value={(modelStats.texturePixels / 1_000_000).toFixed(2) + ' MP'} description="Estimated total texture pixel count." />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
