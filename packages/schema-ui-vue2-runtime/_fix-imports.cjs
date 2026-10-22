const fs = require('fs');
const path = require('path');

const PKG = '/Users/hexiapeng/Documents/trae_projects/mcp-components/packages/schema-ui-vue2-runtime';
const SRC_ROOT = path.join(PKG, 'src');

function walk(dir) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else if (/\.(ts|vue)$/.test(name)) out.push(p);
  }
  return out;
}

function toPosix(p) { return p.split(path.sep).join('/'); }

const files = walk(SRC_ROOT);
console.log('扫描到 ' + files.length + ' 个文件\n');

let totalReplace = 0;
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  let count = 0;
  content = content.replace(/(['"`])@\/([^'"`\n]+)\1/g, (_m, quote, target) => {
    const absTarget = path.join(SRC_ROOT, target);
    let rel = path.relative(path.dirname(file), absTarget);
    rel = toPosix(rel);
    if (!rel.startsWith('.')) rel = './' + rel;
    count++;
    return quote + rel + quote;
  });
  if (count > 0) {
    totalReplace += count;
    console.log('- ' + path.relative(PKG, file) + ' 替换 ' + count + ' 处');
    fs.writeFileSync(file, content, 'utf8');
  }
}
console.log('\n总计替换: ' + totalReplace + ' 处');
