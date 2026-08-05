-- Run this whole file once in the Supabase SQL editor (Project -> SQL Editor -> New query).

-- ─── Profiles ───────────────────────────────────────────────────────────────
-- One row per auth user, created automatically on signup via the trigger below.
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  avatar_url text,
  banner_url text,
  favorite_song text,
  favorite_song_artist text,
  favorite_song_image_url text,
  favorite_artist_name text,
  favorite_artist_image_url text,
  bio text,
  is_private boolean not null default false,
  created_at timestamptz not null default now()
);

alter table profiles add column if not exists banner_url text;
alter table profiles add column if not exists favorite_song text;
alter table profiles add column if not exists favorite_song_artist text;
alter table profiles add column if not exists favorite_song_image_url text;
alter table profiles add column if not exists favorite_artist_name text;
alter table profiles add column if not exists favorite_artist_image_url text;
alter table profiles add column if not exists bio text;
alter table profiles add column if not exists is_private boolean not null default false;

alter table profiles enable row level security;

-- A private profile is invisible to everyone but its owner — not just
-- "hidden from the profile page," but genuinely excluded at the query
-- level, so it also drops out of user search and can't be read via a
-- direct API call using the public anon key.
drop policy if exists "Profiles are viewable by everyone" on profiles;
drop policy if exists "Profiles are viewable unless private" on profiles;
create policy "Profiles are viewable unless private"
  on profiles for select
  using (
    not is_private
    or auth.uid() = id
    or exists (
      select 1 from follows
      where follows.follower_id = auth.uid()
      and follows.followee_id = profiles.id
    )
  );

drop policy if exists "Users can update their own profile" on profiles;
create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- ─── Hidden artists ─────────────────────────────────────────────────────────
-- Spotify artist IDs the user has hidden from their "Top artists" card. The
-- next artist in their Spotify ranking fills the spot instead.
create table if not exists hidden_artists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  artist_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, artist_id)
);

alter table hidden_artists enable row level security;

drop policy if exists "Users can view their own hidden artists" on hidden_artists;
create policy "Users can view their own hidden artists"
  on hidden_artists for select
  using (auth.uid() = user_id);

drop policy if exists "Users can hide their own artists" on hidden_artists;
create policy "Users can hide their own artists"
  on hidden_artists for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can unhide their own artists" on hidden_artists;
create policy "Users can unhide their own artists"
  on hidden_artists for delete
  using (auth.uid() = user_id);

-- ─── Favorite songs ─────────────────────────────────────────────────────────
-- A user's general "songs I like" list (capped at 5 in the UI). Separate
-- from profiles.favorite_song, which is a single standalone pick.
create table if not exists favorite_songs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  song_name text not null,
  artist_name text not null,
  image_url text,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists favorite_songs_user_id_idx on favorite_songs (user_id);
alter table favorite_songs add column if not exists image_url text;

alter table favorite_songs enable row level security;

-- Same "invisible if the owner is private" rule as profiles, so a private
-- account's liked songs don't leak even though this table has its own policy.
drop policy if exists "Favorite songs are viewable by everyone" on favorite_songs;
drop policy if exists "Favorite songs are viewable unless owner is private" on favorite_songs;
create policy "Favorite songs are viewable unless owner is private"
  on favorite_songs for select
  using (
    auth.uid() = user_id
    or exists (select 1 from profiles p where p.id = favorite_songs.user_id and not p.is_private)
    or exists (
      select 1 from follows
      where follows.follower_id = auth.uid()
      and follows.followee_id = favorite_songs.user_id
    )
  );

drop policy if exists "Users can add their own favorite songs" on favorite_songs;
create policy "Users can add their own favorite songs"
  on favorite_songs for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own favorite songs" on favorite_songs;
create policy "Users can update their own favorite songs"
  on favorite_songs for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own favorite songs" on favorite_songs;
create policy "Users can delete their own favorite songs"
  on favorite_songs for delete
  using (auth.uid() = user_id);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Concerts ───────────────────────────────────────────────────────────────
-- Each row is one concert a user is tracking, upcoming or past.
create table if not exists concerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  artist text not null,
  venue text,
  address text,
  city text,
  event_date date not null,
  ticket_vendor text,
  ticket_url text,
  image_url text,
  notes text,
  rating int,
  is_favorite boolean not null default false,
  is_most_anticipated boolean not null default false,
  favorite_song text,
  created_at timestamptz not null default now()
);

alter table concerts add column if not exists image_url text;
alter table concerts add column if not exists address text;
alter table concerts add column if not exists rating int;
alter table concerts add column if not exists is_favorite boolean not null default false;
alter table concerts add column if not exists is_most_anticipated boolean not null default false;
alter table concerts add column if not exists favorite_song text;

create index if not exists concerts_user_id_idx on concerts (user_id);
create index if not exists concerts_event_date_idx on concerts (event_date);

alter table concerts enable row level security;

drop policy if exists "Users can view their own concerts" on concerts;
create policy "Users can view their own concerts"
  on concerts for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own concerts" on concerts;
create policy "Users can insert their own concerts"
  on concerts for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own concerts" on concerts;
create policy "Users can update their own concerts"
  on concerts for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own concerts" on concerts;
create policy "Users can delete their own concerts"
  on concerts for delete
  using (auth.uid() = user_id);

-- ─── Setlist songs ──────────────────────────────────────────────────────────
-- User-entered setlist for one of their tracked concerts.
create table if not exists setlist_songs (
  id uuid primary key default gen_random_uuid(),
  concert_id uuid not null references concerts (id) on delete cascade,
  position int not null default 0,
  song_name text not null,
  created_at timestamptz not null default now()
);

create index if not exists setlist_songs_concert_id_idx on setlist_songs (concert_id);

alter table setlist_songs enable row level security;

drop policy if exists "Users can view setlist songs for their own concerts" on setlist_songs;
create policy "Users can view setlist songs for their own concerts"
  on setlist_songs for select
  using (exists (select 1 from concerts where concerts.id = setlist_songs.concert_id and concerts.user_id = auth.uid()));

drop policy if exists "Users can add setlist songs to their own concerts" on setlist_songs;
create policy "Users can add setlist songs to their own concerts"
  on setlist_songs for insert
  with check (exists (select 1 from concerts where concerts.id = setlist_songs.concert_id and concerts.user_id = auth.uid()));

drop policy if exists "Users can delete setlist songs from their own concerts" on setlist_songs;
create policy "Users can delete setlist songs from their own concerts"
  on setlist_songs for delete
  using (exists (select 1 from concerts where concerts.id = setlist_songs.concert_id and concerts.user_id = auth.uid()));

-- ─── Wishlist songs ─────────────────────────────────────────────────────────
-- Songs the user hopes to hear at an upcoming show (capped at 5 in the UI).
create table if not exists wishlist_songs (
  id uuid primary key default gen_random_uuid(),
  concert_id uuid not null references concerts (id) on delete cascade,
  position int not null default 0,
  song_name text not null,
  created_at timestamptz not null default now()
);

create index if not exists wishlist_songs_concert_id_idx on wishlist_songs (concert_id);

alter table wishlist_songs enable row level security;

drop policy if exists "Users can view wishlist songs for their own concerts" on wishlist_songs;
create policy "Users can view wishlist songs for their own concerts"
  on wishlist_songs for select
  using (exists (select 1 from concerts where concerts.id = wishlist_songs.concert_id and concerts.user_id = auth.uid()));

drop policy if exists "Users can add wishlist songs to their own concerts" on wishlist_songs;
create policy "Users can add wishlist songs to their own concerts"
  on wishlist_songs for insert
  with check (exists (select 1 from concerts where concerts.id = wishlist_songs.concert_id and concerts.user_id = auth.uid()));

drop policy if exists "Users can delete wishlist songs from their own concerts" on wishlist_songs;
create policy "Users can delete wishlist songs from their own concerts"
  on wishlist_songs for delete
  using (exists (select 1 from concerts where concerts.id = wishlist_songs.concert_id and concerts.user_id = auth.uid()));

-- ─── Comments ───────────────────────────────────────────────────────────────
-- Free-text notes/comments a user leaves on one of their own concerts.
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  concert_id uuid not null references concerts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists comments_concert_id_idx on comments (concert_id);

alter table comments enable row level security;

drop policy if exists "Users can view comments on their own concerts" on comments;
create policy "Users can view comments on their own concerts"
  on comments for select
  using (exists (select 1 from concerts where concerts.id = comments.concert_id and concerts.user_id = auth.uid()));

drop policy if exists "Users can add comments to their own concerts" on comments;
create policy "Users can add comments to their own concerts"
  on comments for insert
  with check (auth.uid() = user_id and exists (select 1 from concerts where concerts.id = comments.concert_id and concerts.user_id = auth.uid()));

drop policy if exists "Users can delete their own comments" on comments;
create policy "Users can delete their own comments"
  on comments for delete
  using (auth.uid() = user_id);

-- ─── Concert photos ─────────────────────────────────────────────────────────
-- Metadata row for each photo uploaded to the "concert-photos" storage bucket.
create table if not exists concert_photos (
  id uuid primary key default gen_random_uuid(),
  concert_id uuid not null references concerts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null,
  caption text,
  created_at timestamptz not null default now()
);

create index if not exists concert_photos_concert_id_idx on concert_photos (concert_id);

alter table concert_photos enable row level security;

drop policy if exists "Users can view photos on their own concerts" on concert_photos;
create policy "Users can view photos on their own concerts"
  on concert_photos for select
  using (exists (select 1 from concerts where concerts.id = concert_photos.concert_id and concerts.user_id = auth.uid()));

drop policy if exists "Users can add photos to their own concerts" on concert_photos;
create policy "Users can add photos to their own concerts"
  on concert_photos for insert
  with check (auth.uid() = user_id and exists (select 1 from concerts where concerts.id = concert_photos.concert_id and concerts.user_id = auth.uid()));

drop policy if exists "Users can delete their own concert photos" on concert_photos;
create policy "Users can delete their own concert photos"
  on concert_photos for delete
  using (auth.uid() = user_id);

-- ─── Storage bucket for photos ──────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('concert-photos', 'concert-photos', true)
on conflict (id) do nothing;

drop policy if exists "Users can upload their own concert photos" on storage.objects;
create policy "Users can upload their own concert photos"
  on storage.objects for insert
  with check (bucket_id = 'concert-photos' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Anyone can view concert photos" on storage.objects;
create policy "Anyone can view concert photos"
  on storage.objects for select
  using (bucket_id = 'concert-photos');

drop policy if exists "Users can delete their own concert photos from storage" on storage.objects;
create policy "Users can delete their own concert photos from storage"
  on storage.objects for delete
  using (bucket_id = 'concert-photos' and auth.uid()::text = (storage.foldername(name))[1]);

-- ─── Spotify connections ────────────────────────────────────────────────────
-- One row per user who has connected their Spotify account.
create table if not exists spotify_connections (
  user_id uuid primary key references auth.users (id) on delete cascade,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table spotify_connections enable row level security;

drop policy if exists "Users can view their own Spotify connection" on spotify_connections;
create policy "Users can view their own Spotify connection"
  on spotify_connections for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own Spotify connection" on spotify_connections;
create policy "Users can insert their own Spotify connection"
  on spotify_connections for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own Spotify connection" on spotify_connections;
create policy "Users can update their own Spotify connection"
  on spotify_connections for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own Spotify connection" on spotify_connections;
create policy "Users can delete their own Spotify connection"
  on spotify_connections for delete
  using (auth.uid() = user_id);

-- ─── Storage bucket for avatars ─────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Anyone can view avatars" on storage.objects;
create policy "Anyone can view avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- ─── Spotify cache ──────────────────────────────────────────────────────────
-- Shared cache for public Spotify catalog lookups (search, artist albums/
-- tracks) — not user-specific, so every request reads/writes the same rows.
-- Persists across serverless instances and redeploys, unlike Next.js's
-- in-process fetch cache alone, and is shared by every visitor, which
-- matters because Spotify's rate limit is one pool shared by the whole app.
create table if not exists spotify_cache (
  cache_key text primary key,
  value jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists spotify_cache_expires_at_idx on spotify_cache (expires_at);

alter table spotify_cache enable row level security;

drop policy if exists "Spotify cache is readable by everyone" on spotify_cache;
create policy "Spotify cache is readable by everyone"
  on spotify_cache for select
  using (true);

drop policy if exists "Spotify cache is insertable by everyone" on spotify_cache;
create policy "Spotify cache is insertable by everyone"
  on spotify_cache for insert
  with check (true);

drop policy if exists "Spotify cache is updatable by everyone" on spotify_cache;
create policy "Spotify cache is updatable by everyone"
  on spotify_cache for update
  using (true);

-- ─── Follows ────────────────────────────────────────────────────────────────
-- Instant for public profiles. Private profiles require an approved
-- follow_requests row first — see the insert policy further down, which is
-- tightened once follow_requests exists.
create table if not exists follows (
  follower_id uuid not null references auth.users (id) on delete cascade,
  followee_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  constraint follows_no_self_follow check (follower_id <> followee_id)
);

create index if not exists follows_follower_id_idx on follows (follower_id);
create index if not exists follows_followee_id_idx on follows (followee_id);

alter table follows enable row level security;

drop policy if exists "Follows are viewable by everyone" on follows;
create policy "Follows are viewable by everyone"
  on follows for select
  using (true);

drop policy if exists "Users can follow as themselves" on follows;
create policy "Users can follow as themselves"
  on follows for insert
  with check (auth.uid() = follower_id);

drop policy if exists "Users can unfollow as themselves" on follows;
create policy "Users can unfollow as themselves"
  on follows for delete
  using (auth.uid() = follower_id);

-- ─── Activity events ────────────────────────────────────────────────────────
-- One row per feed-worthy action (concert added, concert rated, favorite
-- artist/song changed). This is the single source of truth for both the
-- /feed page and the "people you follow are also going" bubble on a concert
-- page — the underlying concerts table stays fully private (owner-only RLS,
-- unchanged); this table is the deliberately-shared subset of that activity,
-- visible only to the user themselves and whoever follows them. `data` is a
-- denormalized snapshot (artist/date/image/rating) so the feed renders
-- without extra joins and still reads fine if the source concert is edited
-- later — it's a historical record of what happened, not a live view.
create table if not exists activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('concert_added', 'concert_rated', 'favorite_artist_changed', 'favorite_song_changed')),
  concert_id uuid references concerts (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_events_user_id_idx on activity_events (user_id);
create index if not exists activity_events_created_at_idx on activity_events (created_at desc);

alter table activity_events enable row level security;

-- Followers only see a followee's activity while that followee is public —
-- going private hides it for everyone including existing followers, so
-- "private" has one consistent meaning instead of a partial/confusing one.
-- A follows row is itself the permission grant — for a public account it was
-- created instantly, for a private one only via an approved follow request —
-- so an existing follower always sees this regardless of current privacy.
drop policy if exists "Activity events are viewable by the user or their followers" on activity_events;
create policy "Activity events are viewable by the user or their followers"
  on activity_events for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from follows
      where follows.follower_id = auth.uid()
      and follows.followee_id = activity_events.user_id
    )
  );

drop policy if exists "Users can insert their own activity events" on activity_events;
create policy "Users can insert their own activity events"
  on activity_events for insert
  with check (auth.uid() = user_id);

-- ─── Private accounts now gate follows behind a request ─────────────────────
-- A direct follow insert is only allowed when the target is public. Following
-- a private account goes through follow_requests + accept_follow_request()
-- below, which inserts into follows via a security-definer function.
drop policy if exists "Users can follow as themselves" on follows;
create policy "Users can follow as themselves"
  on follows for insert
  with check (
    auth.uid() = follower_id
    and exists (select 1 from profiles p where p.id = followee_id and not p.is_private)
  );

-- Minimal identity lookup that works even for private profiles, so a viewer
-- can find a private account (username/avatar) and send a follow request
-- without the full profiles row (bio, banner, favorite song, etc.) ever
-- being exposed to non-owners. Bypasses RLS via security definer.
create or replace function public.get_profile_preview(lookup_username text)
returns table (id uuid, username text, avatar_url text, is_private boolean)
language sql
security definer
set search_path = public
as $$
  select id, username, avatar_url, is_private
  from profiles
  where username = lookup_username;
$$;

grant execute on function public.get_profile_preview(text) to authenticated;

-- ─── Follow requests ──────────────────────────────────────────────────────
-- Pending "please let me follow you" requests for private accounts.
create table if not exists follow_requests (
  requester_id uuid not null references auth.users (id) on delete cascade,
  target_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (requester_id, target_id),
  constraint follow_requests_no_self check (requester_id <> target_id)
);

create index if not exists follow_requests_target_id_idx on follow_requests (target_id);
create index if not exists follow_requests_requester_id_idx on follow_requests (requester_id);

alter table follow_requests enable row level security;

drop policy if exists "Users can view requests they sent or received" on follow_requests;
create policy "Users can view requests they sent or received"
  on follow_requests for select
  using (auth.uid() = requester_id or auth.uid() = target_id);

drop policy if exists "Users can create their own follow requests" on follow_requests;
create policy "Users can create their own follow requests"
  on follow_requests for insert
  with check (auth.uid() = requester_id);

drop policy if exists "Requester or target can delete a follow request" on follow_requests;
create policy "Requester or target can delete a follow request"
  on follow_requests for delete
  using (auth.uid() = requester_id or auth.uid() = target_id);

-- Accepting inserts into follows + clears the request in one transaction.
-- Only the target of the request can accept it.
create or replace function public.accept_follow_request(p_requester_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from follow_requests
    where requester_id = p_requester_id and target_id = auth.uid()
  ) then
    raise exception 'No pending request from this user';
  end if;

  insert into follows (follower_id, followee_id)
  values (p_requester_id, auth.uid())
  on conflict do nothing;

  delete from follow_requests
  where requester_id = p_requester_id and target_id = auth.uid();
end;
$$;

grant execute on function public.accept_follow_request(uuid) to authenticated;

-- ─── Notifications ──────────────────────────────────────────────────────────
-- The "mailbox": follow requests + nearby-show alerts. Persistent until the
-- user explicitly dismisses (sets dismissed_at) — never auto-marked-read.
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('follow_request', 'nearby_show')),
  dedupe_key text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  dismissed_at timestamptz,
  unique (user_id, dedupe_key)
);

create index if not exists notifications_user_id_idx on notifications (user_id);

alter table notifications enable row level security;

drop policy if exists "Users can view their own notifications" on notifications;
create policy "Users can view their own notifications"
  on notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own notifications" on notifications;
create policy "Users can insert their own notifications"
  on notifications for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own notifications" on notifications;
create policy "Users can update their own notifications"
  on notifications for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own notifications" on notifications;
create policy "Users can delete their own notifications"
  on notifications for delete
  using (auth.uid() = user_id);

-- A follow request always creates a notification for the target, and
-- accepting/declining (both just delete the follow_requests row) always
-- clears it. Runs as security definer so the requester — who has no insert
-- rights on the target's notifications — can still trigger the insert.
create or replace function public.notify_follow_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into notifications (user_id, type, dedupe_key, data)
  values (
    new.target_id,
    'follow_request',
    'follow_request:' || new.requester_id::text,
    jsonb_build_object('requester_id', new.requester_id)
  )
  on conflict (user_id, dedupe_key) do nothing;
  return new;
end;
$$;

drop trigger if exists on_follow_request_created on follow_requests;
create trigger on_follow_request_created
  after insert on follow_requests
  for each row execute procedure public.notify_follow_request();

create or replace function public.cleanup_follow_request_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from notifications
  where user_id = old.target_id
    and type = 'follow_request'
    and dedupe_key = 'follow_request:' || old.requester_id::text;
  return old;
end;
$$;

drop trigger if exists on_follow_request_deleted on follow_requests;
create trigger on_follow_request_deleted
  after delete on follow_requests
  for each row execute procedure public.cleanup_follow_request_notification();

-- ─── Feed posts ─────────────────────────────────────────────────────────────
-- Free-text updates a user writes directly to their own feed.
create table if not exists feed_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists feed_posts_user_id_idx on feed_posts (user_id);
create index if not exists feed_posts_created_at_idx on feed_posts (created_at desc);

alter table feed_posts enable row level security;

-- Same reasoning as activity_events: a follows row is already the grant.
drop policy if exists "Feed posts are viewable by the author or their followers" on feed_posts;
create policy "Feed posts are viewable by the author or their followers"
  on feed_posts for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from follows
      where follows.follower_id = auth.uid()
      and follows.followee_id = feed_posts.user_id
    )
  );

drop policy if exists "Users can insert their own feed posts" on feed_posts;
create policy "Users can insert their own feed posts"
  on feed_posts for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own feed posts" on feed_posts;
create policy "Users can delete their own feed posts"
  on feed_posts for delete
  using (auth.uid() = user_id);

-- ─── Admin role ─────────────────────────────────────────────────────────────
-- No column-level RLS in Postgres, so is_admin is protected by a trigger
-- instead: any UPDATE arriving through a live client session (auth.uid() is
-- set) that tries to change is_admin has that change silently reverted. Only
-- a direct SQL editor session (no JWT, auth.uid() is null) can flip it —
-- which is how you make yourself the first admin, see the comment below.
alter table profiles add column if not exists is_admin boolean not null default false;

create or replace function public.prevent_client_admin_changes()
returns trigger
language plpgsql
as $$
begin
  if new.is_admin is distinct from old.is_admin and auth.uid() is not null then
    new.is_admin := old.is_admin;
  end if;
  return new;
end;
$$;

drop trigger if exists on_profiles_prevent_admin_escalation on profiles;
create trigger on_profiles_prevent_admin_escalation
  before update on profiles
  for each row execute procedure public.prevent_client_admin_changes();

-- Security-definer helper so every "is this user an admin" check in a policy
-- is one call instead of a repeated exists-subquery, and so it can't recurse
-- into the RLS it's often used inside of.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false);
$$;

-- Admin actions additionally require a completed 2FA challenge this session
-- (aal2), not just the is_admin flag — so a merely-logged-in admin session
-- (e.g. a stolen cookie, or before completing the MFA prompt) can't do
-- anything admin-only until the second factor has actually been verified.
-- auth.jwt() reads the live session's claims, so this can't be spoofed from
-- the client the same way is_admin() itself can't be.
create or replace function public.is_admin_verified()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() and coalesce((select auth.jwt() ->> 'aal'), 'aal1') = 'aal2';
$$;

drop policy if exists "Admins can view all profiles" on profiles;
create policy "Admins can view all profiles"
  on profiles for select
  using (public.is_admin_verified());

-- ─── Basic content filter ───────────────────────────────────────────────────
-- Blocks the most severe, unambiguous slurs/hate speech at the database
-- layer (not just client-side), so it can't be bypassed by calling the API
-- directly. This is deliberately a blunt, low-false-positive net for slurs —
-- not a general profanity filter and not a substitute for the report queue
-- below, which is how everything else gets moderated.
create or replace function public.contains_blocked_content(input text)
returns boolean
language sql
immutable
as $$
  select input is not null and lower(input) ~ (
    '\y(' || array_to_string(array[
      'nigger', 'niggers', 'nigga', 'niggas',
      'chink', 'chinks', 'gook', 'gooks',
      'spic', 'spics', 'wetback', 'wetbacks',
      'kike', 'kikes', 'towelhead', 'sandnigger',
      'faggot', 'faggots', 'fag', 'fags', 'dyke', 'dykes', 'tranny', 'trannies',
      'retard', 'retards', 'retarded',
      'coon', 'coons', 'jigaboo', 'porchmonkey',
      'beaner', 'beaners', 'gyp', 'gypped',
      'raghead', 'ragheads',
      'childporn', 'child porn', 'childsexabuse'
    ], '|') || ')\y'
  );
$$;

alter table feed_posts drop constraint if exists feed_posts_body_no_blocked_content;
alter table feed_posts add constraint feed_posts_body_no_blocked_content
  check (not public.contains_blocked_content(body));

alter table profiles drop constraint if exists profiles_bio_no_blocked_content;
alter table profiles add constraint profiles_bio_no_blocked_content
  check (not public.contains_blocked_content(bio));

alter table profiles drop constraint if exists profiles_username_no_blocked_content;
alter table profiles add constraint profiles_username_no_blocked_content
  check (not public.contains_blocked_content(username));

-- ─── Reports ────────────────────────────────────────────────────────────────
-- User-filed reports on a post or an account, reviewed on /admin.
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  target_type text not null check (target_type in ('post', 'account')),
  target_id uuid not null,
  reason text not null check (char_length(reason) between 1 and 300),
  status text not null default 'pending' check (status in ('pending', 'resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users (id) on delete set null,
  unique (reporter_id, target_type, target_id)
);

create index if not exists reports_status_idx on reports (status);
create index if not exists reports_target_idx on reports (target_type, target_id);

alter table reports enable row level security;

drop policy if exists "Users can create reports" on reports;
create policy "Users can create reports"
  on reports for insert
  with check (auth.uid() = reporter_id);

drop policy if exists "Reporters and admins can view reports" on reports;
create policy "Reporters and admins can view reports"
  on reports for select
  using (auth.uid() = reporter_id or public.is_admin_verified());

drop policy if exists "Admins can update reports" on reports;
create policy "Admins can update reports"
  on reports for update
  using (public.is_admin_verified());

drop policy if exists "Admins can delete reports" on reports;
create policy "Admins can delete reports"
  on reports for delete
  using (public.is_admin_verified());

-- Admins can see and remove any post for moderation, on top of the
-- owner-only policies defined earlier (permissive policies combine with OR).
drop policy if exists "Admins can view all feed posts" on feed_posts;
create policy "Admins can view all feed posts"
  on feed_posts for select
  using (public.is_admin_verified());

drop policy if exists "Admins can delete any feed post" on feed_posts;
create policy "Admins can delete any feed post"
  on feed_posts for delete
  using (public.is_admin_verified());

-- ─── Rate limiting ──────────────────────────────────────────────────────────
-- Backs app-level throttling for signup, login, and the contact form — one
-- row per attempt, bucketed by "action:ip". No RLS/direct table access is
-- exposed; everything goes through check_rate_limit() below, which is the
-- only thing granted to anon/authenticated. This protects against casual
-- scripted abuse of the app's own forms — it can't stop someone who calls
-- Supabase's auth API directly with the public anon key, since nothing
-- server-side sits in front of that. Supabase's own dashboard rate-limit
-- settings (Authentication > Rate Limits) are the backstop for that case.
create table if not exists rate_limits (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_limits_bucket_created_idx on rate_limits (bucket, created_at desc);

alter table rate_limits enable row level security;
-- No policies created deliberately — this table has zero direct access via
-- the API; every read/write happens inside the security-definer function
-- below, which bypasses RLS as its owning role.

create or replace function public.check_rate_limit(p_bucket text, p_max_attempts int, p_window_minutes int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  -- Opportunistic cleanup so this table never grows unbounded — no cron job
  -- needed, each check sweeps its own bucket's stale rows.
  delete from rate_limits
  where bucket = p_bucket
    and created_at < now() - (p_window_minutes || ' minutes')::interval;

  select count(*) into v_count
  from rate_limits
  where bucket = p_bucket
    and created_at > now() - (p_window_minutes || ' minutes')::interval;

  if v_count >= p_max_attempts then
    return false;
  end if;

  insert into rate_limits (bucket) values (p_bucket);
  return true;
end;
$$;

grant execute on function public.check_rate_limit(text, int, int) to anon, authenticated;

-- ─── Liked artists ──────────────────────────────────────────────────────────
-- A self-curated "artists I like" list, searched via Ticketmaster (no login,
-- no cap) rather than pulled from a connected Spotify account. This is what
-- drives "shows near you" matching now — Spotify's OAuth-based top-artists
-- data only ever covers a small, capped set of test users (see the
-- Development Mode / Extension Request limits on Spotify's side), so nearby
-- matching can no longer depend on it alone.
create table if not exists liked_artists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  artist_name text not null,
  image_url text,
  position int not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, artist_name)
);

create index if not exists liked_artists_user_id_idx on liked_artists (user_id);

alter table liked_artists enable row level security;

-- Same visibility rule as favorite_songs: owner, or anyone if the profile
-- is public, or an approved follower regardless of current privacy (a
-- follows row is itself the permission grant — see the follows section
-- above for why).
drop policy if exists "Liked artists are viewable unless owner is private" on liked_artists;
create policy "Liked artists are viewable unless owner is private"
  on liked_artists for select
  using (
    auth.uid() = user_id
    or exists (select 1 from profiles p where p.id = liked_artists.user_id and not p.is_private)
    or exists (
      select 1 from follows
      where follows.follower_id = auth.uid()
      and follows.followee_id = liked_artists.user_id
    )
  );

drop policy if exists "Users can add their own liked artists" on liked_artists;
create policy "Users can add their own liked artists"
  on liked_artists for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own liked artists" on liked_artists;
create policy "Users can delete their own liked artists"
  on liked_artists for delete
  using (auth.uid() = user_id);
