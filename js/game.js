(() => {
  const {
    PAIR_MODES: KANA_PAIR_MODES,
    GRID_PRESETS,
    DEFAULT_GRID_ID,
    ROWS,
    DEFAULT_ROW_FROM,
    DEFAULT_ROW_TO,
    RANGE_PRESETS,
    DEFAULT_RANGE_PRESET,
    getKanaInRange,
    normalizeRowRange,
    buildDeck: buildKanaDeck,
  } = window.JPMatchData;
  const {
    CATEGORIES: WORD_CATEGORIES,
    DEFAULT_CATEGORY: DEFAULT_WORD_CATEGORY,
    PAIR_MODES: WORD_PAIR_MODES,
    getWordsInCategory,
    buildDeck: buildWordDeck,
  } = window.JPMatchWords;
  const Sound = window.JPMatchAudio;

  const MISMATCH_HOLD_MS = 900;
  const MATCH_HOLD_MS = 280;
  const PLAYER_NAMES = ["玩家 1", "玩家 2"];
  const THEME_STORAGE_KEY = "jp-match-theme";
  const WORD_VOICE_STORAGE_KEY = "jp-match-word-voice";
  const THEMES = {
    night: { id: "night", label: "夜紺", meta: "#142033" },
    mist: { id: "mist", label: "水霧", meta: "#8fb4c8" },
    yuzu: { id: "yuzu", label: "柚香", meta: "#cbb887" },
  };
  const DEFAULT_THEME = "night";
  const DEFAULT_KIND = "kana";

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function safeAssetSrc(src) {
    const value = String(src || "");
    if (/^assets\/[a-z0-9_./-]+$/i.test(value) && value.indexOf("..") === -1) {
      return value;
    }
    return "";
  }

  const state = {
    screen: "setup",
    players: 2,
    kind: DEFAULT_KIND,
    pairMode: "romaji-hira",
    gridId: DEFAULT_GRID_ID,
    rowFrom: DEFAULT_ROW_FROM,
    rowTo: DEFAULT_ROW_TO,
    rangePreset: DEFAULT_RANGE_PRESET,
    wordCategory: DEFAULT_WORD_CATEGORY,
    theme: DEFAULT_THEME,
    deck: [],
    flipped: [],
    pendingClose: [],
    mismatchTimer: null,
    matched: new Set(),
    matchTraces: [],
    scores: [0, 0],
    currentPlayer: 0,
    lock: false,
    moves: 0,
    startedAt: null,
    completedAt: null,
    ended: false,
    // 每次開局遞增；async 流程 await 回來須比對，避免舊局殘留的回呼污染新局
    runId: 0,
  };

  const els = {
    setup: document.getElementById("setup-screen"),
    game: document.getElementById("game-screen"),
    result: document.getElementById("result-screen"),
    board: document.getElementById("board"),
    turnBanner: document.getElementById("turn-banner"),
    scoreP1: document.getElementById("score-p1"),
    scoreP2: document.getElementById("score-p2"),
    scoreSolo: document.getElementById("score-solo"),
    remaining: document.getElementById("remaining"),
    remainingSolo: document.getElementById("remaining-solo"),
    hudDual: document.getElementById("hud-dual"),
    hudSolo: document.getElementById("hud-solo"),
    modeChip: document.getElementById("mode-chip"),
    btnSettle: document.getElementById("btn-settle"),
    resultTitle: document.getElementById("result-title"),
    resultScoreboard: document.getElementById("result-scoreboard"),
    resultNameP1: document.getElementById("result-name-p1"),
    resultNameP2: document.getElementById("result-name-p2"),
    resultScoreP1: document.getElementById("result-score-p1"),
    resultScoreP2: document.getElementById("result-score-p2"),
    resultMeta: document.getElementById("result-meta"),
    menuOverlay: document.getElementById("menu-overlay"),
    optVoice: document.getElementById("opt-voice"),
    optWordVoice: document.getElementById("opt-word-voice"),
    optSfx: document.getElementById("opt-sfx"),
    optBgm: document.getElementById("opt-bgm"),
    optBgmVolume: document.getElementById("opt-bgm-volume"),
    rowFrom: document.getElementById("row-from"),
    rowTo: document.getElementById("row-to"),
    rangeHint: document.getElementById("range-hint"),
    wordHint: document.getElementById("word-hint"),
    fieldKanaRange: document.getElementById("field-kana-range"),
    fieldWordCategory: document.getElementById("field-word-category"),
    selMode: document.getElementById("sel-mode"),
    selGrid: document.getElementById("sel-grid"),
    selRangePreset: document.getElementById("sel-range-preset"),
    selWordCategory: document.getElementById("sel-word-category"),
    selTheme: document.getElementById("sel-theme"),
    selWordVoice: document.getElementById("sel-word-voice"),
    btnStart: document.getElementById("btn-start"),
  };

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function currentModes() {
    return state.kind === "words" ? WORD_PAIR_MODES : KANA_PAIR_MODES;
  }

  function currentMode() {
    return currentModes()[state.pairMode];
  }

  function getGrid() {
    return (
      GRID_PRESETS.find((g) => g.id === state.gridId) ||
      GRID_PRESETS.find((g) => g.id === DEFAULT_GRID_ID)
    );
  }

  function pairCount() {
    const g = getGrid();
    return (g.cols * g.rows) / 2;
  }

  function poolSize() {
    if (state.kind === "words") {
      return getWordsInCategory(state.wordCategory).length;
    }
    return getKanaInRange(state.rowFrom, state.rowTo).length;
  }

  function loadSavedTheme() {
    try {
      const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (saved && THEMES[saved]) return saved;
    } catch (err) {
      /* ignore */
    }
    return DEFAULT_THEME;
  }

  function applyTheme(themeId, opts) {
    const theme = THEMES[themeId] || THEMES[DEFAULT_THEME];
    state.theme = theme.id;
    document.documentElement.dataset.theme = theme.id;
    const meta = document.getElementById("meta-theme-color");
    if (meta) meta.setAttribute("content", theme.meta);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme.id);
    } catch (err) {
      /* ignore */
    }
    if (!(opts && opts.silent)) {
      syncThemeUI();
    }
  }

  function syncThemeUI() {
    qsa('[data-group="theme-menu"] .opt').forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.value === state.theme);
    });
    if (els.selTheme) els.selTheme.value = state.theme;
  }

  function loadSavedWordVoice() {
    try {
      const saved = window.localStorage.getItem(WORD_VOICE_STORAGE_KEY);
      if (saved && Sound.wordVoices[saved]) return saved;
    } catch (err) {
      /* ignore */
    }
    return Sound.defaultWordVoice;
  }

  function applyWordVoice(voiceId) {
    const id = Sound.wordVoices[voiceId] ? voiceId : Sound.defaultWordVoice;
    Sound.setWordVoice(id);
    try {
      window.localStorage.setItem(WORD_VOICE_STORAGE_KEY, id);
    } catch (err) {
      /* ignore */
    }
    syncWordVoiceUI();
  }

  function syncWordVoiceUI() {
    if (els.selWordVoice) els.selWordVoice.value = Sound.settings.wordVoice;
    if (els.optWordVoice) els.optWordVoice.value = Sound.settings.wordVoice;
  }

  function syncAudioSettings() {
    Sound.setVoice(els.optVoice.checked);
    Sound.setSfx(els.optSfx.checked);
    Sound.setBgmVolume(Number(els.optBgmVolume.value) / 100);
    Sound.setBgm(els.optBgm.checked);
  }

  function syncMenuUI() {
    els.optVoice.checked = Sound.settings.voice;
    els.optSfx.checked = Sound.settings.sfx;
    els.optBgm.checked = Sound.settings.bgm;
    els.optBgmVolume.value = String(Math.round(Sound.settings.bgmVolume * 100));
    syncWordVoiceUI();
    syncThemeUI();
  }

  let menuReturnFocus = null;

  function openMenu() {
    if (state.screen !== "game" || state.ended) return;
    syncMenuUI();
    menuReturnFocus = document.activeElement;
    els.menuOverlay.hidden = false;
    requestAnimationFrame(() => {
      const closeButton = qs("#btn-menu-close");
      if (closeButton) closeButton.focus();
    });
  }

  function closeMenu() {
    const wasOpen = !els.menuOverlay.hidden;
    els.menuOverlay.hidden = true;
    if (
      wasOpen &&
      state.screen === "game" &&
      menuReturnFocus &&
      menuReturnFocus.isConnected
    ) {
      menuReturnFocus.focus();
    }
    menuReturnFocus = null;
  }

  function showScreen(name) {
    state.screen = name;
    els.setup.hidden = name !== "setup";
    els.game.hidden = name !== "game";
    els.result.hidden = name !== "result";
    document.body.dataset.screen = name;
    closeMenu();

    if (name === "setup") {
      Sound.stopBgm();
      if (Sound.stopReading) Sound.stopReading();
    }
  }

  function syncSetupUI() {
    qsa('[data-group="players"] .opt').forEach((btn) => {
      btn.classList.toggle("is-active", Number(btn.dataset.value) === state.players);
    });
    qsa('[data-group="kind"] .opt').forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.value === state.kind);
    });
    if (els.selMode) els.selMode.value = state.pairMode;
    if (els.selGrid) els.selGrid.value = state.gridId;
    if (els.selWordCategory) els.selWordCategory.value = state.wordCategory;
    if (els.selRangePreset) els.selRangePreset.value = state.rangePreset || "";
    if (els.rowFrom) els.rowFrom.value = state.rowFrom;
    if (els.rowTo) els.rowTo.value = state.rowTo;

    const isWords = state.kind === "words";
    if (els.fieldKanaRange) els.fieldKanaRange.hidden = isWords;
    if (els.fieldWordCategory) els.fieldWordCategory.hidden = !isWords;

    syncThemeUI();
    syncWordVoiceUI();
    syncPoolHint();
  }

  function syncPoolHint() {
    const size = poolSize();
    const need = pairCount();
    const ok = size >= need;
    const hintEl = state.kind === "words" ? els.wordHint : els.rangeHint;
    if (!els.btnStart) return;

    let text = "";
    if (state.kind === "words") {
      if (!ok) {
        text = "目前盤面需 " + need + " 組，請縮小盤面或選擇更多單字";
      }
    } else {
      const range = normalizeRowRange(state.rowFrom, state.rowTo);
      const fromLabel = ROWS[range.from].label;
      const toLabel = ROWS[range.to].label;
      const same = range.from === range.to;
      text =
        (same ? fromLabel : fromLabel + "～" + toLabel) +
        " · 題池 " +
        size +
        " 個假名";
      if (!ok) {
        text += " · 目前盤面需 " + need + " 組，請縮小盤面或擴大範圍";
      }
    }
    if (hintEl) {
      hintEl.textContent = text;
      hintEl.hidden = state.kind === "words" && ok;
      hintEl.classList.toggle("is-warn", !ok);
    }
    if (els.rangeHint && hintEl !== els.rangeHint) {
      els.rangeHint.classList.remove("is-warn");
    }
    if (els.wordHint && hintEl !== els.wordHint) {
      els.wordHint.classList.remove("is-warn");
    }
    els.btnStart.disabled = !ok;
  }

  function startGame() {
    if (poolSize() < pairCount()) {
      syncPoolHint();
      return;
    }
    syncAudioSettings();
    Sound.unlock();
    Sound.playSfx("start");
    const grid = getGrid();
    if (state.kind === "words") {
      state.deck = buildWordDeck(state.pairMode, pairCount(), {
        category: state.wordCategory,
      });
    } else {
      state.deck = buildKanaDeck(state.pairMode, pairCount(), {
        fromRow: state.rowFrom,
        toRow: state.rowTo,
      });
    }
    if (state.kind === "words" && Sound.preloadWords) {
      Sound.preloadWords(state.deck.map((card) => card.voiceKey).filter(Boolean));
    }
    clearMismatchTimer();
    clearTurnSwitchFeedback();
    state.flipped = [];
    state.pendingClose = [];
    state.matched = new Set();
    state.matchTraces = [];
    state.scores = [0, 0];
    state.currentPlayer = 0;
    state.lock = false;
    state.moves = 0;
    state.startedAt = Date.now();
    state.completedAt = null;
    state.ended = false;
    state.runId += 1;

    els.btnSettle.hidden = true;
    els.modeChip.hidden = false;

    els.board.style.setProperty("--cols", String(grid.cols));
    els.board.style.setProperty("--rows", String(grid.rows));
    document.body.dataset.players = String(state.players);
    document.body.dataset.turn = "0";

    const mode = currentMode();
    els.modeChip.textContent = mode ? mode.label : "";
    renderBoard();
    updateHud();
    showScreen("game");
    scheduleCordRender();
    Sound.startBgm();
  }

  function faceDownLabel(index) {
    return "卡牌 " + (index + 1) + "（未翻開）";
  }

  function renderBoard() {
    els.board.innerHTML = "";
    const cordLayer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    cordLayer.classList.add("pair-cords");
    cordLayer.setAttribute("aria-hidden", "true");
    cordLayer.setAttribute("preserveAspectRatio", "none");
    els.board.appendChild(cordLayer);
    const frag = document.createDocumentFragment();

    state.deck.forEach((card, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "card";
      btn.dataset.index = String(index);
      btn.dataset.side = card.side;
      btn.setAttribute("aria-label", faceDownLabel(index));

      const isImg = card.display === "img";
      const isPic = card.display === "pic" || (card.side === "pic" && !isImg);
      const isSymbol = card.display === "symbol";
      let contentHtml;
      if (isSymbol) {
        const compact = card.text.length > 2 ? " is-compact" : "";
        const stacked = card.picSub ? " is-stacked" : "";
        contentHtml =
          '<span class="card-symbol' +
          compact +
          stacked +
          '">' +
          '<span class="card-symbol-main">' +
          escapeHtml(card.text) +
          "</span>" +
          (card.picSub
            ? '<span class="card-symbol-sub">' +
              escapeHtml(card.picSub) +
              "</span>"
            : "") +
          "</span>";
      } else if (isImg || isPic) {
        if (isImg) {
          const src = safeAssetSrc(card.text);
          contentHtml = src
            ? '<img class="card-img" src="' +
              escapeHtml(src) +
              '" alt="" draggable="false" />'
            : '<span class="card-text">?</span>';
        } else {
          contentHtml =
            '<span class="card-emoji" aria-hidden="true">' +
            escapeHtml(card.text) +
            "</span>";
        }
      } else {
        contentHtml =
          '<span class="card-text' +
          (card.text.length > 1 ? " is-compact" : "") +
          '">' +
          escapeHtml(card.text) +
          "</span>";
      }

      btn.innerHTML =
        '<span class="card-inner">' +
        '<span class="card-face card-back" aria-hidden="true">' +
        '<span class="card-back-pattern"></span>' +
        '<span class="seal"><span class="seal-ring"></span></span>' +
        "</span>" +
        '<span class="card-face card-front" data-side="' +
        escapeHtml(card.side) +
        '">' +
        '<span class="card-front-frame"></span>' +
        contentHtml +
        "</span></span>";
      btn.addEventListener("click", () => onCardTap(index));
      frag.appendChild(btn);
    });

    els.board.appendChild(frag);
  }

  function createSvgElement(name, attrs) {
    const element = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.keys(attrs || {}).forEach((key) => {
      element.setAttribute(key, String(attrs[key]));
    });
    return element;
  }

  function renderMatchCords() {
    const layer = qs(".pair-cords", els.board);
    if (!layer || !state.matchTraces.length || state.screen !== "game") {
      if (layer) layer.innerHTML = "";
      return;
    }

    const boardRect = els.board.getBoundingClientRect();
    if (!boardRect.width || !boardRect.height) return;
    layer.setAttribute("viewBox", "0 0 " + boardRect.width + " " + boardRect.height);
    layer.innerHTML = "";

    state.matchTraces.forEach((trace, traceIndex) => {
      const cardA = cardEl(trace.a);
      const cardB = cardEl(trace.b);
      if (!cardA || !cardB) return;
      const rectA = cardA.getBoundingClientRect();
      const rectB = cardB.getBoundingClientRect();
      const ax = rectA.left - boardRect.left + rectA.width / 2;
      const ay = rectA.top - boardRect.top + rectA.height / 2;
      const bx = rectB.left - boardRect.left + rectB.width / 2;
      const by = rectB.top - boardRect.top + rectB.height / 2;
      const mx = (ax + bx) / 2;
      const my = (ay + by) / 2;
      const distance = Math.hypot(bx - ax, by - ay);
      const bend = Math.min(88, Math.max(20, distance * 0.18));
      const controlY = my + (trace.player === 0 ? -bend : bend);
      const edgeX = trace.player === 0 ? 2 : boardRect.width - 2;
      const edgeY = 2;
      const pairPath =
        "M " + ax + " " + ay +
        " Q " + mx + " " + controlY + " " + bx + " " + by +
        " M " + mx + " " + my +
        " Q " + ((mx + edgeX) / 2) + " " + Math.max(8, my * 0.22) + " " + edgeX + " " + edgeY;
      const ownerClass = trace.player === 0 ? "is-p1" : "is-p2";
      const ageClass = traceIndex === state.matchTraces.length - 1 ? " is-latest" : "";
      const path = createSvgElement("path", {
        d: pairPath,
        class: "pair-cord " + ownerClass + ageClass,
        "vector-effect": "non-scaling-stroke",
      });
      layer.appendChild(path);

      if (Date.now() - trace.createdAt < 900) {
        layer.appendChild(
          createSvgElement("path", {
            d: pairPath,
            class: "pair-cord-draw " + ownerClass,
            pathLength: "100",
            "vector-effect": "non-scaling-stroke",
          })
        );
      }

      [
        [ax, ay],
        [bx, by],
      ].forEach(([x, y]) => {
        if (trace.player === 0) {
          const size = 7;
          layer.appendChild(
            createSvgElement("polygon", {
              points: [x + "," + (y - size), (x + size) + "," + y, x + "," + (y + size), (x - size) + "," + y].join(" "),
              class: "pair-anchor " + ownerClass,
            })
          );
        } else {
          layer.appendChild(
            createSvgElement("rect", {
              x: x - 6,
              y: y - 6,
              width: 12,
              height: 12,
              class: "pair-anchor " + ownerClass,
            })
          );
        }
      });
    });
  }

  let cordRenderFrame = null;
  function scheduleCordRender() {
    if (cordRenderFrame != null) cancelAnimationFrame(cordRenderFrame);
    cordRenderFrame = requestAnimationFrame(() => {
      cordRenderFrame = null;
      renderMatchCords();
    });
  }

  function cardEl(index) {
    return els.board.querySelector('[data-index="' + index + '"]');
  }

  function updateHud(opts) {
    const left = state.deck.length / 2 - state.matched.size;
    els.remaining.textContent = String(left);
    if (els.remainingSolo) els.remainingSolo.textContent = String(left);

    if (state.players === 1) {
      els.hudDual.hidden = true;
      els.hudSolo.hidden = false;
      els.scoreSolo.textContent = String(state.scores[0]);
      els.turnBanner.textContent = "自由練習 · 配對取走";
      els.turnBanner.classList.remove("is-p2");
      document.body.dataset.turn = "";
      clearTurnSwitchFeedback();
      return;
    }

    els.hudDual.hidden = false;
    els.hudSolo.hidden = true;
    els.scoreP1.querySelector(".score-name").textContent = PLAYER_NAMES[0];
    els.scoreP2.querySelector(".score-name").textContent = PLAYER_NAMES[1];
    els.scoreP1.querySelector(".score-num").textContent = String(state.scores[0]);
    els.scoreP2.querySelector(".score-num").textContent = String(state.scores[1]);
    els.scoreP1.classList.toggle("is-active", state.currentPlayer === 0);
    els.scoreP2.classList.toggle("is-active", state.currentPlayer === 1);

    els.turnBanner.textContent = PLAYER_NAMES[state.currentPlayer] + " 的回合";
    els.turnBanner.classList.toggle("is-p2", state.currentPlayer === 1);
    document.body.dataset.turn = String(state.currentPlayer);

    if (opts && opts.turnSwitched) {
      clearTurnSwitchFeedback();
      // 重觸發動畫
      void document.body.offsetWidth;
      document.body.classList.add("turn-switched");
      updateHud._switchTimer = window.setTimeout(() => {
        document.body.classList.remove("turn-switched");
        updateHud._switchTimer = null;
      }, 1600);
    }
  }

  function clearTurnSwitchFeedback() {
    window.clearTimeout(updateHud._switchTimer);
    updateHud._switchTimer = null;
    document.body.classList.remove("turn-switched");
  }

  function clearMismatchTimer() {
    if (state.mismatchTimer == null) return;
    clearTimeout(state.mismatchTimer);
    state.mismatchTimer = null;
  }

  function closePendingCards() {
    clearMismatchTimer();
    state.pendingClose.forEach(flipClose);
    state.pendingClose = [];
  }

  function schedulePendingClose(a, b, run) {
    clearMismatchTimer();
    state.pendingClose = [a, b];
    state.mismatchTimer = setTimeout(function () {
      state.mismatchTimer = null;
      if (run !== state.runId) return;
      if (state.pendingClose[0] !== a || state.pendingClose[1] !== b) return;
      flipClose(a);
      flipClose(b);
      state.pendingClose = [];
    }, MISMATCH_HOLD_MS);
  }

  function onCardTap(index) {
    if (!els.menuOverlay.hidden) return;
    if (state.lock || state.ended) return;
    if (state.matched.has(state.deck[index].pairKey)) return;
    if (state.flipped.indexOf(index) !== -1) return;
    if (state.pendingClose.indexOf(index) !== -1) return;
    if (state.flipped.length >= 2) return;

    // 翻下一張時先蓋回上一組失敗牌，不必等滿 hold
    if (state.pendingClose.length) closePendingCards();

    flipOpen(index);
    state.flipped.push(index);

    if (state.flipped.length === 2) {
      state.lock = true;
      state.moves += 1;
      const a = state.flipped[0];
      const b = state.flipped[1];
      const cardA = state.deck[a];
      const cardB = state.deck[b];

      if (cardA.pairKey === cardB.pairKey && cardA.side !== cardB.side) {
        handleMatch(a, b, cardA.pairKey);
      } else {
        handleMismatch(a, b);
      }
    }
  }

  function flipOpen(index) {
    const el = cardEl(index);
    const card = state.deck[index];
    if (el) {
      el.classList.add("is-flipped");
      const spoken =
        card.side === "pic" && card.label
          ? card.kindLabel + " " + card.label
          : card.kindLabel + " " + card.text;
      el.setAttribute("aria-label", spoken);
    }
    Sound.playSfx("flip");
    if (!card) return;
    if (card.voiceKey) Sound.playWord(card.voiceKey, card.voiceText);
    else if (card.audioKey) Sound.playKana(card.audioKey);
  }

  function flipClose(index) {
    const el = cardEl(index);
    if (el) {
      el.classList.remove("is-flipped");
      el.classList.remove("is-mismatch");
      el.setAttribute("aria-label", faceDownLabel(index));
    }
  }

  function matchAnchorLabel(card) {
    const raw = card.side === "pic" ? card.label || "圖" : card.text;
    const chars = Array.from(String(raw || "結"));
    return chars.length > 3 ? chars.slice(0, 3).join("") + "…" : chars.join("");
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function handleMatch(a, b, pairKey) {
    const run = state.runId;
    Sound.playSfx("match");
    await wait(MATCH_HOLD_MS);
    if (run !== state.runId) return;
    state.matched.add(pairKey);
    const elA = cardEl(a);
    const elB = cardEl(b);
    if (elA) elA.classList.add("is-matched");
    if (elB) elB.classList.add("is-matched");
    if (elA) elA.disabled = true;
    if (elB) elB.disabled = true;
    if (elA) elA.dataset.owner = String(state.currentPlayer);
    if (elB) elB.dataset.owner = String(state.currentPlayer);
    if (elA) elA.dataset.matchLabel = matchAnchorLabel(state.deck[a]);
    if (elB) elB.dataset.matchLabel = matchAnchorLabel(state.deck[b]);
    state.matchTraces.push({
      a,
      b,
      pairKey,
      player: state.currentPlayer,
      createdAt: Date.now(),
    });
    scheduleCordRender();
    state.scores[state.currentPlayer] += 1;
    state.flipped = [];
    state.lock = false;
    updateHud();

    if (state.matched.size === state.deck.length / 2) {
      state.ended = true;
      state.completedAt = Date.now();
      els.turnBanner.textContent = "配對完成，可以慢慢複習";
      els.modeChip.hidden = true;
      els.btnSettle.hidden = false;
      try {
        els.btnSettle.focus({ preventScroll: true });
      } catch (e) {
        els.btnSettle.focus();
      }
    }
    // 答對可連續翻牌，不換手
  }

  function handleMismatch(a, b) {
    Sound.playSfx("mismatch");
    const elA = cardEl(a);
    const elB = cardEl(b);
    if (elA) elA.classList.add("is-mismatch");
    if (elB) elB.classList.add("is-mismatch");
    state.flipped = [];
    state.lock = false;
    // 失敗牌先保持翻開；滿 900ms 或下一張被翻開時才蓋回
    schedulePendingClose(a, b, state.runId);
    if (state.players === 2) {
      state.currentPlayer = 1 - state.currentPlayer;
      updateHud({ turnSwitched: true });
      return;
    }
    updateHud();
  }

  function endGame() {
    state.ended = true;
    Sound.stopBgm();
    if (Sound.stopReading) Sound.stopReading();
    const elapsed = Math.round(((state.completedAt || Date.now()) - state.startedAt) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    const timeText = mins > 0 ? mins + " 分 " + secs + " 秒" : secs + " 秒";
    const metaText = state.moves + " 次嘗試 · " + timeText;

    showScreen("result");

    if (state.players === 1) {
      els.resultTitle.textContent = "全部配對完成！";
      if (els.resultScoreboard) els.resultScoreboard.hidden = true;
      els.resultMeta.textContent =
        "配對 " + state.scores[0] + " 組 · " + metaText;
      return;
    }

    const s1 = state.scores[0];
    const s2 = state.scores[1];
    const n1 = PLAYER_NAMES[0];
    const n2 = PLAYER_NAMES[1];

    if (s1 === s2) {
      els.resultTitle.textContent = "平手！";
    } else if (s1 > s2) {
      els.resultTitle.textContent = n1 + " 獲勝";
    } else {
      els.resultTitle.textContent = n2 + " 獲勝";
    }

    if (els.resultScoreboard) {
      els.resultScoreboard.hidden = false;
      els.resultNameP1.textContent = n1;
      els.resultNameP2.textContent = n2;
      els.resultScoreP1.textContent = String(s1);
      els.resultScoreP2.textContent = String(s2);
      els.resultScoreP1.classList.toggle("is-winner", s1 > s2);
      els.resultScoreP2.classList.toggle("is-winner", s2 > s1);
    }
    els.resultMeta.textContent = metaText;
  }

  function applyRangePreset(presetId) {
    const preset = RANGE_PRESETS[presetId];
    if (!preset) return;
    state.rangePreset = preset.id;
    state.rowFrom = preset.from;
    state.rowTo = preset.to;
  }

  function syncRangePresetFromRows() {
    const match = Object.keys(RANGE_PRESETS).find((id) => {
      const p = RANGE_PRESETS[id];
      return p.from === state.rowFrom && p.to === state.rowTo;
    });
    state.rangePreset = match || "";
  }

  function setKind(kind) {
    if (kind !== "kana" && kind !== "words") return;
    if (state.kind === kind) return;
    state.kind = kind;
    const modes = currentModes();
    const ids = Object.keys(modes);
    state.pairMode = ids[0];
    renderModeOptions();
  }

  function bindSetup() {
    document.getElementById("app").addEventListener("click", (event) => {
      const btn = event.target.closest("[data-group] .opt");
      if (!btn) return;
      const groupEl = btn.parentElement;
      if (!groupEl || !groupEl.dataset.group) return;
      const group = groupEl.dataset.group;
      const value = btn.dataset.value;

      if (group === "theme-menu") {
        applyTheme(value);
        Sound.playSfx("select");
        return;
      }
      if (group === "players") state.players = Number(value);
      if (group === "kind") setKind(value);
      Sound.playSfx("select");
      syncSetupUI();
    });

    function onSelectChange(handler) {
      return () => {
        handler();
        Sound.playSfx("select");
        syncSetupUI();
      };
    }

    els.selMode.addEventListener(
      "change",
      onSelectChange(() => {
        state.pairMode = els.selMode.value;
      })
    );
    els.selGrid.addEventListener(
      "change",
      onSelectChange(() => {
        state.gridId = els.selGrid.value;
      })
    );
    els.selWordCategory.addEventListener(
      "change",
      onSelectChange(() => {
        state.wordCategory = els.selWordCategory.value;
      })
    );
    els.selRangePreset.addEventListener(
      "change",
      onSelectChange(() => {
        const value = els.selRangePreset.value;
        if (value) applyRangePreset(value);
        else state.rangePreset = "";
      })
    );
    els.selTheme.addEventListener("change", () => {
      applyTheme(els.selTheme.value);
      Sound.playSfx("select");
    });
    els.selWordVoice.addEventListener("change", () => {
      applyWordVoice(els.selWordVoice.value);
      Sound.playSfx("select");
    });
    els.optWordVoice.addEventListener("change", () => {
      applyWordVoice(els.optWordVoice.value);
      Sound.playSfx("select");
    });

    function onRowChange() {
      state.rowFrom = els.rowFrom.value;
      state.rowTo = els.rowTo.value;
      syncRangePresetFromRows();
      Sound.playSfx("select");
      syncSetupUI();
    }
    els.rowFrom.addEventListener("change", onRowChange);
    els.rowTo.addEventListener("change", onRowChange);

    [els.optVoice, els.optSfx, els.optBgm].forEach((input) => {
      input.addEventListener("change", () => {
        Sound.playSfx("select");
        syncAudioSettings();
      });
    });
    els.optBgmVolume.addEventListener("input", syncAudioSettings);

    els.btnStart.addEventListener("click", startGame);
    els.btnSettle.addEventListener("click", () => {
      Sound.playSfx("select");
      endGame();
    });
    qs("#btn-restart").addEventListener("click", startGame);
    qs("#btn-to-setup").addEventListener("click", () => {
      Sound.playSfx("select");
      showScreen("setup");
      syncSetupUI();
    });

    qs("#btn-menu").addEventListener("click", () => {
      Sound.playSfx("select");
      openMenu();
    });
    qs("#btn-menu-close").addEventListener("click", () => {
      Sound.playSfx("select");
      closeMenu();
    });
    qs("#btn-menu-restart").addEventListener("click", () => {
      closeMenu();
      startGame();
    });
    qs("#btn-menu-home").addEventListener("click", () => {
      Sound.playSfx("select");
      showScreen("setup");
      syncSetupUI();
    });
    els.menuOverlay.addEventListener("click", (event) => {
      if (event.target === els.menuOverlay) {
        Sound.playSfx("select");
        closeMenu();
      }
    });
    els.menuOverlay.addEventListener("keydown", (event) => {
      if (els.menuOverlay.hidden) return;
      if (event.key === "Escape") {
        event.preventDefault();
        Sound.playSfx("select");
        closeMenu();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = qsa(
        'button:not([disabled]), input:not([disabled]), select:not([disabled])',
        els.menuOverlay
      ).filter((element) => element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  function fillRowSelects() {
    const options = ROWS.map((row) => {
      return (
        '<option value="' +
        escapeHtml(row.id) +
        '">' +
        escapeHtml(row.label) +
        "</option>"
      );
    }).join("");
    els.rowFrom.innerHTML = options;
    els.rowTo.innerHTML = options;
    els.rowFrom.value = state.rowFrom;
    els.rowTo.value = state.rowTo;
  }

  function renderModeOptions() {
    const modes = currentModes();
    els.selMode.innerHTML = Object.keys(modes)
      .map((id) => {
        const m = modes[id];
        return (
          '<option value="' +
          escapeHtml(m.id) +
          '">' +
          escapeHtml(m.label) +
          "</option>"
        );
      })
      .join("");
    els.selMode.value = state.pairMode;
  }

  function fillSetupSelects() {
    renderModeOptions();

    els.selGrid.innerHTML = GRID_PRESETS.map((g) => {
      return (
        '<option value="' +
        escapeHtml(g.id) +
        '">' +
        escapeHtml(g.label) +
        "</option>"
      );
    }).join("");
    els.selGrid.value = state.gridId;

    els.selWordCategory.innerHTML = WORD_CATEGORIES.map((cat) => {
      const count = getWordsInCategory(cat.id).length;
      return (
        '<option value="' +
        escapeHtml(cat.id) +
        '">' +
        escapeHtml(cat.label + " × " + count) +
        "</option>"
      );
    }).join("");
    els.selWordCategory.value = state.wordCategory;

    els.selRangePreset.innerHTML =
      Object.keys(RANGE_PRESETS)
        .map((id) => {
          const p = RANGE_PRESETS[id];
          return (
            '<option value="' +
            escapeHtml(p.id) +
            '">' +
            escapeHtml(p.label) +
            "</option>"
          );
        })
        .join("") + '<option value="">自訂</option>';
    els.selRangePreset.value = state.rangePreset || "";

    els.selTheme.innerHTML = Object.keys(THEMES)
      .map((id) => {
        const t = THEMES[id];
        return (
          '<option value="' +
          escapeHtml(t.id) +
          '">' +
          escapeHtml(t.label) +
          "</option>"
        );
      })
      .join("");
    els.selTheme.value = state.theme;

    const voiceOptions = Object.keys(Sound.wordVoices)
      .map((id) => {
        const voice = Sound.wordVoices[id];
        return (
          '<option value="' +
          escapeHtml(voice.id) +
          '">' +
          escapeHtml(voice.label) +
          "</option>"
        );
      })
      .join("");
    els.selWordVoice.innerHTML = voiceOptions;
    els.optWordVoice.innerHTML = voiceOptions;
    syncWordVoiceUI();
  }

  applyTheme(loadSavedTheme(), { silent: true });
  applyWordVoice(loadSavedWordVoice());
  fillRowSelects();
  fillSetupSelects();
  bindSetup();
  window.addEventListener("resize", scheduleCordRender);
  syncAudioSettings();
  syncSetupUI();
  showScreen("setup");
})();
