import type { LocaleCode } from "./locales";

export type LocalizedStrings = {
  siteHeading: string;
  siteTagline: string;
  title: string;
  body: string;
  body2: string;
  switchPrompt: string;
  localeName: string;
};

export const STRINGS: Record<LocaleCode, LocalizedStrings> = {
  ar: {
    siteHeading: "حامد — الملف الشخصي الرسمي",
    siteTagline: "دبلوماسي وسياسي تشادي. الملف الشخصي العام الرسمي.",
    title: "البطاقة التجريبية",
    body: "هذه بطاقة تجريبية للتدليل على تبديل اتجاه الكتابة بين العربية والفرنسية.",
    body2: "يتم التعامل مع الاتجاه عبر سمة dir على عنصر html دون أي فئات شرطية.",
    switchPrompt: "التبديل إلى النسخة الفرنسية",
    localeName: "العربية",
  },
  fr: {
    siteHeading: "Hamid — Profil officiel",
    siteTagline: "Diplomate et homme politique tchadien. Le profil public officiel.",
    title: "Carte de démonstration",
    body: "Ceci est une carte de démonstration illustrant la commutation de direction entre l'arabe et le français.",
    body2: "La direction est gérée via l'attribut dir sur l'élément html, sans aucune classe conditionnelle.",
    switchPrompt: "Basculer vers la version arabe",
    localeName: "Français",
  },
  en: {
    siteHeading: "Hamid — Official profile",
    siteTagline: "Chadian diplomat and politician. The official public profile.",
    title: "Demo card",
    body: "This is a demonstration card showing the direction switching between Arabic, French, and English.",
    body2: "Direction is handled via the dir attribute on the html element, without any conditional classes.",
    switchPrompt: "Switch to the Arabic version",
    localeName: "English",
  },
};
