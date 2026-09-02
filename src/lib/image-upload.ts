/**
 * Prepares a user-selected image for upload.
 *
 * iOS/iPadOS web views enforce a hard memory ceiling per process. Decoding a
 * modern 12-48 MP camera photo at full resolution allocates hundreds of MB of
 * RGBA pixels, and WebKit terminates the whole web view — which, inside the
 * Capacitor app, looks exactly like an app crash. So we never decode at full
 * resolution: we ask the decoder to downscale while decoding, then finish the
 * resize on a small canvas.
 */

/** Files larger than this are rejected before we touch the decoder. */
export const MAX_SOURCE_BYTES = 25 * 1024 * 1024;

/** Hard ceiling on decoded pixels, so a single bitmap can never blow the budget. */
const MAX_DECODE_PIXELS = 6_000_000;

export function isProbablyImage(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  // Some iOS pickers hand back an empty MIME type for HEIC/HEIF.
  return /\.(jpe?g|png|webp|gif|heic|heif|avif)$/i.test(file.name);
}

/**
 * Decode `file` downscaled so its longest edge is at most `maxDimension`.
 * `createImageBitmap` with resize options lets the platform decode subsampled,
 * which is the only memory-safe path on iOS.
 */
async function decodeDownscaled(
  file: File,
  maxDimension: number,
): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    // Passing a single dimension preserves the aspect ratio, so we don't have to
    // know the orientation up front.
    for (const options of [
      { resizeWidth: maxDimension, resizeQuality: "medium" as const },
      { resizeHeight: maxDimension, resizeQuality: "medium" as const },
    ]) {
      try {
        const bitmap = await createImageBitmap(file, options);
        if (bitmap.width * bitmap.height <= MAX_DECODE_PIXELS) return bitmap;
        bitmap.close();
      } catch {
        /* try the next strategy */
      }
    }
  }

  // Fallback: <img> decoding. Only attempted for smaller files, because this
  // path always decodes at full resolution.
  if (file.size > 6 * 1024 * 1024) {
    throw new Error("MEMORY_UNSAFE");
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    if (img.naturalWidth * img.naturalHeight > MAX_DECODE_PIXELS) {
      throw new Error("MEMORY_UNSAFE");
    }
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

export async function prepareImageForUpload(
  file: File,
  opts: { maxDimension?: number; quality?: number } = {},
): Promise<File> {
  const maxDimension = Math.min(opts.maxDimension ?? 1600, 2048);
  const quality = opts.quality ?? 0.85;

  if (!isProbablyImage(file)) {
    throw new Error("That file isn't an image. Please choose a JPEG, PNG, or HEIC photo.");
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error("That photo is too large (25 MB max). Please pick a smaller one.");
  }

  let bitmap: ImageBitmap | HTMLImageElement;
  try {
    bitmap = await decodeDownscaled(file, maxDimension);
  } catch (e) {
    // A file we can't decode safely is still uploadable as-is when it's already
    // a web-viewable format at a reasonable size — better than crashing.
    if (/^image\/(jpeg|png|webp)$/.test(file.type) && file.size <= 8 * 1024 * 1024) {
      return file;
    }
    throw new Error(
      e instanceof Error && e.message === "MEMORY_UNSAFE"
        ? "That photo is too high-resolution for this device. Try a smaller version or take a new photo."
        : "We couldn't read that image. Try saving it as a JPEG or PNG and uploading again.",
    );
  }

  try {
    const width = bitmap.width || 0;
    const height = bitmap.height || 0;
    if (!width || !height) {
      throw new Error("We couldn't read that image. Please try another photo.");
    }

    const scale = Math.min(1, maxDimension / Math.max(width, height));
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap as CanvasImageSource, 0, 0, w, h);

    const blob = await new Promise<Blob | null>((resolve) => {
      try {
        canvas.toBlob((b) => resolve(b), "image/jpeg", quality);
      } catch {
        resolve(null);
      }
    });
    // Release the canvas backing store promptly (iOS keeps it alive otherwise).
    canvas.width = 0;
    canvas.height = 0;
    if (!blob) return file;

    const base = (file.name.replace(/\.[^.]+$/, "") || "photo").slice(0, 60);
    return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
  } finally {
    if ("close" in bitmap) bitmap.close();
  }
}
