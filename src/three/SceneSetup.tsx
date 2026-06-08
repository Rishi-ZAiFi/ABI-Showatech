/**
 * Scene Setup Component
 * Configures lights, environment, and controls for the 3D scene
 */

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as THREE from 'three';
import { useAnimationMixer } from './useAnimationMixer';

export function SceneSetup() {
  const { camera, scene, gl } = useThree();
  
  // Initialize animation mixer
  useAnimationMixer();

  useEffect(() => {
    // Set up comprehensive lighting for product visualization

    // Main ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // Key light (main directional light)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
    keyLight.position.set(5, 10, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.1;
    keyLight.shadow.camera.far = 50;
    keyLight.shadow.camera.left = -10;
    keyLight.shadow.camera.right = 10;
    keyLight.shadow.camera.top = 10;
    keyLight.shadow.camera.bottom = -10;
    keyLight.shadow.bias = -0.0001;
    scene.add(keyLight);

    // Fill light (softer light from the opposite side)
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);

    // Rim light (for edge definition)
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.5);
    rimLight.position.set(0, 10, -10);
    scene.add(rimLight);

    // Optional: Add a subtle point light for additional illumination
    const pointLight = new THREE.PointLight(0xffffff, 0.2, 20);
    pointLight.position.set(0, 5, 0);
    scene.add(pointLight);

    // Set up controls (tuned for crisp, responsive interaction)
    const controls = new OrbitControls(camera, gl.domElement);
    controls.enableDamping = false; // immediate response — disable smoothing
    controls.dampingFactor = 0;
    controls.enablePan = true;
    controls.screenSpacePanning = true;
    controls.rotateSpeed = 0.9; // slightly faster rotation
    controls.zoomSpeed = 1.2; // snappier zoom
    controls.panSpeed = 0.8; // controlled panning
    controls.enableKeys = true;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 5;

    // Store controls on camera for later access
    (camera as any).controls = controls;

    // Handle resize
    const handleResize = () => {
      controls.handleResize?.();
    };
    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = () => {
      controls.update();
    };
    gl.setAnimationLoop(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      ambientLight.dispose();
      keyLight.dispose();
      fillLight.dispose();
      rimLight.dispose();
      pointLight.dispose();
      controls.dispose();
    };
  }, [camera, scene, gl]);

  return null;
}
