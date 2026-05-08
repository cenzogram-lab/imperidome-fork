declare module "@icp-sdk/blob-storage" {
  export class ExternalBlob {
    static fromBytes(bytes: Uint8Array): ExternalBlob;
    withUploadProgress(callback: (progress: number) => void): ExternalBlob;
    getDirectURL(): string;
  }
}
