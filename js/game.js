(() => {
  const { PAIR_MODES, GRID_PRESETS, buildDeck } = window.JPMatchData;
  const Sound = window.JPMatchAudio;

  const FLIP_MS = 280;
  const MISMATCH_HOLD_MS = 900;
  const MATCH_HOLD_MS = 420;

  const state = {
    screen: "setup",
    players: 2,
    playerNames: ["玩家 1", "玩家 2"],
    pairMode: "romaji-hira",
    gridId: "8x4",
    cols: 8,
    rows: 4,
    deck: [],
    flipped: [],
    matched: new Set(),
    scores: [0, 0],
    currentPlayer: 0,
    lock: false,
    moves: 0,
    startedAt: null,
    ended: false,
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
  };

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function getGrid() {
    return GRID_PRESETS.find((g) => g.id === state.gridId) || GRID_PRESETS[3];
  }

  function pairCount() {
    const g = getGrid();
    return (g.cols * g.rows) / 2;
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
  }

  function startGame() {
    syncAudioSettings();
    Sound.unlock();
    Sound.playSfx("start");
    const grid = getGrid();
    state.cols = grid.cols;
    state.rows = grid.rows;
    state.deck = buildDeck(state.pairMode, pairCount());
    state.flipped = [];
    state.matched = new Set();
    state.scores = [0, 0];
    state.currentPlayer = 0;
    state.lock = false;
    state.moves = 0;
    state.startedAt = Date.now();
    state.ended = false;
    state.playerNames = ["玩家 1", "玩家 2"];

    els.board.style.setProperty("--cols", String(state.cols));
    els.board.style.setProperty("--rows", String(state.rows));
    document.body.dataset.players = String(state.players);
    document.body.dataset.turn = "0";

    els.modeChip.textContent = PAIR_MODES[state.pairMode].label;
    renderBoard();
    updateHud();
    showScreen("game");
    Sound.startBgm();
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
      btn.setAttribute("aria-label", "卡牌 " + (index + 1));
      btn.innerHTML =
        '<span class="card-inner">' +
        '<span class="card-face card-back" aria-hidden="true">' +
        '<span class="card-back-pattern"></span>' +
        '<span class="card-corners" aria-hidden="true"></span>' +
        '<span class="seal"><span class="seal-ring"></span><span class="seal-char">あ</span></span>' +
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
    els.scoreP1.querySelector(".score-name").textContent = state.playerNames[0];
    els.scoreP2.querySelector(".score-name").textContent = state.playerNames[1];
    els.scoreP1.querySelector(".score-num").textContent = String(state.scores[0]);
    els.scoreP2.querySelector(".score-num").textContent = String(state.scores[1]);
    els.scoreP1.classList.toggle("is-active", state.currentPlayer === 0);
    els.scoreP2.classList.toggle("is-active", state.currentPlayer === 1);

    els.turnBanner.textContent = state.playerNames[state.currentPlayer] + " 的回合";
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
    if (el) el.classList.add("is-flipped");
    Sound.playSfx("flip");
    const card = state.deck[index];
    if (card) Sound.playKana(card.audioKey);
  }

  function flipClose(index) {
    const el = cardEl(index);
    if (el) el.classList.remove("is-flipped");
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function handleMatch(a, b, pairKey) {
    await wait(MATCH_HOLD_MS);
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
    await wait(MISMATCH_HOLD_MS);
    Sound.playSfx("mismatch");
    flipClose(a);
    flipClose(b);
    await wait(FLIP_MS);
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
    const n1 = state.playerNames[0];
    const n2 = state.playerNames[1];
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
        Sound.playSfx("select");
        syncSetupUI();
      });
    });

    [els.optVoice, els.optSfx, els.optBgm].forEach((input) => {
      input.addEventListener("change", () => {
        Sound.playSfx("select");
        syncAudioSettings();
      });
    });
    els.optBgmVolume.addEventListener("input", syncAudioSettings);

    qs("#btn-start").addEventListener("click", startGame);
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

  initModeOptions();
  bindSetup();
  syncAudioSettings();
  syncSetupUI();
  showScreen("setup");
})();
