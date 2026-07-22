# Domain Strategy: .com Only

The Profile is served exclusively from a `.com` domain. We deliberately do not register the `.td` ccTLD even though Hamid is a Chadian political figure for whom the `.td` ccTLD is the perceptually-default choice.

## Considered Options

- Both `.td` and `.com`, with `.com` redirecting to canonical `.td`. Rejected: `.td` registry's historical reliability and renewal friction make it the wrong primary domain for a site whose continuous availability is reputation-critical.
- `.td` only. Rejected on the same reliability grounds.

## Consequences

- The site's URL is the chosen `.com`; canonical tags and sitemap are `.com`-rooted.
- Cybersquat risk on unregistered `.td`: a third party could acquire `hamid.td` and host a parody or impersonation site. We accept this risk; mitigations available later (trademark objection to `.td` registry, defensive registration of close typos) are out of scope today.
- DNS is managed by Netlify DNS or Cloudflare DNS (decided at build time), with the `.com` registered at any ICANN-accredited registrar with auto-renew enabled.
