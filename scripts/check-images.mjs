import fs from 'node:fs';
import crypto from 'node:crypto';
const images=JSON.parse(fs.readFileSync('images.json'));const evidence=JSON.parse(fs.readFileSync('image-provenance.json'));
let issues=[];
if(images.length!==20||new Set(images.map(i=>i.id)).size!==20)issues.push('Se requieren 20 IDs únicos.');
for(let level=0;level<=3;level++)if(images.filter(i=>i.generationLevel===level).length!==5)issues.push(`Se requieren 5 imágenes de nivel ${level}.`);
for(const image of images){
 const record=evidence.find(r=>r.imageId===image.id);
 if(image.correctAnswer!==(image.generationLevel===0?'real':'ai'))issues.push(`${image.id}: clasificación inconsistente.`);
 if(!record||record.status!=='verified'||record.approved!==true||!record.sourceUrl||!record.author||!record.licenseOrPermission||!record.modelEvidence||!record.sha256){issues.push(`${image.id}: falta verificar procedencia y permiso de uso.`);continue;}
 if(!image.imageUrl.startsWith('/static/images/')||image.imageUrl.includes('..')){issues.push(`${image.id}: ubicación inválida.`);continue;}
 try{const file=fs.readFileSync('public'+image.imageUrl);if(crypto.createHash('sha256').update(file).digest('hex')!==record.sha256)issues.push(`${image.id}: el archivo no coincide con la evidencia.`);}catch{issues.push(`${image.id}: falta el archivo.`);}
}
if(issues.length){console.error('Publicación del experimento bloqueada:\n'+issues.join('\n'));process.exit(1);}
console.log('20 archivos y registros de procedencia comprobados. La revisión humana de las fuentes debe estar completa.');
