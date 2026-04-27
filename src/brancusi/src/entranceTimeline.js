/**
 * Entrance Timeline
 *
 * Orchestrates a multi-phase light fade-in and camera move when the
 * experience first loads.  Every value is exposed in a Studio "Entrance"
 * tab so the artist can tweak timings and target intensities without
 * touching code.
 */

// ── Default keyframe data ────────────────────────────────────────────────────

export const DEFAULT_ENTRANCE_TIMELINE = {
  // Phase 0 – everything starts dark
  start: {
    ambientIntensity: 0,
    fogVolumeIntensity: 0,
    envMapIntensity: 0,
    "light-9": 0,
    "light-3": 0,
    "light-4": 0,
    "light-5": 0,
    "light-6": 0,
  },

  // Phase 1 – first lights fade in
  phase1: {
    delay: 2,
    duration: 2,
    targets: {
      envMapIntensity: 0.60,
      "light-6": 19.86,
      "light-5": 44.135,
    },
  },

  // Phase 2 – remaining lights come up
  phase2: {
    delay: 6,
    duration: 2,
    targets: {
      "light-3": 21.737,
      "light-9": 28.136,
      ambientIntensity: 1.8,
      fogVolumeIntensity: 0,
    },
  },

  // Camera keyframes – each segment lerps between consecutive keyframes
  cameraKeyframes: [
    {
      // Start – wide establishing angle
      time: 0,
      position: [-39.64, 12.841, 9.698],
      target: [-26.827, 6.513, -1.95],
      focalLength: 18,
    },
    {
      // End of phase 2 – settled into production shot
      time: 10,
      position: [-29.711, 6.894, -16.031],
      target: [-26.827, 5.739, -1.95],
      focalLength: 18,
    },
    {
      // Phase 3 – push in tighter on the sculpture
      time: 18,
      position: [-29.711, 6.894, -16.031],
      target: [-26.827, 5.739, -1.95],
      focalLength: 58,
    },
  ],
};

// ── Timeline runner ──────────────────────────────────────────────────────────

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * @param {object} opts
 * @param {object} opts.timeline
 * @param {Function} opts.applySceneState
 * @param {Function} opts.setLightIntensity
 * @param {Function} opts.getSceneState
 * @param {Function} opts.setCameraState – (position, target, focalLength) => void
 * @param {Function} [opts.onComplete]
 */
export function runEntranceTimeline({ timeline, applySceneState, setLightIntensity, getSceneState, setCameraState, onPhase2Start, onComplete }) {
  let cancelled = false;
  const startTime = performance.now();

  const sceneKeys = ["ambientIntensity", "fogVolumeIntensity", "envMapIntensity"];
  const isSceneKey = (k) => sceneKeys.includes(k);

  // Apply starting values immediately
  const sceneStartPatch = {};
  for (const [key, value] of Object.entries(timeline.start)) {
    if (isSceneKey(key)) {
      sceneStartPatch[key] = value;
    } else {
      setLightIntensity(key, value);
    }
  }
  applySceneState(sceneStartPatch);

  // Set camera to first keyframe
  const keyframes = timeline.cameraKeyframes;
  if (keyframes?.length > 0 && setCameraState) {
    const kf = keyframes[0];
    setCameraState(kf.position, kf.target, kf.focalLength);
  }

  // Build light/scene phase descriptors
  const phases = [timeline.phase1, timeline.phase2].filter(Boolean);
  const phaseSnapshots = phases.map(() => null);
  let phase2Started = false;

  function tick() {
    if (cancelled) return;

    const elapsed = (performance.now() - startTime) / 1000;
    let allDone = true;

    // ── Light / scene phases ───────────────────────────────────
    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      const phaseStart = phase.delay;
      const phaseEnd = phase.delay + phase.duration;

      if (elapsed < phaseStart) {
        allDone = false;
        continue;
      }

      if (!phaseSnapshots[i]) {
        if (i === 1 && !phase2Started) {
          phase2Started = true;
          onPhase2Start?.();
        }
        const snap = {};
        const currentScene = getSceneState();
        for (const key of Object.keys(phase.targets)) {
          if (isSceneKey(key)) {
            snap[key] = currentScene[key];
          }
        }
        phaseSnapshots[i] = snap;
        phaseSnapshots[i]._lightFrom = {};
        for (const key of Object.keys(phase.targets)) {
          if (!isSceneKey(key)) {
            phaseSnapshots[i]._lightFrom[key] = getLightFromValue(key, i, timeline);
          }
        }
      }

      const raw = Math.min(1, (elapsed - phaseStart) / phase.duration);
      const t = easeInOutCubic(raw);

      const scenePatch = {};
      for (const [key, targetValue] of Object.entries(phase.targets)) {
        if (isSceneKey(key)) {
          const from = phaseSnapshots[i][key] ?? 0;
          scenePatch[key] = from + (targetValue - from) * t;
        } else {
          const from = phaseSnapshots[i]._lightFrom[key] ?? 0;
          setLightIntensity(key, from + (targetValue - from) * t);
        }
      }

      if (Object.keys(scenePatch).length > 0) {
        applySceneState(scenePatch);
      }

      if (elapsed < phaseEnd) {
        allDone = false;
      }
    }

    // ── Camera keyframes ───────────────────────────────────────
    if (keyframes?.length > 1 && setCameraState) {
      const lastKf = keyframes[keyframes.length - 1];
      if (elapsed < lastKf.time) {
        allDone = false;

        // Find which segment we're in
        let segIndex = 0;
        for (let i = 0; i < keyframes.length - 1; i++) {
          if (elapsed >= keyframes[i].time) {
            segIndex = i;
          }
        }

        const from = keyframes[segIndex];
        const to = keyframes[segIndex + 1];
        const segDuration = to.time - from.time;
        const raw = segDuration > 0 ? Math.min(1, (elapsed - from.time) / segDuration) : 1;
        const t = easeInOutCubic(raw);

        const pos = lerpArray(from.position, to.position, t);
        const tgt = lerpArray(from.target, to.target, t);
        const fl = from.focalLength + (to.focalLength - from.focalLength) * t;
        setCameraState(pos, tgt, fl);
      } else {
        // Ensure final keyframe is exact
        setCameraState(lastKf.position, lastKf.target, lastKf.focalLength);
      }
    }

    if (!allDone) {
      requestAnimationFrame(tick);
    } else {
      onComplete?.();
    }
  }

  requestAnimationFrame(tick);

  return {
    cancel() {
      cancelled = true;
    },
  };
}

function lerpArray(a, b, t) {
  return a.map((v, i) => v + (b[i] - v) * t);
}

function getLightFromValue(lightId, phaseIndex, timeline) {
  const phases = [timeline.phase1, timeline.phase2];
  for (let i = phaseIndex - 1; i >= 0; i--) {
    if (phases[i]?.targets[lightId] !== undefined) {
      return phases[i].targets[lightId];
    }
  }
  return timeline.start[lightId] ?? 0;
}

// ── Entrance UI Tab ──────────────────────────────────────────────────────────

const SCENE_KEY_LABELS = {
  ambientIntensity: "Ambient",
  fogVolumeIntensity: "Light Haze",
  envMapIntensity: "Env Map",
};

const LIGHT_LABELS = {
  "light-9": "Spot 09",
  "light-3": "Spot 03",
  "light-4": "Point 04",
  "light-5": "Spot 05",
  "light-6": "Spot 06",
};

export function createEntranceTabContent({ timeline, onReplay }) {
  const root = document.createElement("div");
  root.className = "settings-controls";

  // Replay button
  const replayRow = document.createElement("div");
  replayRow.className = "debug-segment";
  replayRow.style.marginBottom = "12px";
  const replayButton = document.createElement("button");
  replayButton.className = "debug-action-button";
  replayButton.type = "button";
  replayButton.textContent = "Replay Entrance";
  replayButton.addEventListener("click", () => onReplay());
  replayRow.append(replayButton);
  root.append(replayRow);

  // ── Start values ───────────────────────────────────────────────
  root.append(sectionLabel("Start Values (all begin at)"));
  for (const [key, value] of Object.entries(timeline.start)) {
    const label = SCENE_KEY_LABELS[key] ?? LIGHT_LABELS[key] ?? key;
    root.append(
      createTimelineRange({
        label,
        value,
        min: 0,
        max: key.startsWith("light") ? 100 : 5,
        step: 0.01,
        onChange(v) {
          timeline.start[key] = v;
        },
      }),
    );
  }

  // ── Phase 1 ────────────────────────────────────────────────────
  root.append(sectionLabel("Phase 1 — Lights"));
  appendPhaseControls(root, timeline.phase1);

  // ── Phase 2 ────────────────────────────────────────────────────
  root.append(sectionLabel("Phase 2 — Lights"));
  appendPhaseControls(root, timeline.phase2);

  // ── Camera keyframes ───────────────────────────────────────────
  for (let i = 0; i < timeline.cameraKeyframes.length; i++) {
    const kf = timeline.cameraKeyframes[i];
    root.append(sectionLabel(`Camera Keyframe ${i + 1}`));

    root.append(
      createTimelineRange({
        label: "Time (s)",
        value: kf.time,
        min: 0,
        max: 60,
        step: 0.1,
        onChange(v) {
          kf.time = v;
        },
      }),
    );

    root.append(
      createTimelineRange({
        label: "Focal Length",
        value: kf.focalLength,
        min: 12,
        max: 135,
        step: 1,
        onChange(v) {
          kf.focalLength = v;
        },
      }),
    );

    appendVec3Controls(root, kf.position, "Pos");
    appendVec3Controls(root, kf.target, "Target");
  }

  return root;

  function appendPhaseControls(container, phase) {
    container.append(
      createTimelineRange({
        label: "Delay (s)",
        value: phase.delay,
        min: 0,
        max: 20,
        step: 0.1,
        onChange(v) {
          phase.delay = v;
        },
      }),
    );
    container.append(
      createTimelineRange({
        label: "Duration (s)",
        value: phase.duration,
        min: 0.1,
        max: 20,
        step: 0.1,
        onChange(v) {
          phase.duration = v;
        },
      }),
    );
    for (const [key, value] of Object.entries(phase.targets)) {
      const label = SCENE_KEY_LABELS[key] ?? LIGHT_LABELS[key] ?? key;
      container.append(
        createTimelineRange({
          label,
          value,
          min: 0,
          max: key.startsWith("light") ? 100 : 5,
          step: 0.01,
          onChange(v) {
            phase.targets[key] = v;
          },
        }),
      );
    }
  }

  function appendVec3Controls(container, arr, prefix) {
    const labels = ["X", "Y", "Z"];
    for (let i = 0; i < 3; i++) {
      container.append(
        createTimelineRange({
          label: `${prefix} ${labels[i]}`,
          value: arr[i],
          min: -60,
          max: 60,
          step: 0.01,
          onChange(v) {
            arr[i] = v;
          },
        }),
      );
    }
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function sectionLabel(text) {
  const el = document.createElement("p");
  el.className = "settings-section-label";
  el.textContent = text;
  return el;
}

function createTimelineRange({ label, value, min, max, step, onChange }) {
  const row = document.createElement("label");
  row.className = "settings-row";

  const rowHeader = document.createElement("div");
  rowHeader.className = "settings-row-header";
  row.append(rowHeader);

  const labelEl = document.createElement("span");
  labelEl.className = "settings-label";
  labelEl.textContent = label;
  rowHeader.append(labelEl);

  const number = document.createElement("input");
  number.className = "settings-number";
  number.type = "number";
  number.min = String(min);
  number.max = String(max);
  number.step = String(step);
  number.value = formatValue(value, step);
  rowHeader.append(number);

  const range = document.createElement("input");
  range.className = "settings-range";
  range.type = "range";
  range.min = String(min);
  range.max = String(max);
  range.step = String(step);
  range.value = String(value);
  row.append(range);

  const onInput = (rawValue) => {
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) return;
    const clamped = Math.min(max, Math.max(min, parsed));
    range.value = String(clamped);
    number.value = formatValue(clamped, step);
    onChange(clamped);
  };

  range.addEventListener("input", (e) => onInput(e.target.value));
  number.addEventListener("input", (e) => onInput(e.target.value));

  return row;
}

function formatValue(value, step) {
  const decimals = countDecimals(step);
  return value.toFixed(decimals);
}

function countDecimals(value) {
  const s = String(value);
  const i = s.indexOf(".");
  return i === -1 ? 0 : s.length - i - 1;
}
