import { candidateContexts } from './history.js';
import { describeProfile } from './profile.js';

export async function generateReading(profile,signal) {
  const choices=candidateContexts(profile);
  const candidates=choices.map(({era,place,work,detail})=>({era,place,work,detail}));
  let response;
  try {
    response=await fetch('./api/reading',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({...describeProfile(profile),candidates}),signal
    });
  } catch(error) {
    if(signal.aborted)throw error;
    throw new Error('서버에 연결되지 않았어요. 인터넷 연결을 확인하고 다시 시도해주세요.');
  }
  const data=await response.json().catch(()=>null);
  if(!response.ok||!data?.reading){
    const error=new Error(data?.error||'서버 AI가 응답하지 않았습니다. 잠시 후 다시 시도해주세요.');
    error.reviewInput=response.status===422;
    throw error;
  }
  const reading=data.reading;
  const context=choices[reading.background];
  if(!context)throw new Error('AI가 기록의 시대를 마치지 못했어요. 다시 시도해주세요.');
  return {...reading,era:context.era,place:context.place,history:context.history,sources:context.sources,engine:'서버 AI'};
}

