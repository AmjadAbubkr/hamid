import { getSupabaseAdminClient } from "../src/lib/supabase/server";

const email = process.env.SUPABASE_EDITOR_EMAIL;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

if (!email || !siteUrl) {
  throw new Error("SUPABASE_EDITOR_EMAIL and NEXT_PUBLIC_SITE_URL are required for bootstrap:editor.");
}

const admin = getSupabaseAdminClient();
const { data: existingEditors, error: existingEditorsError } = await admin
  .from("editors")
  .select("id")
  .limit(1);
if (existingEditorsError) throw existingEditorsError;
if (existingEditors?.length) {
  throw new Error("An Editor already exists. Bootstrap is allowed exactly once.");
}

const { data: created, error: createError } = await admin.auth.admin.createUser({
  email,
  email_confirm: true,
});
if (createError || !created.user) throw createError ?? new Error("Supabase did not create the Editor user.");

try {
  const { error: editorError } = await admin.from("editors").insert({
    auth_user_id: created.user.id,
    display_name: "Hamid",
  });
  if (editorError) throw editorError;

  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      redirectTo: new URL("/auth/callback?next=/portal/login", siteUrl).toString(),
    },
  });
  if (linkError) throw linkError;

  console.log("Editor created. Open this one-time bootstrap link in a browser, then choose Enroll this passkey.");
  console.log(link.properties.action_link);
} catch (error) {
  await admin.from("editors").delete().eq("auth_user_id", created.user.id);
  await admin.auth.admin.deleteUser(created.user.id);
  throw error;
}
