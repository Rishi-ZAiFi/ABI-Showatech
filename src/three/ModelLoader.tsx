/**
 * Model Loader Component
 */

import { useConfiguratorScene } from './useConfiguratorScene';
import { useAnimationMixer } from './useAnimationMixer';
import { useMeshSelection } from './useMeshSelection';
import { useAnnotationPlacement } from './useAnnotationPlacement';
import { usePreviewHighlight } from './usePreviewHighlight';
import { usePreviewGhost } from './usePreviewGhost';
import { useCameraFlyTo } from './useCameraFlyTo';
import { useStepVisibility } from './useStepVisibility';
import { useCameraCapture } from './useCameraCapture';
import { AnnotationLayer } from './AnnotationLayer';

export function ModelLoader() {
  useConfiguratorScene();
  useAnimationMixer();
  useMeshSelection();
  useAnnotationPlacement();
  usePreviewHighlight();
  useStepVisibility();
  usePreviewGhost();
  useCameraFlyTo();
  useCameraCapture();

  return <AnnotationLayer />;
}
