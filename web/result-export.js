const quizFields={title:80,role:64,era:120,place:160,summary:240,period:16,choiceMade:80,choiceOther:80};

export function quizCard(reading) {
  return Object.fromEntries(Object.entries(quizFields).map(([key,max])=>[
    key,typeof reading[key]==='string' ? reading[key].trim().slice(0,max) : '',
  ]));
}

export function readQuiz(hash) {
  if(typeof hash!=='string' || hash.length>5000 || !/^#v1\.[a-zA-Z0-9_-]+$/.test(hash))return null;
  try{
    const raw=atob(hash.slice(4).replaceAll('-','+').replaceAll('_','/'));
    const card=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(raw,c=>c.charCodeAt(0))));
    if(!card || Object.entries(quizFields).some(([key,max])=>typeof card[key]!=='string' || card[key].length>max))return null;
    if(!card.title.trim() || !card.role.trim())return null;
    return quizCard(card);
  }catch{return null;}
}

export function hasChoices(card) {
  return Boolean(card.choiceMade && card.choiceOther && card.choiceMade!==card.choiceOther);
}

export function storySections(reading) {
  const [opening,action,...ending]=reading.paragraphs || [];
  const options=reading.reverseChoices ? [reading.choiceOther,reading.choiceMade] : [reading.choiceMade,reading.choiceOther];
  return [
    ['이야기의 시작',opening],
    ['그날의 갈림길',hasChoices(reading)?options.map(x=>'· '+x).join('\n'):''],
    ['전생의 내가 한 선택',[reading.choiceMade,action].filter(Boolean).join('\n\n')],
    ['그날 이후',ending.join('\n\n')],
    ['당신이 남긴 물건'+(reading.keepsake?' · '+reading.keepsake:''),reading.keepsakeStory],
    ['다른 선택을 했다면?',[reading.choiceOther,reading.otherOutcome].filter(Boolean).join('\n\n')],
  ].filter(([,value])=>value);
}

export function recordSections(reading, {pick, observations = [], references = []} = {}) {
  const sections = storySections(reading).map(([heading, body]) => ({heading, body}));
  const fork = sections.findIndex(section => section.heading === '그날의 갈림길');
  if (fork >= 0 && ['choiceMade', 'choiceOther'].includes(pick)) {
    const comparison = pick === 'choiceMade' ? '전생의 당신도 같은 선택을 했습니다.' : '전생의 당신은 다른 쪽을 택했습니다.';
    sections.splice(fork + 1, 0, {heading: '지금의 내가 고른 선택', body: reading[pick] + '\n' + comparison});
  }
  const clues = reading.clues || [];
  const fortune = reading.fortune || clues.find(clue => clue.label === '전생에 쌓은 복')?.detail;
  sections.push({heading: '내 성격에서 온 단서', body: reading.habitCue}, {heading: '이번 생에 돌아온 복', body: fortune});
  for (const clue of clues) {
    if (clue.label !== '전생에 쌓은 복') sections.push({heading: clue.label, body: clue.detail});
  }
  if (observations.length) {
    sections.push({heading: '부위별 얼굴 측정값', body: observations.map(o => [o.name, o.reading].filter(Boolean).join(' · ')).join('\n')});
  }
  sections.push({heading: '기록과 창작 사이', body: reading.history, sources: reading.sources}, ...references);
  return sections.filter(section => section.body || section.sources?.length);
}

const readingFields = ['title', 'role', 'era', 'place', 'period', 'summary', 'choiceMade', 'choiceOther',
  'keepsake', 'keepsakeStory', 'otherOutcome', 'habitCue', 'fortune', 'history', 'engine'];
const string = value => typeof value === 'string' ? value : '';
function namedPairs(values, first, second) {
  return Array.isArray(values) ? values.filter(Boolean).map(value => ({[first]: string(value[first]), [second]: string(value[second])})) : [];
}
export function readingSnapshot(reading, pick, observations) {
  const fields = Object.fromEntries(readingFields.map(key => [key, string(reading[key])]));
  return {reading: {...fields, reverseChoices: reading.reverseChoices === true, faceIndex: Number.isInteger(reading.faceIndex) ? reading.faceIndex : 0,
    paragraphs: Array.isArray(reading.paragraphs) ? reading.paragraphs.filter(p => typeof p === 'string') : [],
    clues: namedPairs(reading.clues,'label','detail'),
    sources: namedPairs(reading.sources,'label','url').filter(s => /^https:\/\//i.test(s.url))},
    pick: ['choiceMade','choiceOther'].includes(pick) ? pick : 'skip', observations: namedPairs(observations,'name','reading').slice(0,4)};
}

const maxBytes = 96000;
export async function fullRecordLink(reading, pick, observations, isExample = false) {
  const base = 'https://jeonsaengrok.com/result.html#';
  if (isExample) return base + 'read-example' + (['choiceMade','choiceOther'].includes(pick) ? '-' + pick : '');
  const snapshot = readingSnapshot(reading, pick, observations);
  const bytes = new TextEncoder().encode(JSON.stringify(snapshot));
  if (bytes.length > maxBytes) throw new Error('Record too large');
  const zip = typeof CompressionStream === 'function';
  const data = zip ? new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer()) : bytes;
  const encoded = btoa(Array.from(data, c => String.fromCharCode(c)).join('')).replaceAll('+','-').replaceAll('/','_').replace(/=+$/, '');
  return base + (zip ? 'record.z.' : 'record.u.') + encoded;
}

export async function readFullRecord(hash) {
  if (hash.length > maxBytes * 1.4 || !/^#record\.[zu]\.[A-Za-z0-9_-]+$/.test(hash)) return null;
  try {
    const raw = atob(hash.slice(10).replaceAll('-','+').replaceAll('_','/'));
    const data = Uint8Array.from(raw, c => c.charCodeAt(0));
    let stream = new Blob([data]).stream();
    if (hash.startsWith('#record.z.')) stream = stream.pipeThrough(new DecompressionStream('deflate'));
    const reader = stream.getReader(), chunks = [];
    let length = 0;
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      length += value.length;
      if (length > maxBytes) { await reader.cancel(); return null; }
      chunks.push(value);
    }
    const value = await new Response(new Blob(chunks)).json();
    if (!value?.reading?.title || !value.reading.role || !Array.isArray(value.reading.paragraphs) || !value.reading.paragraphs.length) return null;
    return readingSnapshot(value.reading, value.pick, value.observations);
  } catch { return null; }
}
