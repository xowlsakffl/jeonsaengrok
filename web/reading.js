import { describeProfile } from './profile.js';

async function fetchReading(profile,context,signal,requestId) {
  const {era,place,roles,work,detail,history} = context;
  const candidates=[{era,place,roles,work,detail,history}];
  let response;
  try {
    response=await fetch('./api/reading',{
      method:'POST',headers:{'Content-Type':'application/json','X-Reading-Id':requestId},
      body:JSON.stringify({...describeProfile(profile),candidates}),signal
    });
  } catch(error) {
    if(signal.aborted)throw error;
    const disconnected=new Error('서버에 연결되지 않았어요. 인터넷 연결을 확인하고 다시 시도해주세요.');
    disconnected.autoRetryAfterMs=1000;
    throw disconnected;
  }
  const data=await response.json().catch(()=>null);
  if(!response.ok||!data?.reading){
    const error=new Error(data?.error||'서버 AI가 응답하지 않았습니다. 잠시 후 다시 시도해주세요.');
    error.reviewInput=response.status===422;
    error.receivedResponse=typeof data?.error==='string';
    error.autoRetryAfterMs=data?.autoRetryAfterMs;
    if(!data && [502,503,504].includes(response.status))error.autoRetryAfterMs=1000;
    error.quotaCode=data?.code;
    throw error;
  }
  const reading=data.reading;
  const clues=[{label:'시대 선택',detail:context.selectionNote},...reading.clues];
  return {...reading,clues,era,place,history,period:context.period,sources:context.sources,reverseChoices:Math.random()<0.5,engine:'서버 AI'};
}

function waitToRetry(ms,signal) {
  return new Promise((resolve,reject)=>{
    signal.throwIfAborted();
    const timer=setTimeout(()=>{
      signal.removeEventListener('abort',cancel);
      resolve();
    },ms);
    function cancel(){clearTimeout(timer);reject(signal.reason);}
    signal.addEventListener('abort',cancel,{once:true});
  });
}

export async function generateReading(profile,context,signal,requestId,{onRecovery,allowRecovery=true}={}) {
  const id=requestId || crypto.randomUUID();
  try {
    return await fetchReading(profile,context,signal,id);
  } catch(error) {
    const delay=error.autoRetryAfterMs;
    if(signal.aborted || !allowRecovery || !Number.isFinite(delay) || delay<0 || delay>10000)throw error;
    // A lost browser response can hide a successful request. Replay only its existing ID.
    const nextId=error.receivedResponse ? crypto.randomUUID() : id;
    onRecovery?.(nextId);
    await waitToRetry(delay,signal);
    signal.throwIfAborted();
    return fetchReading(profile,context,signal,nextId);
  }
}

