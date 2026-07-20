import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, extname } from 'path';

const root = 'dist-single';
const MIME = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime'
};

const assets = {};
for (const dir of ['products', 'store', 'media']) {
  const abs = join(root, dir);
  if (!existsSync(abs)) continue;
  for (const f of readdirSync(abs)) {
    const ext = extname(f).toLowerCase();
    if (!MIME[ext]) continue; // pula README.md etc.
    const buf = readFileSync(join(abs, f));
    assets[`${dir}/${f}`] = `data:${MIME[ext]};base64,${buf.toString('base64')}`;
  }
}

const shim = `<script>
window.__CM_ASSETS__=${JSON.stringify(assets)};
(function(){
  var A=window.__CM_ASSETS__||{};
  function map(u){
    if(typeof u!=='string')return u;
    var k=u.replace(/^(\\.\\/|\\/)+/,'');
    if(A[k])return A[k];
    return u;
  }
  var setAttr=Element.prototype.setAttribute;
  Element.prototype.setAttribute=function(n,v){ if(n==='src')v=map(v); return setAttr.call(this,n,v); };
  ['HTMLImageElement','HTMLVideoElement','HTMLSourceElement'].forEach(function(name){
    var C=window[name]; if(!C)return;
    var d=Object.getOwnPropertyDescriptor(C.prototype,'src');
    if(!d||!d.set)return;
    Object.defineProperty(C.prototype,'src',{
      configurable:true,enumerable:d.enumerable,
      get:function(){return d.get.call(this);},
      set:function(v){ d.set.call(this,map(v)); }
    });
  });
})();
</script>`;

let html = readFileSync(join(root, 'index.html'), 'utf8');
html = html.replace('</head>', shim + '\n</head>');
const outPath = join(root, 'casa-mikka.html');
writeFileSync(outPath, html);
console.log('inlined assets:', Object.keys(assets).length);
console.log('output:', outPath, (Buffer.byteLength(html) / 1048576).toFixed(1) + ' MB');
