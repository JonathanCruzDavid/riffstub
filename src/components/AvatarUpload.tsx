"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AvatarUpload({ avatarUrl }: { avatarUrl: string | null }) {
  const router = useRouter();
  const supabase = createClient();
  const [preview, setPreview] = useState<string | null>(avatarUrl);
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

    const path = `${user.id}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file);

    if (uploadError) {
      setUploading(false);
      setError(uploadError.message);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(path);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrlData.publicUrl })
      .eq("id", user.id);

    setUploading(false);
    e.target.value = "";

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setPreview(publicUrlData.publicUrl);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-4">
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt=""
          className="h-16 w-16 flex-shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-black/10 dark:bg-white/10" />
      )}
      <div>
        <label className="inline-block cursor-pointer rounded-md border border-black/10 px-3 py-1.5 text-sm dark:border-white/20">
          {uploading ? "Uploading..." : "Change photo"}
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
