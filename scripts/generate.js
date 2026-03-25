import { createFromRoot } from 'codama';
import { rootNodeFromAnchor } from '@codama/nodes-from-anchor';
import { renderVisitor } from '@codama/renderers-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const idlPath = resolve(__dirname, '../idl/sharky.json');

console.log('Reading IDL from:', idlPath);
const idl = JSON.parse(readFileSync(idlPath, 'utf-8'));

console.log('Creating Codama tree from Anchor IDL...');
const codama = createFromRoot(rootNodeFromAnchor(idl));

console.log('Rendering JavaScript client...');
const outputDir = resolve(__dirname, '../src/generated');

codama.accept(renderVisitor(outputDir));

console.log('Done! Generated client at:', outputDir);
