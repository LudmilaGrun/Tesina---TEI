window.sessionReady=fetch('/api/session').then(async r=>{const body=await r.json();if(!r.ok)throw new Error(body.error);document.querySelector('meta[name="csrf-token"]').content=body.csrf;return body.csrf;});
window.sessionReady.catch(()=>{});
