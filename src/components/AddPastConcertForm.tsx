"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { logActivityEvent } from "@/lib/activity";

export default function AddPastConcertForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [artist, setArtist] = useState("");
  const [venue, setVenue] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [ticketVendor, setTicketVendor] = useState("");
  const [ticketUrl, setTicketUrl] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Prefilled when arriving from an artist's preview page ("+ Add to my
  // list") — searching for the artist itself happens up in the top nav.
  useEffect(() => {
    const prefillArtist = searchParams.get("artist");
    if (prefillArtist) {
      setArtist(prefillArtist);
      setVenue(searchParams.get("venue") ?? "");
      setAddress(searchParams.get("address") ?? "");
      setCity(searchParams.get("city") ?? "");
      setEventDate(searchParams.get("date") ?? "");
      setTicketVendor(searchParams.get("ticketVendor") ?? "");
      setTicketUrl(searchParams.get("ticketUrl") ?? "");
      setImageUrl(searchParams.get("imageUrl") || null);
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You need to be logged in.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("concerts")
      .insert({
        user_id: user.id,
        artist,
        venue: venue || null,
        address: address || null,
        city: city || null,
        event_date: eventDate,
        ticket_vendor: ticketVendor || null,
        ticket_url: ticketUrl || null,
        image_url: imageUrl,
        notes: notes || null,
      })
      .select("id")
      .single();

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    await logActivityEvent(
      supabase,
      user.id,
      "concert_added",
      { artist, event_date: eventDate, venue: venue || null, city: city || null, image_url: imageUrl },
      data.id,
    );

    router.push(`/concerts/${data.id}`);
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-lg flex-1 px-4 py-10">
      <h1 className="mb-2 text-2xl font-semibold">Add a past concert</h1>
      <p className="mb-6 text-sm text-black/60 dark:text-white/60">
        Tip: search for the artist up top first to bring in their photo automatically.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {ticketUrl && (
          <a
            href={ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="-mb-2 self-start text-sm underline text-black/60 dark:text-white/60"
          >
            View {ticketVendor ? `on ${ticketVendor}` : "ticket link"} ↗
          </a>
        )}
        <label className="flex flex-col gap-1 text-sm">
          Artist *
          <input
            type="text"
            required
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Date *
          <input
            type="date"
            required
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
          />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Venue
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            City
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
            />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          Address
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
          />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Ticket vendor
            <input
              type="text"
              placeholder="Ticketmaster, AXS..."
              value={ticketVendor}
              onChange={(e) => setTicketVendor(e.target.value)}
              className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Ticket link
            <input
              type="url"
              placeholder="https://..."
              value={ticketUrl}
              onChange={(e) => setTicketUrl(e.target.value)}
              className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
            />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          Notes
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-md bg-foreground px-4 py-2 text-background disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save concert"}
        </button>
      </form>
    </div>
  );
}
