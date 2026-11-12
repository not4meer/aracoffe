import "server-only";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { adminDb } from "@/lib/admin/db";

const MAX_BYTES = 8 * 1024 * 1024;

export type Processed = { buffer: Buffer; width: number; height: number; contentType: string; ext: string };

/**
 * Yüklenen dosyayı doğrular ve yeniden işler: sadece JPEG/PNG/WebP kabul edilir (SVG reddedilir),
 * EXIF/GPS silinir, boyut sınırlanır. Fotoğraf WebP'ye, logo (şeffaflık için) PNG'ye çevrilir.
 */
export async function processImage(file: File, kind: "photo" | "logo" | "product"): Promise<Processed> {
  if (!(file instanceof File) || file.size === 0) throw new Error("Bir fotoğraf seçin.");
  if (file.size > MAX_BYTES) throw new Error("Dosya çok büyük (en fazla 8 MB).");
  const input = Buffer.from(await file.arrayBuffer());
  let format: string | undefined;
  try {
    format = (await sharp(input, { limitInputPixels: 60_000_000 }).metadata()).format;
  } catch {
    throw new Error("Bu dosya geçerli bir fotoğraf değil.");
  }
  if (format !== "jpeg" && format !== "png" && format !== "webp") {
    throw new Error("Sadece JPEG, PNG ya da WebP fotoğraf yüklenebilir.");
  }
  const max = kind === "logo" ? 512 : kind === "product" ? 1000 : 1600;
  // rotate(): EXIF yönünü uygular; çıktıda metadata bırakılmaz (EXIF/GPS silinir).
  const pipeline = sharp(input, { limitInputPixels: 60_000_000 })
    .rotate()
    .resize({ width: max, height: max, fit: "inside", withoutEnlargement: true });
  const out =
    kind === "logo"
      ? await pipeline.png({ compressionLevel: 9, palette: true, quality: 90 }).toBuffer({ resolveWithObject: true })
      : await pipeline.webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
  return {
    buffer: out.data,
    width: out.info.width,
    height: out.info.height,
    contentType: kind === "logo" ? "image/png" : "image/webp",
    ext: kind === "logo" ? "png" : "webp",
  };
}

export async function uploadMedia(folder: string, img: Processed): Promise<string> {
  const path = `${folder}/${randomUUID()}.${img.ext}`;
  const { error } = await adminDb().storage.from("media").upload(path, img.buffer, {
    contentType: img.contentType,
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error(`Yükleme başarısız: ${error.message}`);
  return path;
}

export async function removeMedia(path: string | null | undefined): Promise<void> {
  if (!path) return;
  await adminDb().storage.from("media").remove([path]);
}
