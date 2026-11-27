import test from 'node:test';
import assert from 'node:assert/strict';
import {example} from '../web/sample.js';
import {readSession, writeSession, clearSession} from '../web/reading-session.js';
import {rememberCompleted, savedReading, listSavedReadings, saveReadingPick, removeSavedReading} from '../web/saved-readings.js';

function storage() {
  const rows = new Map();
  return {get length(){return rows.size;}, key:i=>[...rows.keys()][i], getItem:key=>rows.get(key)??null,
    removeItem:key=>rows.delete(key), setItem:(key,value)=>rows.set(key,value)};
}
function useStorage(t, key, value) {
  const previous=Object.getOwnPropertyDescriptor(globalThis,key);
  Object.defineProperty(globalThis,key,{configurable:true,value});
  t.after(()=>previous ? Object.defineProperty(globalThis,key,previous) : delete globalThis[key]);
}
const finished={stage:'done', reading:example, draft:{values:{birth:'971231'},preview:'old-thumbnail.jpg'},
  requestId:'test-reading-a',profile:{job:'raw-form-field',face:{observations:[{name:'코',reading:'측정 예시',marks:'raw-coordinates'}]}}};

test('complete results outlive the tab, keep the original pick, and stay deleted',t=>{
  useStorage(t,'localStorage',storage());useStorage(t,'sessionStorage',storage());
  const first=rememberCompleted({...finished,updated:100});
  const second=rememberCompleted({...finished,updated:200,requestId:'test-reading-b'});
  assert.deepEqual(listSavedReadings().map(r=>r.id),[second.savedId,first.savedId]);
  saveReadingPick(first.savedId,'choiceOther');
  writeSession(first);
  clearSession();
  const saved=savedReading(first.savedId);
  assert.equal(saved.pick,'choiceOther');
  assert.deepEqual(saved.reading.paragraphs,example.paragraphs);
  assert.deepEqual(saved.observations,[{name:'코',reading:'측정 예시'}]);
  assert.doesNotMatch(JSON.stringify(saved),/971231|old-thumbnail|raw-form-field|raw-coordinates/);
  removeSavedReading(first.savedId);
  rememberCompleted(first);
  saveReadingPick(first.savedId,'choiceMade');
  assert.deepEqual(listSavedReadings().map(r=>r.id),[second.savedId]);
});

test('a still-present completed result migrates before its expired input draft is discarded',t=>{
  useStorage(t,'localStorage',storage());useStorage(t,'sessionStorage',storage());
  sessionStorage.setItem('jeonsaeng.reading-session.v1',JSON.stringify({...finished,updated:Date.now()-7200000,scenePick:'choiceMade'}));
  assert.equal(readSession(),null);
  assert.equal(sessionStorage.length,0);
  assert.equal(listSavedReadings()[0].pick,'choiceMade');
});

test('incomplete sessions and unavailable device storage do not block current readings',t=>{
  const blocked=storage();blocked.setItem=()=>{throw new Error('quota');};
  useStorage(t,'localStorage',blocked);
  assert.equal(rememberCompleted(finished),finished);
  const pending={...finished,stage:'running'};
  assert.equal(rememberCompleted(pending),pending);
  assert.deepEqual(listSavedReadings(),[]);
});
