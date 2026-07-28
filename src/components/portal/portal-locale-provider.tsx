"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { LOCALE_META, type LocaleCode } from "@/lib/i18n/locales";

type PortalLocaleContextValue = {
  locale: LocaleCode;
  t: (english: string) => string;
};

const PORTAL_TRANSLATIONS: Record<Exclude<LocaleCode, "en">, Record<string, string>> = {
  ar: {
    "Back": "رجوع", "Go back": "العودة إلى الصفحة السابقة", "Hamid / Portal": "حميد / البوابة", "Logged in as Hamid / Editor": "تم تسجيل الدخول باسم حميد / المحرر",
    "Portal sign-in": "تسجيل الدخول إلى البوابة", "Portal recovery": "استعادة الوصول إلى البوابة", "Passkey re-enrollment": "إعادة تسجيل مفتاح المرور",
    "Positions Held": "المناصب التي شغلها", "Education Entries": "المؤهلات التعليمية", "Past Participations": "المشاركات السابقة",
    "Upcoming Events": "الفعاليات القادمة", "Articles": "المقالات", "Gallery Photos": "صور المعرض", "Profile Tagline": "العبارة التعريفية",
    "Manage the Content Items shown on the Profile. Draft changes remain private until you publish them.": "أدر المحتوى الظاهر في الملف الشخصي. تبقى المسودات خاصة حتى تنشرها.",
    "Career appointments": "المناصب والمسار المهني", "Qualifications and study": "المؤهلات والدراسة", "Historical appearances": "الظهور والمشاركات السابقة",
    "Future public engagements": "الأنشطة العامة المقبلة", "Op-eds and publications": "المقالات والمنشورات", "Images and captions": "الصور والتعليقات",
    "The short introduction shown on the homepage": "التعريف القصير الظاهر في الصفحة الرئيسية", "New": "جديد", "Edit": "تعديل", "Preview": "معاينة",
    "Save as draft": "حفظ كمسودة", "Saving…": "جارٍ الحفظ…", "Publish": "نشر", "Publishing…": "جارٍ النشر…",
    "Saving...": "جارٍ الحفظ…", "Publishing...": "جارٍ النشر…", "Save changes": "حفظ التغييرات",
    "Copy article link": "نسخ رابط المقال", "Article link copied. You can now paste it into social media.": "تم نسخ رابط المقال. يمكنك الآن لصقه في وسائل التواصل الاجتماعي.", "We could not copy the article link. Please copy it from the browser address bar.": "تعذر نسخ رابط المقال. انسخه من شريط عنوان المتصفح.",
    "Status:": "الحالة:", "draft": "مسودة", "published": "منشور", "URL slug": "رابط مختصر", "Institution": "المؤسسة",
    "Start date": "تاريخ البدء", "End date (leave empty for present)": "تاريخ الانتهاء (اتركه فارغًا إذا كان مستمرًا)", "Location": "المكان",
    "Arabic": "العربية", "French": "الفرنسية", "English": "الإنجليزية", "Arabic title": "العنوان بالعربية", "French title": "العنوان بالفرنسية", "English title": "العنوان بالإنجليزية",
    "Arabic summary": "الملخص بالعربية", "French summary": "الملخص بالفرنسية", "English summary": "الملخص بالإنجليزية",
    "title": "العنوان", "summary": "الملخص", "Position details": "تفاصيل المنصب", "Education details": "تفاصيل الدراسة", "Event details": "تفاصيل الفعالية", "Participation details": "تفاصيل المشاركة",
    "Degree": "الشهادة", "Honours": "الجوائز والتقدير", "Role": "الدور", "Select a role": "اختر دورًا", "Other role": "دور آخر",
    "Event date": "تاريخ الفعالية", "Published date label": "تسمية تاريخ النشر", "Venue": "المكان", "Category": "الفئة", "Photographer credit": "حقوق المصور",
    "Caption": "التعليق", "Body": "النص", "Original publication details": "تفاصيل النشر الأصلي", "Publication name": "اسم المنشور", "Publication URL": "رابط المنشور",
    "Arabic, French, and English": "العربية والفرنسية والإنجليزية", "Image": "الصورة", "Upload image": "رفع صورة", "Date": "التاريخ",
    "Complete these before publishing:": "أكمل هذه المتطلبات قبل النشر:", "Save this draft before publishing.": "احفظ هذه المسودة قبل نشرها.",
    "Loading Positions Held…": "جارٍ تحميل المناصب…", "Positions Held could not be loaded.": "تعذر تحميل المناصب.", "No Positions Held yet.": "لا توجد مناصب بعد.",
    "Loading Articles...": "جارٍ تحميل المقالات…", "Articles could not be loaded.": "تعذر تحميل المقالات.", "No Articles yet.": "لا توجد مقالات بعد.",
    "Save the draft before publishing it.": "احفظ المسودة قبل نشرها.", "Loading…": "جارٍ التحميل…", "Log out": "تسجيل الخروج", "Logging out…": "جارٍ تسجيل الخروج…",
    "Sign in with passkey": "تسجيل الدخول بمفتاح المرور", "Waiting for passkey…": "بانتظار مفتاح المرور…", "Enroll this passkey": "سجّل مفتاح المرور هذا",
    "Recovery code": "رمز الاستعادة", "Continue to passkey re-enrollment": "المتابعة لإعادة تسجيل مفتاح المرور", "Enroll a new passkey": "سجّل مفتاح مرور جديد",
    "Development only. Remove this method before deployment.": "للتطوير فقط. أزل هذه الطريقة قبل النشر.", "Development password": "كلمة مرور التطوير", "Sign in with development password": "تسجيل الدخول بكلمة مرور التطوير", "Signing in…": "جارٍ تسجيل الدخول…",
  },
  fr: {
    "Back": "Retour", "Go back": "Revenir à la page précédente", "Hamid / Portal": "Hamid / Portail", "Logged in as Hamid / Editor": "Connecté en tant que Hamid / Éditeur",
    "Portal sign-in": "Connexion au portail", "Portal recovery": "Récupération du portail", "Passkey re-enrollment": "Réinscription de la clé d’accès",
    "Positions Held": "Fonctions exercées", "Education Entries": "Études et diplômes", "Past Participations": "Participations passées",
    "Upcoming Events": "Événements à venir", "Articles": "Articles", "Gallery Photos": "Photos de la galerie", "Profile Tagline": "Phrase de présentation",
    "Manage the Content Items shown on the Profile. Draft changes remain private until you publish them.": "Gérez le contenu affiché sur le profil. Les brouillons restent privés jusqu’à leur publication.",
    "Career appointments": "Fonctions et nominations", "Qualifications and study": "Qualifications et études", "Historical appearances": "Apparitions passées",
    "Future public engagements": "Engagements publics à venir", "Op-eds and publications": "Tribunes et publications", "Images and captions": "Images et légendes",
    "The short introduction shown on the homepage": "La courte présentation affichée sur la page d’accueil", "New": "Nouveau", "Edit": "Modifier", "Preview": "Aperçu",
    "Save as draft": "Enregistrer le brouillon", "Saving…": "Enregistrement…", "Publish": "Publier", "Publishing…": "Publication…",
    "Saving...": "Enregistrement…", "Publishing...": "Publication…", "Save changes": "Enregistrer les modifications",
    "Copy article link": "Copier le lien de l’article", "Article link copied. You can now paste it into social media.": "Le lien de l’article a été copié. Vous pouvez maintenant le coller sur les réseaux sociaux.", "We could not copy the article link. Please copy it from the browser address bar.": "Impossible de copier le lien de l’article. Copiez-le depuis la barre d’adresse du navigateur.",
    "Status:": "Statut :", "draft": "brouillon", "published": "publié", "URL slug": "Identifiant URL", "Institution": "Institution",
    "Start date": "Date de début", "End date (leave empty for present)": "Date de fin (laisser vide si en cours)", "Location": "Lieu",
    "Arabic": "Arabe", "French": "Français", "English": "Anglais", "Arabic title": "Titre en arabe", "French title": "Titre en français", "English title": "Titre en anglais",
    "Arabic summary": "Résumé en arabe", "French summary": "Résumé en français", "English summary": "Résumé en anglais",
    "title": "titre", "summary": "résumé", "Position details": "Détails de la fonction", "Education details": "Détails des études", "Event details": "Détails de l’événement", "Participation details": "Détails de la participation",
    "Degree": "Diplôme", "Honours": "Distinctions", "Role": "Rôle", "Select a role": "Sélectionnez un rôle", "Other role": "Autre rôle",
    "Event date": "Date de l’événement", "Published date label": "Libellé de la date de publication", "Venue": "Lieu", "Category": "Catégorie", "Photographer credit": "Crédit photo",
    "Caption": "Légende", "Body": "Texte", "Original publication details": "Détails de la publication originale", "Publication name": "Nom de la publication", "Publication URL": "URL de la publication",
    "Arabic, French, and English": "arabe, français et anglais", "Image": "Image", "Upload image": "Téléverser une image", "Date": "Date",
    "Complete these before publishing:": "À compléter avant la publication :", "Save this draft before publishing.": "Enregistrez ce brouillon avant de le publier.",
    "Loading Positions Held…": "Chargement des fonctions exercées…", "Positions Held could not be loaded.": "Impossible de charger les fonctions exercées.", "No Positions Held yet.": "Aucune fonction exercée pour le moment.",
    "Loading Articles...": "Chargement des articles…", "Articles could not be loaded.": "Impossible de charger les articles.", "No Articles yet.": "Aucun article pour le moment.",
    "Save the draft before publishing it.": "Enregistrez le brouillon avant de le publier.", "Loading…": "Chargement…", "Log out": "Se déconnecter", "Logging out…": "Déconnexion…",
    "Sign in with passkey": "Se connecter avec une clé d’accès", "Waiting for passkey…": "En attente de la clé d’accès…", "Enroll this passkey": "Enregistrer cette clé d’accès",
    "Recovery code": "Code de récupération", "Continue to passkey re-enrollment": "Continuer vers la réinscription de la clé d’accès", "Enroll a new passkey": "Enregistrer une nouvelle clé d’accès",
    "Development only. Remove this method before deployment.": "Développement uniquement. Retirez cette méthode avant le déploiement.", "Development password": "Mot de passe de développement", "Sign in with development password": "Se connecter avec le mot de passe de développement", "Signing in…": "Connexion…",
  },
};

function localeFromDevice(language: string | undefined): LocaleCode {
  if (language?.toLowerCase().startsWith("ar")) return "ar";
  if (language?.toLowerCase().startsWith("fr")) return "fr";
  return "en";
}

const PortalLocaleContext = createContext<PortalLocaleContextValue>({ locale: "en", t: (english) => english });

export function PortalLocaleProvider({ children }: { children: ReactNode }) {
  const locale = typeof navigator === "undefined" ? "en" : localeFromDevice(navigator.language);
  const value = useMemo<PortalLocaleContextValue>(() => ({
    locale,
    t: (english) => PORTAL_TRANSLATIONS[locale as Exclude<LocaleCode, "en">]?.[english] ?? english,
  }), [locale]);

  useEffect(() => {
    const { dir, htmlLang } = LOCALE_META[locale];
    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute("lang", htmlLang);
  }, [locale]);

  return <PortalLocaleContext.Provider value={value}>{children}</PortalLocaleContext.Provider>;
}

export function usePortalLocale() {
  return useContext(PortalLocaleContext);
}
