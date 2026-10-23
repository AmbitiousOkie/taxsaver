import fs from 'node:fs';
const session=JSON.parse(fs.readFileSync(new URL('../verification/firefox-session.json',import.meta.url)));
const ws=new WebSocket(session.capabilities.webSocketUrl);
await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
let id=0;
function send(method,params){const current=++id;return new Promise((resolve,reject)=>{const handler=e=>{const data=JSON.parse(e.data);if(data.id!==current)return;ws.removeEventListener('message',handler);if(data.type==='error')reject(new Error(JSON.stringify(data)));else resolve(data.result);};ws.addEventListener('message',handler);ws.send(JSON.stringify({id:current,method,params}));});}
try{const tree=await send('browsingContext.getTree',{});await send('browsingContext.setViewport',{context:tree.contexts[0].context,viewport:{width:Number(process.argv[2]||390),height:Number(process.argv[3]||844)}});console.log('Firefox viewport set.');}finally{ws.close();}
