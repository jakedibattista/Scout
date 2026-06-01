"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import PageShell from "../_components/PageShell";

type FormStatus = "idle" | "saving" | "saved" | "error";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (!token) {
      setStatus("error");
      setMessage("Missing reset token.");
      return;
    }

    if (password.length < 8) {
      setStatus("error");
      setMessage("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "Unable to reset password.");
      }
      setStatus("saved");
      setMessage("Password updated. You can now log in.");
    } catch {
      setStatus("error");
      setMessage("Invalid or expired reset link.");
    }
  }

  return (
    <form className="grid gap-6 md:max-w-xl" onSubmit={handleSubmit}>
      <label className="flex flex-col gap-2 text-sm text-muted">
        New password
        <input
          className="rounded-xl border border-line bg-surface px-4 py-3 text-ink"
          name="password"
          type="password"
          minLength={8}
          placeholder="At least 8 characters"
          required
        />
      </label>
      <label className="flex flex-col gap-2 text-sm text-muted">
        Confirm new password
        <input
          className="rounded-xl border border-line bg-surface px-4 py-3 text-ink"
          name="confirmPassword"
          type="password"
          minLength={8}
          placeholder="Re-enter your password"
          required
        />
      </label>
      <button
        className="w-full rounded-xl bg-accent px-6 py-3 text-sm font-medium text-on-accent transition hover:bg-accent-soft md:w-fit"
        type="submit"
        disabled={status === "saving"}
      >
        {status === "saving" ? "Updating..." : "Update password"}
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
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <PageShell
      title="Reset password"
      subtitle="Choose a new password to regain access to your account."
    >
      <Suspense fallback={<div className="text-faint text-sm">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </PageShell>
  );
}
