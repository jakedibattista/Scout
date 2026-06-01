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
      title="Forgot password"
      subtitle="Enter your username or email to reset your password."
    >
      <form className="grid gap-6 md:max-w-xl" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-2 text-sm text-muted">
          Username or email
          <input
            className="rounded-xl border border-line bg-surface px-4 py-3 text-ink"
            name="identifier"
            placeholder="username or email"
            required
          />
        </label>
        <button
          className="w-full rounded-xl bg-accent px-6 py-3 text-sm font-medium text-on-accent transition hover:bg-accent-soft md:w-fit"
          type="submit"
          disabled={status === "saving"}
        >
          {status === "saving" ? "Submitting..." : "Send reset link"}
        </button>
        <Link className="text-sm text-muted underline" href="/login">
          Back to log in
        </Link>
        {message ? (
          <p
            className={`text-sm ${
              status === "error" ? "text-danger" : "text-muted"
            }`}
          >
            {message}
          </p>
        ) : null}
        {devResetLink ? (
          <p className="text-sm text-muted break-all">
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
