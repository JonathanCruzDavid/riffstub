"use client";

import { useState } from "react";

export default function LocationControl({
  label,
  onSubmitZip,
  submitting,
  error,
  onUseCurrentLocation,
  startEditing = false,
}: {
  label: string | null;
  onSubmitZip: (zip: string) => void;
  submitting: boolean;
  error: string | null;
  onUseCurrentLocation: () => void;
  startEditing?: boolean;
}) {
  const [editing, setEditing] = useState(startEditing);
  const [zip, setZip] = useState("");

  if (!editing) {
    return (
      <p className="mb-3 text-xs text-black/50 dark:text-white/50">
        Showing results near {label ?? "your current location"}.{" "}
        <button type="button" onClick={() => setEditing(true)} className="underline">
          Search a different ZIP code
        </button>
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (zip.trim()) onSubmitZip(zip);
      }}
      className="mb-3 flex flex-wrap items-center gap-2 text-xs"
    >
      <input
        type="text"
        inputMode="numeric"
        placeholder="ZIP code"
        value={zip}
        onChange={(e) => setZip(e.target.value)}
        className="w-24 rounded-md border border-black/10 px-2 py-1 dark:border-white/20"
      />
      <button
        type="submit"
        disabled={submitting || zip.trim().length === 0}
        className="rounded-md border border-black/10 px-2 py-1 disabled:opacity-50 dark:border-white/20"
      >
        {submitting ? "Looking up..." : "Go"}
      </button>
      <button
        type="button"
        onClick={onUseCurrentLocation}
        className="text-black/50 underline dark:text-white/50"
      >
        Use my current location
      </button>
      {!startEditing && (
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-black/50 underline dark:text-white/50"
        >
          Cancel
        </button>
      )}
      {error && <span className="w-full text-red-600">{error}</span>}
    </form>
  );
}
