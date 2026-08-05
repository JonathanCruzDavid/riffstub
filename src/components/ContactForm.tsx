"use client";

import { useState } from "react";

type Status = "idle" | "sending" | "sent" | "error";
type Reason = "bug" | "feature" | "account" | "other";

const REASON_LABELS: Record<Reason, string> = {
  bug: "Bug report",
  feature: "Feature idea",
  account: "Account or privacy question",
  other: "Something else",
};

const MESSAGE_MAX_LENGTH = 5000;

export default function ContactForm() {
  const [reason, setReason] = useState<Reason>("bug");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: REASON_LABELS[reason],
          name,
          email,
          message,
          website: honeypot,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatus("sent");
      } else {
        setErrorMessage(data.error ?? "Couldn't send that — try again in a bit.");
        setStatus("error");
      }
    } catch {
      setErrorMessage("Couldn't send that — try again in a bit.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-md border border-black/10 p-4 text-sm dark:border-white/20">
        <p className="font-medium">Message sent.</p>
        <p className="mt-1 text-black/60 dark:text-white/60">
          Thanks for reaching out — you'll get a reply at the email you gave.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        What's this about?
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value as Reason)}
          className="rounded-md border border-black/10 bg-transparent px-3 py-2 dark:border-white/20"
        >
          {(Object.keys(REASON_LABELS) as Reason[]).map((r) => (
            <option key={r} value={r}>
              {REASON_LABELS[r]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Name
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Your email
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Message
        <textarea
          required
          rows={5}
          maxLength={MESSAGE_MAX_LENGTH}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="resize-none rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
        />
        <span className="self-end text-xs text-black/40 dark:text-white/40">
          {message.length}/{MESSAGE_MAX_LENGTH}
        </span>
      </label>

      {/* Honeypot — invisible to real visitors, bots that auto-fill every
          field will trip it. */}
      <input
        type="text"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      {status === "error" && errorMessage && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="self-start rounded-md bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
      >
        {status === "sending" ? "Sending..." : "Send message"}
      </button>

      <p className="text-xs text-black/40 dark:text-white/40">
        This isn't saved anywhere — it goes straight to an email, nothing lands in a database.
      </p>
    </form>
  );
}
