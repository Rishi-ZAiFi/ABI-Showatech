/**
 * useAnimationMixer Hook
 * Manages Three.js AnimationMixer for playing animation clips
 */

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useConfiguratorStore } from '../store/configurator.store';

export function useAnimationMixer() {
  const { scene, animations, currentAnimationId, animationSpeed, isAnimationPlaying, animationTime, setAnimationTime } = useConfiguratorStore();
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);

  // Initialize mixer when scene changes
  useEffect(() => {
    if (!scene) {
      mixerRef.current = null;
      currentActionRef.current = null;
      return;
    }

    // Create new mixer for the scene
    mixerRef.current = new THREE.AnimationMixer(scene);

    return () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
        mixerRef.current = null;
      }
      currentActionRef.current = null;
    };
  }, [scene]);

  // Play animation when current animation changes
  useEffect(() => {
    if (!mixerRef.current || !currentAnimationId || animations.length === 0) {
      return;
    }

    const animation = animations.find((a) => a.id === currentAnimationId);
    if (!animation) {
      return;
    }

    // Stop current action
    if (currentActionRef.current) {
      currentActionRef.current.fadeOut(0.5);
    }

    // Play new action
    const action = mixerRef.current.clipAction(animation.clip);
    action.reset();
    action.fadeIn(0.5);
    action.loop = THREE.LoopRepeat;
    action.repetitions = Infinity;
    action.play();
    // Respect the current play/pause state
    action.paused = !isAnimationPlaying;
    currentActionRef.current = action;

    return () => {
      if (currentActionRef.current) {
        currentActionRef.current.fadeOut(0.5);
      }
    };
  }, [currentAnimationId, animations, isAnimationPlaying]);

  // Update animation speed
  useEffect(() => {
    if (currentActionRef.current) {
      currentActionRef.current.timeScale = animationSpeed;
    }
  }, [animationSpeed]);

  // Control play/pause
  useEffect(() => {
    if (!currentActionRef.current) return;

    if (isAnimationPlaying) {
      currentActionRef.current.paused = false;
    } else {
      currentActionRef.current.paused = true;
    }
  }, [isAnimationPlaying]);

  // Update animation time when slider changes (apply immediately so scrubbing works while playing)
  useEffect(() => {
    if (currentActionRef.current) {
      currentActionRef.current.time = animationTime;
    }
  }, [animationTime]);

  // Update mixer on each frame
  useFrame((_, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }

    // Update animation time in store during playback
    if (currentActionRef.current && isAnimationPlaying) {
      setAnimationTime(currentActionRef.current.time);
    }
  });

  return mixerRef.current;
}
