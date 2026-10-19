import {chromium} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:8787';
if(!['127.0.0.1','localhost'].includes(new URL(base).hostname))throw Error('Only local isolated tests allowed');
const password=fs.readFileSync('.dev.vars','utf8').match(/^ADMIN_PASSWORD=(.*)$/m)[1];
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_BIN||undefined,headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/');await page.getByRole('button',{name:'EMPEZAR'}).click();await page.getByText('Escribí tu edad para empezar.').waitFor();await page.locator('#age').fill('16');await page.getByRole('button',{name:'EMPEZAR'}).click();
 for(let n=1;n<=20;n++){
  await page.getByText(`Imagen ${n} de 20`,{exact:true}).waitFor();
  await page.locator('#trial-image').evaluate(img=>img.complete&&img.naturalWidth>0?true:new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;}));
  assert.equal(await page.getByText('DALL·E',{exact:false}).count(),0);
  await page.getByRole('button',{name:'REAL',exact:true}).click();
 }
 await page.getByText('¡Terminaste!').waitFor();assert.equal(await page.locator('#score').innerText(),'Acertaste 5 de 20 imágenes.');
 await page.goto(base+'/admin');await page.locator('#password').fill(password);await page.getByRole('button',{name:'ENTRAR'}).click();await page.getByText('Los resultados.').waitFor();
 await page.locator('details summary').first().click();assert.equal(await page.locator('details').first().locator('tbody tr').count(),20);assert.equal(await page.locator('#image-stats tr').count(),20);
 const csvPromise=page.waitForEvent('download');await page.getByRole('link',{name:'EXPORTAR CSV'}).click();const csvFile=await csvPromise;const csv=fs.readFileSync(await csvFile.path(),'utf8');const expected=await page.evaluate(async()=>{const r=await fetch('/api/admin');return (await r.json()).responses.length;});assert.equal(csv.trim().split('\n').length,expected+1);
 const pngPromise=page.waitForEvent('download');await page.getByRole('button',{name:'DESCARGAR GRÁFICO PNG'}).click();const pngFile=await pngPromise;const png=fs.readFileSync(await pngFile.path());assert.equal(png.subarray(1,4).toString(),'PNG');assert.equal(png.readUInt32BE(16),1800);assert.equal(png.readUInt32BE(20),1200);
 const out=process.env.TEST_ARTIFACTS_DIR||'/tmp/real-ia-artifacts';fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/grafico-prueba.png',png);await page.screenshot({path:out+'/admin-mobile.png',fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:out+'/admin-desktop.png',fullPage:true});
 await page.getByRole('button',{name:'SALIR'}).click();await page.locator('#login').waitFor({state:'visible'});assert.equal((await page.request.get(base+'/api/admin')).status(),401);assert.deepEqual(errors,[]);
 console.log('PASS: start, 20 images, 5/20 score, admin, image statistics, CSV, 1800×1200 PNG, mobile, logout, no JS errors.');
}finally{await browser.close();}
