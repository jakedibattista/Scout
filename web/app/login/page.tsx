"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PageShell from "../_components/PageShell";

type FormStatus = "idle" | "saving" | "saved" | "error";

export default function LoginPage() {
  const router = useRouter();
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.user?.role) {
        throw new Error(
          data?.error ?? "Login failed. Check your credentials and try again."
        );
      }
      if (typeof window !== "undefined") {
        if (data.user.role === "athlete") {
          localStorage.setItem("athleteUsername", data.user.username ?? "");
        }
        if (data.user.role === "scout") {
          localStorage.setItem("scoutUsername", data.user.username ?? "");
        }
      }
      setStatus("saved");
      setMessage("Logged in.");
      if (data.user.role === "athlete") {
        router.push("/athlete/report");
      } else if (data.user.role === "scout") {
        router.push("/scout/about");
      } else {
        router.push("/");
      }
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Login failed. Try again."
      );
    }
  }

  return (
    <PageShell
      title="Log in"
      subtitle="Use your username and password to continue."
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
        <label className="flex flex-col gap-2 text-sm text-muted">
          Password
          <input
            className="rounded-xl border border-line bg-surface px-4 py-3 text-ink"
            name="password"
            type="password"
            placeholder="Password"
            required
          />
        </label>
        <button
          className="w-full rounded-xl bg-accent px-6 py-3 text-sm font-medium text-on-accent transition hover:bg-accent-soft md:w-fit"
          type="submit"
          disabled={status === "saving"}
        >
          {status === "saving" ? "Logging in..." : "Log in"}
        </button>
        {message ? (
          <p
            className={`text-sm ${
              status === "error" ? "text-danger" : "text-muted"
            }`}
          >
            {message}
          </p>
        ) : null}
        <Link
          className={`text-sm underline ${status === "error" ? "text-accent" : "text-muted"}`}
          href="/forgot-password"
        >
          Forgot password?
        </Link>
      </form>
    </PageShell>
  );
}
