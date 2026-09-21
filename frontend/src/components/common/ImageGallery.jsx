import React, { useEffect, useState } from 'react';

const ImageGallery = ({ images = [], alt = 'Report evidence' }) => {
  const imageList = Array.from(new Set(
    (Array.isArray(images) ? images : [images])
      .filter((image) => typeof image === 'string' && image.trim())
      .map((image) => image.trim()),
  ));
  const [activeIndex, setActiveIndex] = useState(null);

  useEffect(() => {
    if (activeIndex === null) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setActiveIndex(null);
      if (event.key === 'ArrowLeft') setActiveIndex((current) => (current - 1 + imageList.length) % imageList.length);
      if (event.key === 'ArrowRight') setActiveIndex((current) => (current + 1) % imageList.length);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [activeIndex, imageList.length]);

  if (imageList.length === 0) return null;

  const isOpen = activeIndex !== null;
  const activeImage = isOpen ? imageList[activeIndex] : null;
  const moveTo = (direction) => setActiveIndex((current) => (current + direction + imageList.length) % imageList.length);

  return (
    <>
      <div className={`grid justify-items-start gap-2 ${imageList.length === 1 ? 'grid-cols-[80px]' : 'grid-cols-[repeat(auto-fill,minmax(80px,100px))]'}`}>
        {imageList.map((image, index) => (
          <button
            key={image}
            type="button"
            onClick={() => setActiveIndex(index)}
            className="group overflow-hidden rounded-lg border border-gray-200 bg-gray-50 p-1 transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900"
            aria-label={`View ${alt}, image ${index + 1} of ${imageList.length}`}
          >
            <img
              src={image}
              alt={`${alt} ${index + 1}`}
              className="h-20 w-20 rounded-lg object-cover transition group-hover:opacity-90"
            />
          </button>
        ))}
      </div>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${alt}, image ${activeIndex + 1} of ${imageList.length}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setActiveIndex(null)}
        >
          <button
            type="button"
            onClick={() => setActiveIndex(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-3 text-2xl leading-none text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Close image viewer"
          >
            <span aria-hidden="true">&times;</span>
          </button>

          {imageList.length > 1 && (
            <button
              type="button"
              onClick={(event) => { event.stopPropagation(); moveTo(-1); }}
              className="absolute left-3 rounded-full bg-white/10 px-4 py-3 text-2xl text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white sm:left-6"
              aria-label="Previous image"
            >
              <span aria-hidden="true">&#8592;</span>
            </button>
          )}

          <img
            src={activeImage}
            alt={`${alt} ${activeIndex + 1}`}
            className="max-h-[90vh] max-w-[calc(100vw-2rem)] object-contain"
            onClick={(event) => event.stopPropagation()}
          />

          {imageList.length > 1 && (
            <button
              type="button"
              onClick={(event) => { event.stopPropagation(); moveTo(1); }}
              className="absolute right-3 rounded-full bg-white/10 px-4 py-3 text-2xl text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white sm:right-6"
              aria-label="Next image"
            >
              <span aria-hidden="true">&#8594;</span>
            </button>
          )}

          <p className="absolute bottom-4 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
            {activeIndex + 1} / {imageList.length}
          </p>
        </div>
      )}
    </>
  );
};

export default ImageGallery;
