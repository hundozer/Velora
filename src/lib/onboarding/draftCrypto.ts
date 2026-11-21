import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const TTL_MS = 7 * 24 * 60 * 60 * 1000;
const IV_LENGTH = 12;

/** Never use a NEXT_PUBLIC key. Deploy with a random 32-byte hex secret. */
function key(): Buffer | null {
  const value = process.env.INTIMO_ONBOARDING_DRAFT_KEY;
  return value && /^[0-9a-f]{64}$/i.test(value) ? Buffer.from(value, "hex") : null;
}

export function draftsEnabled(): boolean {
  return key() !== null;
}

export function draftExpiry(now = Date.now()): string {
  return new Date(now + TTL_MS).toISOString();
}

export function encryptDraft(data: unknown, subject: string) {
  const secret = key();
  if (!secret) throw new Error("Draft encryption unavailable");
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", secret, iv);
  cipher.setAAD(Buffer.from(`intimo-onboarding:v1:${subject}`, "utf8"));
  const encoded = Buffer.concat([cipher.update(JSON.stringify(data), "utf8"), cipher.final()]);
  return {
    nonce: iv.toString("base64url"),
    ciphertext: Buffer.concat([encoded, cipher.getAuthTag()]).toString("base64url"),
  };
}

export function decryptDraft(ciphertext: string, nonce: string, subject: string): unknown {
  const secret = key();
  if (!secret) throw new Error("Draft encryption unavailable");
  const iv = Buffer.from(nonce, "base64url");
  const packed = Buffer.from(ciphertext, "base64url");
  if (iv.length !== IV_LENGTH || packed.length < 17 || packed.length > 12000) throw new Error("Invalid draft");
  const decipher = createDecipheriv("aes-256-gcm", secret, iv);
  decipher.setAAD(Buffer.from(`intimo-onboarding:v1:${subject}`, "utf8"));
  decipher.setAuthTag(packed.subarray(packed.length - 16));
  return JSON.parse(Buffer.concat([
    decipher.update(packed.subarray(0, packed.length - 16)),
    decipher.final(),
  ]).toString("utf8"));
}
