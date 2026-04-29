/**
 * Showcase Audio
 *
 * Two layers:
 *  1. Ambient music  (Lotus relaxation)  – loops continuously, low volume
 *  2. Spoken quotes  – loops in selected language with reverb, louder
 *
 * Layer 1 starts on `.start()`.  Layer 2 starts on `.startQuotes()`.
 */

const BASE = import.meta.env.BASE_URL;
const AMBIENT_MUSIC_URL = `${BASE}audio/Lotus_Sound_Dream-Ambient-Sleep-Relaxation.mp3`;

export const LANGUAGES = [
  { id: "english", label: "English", url: `${BASE}audio/James-Brancusi-En.mp3` },
  { id: "german", label: "Deutsch", url: `${BASE}audio/quotes/german.mp3` },
  { id: "french", label: "Français", url: `${BASE}audio/quotes/german2.mp3` },
  { id: "japanese", label: "日本語", url: `${BASE}audio/quotes/japanese.mp3` },
];

export const LANGUAGE_ANALYTICS_CODES = {
  english: "en",
  german: "de",
  french: "fr",
  japanese: "ja",
};

export function getAnalyticsLanguageCode(languageId) {
  return LANGUAGE_ANALYTICS_CODES[languageId] || languageId || "en";
}

function getArtName() {
  return window.artName;
}

function fireAudioTrack(directCallId, payload) {
  if (window.AnalyticsDataLayer?.audio !== undefined) {
    window.AnalyticsDataLayer.audio = {
      audio_playing: directCallId !== "audio_complete",
      ...payload,
    };
  }
  window._satellite?.track(directCallId, payload);
}

export function createShowcaseAudio() {
  let hasStarted = false;
  let ctx = null;
  let started = false;
  let cancelled = false;
  let languageChanging = false;

  // Master gain (for mute toggle)
  let masterGain = null;

  // Ambient layers
  let ambientMusicSource = null;
  let ambientMusicGain = null;

  // Quote layer
  let quoteMasterGain = null;
  let quoteDryGain = null;
  let quoteWetGain = null;
  let quotePreDelay = null;
  let quotesStarted = false;

  /** @type {Map<string, AudioBuffer>} */
  const bufferCache = new Map();
  let activeLanguage = "english";
  let activeQuoteSource = null;
  let quoteLoopTimeout = null;
  const progressTimeouts = [];

  return {
    async start() {
      if (started) return;
      started = true;

      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();

        // ── Master output ──────────────────────────────────────
        masterGain = ctx.createGain();
        masterGain.gain.value = 1;
        masterGain.connect(ctx.destination);

        // ── Ambient music layer ────────────────────────────────
        ambientMusicGain = ctx.createGain();
        ambientMusicGain.gain.value = 0;
        ambientMusicGain.connect(masterGain);

        // ── Quote layer (with reverb) ──────────────────────────
        quoteMasterGain = ctx.createGain();
        quoteMasterGain.gain.value = 0;
        quoteMasterGain.connect(masterGain);

        quoteDryGain = ctx.createGain();
        quoteDryGain.gain.value = 0.45;
        quoteDryGain.connect(quoteMasterGain);

        const convolver = ctx.createConvolver();
        convolver.buffer = generateGalleryImpulse(ctx, 4.2, 3.5);

        const lowpass = ctx.createBiquadFilter();
        lowpass.type = "lowpass";
        lowpass.frequency.value = 2400;

        const highpass = ctx.createBiquadFilter();
        highpass.type = "highpass";
        highpass.frequency.value = 120;

        quotePreDelay = ctx.createDelay(0.15);
        quotePreDelay.delayTime.value = 0.06;

        quoteWetGain = ctx.createGain();
        quoteWetGain.gain.value = 0.4;

        quotePreDelay.connect(convolver);
        convolver.connect(lowpass);
        lowpass.connect(highpass);
        highpass.connect(quoteWetGain);
        quoteWetGain.connect(quoteMasterGain);

        // ── Load all audio in parallel ─────────────────────────
        const loadBuffer = async (url) => {
          const response = await fetch(url);
          const arrayBuffer = await response.arrayBuffer();
          return ctx.decodeAudioData(arrayBuffer);
        };

        const [musicBuffer, ...quoteBuffers] = await Promise.all([
          loadBuffer(AMBIENT_MUSIC_URL),
          ...LANGUAGES.map((lang) => loadBuffer(lang.url)),
        ]);

        for (let i = 0; i < LANGUAGES.length; i++) {
          bufferCache.set(LANGUAGES[i].id, quoteBuffers[i]);
        }

        if (cancelled) return;

        // Start ambient loop immediately
        ambientMusicSource = ctx.createBufferSource();
        ambientMusicSource.buffer = musicBuffer;
        ambientMusicSource.loop = true;
        ambientMusicSource.connect(ambientMusicGain);
        ambientMusicSource.start(0);

        // Fade ambient layer in
        ambientMusicGain.gain.setValueAtTime(0, ctx.currentTime);
        ambientMusicGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 4);
      } catch (err) {
        console.warn("Showcase audio failed to initialise:", err);
      }
    },

    /** Start the spoken quotes layer after the intro flow completes. */
    startQuotes() {
      if (quotesStarted || !ctx || cancelled) return;
      quotesStarted = true;

      quoteMasterGain.gain.setValueAtTime(0, ctx.currentTime);
      quoteMasterGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 2);

      playCurrentQuote();
    },

    setLanguage(languageId) {
      if (languageId === activeLanguage) return;
      activeLanguage = languageId;

      if (!quotesStarted || cancelled) return;
      fireAudioTrack("audio_language_change", {
        audio_title: getArtName(),
        audio_language: getAnalyticsLanguageCode(languageId),
      });
      languageChanging = true;
      stopCurrentQuote();
      languageChanging = false;
      hasStarted = false;
      playCurrentQuote();
    },

    getLanguage() {
      return activeLanguage;
    },

    setMuted(muted) {
      if (!masterGain) return;
      masterGain.gain.value = muted ? 0 : 1;
    },

    stop() {
      cancelled = true;
      stopCurrentQuote();
      if (ctx) {
        ctx.close();
      }
    },
  };

  function stopCurrentQuote() {
    if (quoteLoopTimeout) {
      clearTimeout(quoteLoopTimeout);
      quoteLoopTimeout = null;
    }
    for (const timeout of progressTimeouts) {
      clearTimeout(timeout);
    }
    progressTimeouts.length = 0;
    if (activeQuoteSource) {
      try {
        activeQuoteSource.onended = null;
        activeQuoteSource.stop();
      } catch (_) {
        // already stopped
      }
      activeQuoteSource = null;
    }
  }

  function scheduleProgressTracking(durationSeconds, languageId) {
    const milestones = [
      { label: "25%", fraction: 0.25 },
      { label: "50%", fraction: 0.5 },
      { label: "75%", fraction: 0.75 },
    ];
    const audioLanguage = getAnalyticsLanguageCode(languageId);

    for (const milestone of milestones) {
      const timeout = setTimeout(() => {
        if (cancelled) return;
        fireAudioTrack("audio_progress", {
          audio_title: getArtName(),
          audio_language: audioLanguage,
          audio_progress: milestone.label,
        });
      }, durationSeconds * milestone.fraction * 1000);
      progressTimeouts.push(timeout);
    }
  }

  function playCurrentQuote() {
    const buffer = bufferCache.get(activeLanguage);
    if (!buffer || cancelled || !ctx) return;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(quoteDryGain);
    source.connect(quotePreDelay);
    activeQuoteSource = source;

    source.start(0);

    if (!hasStarted) {
      hasStarted = true;
      fireAudioTrack("audio_start", {
        audio_title: getArtName(),
        audio_language: getAnalyticsLanguageCode(activeLanguage),
      });
    }

    scheduleProgressTracking(buffer.duration, activeLanguage);

    source.onended = () => {
      activeQuoteSource = null;
      if (cancelled) return;
      if (!languageChanging) {
        fireAudioTrack("audio_complete", {
          audio_title: getArtName(),
          audio_language: getAnalyticsLanguageCode(activeLanguage),
        });
      }
      quoteLoopTimeout = setTimeout(() => playCurrentQuote(), 2000 + Math.random() * 2000);
    };
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateGalleryImpulse(ctx, duration = 4.2, decay = 3.5) {
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * duration);
  const impulse = ctx.createBuffer(2, length, rate);

  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      const t = i / rate;
      const envelope = Math.exp(-t * decay);
      const earlyBoost = t < 0.08 ? 1.4 : 1;
      data[i] = (Math.random() * 2 - 1) * envelope * earlyBoost;
      if (t > 0.5) {
        data[i] *= 0.7 + 0.3 * Math.exp(-(t - 0.5) * 1.2);
      }
    }
  }

  return impulse;
}
