import { generateReading } from './reading.js';
import { drawContext } from './history.js';
import { readSession, writeSession, readingVersion } from './reading-session.js';
import { rememberCompleted } from './saved-readings.js';

const formUrl = './#reading';
const resultUrl = './result.html';
const retry = document.getElementById('retryWriting');
const wait = document.getElementById('writingWait');
const ink = document.getElementById('writingInk');
const elapsed = document.getElementById('writingElapsed');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const title = document.getElementById('writingTitle');
const status = document.getElementById('writingStatus');
let active;
let startedAt;
let tick;

function updateWait() {
  clearTimeout(tick);
  if (startedAt === undefined || document.hidden) return;
  const ms = Math.max(0, Date.now() - startedAt);
  const seconds = Math.floor(ms / 1000);
  const label = seconds < 60 ? seconds+'초' : Math.floor(seconds/60)+'분 '+seconds%60+'초';
  elapsed.textContent = '대기 '+label;
  // Reflect time spent waiting, including time while a mobile tab was suspended.
  const phase = reducedMotion.matches ? Math.floor(ms/2000)%6 : (ms%4000)/2000*3;
  const position = phase <= 3 ? phase : 6-phase;
  ink.style.transform = 'translateX('+position*100+'%)';
  tick = setTimeout(updateWait, reducedMotion.matches ? 1000-ms%1000 : 250);
}

function stopWait() {
  clearTimeout(tick);
  startedAt = undefined;
  wait.hidden = true;
}
document.addEventListener('visibilitychange', updateWait);

function showRetry(message, reviewInput = false, quotaCode = '') {
  title.textContent = reviewInput ? '입력을 다시 살펴봐 주세요' : '전생록을 잠시 덮었습니다';
  status.textContent = message;
  stopWait();
  retry.hidden = reviewInput || ['duplicate','daily_limit','quota_unavailable'].includes(quotaCode);
  document.getElementById('freeRecords').hidden = !quotaCode;
  (quotaCode ? document.getElementById('freeRecords') : reviewInput ? document.getElementById('stopWriting') : retry).focus();
}

async function start(session) {
  if (session.version !== readingVersion || !session.profile.job?.trim()) { location.replace(formUrl); return; }
  if (active) return;
  const controller = new AbortController();
  active = controller;
  try {
    const context = session.context ?? drawContext(session.profile.birth);
    session = {...session, context, requestId:session.requestId || crypto.randomUUID()};
    writeSession({...session, stage: 'running'});
    title.textContent = '전생록을 펼치는 중';
    status.textContent = '당신이 살았을 시대와 그날의 사연을 쓰고 있습니다.';
    startedAt = Date.now();
    wait.hidden = false;
    updateWait();
    retry.hidden = true;
    title.focus({preventScroll:true});
    const reading = await generateReading(session.profile, context, controller.signal,session.requestId,{
      allowRecovery:!session.autoRetried,
      onRecovery(requestId){
        status.textContent='응답이 중간에 멈춰 같은 입력으로 한 번 더 연결하고 있어요.';
        session={...session,requestId,autoRetried:true};
        writeSession({...session,stage:'running'});
      },
    });
    if (controller.signal.aborted) return;
    writeSession(rememberCompleted({...session, stage: 'done', reading, updated:Date.now()}));
    stopWait();
    location.replace(resultUrl);
  } catch (error) {
    if (controller.signal.aborted) return;
    const message = error.message || '전생 이야기를 마치지 못했습니다. 다시 시도해주세요.';
    if (error.reviewInput || error.quotaCode) writeSession({...session,stage:'review',message,quotaCode:error.quotaCode});
    else writeSession({...session,stage:'retry',message,requestId:error.receivedResponse ? null : session.requestId});
    showRetry(message, error.reviewInput,error.quotaCode);
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
  if (session.stage === 'review') { showRetry(session.message,!session.quotaCode,session.quotaCode); return; }
  showRetry(session.stage==='retry' && session.message || '이전 풀이가 중단됐습니다. 같은 입력으로 다시 펼칠 수 있어요.');
}

retry.addEventListener('click', () => {
  const session = readSession();
  if (session?.profile) start(session);
  else location.replace(formUrl);
});
document.getElementById('stopWriting').addEventListener('click', () => {
  active?.abort();
  stopWait();
  location.replace(formUrl);
});
window.addEventListener('pagehide', () => {
  active?.abort();
  active = null;
  stopWait();
});
window.addEventListener('pageshow', event => { if (event.persisted) enter(); });
enter();
