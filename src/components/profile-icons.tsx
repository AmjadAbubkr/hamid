export type ProfileIconName = "arrow" | "article" | "briefcase" | "calendar" | "gallery" | "globe" | "profile";

const paths: Record<ProfileIconName, React.ReactNode> = {
  arrow: <path d="m5 12 5 5L20 7M4 4h16v16H4z" />,
  article: <><path d="M6 3h9l3 3v15H6z" /><path d="M15 3v4h4M9 12h6M9 16h6" /></>,
  briefcase: <><path d="M9 6V4h6v2M4 8h16v11H4z" /><path d="M4 11h16M10 14h4" /></>,
  calendar: <><rect x="4" y="5" width="16" height="15" rx="1" /><path d="M8 3v4M16 3v4M4 10h16M8 14h.01M12 14h.01M16 14h.01" /></>,
  gallery: <><rect x="3" y="4" width="18" height="16" rx="1" /><circle cx="9" cy="10" r="1" /><path d="m4 18 5-5 3 3 3-4 5 6" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9S14.5 18.5 12 21M12 3c-2.5 2.5-3.5 5.5-3.5 9S9.5 18.5 12 21" /></>,
  profile: <><circle cx="12" cy="8" r="3" /><path d="M5 21c.8-4 3.1-6 7-6s6.2 2 7 6" /></>,
};

export function ProfileIcon({ name, className = "" }: { name: ProfileIconName; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {paths[name]}
    </svg>
  );
}
