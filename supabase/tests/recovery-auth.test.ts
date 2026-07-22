import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");

async function applyMigrations(db: PGlite) {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    await db.exec(readFileSync(join(MIGRATIONS_DIR, file), "utf8"));
  }
}

describe("Portal recovery schema (ticket 03)", () => {
  let db: PGlite;

  beforeAll(async () => {
    db = new PGlite();
    await db.exec(`
      CREATE SCHEMA auth;
      CREATE TABLE auth.users (id uuid PRIMARY KEY DEFAULT gen_random_uuid());
      CREATE FUNCTION auth.uid()
      RETURNS uuid
      LANGUAGE sql
      STABLE
      AS $$
        SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
      $$;
    `);
    await applyMigrations(db);
  }, 60_000);

  afterAll(async () => {
    await db?.close();
  });

  it("stores only a hash and permits one active recovery code per Editor", async () => {
    const authUser = await db.query<{ id: string }>(
      "INSERT INTO auth.users DEFAULT VALUES RETURNING id;",
    );
    const editor = await db.query<{ id: string }>(
      "INSERT INTO editors (display_name, auth_user_id) VALUES ('Hamid', $1) RETURNING id;",
      [authUser.rows[0].id],
    );

    const columns = await db.query<{ column_name: string }>(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'recovery_codes';
    `);
    const names = new Set(columns.rows.map((column) => column.column_name));
    expect(names).toEqual(new Set(["id", "editor_id", "code_hash", "issued_at", "used_at"]));

    await db.query(
      "INSERT INTO recovery_codes (editor_id, code_hash) VALUES ($1, 'scrypt$hash');",
      [editor.rows[0].id],
    );
    await expect(
      db.query(
        "INSERT INTO recovery_codes (editor_id, code_hash) VALUES ($1, 'scrypt$another-hash');",
        [editor.rows[0].id],
      ),
    ).rejects.toThrow();

    await db.query("UPDATE recovery_codes SET used_at = now() WHERE editor_id = $1;", [editor.rows[0].id]);
    await expect(
      db.query(
        "INSERT INTO recovery_codes (editor_id, code_hash) VALUES ($1, 'scrypt$replacement-hash');",
        [editor.rows[0].id],
      ),
    ).resolves.toBeDefined();
  });

  it("keeps recovery codes inaccessible to anon and authenticated clients", async () => {
    await db.exec("SET ROLE anon;");
    await expect(db.query("SELECT * FROM recovery_codes;")).rejects.toThrow();

    await db.exec("RESET ROLE; SET ROLE authenticated;");
    await expect(db.query("SELECT * FROM recovery_codes;")).rejects.toThrow();
    await db.exec("RESET ROLE;");
  });

  it("creates short-lived, cookie-bound mandatory re-enrollment sessions", async () => {
    const authUser = await db.query<{ id: string }>(
      "INSERT INTO auth.users DEFAULT VALUES RETURNING id;",
    );

    const sessions = await db.query<{ column_name: string }>(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'recovery_enrollment_sessions';
    `);
    expect(new Set(sessions.rows.map((column) => column.column_name))).toEqual(
      new Set(["id", "auth_user_id", "token_hash", "created_at", "expires_at", "completed_at"]),
    );

    await db.query(
      `INSERT INTO recovery_enrollment_sessions (auth_user_id, token_hash, expires_at)
       VALUES ($1, 'sha256-token', now() + interval '15 minutes');`,
      [authUser.rows[0].id],
    );
    await expect(
      db.query(
        `INSERT INTO recovery_enrollment_sessions (auth_user_id, token_hash, expires_at)
         VALUES ($1, 'sha256-another-token', now() + interval '15 minutes');`,
        [authUser.rows[0].id],
      ),
    ).rejects.toThrow();
  });
});
