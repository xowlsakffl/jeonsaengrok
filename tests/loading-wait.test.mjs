import test from 'node:test';
import assert from 'node:assert/strict';

test('a reduced-motion mobile wait catches up after suspension and cleans up on leaving',async t=>{
  const events = new EventTarget(), win = new EventTarget();
  const elements = new Map();
  events.getElementById = id => {
    if (!elements.has(id)) elements.set(id,Object.assign(new EventTarget(),{style:{},focus(){}}));
    return elements.get(id);
  };
  win.matchMedia=()=>({matches:true});
  const ready={stage:'ready',version:2,updated:10000,profile:{job:'예시',face:{observations:[]}},context:{},draft:{values:{}}};
  let stored=JSON.stringify(ready), target, requests=0, time=10000, next=0;
  const timers=new Map();
  const globals={document:events,window:win,location:{replace:url=>{target=url;}},
    sessionStorage:{getItem:()=>stored,setItem:(_,v)=>{stored=v;},removeItem:()=>{stored=null;}},
    fetch:(_,init)=>{requests++;return new Promise((_,reject)=>init.signal.addEventListener('abort',()=>reject(init.signal.reason)));},
    setTimeout:callback=>{timers.set(++next,callback);return next;},clearTimeout:id=>timers.delete(id)};
  for(const [key,value] of Object.entries(globals)){
    const previous=Object.getOwnPropertyDescriptor(globalThis,key);
    Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});
    t.after(()=>previous?Object.defineProperty(globalThis,key,previous):delete globalThis[key]);
  }
  t.mock.method(Date,'now',()=>time);
  await import('../web/loading.js');
  const label=elements.get('writingElapsed'), ink=elements.get('writingInk');
  assert.equal(label.textContent,'대기 0초');
  const initial=ink.style.transform;
  time+=2000;[...timers.values()][0]();
  assert.notEqual(ink.style.transform,initial);
  events.hidden=true;events.dispatchEvent(new Event('visibilitychange'));
  assert.equal(timers.size,0);
  time+=64000;
  events.hidden=false;events.dispatchEvent(new Event('visibilitychange'));
  assert.equal(label.textContent,'대기 1분 6초');
  assert.equal(timers.size,1);
  assert.equal(requests,1);
  elements.get('stopWriting').dispatchEvent(new Event('click'));
  assert.equal(target,'./#reading');
  assert.equal(elements.get('writingWait').hidden,true);
  assert.equal(timers.size,0);
});
