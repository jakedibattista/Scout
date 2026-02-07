"use client";

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
      if (!response.ok) {
        throw new Error("Login failed.");
      }
      const data = await response.json();
      if (!data?.user?.role) {
        throw new Error("Login failed.");
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
      setMessage("Login failed. Try again.");
    }
  }

  return (
    <PageShell
      title="Log in"
      subtitle="Use your username and password to continue."
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
        <label className="flex flex-col gap-2 text-sm text-white/70">
          Password
          <input
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white"
            name="password"
            type="password"
            placeholder="Password"
            required
          />
        </label>
        <button
          className="w-full rounded-full bg-yellow-400 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-black md:w-fit"
          type="submit"
          disabled={status === "saving"}
        >
          {status === "saving" ? "Logging in..." : "Log in"}
        </button>
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
