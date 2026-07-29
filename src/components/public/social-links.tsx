import { textFor, type LocaleCode } from "@/lib/i18n/locales";

export const SOCIAL_LINKS = {
  linkedin: "https://td.linkedin.com/in/hamid-mahamat-azaz-a9642517a",
  facebook: "https://www.facebook.com/hamid.azaz/",
  instagram: "https://www.instagram.com/hamid_azaz_officiel?utm_source=qr&igsh=ZGExNmxtYnN2Zm1l",
  x: "https://x.com/HamidAzaz1",
  email: "mailto:hamidazaz785@gmail.com",
} as const;

type SocialLinksProps = {
  locale: LocaleCode;
  variant: "hero" | "nav" | "footer";
};

const VARIANTS: Record<SocialLinksProps["variant"], {
  className: string;
  itemClassName: string;
  iconClassName: string;
}> = {
  hero: {
    className: "flex items-center gap-3",
    itemClassName:
      "inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/40 text-white transition-[transform,background-color,border-color] duration-200 ease-[var(--ease-soft)] hover:border-white hover:bg-white/10 active:scale-[0.95] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
    iconClassName: "h-5 w-5",
  },
  nav: {
    className: "flex items-center gap-3",
    itemClassName:
      "inline-flex h-10 w-10 items-center justify-center rounded-full border border-gold text-gold transition-[transform,background-color] duration-200 ease-[var(--ease-soft)] hover:bg-gold-200/20 active:scale-[0.95] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
    iconClassName: "h-5 w-5",
  },
  footer: {
    className: "flex items-center gap-3",
    itemClassName:
      "inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-600 transition-[transform,background-color,color] duration-200 ease-[var(--ease-soft)] hover:text-gold hover:border-gold active:scale-[0.95] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
    iconClassName: "h-4 w-4",
  },
};

const SOCIAL_ARIA: Record<keyof typeof SOCIAL_LINKS, Record<LocaleCode, string>> = {
  linkedin: {
    ar: "حامد محمد عزاز على لينكدإن",
    fr: "Hamid Mahamat Azaz sur LinkedIn",
    en: "Hamid Mahamat Azaz on LinkedIn",
  },
  facebook: {
    ar: "حامد محمد عزاز على فيسبوك",
    fr: "Hamid Mahamat Azaz sur Facebook",
    en: "Hamid Mahamat Azaz on Facebook",
  },
  instagram: {
    ar: "حامد محمد عزاز على إنستجرام",
    fr: "Hamid Mahamat Azaz sur Instagram",
    en: "Hamid Mahamat Azaz on Instagram",
  },
  x: {
    ar: "حامد محمد عزاز على إكس",
    fr: "Hamid Mahamat Azaz sur X",
    en: "Hamid Mahamat Azaz on X",
  },
  email: {
    ar: "\u0645\u0631\u0627\u0633\u0644\u0629 \u062d\u0645\u064a\u062f \u0645\u062d\u0645\u062f \u0639\u0632\u0627\u0632 \u0639\u0628\u0631 \u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a",
    fr: "Envoyer un e-mail à Hamid Mahamat Azaz",
    en: "Email Hamid Mahamat Azaz",
  },
};

function LinkedinIcon({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.55V9h3.57zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.55C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.72C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07c0 6.02 4.39 11.01 10.13 11.93v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.52c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8v8.44C19.6 23.08 24 18.09 24 12.07" />
    </svg>
  );
}

function InstagramIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1.25" fill="currentColor" />
    </svg>
  );
}

function XIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.338-6.996-6.113 6.996H1.674l7.732-8.835L1.249 2.25H8.08l4.713 6.231 5.45-6.231zM17.002 18.807h1.83L6.075 3.957H4.146l12.856 14.85z" />
    </svg>
  );
}

function EmailIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SocialLinks({ locale, variant }: SocialLinksProps) {
  const styles = VARIANTS[variant];

  return (
    <ul className={styles.className}>
      <li>
        <a
          href={SOCIAL_LINKS.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={textFor(locale, SOCIAL_ARIA.linkedin)}
          className={styles.itemClassName}
        >
          <LinkedinIcon className={styles.iconClassName} />
        </a>
      </li>
      <li>
        <a
          href={SOCIAL_LINKS.facebook}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={textFor(locale, SOCIAL_ARIA.facebook)}
          className={styles.itemClassName}
        >
          <FacebookIcon className={styles.iconClassName} />
        </a>
      </li>
      <li>
        <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" aria-label={textFor(locale, SOCIAL_ARIA.instagram)} className={styles.itemClassName}>
          <InstagramIcon className={styles.iconClassName} />
        </a>
      </li>
      <li>
        <a href={SOCIAL_LINKS.x} target="_blank" rel="noopener noreferrer" aria-label={textFor(locale, SOCIAL_ARIA.x)} className={styles.itemClassName}>
          <XIcon className={styles.iconClassName} />
        </a>
      </li>
      <li>
        <a href={SOCIAL_LINKS.email} aria-label={textFor(locale, SOCIAL_ARIA.email)} className={styles.itemClassName}>
          <EmailIcon className={styles.iconClassName} />
        </a>
      </li>
    </ul>
  );
}
