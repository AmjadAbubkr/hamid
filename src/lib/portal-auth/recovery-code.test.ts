import { describe, expect, it } from "vitest";

import {
  RECOVERY_CODE_DIGITS,
  generateRecoveryCode,
  hashRecoveryCode,
  verifyRecoveryCode,
} from "./recovery-code";

describe("recovery code helpers", () => {
  it("generates a 20-digit numeric code", () => {
    const code = generateRecoveryCode();

    expect(RECOVERY_CODE_DIGITS).toBe(20);
    expect(code).toMatch(/^\d{20}$/);
  });

  it("hashes a valid recovery code without storing it in plaintext", async () => {
    const code = "01234567890123456789";
    const hash = await hashRecoveryCode(code);

    expect(hash).toMatch(/^scrypt\$N=16384,r=8,p=1\$[0-9a-f]+\$[0-9a-f]+$/);
    expect(hash).not.toContain(code);
  });

  it("verifies only the code used to create the hash", async () => {
    const hash = await hashRecoveryCode("01234567890123456789");

    await expect(verifyRecoveryCode("01234567890123456789", hash)).resolves.toBe(true);
    await expect(verifyRecoveryCode("01234567890123456780", hash)).resolves.toBe(false);
  });

  it("rejects malformed code and stored-hash input without throwing", async () => {
    const hash = await hashRecoveryCode("01234567890123456789");

    await expect(verifyRecoveryCode("not-a-code", hash)).resolves.toBe(false);
    await expect(verifyRecoveryCode("01234567890123456789", "not-a-scrypt-hash")).resolves.toBe(false);
  });
});
