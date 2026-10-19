const $=id=>document.getElementById(id);
function el(tag,text){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;}
async function post(path,data){const csrf=await window.sessionReady;const r=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:JSON.stringify(data)});const body=await r.json();if(!r.ok)throw new Error(body.error);return body;}
let chartData=null;
function drawChart(data){
 chartData=data;const canvas=$('download-chart'),ctx=canvas.getContext('2d');
 const W=1800,H=1200,left=190,right=90,top=200,bottom=930,width=W-left-right,height=bottom-top;
 ctx.fillStyle='#ffffff';ctx.fillRect(0,0,W,H);ctx.fillStyle='#152111';ctx.font='bold 46px Arial';ctx.fillText('Detección correcta de imágenes generadas con IA',100,90);
 ctx.font='26px Arial';ctx.fillStyle='#4b5745';ctx.fillText('Estudio de 20 imágenes · solo partidas completas',100,145);
 ctx.lineWidth=2;ctx.font='24px Arial';ctx.textAlign='right';
 for(let value=0;value<=100;value+=20){const y=bottom-value/100*height;ctx.strokeStyle='#dde3d8';ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(W-right,y);ctx.stroke();ctx.fillStyle='#354130';ctx.fillText(value+'%',left-25,y+8);}
 ctx.save();ctx.translate(60,650);ctx.rotate(-Math.PI/2);ctx.textAlign='center';ctx.font='26px Arial';ctx.fillText('Imágenes identificadas correctamente como IA (%)',0,0);ctx.restore();
 [1,2,3].forEach((level,index)=>{const rate=data.rates[level];const count=data.modelCounts[level]||0;const x=left+(index+.5)*width/3;const barWidth=230;
  if(count){ctx.fillStyle=['#a7d64e','#80b53b','#548d2c'][index];const barHeight=rate/100*height;ctx.fillRect(x-barWidth/2,bottom-barHeight,barWidth,barHeight);}
  ctx.textAlign='center';ctx.fillStyle='#152111';ctx.font='bold 32px Arial';ctx.fillText(count?rate.toFixed(1)+'%':'Sin datos',x,count?Math.max(top+35,bottom-rate/100*height-22):bottom-25);
  ctx.font='bold 30px Arial';ctx.fillText('DALL·E '+level,x,bottom+55);ctx.font='24px Arial';ctx.fillStyle='#4b5745';ctx.fillText(`n = ${count} respuestas`,x,bottom+97);
 });
 ctx.textAlign='left';ctx.font='24px Arial';ctx.fillStyle='#4b5745';const participants=data.participants.filter(p=>p.experiment_version===data.experimentVersion).length;
 ctx.fillText(`${participants} participantes con partida completa. Cada modelo aporta 5 imágenes por participante.`,100,1110);
 ctx.fillText('Fuente: respuestas anónimas del experimento ¿REAL O IA? · Fecha UTC: '+new Date().toISOString().slice(0,10),100,1155);
 $('export-png').disabled=participants===0;
}
$('export-png').addEventListener('click',()=>{$('download-chart').toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob);const a=el('a');a.href=url;a.download='deteccion-ia.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},'image/png');});
async function load(){
 const r=await fetch('/api/admin');if(r.status===401)return;const data=await r.json();if(!r.ok)throw new Error(data.error);$('login').hidden=true;$('panel').hidden=false;
 const participants=data.participants,current=participants.filter(p=>p.experiment_version===data.experimentVersion);
 const overall=current.length?current.reduce((s,p)=>s+p.percentage,0)/current.length:null;
 const stats=[[participants.length,'Participantes completos · total histórico'],[current.length,'Participantes · estudio de 20 imágenes'],[overall===null?'Sin datos':overall.toFixed(1)+'%','Aciertos generales · estudio actual'],...[0,1,2,3].map(l=>[data.rates[l]===undefined?'Sin datos':data.rates[l].toFixed(1)+'%',l===0?'Fotografías reales':`DALL·E ${l}`])];
 $('metrics').replaceChildren();stats.forEach(([value,label])=>{const a=el('article');a.append(el('b',value),el('span',label));$('metrics').append(a);});
 $('empty').hidden=current.length>0;drawChart(data);
 $('participants').replaceChildren();participants.forEach(p=>{const detail=el('details');detail.append(el('summary',`${p.id} · ${p.age} años · ${p.score}/${p.expected_trials} · ${p.percentage.toFixed(1)}%`),el('p',`Fecha UTC: ${p.date} · Versión: ${p.experiment_version}`));
 const scroll=el('div');scroll.className='table-scroll';const table=el('table'),head=el('thead'),tr=el('tr');['Orden','Imagen','Respuesta','Correcta','Acierto','Modelo','Nivel'].forEach(t=>tr.append(el('th',t)));head.append(tr);const body=el('tbody');data.responses.filter(r=>r.participant_id===p.id).forEach(r=>{const row=el('tr');[r.presentation_order,r.image_id,r.participant_answer,r.correct_answer,r.is_correct?'Sí':'No',r.model,r.generation_level].forEach(v=>row.append(el('td',v)));body.append(row);});table.append(head,body);scroll.append(table);detail.append(scroll);$('participants').append(detail);});
 const tbody=$('image-stats');tbody.replaceChildren();for(const stat of data.imageStats){const row=el('tr');[stat.image_id,stat.model,stat.total,stat.correct,stat.total-stat.correct,stat.accuracy.toFixed(1)+'%',stat.error_rate.toFixed(1)+'%'].forEach(v=>row.append(el('td',v)));tbody.append(row);}
}
$('login-form').addEventListener('submit',async e=>{e.preventDefault();e.submitter.disabled=true;try{await post('/api/admin/login',{password:$('password').value});$('password').value='';await load();}catch(err){$('login-error').textContent=err.message;}finally{e.submitter.disabled=false;}});
$('logout').addEventListener('click',async()=>{try{await post('/api/admin/logout',{});location.reload();}catch(err){$('panel-error').textContent=err.message;}});
load().catch(err=>{$('login-error').textContent=err.message;});
