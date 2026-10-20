export const IMAGE_QUALITY = 0.75;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];

export class ImageOptimizeError extends Error {
  constructor(
    message: string,
    public code: 'type' | 'size' | 'empty' | 'process',
  ) {
    super(message);
    this.name = 'ImageOptimizeError';
  }
}

export function isAllowedImage(file: Pick<File, 'type' | 'size'>) {
  return file.type.startsWith('image/') && file.size > 0 && file.size <= MAX_IMAGE_BYTES;
}
