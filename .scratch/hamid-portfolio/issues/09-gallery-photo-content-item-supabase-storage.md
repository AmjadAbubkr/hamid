# 09 — Gallery Photo Content Item (Supabase Storage)

**What to build:** The sixth Content Item end-to-end slice — and the first one with an actual binary image file, not just text. Per ADR-0005, images live in Supabase Storage; only a storage key is persisted in the `gallery_photo` row (storing image bytes in a DB column is an anti-pattern, explicitly avoided).

The Portal form has paired ar/fr panes for `caption_ar`+`caption_fr`, plus an image upload widget (drag-and-drop, multi-byte filename support, JPEG/PNG/WebP validation, max-filesize enforced client and server), plus type-specific fields `taken_date`, `photographer_credit_ar`+`photographer_credit_fr` (optional), `category_ar`+`category_fr` (optional). On publish, the uploaded image is moved from a staging bucket to a public-readable bucket; the row stores the bucket path.

The Profile renders a `/gallery` grid (responsive 3–4 columns desktop, 2 columns tablet, 1 column mobile) with a lightbox modal showing the full image and its bilingual caption. Clicking outside the modal or pressing Escape closes it. Keyboard navigation (left/right arrows) cycles through images on the page.

**Blocked by:** 04 — Position Held: first Content Item end-to-end

**Status:** ready-for-agent

- [ ] Two Supabase Storage buckets configured: `gallery-staging` (private) and `gallery-public` (public read); RLS policies enforce private write for both, public read only for gallery-public
- [ ] `gallery_photo` table via Supabase migration following ticket 02's pattern; type-specific fields `storage_path` (TEXT), `caption_ar`+`caption_fr`, `taken_date`, `photographer_credit_ar`+`photographer_credit_fr`, `category_ar`+`category_fr`
- [ ] `/portal/gallery` Portal form supports JPEG/PNG/WebP upload with client + server validation, max size TBD by implementation but at least 8MB
- [ ] On Publish: the image moves from `gallery-staging` to `gallery-public` and the row's `storage_path` updates; on Save-as-Draft the image stays in staging
- [ ] On Unpublish (move back to Draft, if the Portal supports it): the image moves back to `gallery-staging` so the public URL no longer resolves
- [ ] `/gallery` Profile route renders a responsive grid of published Gallery Photos; clicking opens a lightbox showing the full image and bilingual caption; Escape and outside-click close it; arrow keys cycle images
- [ ] A published Gallery Photo at its image URL returns 200; a Draft Gallery Photo's image URL returns 404 because the file is in the staging bucket and the public URL is unresolvable
- [ ] The canonical-URL footer renders on the Gallery route — the page's own canonical URL, not the photo's image URL
