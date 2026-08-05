"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SetlistSong } from "@/lib/types";

export default function SetlistSection({
  concertId,
  initialSongs,
}: {
  concertId: string;
  initialSongs: SetlistSong[];
}) {
  const supabase = createClient();
  const [songs, setSongs] = useState(initialSongs);
  const [songName, setSongName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!songName.trim()) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("setlist_songs")
      .insert({
        concert_id: concertId,
        song_name: songName.trim(),
        position: songs.length,
      })
      .select("*")
      .single();

    setLoading(false);

    if (!error && data) {
      setSongs((prev) => [...prev, data as SetlistSong]);
      setSongName("");
    }
  }

  async function handleRemove(id: string) {
    setSongs((prev) => prev.filter((s) => s.id !== id));
    await supabase.from("setlist_songs").delete().eq("id", id);
  }

  return (
    <div>
      {songs.length === 0 ? (
        <p className="text-sm text-black/60 dark:text-white/60">
          No setlist yet — add the songs you remember.
        </p>
      ) : (
        <ol className="mb-4 list-decimal space-y-1 pl-5 text-sm">
          {songs.map((song) => (
            <li key={song.id} className="group flex items-center justify-between gap-2">
              <span>{song.song_name}</span>
              <button
                onClick={() => handleRemove(song.id)}
                className="text-xs text-black/40 opacity-0 group-hover:opacity-100 hover:text-red-600 dark:text-white/40"
              >
                remove
              </button>
            </li>
          ))}
        </ol>
      )}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={songName}
          onChange={(e) => setSongName(e.target.value)}
          placeholder="Add a song"
          className="flex-1 rounded-md border border-black/10 px-3 py-1.5 text-sm dark:border-white/20"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md border border-black/10 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-white/20"
        >
          Add
        </button>
      </form>
    </div>
  );
}
