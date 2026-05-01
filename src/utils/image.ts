import type { CaptureBoundingBox } from '../types';

export const ALLOWED_UPLOAD_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
export const MAX_UPLOAD_IMAGE_BYTES = 8 * 1024 * 1024;

export const validateImageFile = (file: File) => {
  if (!ALLOWED_UPLOAD_IMAGE_TYPES.has(file.type)) {
    throw new Error('Unsupported image type. Use JPG, PNG, or WebP.');
  }
  if (file.size > MAX_UPLOAD_IMAGE_BYTES) {
    throw new Error('Image is too large. Maximum size is 8MB.');
  }
};

export const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    try {
      validateImageFile(file);
    } catch (error) {
      reject(error);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

export const getFileExtension = (file: File): string => {
  validateImageFile(file);
  const fromName = file.name.split('.').pop()?.toLowerCase();
  const mimeMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  return mimeMap[file.type] || fromName || 'bin';
};

export const dataUrlToFile = (dataUrl: string, fallbackName: string): File => {
  const [meta, base64] = dataUrl.split(',');
  const mimeType = (meta.match(/data:(.*?);base64/)?.[1] || 'application/octet-stream');
  const binary = atob(base64 || '');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const extension = mimeType.split('/')[1] || 'bin';
  return new File([bytes], `${fallbackName}.${extension}`, { type: mimeType });
};

export const resizeImage = (base64Str: string, maxWidth = 300): Promise<string> =>
  new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height *= maxWidth / width;
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png'));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => resolve(base64Str);
  });

export const normalizeCaptureBoundingBox = (value: unknown): CaptureBoundingBox | null => {
  if (!value || typeof value !== 'object') return null;
  const box = value as Record<string, unknown>;
  const x = Math.max(0, Math.min(1000, Math.round(Number(box.x) || 0)));
  const y = Math.max(0, Math.min(1000, Math.round(Number(box.y) || 0)));
  const width = Math.max(0, Math.min(1000 - x, Math.round(Number(box.width) || 0)));
  const height = Math.max(0, Math.min(1000 - y, Math.round(Number(box.height) || 0)));
  if (width <= 0 || height <= 0) return null;
  return { x, y, width, height };
};

export const cropImageByBoundingBox = (dataUrl: string, box: CaptureBoundingBox | null): Promise<string> =>
  new Promise((resolve) => {
    if (!dataUrl || !box) {
      resolve('');
      return;
    }

    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      const sourceWidth = img.width;
      const sourceHeight = img.height;
      if (!sourceWidth || !sourceHeight) {
        resolve('');
        return;
      }

      const left = Math.max(0, Math.floor((box.x / 1000) * sourceWidth));
      const top = Math.max(0, Math.floor((box.y / 1000) * sourceHeight));
      const cropWidth = Math.max(1, Math.floor((box.width / 1000) * sourceWidth));
      const cropHeight = Math.max(1, Math.floor((box.height / 1000) * sourceHeight));
      const width = Math.min(cropWidth, sourceWidth - left);
      const height = Math.min(cropHeight, sourceHeight - top);
      if (width <= 1 || height <= 1) {
        resolve('');
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve('');
        return;
      }

      ctx.drawImage(img, left, top, width, height, 0, 0, width, height);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve('');
  });
