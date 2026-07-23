import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const dir = join(ROOT, "supabase", "migrations");

const db = new PGlite();
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
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
for (const f of files) {
  await db.exec(readFileSync(join(dir, f), "utf8"));
}

const authUser = await db.query<{ id: string }>(`INSERT INTO auth.users DEFAULT VALUES RETURNING id;`);
await db.exec(`INSERT INTO editors (display_name, auth_user_id) VALUES ('Hamid', '${authUser.rows[0].id}') RETURNING id;`);
const { rows: editors } = await db.query<{ id: string }>("SELECT id FROM editors LIMIT 1;");
const editorId = editors[0].id;
const ins = await db.query<{ id: string }>(`
  INSERT INTO position_held (slug, title_ar, title_fr, body_ar, body_fr, institution, start_date, location, author_editor_id)
  VALUES ('probe', 'ar-title', 'fr-title', 'ar-body', 'fr-body', 'M', '2026-05-22', 'N''Djamena', $1)
  RETURNING id;
`, [editorId]);
const id = ins.rows[0].id;

const fnCheck = await db.query<{ proname: string }>(`
  SELECT proname FROM pg_proc WHERE proname='validate_content_item_publish';
`);
console.log("functions named validate_content_item_publish:", JSON.stringify(fnCheck.rows));

try {
  await db.exec(`SET ROLE authenticated; SET request.jwt.claim.sub = '${authUser.rows[0].id}';`);
  await db.query(`SELECT publish_content_item('position_held', $1);`, [id]);
  console.log("publish OK");
} catch (error) {
  console.error("publish ERR:", error instanceof Error ? error.message : String(error));
}

await db.close();
