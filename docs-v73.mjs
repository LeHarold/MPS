import fs from 'node:fs';const p='README.md';let s=fs.readFileSync(p,'utf8').replace('私人 GitHub 儲存庫保存程式、原始參考資料與測試','公開 GitHub 儲存庫保存程式、原始參考資料與測試').replace('GitHub 儲存庫的私人可見性不等於既有線上網站的存取限制。','GitHub Pages 目前公開提供使用。');s=s.replace('## 本機啟動','正式網站：https://leharold.github.io/MPS/\n\n## 本機啟動');s=s.replace('## 儲存及存取',`## 圓規、標籤與列印

- 尺規下拉選單包含直尺、圓形量角器與圓規，使用各工具實際外形的 SVG 圖示。
- 圓規點選圓心並輸入半徑；小十字圓心可點擊解鎖、拖動靠近可見點吸附。筆端雙擊按住拖動沿半徑畫弧，雙擊後直接放開則標點。
- 名稱與座標標籤長按後拖動，偏移隨專案保存。距離標籤沿線移動。
- 列印避讓僅移動標籤，保留文字尺寸；預設窄邊界（12.7 mm），另提供一般、適中、寬、無邊界和自訂。關閉頁尾後，地圖填滿所選邊界內。

## 離線打包

上方「打包離線網站」產生 ZIP，包含程式、向量圖資、所有目前圖層、儲存專案及已下載地形。排除衛星與街道圖磚；離線高度覆蓋範圍依已下載區域。

Windows 完整解壓後執行 MPS-Offline.exe，僅在 127.0.0.1 的 5278–5299 可用埠提供檔案並開啟瀏覽器，不需另裝 Node 或 Python。系統匣可退出服務。來源為 OfflineMPS.cs，使用 Windows .NET Framework 4 編譯；非 Windows 系統可用自己的 HTTP 伺服器開啟解壓後的目錄。瀏覽器資料不會寫回 ZIP，新增內容須另行儲存專案備份。

## 儲存及存取`);fs.writeFileSync(p,s);
