"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function BannerUpload({ bannerUrl }: { bannerUrl: string | null }) {
  const router = useRouter();
  const supabase = createClient();
  const [preview, setPreview] = useState<string | null>(bannerUrl);
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

    const path = `${user.id}/banner-${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file);

    if (uploadError) {
      setUploading(false);
      setError(uploadError.message);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(path);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ banner_url: publicUrlData.publicUrl })
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

  async function handleRemove() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("profiles").update({ banner_url: null }).eq("id", user.id);
    setPreview(null);
    router.refresh();
  }

  return (
    <div>
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt=""
          className="mb-3 h-24 w-full rounded-md object-cover"
        />
      )}
      <p className="mb-2 text-sm text-black/60 dark:text-white/60">
        {preview
          ? "Custom banner in use."
          : "No custom banner set — your top artist's photo is shown instead."}
      </p>
      <div className="flex items-center gap-3">
        <label className="inline-block cursor-pointer rounded-md border border-black/10 px-3 py-1.5 text-sm dark:border-white/20">
          {uploading ? "Uploading..." : preview ? "Change banner" : "Upload banner"}
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
        {preview && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-sm underline text-black/60 dark:text-white/60"
          >
            Remove
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
