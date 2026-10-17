const VERSION='letterloom-offline-v23';
const ASSETS=['./','./index.html','./styles.css?v=1.22.0','./app.js?v=1.22.0','./rack-order.js?v=1.15.0','./board-placement.js?v=1.16.0','./last-move.js?v=1.17.0','./word-lookup.js?v=1.19.0','./bot-familiarity.js?v=1.19.0','./engine.js?v=1.22.0','./uk-dictionary.js?v=1.22.0','./bot.js?v=1.22.0','./bot.worker.js?v=1.22.0','./dictionary.txt?v=1.21.0','./everyday-words.txt?v=1.9.0','./bot-words.txt?v=1.9.0','./manifest.webmanifest','./assets/icon.svg','./assets/icon-192.png','./assets/icon-512.png'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==VERSION).map(k=>caches.delete(k)))),self.clients.claim()]));
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  if(request.mode==='navigate'){
    event.respondWith(fetch(request).then(response=>{const copy=response.clone();caches.open(VERSION).then(cache=>cache.put('./index.html',copy));return response;}).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(request).then(hit=>hit||fetch(request).then(response=>{
    if(response.ok){const clone=response.clone();caches.open(VERSION).then(cache=>cache.put(request,clone));}
    return response;
  })));
});
