export function contentImagePublicUrl(storagePath: string | null | undefined) {
  const origin = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!origin || !storagePath) return null;
  return `${origin.replace(/\/$/, "")}/storage/v1/object/public/content-public/${storagePath.split("/").map(encodeURIComponent).join("/")}`;
}
