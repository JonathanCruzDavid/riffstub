"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CoverPhotoUpload({
  concertId,
  hasImage,
}: {
  concertId: string;
  hasImage: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    const path = `${user.id}/${concertId}/cover-${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("concert-photos")
      .upload(path, file);

    if (uploadError) {
      setUploading(false);
      setError(uploadError.message);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from("concert-photos").getPublicUrl(path);

    const { error: updateError } = await supabase
      .from("concerts")
      .update({ image_url: publicUrlData.publicUrl })
      .eq("id", concertId);

    setUploading(false);
    e.target.value = "";

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <label className="inline-flex cursor-pointer items-center rounded-full border border-black/10 px-3 py-1.5 text-sm dark:border-white/20">
        {uploading ? "Uploading..." : hasImage ? "Change cover photo" : "Upload cover photo"}
        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
        />
      </label>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
