/**
 * 版本更新脚本
 * 使用方法：
 * node scripts/update-version.js [patch|minor|major]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 获取版本类型参数
const versionType = process.argv[2] || 'patch';
if (!['patch', 'minor', 'major'].includes(versionType)) {
  console.error('版本类型必须是 patch、minor 或 major');
  process.exit(1);
}

try {
  // 路径
  const rootDir = path.resolve(__dirname, '..');
  const appJsonPath = path.join(rootDir, 'app.json');
  const versionFilePath = path.join(rootDir, 'config', 'version.ts');
  
  // 读取当前 app.json
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  const currentVersion = appJson.expo.version;
  const currentBuildNumber = appJson.expo.android.versionCode;
  
  // 解析版本号
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  
  // 计算新版本号
  let newMajor = major;
  let newMinor = minor;
  let newPatch = patch;
  
  if (versionType === 'major') {
    newMajor += 1;
    newMinor = 0;
    newPatch = 0;
  } else if (versionType === 'minor') {
    newMinor += 1;
    newPatch = 0;
  } else {
    newPatch += 1;
  }
  
  // 新版本号
  const newVersion = `${newMajor}.${newMinor}.${newPatch}`;
  const newBuildNumber = currentBuildNumber + 1;
  
  // 更新 app.json
  appJson.expo.version = newVersion;
  appJson.expo.android.versionCode = newBuildNumber;
  if (appJson.expo.ios) {
    appJson.expo.ios.buildNumber = String(newBuildNumber);
  }
  
  // 写入 app.json
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2), 'utf8');
  console.log(`✅ app.json 版本已更新: ${currentVersion} -> ${newVersion} (构建号: ${newBuildNumber})`);
  
  // 更新 version.ts
  const versionFileContent = fs.readFileSync(versionFilePath, 'utf8');
  
  // 替换版本信息
  const updatedVersionContent = versionFileContent
    .replace(/VERSION: ['"][\d\.]+['"]/, `VERSION: '${newVersion}'`)
    .replace(/BUILD_NUMBER: ['"][\d\.]+['"]/, `BUILD_NUMBER: '${newBuildNumber}'`);
  
  fs.writeFileSync(versionFilePath, updatedVersionContent, 'utf8');
  console.log(`✅ config/version.ts 版本已更新: ${currentVersion} -> ${newVersion}`);
  
  // 创建提交和标签
  console.log('正在创建提交和标签...');
  execSync(`git add app.json config/version.ts`, { stdio: 'inherit' });
  execSync(`git commit -m "chore: 更新版本到 ${newVersion} [ci skip]"`, { stdio: 'inherit' });
  execSync(`git tag -a v${newVersion} -m "v${newVersion}"`, { stdio: 'inherit' });
  
  console.log(`
✅ 完成! 版本已更新到 ${newVersion} (构建号: ${newBuildNumber})

下一步:
  1. 推送更改到远程: git push origin master
  2. 推送标签以触发构建: git push origin v${newVersion}
  `);
  
} catch (error) {
  console.error('更新版本时出错:', error);
  process.exit(1);
} 