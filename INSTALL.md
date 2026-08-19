# Netflix Quality Lock 安裝指引

這個 GitHub Release 是免費分發方式，不需要 Chrome Web Store、Edge Add-ons
或 Windows 管理員權限。Chrome、Edge、Brave 仍要求使用者手動開啟
Developer mode 並載入未封裝擴充功能。

## 下載

1. 開啟 [最新 Release](https://github.com/andys0919/Netflix-Quality-Lock/releases/latest)。
2. 下載 `Netflix-Quality-Lock-v1.1.2.zip`。
3. 將 ZIP 解壓縮到固定資料夾，例如 `Documents\Netflix-Quality-Lock`。

請不要直接選 ZIP 檔案；瀏覽器要載入的是解壓縮後、裡面直接包含
`manifest.json` 的資料夾。

## Chrome

1. 在網址列開啟 `chrome://extensions`。
2. 開啟右上角 **Developer mode**。
3. 按 **Load unpacked**。
4. 選擇解壓縮後包含 `manifest.json` 的資料夾。
5. 回到 Netflix 播放頁並重新整理分頁。

## Microsoft Edge

1. 在網址列開啟 `edge://extensions`。
2. 開啟左側或右上角的 **Developer mode**。
3. 按 **Load unpacked**。
4. 選擇解壓縮後包含 `manifest.json` 的資料夾。
5. 回到 Netflix 播放頁並重新整理分頁。

## Brave

1. 在網址列開啟 `brave://extensions`。
2. 開啟 **Developer mode**。
3. 按 **Load unpacked**。
4. 選擇解壓縮後包含 `manifest.json` 的資料夾。
5. 回到 Netflix 播放頁並重新整理分頁。

## 第一次使用

1. 開啟任一 Netflix `/watch/` 播放頁。
2. 播放影片。
3. 點擊瀏覽器工具列的 Netflix Quality Lock 圖示。
4. 選擇 Highest、720p、1080p、2K 或 4K。

選擇會儲存在瀏覽器的 extension storage。之後開始播放或自動進入下一集時，
插件會自動套用相同畫質，並在右上角顯示綠色確認訊息。

## 更新

1. 下載新的 Release ZIP。
2. 將新檔案解壓縮並覆蓋原本的安裝資料夾。
3. 在 `chrome://extensions`、`edge://extensions` 或 `brave://extensions`
   找到 Netflix Quality Lock，按 **Reload**。
4. 重新整理 Netflix 分頁。

請盡量維持同一個安裝資料夾，這樣瀏覽器能保留原本的插件設定。

## 常見問題

### 顯示找不到 manifest.json

你選到的是 ZIP 檔或外層資料夾。請往內找到直接包含 `manifest.json` 的資料夾，
再按 **Load unpacked**。

### 播放時沒有綠色確認訊息

先確認目前網址是 Netflix `/watch/` 播放頁，再重新整理分頁並開始播放。

### 為什麼不能從 GitHub 按一下直接安裝？

這是瀏覽器的安全限制。GitHub Release 可以免費提供下載，但一般 Windows/macOS
瀏覽器不允許網頁或 ZIP 檔案直接靜默安裝擴充功能；因此第一次仍需手動載入。
