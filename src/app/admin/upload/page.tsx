"use client";

import { useState, useCallback } from "react";

export default function UploadPage() {
  const [uploads, setUploads] = useState<
    { name: string; url: string; status: "uploading" | "done" | "error" }[]
  >([]);
  const [dragOver, setDragOver] = useState(false);

  const uploadFile = useCallback(async (file: File) => {
    const id = Date.now() + Math.random();
    setUploads((prev) => [
      ...prev,
      { name: file.name, url: "", status: "uploading" },
    ]);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(
        "https://api.imgbb.com/1/upload?key=7a9d2b4c8e1f3a5d7b9c0e2f4a6b8d0e",
        { method: "POST", body: formData }
      );

      if (!res.ok) {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        setUploads((prev) =>
          prev.map((u) =>
            u.name === file.name
              ? { ...u, url: dataUrl, status: "done" }
              : u
          )
        );
        return;
      }

      const data = await res.json();
      const imageUrl = data.data?.display_url || data.data?.url || "";

      setUploads((prev) =>
        prev.map((u) =>
          u.name === file.name ? { ...u, url: imageUrl, status: "done" } : u
        )
      );
    } catch {
      setUploads((prev) =>
        prev.map((u) =>
          u.name === file.name ? { ...u, status: "error" } : u
        )
      );
    }
  }, []);

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

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
  };

  return (
    <div className="min-h-screen bg-brand-light pt-32 px-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-heading text-3xl mb-2">Foto Uploaden</h1>
        <p className="text-brand-taupe mb-8">
          Sleep foto&apos;s hieronder of klik om te selecteren. Je krijgt een
          link die je in de Google Sheet plakt.
        </p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
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
          <p className="font-heading text-lg mb-1">
            Sleep foto&apos;s hierheen
          </p>
          <p className="text-sm text-brand-taupe">
            Of klik om bestanden te selecteren
          </p>
          <p className="text-xs text-brand-taupe mt-2">
            JPG, PNG of WebP -- liefst vierkant (1:1)
          </p>
        </div>

        {uploads.length > 0 && (
          <div className="mt-8 space-y-4">
            <h2 className="font-heading text-xl">Geupload</h2>
            {uploads.map((upload, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 bg-white rounded-lg border border-brand-cream"
              >
                {upload.url && upload.status === "done" && (
                  <img
                    src={upload.url}
                    alt={upload.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{upload.name}</p>
                  {upload.status === "uploading" && (
                    <p className="text-xs text-brand-taupe">Uploading...</p>
                  )}
                  {upload.status === "error" && (
                    <p className="text-xs text-red-500">
                      Upload mislukt. Probeer Google Drive.
                    </p>
                  )}
                  {upload.status === "done" && upload.url && (
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
                    onClick={() => copyToClipboard(upload.url)}
                    className="btn-primary text-xs whitespace-nowrap"
                  >
                    Kopieer link
                  </button>
                )}
              </div>
            ))}

            <div className="p-4 bg-brand-cream/50 rounded-lg">
              <p className="text-sm text-brand-taupe">
                <strong>Volgende stap:</strong> Plak de gekopieerde link in de{" "}
                <strong>Foto</strong> kolom van je Google Sheet. De website pakt
                de foto binnen 5 minuten op.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
