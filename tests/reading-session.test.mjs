import test from 'node:test';
import assert from 'node:assert/strict';
import {readSession, writeSession} from '../web/reading-session.js';

test('opening a legacy draft removes the stored thumbnail and keeps the reading usable', t=>{
  const data=new Map();
  const previous=Object.getOwnPropertyDescriptor(globalThis,'sessionStorage');
  Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:{
    getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)
  }});
  t.after(()=>{
    if (previous) Object.defineProperty(globalThis,'sessionStorage',previous);
    else delete globalThis.sessionStorage;
  });
  const key='jeonsaeng.reading-session.v1';
  const observations=[{name:'코',reading:'약 30%입니다.'}];
  const face={marks:{},observations:[{...observations[0],mark:{x:0.2,y:0.3}}]};
  const legacy={updated:Date.now(),stage:'done',reading:{title:'기록'},profile:{face},
    draft:{values:{traits:['밥값 먼저 내기']},step:2,features:face,preview:'data:image/jpeg;base64,example',photoName:'private.jpg'}};
  data.set(key,JSON.stringify(legacy));
  const restored=readSession();
  assert.deepEqual(restored.profile.face,{observations});
  assert.deepEqual(restored.draft,{values:legacy.draft.values,step:2,features:{observations}});
  assert.deepEqual(restored.reading,legacy.reading);
  assert.equal(restored.updated,legacy.updated);
  assert.deepEqual(JSON.parse(data.get(key)),restored);
  writeSession(legacy);
  assert.deepEqual(JSON.parse(data.get(key)).draft,restored.draft);
});
