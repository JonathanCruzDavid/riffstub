"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const CONFIRM_WORD = "DELETE";

// Lists every file under `prefix` in a bucket, one folder level deep at a
// time — Storage's list() isn't recursive, and concert photos live under
// <userId>/<concertId>/.
async function listAllFiles(
  supabase: ReturnType<typeof createClient>,
  bucket: string,
  prefix: string,
): Promise<string[]> {
  const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error) throw error;

  const paths: string[] = [];
  for (const entry of data ?? []) {
    const path = `${prefix}/${entry.name}`;
    // Folders come back as placeholder entries with no id.
    if (entry.id === null) {
      paths.push(...(await listAllFiles(supabase, bucket, path)));
    } else {
      paths.push(path);
    }
  }
  return paths;
}

export default function DeleteAccountSection() {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteAccount() {
    setDeleting(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/login";
      return;
    }

    // Check the 2FA requirement up front — delete_my_account() enforces it
    // too, but failing there would be after the files are already gone.
    const [{ data: factors }, { data: aal }] = await Promise.all([
      supabase.auth.mfa.listFactors(),
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    ]);
    if ((factors?.totp.length ?? 0) > 0 && aal?.currentLevel !== "aal2") {
      setError("Sign out and back in with your two-factor code, then try again.");
      setDeleting(false);
      return;
    }

    try {
      for (const bucket of ["avatars", "concert-photos"]) {
        const paths = await listAllFiles(supabase, bucket, user.id);
        if (paths.length > 0) {
          const { error: removeError } = await supabase.storage.from(bucket).remove(paths);
          if (removeError) throw removeError;
        }
      }
    } catch {
      setError("Couldn't remove your photos — nothing was deleted. Try again.");
      setDeleting(false);
      return;
    }

    const { error: rpcError } = await supabase.rpc("delete_my_account");
    if (rpcError) {
      setError("Couldn't delete your account — try again, or contact us.");
      setDeleting(false);
      return;
    }

    // The server-side session is already gone with the user row; just clear
    // the local cookies and leave.
    await supabase.auth.signOut({ scope: "local" });
    window.location.href = "/delete-account?deleted=1";
  }

  return (
    <div>
      <p className="mb-1 font-medium text-red-600">Delete account</p>
      <p className="text-sm text-black/60 dark:text-white/60">
        Permanently deletes your profile, concerts, photos, follows, feed posts, and connections. This
        can&apos;t be undone.
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-50 dark:border-red-500/40 dark:hover:bg-red-500/10"
        >
          Delete my account
        </button>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          <label className="text-sm" htmlFor="delete-confirm">
            Type <strong>{CONFIRM_WORD}</strong> to confirm.
          </label>
          <input
            id="delete-confirm"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoComplete="off"
            autoFocus
            className="rounded-md border border-black/10 bg-transparent px-3 py-1.5 text-sm outline-none dark:border-white/20"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={deleteAccount}
              disabled={deleting || confirmText !== CONFIRM_WORD}
              className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Permanently delete"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setConfirmText("");
                setError(null);
              }}
              disabled={deleting}
              className="rounded-md border border-black/10 px-3 py-1.5 text-sm dark:border-white/20"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
