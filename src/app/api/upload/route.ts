import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import sharp from "sharp";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MEDIA_BUCKET = "media";
const MAX_IMAGE_WIDTH = 1920;
const IMAGE_QUALITY = 80;
const MAX_FILE_BYTES = 200 * 1024 * 1024; // 200 MB

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const allowedVideoTypes = ["video/mp4", "video/quicktime", "video/webm", "video/x-m4v"];
const allowedDocTypes = ["application/pdf"];

async function processImage(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  const input = Buffer.from(arrayBuffer);
  const img = sharp(input, { failOn: "none" });
  const metadata = await img.metadata();

  const width = metadata.width ?? MAX_IMAGE_WIDTH;
  const resized = img.resize({ width: Math.min(width, MAX_IMAGE_WIDTH), withoutEnlargement: true });

  // Convert to webp for better compression
  return resized.webp({ quality: IMAGE_QUALITY }).toBuffer();
}

async function ensureBucket(supabase: ReturnType<typeof getSupabaseServiceClient>) {
  const { data: bucketInfo } = await supabase.storage.getBucket(MEDIA_BUCKET);
  if (!bucketInfo) {
    await supabase.storage.createBucket(MEDIA_BUCKET, {
      public: true,
      fileSizeLimit: MAX_FILE_BYTES,
    });
  } else if (bucketInfo.file_size_limit && bucketInfo.file_size_limit < MAX_FILE_BYTES) {
    // bump limit if possible (Supabase supports updateBucket)
    await supabase.storage.updateBucket(MEDIA_BUCKET, {
      public: true,
      fileSizeLimit: MAX_FILE_BYTES,
    });
  }
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const title = (form.get("title") as string) || null;
    const alt = (form.get("alt") as string) || title;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const mime = file.type;
    const isImage = allowedImageTypes.includes(mime);
    const isVideo = allowedVideoTypes.includes(mime);
    const isDoc = allowedDocTypes.includes(mime);

    if (!isImage && !isVideo && !isDoc) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
    }

    const supabase = getSupabaseServiceClient();
    await ensureBucket(supabase);

    const id = uuid();
    // Extension bestimmen: bei Bildern webp, bei Videos/Docs aus Dateinamen ableiten
    let ext = "bin";
    if (isImage) {
      ext = "webp";
    } else if (isVideo) {
      const name = (file as File).name || "";
      const fromName = name.includes(".") ? name.split(".").pop()?.toLowerCase() : null;
      const mimeExt = mime.split("/")[1]?.toLowerCase();
      const candidates = [fromName, mimeExt, "mp4"].filter(Boolean) as string[];
      const picked = candidates.find((e) => ["mp4", "mov", "webm", "m4v"].includes(e)) ?? "mp4";
      ext = picked;
    } else if (isDoc) {
      ext = "pdf";
    }
    const path = `${id}.${ext}`;

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: `File too large (max ${Math.round(MAX_FILE_BYTES / (1024 * 1024))} MB)` }, { status: 400 });
    }

    const payload = isImage ? await processImage(file) : Buffer.from(await file.arrayBuffer());

    const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, payload, {
      contentType: isImage ? "image/webp" : mime,
      upsert: false,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: publicUrl } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);

    await supabase.from("media_files").upsert(
      {
        path,
        url: publicUrl.publicUrl,
        title,
        alt,
        mime_type: mime,
        size_bytes: isImage ? payload.length : file.size,
      },
      { onConflict: "path" },
    );

    return NextResponse.json({
      path,
      url: publicUrl.publicUrl,
      type: isImage ? "image" : "video",
      title,
      alt,
    });
  } catch (e) {
    console.error("Upload error", e);
    const message = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
