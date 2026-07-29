import { textFor, type LocaleCode } from "@/lib/i18n/locales";
import { SocialLinks } from "@/components/public/social-links";

type CanonicalFooterProps = {
  pathname: string;
  locale: LocaleCode;
};

/* CanonicalFooter — a quiet institutional footer with a small official-document line. */
export function CanonicalFooter({ pathname, locale }: CanonicalFooterProps) {
  const roleLine = textFor(locale, {
    ar: "دبلوماسي وسياسي تشادي — الملف الشخصي الرسمي",
    fr: "Diplomate et homme politique tchadien — Profil public officiel",
    en: "Chadian diplomat and politician — Official public profile",
  });
  const officialDocLine = textFor(locale, {
    ar: "وثيقة رسمية",
    fr: "Document officiel",
    en: "Official document",
  });

  return (
    <footer
      data-testid="canonical-footer"
      className="mx-auto w-full max-w-6xl px-6 sm:px-10 lg:px-16 mt-auto py-10 border-t border-line"
    >
      <div className="flex flex-col gap-3 text-start sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="flex flex-col gap-1">
          <p className="font-serif text-base font-semibold text-ink">
            {textFor(locale, {
              ar: (
                <>
                  حامد محمد <span className="uppercase text-gold">Azaz</span>
                </>
              ),
              fr: (
                <>
                  Hamid Mahamat <span className="uppercase text-gold">Azaz</span>
                </>
              ),
              en: (
                <>
                  Hamid Mahamat <span className="uppercase text-gold">Azaz</span>
                </>
              ),
            })}
          </p>
          <p className="text-sm text-ink-600">
            {roleLine}
          </p>
          <SocialLinks locale={locale} variant="footer" />
        </div>
        <div className="flex flex-col gap-1 text-start sm:text-end">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">
            {officialDocLine}
          </p>
        </div>
      </div>
    </footer>
  );
}
