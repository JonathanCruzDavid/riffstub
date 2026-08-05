"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ConcertPhoto } from "@/lib/types";

export default function PhotoGallery({
  concertId,
  initialPhotos,
}: {
  concertId: string;
  initialPhotos: ConcertPhoto[];
}) {
  const supabase = createClient();
  const [photos, setPhotos] = useState(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function publicUrl(path: string) {
    return supabase.storage.from("concert-photos").getPublicUrl(path).data.publicUrl;
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setUploading(false);
      return;
    }

    const path = `${user.id}/${concertId}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("concert-photos")
      .upload(path, file);

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("concert_photos")
      .insert({ concert_id: concertId, user_id: user.id, storage_path: path })
      .select("*")
      .single();

    setUploading(false);
    e.target.value = "";

    if (insertError) {
      setError(insertError.message);
      return;
    }

    if (data) {
      setPhotos((prev) => [...prev, data as ConcertPhoto]);
    }
  }

  async function handleRemove(photo: ConcertPhoto) {
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    await supabase.storage.from("concert-photos").remove([photo.storage_path]);
    await supabase.from("concert_photos").delete().eq("id", photo.id);
  }

  return (
    <div>
      {photos.length === 0 ? (
        <p className="mb-4 text-sm text-black/60 dark:text-white/60">
          No photos yet.
        </p>
      ) : (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo) => (
            // eslint-disable-next-line @next/next/no-img-element
            <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-md">
              <img
                src={publicUrl(photo.storage_path)}
                alt={photo.caption ?? "Concert photo"}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <button
                onClick={() => handleRemove(photo)}
                className="absolute right-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white opacity-0 group-hover:opacity-100"
              >
                remove
              </button>
            </div>
          ))}
        </div>
      )}
      <label className="inline-block cursor-pointer rounded-md border border-black/10 px-3 py-1.5 text-sm dark:border-white/20">
        {uploading ? "Uploading..." : "Upload photo"}
        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
        />
      </label>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
