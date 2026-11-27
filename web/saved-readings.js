import { readingSnapshot } from './result-export.js';

const prefix = 'jeonsaeng.saved.v1.';
const validId = id => typeof id === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(id);

export function savedReading(id) {
  if (!validId(id)) return null;
  try {
    const record = JSON.parse(localStorage.getItem(prefix + id));
    if (record?.id !== id || !Number.isFinite(record.created) || !record.reading?.title || !Array.isArray(record.reading.paragraphs)) return null;
    return record;
  } catch { return null; }
}

export function rememberCompleted(session) {
  if (session?.stage !== 'done' || !session.reading?.title || session.savedId) return session;
  try {
    const id = validId(session.requestId) ? session.requestId : crypto.randomUUID();
    if (!savedReading(id)) {
      const snapshot = readingSnapshot(session.reading, session.scenePick, session.profile?.face?.observations);
      const created = Number.isFinite(session.updated) ? session.updated : Date.now();
      localStorage.setItem(prefix + id, JSON.stringify({id, created, ...snapshot}));
    }
    return {...session, savedId:id};
  } catch { return session; }
}

export function saveReadingPick(id, pick) {
  const record = savedReading(id);
  if (!record || !['choiceMade','choiceOther','skip'].includes(pick)) return;
  try { localStorage.setItem(prefix + id, JSON.stringify({...record,pick})); } catch {}
}

export function listSavedReadings() {
  const records = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(prefix)) continue;
    const record = savedReading(key.slice(prefix.length));
    if (record) records.push(record);
  }
  return records.sort((a,b) => b.created - a.created);
}

export function removeSavedReading(id) {
  if (validId(id)) localStorage.removeItem(prefix + id);
}
