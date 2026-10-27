const fs = require('node:fs');
const path = require('node:path');

const markers = ['u66-7-stage-1', 'u01-1', 'medenglish_sync', 'CLOUDBASE', 'pengbi', 'chapter-22'];
// 当前公开样例没有课程数据文件、源码映射、音视频和额外附件。
const allowed = /^(?:index\.html|404\.html|favicon\.ico|metadata\.json|\.nojekyll|_expo\/static\/js\/web\/[A-Za-z0-9_-]+\.js|_expo\/static\/css\/web\/[A-Za-z0-9_-]+\.css)$/;
function verifyBuild(input) {
  const root = path.resolve(input);
  if (!fs.lstatSync(root).isDirectory() || fs.lstatSync(root).isSymbolicLink()) throw new Error('构建根目录必须是普通目录');
  const files = [];
  function collect(dir) {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const name = path.join(dir, item.name);
      if (item.isSymbolicLink()) throw new Error('构建目录不得包含符号链接：' + path.relative(root, name));
      if (item.isDirectory()) collect(name);
      else if (item.isFile()) {
        if (!allowed.test(path.relative(root, name).split(path.sep).join('/'))) throw new Error('不在公开文件白名单：' + path.relative(root, name));
        files.push(name);
      } else throw new Error('构建目录存在非常规文件');
    }
  }
  collect(root);
  const indexPath = path.join(root, 'index.html');
  if (!files.includes(indexPath)) throw new Error('缺少首页');
  const scripts = files.filter(file => file.endsWith('.js'));
  if (scripts.length === 0) throw new Error('缺少网页脚本');
  let scriptContents = '';
  let bytes = 0;
  for (const file of files) {
    const size = fs.statSync(file).size;
    bytes += size;
    if (size > 800000 || bytes > 1500000) throw new Error('公开样例超过体积上限，必须重新核对内容');
    const contents = fs.readFileSync(file);
    for (const marker of markers) {
      if (contents.includes(Buffer.from(marker))) throw new Error('发现禁止标识：' + marker + '，文件：' + path.relative(root, file));
    }
    if (file.endsWith('.js')) scriptContents += contents.toString('utf8');
  }
  const html = fs.readFileSync(indexPath, 'utf8');
  const referenced = [...html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)];
  if (!referenced.length) throw new Error('首页没有引用网页脚本');
  for (const [, src] of referenced) {
    const match = src.match(/^(?:\/medical-english-trial)?\/?(_expo\/static\/js\/web\/[A-Za-z0-9_-]+\.js)$/);
    if (!match || !scripts.includes(path.join(root, match[1]))) throw new Error('首页引用未知或不存在的脚本');
  }
  for (const term of ['dyspnea', 'edema', 'tachycardia']) {
    if (!scriptContents.includes(term)) throw new Error('缺少样例术语：' + term);
  }
  return { files: files.length, bytes };
}
if (require.main === module) {
  try {
    const result = verifyBuild(process.argv[2] || path.join(__dirname, 'dist'));
    console.log('公开样例构建检查通过：' + result.files + '个白名单文件，' + result.bytes + '字节。检查不替代内容权利审核。');
  } catch (error) {
    console.error('公开样例构建检查失败：' + error.message);
    process.exitCode = 1;
  }
}
module.exports = { verifyBuild };
