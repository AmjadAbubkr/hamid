import { PortalLocaleProvider } from "@/components/portal/portal-locale-provider";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <PortalLocaleProvider>{children}</PortalLocaleProvider>;
}
