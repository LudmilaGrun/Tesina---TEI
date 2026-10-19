import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:8787';
if(!['127.0.0.1','localhost'].includes(new URL(base).hostname))throw Error('Las pruebas solo pueden ejecutarse en una base local aislada.');
const password=fs.readFileSync('.dev.vars','utf8').match(/^ADMIN_PASSWORD=(.*)$/m)[1];
const images=JSON.parse(fs.readFileSync('images.json'));
class Client{
 cookies={};csrf='';
 async call(path,data){const r=await fetch(base+path,{method:data?'POST':'GET',headers:{Cookie:Object.entries(this.cookies).map(([k,v])=>`${k}=${v}`).join('; '),...(data?{'Content-Type':'application/json',Origin:base,'X-CSRF-Token':this.csrf}:{})},body:data?JSON.stringify(data):undefined});for(const c of r.headers.getSetCookie()){const pair=c.split(';')[0];const i=pair.indexOf('=');this.cookies[pair.slice(0,i)]=pair.slice(i+1);}return r;}
 async init(){this.csrf=(await (await this.call('/api/session')).json()).csrf;}
}
test('15 adolescents = 300 responses; participant 16 allowed; statistics, privacy and CSV',async()=>{
 const admin=new Client();await admin.init();assert.equal((await admin.call('/api/admin')).status,401);assert.equal((await admin.call('/admin/export.csv')).status,401);
 assert.equal((await admin.call('/api/admin/login',{password:'wrong'})).status,401);assert.equal((await admin.call('/api/admin/login',{password})).status,200);
 const initial=await (await admin.call('/api/admin')).json();assert.equal(initial.participants.length,0,'Use an empty temporary database');assert.equal(initial.imageStats.length,0);
 const ids=[],orders=[];
 for(let participant=0;participant<16;participant++){
  const c=new Client();await c.init();for(const age of [0,-1,121,15.5,'16',null])assert.equal((await c.call('/api/start',{age})).status,400);
  const start=await c.call('/api/start',{age:16});assert.equal(start.status,200);let data=await start.json();const seen=[];
  assert.equal((await c.call('/api/answer',{answer:'real',order:2})).status,409);
  for(let order=1;order<=20;order++){
   assert.deepEqual(Object.keys(data).sort(),['imageUrl','order','total']);assert.equal(data.order,order);assert.equal(data.total,20);seen.push(data.imageUrl);
   const answer=participant===15?images.find(im=>im.imageUrl===data.imageUrl).correctAnswer:'real';
   const result=await c.call('/api/answer',{answer,order});assert.equal(result.status,200);data=await result.json();
   if(order===1)assert.equal((await c.call('/api/answer',{answer,order})).status,409);
  }
  assert.equal(new Set(seen).size,20);assert.deepEqual(data,{done:true,score:participant===15?20:5,percentage:participant===15?100:25,total:20});ids.push(c.cookies.participant);orders.push(seen.join(','));
  if(participant===14){const panel=await (await admin.call('/api/admin')).json();assert.equal(panel.participants.length,15);assert.equal(panel.responses.length,300);const csv=await (await admin.call('/admin/export.csv')).text();assert.equal(csv.trim().split('\n').length,301);}
 }
 assert.equal(new Set(ids).size,16);assert.ok(new Set(orders).size>1,'Randomized orders differ');
 const partial=new Client();await partial.init();let next=await (await partial.call('/api/start',{age:17})).json();await partial.call('/api/answer',{answer:'ai',order:next.order});
 const panel=await (await admin.call('/api/admin')).json();assert.equal(panel.participants.length,16);assert.equal(panel.responses.length,320);assert.equal(panel.imageStats.length,20);assert.deepEqual(panel.modelCounts,{'0':80,'1':80,'2':80,'3':80});assert.deepEqual(panel.rates,{'0':100,'1':6.25,'2':6.25,'3':6.25});
 for(const stat of panel.imageStats){assert.equal(stat.total,16);assert.equal(stat.correct,stat.generation_level===0?16:1);assert.equal(stat.accuracy+stat.error_rate,100);}
 const csv=await (await admin.call('/admin/export.csv')).text();assert.equal(csv.trim().split('\n').length,321);assert.equal(csv.replace(/^\ufeff/,'').split('\n')[0].trim(),'participant_id,age,date,image_id,presentation_order,participant_answer,correct_answer,is_correct,model,generation_level,total_images,experiment_version');
 await admin.call('/api/admin/logout',{});assert.equal((await admin.call('/api/admin')).status,401);
 const invalid=await fetch(base+'/api/start',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({age:16})});assert.equal(invalid.status,403);
});
