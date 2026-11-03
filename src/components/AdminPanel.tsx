"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatDisplayDate } from "@/lib/format";
import type { FeedPost, Report } from "@/lib/types";

type MiniProfile = { id: string; username: string | null; avatar_url: string | null; banned_at?: string | null };
type MiniProfileWithPrivacy = MiniProfile & { is_private: boolean };

export default function AdminPanel({
  reports,
  reporterProfiles,
  reportedPosts,
  reportedAccounts,
  postAuthors,
  recentPosts,
  bannedAccounts,
  currentUserId,
}: {
  reports: Report[];
  reporterProfiles: MiniProfile[];
  reportedPosts: FeedPost[];
  reportedAccounts: MiniProfileWithPrivacy[];
  postAuthors: MiniProfile[];
  recentPosts: FeedPost[];
  bannedAccounts: MiniProfile[];
  currentUserId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [banError, setBanError] = useState<string | null>(null);

  const reporterById = new Map(reporterProfiles.map((p) => [p.id, p]));
  const postById = new Map(reportedPosts.map((p) => [p.id, p]));
  const accountById = new Map(reportedAccounts.map((p) => [p.id, p]));
  const authorById = new Map(postAuthors.map((p) => [p.id, p]));

  async function resolveReport(reportId: string) {
    setBusyId(reportId);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase
      .from("reports")
      .update({ status: "resolved", resolved_at: new Date().toISOString(), resolved_by: user?.id ?? null })
      .eq("id", reportId);
    router.refresh();
    setBusyId(null);
  }

  async function deleteReportedPost(postId: string, reportId: string) {
    setBusyId(reportId);
    await supabase.from("feed_posts").delete().eq("id", postId);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase
      .from("reports")
      .update({ status: "resolved", resolved_at: new Date().toISOString(), resolved_by: user?.id ?? null })
      .eq("id", reportId);
    router.refresh();
    setBusyId(null);
  }

  async function deletePost(postId: string) {
    setBusyId(postId);
    await supabase.from("feed_posts").delete().eq("id", postId);
    router.refresh();
    setBusyId(null);
  }

  // Banning signs the user out everywhere, blocks login, and hides their
  // profile and content from everyone but admins — see admin_set_ban() in
  // schema.sql. Nothing is deleted, so Unban fully restores the account.
  async function setBan(account: MiniProfile, banned: boolean, busyKey: string, reportId?: string) {
    const name = account.username ?? "this account";
    if (
      banned &&
      !window.confirm(`Ban ${name}? They'll be signed out, can't log back in, and their profile and posts are hidden.`)
    ) {
      return;
    }

    setBusyId(busyKey);
    setBanError(null);
    const { error } = await supabase.rpc("admin_set_ban", { p_user_id: account.id, p_banned: banned });
    if (error) {
      setBanError(`Couldn't ${banned ? "ban" : "unban"} ${name}: ${error.message}`);
      setBusyId(null);
      return;
    }

    if (reportId) {
      await supabase
        .from("reports")
        .update({ status: "resolved", resolved_at: new Date().toISOString(), resolved_by: currentUserId })
        .eq("id", reportId);
    }
    router.refresh();
    setBusyId(null);
  }

  function banButton(account: MiniProfile | null | undefined, busyKey: string, label: string, reportId?: string) {
    if (!account || account.id === currentUserId) return null;
    if (account.banned_at) {
      return <span className="self-center text-xs font-medium text-red-600">Banned</span>;
    }
    return (
      <button
        type="button"
        disabled={busyId === busyKey}
        onClick={() => setBan(account, true, busyKey, reportId)}
        className="rounded-full bg-red-600 px-3 py-1 text-xs text-white transition hover:bg-red-700 disabled:opacity-50"
      >
        {label}
      </button>
    );
  }

  const postReports = reports.filter((r) => r.target_type === "post");
  const accountReports = reports.filter((r) => r.target_type === "account");

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Admin</h1>

      {banError && (
        <p className="mb-6 rounded-md border border-red-300 p-3 text-sm text-red-600 dark:border-red-900">{banError}</p>
      )}

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
          Pending reports ({reports.length})
        </h2>

        {reports.length === 0 ? (
          <p className="text-sm text-black/60 dark:text-white/60">Nothing to review right now.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {postReports.map((report) => {
              const post = postById.get(report.target_id);
              const author = post ? authorById.get(post.user_id) : null;
              const reporter = reporterById.get(report.reporter_id);
              const busy = busyId === report.id;

              return (
                <li key={report.id} className="card p-3">
                  <p className="text-xs text-black/50 dark:text-white/50">
                    Reported by {reporter?.username ?? "someone"} · {formatDisplayDate(report.created_at.slice(0, 10))}
                  </p>
                  <p className="mt-1 text-sm">
                    <span className="font-medium">Reason:</span> {report.reason}
                  </p>
                  {post ? (
                    <div className="mt-2 rounded-md border border-black/10 p-2 text-sm dark:border-white/10">
                      <p className="text-xs text-black/50 dark:text-white/50">
                        Post by {author?.username ?? "unknown"}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap">{post.body}</p>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-black/50 dark:text-white/50">
                      This post no longer exists.
                    </p>
                  )}
                  <div className="mt-3 flex gap-2">
                    {post && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => deleteReportedPost(post.id, report.id)}
                        className="rounded-full border border-red-300 px-3 py-1 text-xs text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950"
                      >
                        Delete post
                      </button>
                    )}
                    {banButton(author, report.id, "Ban author", report.id)}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => resolveReport(report.id)}
                      className="rounded-full border border-black/10 px-3 py-1 text-xs transition hover:bg-black/5 disabled:opacity-50 dark:border-white/20 dark:hover:bg-white/10"
                    >
                      Dismiss
                    </button>
                  </div>
                </li>
              );
            })}

            {accountReports.map((report) => {
              const account = accountById.get(report.target_id);
              const reporter = reporterById.get(report.reporter_id);
              const busy = busyId === report.id;

              return (
                <li key={report.id} className="card p-3">
                  <p className="text-xs text-black/50 dark:text-white/50">
                    Reported by {reporter?.username ?? "someone"} · {formatDisplayDate(report.created_at.slice(0, 10))}
                  </p>
                  <p className="mt-1 text-sm">
                    <span className="font-medium">Reason:</span> {report.reason}
                  </p>
                  <div className="mt-2 flex items-center gap-2 rounded-md border border-black/10 p-2 text-sm dark:border-white/10">
                    {account?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={account.avatar_url} alt="" className="h-8 w-8 flex-shrink-0 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-black/10 text-xs dark:bg-white/10">
                        {(account?.username ?? "?").charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span>Account: {account?.username ?? "unknown"}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    {account?.username && (
                      <Link
                        href={`/u/${account.username}`}
                        className="rounded-full border border-black/10 px-3 py-1 text-xs transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
                      >
                        View profile
                      </Link>
                    )}
                    {banButton(account, report.id, "Ban account", report.id)}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => resolveReport(report.id)}
                      className="rounded-full border border-black/10 px-3 py-1 text-xs transition hover:bg-black/5 disabled:opacity-50 dark:border-white/20 dark:hover:bg-white/10"
                    >
                      Dismiss
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
          Banned accounts ({bannedAccounts.length})
        </h2>
        {bannedAccounts.length === 0 ? (
          <p className="text-sm text-black/60 dark:text-white/60">No banned accounts.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {bannedAccounts.map((account) => {
              const busyKey = `unban:${account.id}`;
              return (
                <li key={account.id} className="card flex items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{account.username ?? "unknown"}</p>
                    {account.banned_at && (
                      <p className="text-xs text-black/50 dark:text-white/50">
                        Banned {formatDisplayDate(account.banned_at.slice(0, 10))}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={busyId === busyKey}
                    onClick={() => setBan(account, false, busyKey)}
                    className="flex-shrink-0 rounded-full border border-black/10 px-3 py-1 text-xs transition hover:bg-black/5 disabled:opacity-50 dark:border-white/20 dark:hover:bg-white/10"
                  >
                    Unban
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
          Recent posts
        </h2>
        {recentPosts.length === 0 ? (
          <p className="text-sm text-black/60 dark:text-white/60">No posts yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {recentPosts.map((post) => {
              const author = authorById.get(post.user_id);
              const busy = busyId === post.id;
              return (
                <li key={post.id} className="card flex items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-black/50 dark:text-white/50">{author?.username ?? "unknown"}</p>
                    <p className="truncate text-sm">{post.body}</p>
                  </div>
                  {banButton(author, `ban:${post.id}`, "Ban")}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => deletePost(post.id)}
                    className="flex-shrink-0 rounded-full border border-red-300 px-3 py-1 text-xs text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950"
                  >
                    Delete
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
