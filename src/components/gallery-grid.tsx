"use client";

import { useEffect, useState } from "react";

export type GalleryGridPhoto = {
  id: string;
  src: string;
  caption: string;
  category: string | null;
  takenDate: string | null;
  photographerCredit: string | null;
};

export function GalleryGrid({ photos, emptyLabel }: { photos: GalleryGridPhoto[]; emptyLabel: string }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selected = selectedIndex === null ? null : photos[selectedIndex];

  useEffect(() => {
    if (selectedIndex === null) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedIndex(null);
      if (event.key === "ArrowRight") setSelectedIndex((index) => index === null ? null : (index + 1) % photos.length);
      if (event.key === "ArrowLeft") setSelectedIndex((index) => index === null ? null : (index - 1 + photos.length) % photos.length);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [photos.length, selectedIndex]);

  if (photos.length === 0) {
    return <p className="mt-6 text-[#44474d]">{emptyLabel}</p>;
  }

  return (
    <>
      <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="Gallery">
        {photos.map((photo, index) => (
          <li key={photo.id}>
            <button
              type="button"
              onClick={() => setSelectedIndex(index)}
              className="group w-full overflow-hidden rounded border border-[#c5c6ce] border-t-2 border-t-[#fdc34d] bg-white text-start focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7b5800]"
              aria-label={photo.caption}
            >
              <img src={photo.src} alt="" className="aspect-[4/3] w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]" />
              <span className="block p-4 font-medium text-[#191c1d]">{photo.caption}</span>
            </button>
          </li>
        ))}
      </ul>

      {selected ? (
        <div
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedIndex(null);
          }}
          className="fixed inset-0 z-50 grid place-items-center bg-[#04162e]/80 p-4"
        >
          <section role="dialog" aria-modal="true" aria-label={selected.caption} className="max-h-full w-full max-w-5xl overflow-auto rounded bg-white p-4 shadow-[0_20px_40px_rgba(4,22,46,0.08)] sm:p-6">
            <div className="mb-4 flex justify-end">
              <button type="button" onClick={() => setSelectedIndex(null)} className="rounded border border-[#7b5800] px-3 py-2 text-sm font-semibold text-[#04162e]">
                Close
              </button>
            </div>
            <img src={selected.src} alt={selected.caption} className="max-h-[70vh] w-full object-contain" />
            <div className="mt-4 flex flex-col gap-1 text-[#191c1d]">
              <p className="font-semibold">{selected.caption}</p>
              {selected.category ? <p className="text-sm text-[#44474d]">{selected.category}</p> : null}
              {selected.takenDate ? <p className="text-sm text-[#44474d]">{selected.takenDate}</p> : null}
              {selected.photographerCredit ? <p className="text-sm text-[#44474d]">{selected.photographerCredit}</p> : null}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
