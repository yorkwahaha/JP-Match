(() => {
  const {
    PAIR_MODES,
    GRID_PRESETS,
    DEFAULT_GRID_ID,
    ROWS,
    DEFAULT_ROW_FROM,
    DEFAULT_ROW_TO,
    getKanaInRange,
    normalizeRowRange,
    buildDeck,
  } = window.JPMatchData;
  const Sound = window.JPMatchAudio;

  const FLIP_MS = 280;
  const MISMATCH_HOLD_MS = 900;
  const MATCH_HOLD_MS = 420;
  const PLAYER_NAMES = ["玩家 1", "玩家 2"];
  const THEME_STORAGE_KEY = "jp-match-theme";
  const THEMES = {
    night: { id: "night", label: "夜紺", meta: "#142033" },
    mist: { id: "mist", label: "水霧", meta: "#8fb4c8" },
    yuzu: { id: "yuzu", label: "柚香", meta: "#cbb887" },
  };
  const DEFAULT_THEME = "night";

  const state = {
    screen: "setup",
    players: 2,
    pairMode: "romaji-hira",
    gridId: DEFAULT_GRID_ID,
    rowFrom: DEFAULT_ROW_FROM,
    rowTo: DEFAULT_ROW_TO,
    theme: DEFAULT_THEME,
    deck: [],
    flipped: [],
    matched: new Set(),
    scores: [0, 0],
    currentPlayer: 0,
    lock: false,
    moves: 0,
    startedAt: null,
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
    resultTitle: document.getElementById("result-title"),
    resultDetail: document.getElementById("result-detail"),
    menuOverlay: document.getElementById("menu-overlay"),
    optVoice: document.getElementById("opt-voice"),
    optSfx: document.getElementById("opt-sfx"),
    optBgm: document.getElementById("opt-bgm"),
    optBgmVolume: document.getElementById("opt-bgm-volume"),
    rowFrom: document.getElementById("row-from"),
    rowTo: document.getElementById("row-to"),
    rangeHint: document.getElementById("range-hint"),
    btnStart: document.getElementById("btn-start"),
  };

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
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
    qsa('[data-group="theme"] .opt, [data-group="theme-menu"] .opt').forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.value === state.theme);
    });
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
    syncThemeUI();
  }

  function openMenu() {
    if (state.screen !== "game" || state.ended) return;
    syncMenuUI();
    els.menuOverlay.hidden = false;
    document.body.classList.add("menu-open");
  }

  function closeMenu() {
    els.menuOverlay.hidden = true;
    document.body.classList.remove("menu-open");
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
    }
  }

  function syncSetupUI() {
    qsa('[data-group="players"] .opt').forEach((btn) => {
      btn.classList.toggle("is-active", Number(btn.dataset.value) === state.players);
    });
    qsa('[data-group="mode"] .opt').forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.value === state.pairMode);
    });
    qsa('[data-group="grid"] .opt').forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.value === state.gridId);
    });
    if (els.rowFrom) els.rowFrom.value = state.rowFrom;
    if (els.rowTo) els.rowTo.value = state.rowTo;
    syncThemeUI();
    syncRangeHint();
  }

  function poolSize() {
    return getKanaInRange(state.rowFrom, state.rowTo).length;
  }

  function syncRangeHint() {
    if (!els.rangeHint || !els.btnStart) return;
    const size = poolSize();
    const need = pairCount();
    const ok = size >= need;
    const range = normalizeRowRange(state.rowFrom, state.rowTo);
    const fromLabel = ROWS[range.from].label;
    const toLabel = ROWS[range.to].label;
    const same = range.from === range.to;

    let text =
      (same ? fromLabel : fromLabel + "～" + toLabel) +
      " · 題池 " +
      size +
      " 個假名";
    if (!ok) {
      text += " · 目前盤面需 " + need + " 組，請縮小盤面或擴大範圍";
    }
    els.rangeHint.textContent = text;
    els.rangeHint.classList.toggle("is-warn", !ok);
    els.btnStart.disabled = !ok;
  }

  function startGame() {
    if (poolSize() < pairCount()) {
      syncRangeHint();
      return;
    }
    syncAudioSettings();
    Sound.unlock();
    Sound.playSfx("start");
    const grid = getGrid();
    state.deck = buildDeck(state.pairMode, pairCount(), {
      fromRow: state.rowFrom,
      toRow: state.rowTo,
    });
    state.flipped = [];
    state.matched = new Set();
    state.scores = [0, 0];
    state.currentPlayer = 0;
    state.lock = false;
    state.moves = 0;
    state.startedAt = Date.now();
    state.ended = false;
    state.runId += 1;

    els.board.style.setProperty("--cols", String(grid.cols));
    els.board.style.setProperty("--rows", String(grid.rows));
    document.body.dataset.players = String(state.players);
    document.body.dataset.turn = "0";

    els.modeChip.textContent = PAIR_MODES[state.pairMode].label;
    renderBoard();
    updateHud();
    showScreen("game");
    Sound.startBgm();
  }

  function faceDownLabel(index) {
    return "卡牌 " + (index + 1) + "（未翻開）";
  }

  function renderBoard() {
    els.board.innerHTML = "";
    const frag = document.createDocumentFragment();

    state.deck.forEach((card, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "card";
      btn.dataset.index = String(index);
      btn.dataset.side = card.side;
      btn.setAttribute("aria-label", faceDownLabel(index));
      btn.innerHTML =
        '<span class="card-inner">' +
        '<span class="card-face card-back" aria-hidden="true">' +
        '<span class="card-back-pattern"></span>' +
        '<span class="card-corners" aria-hidden="true"></span>' +
        '<span class="seal"><span class="seal-ring"></span><span class="seal-char"></span></span>' +
        "</span>" +
        '<span class="card-face card-front" data-side="' +
        card.side +
        '">' +
        '<span class="card-front-frame"></span>' +
        '<span class="card-corners card-corners-ink" aria-hidden="true"></span>' +
        '<span class="card-kind">' +
        card.kindLabel +
        "</span>" +
        '<span class="card-text">' +
        card.text +
        "</span>" +
        "</span></span>";
      btn.addEventListener("click", () => onCardTap(index));
      frag.appendChild(btn);
    });

    els.board.appendChild(frag);
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
      document.body.classList.remove("turn-switched");
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
      document.body.classList.remove("turn-switched");
      // 重觸發動畫
      void document.body.offsetWidth;
      document.body.classList.add("turn-switched");
      window.clearTimeout(updateHud._switchTimer);
      updateHud._switchTimer = window.setTimeout(() => {
        document.body.classList.remove("turn-switched");
      }, 1600);
    }
  }

  function onCardTap(index) {
    if (!els.menuOverlay.hidden) return;
    if (state.lock || state.ended) return;
    if (state.matched.has(state.deck[index].pairKey)) return;
    if (state.flipped.indexOf(index) !== -1) return;
    if (state.flipped.length >= 2) return;

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
      el.setAttribute("aria-label", card.kindLabel + " " + card.text);
    }
    Sound.playSfx("flip");
    if (card) Sound.playKana(card.audioKey);
  }

  function flipClose(index) {
    const el = cardEl(index);
    if (el) {
      el.classList.remove("is-flipped");
      el.setAttribute("aria-label", faceDownLabel(index));
    }
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function handleMatch(a, b, pairKey) {
    const run = state.runId;
    await wait(MATCH_HOLD_MS);
    if (run !== state.runId) return;
    Sound.playSfx("match");
    state.matched.add(pairKey);
    const elA = cardEl(a);
    const elB = cardEl(b);
    if (elA) elA.classList.add("is-matched");
    if (elB) elB.classList.add("is-matched");
    state.scores[state.currentPlayer] += 1;
    state.flipped = [];
    state.lock = false;
    updateHud();

    if (state.matched.size === state.deck.length / 2) {
      endGame();
    }
    // 答對可連續翻牌，不換手
  }

  async function handleMismatch(a, b) {
    const run = state.runId;
    await wait(MISMATCH_HOLD_MS);
    if (run !== state.runId) return;
    Sound.playSfx("mismatch");
    flipClose(a);
    flipClose(b);
    await wait(FLIP_MS);
    if (run !== state.runId) return;
    state.flipped = [];
    state.lock = false;
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
    const elapsed = Math.round((Date.now() - state.startedAt) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    const timeText = mins > 0 ? mins + " 分 " + secs + " 秒" : secs + " 秒";

    showScreen("result");

    if (state.players === 1) {
      els.resultTitle.textContent = "全部配對完成！";
      els.resultDetail.textContent =
        "共 " + state.moves + " 次翻牌 · 用時 " + timeText + " · 配對 " + state.scores[0] + " 組";
      return;
    }

    const s1 = state.scores[0];
    const s2 = state.scores[1];
    const n1 = PLAYER_NAMES[0];
    const n2 = PLAYER_NAMES[1];
    const scoreLine =
      n1 + " " + s1 + " ： " + s2 + " " + n2 + " · " + state.moves + " 次翻牌 · " + timeText;

    if (s1 === s2) {
      els.resultTitle.textContent = "平手！";
    } else if (s1 > s2) {
      els.resultTitle.textContent = n1 + " 獲勝";
    } else {
      els.resultTitle.textContent = n2 + " 獲勝";
    }
    els.resultDetail.textContent = scoreLine;
  }

  function bindSetup() {
    qsa("[data-group] .opt").forEach((btn) => {
      btn.addEventListener("click", () => {
        const group = btn.parentElement.dataset.group;
        const value = btn.dataset.value;
        if (group === "players") state.players = Number(value);
        if (group === "mode") state.pairMode = value;
        if (group === "grid") state.gridId = value;
        if (group === "theme" || group === "theme-menu") {
          applyTheme(value);
          Sound.playSfx("select");
          return;
        }
        Sound.playSfx("select");
        syncSetupUI();
      });
    });

    function onRowChange() {
      state.rowFrom = els.rowFrom.value;
      state.rowTo = els.rowTo.value;
      Sound.playSfx("select");
      syncRangeHint();
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
  }

  function fillRowSelects() {
    const options = ROWS.map((row) => {
      return '<option value="' + row.id + '">' + row.label + "</option>";
    }).join("");
    els.rowFrom.innerHTML = options;
    els.rowTo.innerHTML = options;
    els.rowFrom.value = state.rowFrom;
    els.rowTo.value = state.rowTo;
  }

  function initModeOptions() {
    const host = qs('[data-group="mode"]');
    host.innerHTML = Object.keys(PAIR_MODES)
      .map((id) => {
        const m = PAIR_MODES[id];
        return (
          '<button type="button" class="opt" data-value="' +
          m.id +
          '">' +
          m.label +
          "</button>"
        );
      })
      .join("");

    const gridHost = qs('[data-group="grid"]');
    gridHost.innerHTML = GRID_PRESETS.map((g) => {
      return (
        '<button type="button" class="opt" data-value="' +
        g.id +
        '">' +
        g.label +
        "</button>"
      );
    }).join("");
  }

  applyTheme(loadSavedTheme(), { silent: true });
  fillRowSelects();
  initModeOptions();
  bindSetup();
  syncAudioSettings();
  syncSetupUI();
  showScreen("setup");
})();
