import { generateReading } from './reading.js';
import { drawContext } from './history.js';
import { readSession, writeSession, readingVersion } from './reading-session.js';

const formUrl = './#reading';
const resultUrl = './result.html';
const retry = document.getElementById('retryWriting');
const track = document.querySelector('.ink-track');
const title = document.getElementById('writingTitle');
const status = document.getElementById('writingStatus');
let active;

function showRetry(message, reviewInput = false) {
  title.textContent = reviewInput ? '입력을 다시 살펴봐 주세요' : '전생록을 잠시 덮었습니다';
  status.textContent = message;
  track.hidden = true;
  retry.hidden = reviewInput;
  (reviewInput ? document.getElementById('stopWriting') : retry).focus();
}

async function start(session) {
  if (session.version !== readingVersion || !session.profile.job?.trim()) { location.replace(formUrl); return; }
  if (active) return;
  const controller = new AbortController();
  active = controller;
  try {
    const context = session.context ?? drawContext(session.profile.birth);
    session = {...session, context};
    writeSession({...session, stage: 'running'});
    title.textContent = '전생록을 펼치는 중';
    status.textContent = '당신이 살았을 시대와 그날의 사연을 쓰고 있습니다.';
    track.hidden = false;
    retry.hidden = true;
    title.focus({preventScroll:true});
    const reading = await generateReading(session.profile, context, controller.signal);
    if (controller.signal.aborted) return;
    writeSession({...session, stage: 'done', reading});
    location.replace(resultUrl);
  } catch (error) {
    if (controller.signal.aborted) return;
    const message = error.message || '전생 이야기를 마치지 못했습니다. 다시 시도해주세요.';
    if (error.reviewInput) writeSession({...session,stage:'review',message});
    showRetry(message, error.reviewInput);
  } finally {
    if (active === controller) active = null;
  }
}

function enter() {
  const session = readSession();
  if (!session?.profile) { location.replace(formUrl); return; }
  if (session.stage === 'done' && session.reading) { location.replace(resultUrl); return; }
  if (session.version !== readingVersion || !session.profile.job?.trim()) { location.replace(formUrl); return; }
  if (session.stage === 'ready') { start(session); return; }
  if (session.stage === 'review') { showRetry(session.message,true); return; }
  showRetry('이전 풀이가 중단됐습니다. 같은 입력으로 다시 펼칠 수 있어요.');
}

retry.addEventListener('click', () => {
  const session = readSession();
  if (session?.profile) start(session);
  else location.replace(formUrl);
});
document.getElementById('stopWriting').addEventListener('click', () => {
  active?.abort();
  location.replace(formUrl);
});
window.addEventListener('pagehide', () => {
  active?.abort();
  active = null;
});
window.addEventListener('pageshow', event => { if (event.persisted) enter(); });
enter();
