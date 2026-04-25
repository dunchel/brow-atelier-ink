"use client";

import { useState, useCallback } from "react";

type UploadStatus = "converting" | "uploading" | "verifying" | "done" | "error";

interface Upload {
  name: string;
  url: string;
  status: UploadStatus;
  error?: string;
  preview?: string;
  verified: boolean;
}

async function convertToJpg(file: File): Promise<File> {
  if (file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/webp") {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas niet beschikbaar")); return; }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error("Conversie mislukt")); return; }
          const newName = file.name.replace(/\.[^.]+$/, ".jpg");
          resolve(new File([blob], newName, { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.9
      );
    };
    img.onerror = () => reject(new Error("Kan afbeelding niet laden. Probeer een JPG of PNG."));
    img.src = URL.createObjectURL(file);
  });
}

async function verifyUrl(url: string): Promise<boolean> {
  try {
    const img = new Image();
    return new Promise((resolve) => {
      img.onload = () => resolve(img.naturalWidth > 0);
      img.onerror = () => resolve(false);
      img.src = url;
      setTimeout(() => resolve(false), 10000);
    });
  } catch {
    return false;
  }
}

export default function UploadPage() {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const updateUpload = (name: string, updates: Partial<Upload>) => {
    setUploads((prev) =>
      prev.map((u) => (u.name === name && u.status !== "done" ? { ...u, ...updates } : u))
    );
  };

  const uploadFile = useCallback(async (originalFile: File) => {
    const preview = URL.createObjectURL(originalFile);
    const displayName = originalFile.name;

    setUploads((prev) => [
      { name: displayName, url: "", status: "converting", preview, verified: false },
      ...prev,
    ]);

    try {
      let file = originalFile;
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        updateUpload(displayName, { status: "converting" });
        file = await convertToJpg(file);
      }

      updateUpload(displayName, { status: "uploading" });

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!data.url) throw new Error(data.error || "Upload mislukt");

      updateUpload(displayName, { status: "verifying", url: data.url });

      const isValid = await verifyUrl(data.url);

      if (isValid) {
        setUploads((prev) =>
          prev.map((u) =>
            u.name === displayName ? { ...u, url: data.url, status: "done", verified: true } : u
          )
        );
      } else {
        setUploads((prev) =>
          prev.map((u) =>
            u.name === displayName
              ? { ...u, url: data.url, status: "done", verified: false, error: "Foto geupload maar kon niet geverifieerd worden. Controleer de link." }
              : u
          )
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload mislukt";
      setUploads((prev) =>
        prev.map((u) =>
          u.name === displayName ? { ...u, status: "error", error: msg } : u
        )
      );
    }
  }, []);

  const retryUpload = useCallback((name: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp";
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) {
        setUploads((prev) => prev.filter((u) => u.name !== name));
        uploadFile(file);
      }
    };
    input.click();
  }, [uploadFile]);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      Array.from(files).forEach((file) => {
        if (file.type.startsWith("image/")) {
          uploadFile(file);
        }
      });
    },
    [uploadFile]
  );

  const copyToClipboard = (url: string, name: string) => {
    navigator.clipboard.writeText(url);
    setCopied(name);
    setTimeout(() => setCopied(null), 2000);
  };

  const copyAllUrls = () => {
    const urls = uploads
      .filter((u) => u.status === "done" && u.url && u.verified)
      .map((u) => `${u.name}\t${u.url}`)
      .join("\n");
    navigator.clipboard.writeText(urls);
    setCopied("all");
    setTimeout(() => setCopied(null), 2000);
  };

  const verified = uploads.filter((u) => u.status === "done" && u.verified);
  const problems = uploads.filter((u) => u.status === "error" || (u.status === "done" && !u.verified));

  const statusText: Record<UploadStatus, string> = {
    converting: "Converteren naar JPG...",
    uploading: "Uploaden...",
    verifying: "Verifiëren...",
    done: "",
    error: "",
  };

  return (
    <div className="min-h-screen bg-brand-light pt-32 pb-20 px-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-heading text-3xl mb-2">Productfoto&apos;s uploaden</h1>
        <p className="text-brand-taupe mb-2">
          Upload foto&apos;s en krijg een link voor de Google Sheet. HEIC-bestanden worden automatisch geconverteerd naar JPG.
        </p>
        <p className="text-xs text-brand-taupe mb-8">
          Elke foto wordt na upload geverifieerd. Groene rand = werkt, rode rand = probleem.
        </p>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";
            input.multiple = true;
            input.onchange = () => handleFiles(input.files);
            input.click();
          }}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
            dragOver
              ? "border-brand-gold bg-brand-gold/10"
              : "border-brand-cream hover:border-brand-gold"
          }`}
        >
          <div className="text-4xl mb-4">+</div>
          <p className="font-heading text-lg mb-1">Sleep foto&apos;s hierheen</p>
          <p className="text-sm text-brand-taupe">Of klik om bestanden te selecteren</p>
          <p className="text-xs text-brand-taupe mt-2">JPG, PNG, WebP of HEIC</p>
        </div>

        {uploads.length > 0 && (
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl">
                {verified.length} gelukt{problems.length > 0 ? `, ${problems.length} probleem${problems.length > 1 ? "en" : ""}` : ""}
              </h2>
              {verified.length > 1 && (
                <button onClick={copyAllUrls} className="text-xs text-brand-gold hover:underline">
                  {copied === "all" ? "Gekopieerd!" : "Kopieer alle links"}
                </button>
              )}
            </div>

            {uploads.map((upload, i) => (
              <div
                key={i}
                className={`flex items-center gap-4 p-4 bg-white rounded-lg border-2 ${
                  upload.status === "done" && upload.verified
                    ? "border-green-300"
                    : upload.status === "error" || (upload.status === "done" && !upload.verified)
                    ? "border-red-300"
                    : "border-brand-cream"
                }`}
              >
                <div className="w-16 h-16 bg-brand-cream rounded overflow-hidden flex-shrink-0">
                  {upload.status === "done" && upload.url ? (
                    <img src={upload.url} alt={upload.name} className="w-full h-full object-cover" />
                  ) : upload.preview ? (
                    <img src={upload.preview} alt={upload.name} className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{upload.name}</p>

                  {upload.status !== "done" && upload.status !== "error" && (
                    <p className="text-xs text-brand-taupe">{statusText[upload.status]}</p>
                  )}

                  {upload.status === "error" && (
                    <div>
                      <p className="text-xs text-red-500">{upload.error || "Upload mislukt"}</p>
                      <button
                        onClick={() => retryUpload(upload.name)}
                        className="text-xs text-brand-gold hover:underline mt-1"
                      >
                        Opnieuw proberen
                      </button>
                    </div>
                  )}

                  {upload.status === "done" && !upload.verified && (
                    <div>
                      <p className="text-xs text-orange-500">{upload.error || "Niet geverifieerd"}</p>
                      <input
                        type="text"
                        readOnly
                        value={upload.url}
                        className="w-full text-xs bg-brand-light px-2 py-1 rounded mt-1 text-brand-taupe"
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                      />
                    </div>
                  )}

                  {upload.status === "done" && upload.verified && (
                    <input
                      type="text"
                      readOnly
                      value={upload.url}
                      className="w-full text-xs bg-brand-light px-2 py-1 rounded mt-1 text-brand-taupe"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                  )}
                </div>
                {upload.status === "done" && upload.url && (
                  <button
                    onClick={() => copyToClipboard(upload.url, upload.name)}
                    className="btn-primary text-xs whitespace-nowrap"
                  >
                    {copied === upload.name ? "Gekopieerd!" : "Kopieer"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
