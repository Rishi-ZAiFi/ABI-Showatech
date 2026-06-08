/**
 * Canvas Root Component
 * Main Three.js canvas with Fiber setup
 */

import { Canvas } from '@react-three/fiber';
import { SceneSetup } from './SceneSetup';
import { ModelLoader } from './ModelLoader';
import { useTheme } from 'next-themes';
import { useMemo, Suspense } from 'react';
import { Environment } from '@react-three/drei';

interface CanvasRootProps {
  className?: string;
}

export function CanvasRoot({ className }: CanvasRootProps) {
  const { theme } = useTheme();

  const { containerStyle } = useMemo(() => {
    // Soft center radial + light vignette + very subtle noise overlay
    const makeNoiseUrl = (opacity = 0.05) => {
      const svg = `
        <svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
          <filter id='n'>
            <feTurbulence baseFrequency='0.8' numOctaves='2' stitchTiles='stitch' />
            <feColorMatrix type='saturate' values='0' />
          </filter>
          <rect width='100%' height='100%' filter='url(#n)' opacity='${opacity}' fill='black' />
        </svg>`;

      return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
    };

    if (theme === 'dark') {
      const noise = makeNoiseUrl(0.02);
      return {
        containerStyle: {
          backgroundColor: 'var(--color-card)',
          // soften the radial center for dark mode: lower alpha and push middle stop outward
          backgroundImage: `${noise}, radial-gradient(circle at 50% 42%, rgba(90,92,130,0.25) 0%, rgba(30,30,34,0.7) 55%, rgba(8,8,10,1) 100%), linear-gradient(180deg, rgba(255,255,255,0.005) 0%, rgba(0,0,0,0.22) 100%)`,
          backgroundRepeat: 'repeat, no-repeat, no-repeat',
          backgroundSize: '200px 200px, cover, cover',
          backgroundBlendMode: 'normal, normal, normal',
        },
      };
    }

    const noise = makeNoiseUrl(0.01);
    return {
      containerStyle: {
        backgroundColor: 'var(--color-card)',
        backgroundImage: `${noise}, radial-gradient(circle at 50% 42%, rgba(250,251,255,0.98) 0%, rgba(245,247,250,0.96) 65%, rgba(240,243,247,1) 100%), linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(0,0,0,0.01) 100%)`,
        backgroundRepeat: 'repeat, no-repeat, no-repeat',
        backgroundSize: '200px 200px, cover, cover',
        backgroundBlendMode: 'normal, normal, normal',
      },
    };
  }, [theme]);

  return (
    <div style={{ width: '100%', height: '100%', ...containerStyle }} className={className}>
      <Canvas
        style={{ background: 'transparent', width: '100%', height: '100%', display: 'block' }}
        camera={{
          position: [0, 0, 10],
          fov: 75,
          near: 0.1,
          far: 1000,
        }}
        gl={{
          antialias: true,
          preserveDrawingBuffer: true,
          alpha: true,
        }}
      >
      <Suspense fallback={null}>
        {/* HDRI environment for studio-style product lighting */}
        <Environment preset="studio" background={false} />

        {/* Scene configuration */}
        <SceneSetup />

        {/* Model loading logic */}
        <ModelLoader />
      </Suspense>

      {/* Scene background handled by CSS radial gradient on container */}
      </Canvas>
    </div>
  );
}
