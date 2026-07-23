import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getPublicSupabaseClient,
  hasPublicSupabaseConfig,
} from "@/lib/supabase/public";

export type GalleryPhoto = {
  id: string;
  storagePath: string;
  captionAr: string;
  captionFr: string;
  takenDate: string | null;
  photographerCreditAr: string | null;
  photographerCreditFr: string | null;
  categoryAr: string | null;
  categoryFr: string | null;
};

const GALLERY_FIELDS = "id,storage_path,caption_ar,caption_fr,taken_date,photographer_credit_ar,photographer_credit_fr,category_ar,category_fr";

type GalleryPhotoRow = {
  id: string;
  storage_path: string;
  caption_ar: string;
  caption_fr: string;
  taken_date: string | null;
  photographer_credit_ar: string | null;
  photographer_credit_fr: string | null;
  category_ar: string | null;
  category_fr: string | null;
};

function getClient(client?: SupabaseClient) {
  if (client) return client;
  return hasPublicSupabaseConfig() ? getPublicSupabaseClient() : null;
}

function toGalleryPhoto(row: GalleryPhotoRow): GalleryPhoto {
  return {
    id: row.id,
    storagePath: row.storage_path,
    captionAr: row.caption_ar,
    captionFr: row.caption_fr,
    takenDate: row.taken_date,
    photographerCreditAr: row.photographer_credit_ar,
    photographerCreditFr: row.photographer_credit_fr,
    categoryAr: row.category_ar,
    categoryFr: row.category_fr,
  };
}

export async function getPublishedGalleryPhotos(client?: SupabaseClient): Promise<GalleryPhoto[]> {
  const supabase = getClient(client);
  if (!supabase) return getLocalGalleryPhotos();

  const { data, error } = await supabase
    .from("gallery_photo")
    .select(GALLERY_FIELDS)
    .eq("status", "published")
    .order("taken_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;

  return ((data ?? []) as GalleryPhotoRow[]).map(toGalleryPhoto);
}

const LOCAL_GALLERY_PHOTOS: ReadonlyArray<GalleryPhoto> = [
  {
    id: "local-hamid-minister",
    storagePath: "/imgs/hamid-minister.jpg",
    captionAr: "حميد مع الوزير",
    captionFr: "Hamid avec le ministre",
    takenDate: "2024-01-01",
    photographerCreditAr: null,
    photographerCreditFr: null,
    categoryAr: "مشاركة رسمية",
    categoryFr: "Participation officielle",
  },
  {
    id: "local-hamid3gal",
    storagePath: "/imgs/hamid3gal.jpg",
    captionAr: "لقطة من ومع",
    captionFr: "Moment de rencontre",
    takenDate: "2024-01-02",
    photographerCreditAr: null,
    photographerCreditFr: null,
    categoryAr: "لقاءات",
    categoryFr: "Rencontres",
  },
  {
    id: "local-hamid6gal",
    storagePath: "/imgs/hamid6gal.jpg",
    captionAr: "صورة وثائقية",
    captionFr: "Image documentaire",
    takenDate: "2024-01-03",
    photographerCreditAr: null,
    photographerCreditFr: null,
    categoryAr: "توثيق",
    categoryFr: "Documentation",
  },
  {
    id: "local-hamid7gal",
    storagePath: "/imgs/hamid7gal.jpg",
    captionAr: "لقطة من ومع",
    captionFr: "Moment de rencontre",
    takenDate: "2024-01-04",
    photographerCreditAr: null,
    photographerCreditFr: null,
    categoryAr: "لقاءات",
    categoryFr: "Rencontres",
  },
  {
    id: "local-hamid8gal",
    storagePath: "/imgs/hamid8gal.jpg",
    captionAr: "صورة وثائقية",
    captionFr: "Image documentaire",
    takenDate: "2024-01-05",
    photographerCreditAr: null,
    photographerCreditFr: null,
    categoryAr: "توثيق",
    categoryFr: "Documentation",
  },
  {
    id: "local-hamid12gal",
    storagePath: "/imgs/hamid12gal.jpg",
    captionAr: "صورة رسمية",
    captionFr: "Image officielle",
    takenDate: "2024-01-06",
    photographerCreditAr: null,
    photographerCreditFr: null,
    categoryAr: "رسمي",
    categoryFr: "Officiel",
  },
];

export function getLocalGalleryPhotos(): GalleryPhoto[] {
  return LOCAL_GALLERY_PHOTOS.map((photo) => ({ ...photo }));
}

export function galleryPublicUrl(storagePath: string): string | null {
  if (!storagePath) return null;
  if (storagePath.startsWith("/")) return storagePath;

  const origin = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!origin) return null;

  const encodedPath = storagePath.split("/").map(encodeURIComponent).join("/");
  return `${origin.replace(/\/$/, "")}/storage/v1/object/public/gallery-public/${encodedPath}`;
}
