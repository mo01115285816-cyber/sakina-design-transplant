import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { getSupabaseClient, isSupabaseConfigured } from "./supabase-client";

export const NATIVE_AUTH_REDIRECT_URI = "com.sakeenah.app://auth/callback";

export type AuthUser = User;
export type AuthSession = Session;

function getWebRedirectUri(): string {
  if (typeof window === "undefined") return "/auth/callback";
  return `${window.location.origin}/auth/callback`;
}

export function getAuthRedirectUri(): string {
  return Capacitor.isNativePlatform() ? NATIVE_AUTH_REDIRECT_URI : getWebRedirectUri();
}

export function ensureAuthConfigured(): void {
  if (!isSupabaseConfigured()) {
    throw new Error("لم يتم إعداد Supabase بعد. راجع متغيرات البيئة المحلية.");
  }
}

export async function signInWithGoogle(): Promise<void> {
  ensureAuthConfigured();
  const supabase = getSupabaseClient();
  const isNative = Capacitor.isNativePlatform();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getAuthRedirectUri(),
      skipBrowserRedirect: isNative,
      queryParams: {
        access_type: "offline",
        prompt: "select_account",
      },
    },
  });

  if (error) throw error;
  if (isNative && data.url) {
    await Browser.open({ url: data.url });
  }
}

export async function signInWithEmail(email: string, password: string): Promise<AuthSession> {
  ensureAuthConfigured();
  const { data, error } = await getSupabaseClient().auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) throw error;
  if (!data.session) throw new Error("لم يتم إنشاء جلسة تسجيل الدخول.");
  return data.session;
}

export async function signUpWithEmail(email: string, password: string): Promise<AuthSession | null> {
  ensureAuthConfigured();
  const { data, error } = await getSupabaseClient().auth.signUp({
    email: email.trim(),
    password,
    options: {
      emailRedirectTo: getAuthRedirectUri(),
    },
  });

  if (error) throw error;
  return data.session;
}

export async function sendPasswordReset(email: string): Promise<void> {
  ensureAuthConfigured();
  const { error } = await getSupabaseClient().auth.resetPasswordForEmail(email.trim(), {
    redirectTo: getAuthRedirectUri(),
  });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  ensureAuthConfigured();
  const { error } = await getSupabaseClient().auth.signOut({ scope: "local" });
  if (error) throw error;
}

export async function getCurrentSession(): Promise<AuthSession | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await getSupabaseClient().auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (!isSupabaseConfigured()) return null;
  const session = await getCurrentSession();
  return session?.user ?? null;
}

export function subscribeToAuthState(
  callback: (event: AuthChangeEvent, session: AuthSession | null) => void,
): () => void {
  if (!isSupabaseConfigured()) return () => undefined;
  const { data } = getSupabaseClient().auth.onAuthStateChange(callback);
  return () => data.subscription.unsubscribe();
}

export async function handleAuthCallback(url?: string): Promise<AuthSession | null> {
  if (!isSupabaseConfigured()) return null;
  const callbackUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");
  if (!callbackUrl) return null;

  const parsed = new URL(callbackUrl);
  const code = parsed.searchParams.get("code");
  if (!code) return null;

  const { data, error } = await getSupabaseClient().auth.exchangeCodeForSession(code);
  if (error) throw error;

  if (typeof window !== "undefined" && !Capacitor.isNativePlatform()) {
    window.history.replaceState({}, document.title, "/");
  }

  if (Capacitor.isNativePlatform()) {
    await Browser.close().catch(() => undefined);
  }

  return data.session;
}

export function listenForNativeAuthCallback(
  onSession: (session: AuthSession | null) => void,
): () => void {
  if (!Capacitor.isNativePlatform()) return () => undefined;

  let disposed = false;
  const processUrl = async (url: string | undefined) => {
    if (disposed || !url?.startsWith(NATIVE_AUTH_REDIRECT_URI)) return;
    try {
      const session = await handleAuthCallback(url);
      onSession(session);
    } catch (error) {
      console.error("Native auth callback failed", error);
      onSession(null);
    }
  };

  const listenerPromise = App.addListener("appUrlOpen", ({ url }) => {
    void processUrl(url);
  });
  void App.getLaunchUrl().then(({ url }) => processUrl(url));

  return () => {
    disposed = true;
    void listenerPromise.then((listener) => listener.remove());
  };
}


export function extractSharedConversationToken(url?: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/^\/shared\/chat\/([A-Za-z0-9_-]{32,96})\/?$/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function listenForNativeSharedConversationLink(
  onToken: (token: string) => void,
): () => void {
  if (!Capacitor.isNativePlatform()) return () => undefined;

  let disposed = false;
  const processUrl = (url: string | undefined) => {
    if (disposed) return;
    const token = extractSharedConversationToken(url);
    if (token) onToken(token);
  };

  const listenerPromise = App.addListener("appUrlOpen", ({ url }) => processUrl(url));
  void App.getLaunchUrl().then(({ url }) => processUrl(url));

  return () => {
    disposed = true;
    void listenerPromise.then((listener) => listener.remove());
  };
}
