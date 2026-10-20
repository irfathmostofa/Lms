'use client';

import { useRef, useState } from 'react';
import { Field, Input } from '@/components/ui';
import { ImageOptimizeError } from '@/lib/image';
import { assignFileToInput, optimizeImageFile } from '@/lib/optimize-image';

export function ImageUpload({
  label = 'Upload image',
  hint = 'JPG, PNG, WebP or GIF up to 5 MB. Compressed to 75% quality before upload.',
  fileName = 'image_file',
  urlName,
  defaultUrl = '',
  previewUrl,
  required = false,
  maxWidth = 1920,
  maxHeight = 1080,
  previewClassName = 'aspect-video',
}: {
  label?: string;
  hint?: string;
  fileName?: string;
  urlName?: string | null;
  defaultUrl?: string;
  previewUrl?: string;
  required?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  previewClassName?: string;
}) {
  const pickerRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState('');
  const [hasFile, setHasFile] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const preview = localPreview || previewUrl || defaultUrl;

  async function onFileChange(file: File | undefined) {
    setError(null);
    setStatus(null);
    setHasFile(false);
    if (!file || !fileRef.current) return;

    let nextFile = file;
    try {
      setStatus('Optimizing image...');
      nextFile = await optimizeImageFile(file, { maxWidth, maxHeight });
      const saved = Math.max(0, file.size - nextFile.size);
      setStatus(
        saved > 0
          ? `Optimized to 75% quality · saved ${Math.round(saved / 1024)} KB`
          : 'Optimized to 75% quality',
      );
    } catch (caught) {
      if (file.type.startsWith('image/') && file.size > 0) {
        nextFile = file;
        setStatus('Using the original image.');
      } else {
        if (pickerRef.current) pickerRef.current.value = '';
        setError(caught instanceof ImageOptimizeError ? caught.message : 'The image could not be optimized.');
        setStatus(null);
        return;
      }
    }

    if (!assignFileToInput(fileRef.current, nextFile)) {
      if (pickerRef.current) pickerRef.current.value = '';
      setError('This browser could not attach the image. Try another file or browser.');
      setStatus(null);
      return;
    }

    setHasFile(true);
    setLocalPreview(URL.createObjectURL(nextFile));
  }

  return (
    <div className="space-y-3">
      <Field label={label} hint={hint}>
        <Input
          ref={pickerRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
          onChange={(event) => onFileChange(event.target.files?.[0])}
        />
      </Field>
      <input
        ref={fileRef}
        type="file"
        name={fileName}
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
        required={required && !defaultUrl && !hasFile}
      />
      {urlName ? (
        <input type="hidden" name={urlName} value={localPreview.startsWith('blob:') ? defaultUrl : preview} />
      ) : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      {status ? <p className="text-xs text-emerald-700">{status}</p> : null}
      <div
        className={`flex w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 bg-cover bg-center text-xs text-slate-400 ${previewClassName}`}
        style={preview ? { backgroundImage: `url(${preview})` } : undefined}
      >
        {preview ? null : 'Image preview'}
      </div>
    </div>
  );
}
