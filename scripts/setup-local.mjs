import fs from 'node:fs';
import crypto from 'node:crypto';
try{fs.writeFileSync('.dev.vars',`SESSION_SECRET=${crypto.randomBytes(32).toString('hex')}\nADMIN_PASSWORD=${crypto.randomBytes(24).toString('hex')}\n`,{flag:'wx',mode:0o600});}catch(error){if(error.code!=='EEXIST')throw error;}
