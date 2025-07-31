//renderer.js
const ipc = window.ipcRenderer; // 從 preload.js 暴露的 ipcRenderer

const versionSelect = document.getElementById('versionSelect');
const installPath = document.getElementById('installPath');
const choosePathBtn = document.getElementById('choosePathBtn');
const eulaCheckbox = document.getElementById('eulaCheckbox');
const onlineModeCheckbox = document.getElementById('onlineModeCheckbox');
const memorySlider = document.getElementById('memorySlider');
const memoryValue = document.getElementById('memoryValue');
const progressBar = document.getElementById('progressBar');
const stateText = document.getElementById('stateText');
const createServerBtn = document.getElementById('createServerBtn');
const coreSelect = document.getElementById('coreSelect');


choosePathBtn.addEventListener('click', async () => {
  const result = await ipc.invoke('open-folder-dialog'); // 修改這裡
  if (result) {
    installPath.value = result;
  }
});

memorySlider.addEventListener('input', () => {
  memoryValue.textContent = memorySlider.value;
});

// 在 createServerBtn 上方加 debug 勾選框
const debugCheckbox = document.createElement('input');
debugCheckbox.type = 'checkbox';
debugCheckbox.id = 'debugCheckbox';
const debugLabel = document.createElement('label');
debugLabel.appendChild(debugCheckbox);
debugLabel.appendChild(document.createTextNode(' 啟用 Debug 模式（下載資訊將顯示於終端機）'));
createServerBtn.parentNode.insertBefore(debugLabel, createServerBtn);

createServerBtn.addEventListener('click', () => {
  if (!installPath.value) {
    alert('請先選擇安裝路徑！');
    return;
  }
  const data = {
    version: versionSelect.value,
    path: installPath.value,
    eula: eulaCheckbox.checked,
    onlineMode: onlineModeCheckbox.checked,
    memory: memorySlider.value,
    core: coreSelect.value,
    debug: debugCheckbox.checked
    // plugins 移除
  };

  ipc.invoke('create-server', data);
  stateText.textContent = '下載中...';
});

ipc.on('download-progress', (event, percent) => { // 修改這裡
  progressBar.value = percent;
});

ipc.on('state-update', (event, msg) => { // 修改這裡
  stateText.textContent = msg;
});

async function loadMinecraftVersions() {
    try {
        const versions = await ipc.fetchMinecraftVersions(); // 調用主進程的函數
        versionSelect.innerHTML = ''; // 清空現有選項
        if (versions && versions.length > 0) {
            versions.forEach(version => {
                const option = document.createElement('option');
                option.value = version;
                option.textContent = version;
                versionSelect.appendChild(option);
            });
            stateText.textContent = `已載入 ${versions.length} 個 Minecraft 版本。`;
        } else {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = '無法載入版本';
            versionSelect.appendChild(option);
            stateText.textContent = '無法載入 Minecraft 版本。';
        }
    } catch (error) {
        console.error('載入版本失敗：', error);
        const option = document.createElement('option');
        option.value = '';
        option.textContent = '載入錯誤';
        versionSelect.appendChild(option);
        stateText.textContent = '載入 Minecraft 版本時發生錯誤。';
    }
}
window.addEventListener('DOMContentLoaded', loadMinecraftVersions);