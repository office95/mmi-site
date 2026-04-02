"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, LogIn, UserPlus, KeyRound } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

const ADMIN_CONTACT = "office@musicmission.at";

export default function LoginClient() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/admin";
  const pendingFlag = searchParams.get("pending");
  const blockedFlag = searchParams.get("blocked");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [mode, setMode] = useState<"login" | "register" | "resetConfirm">("login");
  const [showReset, setShowReset] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const emailRedirectTo = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return `${window.location.origin}/login?redirect=${encodeURIComponent(redirect)}`;
  }, [redirect]);

  useEffect(() => {
    const handleRedirect = async () => {
      const code = searchParams.get("code");
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          persistSessionCookie(data.session);
          setMode("resetConfirm");
          setShowReset(false);
          setInfo("Bitte neues Passwort setzen.");
          return;
        }
      }

      const hash = window.location.hash;
      if (hash.startsWith("#")) {
        const params = new URLSearchParams(hash.slice(1));
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token") ?? "";
        const type = params.get("type");
        if (access_token) {
          const { data } = await supabase.auth.setSession({ access_token, refresh_token });
          persistSessionCookie(data.session);
          if (type === "recovery") {
            setMode("resetConfirm");
            setShowReset(false);
            setInfo("Bitte neues Passwort setzen.");
            return;
          }
          router.push(redirect);
        }
      }
    };
    handleRedirect();
    // Bestehende Session -> Cookie syncen für Middleware
    supabase.auth.getSession().then(({ data }) => persistSessionCookie(data.session));
    if (pendingFlag) {
      setInfo(`Dein Account ist noch nicht freigeschaltet. ${ADMIN_CONTACT} prüft deine Anmeldung.`);
      setMode("login");
    }
    if (blockedFlag) {
      setError(`Dein Account wurde gesperrt. Bitte ${ADMIN_CONTACT} kontaktieren.`);
      setMode("login");
    }
  }, [redirect, router, supabase.auth, searchParams, pendingFlag, blockedFlag]);

  const ensureUserActive = async (user: Session["user"] | null) => {
    if (!user) return false;
    try {
      const res = await fetch(`/api/auth/status?userId=${user.id}`, { cache: "no-store" });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error || "Fehler beim Status");
      }
      const status = payload.status ?? user.user_metadata?.status ?? "pending";
      if (status === "approved") return true;
      if (status === "blocked") {
        setError(`Dein Account ist gesperrt. Bitte ${ADMIN_CONTACT} kontaktieren.`);
      } else {
        setInfo(`Dein Account wird noch geprüft. ${ADMIN_CONTACT} schaltet ihn frei.`);
      }
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("Account-Status konnte nicht geprüft werden");
    }
    await supabase.auth.signOut();
    return false;
  };

  const loginWithPassword = async () => {
    setIsLoading(true);
    setError(null);
    setInfo(null);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw authError;
      const active = await ensureUserActive(data.user);
      if (!active) return;
      persistSessionCookie(data.session);
      router.push(redirect);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("Login fehlgeschlagen");
    } finally {
      setIsLoading(false);
    }
  };

  const register = async () => {
    setIsLoading(true);
    setError(null);
    setInfo(null);
    try {
      const { error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
          data: { status: "pending" },
        },
      });
      if (signupError) throw signupError;
      setInfo(
        `Registrierung erfolgreich. ${ADMIN_CONTACT} prüft deine Anfrage und schaltet den Zugang nach Freigabe frei.`
      );
      setMode("login");
      setPassword("");
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("Registrierung fehlgeschlagen");
    } finally {
      setIsLoading(false);
    }
  };

  const sendResetEmail = async () => {
    setIsLoading(true);
    setError(null);
    setInfo(null);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: emailRedirectTo });
      if (resetError) throw resetError;
      setInfo("Reset-E-Mail gesendet. Bitte Posteingang prüfen.");
      setShowReset(false);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("E-Mail konnte nicht gesendet werden");
    } finally {
      setIsLoading(false);
    }
  };

  const confirmNewPassword = async () => {
    if (newPassword !== newPassword2) {
      setError("Passwörter stimmen nicht überein");
      return;
    }
    setIsLoading(true);
    setError(null);
    setInfo(null);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      setInfo("Passwort gesetzt. Du kannst dich jetzt anmelden.");
      setMode("login");
      setPassword("");
      setNewPassword("");
      setNewPassword2("");
      setShowReset(false);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("Passwort konnte nicht gesetzt werden");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100 text-slate-900 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">
        <div className="space-y-2">
          <p className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-500">
            Admin Login
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">Willkommen zurück</h1>
          <p className="text-sm text-slate-600">
            {mode === "resetConfirm" ? "Setze jetzt dein neues Passwort." : "Bitte mit E-Mail und Passwort anmelden."}
          </p>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
            Neue Mitarbeiter werden von {ADMIN_CONTACT} geprüft und erst nach Freigabe freigeschaltet.
          </div>
        </div>

        <div className="flex gap-2 rounded-full bg-slate-100 p-1 text-xs font-semibold text-slate-600">
          <button
            onClick={() => {
              setMode("login");
              setError(null);
              setInfo(null);
              setShowReset(false);
            }}
            className={`flex-1 rounded-full px-4 py-2 ${mode === "login" ? "bg-white text-slate-900 shadow" : "hover:bg-white/70"}`}
          >
            Login
          </button>
          <button
            onClick={() => {
              setMode("register");
              setError(null);
              setInfo(null);
              setShowReset(false);
            }}
            className={`flex-1 rounded-full px-4 py-2 ${mode === "register" ? "bg-white text-slate-900 shadow" : "hover:bg-white/70"}`}
          >
            Registrieren
          </button>
        </div>

        <div className="space-y-3">
          {mode !== "resetConfirm" && (
            <>
              <label className="text-sm font-semibold text-slate-800">E-Mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                placeholder="you@example.com"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                placeholder="••••••••"
              />
            </>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-emerald-700">{info}</p>}

          {mode === "login" && (
            <button
              onClick={loginWithPassword}
              disabled={isLoading || !email || !password}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-400/40 transition hover:-translate-y-0.5 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              Anmelden
            </button>
          )}

          {mode === "register" && (
            <button
              onClick={register}
              disabled={isLoading || !email || !password}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white text-slate-900 px-4 py-3 text-sm font-semibold shadow-md shadow-slate-200 transition hover:-translate-y-0.5 disabled:opacity-50 border border-slate-200"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Registrieren
            </button>
          )}

          {mode === "resetConfirm" && (
            <>
              <label className="text-sm font-semibold text-slate-800">Neues Passwort</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                placeholder="Neues Passwort"
              />
              <input
                type="password"
                value={newPassword2}
                onChange={(e) => setNewPassword2(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                placeholder="Passwort wiederholen"
              />
              <button
                onClick={confirmNewPassword}
                disabled={isLoading || !newPassword || !newPassword2}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-400/40 transition hover:-translate-y-0.5 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                Neues Passwort setzen
              </button>
            </>
          )}

          {mode !== "resetConfirm" && (
            <div className="text-right">
              <button
                onClick={() => {
                  setShowReset((s) => !s);
                  setError(null);
                  setInfo(null);
                }}
                className="text-xs text-slate-600 underline underline-offset-4 hover:text-slate-900"
                type="button"
              >
                Passwort vergessen?
              </button>
            </div>
          )}

          {showReset && mode !== "resetConfirm" && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">Passwort zurücksetzen</p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                placeholder="you@example.com"
              />
              <button
                onClick={sendResetEmail}
                disabled={isLoading || !email}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white text-slate-900 px-4 py-3 text-sm font-semibold shadow-md shadow-slate-200 transition hover:-translate-y-0.5 disabled:opacity-50 border border-slate-200"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                Reset-E-Mail senden
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function persistSessionCookie(session: Session | null) {
  if (!session?.access_token) return;
  const expires = session.expires_at ? new Date(session.expires_at * 1000) : new Date(Date.now() + 60 * 60 * 1000);
  const secureFlag = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `sb-access-token=${session.access_token}; Path=/; SameSite=Lax${secureFlag}; Expires=${expires.toUTCString()}`;
  if (session.refresh_token) {
    document.cookie = `sb-refresh-token=${session.refresh_token}; Path=/; SameSite=Lax${secureFlag}; Expires=${expires.toUTCString()}`;
  }
}
