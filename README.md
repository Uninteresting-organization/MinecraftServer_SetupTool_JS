# 🧰 MinecraftServer_SetupTool_JS
一個由 Goblin 工程師手搓的 Minecraft Server 建置工具。 靈感來自 Evan0513，~~但這版比較會爆炸~~。

---

🧙‍♂️ 這是什麼？
這是一個用JavaScript（沒錯，就是 JS）打造的 Minecraft Server 建置工具。 原本是國小生的練習作品，現在被 Goblin 工程師魔改成一個能跑、能炸、能笑的工具。

你可以用它：

快速建立 Minecraft Server（理論上）

用 GUI 操作，不用手動敲指令（但你還是會想打開終端機）

體驗 Electron + HTML + JS 的混合魔法

🛠️ 如何使用？
安裝 Node.js

克隆這個儲存庫：

```bash 
git clone https://github.com/Uninteresting-organization/MinecraftServer_SetupTool_JS.git
cd MinecraftServer_SetupTool_JS
```
安裝依賴：

```bash
npm install
```
啟動工具：

```bash
npm start
```
### 📦 檔案結構

| 檔案名稱       | 功能說明                                 |
|----------------|------------------------------------------|
| `main.js`      | Electron 主進程，負責開啟窗口與處理邏輯   |
| `preload.js`   | 預載腳本，讓前端能安全地呼叫 Node API     |
| `renderer.js`  | 前端邏輯處理，連接 GUI 與功能             |
| `GUI.html`     | 使用者介面，簡單但有效                   |
| `package.json` | 專案設定與依賴管理                       |


---

⚠️ 注意事項
這個工具還在 Beta 階段，可能會炸。Goblin 工程師不保證穩定，但保證有趣。

如果你遇到 bug，請先笑一笑，再來信或開 issue。

有任何建議、吐槽、或 meme，歡迎聯繫我：salmonskate2256.yt@gmail.com

---

🧠 Credits
感謝 Evan0513 的原始專案。 這個版本是基於他的架構進行魔改與重構。

![爆炸等級](https://img.shields.io/badge/%F0%9F%92%A5-Beta-red)
![Goblin Certified](https://img.shields.io/badge/Goblin-Approved-green)
