import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_FILE_BYTES = 10 * 1024 * 1024;

function slugifyName(name: string): string {
  const dot = name.lastIndexOf(".");
  const base = dot >= 0 ? name.slice(0, dot) : name;
  const ext = dot >= 0 ? name.slice(dot).toLowerCase() : "";
  const clean = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
  return `${clean || "foto"}${ext}`;
}

async function uploadToVercelBlob(file: File): Promise<string> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("Vercel Blob niet geconfigureerd");
  }
  const filename = `products/${Date.now()}-${slugifyName(file.name)}`;
  const blob = await put(filename, file, {
    access: "public",
    addRandomSuffix: false,
    contentType: file.type || undefined,
  });
  return blob.url;
}

async function uploadToCatbox(file: File): Promise<string> {
  const uploadForm = new FormData();
  uploadForm.append("reqtype", "fileupload");
  uploadForm.append("fileToUpload", file, file.name);
  const res = await fetch("https://catbox.moe/user/api.php", {
    method: "POST",
    body: uploadForm,
  });
  if (!res.ok) {
    throw new Error(`catbox status ${res.status}`);
  }
  const url = (await res.text()).trim();
  if (!url.startsWith("http")) {
    throw new Error("catbox gaf ongeldig antwoord terug");
  }
  return url;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Geen bestand opgegeven" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Alleen afbeeldingen toegestaan (JPG/PNG/WebP)" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "Bestand te groot (max 10MB). Maak de foto kleiner en probeer opnieuw." },
        { status: 400 }
      );
    }

    const attempts: { provider: string; error: string }[] = [];

    try {
      const url = await uploadToVercelBlob(file);
      return NextResponse.json({ url, provider: "vercel-blob" });
    } catch (err) {
      attempts.push({
        provider: "vercel-blob",
        error: err instanceof Error ? err.message : String(err),
      });
    }

    try {
      const url = await uploadToCatbox(file);
      return NextResponse.json({ url, provider: "catbox" });
    } catch (err) {
      attempts.push({
        provider: "catbox",
        error: err instanceof Error ? err.message : String(err),
      });
    }

    console.error("[Upload] alle providers gefaald", attempts);
    return NextResponse.json(
      {
        error:
          "Upload mislukt bij alle services. Probeer opnieuw of upload een kleinere foto.",
        attempts,
      },
      { status: 502 }
    );
  } catch (err) {
    console.error("[Upload] onverwachte fout", err);
    const message = err instanceof Error ? err.message : "Upload mislukt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
