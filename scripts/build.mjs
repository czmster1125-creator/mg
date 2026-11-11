import {build} from 'vite';
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
await build();
const {version}=JSON.parse(readFileSync('package.json','utf8'));
const fingerprint=createHash('sha256').update(readdirSync('dist/assets').sort().join('|')).digest('hex').slice(0,10);
const source=readFileSync('public/sw.js','utf8');
writeFileSync('dist/sw.js',source.replace(/const CACHE='[^']+';/,`const CACHE='tidebloom-${version}-${fingerprint}';`));
console.log(`PWA cache: tidebloom-${version}-${fingerprint}`);
