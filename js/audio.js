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
 *
 * 單字朗讀：與 JPAPP 相同，走 Google Cloud TTS proxy
 *   https://jpapp-tts-proxy.yorkwahaha.workers.dev
 */
window.JPMatchAudio = (() => {
  const BASE = "assets/audio";
  const TTS_PROXY_URL = "https://jpapp-tts-proxy.yorkwahaha.workers.dev/tts";
  const TTS_SESSION_URL = "https://jpapp-tts-proxy.yorkwahaha.workers.dev/session";
  const DEFAULT_TTS_VOICE = "ja-JP-Neural2-B";

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
    wordsDir: BASE + "/words/",
  };

  const sfxCache = {};
  const kanaCache = {};
  const wordCache = {};
  let bgmEl = null;
  let bgmIndex = -1;
  let bgmPausedByHide = false;
  let unlocked = false;

  let sessionTokenData = null;
  let readingSessionId = 0;
  let readingAudio = null;
  let readingObjectUrl = null;

  const settings = {
    voice: true,
    bgm: true,
    sfx: true,
    bgmVolume: 0.18,
    sfxVolume: 0.55,
    voiceVolume: 1,
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

  function stopCachedAudio(cache) {
    Object.keys(cache).forEach(function (src) {
      const el = cache[src];
      if (!el) return;
      try {
        el.pause();
        el.currentTime = 0;
      } catch (e) {}
    });
  }

  function stopReading() {
    readingSessionId += 1;
    stopCachedAudio(kanaCache);
    stopCachedAudio(wordCache);
    if (window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    if (readingAudio) {
      try {
        readingAudio.pause();
        readingAudio.onended = null;
        readingAudio.onerror = null;
      } catch (e) {}
      readingAudio = null;
    }
    if (readingObjectUrl) {
      try {
        URL.revokeObjectURL(readingObjectUrl);
      } catch (e) {}
      readingObjectUrl = null;
    }
  }

  function playKana(romajiKey) {
    if (!settings.voice || !romajiKey) return;
    stopReading();
    const key = String(romajiKey).toLowerCase();
    const src = PATHS.kanaDir + key + ".mp3";
    playSrc(src, settings.voiceVolume, kanaCache);
  }

  function playWord(wordKey, fallbackText) {
    if (!settings.voice || !wordKey) {
      if (fallbackText) playReading(fallbackText);
      return;
    }
    unlock();
    stopReading();
    const key = String(wordKey).toLowerCase();
    const src = PATHS.wordsDir + key + ".mp3";
    let el = wordCache[src];
    if (!el) {
      el = new Audio(src);
      el.preload = "auto";
      wordCache[src] = el;
    }
    el.pause();
    try {
      el.currentTime = 0;
    } catch (e) {}
    el.volume = settings.voiceVolume;
    const sessionId = readingSessionId;
    const onError = function () {
      el.onerror = null;
      if (sessionId !== readingSessionId) return;
      if (fallbackText) playReading(fallbackText);
    };
    el.onerror = onError;
    const p = el.play();
    if (p && p.catch) {
      p.catch(function () {
        onError();
      });
    }
  }

  async function getSessionToken() {
    if (sessionTokenData && sessionTokenData.exp > Date.now() + 5000) {
      return sessionTokenData.token;
    }
    try {
      const res = await fetch(TTS_SESSION_URL);
      if (!res.ok) return null;
      const data = await res.json();
      sessionTokenData = data;
      return data.token;
    } catch (e) {
      return null;
    }
  }

  function playWebSpeechFallback(text, sessionId) {
    if (!window.speechSynthesis || typeof window.SpeechSynthesisUtterance !== "function") {
      return;
    }
    if (sessionId !== readingSessionId) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new window.SpeechSynthesisUtterance(String(text));
      utter.lang = "ja-JP";
      utter.rate = 0.92;
      utter.volume = settings.voiceVolume;
      window.speechSynthesis.speak(utter);
    } catch (e) {}
  }

  async function speakCloudTts(text, sessionId) {
    let res = null;
    let retryCount = 0;
    let success = false;

    while (retryCount < 2 && !success) {
      if (sessionId !== readingSessionId) return false;
      const token = await getSessionToken();
      if (!token) return false;
      try {
        res = await fetch(TTS_PROXY_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Session-Token": token,
          },
          body: JSON.stringify({
            text: text,
            voice: DEFAULT_TTS_VOICE,
            rate: "1.0",
            pitch: "default",
          }),
        });
        if (res.status === 401) {
          sessionTokenData = null;
          retryCount += 1;
          continue;
        }
        success = true;
      } catch (e) {
        return false;
      }
    }

    if (!res || !res.ok) return false;
    if (sessionId !== readingSessionId) return false;

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    if (sessionId !== readingSessionId) {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {}
      return false;
    }

    if (!readingAudio) readingAudio = new Audio();
    const audio = readingAudio;
    if (readingObjectUrl) {
      try {
        URL.revokeObjectURL(readingObjectUrl);
      } catch (e) {}
    }
    readingObjectUrl = url;
    audio.onended = function () {
      if (readingObjectUrl === url) {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {}
        readingObjectUrl = null;
      }
    };
    audio.onerror = function () {
      if (readingObjectUrl === url) {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {}
        readingObjectUrl = null;
      }
    };
    audio.src = url;
    audio.volume = settings.voiceVolume;

    try {
      await audio.play();
      return sessionId === readingSessionId;
    } catch (e) {
      try {
        URL.revokeObjectURL(url);
      } catch (err) {}
      if (readingObjectUrl === url) readingObjectUrl = null;
      return false;
    }
  }

  function playReading(text) {
    if (!settings.voice || !text) return;
    unlock();
    stopReading();
    const sessionId = readingSessionId;
    const clean = String(text)
      .replace(/<[^>]*>/g, "")
      .trim();
    if (!clean) return;

    speakCloudTts(clean, sessionId).then(function (ok) {
      if (ok) return;
      if (sessionId !== readingSessionId) return;
      playWebSpeechFallback(clean, sessionId);
    });
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
    bgmPausedByHide = false;
    bgmEl.volume = settings.bgmVolume;
    const p = bgmEl.play();
    if (p && p.catch) p.catch(function () {});
  }

  function stopBgm() {
    bgmPausedByHide = false;
    if (!bgmEl) return;
    bgmEl.pause();
    try {
      bgmEl.currentTime = 0;
    } catch (e) {}
  }

  function pauseForBackground() {
    stopReading();
    if (!bgmEl || bgmEl.paused) return;
    bgmEl.pause();
    bgmPausedByHide = true;
  }

  function resumeFromBackground() {
    if (!bgmPausedByHide) return;
    bgmPausedByHide = false;
    if (!settings.bgm || !bgmEl || !bgmEl.dataset.src) return;
    if (document.hidden) return;
    bgmEl.volume = settings.bgmVolume;
    const p = bgmEl.play();
    if (p && p.catch) p.catch(function () {});
  }

  function onPageHide() {
    pauseForBackground();
  }

  function onVisibilityChange() {
    if (document.hidden) pauseForBackground();
    else resumeFromBackground();
  }

  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("pagehide", onPageHide);
  window.addEventListener("freeze", onPageHide);
  window.addEventListener("pageshow", resumeFromBackground);

  function setVoice(on) {
    settings.voice = !!on;
    if (!on) stopReading();
  }

  function setBgm(on) {
    settings.bgm = !!on;
    if (!on) {
      stopBgm();
      return;
    }
    // 僅在已有曲目時恢復播放；首次開播由 startBgm() 負責
    if (bgmEl && bgmEl.dataset.src && !document.hidden) {
      bgmPausedByHide = false;
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
    settings.bgmVolume = Number.isFinite(v) ? v : 0.18;
    if (bgmEl) bgmEl.volume = settings.bgmVolume;
  }

  return {
    settings: settings,
    unlock: unlock,
    playSfx: playSfx,
    playKana: playKana,
    playWord: playWord,
    playReading: playReading,
    stopReading: stopReading,
    startBgm: startBgm,
    stopBgm: stopBgm,
    setVoice: setVoice,
    setBgm: setBgm,
    setSfx: setSfx,
    setBgmVolume: setBgmVolume,
  };
})();
