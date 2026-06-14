/**
 * Global Vitest setup.
 *
 * jsdom does not implement a few browser APIs that the persistence / file /
 * cache / export services rely on. We polyfill / stub them here so the services
 * can run headlessly without throwing.
 */
import { afterEach, beforeEach, vi } from 'vitest';

// jsdom's Blob lacks arrayBuffer()/text(); back them with a FileReader
// (which jsdom does implement) so services that read blob bytes work.
if (typeof Blob !== 'undefined' && typeof Blob.prototype.arrayBuffer !== 'function') {
  Blob.prototype.arrayBuffer = function (this: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(this);
    });
  };
}
if (typeof Blob !== 'undefined' && typeof Blob.prototype.text !== 'function') {
  Blob.prototype.text = function (this: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(this);
    });
  };
}

let objectUrlCounter = 0;

beforeEach(() => {
  // URL.createObjectURL / revokeObjectURL are not implemented in jsdom.
  if (typeof URL.createObjectURL !== 'function') {
    // @ts-expect-error - assigning to a static for the test env
    URL.createObjectURL = vi.fn();
  }
  if (typeof URL.revokeObjectURL !== 'function') {
    // @ts-expect-error - assigning to a static for the test env
    URL.revokeObjectURL = vi.fn();
  }
  vi.spyOn(URL, 'createObjectURL').mockImplementation(
    () => `blob:mock/${++objectUrlCounter}`,
  );
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllTimers();
});
