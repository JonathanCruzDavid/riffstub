"use client";

import { useCallback, useEffect, useState } from "react";

export type LocationStatus = "locating" | "ready" | "unavailable";

export type UserLocation = { lat: number; lng: number; label: string | null };

const STORAGE_KEY = "encore:location";

function readStored(): UserLocation | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Passive read for callers that want to opportunistically use a location the
// user already granted, without triggering a fresh geolocation prompt.
export function getStoredLocation(): UserLocation | null {
  return readStored();
}

function writeStored(location: UserLocation) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
  } catch {
    // Private browsing / storage disabled — location just won't persist.
  }
}

// Resolves the visitor's location for "near you" features, preferring
// browser geolocation but always leaving room for a manual ZIP code —
// either as a fallback when location is denied/unavailable, or as a
// deliberate override so someone can browse concerts in a different area.
// A ZIP entered this way is remembered (localStorage) so it sticks across
// visits instead of snapping back to GPS every reload.
export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [status, setStatus] = useState<LocationStatus>("locating");
  const [zipError, setZipError] = useState<string | null>(null);
  const [submittingZip, setSubmittingZip] = useState(false);

  useEffect(() => {
    const stored = readStored();
    if (stored) {
      setLocation(stored);
      setStatus("ready");
      return;
    }

    if (!navigator.geolocation) {
      setStatus("unavailable");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: null });
        setStatus("ready");
      },
      () => setStatus("unavailable"),
      { timeout: 8000 },
    );
  }, []);

  const submitZip = useCallback(async (zip: string) => {
    setSubmittingZip(true);
    setZipError(null);
    try {
      const res = await fetch(`/api/geocode?zip=${encodeURIComponent(zip.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setZipError(data.error ?? "Couldn't find that ZIP code.");
        return;
      }
      const next: UserLocation = { lat: data.lat, lng: data.lng, label: data.label ?? null };
      writeStored(next);
      setLocation(next);
      setStatus("ready");
    } catch {
      setZipError("Couldn't look up that ZIP code right now.");
    } finally {
      setSubmittingZip(false);
    }
  }, []);

  const useCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("unavailable");
      return;
    }
    setZipError(null);
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        try {
          window.localStorage.removeItem(STORAGE_KEY);
        } catch {
          // Ignore — worst case the old ZIP just gets overwritten below.
        }
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: null });
        setStatus("ready");
      },
      () => setStatus("unavailable"),
      { timeout: 8000 },
    );
  }, []);

  return { location, status, zipError, submittingZip, submitZip, useCurrentLocation };
}
