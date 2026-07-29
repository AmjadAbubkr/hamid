"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { LOCALE_META, type LocaleCode } from "@/lib/i18n/locales";

type PortalLocaleContextValue = {
  locale: LocaleCode;
  t: (english: string) => string;
};

const PORTAL_TRANSLATIONS: Record<Exclude<LocaleCode, "en">, Record<string, string>> = {
  ar: {
    "This Article is public. Save changes to update the published version.": "هذا المقال منشور. احفظ التغييرات لتحديث النسخة المنشورة.", "What kind of piece is this? Op-ed, essay, policy brief, published article.": "ما نوع هذا النص؟ مقال رأي أو دراسة أو موجز سياسات أو مقال منشور.", "Original publication date": "تاريخ النشر الأصلي", "Original publication URL": "رابط النشر الأصلي", "If the piece first appeared elsewhere, provide both publication names. The URL is optional.": "إذا ظهر النص أولًا في مكان آخر، أدخل أسماء النشر باللغات. الرابط اختياري.", "Gallery image": "صورة المعرض", "JPEG, PNG, or WebP, up to 8 MB. Draft images remain private until published.": "JPEG أو PNG أو WebP حتى 8 ميغابايت. تبقى صور المسودة خاصة حتى النشر.", "Drop an image here or choose a file": "أفلت صورة هنا أو اختر ملفًا", "Current image is kept unless you choose a replacement.": "تُحفظ الصورة الحالية ما لم تختر بديلًا.", "No image selected.": "لم تُحدّد صورة.", "Gallery image upload area": "منطقة رفع صورة المعرض", "Gallery image file": "ملف صورة المعرض", "Date taken": "تاريخ الالتقاط", "Moving to draft...": "جارٍ النقل إلى المسودة...", "Move to draft": "نقل إلى المسودة",
    "Loading Upcoming Events...": "جارٍ تحميل الفعاليات القادمة...", "Upcoming Events could not be loaded.": "تعذّر تحميل الفعاليات القادمة.", "No Upcoming Events yet.": "لا توجد فعاليات قادمة بعد.", "Untitled Upcoming Event": "فعالية قادمة بلا عنوان", "Institution not set": "لم تُحدّد المؤسسة", "Event date not set": "لم يُحدّد تاريخ الفعالية", "Role not set": "لم يُحدّد الدور",
    "Loading Education Entries...": "جارٍ تحميل المؤهلات التعليمية...", "Education Entries could not be loaded.": "تعذّر تحميل المؤهلات التعليمية.", "No Education Entries yet.": "لا توجد مؤهلات تعليمية بعد.", "Untitled Education Entry": "مؤهل تعليمي بلا عنوان", "Dates not set": "لم تُحدّد التواريخ",
    "Loading Past Participations...": "جارٍ تحميل المشاركات السابقة...", "Past Participations could not be loaded.": "تعذّر تحميل المشاركات السابقة.", "No Past Participations yet.": "لا توجد مشاركات سابقة بعد.", "Untitled Past Participation": "مشاركة سابقة بلا عنوان",
    "Loading Gallery Photos...": "جارٍ تحميل صور المعرض...", "Gallery Photos could not be loaded.": "تعذّر تحميل صور المعرض.", "No Gallery Photos yet.": "لا توجد صور في المعرض بعد.", "Untitled Gallery Photo": "صورة معرض بلا عنوان", "Date not set": "لم يُحدّد التاريخ",
    "Delete": "حذف", "Deleting…": "جارٍ الحذف…", "Delete this item permanently? This cannot be undone.": "هل تريد حذف هذا العنصر نهائيًا؟ لا يمكن التراجع عن ذلك.", "The item could not be deleted.": "تعذّر حذف العنصر.", "Optional image": "صورة اختيارية", "JPEG, PNG, or WebP up to 8 MB. It uploads when you save.": "JPEG أو PNG أو WebP بحجم يصل إلى 8 ميغابايت. تُرفع الصورة عند الحفظ.", "Selected:": "المحدد:", "The image could not be uploaded.": "تعذّر رفع الصورة.",    "Loading the Tagline...": "جارٍ تحميل العبارة التعريفية...", "The Profile's one-line introduction": "التعريف المختصر للملف الشخصي", "This is the only Tagline. It is not a free-text Bio, and the About page assembles the rest from structured Content Items.": "هذه هي العبارة التعريفية الوحيدة. ليست سيرة ذاتية حرة، وتجمع صفحة نبذة بقية المعلومات من عناصر محتوى منظمة.", "There is no New, list, or delete action: the Tagline is a single protected record.": "لا يوجد إجراء إنشاء أو قائمة أو حذف: العبارة التعريفية سجل واحد محمي.", "Keep it concise: one sentence that introduces Hamid in this Locale.": "اجعلها موجزة: جملة واحدة تقدّم حميدًا بهذه اللغة.", "Wait for the Tagline to load.": "انتظر حتى يتم تحميل العبارة التعريفية.", "Arabic Tagline": "العبارة التعريفية بالعربية", "French Tagline": "العبارة التعريفية بالفرنسية", "English Tagline": "العبارة التعريفية بالإنجليزية", "The Tagline could not be loaded.": "تعذّر تحميل العبارة التعريفية.", "The Tagline could not be saved.": "تعذّر حفظ العبارة التعريفية.",    "Back to edit": "العودة إلى التعديل", "Back to Articles": "العودة إلى المقالات", "Back to Education Entries": "العودة إلى المؤهلات التعليمية", "Back to Upcoming Events": "العودة إلى الفعاليات القادمة", "Back to Past Participations": "العودة إلى المشاركات السابقة", "Draft preview - not visible on the Profile.": "معاينة المسودة — غير ظاهرة في الملف الشخصي.", "Draft preview — not visible on the Profile.": "معاينة المسودة — غير ظاهرة في الملف الشخصي.", "Public Article preview.": "معاينة المقال المنشور.", "Event date not set": "لم يُحدّد تاريخ الفعالية", "venue not set": "لم يُحدّد المكان", "body not set": "لم يُحدّد النص",    "Tagline": "الشعار التعريفي", "Create, edit, and publish career appointments.": "أنشئ وعدّل وانشر المناصب المهنية.", "New Position Held": "منصب جديد",
    "Create, edit, and publish qualifications and programmes.": "أنشئ وعدّل وانشر المؤهلات والبرامج الدراسية.", "New Education Entry": "مؤهل دراسي جديد",
    "Create, publish, and update events before they are archived.": "أنشئ وانشر وحدّث الفعاليات قبل أرشفتها.", "New Upcoming Event": "فعالية قادمة جديدة",
    "Create, edit, and publish historical appearances and events.": "أنشئ وعدّل وانشر المشاركات والفعاليات السابقة.", "New Past Participation": "مشاركة سابقة جديدة",
    "Create, publish, and update the Profile's site-original writing.": "أنشئ وانشر وحدّث المقالات الأصلية للملف الشخصي.", "New Article": "مقال جديد",
    "Create, publish, replace, or return Gallery Photos to draft.": "أنشئ وانشر واستبدل صور المعرض أو أعدها إلى مسودة.", "New Gallery Photo": "صورة معرض جديدة",
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
    "This Article is public. Save changes to update the published version.": "Cet article est publié. Enregistrez les modifications pour mettre à jour la version publique.", "What kind of piece is this? Op-ed, essay, policy brief, published article.": "De quel type de texte s’agit-il ? Tribune, essai, note de politique publique ou article publié.", "Original publication date": "Date de publication originale", "Original publication URL": "URL de publication originale", "If the piece first appeared elsewhere, provide both publication names. The URL is optional.": "Si le texte est d’abord paru ailleurs, indiquez les noms de publication dans les langues concernées. L’URL est facultative.", "Gallery image": "Image de la galerie", "JPEG, PNG, or WebP, up to 8 MB. Draft images remain private until published.": "JPEG, PNG ou WebP, jusqu’à 8 Mo. Les images en brouillon restent privées jusqu’à leur publication.", "Drop an image here or choose a file": "Déposez une image ici ou choisissez un fichier", "Current image is kept unless you choose a replacement.": "L’image actuelle est conservée sauf si vous choisissez un remplacement.", "No image selected.": "Aucune image sélectionnée.", "Gallery image upload area": "Zone d’envoi d’image de galerie", "Gallery image file": "Fichier image de galerie", "Date taken": "Date de prise de vue", "Moving to draft...": "Retour au brouillon…", "Move to draft": "Repasser en brouillon",
    "Loading Upcoming Events...": "Chargement des événements à venir...", "Upcoming Events could not be loaded.": "Impossible de charger les événements à venir.", "No Upcoming Events yet.": "Aucun événement à venir pour le moment.", "Untitled Upcoming Event": "Événement à venir sans titre", "Institution not set": "Institution non renseignée", "Event date not set": "Date de l’événement non renseignée", "Role not set": "Rôle non renseigné",
    "Loading Education Entries...": "Chargement des formations...", "Education Entries could not be loaded.": "Impossible de charger les formations.", "No Education Entries yet.": "Aucune formation pour le moment.", "Untitled Education Entry": "Formation sans titre", "Dates not set": "Dates non renseignées",
    "Loading Past Participations...": "Chargement des participations passées...", "Past Participations could not be loaded.": "Impossible de charger les participations passées.", "No Past Participations yet.": "Aucune participation passée pour le moment.", "Untitled Past Participation": "Participation passée sans titre",
    "Loading Gallery Photos...": "Chargement des photos de la galerie...", "Gallery Photos could not be loaded.": "Impossible de charger les photos de la galerie.", "No Gallery Photos yet.": "Aucune photo de galerie pour le moment.", "Untitled Gallery Photo": "Photo de galerie sans titre", "Date not set": "Date non renseignée",
    "Delete": "Supprimer", "Deleting…": "Suppression…", "Delete this item permanently? This cannot be undone.": "Supprimer définitivement cet élément ? Cette action est irréversible.", "The item could not be deleted.": "Impossible de supprimer cet élément.", "Optional image": "Image facultative", "JPEG, PNG, or WebP up to 8 MB. It uploads when you save.": "JPEG, PNG ou WebP jusqu’à 8 Mo. L’image est envoyée lors de l’enregistrement.", "Selected:": "Sélectionné :", "The image could not be uploaded.": "Impossible d’envoyer l’image.",    "Loading the Tagline...": "Chargement de la phrase de présentation...", "The Profile's one-line introduction": "La présentation du profil en une phrase", "This is the only Tagline. It is not a free-text Bio, and the About page assembles the rest from structured Content Items.": "C’est l’unique phrase de présentation. Ce n’est pas une biographie libre : la page À propos assemble le reste à partir d’éléments de contenu structurés.", "There is no New, list, or delete action: the Tagline is a single protected record.": "Il n’y a ni création, ni liste, ni suppression : la phrase de présentation est un unique enregistrement protégé.", "Keep it concise: one sentence that introduces Hamid in this Locale.": "Restez concis : une phrase qui présente Hamid dans cette langue.", "Wait for the Tagline to load.": "Attendez le chargement de la phrase de présentation.", "Arabic Tagline": "Phrase de présentation en arabe", "French Tagline": "Phrase de présentation en français", "English Tagline": "Phrase de présentation en anglais", "The Tagline could not be loaded.": "Impossible de charger la phrase de présentation.", "The Tagline could not be saved.": "Impossible d’enregistrer la phrase de présentation.",    "Back to edit": "Retour à la modification", "Back to Articles": "Retour aux articles", "Back to Education Entries": "Retour aux formations", "Back to Upcoming Events": "Retour aux événements à venir", "Back to Past Participations": "Retour aux participations passées", "Draft preview - not visible on the Profile.": "Aperçu du brouillon — non visible sur le profil.", "Draft preview — not visible on the Profile.": "Aperçu du brouillon — non visible sur le profil.", "Public Article preview.": "Aperçu de l’article publié.", "Event date not set": "Date de l’événement non renseignée", "venue not set": "Lieu non renseigné", "body not set": "Texte non renseigné",    "Tagline": "Phrase de présentation", "Create, edit, and publish career appointments.": "Créez, modifiez et publiez les fonctions exercées.", "New Position Held": "Nouvelle fonction exercée",
    "Create, edit, and publish qualifications and programmes.": "Créez, modifiez et publiez les qualifications et programmes.", "New Education Entry": "Nouvelle formation",
    "Create, publish, and update events before they are archived.": "Créez, publiez et mettez à jour les événements avant leur archivage.", "New Upcoming Event": "Nouvel événement à venir",
    "Create, edit, and publish historical appearances and events.": "Créez, modifiez et publiez les participations et événements passés.", "New Past Participation": "Nouvelle participation passée",
    "Create, publish, and update the Profile's site-original writing.": "Créez, publiez et mettez à jour les textes originaux du profil.", "New Article": "Nouvel article",
    "Create, publish, replace, or return Gallery Photos to draft.": "Créez, publiez, remplacez ou remettez les photos de la galerie en brouillon.", "New Gallery Photo": "Nouvelle photo de galerie",
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

export function PortalText({ children }: { children: string }) {
  const { t } = usePortalLocale();
  return <>{t(children)}</>;
}
