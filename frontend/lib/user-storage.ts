/**
 * User-Scoped Storage Utility
 * Isolates user modifications (deleted streams, customized subjects, faculty list, section cohorts, timetables)
 * per logged-in user (user.id / user.email), while keeping global master seed data intact in global fallback keys.
 */

export function getCurrentUserId(): string {
  if (typeof window === "undefined") return "guest";
  try {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      if (parsed.id) return `usr_${parsed.id}`;
      if (parsed.email) return `usr_${parsed.email.replace(/[^a-zA-Z0-9]/g, "_")}`;
    }
  } catch (e) {
    console.error("Error reading current user:", e);
  }
  return "guest";
}

export function getUserStorageKey(baseKey: string): string {
  const userId = getCurrentUserId();
  return `${baseKey}_${userId}`;
}

export function getItemUserScoped<T>(baseKey: string, fallbackMasterKey?: string): T | null {
  if (typeof window === "undefined") return null;
  const userKey = getUserStorageKey(baseKey);
  const userSaved = localStorage.getItem(userKey);

  if (userSaved) {
    try {
      return JSON.parse(userSaved) as T;
    } catch {
      // ignore error
    }
  }

  // If user-specific key does not exist yet, fall back to base key if present
  const baseSaved = localStorage.getItem(baseKey);
  if (baseSaved) {
    try {
      return JSON.parse(baseSaved) as T;
    } catch {
      // ignore error
    }
  }

  if (fallbackMasterKey) {
    const masterSaved = localStorage.getItem(fallbackMasterKey);
    if (masterSaved) {
      try {
        return JSON.parse(masterSaved) as T;
      } catch {
        // ignore error
      }
    }
  }

  return null;
}

export function setItemUserScoped(baseKey: string, value: any): void {
  if (typeof window === "undefined") return;
  const userKey = getUserStorageKey(baseKey);
  localStorage.setItem(userKey, JSON.stringify(value));
}
