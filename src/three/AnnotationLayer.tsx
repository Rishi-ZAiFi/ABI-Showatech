/**
 * AnnotationLayer — AR Billboard Callout Cards
 *
 * Each annotation pin renders as a 2D billboard card (always faces camera)
 * containing: reference image + operator instruction + label header.
 * A leader line connects the card to the exact 3D surface point.
 *
 * Must be mounted inside a <Canvas> (React Three Fiber context).
 */

import { Html } from '@react-three/drei';
import { useWorkflowStore } from '../store/workflow.store';
import type { Annotation } from '../types/Workflow';

// ---------------------------------------------------------------------------
// Single AR callout card + leader line + pin dot
// ---------------------------------------------------------------------------

function CalloutCard({
  annotation,
  onRemove,
  isReadOnly,
}: {
  annotation: Annotation;
  onRemove: () => void;
  isReadOnly: boolean;
}) {
  const { x, y, z } = annotation.position;
  const hasInstruction = Boolean(annotation.instruction);

  return (
    <group position={[x, y, z]}>
      {/* Tiny sphere anchors the depth position; pin dot in HTML aligns on top */}
      <mesh renderOrder={200}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshBasicMaterial color="#38bdf8" depthTest={false} transparent opacity={0.9} />
      </mesh>

      {/* Html from drei — projects HTML to screen space, always faces camera */}
      <Html
        occlude={false}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
        zIndexRange={[100, 0]}
      >
        {/*
          Outer wrapper: flex column (card → leader → pin).
          translate(-50%, calc(-100% + 4px)) centres horizontally and places
          the pin dot (last child, 8px high) exactly at the projected 3D point.
        */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            transform: 'translate(-50%, calc(-100% + 4px))',
            pointerEvents: 'auto',
          }}
        >
          {/* ── Callout card ── */}
          <div
            style={{
              width: '185px',
              background: 'rgba(8, 16, 32, 0.94)',
              border: '1px solid rgba(56, 189, 248, 0.5)',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 6px 24px rgba(0,0,0,0.65), 0 0 0 1px rgba(56,189,248,0.08)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {/* Reference image */}
            {annotation.imageDataUrl && (
              <div style={{ position: 'relative', lineHeight: 0 }}>
                <img
                  src={annotation.imageDataUrl}
                  alt=""
                  style={{
                    width: '100%',
                    maxHeight: '105px',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
                {/* Bottom gradient so label header bleeds over image nicely */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '30px',
                    background: 'linear-gradient(transparent, rgba(8,16,32,0.85))',
                  }}
                />
              </div>
            )}

            {/* Label row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: annotation.imageDataUrl ? '4px 8px 4px 8px' : '7px 8px 4px 8px',
                borderBottom: hasInstruction
                  ? '1px solid rgba(56,189,248,0.12)'
                  : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#38bdf8',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    color: '#38bdf8',
                    fontSize: '11px',
                    fontWeight: 700,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '130px',
                  }}
                >
                  {annotation.label || 'Annotation'}
                </span>
              </div>

              {!isReadOnly && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#475569',
                    fontSize: '15px',
                    lineHeight: 1,
                    padding: '0 2px',
                    borderRadius: '3px',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}
                  title="Remove annotation"
                >
                  ×
                </button>
              )}
            </div>

            {/* Operator instruction */}
            {hasInstruction && (
              <div style={{ padding: '5px 8px 8px 8px' }}>
                <p
                  style={{
                    color: '#cbd5e1',
                    fontSize: '10px',
                    lineHeight: 1.5,
                    margin: 0,
                    wordBreak: 'break-word',
                  }}
                >
                  {annotation.instruction}
                </p>
              </div>
            )}

            {/* No-content hint (author mode only) */}
            {!annotation.imageDataUrl && !hasInstruction && !isReadOnly && (
              <div style={{ padding: '0 8px 6px 19px' }}>
                <p style={{ color: '#334155', fontSize: '9px', margin: 0, fontStyle: 'italic' }}>
                  Add image & instruction in panel
                </p>
              </div>
            )}
          </div>

          {/* ── Leader line ── */}
          <div
            style={{
              width: '1px',
              height: '22px',
              background:
                'linear-gradient(to bottom, rgba(56,189,248,0.8), rgba(56,189,248,0.25))',
            }}
          />

          {/* ── Pin dot — vertically centred on 3D sphere ── */}
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#38bdf8',
              boxShadow: '0 0 8px rgba(56,189,248,0.9)',
              flexShrink: 0,
            }}
          />
        </div>
      </Html>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Layer — renders all callout cards for the active step
// ---------------------------------------------------------------------------

export function AnnotationLayer() {
  const activeStepId = useWorkflowStore((s) => s.activeStepId);
  const steps = useWorkflowStore((s) => s.steps);
  const annotations = useWorkflowStore((s) => s.annotations);
  const removeAnnotation = useWorkflowStore((s) => s.removeAnnotation);
  const isPreviewMode = useWorkflowStore((s) => s.isPreviewMode);
  const isPresentMode = useWorkflowStore((s) => s.isPresentMode);

  if (!activeStepId) return null;

  const step = steps[activeStepId];
  if (!step) return null;

  const stepAnnotations = step.annotationIds
    .map((id) => annotations[id])
    .filter(Boolean);

  if (stepAnnotations.length === 0) return null;

  const isReadOnly = isPreviewMode || isPresentMode;

  return (
    <>
      {stepAnnotations.map((annotation) => (
        <CalloutCard
          key={annotation.id}
          annotation={annotation}
          onRemove={() => removeAnnotation(annotation.id)}
          isReadOnly={isReadOnly}
        />
      ))}
    </>
  );
}
