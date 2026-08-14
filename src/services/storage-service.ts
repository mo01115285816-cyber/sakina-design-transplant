import { Capacitor } from "@capacitor/core";
import { SecureStorage } from "@aparajita/capacitor-secure-storage";

const STORAGE_KEY_PREFIX = "sakeenah-auth";

function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

function getWebStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function getKey(key: string): string {
  return `${STORAGE_KEY_PREFIX}:${key}`;
}

async function nativeGet(key: string): Promise<string | null> {
  const value = await SecureStorage.get(getKey(key), false);
  return typeof value === "string" ? value : value == null ? null : JSON.stringify(value);
}

async function nativeSet(key: string, value: string): Promise<void> {
  await SecureStorage.set(getKey(key), value, false);
}

async function nativeRemove(key: string): Promise<void> {
  await SecureStorage.remove(getKey(key));
}

export async function saveSession(session: string): Promise<void> {
  if (isNativePlatform()) {
    await nativeSet("session", session);
    return;
  }

  getWebStorage()?.setItem(getKey("session"), session);
}

export async function getSession(): Promise<string | null> {
  if (isNativePlatform()) {
    return nativeGet("session");
  }

  return getWebStorage()?.getItem(getKey("session")) ?? null;
}

export async function clearSession(): Promise<void> {
  if (isNativePlatform()) {
    try {
      await nativeRemove("session");
    } catch {
      // SecureStorage.remove may throw when the key does not exist.
    }
    return;
  }

  getWebStorage()?.removeItem(getKey("session"));
}

export const authStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (key.endsWith("-auth-token")) return getSession();
    if (isNativePlatform()) return nativeGet(key);
    return getWebStorage()?.getItem(key) ?? null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (key.endsWith("-auth-token")) {
      await saveSession(value);
      return;
    }

    if (isNativePlatform()) {
      await nativeSet(key, value);
    } else {
      getWebStorage()?.setItem(key, value);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (key.endsWith("-auth-token")) {
      await clearSession();
      return;
    }

    if (isNativePlatform()) {
      try {
        await nativeRemove(key);
      } catch {
        // Removing a missing key is intentionally idempotent.
      }
    } else {
      getWebStorage()?.removeItem(key);
    }
  },
};
