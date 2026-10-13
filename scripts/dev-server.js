// Dependency-free local development server for Letterloom.
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.txt':'text/plain; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.md':'text/plain; charset=utf-8'};
const port=Number(process.env.PORT||4173);
createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost');
    const pathname=decodeURIComponent(url.pathname);
    const name=pathname==='/'?'/index.html':pathname;
    const target=path.resolve(root,'.'+name);
    if(!(target===root||target.startsWith(root+path.sep)))throw new Error('Forbidden');
    const file=await stat(target);
    if(!file.isFile())throw new Error('Not a file');
    res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');
    res.setHeader('Cache-Control','no-cache');
    res.end(await readFile(target));
  }catch{
    res.statusCode=404;res.end('Not found');
  }
}).listen(port,'127.0.0.1',()=>console.log(`Letterloom running at http://localhost:${port}`));
