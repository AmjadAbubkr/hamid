import { LOCALE_META, type LocaleCode } from "@/lib/i18n/locales";
import { STRINGS } from "@/lib/i18n/strings";

export function DemoCard({ locale }: { locale: LocaleCode }) {
  const { dir } = LOCALE_META[locale];
  const s = STRINGS[locale];

  return (
    <article
      data-testid="demo-card"
      data-dir={dir}
      data-locale={locale}
      className="ps-4 pe-4 ms-2 me-2 text-start rounded-s-lg rounded-e-lg bg-white text-zinc-900 border border-zinc-200 p-4"
    >
      <header className="text-start text-end flex flex-col gap-1">
        <h2 className="text-start text-end text-xl font-semibold tracking-tight">
          {s.title}
        </h2>
        <p className="text-start text-end text-sm opacity-80">
          {s.localeName}
        </p>
      </header>
      <p className="ms-0 me-0 ps-0 pe-0 text-start text-end mt-3 text-base leading-relaxed">
        {s.body}
      </p>
      <p className="ps-2 pe-2 ms-1 me-1 text-start text-end rounded-s-md rounded-e-md mt-2 text-sm italic">
        {s.body2}
      </p>
    </article>
  );
}
