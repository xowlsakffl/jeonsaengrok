import { rememberCompleted } from './saved-readings.js';

// This tab carries form fields and measurement descriptions between pages.
const key = 'jeonsaeng.reading-session.v1';
const maxAge = 60 * 60 * 1000;
export const readingVersion = 2;

export function clearSession() {
  sessionStorage.removeItem(key);
}

function withoutLegacyPhoto(value) {
  const draft=value?.draft;
  if (!draft || !('preview' in draft || 'photoName' in draft)) return value;
  const measurements = face => face?.observations ? {
    observations:face.observations.map(({name,reading})=>({name,reading}))
  } : null;
  const clean={...value,draft:{values:draft.values,step:draft.step,features:measurements(draft.features)}};
  if (value.profile) clean.profile={...value.profile,face:measurements(value.profile.face)};
  return clean;
}

export function readSession() {
  try {
    const value = JSON.parse(sessionStorage.getItem(key));
    if (value?.draft) {
      // Migrate the last completed result even if its temporary input draft has expired.
      const clean = rememberCompleted(withoutLegacyPhoto(value));
      if (Date.now() - value.updated >= maxAge) { clearSession(); return null; }
      if (clean!==value) {
        clearSession();
        sessionStorage.setItem(key,JSON.stringify(clean));
      }
      return clean;
    }
    clearSession();
  } catch {}
  return null;
}

export function writeSession(value) {
  sessionStorage.setItem(key, JSON.stringify({...withoutLegacyPhoto(value), updated: Date.now()}));
}
