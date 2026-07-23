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

  describe("Position Held publication rebuild trigger", () => {
    it("runs only for a draft-to-published status change", async () => {
      const trigger = await db.query<{ definition: string }>(`
        SELECT pg_get_triggerdef(oid) AS definition
        FROM pg_trigger
        WHERE tgname = 'position_held_publish_netlify_rebuild';
      `);

      expect(trigger.rows).toHaveLength(1);
      expect(trigger.rows[0].definition).toMatch(/AFTER UPDATE OF status/i);
      expect(trigger.rows[0].definition).toMatch(/OLD\.status = 'draft'.*NEW\.status = 'published'/i);
    });
  });

  describe("Education Entry schema", () => {
    let editorId: string;
    let authUserId: string;

    beforeEach(async () => {
      await asPostgres(db);
      await db.exec("DELETE FROM education_entry;");
      await db.exec("DELETE FROM position_held;");
      await db.exec("DELETE FROM editors;");
      ({ editorId, authUserId } = await createEditor(db));
    });

    it("has paired degree, institution, and optional honours fields", async () => {
      const columns = await db.query<{ column_name: string }>(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'education_entry';
      `);
      const names = new Set(columns.rows.map((row) => row.column_name));

      for (const required of [
        "degree_ar",
        "degree_fr",
        "institution_ar",
        "institution_fr",
        "honours_ar",
        "honours_fr",
        "start_date",
        "end_date",
        "location",
      ]) {
        expect(names.has(required), `missing ${required}`).toBe(true);
      }
    });

    it("publishes a complete Education Entry through the fixed RPC branch", async () => {
      const inserted = await db.query<{ id: string }>(`
        INSERT INTO education_entry (
          slug, degree_ar, degree_fr, institution_ar, institution_fr,
          start_date, end_date, location, author_editor_id
        )
        VALUES (
          'masters', 'degree ar', 'degree fr', 'institution ar', 'institution fr',
          '2020-09-01', '2021-06-30', 'N''Djamena', $1
        )
        RETURNING id;
      `, [editorId]);

      await asAuthenticated(db, authUserId);
      await db.query(`SELECT publish_content_item('education_entry', $1);`, [inserted.rows[0].id]);

      const published = await db.query<{ status: string; published_at: string | null }>(`
        SELECT status, published_at FROM education_entry WHERE id = $1;
      `, [inserted.rows[0].id]);
      expect(published.rows[0]).toMatchObject({ status: "published" });
      expect(published.rows[0].published_at).not.toBeNull();
    });

    it("rejects one-sided honours before publication", async () => {
      const inserted = await db.query<{ id: string }>(`
        INSERT INTO education_entry (
          slug, degree_ar, degree_fr, institution_ar, institution_fr,
          honours_ar, start_date, location, author_editor_id
        )
        VALUES (
          'one-sided-honours', 'degree ar', 'degree fr', 'institution ar', 'institution fr',
          'honours ar', '2020-09-01', 'N''Djamena', $1
        )
        RETURNING id;
      `, [editorId]);

      await asAuthenticated(db, authUserId);
      await expect(
        db.query(`SELECT publish_content_item('education_entry', $1);`, [inserted.rows[0].id]),
      ).rejects.toThrow(/french.*body/i);
    });

    it("requires an end date before an Education Entry can publish", async () => {
      const inserted = await db.query<{ id: string }>(`
        INSERT INTO education_entry (
          slug, degree_ar, degree_fr, institution_ar, institution_fr,
          start_date, location, author_editor_id
        )
        VALUES (
          'education-without-end', 'degree ar', 'degree fr', 'institution ar', 'institution fr',
          '2020-09-01', 'N''Djamena', $1
        )
        RETURNING id;
      `, [editorId]);

      await asAuthenticated(db, authUserId);
      await expect(
        db.query(`SELECT publish_content_item('education_entry', $1);`, [inserted.rows[0].id]),
      ).rejects.toThrow(/end date/i);
    });

    it("allows anon to read only published Education Entries", async () => {
      await db.query(`
        INSERT INTO education_entry (
          slug, degree_ar, degree_fr, institution_ar, institution_fr,
          start_date, end_date, location, author_editor_id
        )
        VALUES
          ('education-draft', 'degree ar', 'degree fr', 'institution ar', 'institution fr', '2020-09-01', NULL, 'N''Djamena', $1),
          ('education-public', 'degree ar', 'degree fr', 'institution ar', 'institution fr', '2020-09-01', '2021-06-30', 'N''Djamena', $1);
      `, [editorId]);
      const publicRow = await db.query<{ id: string }>(`
        SELECT id FROM education_entry WHERE slug = 'education-public';
      `);

      await asAuthenticated(db, authUserId);
      await db.query(`SELECT publish_content_item('education_entry', $1);`, [publicRow.rows[0].id]);
      await asAnon(db);

      const visible = await db.query<{ slug: string }>(`
        SELECT slug FROM education_entry ORDER BY slug;
      `);
      expect(visible.rows.map((row) => row.slug)).toEqual(["education-public"]);
    });

    it("fires its rebuild trigger only when status changes from draft to published", async () => {
      const trigger = await db.query<{ definition: string }>(`
        SELECT pg_get_triggerdef(oid) AS definition
        FROM pg_trigger
        WHERE tgname = 'education_entry_publish_netlify_rebuild';
      `);

      expect(trigger.rows).toHaveLength(1);
      expect(trigger.rows[0].definition).toMatch(/AFTER UPDATE OF status/i);
      expect(trigger.rows[0].definition).toMatch(/OLD\.status = 'draft'.*NEW\.status = 'published'/i);
    });
  });

  describe("Past Participation schema", () => {
    let editorId: string;
    let authUserId: string;

    beforeEach(async () => {
      await asPostgres(db);
      await db.exec("DELETE FROM past_participation;");
      await db.exec("DELETE FROM education_entry;");
      await db.exec("DELETE FROM position_held;");
      await db.exec("DELETE FROM editors;");
      ({ editorId, authUserId } = await createEditor(db));
    });

    it("has the expanded canonical role enum and historical date fields", async () => {
      const roles = await db.query<{ enumlabel: string }>(`
        SELECT enumlabel
        FROM pg_enum
        WHERE enumtypid = 'public.participation_role'::regtype
        ORDER BY enumsortorder;
      `);
      expect(roles.rows.map((row) => row.enumlabel)).toEqual([
        "Speaker", "Panelist", "Host", "Delegate", "Rapporteur", "Facilitator",
        "Coordinator", "usher", "President", "Representative", "Ambassador",
        "Trainer", "Member", "Participant", "Other",
      ]);

      const columns = await db.query<{ column_name: string }>(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'past_participation';
      `);
      const names = new Set(columns.rows.map((row) => row.column_name));
      for (const required of [
        "event_date",
        "event_end_date",
        "event_date_label",
        "venue_ar",
        "venue_fr",
        "institution_ar",
        "institution_fr",
        "role",
        "role_other_ar",
        "role_other_fr",
        "source_url",
      ]) {
        expect(names.has(required), `missing ${required}`).toBe(true);
      }
    });

    it("publishes a complete Other-role participation through the fixed RPC branch", async () => {
      const inserted = await db.query<{ id: string }>(`
        INSERT INTO past_participation (
          slug, title_ar, title_fr, event_date, event_date_label,
          venue_ar, venue_fr, institution_ar, institution_fr,
          role, role_other_ar, role_other_fr, author_editor_id
        )
        VALUES (
          'forum', 'title ar', 'title fr', '2024-05-01', 'May 2024',
          'venue ar', 'venue fr', 'institution ar', 'institution fr',
          'Other', 'role ar', 'role fr', $1
        )
        RETURNING id;
      `, [editorId]);

      await asAuthenticated(db, authUserId);
      await db.query(`SELECT publish_content_item('past_participation', $1);`, [inserted.rows[0].id]);

      const published = await db.query<{ status: string; published_at: string | null }>(`
        SELECT status, published_at FROM past_participation WHERE id = $1;
      `, [inserted.rows[0].id]);
      expect(published.rows[0]).toMatchObject({ status: "published" });
      expect(published.rows[0].published_at).not.toBeNull();
    });

    it("rejects Other when either Locale of role_other is missing", async () => {
      const inserted = await db.query<{ id: string }>(`
        INSERT INTO past_participation (
          slug, title_ar, title_fr, event_date, event_date_label,
          venue_ar, venue_fr, institution_ar, institution_fr,
          role, role_other_ar, author_editor_id
        )
        VALUES (
          'missing-other-fr', 'title ar', 'title fr', '2024-05-01', 'May 2024',
          'venue ar', 'venue fr', 'institution ar', 'institution fr',
          'Other', 'role ar', $1
        )
        RETURNING id;
      `, [editorId]);

      await asAuthenticated(db, authUserId);
      await expect(
        db.query(`SELECT publish_content_item('past_participation', $1);`, [inserted.rows[0].id]),
      ).rejects.toThrow(/other role/i);
    });

    it("rejects changes to a published historical record", async () => {
      const inserted = await db.query<{ id: string }>(`
        INSERT INTO past_participation (
          slug, title_ar, title_fr, event_date, event_date_label,
          venue_ar, venue_fr, institution_ar, institution_fr, role, author_editor_id
        )
        VALUES (
          'immutable-record', 'title ar', 'title fr', '2024-05-01', 'May 2024',
          'venue ar', 'venue fr', 'institution ar', 'institution fr', 'Speaker', $1
        )
        RETURNING id;
      `, [editorId]);

      await asAuthenticated(db, authUserId);
      await db.query(`SELECT publish_content_item('past_participation', $1);`, [inserted.rows[0].id]);
      await expect(
        db.query(`UPDATE past_participation SET title_fr = 'updated' WHERE id = $1;`, [inserted.rows[0].id]),
      ).rejects.toThrow(/immutable/i);
    });

    it("allows anon to read only published participations", async () => {
      await db.query(`
        INSERT INTO past_participation (
          slug, title_ar, title_fr, event_date, event_date_label,
          venue_ar, venue_fr, institution_ar, institution_fr, role, author_editor_id
        )
        VALUES
          ('participation-draft', 'title ar', 'title fr', '2024-05-01', 'May 2024', 'venue ar', 'venue fr', 'institution ar', 'institution fr', 'Speaker', $1),
          ('participation-public', 'title ar', 'title fr', '2024-05-01', 'May 2024', 'venue ar', 'venue fr', 'institution ar', 'institution fr', 'Speaker', $1);
      `, [editorId]);
      const publicRow = await db.query<{ id: string }>(`
        SELECT id FROM past_participation WHERE slug = 'participation-public';
      `);

      await asAuthenticated(db, authUserId);
      await db.query(`SELECT publish_content_item('past_participation', $1);`, [publicRow.rows[0].id]);
      await asAnon(db);

      const visible = await db.query<{ slug: string }>(`
        SELECT slug FROM past_participation ORDER BY slug;
      `);
      expect(visible.rows.map((row) => row.slug)).toEqual(["participation-public"]);
    });

    it("fires its rebuild trigger only on first publication", async () => {
      const trigger = await db.query<{ definition: string }>(`
        SELECT pg_get_triggerdef(oid) AS definition
        FROM pg_trigger
        WHERE tgname = 'past_participation_publish_netlify_rebuild';
      `);

      expect(trigger.rows).toHaveLength(1);
      expect(trigger.rows[0].definition).toMatch(/AFTER UPDATE OF status/i);
      expect(trigger.rows[0].definition).toMatch(/OLD\.status = 'draft'.*NEW\.status = 'published'/i);
    });
  });

  describe("Upcoming Event schema and archive operation", () => {
    let editorId: string;
    let authUserId: string;

    beforeEach(async () => {
      await asPostgres(db);
      await db.exec("DELETE FROM upcoming_event;");
      await db.exec("DELETE FROM past_participation;");
      await db.exec("DELETE FROM education_entry;");
      await db.exec("DELETE FROM position_held;");
      await db.exec("DELETE FROM editors;");
      ({ editorId, authUserId } = await createEditor(db));
    });

    it("has the future-event fields while reusing participation_role", async () => {
      const columns = await db.query<{ column_name: string }>(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'upcoming_event';
      `);
      const names = new Set(columns.rows.map((row) => row.column_name));
      for (const required of [
        "event_date",
        "venue_ar",
        "venue_fr",
        "institution_ar",
        "institution_fr",
        "role",
        "role_other_ar",
        "role_other_fr",
        "registration_url",
      ]) {
        expect(names.has(required), `missing ${required}`).toBe(true);
      }

      const roleType = await db.query<{ udt_name: string }>(`
        SELECT udt_name
        FROM information_schema.columns
        WHERE table_name = 'upcoming_event' AND column_name = 'role';
      `);
      expect(roleType.rows[0].udt_name).toBe("participation_role");
    });

    it("publishes a complete upcoming event only through the fixed RPC branch", async () => {
      const inserted = await db.query<{ id: string }>(`
        INSERT INTO upcoming_event (
          slug, title_ar, title_fr, event_date, venue_ar, venue_fr,
          institution_ar, institution_fr, role, author_editor_id
        )
        VALUES (
          'future-forum', 'title ar', 'title fr', '2030-05-01', 'venue ar', 'venue fr',
          'institution ar', 'institution fr', 'Speaker', $1
        )
        RETURNING id;
      `, [editorId]);

      await asAuthenticated(db, authUserId);
      await db.query(`SELECT publish_content_item('upcoming_event', $1);`, [inserted.rows[0].id]);

      const published = await db.query<{ status: string; published_at: string | null }>(`
        SELECT status, published_at FROM upcoming_event WHERE id = $1;
      `, [inserted.rows[0].id]);
      expect(published.rows[0]).toMatchObject({ status: "published" });
      expect(published.rows[0].published_at).not.toBeNull();
    });

    it("rejects a one-sided optional body at publication", async () => {
      const inserted = await db.query<{ id: string }>(`
        INSERT INTO upcoming_event (
          slug, title_ar, title_fr, body_ar, event_date, venue_ar, venue_fr,
          institution_ar, institution_fr, role, author_editor_id
        )
        VALUES (
          'unpaired-event-body', 'title ar', 'title fr', 'body ar', '2030-05-01',
          'venue ar', 'venue fr', 'institution ar', 'institution fr', 'Speaker', $1
        )
        RETURNING id;
      `, [editorId]);

      await asAuthenticated(db, authUserId);
      await expect(
        db.query(`SELECT publish_content_item('upcoming_event', $1);`, [inserted.rows[0].id]),
      ).rejects.toThrow(/french.*body/i);
    });

    it("does not permit a published event to return to draft", async () => {
      const inserted = await db.query<{ id: string }>(`
        INSERT INTO upcoming_event (
          slug, title_ar, title_fr, event_date, venue_ar, venue_fr,
          institution_ar, institution_fr, role, author_editor_id
        )
        VALUES (
          'public-event', 'title ar', 'title fr', '2030-05-01', 'venue ar', 'venue fr',
          'institution ar', 'institution fr', 'Speaker', $1
        )
        RETURNING id;
      `, [editorId]);

      await asAuthenticated(db, authUserId);
      await db.query(`SELECT publish_content_item('upcoming_event', $1);`, [inserted.rows[0].id]);
      await expect(
        db.query(`UPDATE upcoming_event SET status = 'draft', published_at = null WHERE id = $1;`, [inserted.rows[0].id]),
      ).rejects.toThrow(/cannot return to draft/i);
    });

    it("atomically archives expired public and draft events", async () => {
      const expired = await db.query<{ id: string }>(`
        INSERT INTO upcoming_event (
          slug, title_ar, title_fr, body_ar, body_fr, event_date,
          venue_ar, venue_fr, institution_ar, institution_fr,
          role, role_other_ar, role_other_fr, registration_url, author_editor_id
        )
        VALUES (
          'expired-forum', 'title ar', 'title fr', 'body ar', 'body fr', '2020-01-05',
          'venue ar', 'venue fr', 'institution ar', 'institution fr',
          'Other', 'role ar', 'role fr', 'https://example.test/register', $1
        )
        RETURNING id;
      `, [editorId]);
      await db.query(`
        INSERT INTO upcoming_event (
          slug, title_ar, title_fr, event_date, venue_ar, venue_fr,
          institution_ar, institution_fr, author_editor_id
        )
        VALUES (
          'expired-draft', 'draft ar', 'draft fr', '2020-01-05', 'venue ar', 'venue fr',
          'institution ar', 'institution fr', $1
        );
      `, [editorId]);

      await asAuthenticated(db, authUserId);
      await db.query(`SELECT publish_content_item('upcoming_event', $1);`, [expired.rows[0].id]);
      await asPostgres(db);

      await db.query(`
        INSERT INTO past_participation (
          slug, title_ar, title_fr, event_date, event_date_label,
          venue_ar, venue_fr, institution_ar, institution_fr, author_editor_id
        )
        VALUES (
          'expired-forum', 'existing ar', 'existing fr', '2019-01-01', '2019-01-01',
          'venue ar', 'venue fr', 'institution ar', 'institution fr', $1
        );
      `, [editorId]);

      const archived = await db.query<{ count: number }>(`
        SELECT archive_expired_upcoming_events() AS count;
      `);
      expect(archived.rows[0].count).toBe(2);

      const source = await db.query<{ count: number }>(`
        SELECT count(*)::int AS count FROM upcoming_event WHERE id = $1;
      `, [expired.rows[0].id]);
      expect(source.rows[0].count).toBe(0);

      const past = await db.query<{
        status: string;
        slug: string;
        title_ar: string;
        title_fr: string;
        body_ar: string | null;
        body_fr: string | null;
        venue_ar: string;
        venue_fr: string;
        institution_ar: string;
        institution_fr: string;
        event_date_label: string;
        role: string;
        role_other_ar: string | null;
        role_other_fr: string | null;
        source_url: string | null;
      }>(`
        SELECT status, slug, title_ar, title_fr, body_ar, body_fr,
               venue_ar, venue_fr, institution_ar, institution_fr,
               event_date_label, role::text AS role,
               role_other_ar, role_other_fr, source_url
        FROM past_participation WHERE id = $1;
      `, [expired.rows[0].id]);
      expect(past.rows[0]).toMatchObject({
        status: "published",
        title_ar: "title ar",
        title_fr: "title fr",
        body_ar: "body ar",
        body_fr: "body fr",
        venue_ar: "venue ar",
        venue_fr: "venue fr",
        institution_ar: "institution ar",
        institution_fr: "institution fr",
        event_date_label: "2020-01-05",
        role: "Other",
        role_other_ar: "role ar",
        role_other_fr: "role fr",
        source_url: "https://example.test/register",
      });
      expect(past.rows[0].slug).toMatch(/^expired-forum-archived-/);

      const archivedDraft = await db.query<{ status: string }>(`
        SELECT status FROM past_participation WHERE slug = 'expired-draft';
      `);
      expect(archivedDraft.rows).toEqual([{ status: "draft" }]);
    });

    it("allows anon to read only published upcoming events", async () => {
      await db.query(`
        INSERT INTO upcoming_event (
          slug, title_ar, title_fr, event_date, venue_ar, venue_fr,
          institution_ar, institution_fr, author_editor_id
        )
        VALUES
          ('event-draft', 'title ar', 'title fr', '2030-05-01', 'venue ar', 'venue fr', 'institution ar', 'institution fr', $1),
          ('event-public', 'title ar', 'title fr', '2030-05-02', 'venue ar', 'venue fr', 'institution ar', 'institution fr', $1);
      `, [editorId]);
      const publicEvent = await db.query<{ id: string }>(`
        SELECT id FROM upcoming_event WHERE slug = 'event-public';
      `);

      await asAuthenticated(db, authUserId);
      await db.query(`SELECT publish_content_item('upcoming_event', $1);`, [publicEvent.rows[0].id]);
      await asAnon(db);

      const visible = await db.query<{ slug: string }>(`
        SELECT slug FROM upcoming_event ORDER BY slug;
      `);
      expect(visible.rows.map((row) => row.slug)).toEqual(["event-public"]);
    });

    it("installs build triggers for published updates and deletion", async () => {
      const triggers = await db.query<{ tgname: string; definition: string }>(`
        SELECT tgname, pg_get_triggerdef(oid) AS definition
        FROM pg_trigger
        WHERE tgname IN (
          'upcoming_event_publish_netlify_rebuild',
          'upcoming_event_archive_netlify_rebuild'
        )
        ORDER BY tgname;
      `);

      expect(triggers.rows).toHaveLength(2);
      expect(triggers.rows[0]).toMatchObject({ tgname: "upcoming_event_archive_netlify_rebuild" });
      expect(triggers.rows[0].definition).toMatch(/AFTER DELETE/i);
      expect(triggers.rows[1]).toMatchObject({ tgname: "upcoming_event_publish_netlify_rebuild" });
      expect(triggers.rows[1].definition).toMatch(/AFTER UPDATE ON/i);
      expect(triggers.rows[1].definition).toMatch(/NEW\.status = 'published'/i);
    });
  });

  describe("Article schema", () => {
    let editorId: string;
    let authUserId: string;

    beforeEach(async () => {
      await asPostgres(db);
      await db.exec("DELETE FROM article;");
      await db.exec("DELETE FROM upcoming_event;");
      await db.exec("DELETE FROM past_participation;");
      await db.exec("DELETE FROM education_entry;");
      await db.exec("DELETE FROM position_held;");
      await db.exec("DELETE FROM editors;");
      ({ editorId, authUserId } = await createEditor(db));
    });

    it("has bilingual rich-body and original-publication fields", async () => {
      const columns = await db.query<{ column_name: string }>(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'article';
      `);
      const names = new Set(columns.rows.map((row) => row.column_name));
      for (const required of [
        "title_ar",
        "title_fr",
        "body_ar",
        "body_fr",
        "published_in_url",
        "published_in_name_ar",
        "published_in_name_fr",
        "published_date",
        "author_editor_id",
      ]) {
        expect(names.has(required), `missing ${required}`).toBe(true);
      }

      const selectPrivilege = await db.query<{ allowed: boolean }>(
        `SELECT has_table_privilege('authenticated', 'article', 'SELECT') AS allowed;`,
      );
      expect(selectPrivilege.rows[0].allowed).toBe(true);
      for (const operation of ["INSERT", "UPDATE", "DELETE"]) {
        const privilege = await db.query<{ allowed: boolean }>(
          `SELECT has_table_privilege('authenticated', 'article', '${operation}') AS allowed;`,
        );
        expect(privilege.rows[0].allowed).toBe(false);
      }
    });

    it("publishes a complete Article through the fixed RPC branch", async () => {
      const inserted = await db.query<{ id: string }>(`
        INSERT INTO article (
          slug, title_ar, title_fr, body_ar, body_fr, published_date,
          published_in_url, published_in_name_ar, published_in_name_fr,
          author_editor_id
        )
        VALUES (
          'policy-brief', 'title ar', 'title fr', '<p>body ar</p>', '<p>body fr</p>', '2025-05-01',
          'https://example.test/article', 'source ar', 'source fr', $1
        )
        RETURNING id;
      `, [editorId]);

      await asAuthenticated(db, authUserId);
      await db.query(`SELECT publish_content_item('article', $1);`, [inserted.rows[0].id]);

      const published = await db.query<{ status: string; published_at: string | null }>(`
        SELECT status, published_at FROM article WHERE id = $1;
      `, [inserted.rows[0].id]);
      expect(published.rows[0]).toMatchObject({ status: "published" });
      expect(published.rows[0].published_at).not.toBeNull();
    });

    it("rejects incomplete body and one-sided publication names at publication", async () => {
      const missingBody = await db.query<{ id: string }>(`
        INSERT INTO article (
          slug, title_ar, title_fr, body_ar, published_date, author_editor_id
        ) VALUES (
          'missing-body', 'title ar', 'title fr', '<p>body ar</p>', '2025-05-01', $1
        ) RETURNING id;
      `, [editorId]);
      const missingFrenchName = await db.query<{ id: string }>(`
        INSERT INTO article (
          slug, title_ar, title_fr, body_ar, body_fr, published_date,
          published_in_name_ar, author_editor_id
        ) VALUES (
          'missing-source-fr', 'title ar', 'title fr', '<p>body ar</p>', '<p>body fr</p>', '2025-05-01',
          'source ar', $1
        ) RETURNING id;
      `, [editorId]);

      await asAuthenticated(db, authUserId);
      await expect(
        db.query(`SELECT publish_content_item('article', $1);`, [missingBody.rows[0].id]),
      ).rejects.toThrow(/body/i);
      await expect(
        db.query(`SELECT publish_content_item('article', $1);`, [missingFrenchName.rows[0].id]),
      ).rejects.toThrow(/French.*publication name/i);
    });

    it("accepts only HTTP(S) published-in URLs", async () => {
      await expect(
        db.query(`
          INSERT INTO article (
            slug, title_ar, title_fr, body_ar, body_fr, published_date,
            published_in_url, author_editor_id
          ) VALUES (
            'unsafe-source-url', 'title ar', 'title fr', '<p>body ar</p>', '<p>body fr</p>', '2025-05-01',
            'javascript:alert(1)', $1
          );
        `, [editorId]),
      ).rejects.toThrow(/article_published_in_url_check/i);
    });

    it("allows anon to read only published Articles", async () => {
      await db.query(`
        INSERT INTO article (
          slug, title_ar, title_fr, body_ar, body_fr, published_date, author_editor_id
        ) VALUES
          ('article-draft', 'title ar', 'title fr', '<p>body ar</p>', '<p>body fr</p>', '2025-01-01', $1),
          ('article-public', 'title ar', 'title fr', '<p>body ar</p>', '<p>body fr</p>', '2025-02-01', $1);
      `, [editorId]);
      const publicArticle = await db.query<{ id: string }>(`
        SELECT id FROM article WHERE slug = 'article-public';
      `);

      await asAuthenticated(db, authUserId);
      await db.query(`SELECT publish_content_item('article', $1);`, [publicArticle.rows[0].id]);
      await asAnon(db);

      const visible = await db.query<{ slug: string }>(`
        SELECT slug FROM article ORDER BY slug;
      `);
      expect(visible.rows.map((row) => row.slug)).toEqual(["article-public"]);
    });

    it("installs rebuild triggers for published updates and deletion", async () => {
      const triggers = await db.query<{ tgname: string; definition: string }>(`
        SELECT tgname, pg_get_triggerdef(oid) AS definition
        FROM pg_trigger
        WHERE tgname IN (
          'article_publish_netlify_rebuild',
          'article_delete_netlify_rebuild'
        )
        ORDER BY tgname;
      `);

      expect(triggers.rows).toHaveLength(2);
      expect(triggers.rows[0]).toMatchObject({ tgname: "article_delete_netlify_rebuild" });
      expect(triggers.rows[0].definition).toMatch(/AFTER DELETE/i);
      expect(triggers.rows[1]).toMatchObject({ tgname: "article_publish_netlify_rebuild" });
      expect(triggers.rows[1].definition).toMatch(/AFTER UPDATE ON/i);
      expect(triggers.rows[1].definition).toMatch(/NEW\.status = 'published'/i);
    });
  });

  describe("Gallery Photo schema and Storage contract", () => {
    let editorId: string;
    let authUserId: string;

    beforeEach(async () => {
      await asPostgres(db);
      await db.exec("DELETE FROM gallery_photo;");
      await db.exec("DELETE FROM article;");
      await db.exec("DELETE FROM upcoming_event;");
      await db.exec("DELETE FROM past_participation;");
      await db.exec("DELETE FROM education_entry;");
      await db.exec("DELETE FROM position_held;");
      await db.exec("DELETE FROM editors;");
      ({ editorId, authUserId } = await createEditor(db));
    });

    it("has a storage key and paired Gallery metadata without image bytes", async () => {
      const columns = await db.query<{ column_name: string }>(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'gallery_photo';
      `);
      const names = new Set(columns.rows.map((row) => row.column_name));
      for (const required of [
        "storage_path",
        "caption_ar",
        "caption_fr",
        "taken_date",
        "photographer_credit_ar",
        "photographer_credit_fr",
        "category_ar",
        "category_fr",
        "author_editor_id",
      ]) {
        expect(names.has(required), `missing ${required}`).toBe(true);
      }
      expect(names.has("image_bytes")).toBe(false);

      const selectPrivilege = await db.query<{ allowed: boolean }>(
        `SELECT has_table_privilege('authenticated', 'gallery_photo', 'SELECT') AS allowed;`,
      );
      expect(selectPrivilege.rows[0].allowed).toBe(true);
      for (const operation of ["INSERT", "UPDATE", "DELETE"]) {
        const privilege = await db.query<{ allowed: boolean }>(
          `SELECT has_table_privilege('authenticated', 'gallery_photo', '${operation}') AS allowed;`,
        );
        expect(privilege.rows[0].allowed).toBe(false);
      }
    });

    it("publishes a complete Gallery Photo only through the fixed RPC branch", async () => {
      const inserted = await db.query<{ id: string }>(`
        INSERT INTO gallery_photo (
          slug, storage_path, caption_ar, caption_fr, taken_date,
          photographer_credit_ar, photographer_credit_fr,
          category_ar, category_fr, author_editor_id
        ) VALUES (
          'national-forum', $2, 'caption ar', 'caption fr', '2025-05-01',
          'credit ar', 'credit fr', 'category ar', 'category fr', $1
        ) RETURNING id;
      `, [editorId, `${editorId}/national-forum.webp`]);

      await asAuthenticated(db, authUserId);
      await db.query(`SELECT publish_content_item('gallery_photo', $1);`, [inserted.rows[0].id]);

      const published = await db.query<{ status: string; published_at: string | null }>(`
        SELECT status, published_at FROM gallery_photo WHERE id = $1;
      `, [inserted.rows[0].id]);
      expect(published.rows[0]).toMatchObject({ status: "published" });
      expect(published.rows[0].published_at).not.toBeNull();
    });

    it("rejects a missing image, taken date, or one-sided optional metadata at publication", async () => {
      const missingImage = await db.query<{ id: string }>(`
        INSERT INTO gallery_photo (
          slug, caption_ar, caption_fr, taken_date, author_editor_id
        ) VALUES ('missing-image', 'caption ar', 'caption fr', '2025-05-01', $1)
        RETURNING id;
      `, [editorId]);
      const missingDate = await db.query<{ id: string }>(`
        INSERT INTO gallery_photo (
          slug, storage_path, caption_ar, caption_fr, author_editor_id
        ) VALUES ('missing-date', $2, 'caption ar', 'caption fr', $1)
        RETURNING id;
      `, [editorId, `${editorId}/missing-date.png`]);
      const oneSidedCredit = await db.query<{ id: string }>(`
        INSERT INTO gallery_photo (
          slug, storage_path, caption_ar, caption_fr, taken_date,
          photographer_credit_ar, author_editor_id
        ) VALUES ('one-sided-credit', $2, 'caption ar', 'caption fr', '2025-05-01', 'credit ar', $1)
        RETURNING id;
      `, [editorId, `${editorId}/one-sided-credit.jpg`]);

      await asAuthenticated(db, authUserId);
      await expect(
        db.query(`SELECT publish_content_item('gallery_photo', $1);`, [missingImage.rows[0].id]),
      ).rejects.toThrow(/gallery image/i);
      await expect(
        db.query(`SELECT publish_content_item('gallery_photo', $1);`, [missingDate.rows[0].id]),
      ).rejects.toThrow(/taken date/i);
      await expect(
        db.query(`SELECT publish_content_item('gallery_photo', $1);`, [oneSidedCredit.rows[0].id]),
      ).rejects.toThrow(/French photographer credit/i);
    });

    it("allows an editor to return a published Gallery Photo to draft after its image is moved privately", async () => {
      const inserted = await db.query<{ id: string }>(`
        INSERT INTO gallery_photo (
          slug, storage_path, caption_ar, caption_fr, taken_date, author_editor_id
        ) VALUES ('unpublishable-photo', $2, 'caption ar', 'caption fr', '2025-05-01', $1)
        RETURNING id;
      `, [editorId, `${editorId}/unpublishable-photo.webp`]);

      await asAuthenticated(db, authUserId);
      await db.query(`SELECT publish_content_item('gallery_photo', $1);`, [inserted.rows[0].id]);
      await asPostgres(db);
      await db.query(`
        UPDATE gallery_photo
        SET status = 'draft', published_at = null
        WHERE id = $1;
      `, [inserted.rows[0].id]);

      const row = await db.query<{ status: string; published_at: string | null }>(`
        SELECT status, published_at FROM gallery_photo WHERE id = $1;
      `, [inserted.rows[0].id]);
      expect(row.rows[0]).toEqual({ status: "draft", published_at: null });
    });

    it("allows anon to read only published Gallery Photos", async () => {
      await db.query(`
        INSERT INTO gallery_photo (
          slug, storage_path, caption_ar, caption_fr, taken_date, author_editor_id
        ) VALUES
          ('photo-draft', $2, 'caption ar', 'caption fr', '2025-05-01', $1),
          ('photo-public', $3, 'caption ar', 'caption fr', '2025-05-02', $1);
      `, [editorId, `${editorId}/photo-draft.jpg`, `${editorId}/photo-public.jpg`]);
      const publicPhoto = await db.query<{ id: string }>(`
        SELECT id FROM gallery_photo WHERE slug = 'photo-public';
      `);

      await asAuthenticated(db, authUserId);
      await db.query(`SELECT publish_content_item('gallery_photo', $1);`, [publicPhoto.rows[0].id]);
      await asAnon(db);

      const visible = await db.query<{ slug: string }>(`
        SELECT slug FROM gallery_photo ORDER BY slug;
      `);
      expect(visible.rows.map((row) => row.slug)).toEqual(["photo-public"]);
    });

    it("declares private staging and public gallery buckets with editor-only writes", () => {
      const migration = readFileSync(
        join(MIGRATIONS_DIR, "00000000000011_gallery_photo.sql"),
        "utf8",
      );

      expect(migration).toMatch(/'gallery-staging'[\s\S]*false[\s\S]*8388608/);
      expect(migration).toMatch(/'gallery-public'[\s\S]*true[\s\S]*8388608/);
      expect(migration).toMatch(/image\/jpeg[\s\S]*image\/png[\s\S]*image\/webp/);
      expect(migration).toMatch(/gallery_public_read[\s\S]*bucket_id = 'gallery-public'/);
      expect(migration).toMatch(/gallery_staging_editor_read[\s\S]*bucket_id = 'gallery-staging'/);
      expect(migration).toMatch(/gallery_editor_write[\s\S]*public\.current_editor_id\(\)::text/);
    });

    it("installs rebuild triggers for published changes, unpublishing, and deletion", async () => {
      const triggers = await db.query<{ tgname: string; definition: string }>(`
        SELECT tgname, pg_get_triggerdef(oid) AS definition
        FROM pg_trigger
        WHERE tgname IN (
          'gallery_photo_publish_netlify_rebuild',
          'gallery_photo_delete_netlify_rebuild'
        )
        ORDER BY tgname;
      `);

      expect(triggers.rows).toHaveLength(2);
      expect(triggers.rows[0]).toMatchObject({ tgname: "gallery_photo_delete_netlify_rebuild" });
      expect(triggers.rows[0].definition).toMatch(/AFTER DELETE/i);
      expect(triggers.rows[1]).toMatchObject({ tgname: "gallery_photo_publish_netlify_rebuild" });
      expect(triggers.rows[1].definition).toMatch(/AFTER UPDATE ON/i);
      expect(triggers.rows[1].definition).toMatch(/NEW\.status = 'published'.*OLD\.status = 'published'/i);
    });
  });

  describe("singleton Tagline schema", () => {
    async function claimAndResetTagline() {
      await asPostgres(db);
      const existingOwner = await db.query<{ editor_id: string; auth_user_id: string }>(`
        SELECT e.id AS editor_id, e.auth_user_id
        FROM tagline t
        JOIN editors e ON e.id = t.author_editor_id
        WHERE t.singleton_key = true;
      `);
      let owner = existingOwner.rows[0];

      if (!owner) {
        const created = await createEditor(db);
        await db.query(`
          UPDATE tagline
          SET author_editor_id = $1
          WHERE singleton_key = true;
        `, [created.editorId]);
        owner = { editor_id: created.editorId, auth_user_id: created.authUserId };
      }

      await db.query(`
        UPDATE tagline
        SET status = 'draft', published_at = null, tagline_ar = '', tagline_fr = ''
        WHERE singleton_key = true;
      `);
      return owner;
    }

    it("seeds exactly one safe, ownerless Draft before an Editor claims it", async () => {
      await asPostgres(db);
      const seeded = await db.query<{
        singleton_key: boolean;
        status: string;
        tagline_ar: string;
        tagline_fr: string;
        author_editor_id: string | null;
      }>(`
        SELECT singleton_key, status, tagline_ar, tagline_fr, author_editor_id
        FROM tagline;
      `);

      expect(seeded.rows).toEqual([{
        singleton_key: true,
        status: "draft",
        tagline_ar: "",
        tagline_fr: "",
        author_editor_id: null,
      }]);
    });

    it("has exactly paired Locale fields and server-owned mutations", async () => {
      const columns = await db.query<{ column_name: string }>(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'tagline';
      `);
      const names = new Set(columns.rows.map((row) => row.column_name));
      expect(names.has("tagline_ar")).toBe(true);
      expect(names.has("tagline_fr")).toBe(true);
      expect(names.has("singleton_key")).toBe(true);
      expect(names.has("author_editor_id")).toBe(true);

      const selectPrivilege = await db.query<{ allowed: boolean }>(
        `SELECT has_table_privilege('authenticated', 'tagline', 'SELECT') AS allowed;`,
      );
      expect(selectPrivilege.rows[0].allowed).toBe(true);
      for (const operation of ["INSERT", "UPDATE", "DELETE"]) {
        const privilege = await db.query<{ allowed: boolean }>(
          `SELECT has_table_privilege('authenticated', 'tagline', '${operation}') AS allowed;`,
        );
        expect(privilege.rows[0].allowed).toBe(false);
      }
    });

    it("publishes both Locales only through the fixed RPC branch after the Editor claims it", async () => {
      const owner = await claimAndResetTagline();
      await db.query(`
        UPDATE tagline
        SET tagline_ar = 'tagline ar', tagline_fr = 'tagline fr'
        WHERE singleton_key = true;
      `);

      await asAuthenticated(db, owner.auth_user_id);
      await db.query(`SELECT publish_content_item('tagline', id) FROM tagline WHERE singleton_key = true;`);

      const published = await db.query<{ status: string; published_at: string | null }>(`
        SELECT status, published_at FROM tagline WHERE singleton_key = true;
      `);
      expect(published.rows[0]).toMatchObject({ status: "published" });
      expect(published.rows[0].published_at).not.toBeNull();
    });

    it("blocks publication when either Locale is empty, while retaining a private Draft", async () => {
      const owner = await claimAndResetTagline();
      await db.query(`
        UPDATE tagline SET tagline_ar = 'tagline ar' WHERE singleton_key = true;
      `);

      await asAuthenticated(db, owner.auth_user_id);
      await expect(
        db.query(`SELECT publish_content_item('tagline', id) FROM tagline WHERE singleton_key = true;`),
      ).rejects.toThrow(/French title is empty/i);

      await asPostgres(db);
      const draft = await db.query<{ status: string }>(`
        SELECT status FROM tagline WHERE singleton_key = true;
      `);
      expect(draft.rows).toEqual([{ status: "draft" }]);
    });

    it("allows anon to read the published singleton but never its Draft", async () => {
      const owner = await claimAndResetTagline();
      await db.query(`
        UPDATE tagline
        SET tagline_ar = 'tagline ar', tagline_fr = 'tagline fr'
        WHERE singleton_key = true;
      `);
      await asAuthenticated(db, owner.auth_user_id);
      await db.query(`SELECT publish_content_item('tagline', id) FROM tagline WHERE singleton_key = true;`);
      await asAnon(db);

      const visible = await db.query<{ status: string }>(`
        SELECT status FROM tagline;
      `);
      expect(visible.rows).toEqual([{ status: "published" }]);

      await asPostgres(db);
      await db.query(`
        UPDATE tagline SET status = 'draft', published_at = null WHERE singleton_key = true;
      `);
      await asAnon(db);
      const hidden = await db.query(`SELECT id FROM tagline;`);
      expect(hidden.rows).toHaveLength(0);
    });

    it("cannot transfer ownership, duplicate, or delete the singleton", async () => {
      const owner = await claimAndResetTagline();
      await asPostgres(db);
      const second = await createEditor(db);

      await expect(
        db.query(`UPDATE tagline SET author_editor_id = $1 WHERE singleton_key = true;`, [second.editorId]),
      ).rejects.toThrow(/ownership cannot be transferred/i);
      await expect(
        db.query(`INSERT INTO tagline (singleton_key) VALUES (true);`),
      ).rejects.toThrow(/tagline_singleton_key_unique/i);
      await expect(
        db.query(`DELETE FROM tagline WHERE singleton_key = true;`),
      ).rejects.toThrow(/cannot be deleted/i);

      const currentOwner = await db.query<{ author_editor_id: string }>(`
        SELECT author_editor_id FROM tagline WHERE singleton_key = true;
      `);
      expect(currentOwner.rows).toEqual([{ author_editor_id: owner.editor_id }]);
    });

    it("rebuilds when the published singleton changes or returns to Draft", async () => {
      const trigger = await db.query<{ definition: string }>(`
        SELECT pg_get_triggerdef(oid) AS definition
        FROM pg_trigger
        WHERE tgname = 'tagline_publish_netlify_rebuild';
      `);

      expect(trigger.rows).toHaveLength(1);
      expect(trigger.rows[0].definition).toMatch(/AFTER UPDATE ON/i);
      expect(trigger.rows[0].definition).toMatch(/NEW\.status = 'published'.*OLD\.status = 'published'/i);
    });
  });
});
