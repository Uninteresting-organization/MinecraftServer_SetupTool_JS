//main.js
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');

function createWindow() {
  const win = new BrowserWindow({
    width: 600,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile('GUI.html');
}

app.whenReady().then(() => {
  createWindow();

  ipcMain.handle('open-folder-dialog', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    return result.filePaths[0] || null;
  });

  ipcMain.handle('create-server', async (event, data) => {
    const { version, path: installPath, core, memory, debug } = data;

    // log.txt 寫入工具
    const logPath = path.join(installPath, 'log.txt');
    function log(msg) {
      fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);
    }
    log(`開始建立伺服器，版本: ${version}，核心: ${core}，插件: ${(data.plugins||[]).join(',')}`);

    try {
      let jarUrl;
      if (core === 'paper') {
        jarUrl = await fetchPaperJarUrl(version);
      } else {
        jarUrl = await fetchServerJarUrl(version);
      }
      const jarPath = path.join(installPath, 'server.jar');

      // 若 server.jar 已存在，先刪除再下載
      if (fs.existsSync(jarPath)) {
        fs.unlinkSync(jarPath);
        log('刪除舊的 server.jar');
      }

      log(`下載伺服器核心: ${jarUrl}`);
      await downloadFile(jarUrl, jarPath, (progress) => {
        event.sender.send('download-progress', progress);
      });
      log('伺服器核心下載完成');

      // Debug 模式：印出 jar 資訊
      if (debug) {
        const stat = fs.statSync(jarPath);
        const buf = fs.readFileSync(jarPath);
        log(`DEBUG: server.jar 檔案大小: ${stat.size} bytes`);
        log(`DEBUG: server.jar 前 100 bytes: ${buf.slice(0, 100).toString()}`);
      }

      // 自動產生 start.bat
      const batContent = `@echo off\njava -Xmx${memory}M -jar server.jar --nogui\npause\n`;
      const batPath = path.join(installPath, 'start.bat');
      fs.writeFileSync(batPath, batContent, 'utf8');
      log('產生 start.bat');

      // 自動產生 eula.txt
      const eulaPath = path.join(installPath, 'eula.txt');
      fs.writeFileSync(eulaPath, 'eula=true\n', 'utf8');
      log('產生 eula.txt');

      event.sender.send('state-update', '下載完成 ✅');
      log('全部完成');
    } catch (err) {
      console.error('下載失敗：', err);
      event.sender.send('state-update', '下載失敗 ❌');
      log(`錯誤: ${err}`);
    }
  });
});
  ipcMain.handle('fetch-minecraft-versions', async () => {
    const versionMetaUrl = 'https://launchermeta.mojang.com/mc/game/version_manifest.json';
    try {
      const versionList = await fetchJson(versionMetaUrl);
      // 我們通常只關心 'release' 版本的伺服器，可以篩選掉 'snapshot', 'old_beta', 'old_alpha' 等
      // 並按版本號倒序排序，讓最新版本在前面
      const releases = versionList.versions
                        .filter(v => v.type === 'release')
                        .sort((a, b) => {
                          // 簡易的版本號排序，實際生產環境可能需要更複雜的版本解析庫
                          const [aMajor, aMinor, aPatch] = a.id.split('.').map(Number);
                          const [bMajor, bMinor, bPatch] = b.id.split('.').map(Number);

                          if (aMajor !== bMajor) return bMajor - aMajor;
                          if (aMinor !== bMinor) return bMinor - aMinor;
                          return bPatch - aPatch;
                        });
      return releases.map(v => v.id); // 只返回版本號 ID
    } catch (error) {
      console.error('無法獲取 Minecraft 版本列表：', error);
      return []; // 出錯時返回空數組
    }
  });
async function fetchServerJarUrl(version) {
  const versionMetaUrl = 'https://launchermeta.mojang.com/mc/game/version_manifest.json';

  const versionList = await fetchJson(versionMetaUrl);
  const target = versionList.versions.find(v => v.id === version);
  if (!target) throw new Error('找不到該版本');

  const versionDetail = await fetchJson(target.url);
  const serverUrl = versionDetail.downloads.server.url;

  return serverUrl;
}

async function fetchPaperJarUrl(version) {
  // 取得 Paper 支援的所有 Minecraft 版本
  const projectUrl = 'https://api.papermc.io/v2/projects/paper';
  const projectData = await fetchJson(projectUrl);
  if (!projectData.versions.includes(version)) {
    throw new Error('Paper 不支援此 Minecraft 版本');
  }
  // 取得該版本所有 build
  const buildsUrl = `https://api.papermc.io/v2/projects/paper/versions/${version}/builds`;
  const buildsData = await fetchJson(buildsUrl);
  // buildsData.builds 是一個 build 物件陣列或 build number 陣列
  let buildNumber;
  if (Array.isArray(buildsData.builds)) {
    const last = buildsData.builds[buildsData.builds.length - 1];
    buildNumber = typeof last === 'object' ? last.build : last;
  } else {
    throw new Error('無法取得 Paper build 資訊');
  }
  const jarName = `paper-${version}-${buildNumber}.jar`;
  return `https://api.papermc.io/v2/projects/paper/versions/${version}/builds/${buildNumber}/downloads/${jarName}`;
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

function downloadFile(url, dest, onProgress) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, res => {
      const total = parseInt(res.headers['content-length'], 10);
      let downloaded = 0;

      res.on('data', chunk => {
        downloaded += chunk.length;
        if (onProgress) onProgress((downloaded / total) * 100);
      });

      res.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', err => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
