import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");

async function applyMigrations(db: PGlite) {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const f of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, f), "utf8");
    await db.exec(sql);
  }
}

async function asAnon(db: PGlite) {
  await db.exec("SET ROLE anon;");
}

async function asAuthenticated(db: PGlite, authUserId: string) {
  await db.exec("SET ROLE authenticated;");
  await db.query(`SELECT set_config('request.jwt.claim.sub', $1, false);`, [authUserId]);
}

async function asPostgres(db: PGlite) {
  await db.exec("RESET ROLE; RESET request.jwt.claim.sub;");
}

async function createEditor(db: PGlite) {
  const authUser = await db.query<{ id: string }>(`
    INSERT INTO auth.users DEFAULT VALUES RETURNING id;
  `);
  const editor = await db.query<{ id: string }>(`
    INSERT INTO editors (display_name, auth_user_id) VALUES ('Test Editor', $1) RETURNING id;
  `, [authUser.rows[0].id]);
  return { editorId: editor.rows[0].id, authUserId: authUser.rows[0].id };
}

describe("Content Item schema (ticket 02)", () => {
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
  }, 60000);

  afterAll(async () => {
    await db?.close();
  });

  describe("editors table", () => {
    it("exists with id, auth_user_id, display_name, created_at", async () => {
      const r = await db.query<{ column_name: string; data_type: string }>(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'editors'
        ORDER BY ordinal_position;
      `);
      const cols = Object.fromEntries(
        r.rows.map((row) => [row.column_name, row.data_type]),
      );
      expect(cols.id).toBe("uuid");
      expect(cols.auth_user_id).toBe("uuid");
      expect(cols.display_name).toBe("text");
      expect(cols.created_at).toBe("timestamp with time zone");
    });
  });

  describe("content_item_status enum", () => {
    it("has exactly draft and published values", async () => {
      const r = await db.query<{ enumlabel: string }>(`
        SELECT enumlabel FROM pg_enum
        WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'content_item_status');
      `);
      const labels = r.rows.map((row) => row.enumlabel).sort();
      expect(labels).toEqual(["draft", "published"]);
    });
  });

  describe("validate_content_item_publish()", () => {
    it("accepts content_item_status values passed by a status trigger", async () => {
      await expect(
        db.query(`
          SELECT public.validate_content_item_publish(
            'published'::public.content_item_status,
            'ar-title',
            'fr-title',
            'ar-body',
            'fr-body',
            now()
          );
        `),
      ).resolves.toBeDefined();
    });
  });

  describe("position_held table (pattern exemplar)", () => {
    it("has shared Content Item columns", async () => {
      const r = await db.query<{ column_name: string }>(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'position_held'
        ORDER BY ordinal_position;
      `);
      const names = new Set(r.rows.map((row) => row.column_name));
      for (const required of [
        "id",
        "slug",
        "status",
        "title_ar",
        "title_fr",
        "body_ar",
        "body_fr",
        "author_editor_id",
        "created_at",
        "updated_at",
        "published_at",
      ]) {
        expect(names.has(required), `missing shared column: ${required}`).toBe(true);
      }
    });

    it("has type-specific columns", async () => {
      const r = await db.query<{ column_name: string }>(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'position_held'
        ORDER BY ordinal_position;
      `);
      const names = new Set(r.rows.map((row) => row.column_name));
      for (const required of ["institution", "start_date", "end_date", "location"]) {
        expect(names.has(required), `missing type-specific column: ${required}`).toBe(true);
      }
    });

    it("slug is unique", async () => {
      const r = await db.query<{ indexname: string }>(`
        SELECT indexname FROM pg_indexes
        WHERE tablename = 'position_held' AND indexname = 'position_held_slug_key';
      `);
      expect(r.rows.length).toBe(1);
    });

    it("status defaults to draft", async () => {
      const r = await db.query<{ column_default: string }>(`
        SELECT column_default FROM information_schema.columns
        WHERE table_name = 'position_held' AND column_name = 'status';
      `);
      expect(r.rows[0].column_default).toContain("'draft'");
    });

    it("published_at is nullable and defaults to null", async () => {
      const r = await db.query<{ is_nullable: string; column_default: string | null }>(`
        SELECT is_nullable, column_default FROM information_schema.columns
        WHERE table_name = 'position_held' AND column_name = 'published_at';
      `);
      expect(r.rows[0].is_nullable).toBe("YES");
      expect(r.rows[0].column_default).toBeNull();
    });
  });

  describe("publish_content_item() gating function", () => {
    let editorId: string;
    let authUserId: string;

    beforeEach(async () => {
      await asPostgres(db);
      await db.exec("DELETE FROM position_held;");
      await db.exec("DELETE FROM editors;");
      ({ editorId, authUserId } = await createEditor(db));
    });

    it("publishes with bilingual titles and required Position Held fields", async () => {
      const ins = await db.query<{ id: string }>(`
        INSERT INTO position_held (slug, title_ar, title_fr, institution, start_date, location, author_editor_id)
        VALUES ('amb-tchad', 'ar-title', 'fr-title', 'Ministry', '2026-05-22', 'N''Djamena', $1)
        RETURNING id;
      `, [editorId]);
      const id = ins.rows[0].id;

      await asAuthenticated(db, authUserId);
      await db.query(`SELECT publish_content_item('position_held', $1);`, [id]);

      const r = await db.query<{ status: string; published_at: string | null }>(`
        SELECT status, published_at FROM position_held WHERE id = $1;
      `, [id]);
      expect(r.rows[0].status).toBe("published");
      expect(r.rows[0].published_at).not.toBeNull();
    });

    it("raises when Arabic title is empty", async () => {
      const ins = await db.query<{ id: string }>(`
        INSERT INTO position_held (slug, title_ar, title_fr, institution, start_date, location, author_editor_id)
        VALUES ('no-ar-title', '', 'fr-title', 'Ministry', '2026-05-22', 'N''Djamena', $1)
        RETURNING id;
      `, [editorId]);
      const id = ins.rows[0].id;

      await asAuthenticated(db, authUserId);
      await expect(
        db.query(`SELECT publish_content_item('position_held', $1);`, [id]),
      ).rejects.toThrow(/arabic.*title/i);
    });

    it("allows an optional summary to be empty in both Locales", async () => {
      const ins = await db.query<{ id: string }>(`
        INSERT INTO position_held (slug, title_ar, title_fr, body_ar, body_fr, institution, start_date, location, author_editor_id)
        VALUES ('no-summary', 'ar-title', 'fr-title', NULL, NULL, 'Ministry', '2026-05-22', 'N''Djamena', $1)
        RETURNING id;
      `, [editorId]);
      const id = ins.rows[0].id;

      await asAuthenticated(db, authUserId);
      await expect(db.query(`SELECT publish_content_item('position_held', $1);`, [id])).resolves.toBeDefined();
    });

    it("rejects an optional summary supplied in only one Locale", async () => {
      const ins = await db.query<{ id: string }>(`
        INSERT INTO position_held (slug, title_ar, title_fr, body_ar, institution, start_date, location, author_editor_id)
        VALUES ('one-sided-summary', 'ar-title', 'fr-title', 'Arabic only', 'Ministry', '2026-05-22', 'N''Djamena', $1)
        RETURNING id;
      `, [editorId]);

      await asAuthenticated(db, authUserId);
      await expect(
        db.query(`SELECT publish_content_item('position_held', $1);`, [ins.rows[0].id]),
      ).rejects.toThrow(/french.*body/i);
    });

    it("requires a start date before publication", async () => {
      const ins = await db.query<{ id: string }>(`
        INSERT INTO position_held (slug, title_ar, title_fr, institution, location, author_editor_id)
        VALUES ('no-start-date', 'ar-title', 'fr-title', 'Ministry', 'N''Djamena', $1)
        RETURNING id;
      `, [editorId]);

      await asAuthenticated(db, authUserId);
      await expect(
        db.query(`SELECT publish_content_item('position_held', $1);`, [ins.rows[0].id]),
      ).rejects.toThrow(/start date/i);
    });

    it("cannot be bypassed by direct status UPDATE", async () => {
      const ins = await db.query<{ id: string }>(`
        INSERT INTO position_held (slug, title_ar, title_fr, institution, start_date, location, author_editor_id)
        VALUES ('bypass-attempt', '', '', 'Ministry', '2026-05-22', 'N''Djamena', $1)
        RETURNING id;
      `, [editorId]);
      const id = ins.rows[0].id;

      await asAuthenticated(db, authUserId);
      await expect(
        db.query(`
          UPDATE position_held SET status = 'published', published_at = now()
          WHERE id = $1;
        `, [id]),
      ).rejects.toThrow(/publish_content_item/i);
    });

    it("cannot be bypassed by directly inserting a published row", async () => {
      await asAuthenticated(db, authUserId);
      await expect(
        db.query(`
          INSERT INTO position_held (
            slug, status, published_at, title_ar, title_fr, institution, start_date, location, author_editor_id
          )
          VALUES (
            'direct-published-insert', 'published', now(), 'ar-title', 'fr-title',
            'Ministry', '2026-05-22', 'N''Djamena', $1
          );
        `, [editorId]),
      ).rejects.toThrow(/publish_content_item/i);
    });

    it("cannot be bypassed by forging the former publish-in-progress setting", async () => {
      const ins = await db.query<{ id: string }>(`
        INSERT INTO position_held (slug, title_ar, title_fr, institution, start_date, location, author_editor_id)
        VALUES ('forged-setting', 'ar-title', 'fr-title', 'Ministry', '2026-05-22', 'N''Djamena', $1)
        RETURNING id;
      `, [editorId]);

      await asAuthenticated(db, authUserId);
      await db.query(`SELECT set_config('app.publish_in_progress', '1', false);`);
      await expect(
        db.query(`
          UPDATE position_held SET status = 'published', published_at = now() WHERE id = $1;
        `, [ins.rows[0].id]),
      ).rejects.toThrow(/publish_content_item/i);
    });

    it("rejects setting published_at while the item is still a draft", async () => {
      const ins = await db.query<{ id: string }>(`
        INSERT INTO position_held (slug, title_ar, title_fr, institution, start_date, location, author_editor_id)
        VALUES ('draft-with-date', 'ar-title', 'fr-title', 'Ministry', '2026-05-22', 'N''Djamena', $1)
        RETURNING id;
      `, [editorId]);

      await asAuthenticated(db, authUserId);
      await expect(
        db.query(`UPDATE position_held SET published_at = now() WHERE id = $1;`, [ins.rows[0].id]),
      ).rejects.toThrow();
    });

    it("rejects clearing published_at from a published item", async () => {
      const ins = await db.query<{ id: string }>(`
        INSERT INTO position_held (slug, title_ar, title_fr, institution, start_date, location, author_editor_id)
        VALUES ('published-without-date', 'ar-title', 'fr-title', 'Ministry', '2026-05-22', 'N''Djamena', $1)
        RETURNING id;
      `, [editorId]);
      const id = ins.rows[0].id;
      await asAuthenticated(db, authUserId);
      await db.query(`SELECT publish_content_item('position_held', $1);`, [id]);

      await expect(
        db.query(`UPDATE position_held SET published_at = NULL WHERE id = $1;`, [id]),
      ).rejects.toThrow();
    });

    it("allows draft fields to be updated without triggering publication validation", async () => {
      const ins = await db.query<{ id: string }>(`
        INSERT INTO position_held (slug, title_ar, title_fr, institution, author_editor_id)
        VALUES ('update-title', 'ar-title', 'fr-title', 'Ministry', $1)
        RETURNING id;
      `, [editorId]);
      const id = ins.rows[0].id;

      await asAuthenticated(db, authUserId);
      await db.query(`
        UPDATE position_held SET title_ar = 'new ar title' WHERE id = $1;
      `, [id]);

      const r = await db.query<{ title_ar: string }>(`
        SELECT title_ar FROM position_held WHERE id = $1;
      `, [id]);
      expect(r.rows[0].title_ar).toBe("new ar title");
    });

    it("rejects later edits that make a published item incomplete", async () => {
      const ins = await db.query<{ id: string }>(`
        INSERT INTO position_held (slug, title_ar, title_fr, institution, start_date, location, author_editor_id)
        VALUES ('published-title-change', 'ar-title', 'fr-title', 'Ministry', '2026-05-22', 'N''Djamena', $1)
        RETURNING id;
      `, [editorId]);
      const id = ins.rows[0].id;
      await asAuthenticated(db, authUserId);
      await db.query(`SELECT publish_content_item('position_held', $1);`, [id]);

      await expect(
        db.query(`UPDATE position_held SET title_fr = '' WHERE id = $1;`, [id]),
      ).rejects.toThrow(/french.*title/i);
    });
  });

  describe("Row-Level Security", () => {
    let editorId: string;
    let authUserId: string;

    beforeEach(async () => {
      await asPostgres(db);
      await db.exec("DELETE FROM position_held;");
      await db.exec("DELETE FROM editors;");
      ({ editorId, authUserId } = await createEditor(db));
      await db.query(`
        INSERT INTO position_held (slug, title_ar, title_fr, body_ar, body_fr, institution, start_date, location, author_editor_id)
        VALUES
          ('draft-row', 'ar', 'fr', 'arb', 'frb', 'M', '2026-05-22', 'N''Djamena', $1),
          ('pub-row', 'ar', 'fr', 'arb', 'frb', 'M', '2026-05-22', 'N''Djamena', $1);
      `, [editorId]);
      // Publish only the 'pub-row' using the gate function
      const pub = await db.query<{ id: string }>(`
        SELECT id FROM position_held WHERE slug = 'pub-row';
      `);
      await asAuthenticated(db, authUserId);
      await db.query(`SELECT publish_content_item('position_held', $1);`, [pub.rows[0].id]);
      await asPostgres(db);
    });

    it("anon role can SELECT only published rows", async () => {
      await asAnon(db);
      const r = await db.query<{ slug: string }>(`
        SELECT slug FROM position_held ORDER BY slug;
      `);
      expect(r.rows.map((row) => row.slug)).toEqual(["pub-row"]);
    });

    it("anon role cannot INSERT", async () => {
      await asAnon(db);
      await expect(
        db.query(`
          INSERT INTO position_held (slug, title_ar, title_fr, body_ar, body_fr, institution, author_editor_id)
          VALUES ('anon-insert', 'a', 'f', 'ab', 'fb', 'M', $1);
        `, [editorId]),
      ).rejects.toThrow();
    });

    it("anon role cannot UPDATE", async () => {
      await asAnon(db);
      await expect(
        db.query(`UPDATE position_held SET title_ar = 'hacked' WHERE slug = 'pub-row';`),
      ).rejects.toThrow();
    });

    it("anon role cannot DELETE", async () => {
      await asAnon(db);
      await expect(
        db.query(`DELETE FROM position_held WHERE slug = 'pub-row';`),
      ).rejects.toThrow();
    });

    it("anon role cannot call the privileged publish function", async () => {
      await asAnon(db);
      await expect(
        db.query(`SELECT publish_content_item('position_held', '00000000-0000-0000-0000-000000000000');`),
      ).rejects.toThrow(/permission denied/i);
    });

    it("authenticated Editor can read and update their own draft", async () => {
      await asAuthenticated(db, authUserId);
      const rows = await db.query<{ slug: string }>(`
        SELECT slug FROM position_held ORDER BY slug;
      `);
      expect(rows.rows.map((row) => row.slug)).toEqual(["draft-row", "pub-row"]);

      await expect(
        db.query(`UPDATE position_held SET title_ar = 'updated' WHERE slug = 'draft-row';`),
      ).resolves.toBeDefined();
    });

    it("authenticated Editor cannot publish another Editor's item", async () => {
      const other = await createEditor(db);
      const item = await db.query<{ id: string }>(`
        INSERT INTO position_held (slug, title_ar, title_fr, institution, start_date, location, author_editor_id)
        VALUES ('other-editor-draft', 'ar', 'fr', 'M', '2026-05-22', 'N''Djamena', $1)
        RETURNING id;
      `, [other.editorId]);

      await asAuthenticated(db, authUserId);
      await expect(
        db.query(`SELECT publish_content_item('position_held', $1);`, [item.rows[0].id]),
      ).rejects.toThrow(/not authorized/i);
    });
  });
});
