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

