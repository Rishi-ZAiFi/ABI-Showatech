/**
 * Texture Utilities
 * Functions for extracting and previewing textures from Three.js materials
 */

import * as THREE from 'three';

export interface TexturePreview {
  baseColorMap?: string;
  normalMap?: string;
  roughnessMap?: string;
  metallicMap?: string;
  aoMap?: string;
}

/**
 * Extract texture data URL from a Three.js texture
 * Renders the texture to a canvas and returns a data URL
 */
function textureToDataUrl(texture: THREE.Texture | null, size: number = 256): string | null {
  if (!texture) return null;

  // Prefer texture.image which covers common cases (Image, Canvas, ImageBitmap, DataTexture image)
  const imgSource: any = (texture as any).image || (texture as any).source?.data;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  try {
    if (!imgSource) {
      // Nothing available, return placeholder
      ctx.fillStyle = '#888888';
      ctx.fillRect(0, 0, size, size);
      return canvas.toDataURL('image/png');
    }

    // If ImageBitmap or HTMLImageElement or HTMLCanvasElement
    if (
      typeof ImageBitmap !== 'undefined' && imgSource instanceof ImageBitmap ||
      imgSource instanceof HTMLImageElement ||
      imgSource instanceof HTMLCanvasElement
    ) {
      const sourceWidth = imgSource.width || size;
      const sourceHeight = imgSource.height || size;
      const scale = Math.min(size / sourceWidth, size / sourceHeight);
      const dw = sourceWidth * scale;
      const dh = sourceHeight * scale;
      const dx = (size - dw) / 2;
      const dy = (size - dh) / 2;
      ctx.fillStyle = '#cccccc';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(imgSource, dx, dy, dw, dh);
      return canvas.toDataURL('image/png');
    }

    // If ImageData
    if (typeof ImageData !== 'undefined' && imgSource instanceof ImageData) {
      // draw to an intermediate canvas preserving pixels
      const tmp = document.createElement('canvas');
      tmp.width = imgSource.width;
      tmp.height = imgSource.height;
      const tctx = tmp.getContext('2d');
      if (!tctx) return null;
      tctx.putImageData(imgSource, 0, 0);
      const scale = Math.min(size / imgSource.width, size / imgSource.height);
      const dw = imgSource.width * scale;
      const dh = imgSource.height * scale;
      const dx = (size - dw) / 2;
      const dy = (size - dh) / 2;
      ctx.fillStyle = '#cccccc';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(tmp, dx, dy, dw, dh);
      return canvas.toDataURL('image/png');
    }

    // If the image source is a data object (DataTexture): { data, width, height }
    if (imgSource && imgSource.data && imgSource.width && imgSource.height) {
      const width = imgSource.width;
      const height = imgSource.height;
      const data = imgSource.data;

      // Convert typed arrays to Uint8ClampedArray RGBA
      let rgba: Uint8ClampedArray;
      const pixelCount = width * height;

      if (data instanceof Uint8ClampedArray) {
        // Might already be RGBA
        if (data.length === pixelCount * 4) {
          rgba = data as Uint8ClampedArray;
        } else if (data.length === pixelCount * 3) {
          rgba = new Uint8ClampedArray(pixelCount * 4);
          for (let i = 0, p = 0; i < pixelCount; i++, p += 3) {
            const q = i * 4;
            rgba[q] = data[p];
            rgba[q + 1] = data[p + 1];
            rgba[q + 2] = data[p + 2];
            rgba[q + 3] = 255;
          }
        } else {
          rgba = new Uint8ClampedArray(pixelCount * 4);
        }
      } else if (data instanceof Uint8Array || data instanceof Uint16Array || data instanceof Int8Array || data instanceof Int16Array) {
        // Convert to Uint8ClampedArray
        rgba = new Uint8ClampedArray(pixelCount * 4);
        if (data.length === pixelCount * 3 || data.length === pixelCount * 4) {
          for (let i = 0, p = 0; i < pixelCount; i++) {
            const q = i * 4;
            rgba[q] = data[p] & 0xff;
            rgba[q + 1] = data[p + 1] & 0xff;
            rgba[q + 2] = data[p + 2] & 0xff;
            rgba[q + 3] = data.length === pixelCount * 4 ? (data[p + 3] & 0xff) : 255;
            p += data.length === pixelCount * 4 ? 4 : 3;
          }
        }
      } else if (data instanceof Float32Array || data instanceof Float64Array) {
        rgba = new Uint8ClampedArray(pixelCount * 4);
        // assume floats in 0..1 range
        for (let i = 0, p = 0; i < pixelCount; i++) {
          const q = i * 4;
          rgba[q] = Math.round(Math.min(1, Math.max(0, data[p])) * 255);
          rgba[q + 1] = Math.round(Math.min(1, Math.max(0, data[p + 1] || data[p])) * 255);
          rgba[q + 2] = Math.round(Math.min(1, Math.max(0, data[p + 2] || data[p])) * 255);
          rgba[q + 3] = 255;
          p += 3;
        }
      } else {
        // unsupported typed array
        ctx.fillStyle = '#888888';
        ctx.fillRect(0, 0, size, size);
        return canvas.toDataURL('image/png');
      }

      const imageData = new ImageData(Uint8ClampedArray.from(rgba), width, height);
      const tmp = document.createElement('canvas');
      tmp.width = width;
      tmp.height = height;
      const tctx = tmp.getContext('2d');
      if (!tctx) return null;
      tctx.putImageData(imageData, 0, 0);

      const scale = Math.min(size / width, size / height);
      const dw = width * scale;
      const dh = height * scale;
      const dx = (size - dw) / 2;
      const dy = (size - dh) / 2;
      ctx.fillStyle = '#cccccc';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(tmp, dx, dy, dw, dh);
      return canvas.toDataURL('image/png');
    }

    // Unknown source type
    ctx.fillStyle = '#888888';
    ctx.fillRect(0, 0, size, size);
    return canvas.toDataURL('image/png');
  } catch (err) {
    console.warn('textureToDataUrl error:', err);
    ctx.fillStyle = '#888888';
    ctx.fillRect(0, 0, size, size);
    return canvas.toDataURL('image/png');
  }
}

/**
 * Extract all texture previews from a material
 */
export function extractTexturePreviews(material: THREE.Material, size: number = 256): TexturePreview {
  if (!(material instanceof THREE.MeshStandardMaterial)) {
    return {};
  }

  return {
    baseColorMap: material.map ? textureToDataUrl(material.map, size) ?? undefined : undefined,
    normalMap: material.normalMap ? textureToDataUrl(material.normalMap, size) ?? undefined : undefined,
    roughnessMap: material.roughnessMap
      ? textureToDataUrl(material.roughnessMap, size) ?? undefined
      : undefined,
    metallicMap: material.metalnessMap
      ? textureToDataUrl(material.metalnessMap, size) ?? undefined
      : undefined,
    aoMap: material.aoMap ? textureToDataUrl(material.aoMap, size) ?? undefined : undefined,
  };
}

/**
 * Generate a placeholder for missing texture preview
 */
export function generatePlaceholder(color: string, size: number = 256): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);

  // Add subtle grid pattern
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 1;
  const gridSize = 32;
  for (let i = 0; i <= size; i += gridSize) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  return canvas.toDataURL('image/png');
}
