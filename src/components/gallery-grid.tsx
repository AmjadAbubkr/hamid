"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

/*
  GalleryGrid â€” editorial photography layout (DESIGN.md "Gallery").
  Uniform aspect ratios within the grid, generous sizes, smooth zoom on hover
  (long transition, no marketing bounce), and a Lightbox that fades in rather
    than snaps. Kbd navigation (←/→/Esc) and backdrop click are preserved.
*/
export type GalleryGridPhoto = {
  id: string;
  src: string;
  caption: string;
  category: string | null;
  takenDate: string | null;
  photographerCredit: string | null;
};

export function GalleryGrid({
  photos,
  emptyLabel,
  closeLabel = "Close",
  galleryAriaLabel = "Gallery",
}: {
  photos: GalleryGridPhoto[];
  emptyLabel: string;
  closeLabel?: string;
  galleryAriaLabel?: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selected = selectedIndex === null ? null : photos[selectedIndex];

  useEffect(() => {
    if (selectedIndex === null) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedIndex(null);
      if (event.key === "ArrowRight")
        setSelectedIndex((index) =>
          index === null ? null : (index + 1) % photos.length,
        );
      if (event.key === "ArrowLeft")
        setSelectedIndex((index) =>
          index === null ? null : (index - 1 + photos.length) % photos.length,
        );
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [photos.length, selectedIndex]);

  if (photos.length === 0) {
    return <p className="mt-8 text-ink-600">{emptyLabel}</p>;
  }

  return (
    <>
      <ul
        aria-label={galleryAriaLabel}
        className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {photos.map((photo, index) => {
          // The first photo gets a wider editorial slot so the gallery opens
          // with a "lead image" rather than a grid of thumbnails.
          const lead = index === 0;
          return (
            <li
              key={photo.id}
              className={lead ? "sm:col-span-2 sm:row-span-2" : ""}
            >
              <button
                type="button"
                onClick={() => setSelectedIndex(index)}
                className="group relative block h-full w-full overflow-hidden rounded border-line bg-surface text-start shadow-[var(--shadow-ambient)] transition-[transform,box-shadow] duration-300 ease-[var(--ease-soft)] hover:-translate-y-1 hover:shadow-[var(--shadow-ambient-hover)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
                aria-label={photo.caption}
              >
                {/*
                  Sizing lives on the wrapper span, not on the <Image>. With
                  next/image `fill`, the rendered <img> is absolutely
                  positioned and ignores any aspect/w-full set on the Image
                  itself — the previous code put `aspect-[4/3] w-full` on the
                  Image and gave the span no height, so the span collapsed to
                  zero and the photos rendered shrunken. The wrapper now owns
                  the aspect ratio; `fill` paints the photo across it.
                */}
                <span className="relative block aspect-[4/3] w-full overflow-hidden sm:aspect-[16/10]">
                  <Image
                    src={photo.src}
                    alt={photo.caption}
                    fill
                    sizes={
                      lead
                        ? "(min-width: 1024px) 66vw, (min-width: 640px) 100vw, 100vw"
                        : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    }
                    className="object-cover transition-transform duration-[800ms] ease-[var(--ease-soft)] group-hover:scale-[1.05]"
                  />
                </span>
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/0 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-100" />
                <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-5 text-start">
                  <span className="text-pretty text-sm font-medium text-white sm:text-base">
                    {photo.caption}
                  </span>
                  {photo.category ? (
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-200">
                      {photo.category}
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {selected ? (
        <div
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedIndex(null);
          }}
          className="lightbox-fade fixed inset-0 z-50 grid place-items-center bg-navy/85 p-4"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label={selected.caption}
            className="max-h-full w-full max-w-5xl overflow-auto rounded-lg bg-surface shadow-[var(--shadow-ambient-lg)]"
          >
            <div className="flex items-center justify-between gap-4 border-b border-line p-4">
              <p className="font-serif text-lg font-semibold text-ink">
                {selected.caption}
              </p>
              <button
                type="button"
                onClick={() => setSelectedIndex(null)}
                className="rounded border border-gold px-3 py-2 text-sm font-semibold text-ink transition-colors hover:bg-gold-200/15"
              >
                {closeLabel}
              </button>
            </div>
            <div className="bg-surface-low p-4 sm:p-6">
              <Image
                src={selected.src}
                alt={selected.caption}
                width={1600}
                height={1000}
                className="max-h-[72vh] w-full object-contain"
              />
            </div>
            <div className="flex flex-col gap-1 p-5 text-start text-ink">
              {selected.category ? (
                <p className="text-sm font-semibold text-ink">{selected.category}</p>
              ) : null}
              {selected.takenDate ? (
                <p className="text-sm text-ink-600">{selected.takenDate}</p>
              ) : null}
              {selected.photographerCredit ? (
                <p className="text-sm text-ink-600">{selected.photographerCredit}</p>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
