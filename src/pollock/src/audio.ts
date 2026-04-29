/**
 * Pollock Audio
 *
 * Single voiceover layer. Available language recordings are loaded
 * up front. The voiceover loops with a short
 * gap between plays, similar to Brancusi's quote layer.
 */

const VOICEOVER_URLS: Record<string, string> = {
  en: `${import.meta.env.BASE_URL}Wolfgang-En-Pollock.mp3`,
  fr: `${import.meta.env.BASE_URL}James-Pollock-Fr.mp3`,
};

// MarTech
function fireAudioTrack(directCallId: string, payload: AudioTrackPayload): void {
  if (window.AnalyticsDataLayer?.audio !== undefined) {
    window.AnalyticsDataLayer.audio = {
      audio_playing: directCallId !== 'audio_complete',
      ...payload
    };
  }
  window._satellite?.track(directCallId, payload);
}


export function createPollockAudio() {
  let hasStarted = false
  let ctx: AudioContext | null = null;
  let started = false;
  let cancelled = false;
  let languageChanging = false; // MarTech: flag so onended knows NOT to fire audio_complete

  let masterGain: GainNode | null = null;
  let voiceoverGain: GainNode | null = null;

  const bufferCache = new Map<string, AudioBuffer>();
  let activeLanguage = 'en';
  let activeSource: AudioBufferSourceNode | null = null;
  let loopTimeout: ReturnType<typeof setTimeout> | null = null;

  // MarTech: Progress checkpoint timeouts being cleared on every stop
  const progressTimeouts: ReturnType<typeof setTimeout>[] = [];

  return {
    async start() {
      if (started) return;
      started = true;

      try {
        ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

        masterGain = ctx.createGain();
        masterGain.gain.value = 1;
        masterGain.connect(ctx.destination);

        voiceoverGain = ctx.createGain();
        voiceoverGain.gain.value = 0;
        voiceoverGain.connect(masterGain);

        // Load all available voiceover files
        const entries = Object.entries(VOICEOVER_URLS);
        const buffers = await Promise.all(
          entries.map(async ([, url]) => {
            const res = await fetch(url);
            const ab = await res.arrayBuffer();
            return ctx!.decodeAudioData(ab);
          }),
        );

        for (let i = 0; i < entries.length; i++) {
          bufferCache.set(entries[i][0], buffers[i]);
        }

        if (cancelled) return;

        // Fade voiceover in
        voiceoverGain.gain.setValueAtTime(0, ctx.currentTime);
        voiceoverGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 2);

        playCurrentVoiceover();
      } catch (err) {
        console.warn('Pollock audio failed to initialise:', err);
      }
    },

    setLanguage(lang: string) {
      if (lang === activeLanguage) return;

      activeLanguage = lang;

      if (!started || cancelled) return;

      // MarTech: Fire language change event BEFORE stopping to capture previous language
      fireAudioTrack('audio_language_change', {
        audio_title: window.artName ?? '',
        audio_language: lang
      });

      // MarTech: Flag so onended handler knows this isn't a natural completion
      languageChanging = true;
      stopCurrentVoiceover();
      languageChanging = false;
      hasStarted = false;
      playCurrentVoiceover();
    },

    setMuted(muted: boolean) {
      if (!masterGain) return;
      masterGain.gain.value = muted ? 0 : 1;
    },

    stop() {
      cancelled = true;
      stopCurrentVoiceover();
      if (ctx) ctx.close();
    },
  };

  function stopCurrentVoiceover() {
    if (loopTimeout) {
      clearTimeout(loopTimeout);
      loopTimeout = null;
    }

    // MarTech: Clear all pending progress checkpoints
    for (const t of progressTimeouts) clearTimeout(t);
    progressTimeouts.length = 0;

    // Stop active source
    if (activeSource) {
      try {
        activeSource.onended = null;
        activeSource.stop();
      } catch {
        // already stopped
      }
      activeSource = null;
    }
  }
  
// MarTech
  function scheduleProgressTracking(durationSeconds: number, lang: string): void {
    const milestones: Array<{ label: string; fraction: number }> = [
      { label: '25%', fraction: 0.25 },
      { label: '50%', fraction: 0.50 },
      { label: '75%', fraction: 0.75 },
    ];

    for (const milestone of milestones) {
      const delayMs = durationSeconds * milestone.fraction * 1000;
      const t = setTimeout(() => {
        // Only fire if this play session is still active
        if (cancelled) return;
        fireAudioTrack('audio_progress', {
          audio_title: window.artName ?? '',
          audio_language: lang,
          audio_progress: milestone.label,
        });
      }, delayMs);
      progressTimeouts.push(t);
    }
  }

  function playCurrentVoiceover() {
    const lang = bufferCache.has(activeLanguage) ? activeLanguage : 'en';
    const buffer = bufferCache.get(lang);
    if (!buffer || cancelled || !ctx || !voiceoverGain) return;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(voiceoverGain);
    activeSource = source;

    source.start(0);

    // MarTech
    if (!hasStarted) {
      hasStarted = true;
      fireAudioTrack('audio_start', {
        audio_title: window.artName ?? '',
        audio_language: lang,
      });
    }

    // MarTech Progress checkpoints (25 / 50 / 75%)
    scheduleProgressTracking(buffer.duration, lang);

    // MarTech audio_complete vs loop restart
    source.onended = () => {
      activeSource = null;

      if (cancelled) return;

      // MarTech languageChanging flag distinguishes a forced stop from a natural end
      if (!languageChanging) {
        fireAudioTrack('audio_complete', {
          audio_title: window.artName ?? '',
          audio_language: lang,
        });
      }

      // MarTech Schedule next loop
      loopTimeout = setTimeout(() => playCurrentVoiceover(), 2000 + Math.random() * 2000);
    };
  }
}
