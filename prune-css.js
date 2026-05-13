const fs = require('fs');
const postcss = require('postcss');

const cssPath = 'src/App.css';
const jsxPath = 'src/InvitationPage.js';
const css = fs.readFileSync(cssPath, 'utf8');
const jsx = fs.readFileSync(jsxPath, 'utf8');

const used = new Set();

function addClasses(str) {
  if (!str) return;
  str.split(/\s+/).forEach((c) => {
    if (/^[A-Za-z_][A-Za-z0-9_-]*$/.test(c)) used.add(c);
  });
}

for (const m of jsx.matchAll(/className\s*=\s*"([^"]+)"/g)) addClasses(m[1]);
for (const m of jsx.matchAll(/className\s*=\s*\{\s*"([^"]+)"\s*\}/g)) addClasses(m[1]);
for (const m of jsx.matchAll(/className\s*=\s*\{\s*`([^`]+)`\s*\}/g)) {
  const stripped = m[1].replace(/\$\{[^}]+\}/g, ' ');
  addClasses(stripped);
}
for (const m of jsx.matchAll(/["']([A-Za-z_][A-Za-z0-9_-]*)["']/g)) {
  used.add(m[1]);
}

function selectorClasses(selector) {
  const out = [];
  for (const m of selector.matchAll(/\.([A-Za-z_][A-Za-z0-9_-]*)/g)) out.push(m[1]);
  return out;
}

const root = postcss.parse(css);

function pruneNode(node) {
  if (node.type === 'rule') {
    const kept = [];
    for (const sel of node.selectors || []) {
      const classes = selectorClasses(sel);
      if (classes.length === 0 || classes.some((c) => used.has(c))) kept.push(sel);
    }
    if (!kept.length) {
      node.remove();
      return;
    }
    node.selectors = kept;
    return;
  }

  if (node.type === 'atrule') {
    // Always keep these top-level directives
    if (!node.nodes) return;
    [...node.nodes].forEach(pruneNode);
    if (!node.nodes.length) node.remove();
  }
}

[...root.nodes].forEach(pruneNode);

// Normalize excessive blank lines
let out = root.toString();
out = out.replace(/\n{3,}/g, '\n\n');

fs.writeFileSync(cssPath, out, 'utf8');
console.log('Pruned CSS written.');
console.log('Used classes detected:', used.size);
