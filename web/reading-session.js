// The photo preview and draft stay in this tab while its documents navigate.
const key = 'jeonsaeng.reading-session.v1';
const maxAge = 60 * 60 * 1000;
export const readingVersion = 2;

export function clearSession() {
  sessionStorage.removeItem(key);
}

export function readSession() {
  try {
    const value = JSON.parse(sessionStorage.getItem(key));
    if (value?.draft && Date.now() - value.updated < maxAge) return value;
    clearSession();
  } catch {}
  return null;
}

export function writeSession(value) {
  sessionStorage.setItem(key, JSON.stringify({...value, updated: Date.now()}));
}
