import { describeProfile } from './profile.js';

export async function generateReading(profile,context,signal) {
  const {era,place,work,detail,history} = context;
  const candidates=[{era,place,work,detail,history}];
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
  const clues=[{label:'시대 선택',detail:context.selectionNote},...reading.clues];
  return {...reading,clues,era,place,history,period:context.period,sources:context.sources,reverseChoices:Math.random()<0.5,engine:'서버 AI'};
}

