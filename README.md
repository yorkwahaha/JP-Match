# JP Match · 五十音配對

類似記憶翻牌的雙人（也可單人）五十音配對遊戲，適合平板與手機觸控遊玩。

## 線上遊玩

https://yorkwahaha.github.io/JP-Match/

## 怎麼玩

1. 選擇人數、配對模式、盤面大小、出題範圍後開始。
2. 每回合掀開兩張牌。
3. **配對成功**：取走兩張，**同一人可繼續翻**。
4. **配對失敗**：翻回背面，換下一個人。
5. 配對組數較多者獲勝。

## 配對模式

- 羅馬拼音 ↔ 平假名
- 平假名 ↔ 片假名
- 羅馬拼音 ↔ 片假名

## 出題範圍

可設定從哪一行到哪一行作為題池，例如：

- あ行～さ行（15 個）
- た行～は行（15 個）
- あ行～ぱ行（全部，預設）

題池數量須 ≥ 盤面組數，否則會提示並無法開始。

## 介面配色

可在首頁或遊戲選單隨時切換，並會記住上次選擇：

- **夜紺**：深藍夜色（預設）
- **水霧**：柔和淺藍
- **柚香**：柔和鵝黃色

每套配色有不同牌背紋理與印章造型。

## 盤面

預設 **8×4（16 組）**，也可改為 4×3、4×4、6×4、8×5、10×5。

## 啟動方式

用瀏覽器開啟 `index.html` 即可。若本機檔案有限制，可用任一靜態伺服器：

```bash
# Python
python -m http.server 5173

# 或 Node
npx --yes serve -p 5173
```

然後在瀏覽器或同網路的平板／手機開啟：

`http://localhost:5173`（手機請改成電腦的區網 IP）

## 音訊

| 路徑 | 用途 |
|------|------|
| `assets/audio/sfx/select.mp3` | 選項點擊 |
| `assets/audio/sfx/start.mp3` | 開始遊戲 |
| `assets/audio/sfx/flip.mp3` | 翻牌音效 |
| `assets/audio/sfx/match.mp3` | 配對成功 |
| `assets/audio/sfx/mismatch.mp3` | 配對失敗 |
| `assets/audio/bgm/*.mp3` | 背景音樂（開始遊戲時隨機選曲） |
| `assets/audio/kana/{romaji}.mp3` | 翻牌發音，如 `sa.mp3`、`shi.mp3` |

遊戲中的「選單」可開關：**翻牌發音**、**翻牌音效**、**背景音樂**，並可調整 **BGM 音量**。

## 專案結構

```
index.html
css/styles.css
js/kana.js      五十音資料與牌組產生
js/audio.js     音訊路徑與播放
js/game.js      遊戲流程與計分
assets/audio/
.github/workflows/pages.yml   推上 main 自動部署 GitHub Pages
```
