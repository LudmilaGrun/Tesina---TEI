import images from '../images.json';
const EXPERIMENT_VERSION='study-20-v1';
const encoder=new TextEncoder();
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8'}});
function cookies(request){return Object.fromEntries((request.headers.get('Cookie')||'').split(';').map(s=>[s.trim().slice(0,s.trim().indexOf('=')),s.trim().slice(s.trim().indexOf('=')+1)]));}
async function key(secret){return crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);}
async function signed(value,secret){const data=btoa(JSON.stringify(value));const sig=await crypto.subtle.sign('HMAC',await key(secret),encoder.encode(data));return data+'.'+btoa(String.fromCharCode(...new Uint8Array(sig)));}
async function verified(value,secret){try{const [data,sig]=value.split('.');if(!await crypto.subtle.verify('HMAC',await key(secret),Uint8Array.from(atob(sig),c=>c.charCodeAt(0)),encoder.encode(data)))return null;const body=JSON.parse(atob(data));return body.expires>Date.now()?body:null;}catch{return null;}}
function cookie(name,value,request,maxAge=7200){return `${name}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${new URL(request.url).protocol==='https:'?'; Secure':''}`;}
async function equals(a,b){const hash=async s=>new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(s)));const x=await hash(a),y=await hash(b);let diff=0;for(let i=0;i<x.length;i++)diff|=x[i]^y[i];return diff===0;}
function shuffle(items){const out=[...items];for(let i=out.length-1;i>0;i--){let r;const limit=Math.floor(4294967296/(i+1))*(i+1);do{r=crypto.getRandomValues(new Uint32Array(1))[0];}while(r>=limit);const j=r%(i+1);[out[i],out[j]]=[out[j],out[i]];}return out;}
async function route(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(!path.startsWith('/api/')&&path!='/admin/export.csv'){
  if(path==='/')return env.ASSETS.fetch(new Request(new URL('/index.html',url),request));
  if(path==='/admin'||path==='/admin/'||path==='/admin/login')return env.ASSETS.fetch(new Request(new URL('/admin.html',url),request));
  if(path.startsWith('/admin/'))return new Response('No encontrado',{status:404});
  return env.ASSETS.fetch(request);
 }
 if(!env.SESSION_SECRET)return json({error:'Falta configurar SESSION_SECRET.'},503);
 const cs=cookies(request);
 if(path==='/api/session'&&request.method==='GET'){
  const token=await signed({nonce:crypto.randomUUID(),expires:Date.now()+7200000},env.SESSION_SECRET);
  const response=json({csrf:token});response.headers.append('Set-Cookie',cookie('csrf',token,request));return response;
 }
 if(request.method==='POST'){
  if(request.headers.get('Origin')!==url.origin||request.headers.get('X-CSRF-Token')!==cs.csrf||!await verified(cs.csrf,env.SESSION_SECRET))return json({error:'La sesión venció. Recargá la página.'},403);
  if(Number(request.headers.get('Content-Length')||0)>4096)return json({error:'Solicitud demasiado grande.'},413);
 }
 const admin=await verified(cs.admin,env.SESSION_SECRET);
 if(path==='/api/admin/login'&&request.method==='POST'){
  if(!env.ADMIN_PASSWORD)return json({error:'El panel está cerrado hasta configurar la contraseña.'},503);
  const data=await request.json();if(typeof data.password!=='string'||!await equals(data.password,env.ADMIN_PASSWORD))return json({error:'Contraseña incorrecta.'},401);
  const response=json({ok:true});response.headers.append('Set-Cookie',cookie('admin',await signed({role:'admin',expires:Date.now()+7200000},env.SESSION_SECRET),request));return response;
 }
 if(path==='/api/admin/logout'&&request.method==='POST'){const r=json({ok:true});r.headers.append('Set-Cookie',cookie('admin','',request,0));return r;}
 if(path==='/api/admin'||path==='/admin/export.csv'){
  if(!admin||admin.role!=='admin')return json({error:'Acceso privado.'},401);
  if(request.method!=='GET')return json({error:'Método no permitido.'},405);
  const sql='SELECT p.id AS participant_id,p.age,p.date,t.image_id,t.presentation_order,t.participant_answer,t.correct_answer,t.is_correct,t.model,t.generation_level,p.expected_trials AS total_images,p.experiment_version FROM trials t JOIN participants p ON p.id=t.participant_id WHERE p.completed=1 ORDER BY p.date DESC,t.presentation_order';
  if(path==='/admin/export.csv'){
   const {results}=await env.DB.prepare(sql).all();const columns=['participant_id','age','date','image_id','presentation_order','participant_answer','correct_answer','is_correct','model','generation_level','total_images','experiment_version'];
   const escape=value=>'"'+String(value).replaceAll('"','""')+'"';
   return new Response('\ufeff'+[columns.join(','),...results.map(r=>columns.map(c=>escape(r[c])).join(','))].join('\r\n'),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename=resultados.csv'}});
  }
  const result=await env.DB.batch([
   env.DB.prepare('SELECT * FROM participants WHERE completed=1 ORDER BY date DESC'),
   env.DB.prepare('SELECT t.generation_level,AVG(t.is_correct)*100 AS rate,COUNT(*) AS total FROM trials t JOIN participants p ON p.id=t.participant_id WHERE p.completed=1 AND p.experiment_version=? GROUP BY t.generation_level').bind(EXPERIMENT_VERSION),
   env.DB.prepare(sql),
   env.DB.prepare('SELECT t.image_id,t.model,t.generation_level,COUNT(*) AS total,SUM(t.is_correct) AS correct,AVG(t.is_correct)*100 AS accuracy,(1-AVG(t.is_correct))*100 AS error_rate FROM trials t JOIN participants p ON p.id=t.participant_id WHERE p.completed=1 AND p.experiment_version=? GROUP BY t.image_id,t.model,t.generation_level ORDER BY t.image_id').bind(EXPERIMENT_VERSION)
  ]);
  return json({participants:result[0].results,rates:Object.fromEntries(result[1].results.map(r=>[r.generation_level,r.rate])),responses:result[2].results,imageStats:result[3].results,modelCounts:Object.fromEntries(result[1].results.map(r=>[r.generation_level,r.total])),experimentVersion:EXPERIMENT_VERSION});
 }
 if(path==='/api/start'&&request.method==='POST'){
  const {age}=await request.json();if(!Number.isInteger(age)||age<1||age>120)return json({error:'Escribí tu edad para empezar.'},400);
  if(images.length!==20||[0,1,2,3].some(level=>images.filter(i=>i.generationLevel===level).length!==5))return json({error:'El conjunto de imágenes no está configurado correctamente.'},503);
  const pid=crypto.randomUUID(),order=shuffle(images);
  await env.DB.batch([env.DB.prepare('INSERT INTO participants(id,age,date,expected_trials,experiment_version) VALUES(?,?,?,?,?)').bind(pid,age,new Date().toISOString(),order.length,EXPERIMENT_VERSION),...order.map((im,n)=>env.DB.prepare('INSERT INTO trials(participant_id,image_id,presentation_order,image_url,correct_answer,model,generation_level) VALUES(?,?,?,?,?,?,?)').bind(pid,im.id,n+1,im.imageUrl,im.correctAnswer,im.model,im.generationLevel))]);
  const response=json({imageUrl:order[0].imageUrl,order:1,total:order.length});response.headers.append('Set-Cookie',cookie('participant',await signed({id:pid,expires:Date.now()+7200000},env.SESSION_SECRET),request));return response;
 }
 if(path==='/api/answer'&&request.method==='POST'){
  const participant=await verified(cs.participant,env.SESSION_SECRET);if(!participant)return json({error:'La sesión venció. Volvé al inicio.'},401);
  const data=await request.json();if(!['real','ai'].includes(data.answer)||!Number.isInteger(data.order))return json({error:'Respuesta inválida.'},400);
  const updated=await env.DB.prepare('UPDATE trials SET participant_answer=?,is_correct=(correct_answer=?) WHERE participant_id=? AND presentation_order=? AND participant_answer IS NULL AND presentation_order=(SELECT MIN(presentation_order) FROM trials WHERE participant_id=? AND participant_answer IS NULL) RETURNING presentation_order').bind(data.answer,data.answer,participant.id,data.order,participant.id).first();
  if(!updated)return json({error:'La respuesta ya fue guardada o el orden es incorrecto.'},409);
  const next=await env.DB.prepare('SELECT image_url,presentation_order FROM trials WHERE participant_id=? AND participant_answer IS NULL ORDER BY presentation_order LIMIT 1').bind(participant.id).first();
  const participantInfo=await env.DB.prepare('SELECT score,percentage,expected_trials,completed FROM participants WHERE id=?').bind(participant.id).first();
  if(next)return json({imageUrl:next.image_url,order:next.presentation_order,total:participantInfo.expected_trials});
  return json({done:true,score:participantInfo.score,percentage:Math.round(participantInfo.percentage),total:participantInfo.expected_trials});
 }
 return json({error:'No encontrado.'},404);
}
export default {async fetch(request,env){let response;try{response=await route(request,env);}catch{response=json({error:'No se pudo completar la operación. Intentá nuevamente.'},500);}const r=new Response(response.body,response);r.headers.set('Cache-Control','no-store');r.headers.set('X-Content-Type-Options','nosniff');r.headers.set('Referrer-Policy','no-referrer');r.headers.set('Content-Security-Policy',"default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self'; frame-ancestors 'none'; form-action 'self'");return r;}};
