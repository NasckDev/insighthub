// Fails the build when dist/ would break under a subpath (absolute URLs in index.html).
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = join(fileURLToPath(new URL('..', import.meta.url)), 'dist');
const html = readFileSync(join(dist, 'index.html'), 'utf8');
const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
const bad = refs.filter((ref) => ref.startsWith('/') || /^https?:/.test(ref));
if (bad.length > 0) {
  console.error(`dist/index.html tem URLs absolutas (quebram em subpath): ${bad.join(', ')}`);
  process.exit(1);
}
const files = readdirSync(dist, { recursive: true }).length;
console.log(`Build portátil OK: ${refs.length} referências relativas, ${files} entradas em ${dist}`);
