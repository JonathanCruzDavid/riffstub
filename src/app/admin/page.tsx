import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AdminPanel from "@/components/AdminPanel";
import type { Report, FeedPost } from "@/lib/types";

const EMPTY_ID = "00000000-0000-0000-0000-000000000000";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const { data: me } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!me?.is_admin) notFound();

  // is_admin alone isn't enough to reach the queue — the matching RLS
  // policies additionally require a completed 2FA challenge this session
  // (aal2). Surface that as a clear setup prompt instead of empty/broken
  // data if the challenge hasn't happened yet.
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2") {
    return (
      <div className="mx-auto w-full max-w-lg flex-1 px-4 py-16 text-center">
        <h1 className="mb-2 text-xl font-semibold">Two-factor authentication required</h1>
        <p className="mb-4 text-sm text-black/60 dark:text-white/60">
          Admin access requires two-factor authentication. Set it up in Account Settings, then log out and back in.
        </p>
        <Link href="/account" className="btn-primary inline-block !px-4 !py-2 text-sm">
          Go to Account Settings
        </Link>
      </div>
    );
  }

  const { data: reports } = await supabase
    .from("reports")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .returns<Report[]>();

  const reportRows = reports ?? [];
  const reporterIds = [...new Set(reportRows.map((r) => r.reporter_id))];
  const postTargetIds = [...new Set(reportRows.filter((r) => r.target_type === "post").map((r) => r.target_id))];
  const accountTargetIds = [
    ...new Set(reportRows.filter((r) => r.target_type === "account").map((r) => r.target_id)),
  ];

  const [{ data: reporterProfiles }, { data: reportedPosts }, { data: reportedAccounts }, { data: recentPosts }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", reporterIds.length ? reporterIds : [EMPTY_ID]),
      supabase
        .from("feed_posts")
        .select("*")
        .in("id", postTargetIds.length ? postTargetIds : [EMPTY_ID])
        .returns<FeedPost[]>(),
      supabase
        .from("profiles")
        .select("id, username, avatar_url, is_private")
        .in("id", accountTargetIds.length ? accountTargetIds : [EMPTY_ID]),
      supabase.from("feed_posts").select("*").order("created_at", { ascending: false }).limit(50).returns<FeedPost[]>(),
    ]);

  const postAuthorIds = [
    ...new Set([...(reportedPosts ?? []).map((p) => p.user_id), ...(recentPosts ?? []).map((p) => p.user_id)]),
  ];
  const { data: postAuthors } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", postAuthorIds.length ? postAuthorIds : [EMPTY_ID]);

  return (
    <AdminPanel
      reports={reportRows}
      reporterProfiles={reporterProfiles ?? []}
      reportedPosts={reportedPosts ?? []}
      reportedAccounts={reportedAccounts ?? []}
      postAuthors={postAuthors ?? []}
      recentPosts={recentPosts ?? []}
    />
  );
}
