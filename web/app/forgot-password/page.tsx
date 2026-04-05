"use client";

import Link from "next/link";
import { useState } from "react";
import PageShell from "../_components/PageShell";

type FormStatus = "idle" | "saving" | "saved" | "error";

export default function ForgotPasswordPage() {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");
  const [devResetLink, setDevResetLink] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setMessage("");
    setDevResetLink("");

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error("Unable to process password reset request.");
      }

      setStatus("saved");
      setMessage(
        "If that account exists, a reset link has been generated. Check your inbox."
      );
      if (data.resetUrl) {
        setDevResetLink(String(data.resetUrl));
      }
    } catch {
      setStatus("error");
      setMessage("Could not submit request. Try again.");
    }
  }

  return (
    <PageShell
      title="Forgot Password"
      subtitle="Enter your username or email to reset your password."
    >
      <form className="grid gap-6 md:max-w-xl" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-2 text-sm text-white/70">
          Username or Email
          <input
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white"
            name="identifier"
            placeholder="username or email"
            required
          />
        </label>
        <button
          className="w-full rounded-full bg-yellow-400 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-black md:w-fit"
          type="submit"
          disabled={status === "saving"}
        >
          {status === "saving" ? "Submitting..." : "Send reset link"}
        </button>
        <Link className="text-sm text-white/70 underline" href="/login">
          Back to log in
        </Link>
        {message ? (
          <p
            className={`text-sm ${
              status === "error" ? "text-red-300" : "text-white/70"
            }`}
          >
            {message}
          </p>
        ) : null}
        {devResetLink ? (
          <p className="text-xs text-white/60 break-all">
            Dev reset link:{" "}
            <a className="underline" href={devResetLink}>
              {devResetLink}
            </a>
          </p>
        ) : null}
      </form>
    </PageShell>
  );
}
