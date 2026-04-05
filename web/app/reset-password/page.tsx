"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import PageShell from "../_components/PageShell";

type FormStatus = "idle" | "saving" | "saved" | "error";

export default function ResetPasswordPage() {
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
    <PageShell
      title="Reset Password"
      subtitle="Choose a new password to regain access to your account."
    >
      <form className="grid gap-6 md:max-w-xl" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-2 text-sm text-white/70">
          New Password
          <input
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white"
            name="password"
            type="password"
            minLength={8}
            placeholder="At least 8 characters"
            required
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-white/70">
          Confirm New Password
          <input
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white"
            name="confirmPassword"
            type="password"
            minLength={8}
            placeholder="Re-enter your password"
            required
          />
        </label>
        <button
          className="w-full rounded-full bg-yellow-400 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-black md:w-fit"
          type="submit"
          disabled={status === "saving"}
        >
          {status === "saving" ? "Updating..." : "Update password"}
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
      </form>
    </PageShell>
  );
}
