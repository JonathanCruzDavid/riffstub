export type Concert = {
  id: string;
  user_id: string;
  artist: string;
  venue: string | null;
  address: string | null;
  city: string | null;
  event_date: string;
  ticket_vendor: string | null;
  ticket_url: string | null;
  image_url: string | null;
  notes: string | null;
  rating: number | null;
  is_favorite: boolean;
  is_most_anticipated: boolean;
  created_at: string;
};

export type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  favorite_song: string | null;
  favorite_song_artist: string | null;
  favorite_song_image_url: string | null;
  favorite_artist_name: string | null;
  favorite_artist_image_url: string | null;
  bio: string | null;
  is_private: boolean;
  is_admin: boolean;
  created_at: string;
};

export type SetlistSong = {
  id: string;
  concert_id: string;
  position: number;
  song_name: string;
  created_at: string;
};

export type FavoriteSong = {
  id: string;
  user_id: string;
  song_name: string;
  artist_name: string;
  image_url: string | null;
  position: number;
  created_at: string;
};

export type LikedArtist = {
  id: string;
  user_id: string;
  artist_name: string;
  image_url: string | null;
  position: number;
  created_at: string;
};

export type Comment = {
  id: string;
  concert_id: string;
  user_id: string;
  body: string;
  created_at: string;
};

export type ConcertPhoto = {
  id: string;
  concert_id: string;
  user_id: string;
  storage_path: string;
  caption: string | null;
  created_at: string;
};

export type Follow = {
  follower_id: string;
  followee_id: string;
  created_at: string;
};

export type ActivityEventType =
  | "concert_added"
  | "concert_rated"
  | "favorite_artist_changed"
  | "favorite_song_changed";

export type ActivityEvent = {
  id: string;
  user_id: string;
  type: ActivityEventType;
  concert_id: string | null;
  data: Record<string, unknown>;
  created_at: string;
};

export type FollowRequest = {
  requester_id: string;
  target_id: string;
  created_at: string;
};

export type NotificationType = "follow_request" | "nearby_show";

export type Notification = {
  id: string;
  user_id: string;
  type: NotificationType;
  dedupe_key: string;
  data: Record<string, unknown>;
  created_at: string;
  dismissed_at: string | null;
};

export type FeedPost = {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
};

export type ProfilePreview = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  is_private: boolean;
};

export type ReportTargetType = "post" | "account";
export type ReportStatus = "pending" | "resolved";

export type Report = {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  status: ReportStatus;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
};
