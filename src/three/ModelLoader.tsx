/**
 * Model Loader Component
 * Handles loading and displaying the model in the scene
 */

import { useConfiguratorScene } from './useConfiguratorScene';
import { useAnimationMixer } from './useAnimationMixer';

export function ModelLoader() {
  // Use the hook to manage scene loading
  useConfiguratorScene();
  
  // Use the hook to manage animations
  useAnimationMixer();

  // This component doesn't render anything, it's purely a logic container
  return null;
}
