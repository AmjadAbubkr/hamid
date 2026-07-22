import { describe, expect, it } from "vitest";
import {
  RECOVERY_ENROLLMENT_TTL_SECONDS,
  createRecoveryEnrollmentToken,
  hashRecoveryEnrollmentToken,
} from "./recovery-service";

describe("recovery enrollment token helpers", () => {
  it("creates an opaque token and stable one-way hash", () => {
    const token = createRecoveryEnrollmentToken();

    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(hashRecoveryEnrollmentToken(token)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashRecoveryEnrollmentToken(token)).toBe(hashRecoveryEnrollmentToken(token));
  });

  it("limits the enrollment bridge to ten minutes", () => {
    expect(RECOVERY_ENROLLMENT_TTL_SECONDS).toBe(600);
  });
});
