import { randomInt, randomBytes, scrypt, timingSafeEqual } from "node:crypto";

export const RECOVERY_CODE_DIGITS = 20;

const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_PARAMS = {
  N: 16_384,
  r: 8,
  p: 1,
  maxmem: 32 * 1024 * 1024,
} as const;
const SCRYPT_PREFIX = `scrypt$N=${SCRYPT_PARAMS.N},r=${SCRYPT_PARAMS.r},p=${SCRYPT_PARAMS.p}`;

export function generateRecoveryCode(): string {
  let code = "";

  for (let digit = 0; digit < RECOVERY_CODE_DIGITS; digit += 1) {
    code += randomInt(0, 10).toString();
  }

  return code;
}

export async function hashRecoveryCode(code: string): Promise<string> {
  assertRecoveryCode(code);

  const salt = randomBytes(16);
  const derivedKey = await deriveKey(code, salt);

  return `${SCRYPT_PREFIX}$${salt.toString("hex")}$${derivedKey.toString("hex")}`;
}

export async function verifyRecoveryCode(code: string, encodedHash: string): Promise<boolean> {
  if (!isRecoveryCode(code)) {
    return false;
  }

  const stored = parseHash(encodedHash);
  if (!stored) {
    return false;
  }

  try {
    const derivedKey = await deriveKey(code, stored.salt);
    return timingSafeEqual(derivedKey, stored.derivedKey);
  } catch {
    return false;
  }
}

function assertRecoveryCode(code: string): void {
  if (!isRecoveryCode(code)) {
    throw new Error(`Recovery code must contain exactly ${RECOVERY_CODE_DIGITS} digits.`);
  }
}

function isRecoveryCode(code: string): boolean {
  return new RegExp(`^\\d{${RECOVERY_CODE_DIGITS}}$`).test(code);
}

async function deriveKey(code: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(code, salt, SCRYPT_KEY_LENGTH, SCRYPT_PARAMS, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derivedKey);
    });
  });
}

function parseHash(encodedHash: string): { salt: Buffer; derivedKey: Buffer } | null {
  const [algorithm, parameters, saltHex, derivedKeyHex, extra] = encodedHash.split("$");
  if (`${algorithm}$${parameters}` !== SCRYPT_PREFIX || !saltHex || !derivedKeyHex || extra !== undefined) {
    return null;
  }

  if (!/^[0-9a-f]+$/i.test(saltHex) || !/^[0-9a-f]+$/i.test(derivedKeyHex)) {
    return null;
  }

  const salt = Buffer.from(saltHex, "hex");
  const derivedKey = Buffer.from(derivedKeyHex, "hex");
  if (salt.length !== 16 || derivedKey.length !== SCRYPT_KEY_LENGTH) {
    return null;
  }

  return { salt, derivedKey };
}
