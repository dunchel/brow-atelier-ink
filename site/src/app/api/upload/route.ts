import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Geen bestand opgegeven" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Alleen afbeeldingen toegestaan" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Bestand is te groot (max 10MB)" }, { status: 400 });
    }

    const uploadForm = new FormData();
    uploadForm.append("reqtype", "fileupload");
    uploadForm.append("fileToUpload", file, file.name);

    const res = await fetch("https://catbox.moe/user/api.php", {
      method: "POST",
      body: uploadForm,
    });

    if (!res.ok) {
      throw new Error(`Upload service fout: ${res.status}`);
    }

    const url = await res.text();

    if (!url.startsWith("http")) {
      throw new Error("Ongeldig antwoord van upload service");
    }

    return NextResponse.json({ url: url.trim() });
  } catch (err) {
    console.error("[Upload] Error:", err);
    const message = err instanceof Error ? err.message : "Upload mislukt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
