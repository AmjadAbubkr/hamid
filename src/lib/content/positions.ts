import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getPublicSupabaseClient,
  hasPublicSupabaseConfig,
} from "@/lib/supabase/public";

export type PositionHeld = {
  slug: string;
  titleAr: string;
  titleFr: string;
  bodyAr: string | null;
  bodyFr: string | null;
  institution: string;
  startDate: string;
  endDate: string | null;
  location: string;
};

const POSITION_FIELDS =
  "slug,title_ar,title_fr,body_ar,body_fr,institution,start_date,end_date,location";

type PositionHeldRow = {
  slug: string;
  title_ar: string;
  title_fr: string;
  body_ar: string | null;
  body_fr: string | null;
  institution: string;
  start_date: string;
  end_date: string | null;
  location: string;
};

function toPositionHeld(row: PositionHeldRow): PositionHeld {
  return {
    slug: row.slug,
    titleAr: row.title_ar,
    titleFr: row.title_fr,
    bodyAr: row.body_ar,
    bodyFr: row.body_fr,
    institution: row.institution,
    startDate: row.start_date,
    endDate: row.end_date,
    location: row.location,
  };
}

function getClient(client?: SupabaseClient) {
  if (client) return client;

  // Local UI work should remain possible before Supabase configuration exists.
  // Configured deployments always use the anonymous client and its RLS policy.
  return hasPublicSupabaseConfig() ? getPublicSupabaseClient() : null;
}

export async function getPublishedPositions(
  client?: SupabaseClient,
): Promise<PositionHeld[]> {
  const supabase = getClient(client);
  if (!supabase) return getLocalPositions();

  const { data, error } = await supabase
    .from("position_held")
    .select(POSITION_FIELDS)
    .eq("status", "published")
    .order("start_date", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as PositionHeldRow[]).map(toPositionHeld);
}

export async function getPublishedPositionBySlug(
  slug: string,
  client?: SupabaseClient,
): Promise<PositionHeld | null> {
  const supabase = getClient(client);
  if (!supabase) return getLocalPositions().find((p) => p.slug === slug) ?? null;

  const { data, error } = await supabase
    .from("position_held")
    .select(POSITION_FIELDS)
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;

  return data ? toPositionHeld(data as PositionHeldRow) : null;
}

const LOCAL_POSITIONS: ReadonlyArray<PositionHeld> = [
  {
    slug: "inspecteur-technique-ministere-communication",
    titleAr: "مفتش تقني",
    titleFr: "Inspecteur technique",
    bodyAr: "مفتش تقني بوزارة الاتصال. يعنى بمتابعة المشاريع الرقمية والإدارية وضمان جودة المنظومات التقنية المرتبطة بالاتصال الحكومي.",
    bodyFr: "Inspecteur technique au Ministère de la Communication. Suivi des projets numériques et administratifs, garantie de la qualité des systèmes techniques liés à la communication gouvernementale.",
    institution: "وزارة الاتصال — Ministère de la Communication",
    startDate: "2026-05-22",
    endDate: null,
    location: "N'Djamena",
  },
  {
    slug: "conseiller-juridique-affaires-diplomatiques",
    titleAr: "مستشار قانوني للشؤون الدبلوماسية",
    titleFr: "Conseiller juridique, affaires diplomatiques",
    bodyAr: "مستشار قانوني مكلف بالشؤون الدبلوماسية والقنصلية. تقديم الدعم القانوني للوفود التشادية في المحادثات الثنائية والاتفاقيات الإقليمية.",
    bodyFr: "Conseiller juridique chargé des affaires diplomatiques et consulaires. Appui juridique aux délégations tchadiennes lors des négociations bilatérales et des accords régionaux.",
    institution: "وزارة الشؤون الخارجية — Ministère des Affaires étrangères",
    startDate: "2022-09-01",
    endDate: "2026-04-30",
    location: "N'Djamena",
  },
  {
    slug: "charge-de-mission-cooperation-regionale",
    titleAr: "مكلف بمهمة — التعاون الإقليمي",
    titleFr: "Chargé de mission, coopération régionale",
    bodyAr: "مكلف بمهمة في إدارة التعاون الإقليمي. متابعة ملفات التكامل الإفريقي والشراكات مع المجموعات الاقتصادية الإقليمية.",
    bodyFr: "Chargé de mission à la direction de la coopération régionale. Suivi des dossiers d'intégration africaine et des partenariats avec les communautés économiques régionales.",
    institution: "وزارة الشؤون الخارجية — Ministère des Affaires étrangères",
    startDate: "2020-01-15",
    endDate: "2022-08-31",
    location: "N'Djamena",
  },
];

export function getLocalPositions(): PositionHeld[] {
  return LOCAL_POSITIONS.map((p) => ({ ...p }));
}
