/**
 * 音訊路徑與播放控制
 *
 * 預期檔名：
 *   assets/audio/sfx/select.mp3     選項點擊
 *   assets/audio/sfx/start.mp3      開始遊戲
 *   assets/audio/sfx/flip.mp3       翻牌
 *   assets/audio/sfx/match.mp3      配對成功
 *   assets/audio/sfx/mismatch.mp3   配對失敗
 *   assets/audio/bgm/*.mp3          背景音樂（會隨機選曲）
 *   assets/audio/kana/{romaji}.mp3  例如 a.mp3、shi.mp3、n.mp3
 */
window.JPMatchAudio = (() => {
  const BASE = "assets/audio";

  const PATHS = {
    sfx: {
      select: BASE + "/sfx/select.mp3",
      start: BASE + "/sfx/start.mp3",
      flip: BASE + "/sfx/flip.mp3",
      match: BASE + "/sfx/match.mp3",
      mismatch: BASE + "/sfx/mismatch.mp3",
    },
    bgm: [
      BASE + "/bgm/area-1.mp3",
      BASE + "/bgm/area-2.mp3",
      BASE + "/bgm/area-3.mp3",
    ],
    kanaDir: BASE + "/kana/",
  };

  const sfxCache = {};
  const kanaCache = {};
  let bgmEl = null;
  let bgmIndex = -1;
  let unlocked = false;

  const settings = {
    voice: true,
    bgm: true,
    sfx: true,
    bgmVolume: 0.35,
    sfxVolume: 0.55,
    voiceVolume: 0.9,
  };

  function unlock() {
    if (unlocked) return;
    unlocked = true;
    try {
      const silent = new Audio(
        "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"
      );
      silent.volume = 0;
      silent.play().catch(function () {});
    } catch (e) {}
  }

  function playSrc(src, volume, cache) {
    if (!src) return;
    unlock();
    try {
      let el = cache && cache[src];
      if (!el) {
        el = new Audio(src);
        el.preload = "auto";
        if (cache) cache[src] = el;
      }
      el.pause();
      el.currentTime = 0;
      el.volume = volume;
      const p = el.play();
      if (p && p.catch) p.catch(function () {});
    } catch (e) {}
  }

  function playSfx(name) {
    if (!settings.sfx) return;
    const src = PATHS.sfx[name];
    if (!src) return;
    playSrc(src, settings.sfxVolume, sfxCache);
  }

  function playKana(romajiKey) {
    if (!settings.voice || !romajiKey) return;
    const key = String(romajiKey).toLowerCase();
    const src = PATHS.kanaDir + key + ".mp3";
    playSrc(src, settings.voiceVolume, kanaCache);
  }

  function playReading(text) {
    if (!settings.voice || !text) return;
    if (!window.speechSynthesis || typeof window.SpeechSynthesisUtterance !== "function") {
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utter = new window.SpeechSynthesisUtterance(String(text));
      utter.lang = "ja-JP";
      utter.rate = 0.92;
      utter.volume = settings.voiceVolume;
      window.speechSynthesis.speak(utter);
    } catch (e) {}
  }

  function pickBgm() {
    if (!PATHS.bgm.length) return null;
    let next = Math.floor(Math.random() * PATHS.bgm.length);
    if (PATHS.bgm.length > 1 && next === bgmIndex) {
      next = (next + 1) % PATHS.bgm.length;
    }
    bgmIndex = next;
    return PATHS.bgm[bgmIndex];
  }

  function startBgm() {
    if (!settings.bgm) {
      stopBgm();
      return;
    }
    unlock();
    const src = pickBgm();
    if (!src) return;

    if (!bgmEl) {
      bgmEl = new Audio();
      bgmEl.loop = true;
      bgmEl.preload = "auto";
    }
    if (bgmEl.dataset.src !== src) {
      bgmEl.src = src;
      bgmEl.dataset.src = src;
    }
    bgmEl.volume = settings.bgmVolume;
    const p = bgmEl.play();
    if (p && p.catch) p.catch(function () {});
  }

  function stopBgm() {
    if (!bgmEl) return;
    bgmEl.pause();
    try {
      bgmEl.currentTime = 0;
    } catch (e) {}
  }

  function setVoice(on) {
    settings.voice = !!on;
  }

  function setBgm(on) {
    settings.bgm = !!on;
    if (!on) {
      stopBgm();
      return;
    }
    // 僅在已有曲目時恢復播放；首次開播由 startBgm() 負責
    if (bgmEl && bgmEl.dataset.src) {
      bgmEl.volume = settings.bgmVolume;
      const p = bgmEl.play();
      if (p && p.catch) p.catch(function () {});
    }
  }

  function setSfx(on) {
    settings.sfx = !!on;
  }

  function setBgmVolume(value) {
    const v = Math.min(1, Math.max(0, Number(value)));
    settings.bgmVolume = Number.isFinite(v) ? v : 0.35;
    if (bgmEl) bgmEl.volume = settings.bgmVolume;
  }

  return {
    settings: settings,
    unlock: unlock,
    playSfx: playSfx,
    playKana: playKana,
    playReading: playReading,
    startBgm: startBgm,
    stopBgm: stopBgm,
    setVoice: setVoice,
    setBgm: setBgm,
    setSfx: setSfx,
    setBgmVolume: setBgmVolume,
  };
})();
