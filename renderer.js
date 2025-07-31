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


choosePathBtn.addEventListener('click', async () => {
  const result = await ipc.invoke('open-folder-dialog'); // 修改這裡
  if (result) {
    installPath.value = result;
  }
});

memorySlider.addEventListener('input', () => {
  memoryValue.textContent = memorySlider.value;
});

createServerBtn.addEventListener('click', () => {
  const data = {
    version: versionSelect.value,
    path: installPath.value,
    eula: eulaCheckbox.checked,
    onlineMode: onlineModeCheckbox.checked,
    memory: memorySlider.value
  };

  ipc.invoke('create-server', data); // 修改這裡
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