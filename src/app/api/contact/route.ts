import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { logEvent } from "@/lib/logflare";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE_LENGTH = 5000;

const KNOWN_REASONS = new Set([
  "Bug report",
  "Feature idea",
  "Account or privacy question",
  "Something else",
]);

// Sends through the founder's own Gmail account via SMTP + an App Password
// (myaccount.google.com/apppasswords) — no third-party form service, no
// domain required. All the logic (validation, spam filtering) is ours;
// Gmail is just the delivery pipe, the same role any mail provider plays.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { reason, name, email, message, website } = body as Record<string, unknown>;

  const safeReason = typeof reason === "string" && KNOWN_REASONS.has(reason) ? reason : "Something else";

  // Honeypot — a real visitor never fills this in.
  if (typeof website === "string" && website.trim()) {
    return NextResponse.json({ ok: true });
  }

  const supabase = await createClient();
  const allowed = await checkRateLimit(supabase, "contact", getClientIp(request));
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many messages from this network — try again later." },
      { status: 429 },
    );
  }

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof message !== "string" ||
    !name.trim() ||
    !email.trim() ||
    !message.trim()
  ) {
    return NextResponse.json({ error: "Please fill in all fields." }, { status: 400 });
  }

  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "That doesn't look like a valid email." }, { status: 400 });
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: "Message is too long." }, { status: 400 });
  }

  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailAppPassword) {
    console.error("[contact] GMAIL_USER/GMAIL_APP_PASSWORD not configured");
    await logEvent("contact: not configured", { reason: "missing GMAIL_USER/GMAIL_APP_PASSWORD" });
    return NextResponse.json({ error: "Contact form isn't configured yet." }, { status: 500 });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailAppPassword },
  });

  try {
    await transporter.sendMail({
      from: `Houselights Contact <${gmailUser}>`,
      to: gmailUser,
      replyTo: email,
      subject: `[${safeReason}] Houselights contact from ${name}`,
      text: `From: ${name} <${email}>\n\n${message}`,
    });
  } catch (err) {
    console.error("[contact] send failed", err);
    await logEvent("contact: send failed", { error: String(err) });
    return NextResponse.json({ error: "Couldn't send that — try again." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
