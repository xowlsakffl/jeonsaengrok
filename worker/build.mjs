import {readdir,readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import path from 'node:path';
import {gzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const web=path.join(root,'web');
const types={'.js':'text/javascript; charset=utf-8','.html':'text/html; charset=utf-8','.svg':'image/svg+xml','.json':'application/json','.jpg':'image/jpeg','.woff2':'font/woff2','.ttf':'font/ttf','.wasm':'application/wasm','.txt':'text/plain; charset=utf-8','.css':'text/css; charset=utf-8'};
const packed={};
async function collect(dir) {
  for(const entry of await readdir(dir,{withFileTypes:true})) {
    const file=path.join(dir,entry.name);
    if(entry.isDirectory()){await collect(file);continue;}
    const bytes=await readFile(file);
    const key='/'+path.relative(web,file).replaceAll(path.sep,'/');
    packed[key]=[types[path.extname(file)]||'application/octet-stream',gzipSync(bytes,{level:9}).toString('base64')];
  }
}
await collect(web);
const api=await readFile(new URL('./api.mjs',import.meta.url),'utf8');
const server=await readFile(new URL('./entry.mjs',import.meta.url),'utf8');
const out=path.join(root,'dist','server');await mkdir(out,{recursive:true});
await writeFile(path.join(out,'index.js'),api+'\nconst assets='+JSON.stringify(packed)+';\n'+server);
const metadata=path.join(root,'dist','.openai');await mkdir(metadata,{recursive:true});
await copyFile(path.join(root,'.openai','hosting.json'),path.join(metadata,'hosting.json'));
console.log('Built '+Object.keys(packed).length+' site assets and the reading API.');

