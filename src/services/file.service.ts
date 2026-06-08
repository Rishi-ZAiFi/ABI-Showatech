/**
 * File Service
 * Handles file validation and reading
 */

export class FileService {
  private static readonly SUPPORTED_FORMATS = ['.glb', '.gltf', '.fbx', '.obj'];

  /**
   * Validate if file is in a supported format
   */
  static isSupportedFormat(file: File): boolean {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    return this.SUPPORTED_FORMATS.includes(ext);
  }

  /**
   * Get file extension
   */
  static getFileExtension(file: File): string {
    return '.' + file.name.split('.').pop()?.toLowerCase();
  }

  /**
   * Read file as ArrayBuffer
   */
  static async readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (result instanceof ArrayBuffer) {
          resolve(result);
        } else {
          reject(new Error('Failed to read file as ArrayBuffer'));
        }
      };
      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Create blob from ArrayBuffer
   */
  static arrayBufferToBlob(buffer: ArrayBuffer, type: string): Blob {
    return new Blob([buffer], { type });
  }

  /**
   * Create object URL from blob
   */
  static createObjectUrl(blob: Blob): string {
    return URL.createObjectURL(blob);
  }

  /**
   * Revoke object URL
   */
  static revokeObjectUrl(url: string): void {
    URL.revokeObjectURL(url);
  }
}
