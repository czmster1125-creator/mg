const CACHE='tidebloom-0.11-r1';
self.addEventListener('install',event=>event.waitUntil((async()=>{const c=await caches.open(CACHE);await c.addAll(['/','/favicon.svg','/manifest.webmanifest','/icons/icon-192.png','/icons/icon-512.png']);const html=await(await c.match('/')).text();const assets=[...html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)].map(x=>x[1]);await c.addAll(assets);await self.skipWaiting();})()));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const u=new URL(event.request.url);if(u.origin!==location.origin||u.pathname.startsWith('/api/')||event.request.method!=='GET')return;
 event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));}return response;}).catch(()=>caches.match(event.request).then(cached=>cached||new Response('离线资源尚未缓存，请连接网络后再打开。',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}}))));
});
