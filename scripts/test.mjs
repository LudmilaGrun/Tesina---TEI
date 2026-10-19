import {spawn,spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createServer} from 'node:net';
const probe=createServer();
await new Promise((resolve,reject)=>{probe.once('error',reject);probe.listen(0,'127.0.0.1',resolve);});
const port=probe.address().port;
await new Promise(resolve=>probe.close(resolve));
const state=fs.mkdtempSync(path.join(os.tmpdir(),'real-ia-20-tests-'));
const env={...process.env,WRANGLER_SEND_METRICS:'false',XDG_CONFIG_HOME:process.env.XDG_CONFIG_HOME||'/workspace/.local-config',TEST_BASE_URL:`http://127.0.0.1:${port}`,TEST_ARTIFACTS_DIR:path.join(state,'artifacts')};
if(!env.CHROMIUM_BIN&&fs.existsSync('/usr/bin/chromium'))env.CHROMIUM_BIN='/usr/bin/chromium';
const cli='node_modules/wrangler/bin/wrangler.js';
function run(command,args){const result=spawnSync(command,args,{env,stdio:'inherit'});if(result.status!==0)throw Error(`Falló ${command} ${args.join(' ')}`);}
let server;
try{
 run('python3',['-m','unittest','discover','-s','tests','-p','test_migration.py','-v']);
 run(process.execPath,['scripts/setup-local.mjs']);
 run(process.execPath,[cli,'d1','migrations','apply','real-o-ia-results','--local','--persist-to',state]);
 server=spawn(process.execPath,[cli,'dev','--ip','127.0.0.1','--port',String(port),'--persist-to',state],{env,stdio:['ignore','pipe','pipe']});
 let logs='';server.stdout.on('data',s=>{logs+=s;});server.stderr.on('data',s=>{logs+=s;});
 let ready=false;
 for(let i=0;i<150;i++){if(server.exitCode!==null)throw Error('El servidor terminó: '+logs);try{const r=await fetch(env.TEST_BASE_URL+'/api/session');if(r.ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,200));}
 if(!ready)throw Error('No inició el servidor: '+logs);
 run(process.execPath,['--test','tests/worker.test.mjs']);
 run(process.execPath,['tests/browser.mjs']);
 console.log('Pruebas completas. Base aislada y artefactos: '+state);
}catch(error){console.error(error.message);process.exitCode=1;}finally{if(server){server.kill('SIGTERM');await Promise.race([new Promise(r=>server.once('exit',r)),new Promise(r=>setTimeout(r,3000))]);}}
