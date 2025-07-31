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
    const { version, path: installPath } = data;

    try {
      const jarUrl = await fetchServerJarUrl(version);
      const jarPath = path.join(installPath, 'server.jar');

      await downloadFile(jarUrl, jarPath, (progress) => {
        event.sender.send('download-progress', progress);
      });

      event.sender.send('state-update', '下載完成 ✅');
    } catch (err) {
      console.error('下載失敗：', err);
      event.sender.send('state-update', '下載失敗 ❌');
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
