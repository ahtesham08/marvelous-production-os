"use client";

import { useState } from "react";
import { LogIn } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function signInWithGoogle() {
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/`
        }
      });

      if (signInError) setError(signInError.message);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to start Google login.");
    }
  }

  async function sendMagicLink() {
    setError(null);
    setMessage(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/`
        }
      });

      if (signInError) setError(signInError.message);
      else setMessage("Magic link sent. Check your email.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to send magic link.");
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center">
      <section className="w-full rounded-lg border border-black/10 bg-white p-6 shadow-soft">
        <p className="text-sm font-semibold uppercase text-moss">Google Login</p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">Sign in to Marvelous Production OS</h1>
        <p className="mt-3 text-sm leading-6 text-black/60">
          Use the Google account authorized in Supabase. Fresh Start Mode keeps new production work inside Marvelous
          Production OS.
        </p>
        <button
          type="button"
          onClick={signInWithGoogle}
          className="focus-ring mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-moss"
        >
          <LogIn size={17} />
          Continue with Google
        </button>
        <div className="mt-5 border-t border-black/10 pt-5">
          <label className="block">
            <span className="text-xs font-semibold uppercase text-black/55">Email Magic Link</span>
            <input
              className="field-input mt-1"
              placeholder="name@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <button
            type="button"
            onClick={sendMagicLink}
            className="focus-ring mt-3 inline-flex w-full items-center justify-center rounded-md border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:border-moss hover:text-moss"
          >
            Send Magic Link
          </button>
        </div>
        {message ? <p className="mt-4 rounded-md bg-emerald-50 p-3 text-sm font-medium text-emerald-800">{message}</p> : null}
        {error ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm font-medium text-danger">{error}</p> : null}
      </section>
    </div>
  );
}
