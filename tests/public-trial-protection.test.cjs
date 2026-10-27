const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { verifyBuild } = require('../verify-build.cjs');
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'medical-public-'));
  t.after(() => fs.rmSync(root, {recursive:true, force:true}));
  const script = path.join(root, '_expo/static/js/web/index-test.js');
  fs.mkdirSync(path.dirname(script),{recursive:true});
  fs.writeFileSync(script,'dyspnea edema tachycardia');
  fs.writeFileSync(path.join(root,'index.html'),'<script src="/medical-english-trial/_expo/static/js/web/index-test.js" defer></script>');
  return {root,script};
}
test('三术语样例及首页脚本引用通过',t=>{
 const {root}=fixture(t); assert.equal(verifyBuild(root).files,2);
});
for(const name of ['course.json','source.map','.env','backup.zip','textbook.pdf']) {
 test('拒绝额外公开文件：'+name,t=>{
  const {root}=fixture(t);fs.writeFileSync(path.join(root,name),'test');
  assert.throws(()=>verifyBuild(root),/白名单/);
 });
}
test('拒绝已知完整课程标识',t=>{
 const {root,script}=fixture(t);fs.appendFileSync(script,' u66-7-stage-1');assert.throws(()=>verifyBuild(root),/禁止标识/);
});
test('拒绝超过样例预算的脚本',t=>{
 const {root,script}=fixture(t);fs.appendFileSync(script,'x'.repeat(800000));assert.throws(()=>verifyBuild(root),/体积/);
});
test('拒绝构建内文件链接和链接根目录',t=>{
 const {root,script}=fixture(t);const link=root+'-link';t.after(()=>fs.rmSync(link,{force:true}));
 fs.symlinkSync(root,link);assert.throws(()=>verifyBuild(link),/普通目录/);
 fs.symlinkSync(script,path.join(root,'copy.js'));assert.throws(()=>verifyBuild(root),/符号链接/);
});
test('拒绝首页引用不存在或外部脚本',t=>{
 const {root}=fixture(t);
 for(const src of ['/missing.js','https://example.com/test.js','/medical-english-trial/_expo/static/js/web/missing.js']) {
  fs.writeFileSync(path.join(root,'index.html'),'<script src="'+src+'"></script>');assert.throws(()=>verifyBuild(root),/未知或不存在/);
 }
});
test('缺少术语或首页脚本引用时拒绝',t=>{
 const {root,script}=fixture(t);fs.writeFileSync(script,'edema');assert.throws(()=>verifyBuild(root),/样例术语/);
 fs.writeFileSync(path.join(root,'index.html'),'<html></html>');assert.throws(()=>verifyBuild(root),/没有引用/);
});
