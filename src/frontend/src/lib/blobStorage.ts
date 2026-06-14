/**
 * Blob storage shim.
 * When @icp-sdk/blob-storage is available at runtime it will be used;
 * otherwise this falls back to a local object-URL approach (dev/preview only).
 */

export interface BlobUploadHandle {
  withUploadProgress(callback: (progress: number) => void): BlobUploadHandle;
  getDirectURL(): string | Promise<string>;
}

class LocalBlobHandle implements BlobUploadHandle {
  private bytes: Uint8Array;
  private progressCallback: ((p: number) => void) | null = null;

  constructor(bytes: Uint8Array) {
    this.bytes = bytes;
  }

  withUploadProgress(callback: (progress: number) => void): BlobUploadHandle {
    this.progressCallback = callback;
    return this;
  }

  getDirectURL(): string | Promise<string> {
    // Simulate progress
    if (this.progressCallback) {
      setTimeout(() => this.progressCallback?.(0.5), 50);
      setTimeout(() => this.progressCallback?.(1.0), 100);
    }
    const blob = new Blob([this.bytes.buffer as ArrayBuffer]);
    return URL.createObjectURL(blob);
  }
}

export function createBlobFromBytes(bytes: Uint8Array): BlobUploadHandle {
  // Try to use the platform SDK if available at runtime
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  if (w.__icpBlobStorage?.ExternalBlob) {
    return w.__icpBlobStorage.ExternalBlob.fromBytes(bytes);
  }
  return new LocalBlobHandle(bytes);
}
