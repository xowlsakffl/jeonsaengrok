import test from 'node:test';
import assert from 'node:assert/strict';
import { api } from '../worker/api.mjs';
import { localD1 } from './local-d1.mjs';
import { describeProfile } from '../web/profile.js';
import { generateReading } from '../web/reading.js';
import { drawContext } from '../web/history.js';
import { describePersonality, traitGroups } from '../web/traits.js';

const base = {
  birth:'1997-06-15', season:'여름', surname:'김', clan:'김해',
  personality:'제 차례를 기다리지만 친구 부탁을 거절하기는 어렵습니다.',
  job:'개발자', wealthLabel:'2억 원 ~ 5억 원 미만', familyLabel:'대체로 평범했어요',
  face:{observations:['코','턱','눈 사이','눈썹'].map(reading=>({reading}))},
};
const generated = {
  title:'갈림길에서', role:'짐꾼', summary:'누구의 짐을 먼저 나를지 정하는 날입니다.',
  opening:'당신은 짐을 나를 차례를 기다렸습니다.', deed:'당신은 기다리던 이에게 자기 차례를 내주었습니다.',
  choiceMade:'뒤에 선 이에게 차례를 내준다', choiceOther:'내 짐부터 배에 싣는다',
  habitCue:'친구 부탁을 거절하기는 어렵습니다.',
  middle:'그는 해가 지기 전에 집에 닿았습니다.', ending:'그다음 날에는 그가 당신의 짐을 받아 들었습니다.',
  crossroads:'뱃사공이 빈자리 하나를 가리켰습니다.', consequence:'배가 떠난 뒤 당신의 짐은 강가에 남았습니다.',
  later:'이제는 두 사람이 번갈아 먼저 배에 올랐습니다.', keepsake:'닳은 짐끈',
  keepsakeStory:'짐끈을 건네받은 동무가 자기 짐에 둘렀습니다.', otherOutcome:'먼저 탔다면 동무는 강가에서 하룻밤을 더 보냈을 겁니다.',
  presentFortune:'개발자로 일하는 지금, 급한 날이면 먼저 자리를 비워 주는 동료가 곁에 있습니다.',
  faceIndex:0, focusFace:'그 짐이 오가던 날입니다.', focusHabit:'누구 차례인지 따져 보았습니다.', focusBirth:'',
};

function makeRequest(profile) {
  const {era,place,work,detail,history}=drawContext(profile.birth,()=>0.25);
  const candidates=[{era,place,work,detail,history}];
  return new Request('https://site.test/api/reading',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({...describeProfile(profile),candidates}),
  });
}
async function run(profile, story=generated) {
  let input, schema;
  const db=localD1();
  const response=await api(makeRequest(profile),{OPENAI_API_KEY:'test',DB:db},async (_url,options)=>{
    const payload=JSON.parse(options.body);
    input=JSON.parse(payload.input);
    schema=payload.text.format.schema;
    return Response.json({output:[{content:[{type:'output_text',text:JSON.stringify(story)}]}]});
  });
  db.close();
  assert.equal(response.status,200);
  const {reading}=await response.json();
  return {input,reading,schema};
}

test('the job and both disclosed bands reach the model together, independently of the historical setting', async ()=>{
  const {input,reading}=await run(base);
  const changed=await run({...base,job:'택배 기사',wealthLabel:'빚이 더 많음',familyLabel:'매우 넉넉했어요'});
  assert.deepEqual(input.presentLife,{job:base.job,wealth:base.wealthLabel,family:base.familyLabel});
  assert.deepEqual(changed.input.setting,input.setting);
  assert.equal(input.setting.history,drawContext(base.birth,()=>0.25).history);
  assert.deepEqual(changed.input.presentLife,{job:'택배 기사',wealth:'빚이 더 많음',family:'매우 넉넉했어요'});
  const [fortune]=reading.clues.filter(clue=>clue.label==='전생에 쌓은 복');
  assert.ok(fortune.detail.includes(generated.deed));
  assert.deepEqual(reading.paragraphs,[
    generated.opening+'\n\n'+generated.crossroads,
    generated.deed+' '+generated.middle+'\n\n'+generated.consequence,
    generated.ending+'\n\n'+generated.later,
  ]);
  assert.equal(reading.keepsakeStory,generated.keepsakeStory);
  assert.equal(reading.otherOutcome,generated.otherOutcome);
  assert.equal(reading.choiceMade,generated.choiceMade);
  assert.equal(reading.choiceOther,generated.choiceOther);
  assert.equal(reading.fortune,fortune.detail);
  assert.equal(reading.habitCue,generated.habitCue);
});

test('the fortune uses the deed from the main scene even when the other ending would be more generous',async ()=>{
  const story={...generated,
    choiceMade:'터진 자루를 꿰매요', deed:'당신은 볍씨를 옮겨 담고 터진 자루를 꿰맵니다.',
    choiceOther:'볍씨를 나눠 줘요', otherOutcome:'당신은 볍씨 한 됫박을 퍼서 건넵니다.',
    presentFortune:'개발자로 일하는 지금, 빈틈을 먼저 발견하면 함께 손볼 시간을 내 주는 동료가 곁에 있습니다.'};
  const {reading,schema}=await run(base,story);
  assert.ok(reading.paragraphs[1].startsWith(story.deed));
  assert.equal(reading.fortune,'“'+story.deed+'” '+story.presentFortune);
  assert.equal(reading.clues.find(clue=>clue.label==='전생에 쌓은 복').detail,reading.fortune);
  const order=Object.keys(schema.properties);
  assert.ok(order.indexOf('ending')<order.indexOf('presentFortune'));
  for(const field of ['choiceOther','otherOutcome'])assert.ok(order.indexOf('presentFortune')<order.indexOf(field));
  const changed=await run(base,{...story,choiceOther:'일을 쉬어요',otherOutcome:'당신은 일을 덮어 두고 쉽니다.'});
  assert.equal(changed.reading.fortune,reading.fortune);
});

test('the full card survives truncation in optional annotations, while incomplete scenes and refusals do not',async t=>{
  const {habitCue,focusBirth,...required}=generated;
  const complete=JSON.stringify(required).slice(0,-1);
  const cases=[
    [complete+',"habitCue":"도중에', 'max_output_tokens',200],
    [complete+',"habitCue":'+JSON.stringify(habitCue)+',"focusBirth":"계절', 'max_output_tokens',200],
    ['{"title":"끝난 제목","opening":"미완성 본문', 'max_output_tokens',502],
    [complete+',"habitCue":"도중에','content_filter',422],
  ];
  for(const [text,reason,status] of cases){
    const db=localD1();t.after(()=>db.close());
    const response=await api(makeRequest(base),{DB:db,OPENAI_API_KEY:'test'},async()=>Response.json({
      status:'incomplete',incomplete_details:{reason},output:[{content:[{type:'output_text',text}]}],
    }));
    assert.equal(response.status,status);
    if(status===200){
      const {reading}=await response.json();
      assert.equal(reading.otherOutcome,generated.otherOutcome);
      assert.ok(reading.paragraphs[2].endsWith(generated.later));
    }
  }
});

test('only transient provider errors invite an automatic retry, including short Retry-After hints',async t=>{
  const cases=[
    [429,'rate_limit_exceeded','2',429,'provider_rate_limit',2000],
    [429,'rate_limit_exceeded','60',429,'provider_rate_limit',null],
    [429,'insufficient_quota',null,429,'provider_quota',null],
    [403,'permission_denied',null,502,'provider_http_403',null],
    [503,'unavailable',null,502,'provider_http_503',1200],
  ];
  for(const [upstream,code,after,status,reason,delay] of cases){
    const db=localD1();t.after(()=>db.close());
    const response=await api(makeRequest(base),{DB:db,OPENAI_API_KEY:'test'},async()=>Response.json(
      {error:{code}},{status:upstream,headers:after?{'retry-after':after}:{}}
    ));
    assert.equal(response.status,status);
    const body=await response.json();
    assert.equal(body.reason,reason);
    assert.equal(body.autoRetryAfterMs,delay);
  }
});

test('the loading flow recovers with the same input while each upstream attempt consumes one site slot',async t=>{
  const db=localD1();t.after(()=>db.close());
  const ids=[],inputs=[];
  t.mock.method(globalThis,'fetch',async(_url,options)=>{
    ids.push(options.headers['X-Reading-Id']);
    return api(new Request('https://site.test/api/reading',options),{DB:db,OPENAI_API_KEY:'test'},async(_provider,opts)=>{
      inputs.push(JSON.parse(opts.body).input);
      return inputs.length===1 ? Response.json({error:{}},{status:503,headers:{'retry-after':'0'}})
        : Response.json({output:[{content:[{type:'output_text',text:JSON.stringify(generated)}]}]});
    });
  });
  const reading=await generateReading(base,drawContext(base.birth,()=>0.25),new AbortController().signal,crypto.randomUUID());
  assert.equal(reading.title,generated.title);
  assert.equal(inputs.length,2);
  assert.equal(inputs[0],inputs[1]);
  assert.notEqual(ids[0],ids[1]);
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM reading_attempts').first()).n,2);
});

test('lost browser responses reuse the same ID and recovery stops after a single replay',async t=>{
  const ids=[];
  t.mock.method(globalThis,'fetch',async(_url,options)=>{
    ids.push(options.headers['X-Reading-Id']);
    throw new TypeError('network interrupted');
  });
  const id=crypto.randomUUID();
  await assert.rejects(generateReading(base,drawContext(base.birth),new AbortController().signal,id));
  assert.deepEqual(ids,[id,id]);
});

test('leaving the loading page cancels a pending recovery',async t=>{
  const controller=new AbortController();let calls=0;
  t.mock.method(globalThis,'fetch',async()=>{
    calls++;
    return Response.json({error:'다시 연결',autoRetryAfterMs:1000},{status:503});
  });
  await assert.rejects(generateReading(base,drawContext(base.birth),controller.signal,crypto.randomUUID(),{
    onRecovery:()=>controller.abort(),
  }),{name:'AbortError'});
  assert.equal(calls,1);
});

test('interrupted outputs, invalid JSON, and timeouts are reported separately',async t=>{
  const cases=[
    [()=>Response.json({status:'incomplete',incomplete_details:{reason:'max_output_tokens'},output:[{content:[{type:'output_text',text:'{"title":'}]}]}),'output_limit',502],
    [()=>Response.json({output:[{content:[{type:'output_text',text:'{"title":'}]}]}),'invalid_response',502],
    [()=>{throw new DOMException('deadline','TimeoutError')},'timeout',504],
    [()=>{throw new TypeError('disconnected')},'connection_lost',503],
  ];
  for(const [provider,reason,status] of cases){
    const db=localD1();t.after(()=>db.close());
    const response=await api(makeRequest(base),{DB:db,OPENAI_API_KEY:'test'},provider);
    assert.equal(response.status,status);
    assert.equal((await response.json()).reason,reason);
  }
});

test('one extra attempt follows an upstream failure while duplicate and daily limits hold',async t=>{
  const db=localD1();t.after(()=>db.close());
  const env={DB:db,OPENAI_API_KEY:'test'};
  const send=(id,provider)=>{
    const req=makeRequest(base);
    req.headers.set('X-Reading-Id',id);
    return api(req,env,provider);
  };
  const fail=()=>{throw new TypeError('connection closed')};
  const success=()=>Response.json({output:[{content:[{type:'output_text',text:JSON.stringify(generated)}]}]});
  const id=crypto.randomUUID();
  assert.equal((await send(id,fail)).status,503);
  assert.equal((await send(id,success)).status,409);
  assert.equal((await send(crypto.randomUUID(),fail)).status,503);
  assert.equal((await send(crypto.randomUUID(),success)).status,200);
  assert.equal((await send(crypto.randomUUID(),success)).status,429);
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM reading_attempts').first()).n,3);
});

test('equal-sized draw intervals reach every eligible period and all thirty settings, including the Paleolithic', ()=>{
  const visited=new Set(), counts=new Map();
  for (let i=0; i<100; i++) {
    for (let j=0; j<10; j++) {
      const sample=[(i+0.5)/100,(j+0.5)/10];
      const {place,period}=drawContext('2024-01-01',()=>sample.shift());
      visited.add(place);
      counts.set(period,(counts.get(period)||0)+1);
    }
  }
  assert.equal(visited.size,30);
  assert.deepEqual([...counts.values()],[200,200,200,200,200]);
  assert.match(drawContext(base.birth,()=>0).era,/구석기/);
  assert.match(drawContext('1900-01-01',()=>0.999).era,/1898/);
  assert.match(drawContext('1996-03-01',()=>0.999).era,/1983/);
  assert.match(drawContext('2024-03-01',()=>0.999).era,/2023/);
});

test('changing personality reaches the writer while the same independent draw keeps its setting', async ()=>{
  const a=await run(base);
  const personality='내 잘못을 말하기 전에 친구 밥값부터 냅니다.';
  const b=await run({...base,personality});
  assert.deepEqual(a.input.setting,b.input.setting);
  assert.equal(b.input.personality,personality);
  assert.equal(b.reading.habitCue,'');
});

test('private financial fields are omitted and unemployed is a valid occupation', async ()=>{
  const partial=await run({...base,wealthLabel:'밝히지 않을래요',familyLabel:''});
  assert.deepEqual(partial.input.presentLife,{job:'개발자'});
  const hidden=await run({...base,job:' 무직 ',wealthLabel:'',familyLabel:'비공개'});
  assert.deepEqual(hidden.input.presentLife,{job:'무직'});
  assert.ok(hidden.reading.clues.some(clue=>clue.label==='전생에 쌓은 복'));
});

test('missing, empty and whitespace-only occupations cannot start generation', async ()=>{
  let calls=0;
  for(const job of [undefined,'','   ','　']){
    const response=await api(makeRequest({...base,job}),{OPENAI_API_KEY:'test'},async()=>{calls++;});
    assert.equal(response.status,422);
    assert.match((await response.json()).error,/직업/);
  }
  assert.equal(calls,0);
});

test('all behavior badges and a full free-text note reach the model together with the job', async ()=>{
  const traits = traitGroups.flatMap(group => group.traits);
  const labels = traits.map(([label]) => label);
  assert.equal(new Set(labels).size,labels.length);
  const note = '가'.repeat(260);
  const personality = describePersonality(note,labels);
  const {input} = await run({...base,personality});
  assert.equal(input.personality,[note,...traits.map(([,sentence])=>sentence)].join(' '));
  assert.equal(input.presentLife.job,base.job);
});

test('a note containing a badge sentence stays intact when the badge is selected or removed', ()=>{
  const [label,sentence] = traitGroups[0].traits[0];
  const note = '저는 '+sentence+' 가끔은 혼자 있고 싶어요.';
  assert.equal(describePersonality(note,[label]),note);
  assert.equal(describePersonality(note,[]),note);
});

test('legacy badge choices keep their meaning and aliases do not duplicate the description', ()=>{
  assert.equal(describePersonality('직접 쓴 말',['마감 몰아치기','마감 직전에 몰아서 해요']), '직접 쓴 말 시간이 넉넉할 땐 미루다가 마감이 닥쳐야 집중해요.');
  const aliases = traitGroups.flatMap(group=>group.traits.flatMap(([, , ...aliases])=>aliases));
  assert.equal(new Set(aliases).size,40);
  assert.equal(aliases.length,40);
});

test('a declined input lets the reader return to the form', async ()=>{
  const failures=[
    Response.json({error:{code:'invalid_prompt'}},{status:400}),
    Response.json({output:[{content:[{type:'refusal',refusal:'declined'}]}]}),
  ];
  for(const failure of failures){
    const db=localD1();
    const response=await api(makeRequest(base),{OPENAI_API_KEY:'test',DB:db},async ()=>failure);
    db.close();
    assert.equal(response.status,422);
    assert.match((await response.json()).error,/입력으로 돌아가/);
  }
});

test('missing quota storage blocks a valid request before any provider call',async()=>{
  let calls=0;
  const res=await api(makeRequest(base),{OPENAI_API_KEY:'test'},async()=>{calls++});
  assert.equal(res.status,503);
  assert.equal((await res.json()).code,'quota_unavailable');
  assert.equal(calls,0);
});
