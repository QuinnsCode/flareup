/**
 * src/lib/crypto/envelope.ts
 *
 * Envelope encryption using Web Crypto API (available in workerd).
 *
 * Flow:
 *   ENCRYPT:
 *     1. Generate random DEK (AES-GCM 256-bit)
 *     2. Encrypt plaintext with DEK → encryptedToken
 *     3. Encrypt DEK with KEK (from Workers Secret) → encryptedDek
 *     4. Store both ciphertexts in DB — plaintext never persisted
 *
 *   DECRYPT:
 *     1. Unwrap DEK using KEK
 *     2. Decrypt encryptedToken using DEK
 *     3. Return plaintext — only lives in Worker memory
 *
 * Delete = row gone → cryptographically unrecoverable.
 */

const ALGO = { name: "AES-GCM", length: 256 } as const;
const IV_BYTES = 12; // 96-bit IV for AES-GCM

// ── KEK ──────────────────────────────────────────────────────────────────────

let _kek: CryptoKey | null = null;

async function getKek(secret: string): Promise<CryptoKey> {
  if (_kek) return _kek;
  // secret is a 64-char hex string (32 bytes)
  const raw = hexToBytes(secret);
  _kek = await crypto.subtle.importKey("raw", raw, ALGO, false, ["wrapKey", "unwrapKey"]);
  return _kek;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

function toBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

async function aesEncrypt(key: CryptoKey, plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  // store as base64(iv + ciphertext)
  const combined = new Uint8Array(IV_BYTES + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), IV_BYTES);
  return toBase64(combined.buffer);
}

async function aesDecrypt(key: CryptoKey, b64: string): Promise<string> {
  const combined = fromBase64(b64);
  const iv = combined.slice(0, IV_BYTES);
  const ciphertext = combined.slice(IV_BYTES);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return new TextDecoder().decode(plaintext);
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface EncryptedEnvelope {
  encryptedToken: string; // base64(iv + ciphertext) — token encrypted with DEK
  encryptedDek:   string; // base64(iv + wrappedDek) — DEK wrapped with KEK
}

/**
 * Encrypt a CF API token for storage.
 * kekSecret = env.KEK_SECRET (hex string from Workers Secrets)
 */
export async function encryptToken(
  plaintext: string,
  kekSecret: string
): Promise<EncryptedEnvelope> {
  const kek = await getKek(kekSecret);

  // Generate fresh DEK
  const dek = await crypto.subtle.generateKey(ALGO, true, ["encrypt", "decrypt"]);

  // Encrypt token with DEK
  const encryptedToken = await aesEncrypt(dek, plaintext);

  // Wrap DEK with KEK
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const wrappedDek = await crypto.subtle.wrapKey("raw", dek, kek, { name: "AES-GCM", iv });
  const combined = new Uint8Array(IV_BYTES + wrappedDek.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(wrappedDek), IV_BYTES);
  const encryptedDek = toBase64(combined.buffer);

  return { encryptedToken, encryptedDek };
}

/**
 * Decrypt a stored CF API token.
 * kekSecret = env.KEK_SECRET (hex string from Workers Secrets)
 */
export async function decryptToken(
  envelope: EncryptedEnvelope,
  kekSecret: string
): Promise<string> {
  const kek = await getKek(kekSecret);

  // Unwrap DEK
  const combined = fromBase64(envelope.encryptedDek);
  const iv = combined.slice(0, IV_BYTES);
  const wrappedDek = combined.slice(IV_BYTES);
  const dek = await crypto.subtle.unwrapKey(
    "raw", wrappedDek, kek,
    { name: "AES-GCM", iv },
    ALGO, false, ["encrypt", "decrypt"]
  );

  // Decrypt token
  return aesDecrypt(dek, envelope.encryptedToken);
}