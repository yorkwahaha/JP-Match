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
 * 單字朗讀：優先使用設定的本地聲線包；檔案缺漏時走 Google Cloud TTS proxy
 *   https://jpapp-tts-proxy.yorkwahaha.workers.dev
 */
window.JPMatchAudio = (() => {
  const BASE = "assets/audio";
  const TTS_PROXY_URL = "https://jpapp-tts-proxy.yorkwahaha.workers.dev/tts";
  const TTS_SESSION_URL = "https://jpapp-tts-proxy.yorkwahaha.workers.dev/session";
  const DEFAULT_TTS_VOICE = "ja-JP-Neural2-B";
  const DEFAULT_WORD_VOICE = "lively";
  const MAX_VOICE_BUFFER_CACHE = 64;

  const WORD_VOICES = {
    classic: {
      id: "classic",
      label: "經典聲線",
      dir: BASE + "/words/",
    },
    lively: {
      id: "lively",
      label: "活力聲線",
      dir: BASE + "/word-voices/fish-962b6d73/",
      revision: "s2-1-reading-hint-r4",
    },
  };

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
  const audioBufferCache = new Map();
  const audioBufferPending = new Map();
  const reportedAudioIssues = new Set();
  let bgmEl = null;
  let bgmIndex = -1;
  let bgmPausedByHide = false;
  let unlocked = false;

  let sessionTokenData = null;
  let readingSessionId = 0;
  let localReadingAudio = null;
  let readingAudio = null;
  let readingObjectUrl = null;
  let lowLatencyContext = null;
  let activeReadingSource = null;

  const settings = {
    voice: true,
    bgm: true,
    sfx: true,
    bgmVolume: 0.18,
    sfxVolume: 0.55,
    voiceVolume: 1,
    wordVoice: DEFAULT_WORD_VOICE,
  };

  function reportAudioIssue(scope, error) {
    const detail = error && error.message ? error.message : String(error || "unknown error");
    const key = scope + ":" + detail;
    if (reportedAudioIssues.has(key)) return;
    reportedAudioIssues.add(key);
    console.warn("[JP Match audio] " + scope + ": " + detail);
  }

  function getCachedAudioBuffer(cacheKey) {
    const entry = audioBufferCache.get(cacheKey);
    if (!entry) return null;
    audioBufferCache.delete(cacheKey);
    audioBufferCache.set(cacheKey, entry);
    return entry;
  }

  function pruneVoiceBufferCache() {
    let voiceCount = 0;
    audioBufferCache.forEach((entry, key) => {
      if (key.endsWith("#voice")) voiceCount += 1;
    });
    if (voiceCount <= MAX_VOICE_BUFFER_CACHE) return;
    for (const key of audioBufferCache.keys()) {
      if (!key.endsWith("#voice")) continue;
      audioBufferCache.delete(key);
      voiceCount -= 1;
      if (voiceCount <= MAX_VOICE_BUFFER_CACHE) break;
    }
  }

  function unlock() {
    if (unlocked) return;
    unlocked = true;
    const context = getLowLatencyContext();
    if (context && context.state === "suspended") {
      context.resume().catch(function () {});
    }
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
      if (p && p.catch) {
        p.catch(function (error) {
          reportAudioIssue("play " + src, error);
        });
      }
    } catch (e) {
      reportAudioIssue("play " + src, e);
    }
  }

  function getLowLatencyContext() {
    if (lowLatencyContext) return lowLatencyContext;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    try {
      lowLatencyContext = new AudioContextClass({ latencyHint: "interactive" });
    } catch (e) {
      try {
        lowLatencyContext = new AudioContextClass();
      } catch (err) {
        lowLatencyContext = null;
      }
    }
    return lowLatencyContext;
  }

  function computeVoiceGain(buffer) {
    let peak = 0;
    let energy = 0;
    let activeSamples = 0;
    const stride = Math.max(1, Math.floor(buffer.sampleRate / 22050));

    for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
      const data = buffer.getChannelData(channel);
      for (let index = 0; index < data.length; index += stride) {
        peak = Math.max(peak, Math.abs(data[index]));
      }
    }

    const activeThreshold = Math.max(0.0015, peak * 0.025);
    for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
      const data = buffer.getChannelData(channel);
      for (let index = 0; index < data.length; index += stride) {
        const sample = data[index];
        if (Math.abs(sample) < activeThreshold) continue;
        energy += sample * sample;
        activeSamples += 1;
      }
    }

    if (!activeSamples || !peak) return 1;
    const activeRms = Math.sqrt(energy / activeSamples);
    const targetRms = 0.1;
    const rmsGain = targetRms / activeRms;
    const peakSafeGain = 0.92 / peak;
    return Math.max(0.55, Math.min(1.8, rmsGain, peakSafeGain));
  }

  function computeStartOffset(buffer) {
    let peak = 0;
    for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
      const data = buffer.getChannelData(channel);
      for (let index = 0; index < data.length; index += 1) {
        peak = Math.max(peak, Math.abs(data[index]));
      }
    }
    const threshold = Math.max(0.001, peak * 0.02);
    let firstActiveSample = buffer.length;
    for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
      const data = buffer.getChannelData(channel);
      for (let index = 0; index < data.length; index += 1) {
        if (Math.abs(data[index]) < threshold) continue;
        firstActiveSample = Math.min(firstActiveSample, index);
        break;
      }
    }
    if (firstActiveSample === buffer.length) return 0;
    return Math.max(0, firstActiveSample / buffer.sampleRate - 0.008);
  }

  function loadAudioBuffer(src, normalizeVoice) {
    const cacheKey = src + (normalizeVoice ? "#voice" : "#raw");
    const cached = getCachedAudioBuffer(cacheKey);
    if (cached) return Promise.resolve(cached);
    if (audioBufferPending.has(cacheKey)) return audioBufferPending.get(cacheKey);

    const context = getLowLatencyContext();
    if (!context) return Promise.reject(new Error("Web Audio unavailable"));
    const pending = fetch(src)
      .then((response) => {
        if (!response.ok) throw new Error("Audio fetch failed: " + response.status);
        return response.arrayBuffer();
      })
      .then((data) => context.decodeAudioData(data))
      .then((buffer) => {
        const entry = {
          buffer,
          gain: normalizeVoice ? computeVoiceGain(buffer) : 1,
          offset: computeStartOffset(buffer),
        };
        audioBufferCache.set(cacheKey, entry);
        pruneVoiceBufferCache();
        audioBufferPending.delete(cacheKey);
        return entry;
      })
      .catch((error) => {
        audioBufferPending.delete(cacheKey);
        throw error;
      });
    audioBufferPending.set(cacheKey, pending);
    return pending;
  }

  function playDecodedSfx(src, volume) {
    const context = getLowLatencyContext();
    const entry = audioBufferCache.get(src + "#raw");
    if (!context || !entry) return false;
    if (context.state === "suspended") context.resume().catch(function () {});
    try {
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = entry.buffer;
      gain.gain.value = volume;
      source.connect(gain);
      gain.connect(context.destination);
      source.start(0, entry.offset);
      return true;
    } catch (e) {
      return false;
    }
  }

  function primeSfx() {
    Object.keys(PATHS.sfx).forEach((name) => {
      const src = PATHS.sfx[name];
      try {
        const el = new Audio(src);
        el.preload = "auto";
        el.load();
        sfxCache[src] = el;
      } catch (e) {
        reportAudioIssue("prime " + src, e);
      }
      loadAudioBuffer(src, false).catch(function (error) {
        reportAudioIssue("decode " + src, error);
      });
    });
  }

  function playLocalReading(src, volume, onError) {
    if (!src) return;
    unlock();
    try {
      if (!localReadingAudio) {
        localReadingAudio = new Audio();
        localReadingAudio.preload = "auto";
      }
      const el = localReadingAudio;
      el.onerror = typeof onError === "function" ? onError : null;
      el.src = src;
      el.volume = volume;
      try {
        el.currentTime = 0;
      } catch (e) {}
      const p = el.play();
      if (p && p.catch && typeof onError === "function") {
        p.catch(onError);
      }
    } catch (e) {
      if (typeof onError === "function") onError();
    }
  }

  function playSfx(name) {
    if (!settings.sfx) return;
    const src = PATHS.sfx[name];
    if (!src) return;
    if (!playDecodedSfx(src, settings.sfxVolume)) {
      playSrc(src, settings.sfxVolume, sfxCache);
      loadAudioBuffer(src, false).catch(function () {});
    }
  }

  function stopReading() {
    readingSessionId += 1;
    if (localReadingAudio) {
      try {
        localReadingAudio.pause();
        localReadingAudio.onerror = null;
        localReadingAudio.removeAttribute("src");
        localReadingAudio.load();
      } catch (e) {}
    }
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
    if (activeReadingSource) {
      try {
        activeReadingSource.stop();
      } catch (e) {}
      activeReadingSource = null;
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
    playLocalReading(src, settings.voiceVolume);
  }

  function playWord(wordKey, fallbackText) {
    if (!settings.voice || !wordKey) {
      if (fallbackText) playReading(fallbackText);
      return;
    }
    unlock();
    stopReading();
    const key = String(wordKey).toLowerCase();
    const voice = WORD_VOICES[settings.wordVoice] || WORD_VOICES[DEFAULT_WORD_VOICE];
    const src = voice.dir + key + ".mp3" + (voice.revision ? `?v=${voice.revision}` : "");
    const sessionId = readingSessionId;
    const onError = function () {
      if (localReadingAudio) localReadingAudio.onerror = null;
      if (sessionId !== readingSessionId) return;
      if (fallbackText) playReading(fallbackText);
    };
    const context = getLowLatencyContext();
    if (!context) {
      playLocalReading(src, settings.voiceVolume, onError);
      return;
    }
    loadAudioBuffer(src, true)
      .then((entry) => {
        if (sessionId !== readingSessionId) return;
        if (context.state === "suspended") context.resume().catch(function () {});
        try {
          const source = context.createBufferSource();
          const gain = context.createGain();
          source.buffer = entry.buffer;
          gain.gain.value = settings.voiceVolume * entry.gain;
          source.connect(gain);
          gain.connect(context.destination);
          source.onended = function () {
            if (activeReadingSource === source) activeReadingSource = null;
          };
          activeReadingSource = source;
          source.start(0, entry.offset);
        } catch (e) {
          onError();
        }
      })
      .catch(onError);
  }

  function preloadWords(wordKeys) {
    const voice = WORD_VOICES[settings.wordVoice] || WORD_VOICES[DEFAULT_WORD_VOICE];
    const keys = Array.from(new Set(wordKeys || []));
    keys.forEach((wordKey) => {
      if (!wordKey) return;
      const key = String(wordKey).toLowerCase();
      const src = voice.dir + key + ".mp3" + (voice.revision ? `?v=${voice.revision}` : "");
      loadAudioBuffer(src, true).catch(function () {});
    });
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
      reportAudioIssue("TTS session", e);
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
    } catch (e) {
      reportAudioIssue("Web Speech fallback", e);
    }
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
        reportAudioIssue("Cloud TTS request", e);
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

    speakCloudTts(clean, sessionId)
      .then(function (ok) {
        if (ok) return;
        if (sessionId !== readingSessionId) return;
        playWebSpeechFallback(clean, sessionId);
      })
      .catch(function (error) {
        reportAudioIssue("Cloud TTS fallback", error);
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
    if (p && p.catch) {
      p.catch(function (error) {
        reportAudioIssue("start BGM", error);
      });
    }
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
    if (p && p.catch) {
      p.catch(function (error) {
        reportAudioIssue("resume BGM", error);
      });
    }
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

  function setWordVoice(voiceId) {
    const next = WORD_VOICES[voiceId] || WORD_VOICES[DEFAULT_WORD_VOICE];
    if (settings.wordVoice === next.id) return;
    stopReading();
    settings.wordVoice = next.id;
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
      if (p && p.catch) {
        p.catch(function (error) {
          reportAudioIssue("enable BGM", error);
        });
      }
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

  primeSfx();

  return {
    settings: settings,
    defaultWordVoice: DEFAULT_WORD_VOICE,
    wordVoices: WORD_VOICES,
    unlock: unlock,
    playSfx: playSfx,
    playKana: playKana,
    playWord: playWord,
    preloadWords: preloadWords,
    playReading: playReading,
    stopReading: stopReading,
    startBgm: startBgm,
    stopBgm: stopBgm,
    setVoice: setVoice,
    setWordVoice: setWordVoice,
    setBgm: setBgm,
    setSfx: setSfx,
    setBgmVolume: setBgmVolume,
  };
})();
