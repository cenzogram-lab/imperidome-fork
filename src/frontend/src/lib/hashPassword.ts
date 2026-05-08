/**
 * Hash a password string with SHA-256 using the browser's SubtleCrypto API.
 * Returns a Uint8Array suitable for passing to backend functions that accept Blob.
 */
export async function hashPassword(password: string): Promise<Uint8Array> {
  const encoded = new TextEncoder().encode(password);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", encoded);
  return new Uint8Array(hashBuffer);
}
