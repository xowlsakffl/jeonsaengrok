import test from 'node:test';
import assert from 'node:assert/strict';
import {reserveGeneration} from '../worker/api.mjs';
import {localD1} from './local-d1.mjs';
const beforeMidnight=Date.parse('2026-11-26T14:59:55Z');
const req=(actor,id=crypto.randomUUID())=>new Request('https://site.test/api/reading',{headers:{'cf-connecting-ip':actor,'X-Reading-Id':id}});

test('duplicate reservations, daily user limit and concurrent site-wide limit precede upstream work', async t=>{
  const db=localD1();t.after(()=>db.close());
  const same=req('example-network');
  assert.equal(await reserveGeneration(same,db,beforeMidnight),null);
  assert.equal((await reserveGeneration(same,db,beforeMidnight)).status,409);
  assert.equal(await reserveGeneration(req('example-network'),db,beforeMidnight),null);
  assert.equal((await reserveGeneration(req('example-network'),db,beforeMidnight)).status,429);
  const rest=await Promise.all(Array.from({length:50},(_,i)=>reserveGeneration(req('net-'+i),db,beforeMidnight)));
  assert.equal(rest.filter(result=>result===null).length,28);
  assert.equal(rest.filter(result=>result?.status===429).length,22);
  assert.equal(await reserveGeneration(same,db,beforeMidnight+6000),null);
});
