/**
 * Prepares a user-selected image for upload.
 *
 * Phone photos are routinely 5-15 MB and sometimes HEIC, which used to make
 * uploads fail (or silently produce an unviewable image). We decode the file in
 * the browser, downscale it, and re-encode as JPEG so every upload is small and
 * web-viewable regardless of what the camera produced.
 */
export const MAX_SOURCE_BYTES = 40 * 1024 * 1024;

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      /* fall through to <img> decoding */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "sync";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

export async function prepareImageForUpload(
  file: File,
  opts: { maxDimension?: number; quality?: number } = {},
): Promise<File> {
  const maxDimension = opts.maxDimension ?? 1600;
  const quality = opts.quality ?? 0.85;

  let bitmap: ImageBitmap | HTMLImageElement;
  try {
    bitmap = await loadBitmap(file);
  } catch {
    throw new Error(
      "We couldn't read that image. Try saving it as a JPEG or PNG and uploading again.",
    );
  }

  const width = "width" in bitmap ? bitmap.width : 0;
  const height = "height" in bitmap ? bitmap.height : 0;
  if (!width || !height) throw new Error("We couldn't read that image. Please try another photo.");

  const scale = Math.min(1, maxDimension / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap as CanvasImageSource, 0, 0, w, h);
  if ("close" in bitmap) bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", quality),
  );
  if (!blob) return file;

  const base = (file.name.replace(/\.[^.]+$/, "") || "photo").slice(0, 60);
  return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
}
