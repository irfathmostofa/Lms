import Image from 'next/image';

export function MediaVisual({
  imageUrl,
  lottieUrl,
  alt,
  className = 'aspect-[4/3]',
}: {
  imageUrl?: string | null;
  lottieUrl?: string | null;
  alt: string;
  className?: string;
}) {
  if (lottieUrl && !imageUrl) {
    return (
      <div className={`overflow-hidden rounded-2xl bg-slate-50 ${className}`}>
        <iframe src={lottieUrl} title={alt} className="h-full w-full border-0" loading="lazy" />
      </div>
    );
  }

  if (imageUrl) {
    return (
      <div className={`relative overflow-hidden rounded-2xl bg-slate-100 ${className}`}>
        <Image src={imageUrl} alt={alt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
      </div>
    );
  }

  return null;
}
