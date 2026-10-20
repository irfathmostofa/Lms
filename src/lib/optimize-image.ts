import { IMAGE_QUALITY, ImageOptimizeError, isAllowedImage, MAX_IMAGE_BYTES } from '@/lib/image';

function scaleSize(width: number, height: number, maxWidth: number, maxHeight: number) {
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ImageOptimizeError('The image could not be read.', 'process'));
    };
    image.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

export async function optimizeImageFile(
  file: File,
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  },
): Promise<File> {
  if (!file || file.size === 0) {
    throw new ImageOptimizeError('Choose an image to upload.', 'empty');
  }
  if (!file.type.startsWith('image/')) {
    throw new ImageOptimizeError('Use a JPG, PNG or WebP image.', 'type');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new ImageOptimizeError('Use an image up to 5 MB.', 'size');
  }
  if (!isAllowedImage(file)) {
    throw new ImageOptimizeError('Use a JPG, PNG or WebP image up to 5 MB.', 'type');
  }

  const quality = options?.quality ?? IMAGE_QUALITY;
  const maxWidth = options?.maxWidth ?? 1920;
  const maxHeight = options?.maxHeight ?? 1080;

  const image = await loadImage(file);
  const { width, height } = scaleSize(
    image.naturalWidth || image.width,
    image.naturalHeight || image.height,
    maxWidth,
    maxHeight,
  );

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new ImageOptimizeError('This browser cannot optimize images.', 'process');
  }
  context.drawImage(image, 0, 0, width, height);

  const webp = await canvasToBlob(canvas, 'image/webp', quality);
  const outputBlob = webp && webp.size > 0 ? webp : await canvasToBlob(canvas, 'image/jpeg', quality);
  if (!outputBlob || outputBlob.size === 0) {
    throw new ImageOptimizeError('The image could not be optimized.', 'process');
  }

  const output = outputBlob.size < file.size || file.type === 'image/png' ? outputBlob : file;
  const type = output instanceof File ? output.type : outputBlob.type || 'image/webp';
  const extension = type === 'image/jpeg' ? 'jpg' : type === 'image/png' ? 'png' : 'webp';
  const base = file.name.replace(/\.[^.]+$/, '') || 'image';
  return output instanceof File ? output : new File([output], `${base}.${extension}`, { type, lastModified: Date.now() });
}

export function assignFileToInput(input: HTMLInputElement, file: File) {
  const transfer = new DataTransfer();
  transfer.items.add(file);
  input.files = transfer.files;
}
