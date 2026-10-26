const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(process.argv[2] || path.join(__dirname, 'dist'));
const markers = ['u66-7-stage-1', 'u01-1', 'medenglish_sync', 'CLOUDBASE', 'pengbi', 'chapter-22'];
const files = [];

function collect(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const name = path.join(dir, item.name);
    if (item.isSymbolicLink()) throw new Error('构建目录不得包含符号链接：' + name);
    if (item.isDirectory()) collect(name);
    else if (item.isFile()) files.push(name);
  }
}

try {
  if (!fs.statSync(path.join(root, 'index.html')).isFile()) throw new Error('缺少首页');
  collect(root);
  const scripts = files.filter(file => file.endsWith('.js'));
  if (scripts.length === 0) throw new Error('缺少网页脚本');
  let scriptContents = '';
  for (const file of files) {
    const contents = fs.readFileSync(file);
    for (const marker of markers) {
      if (contents.includes(Buffer.from(marker))) throw new Error('发现禁止标识：' + marker + '，文件：' + path.relative(root, file));
    }
    if (file.endsWith('.js')) scriptContents += contents.toString('utf8');
  }
  for (const term of ['dyspnea', 'edema', 'tachycardia']) {
    if (!scriptContents.includes(term)) throw new Error('缺少样例术语：' + term);
  }
  console.log('公开样例构建检查通过：存在三个样例术语，未发现已知完整课程和云同步标识。仍须独立核对内容权利。');
} catch (error) {
  console.error('公开样例构建检查失败：' + error.message);
  process.exitCode = 1;
}
