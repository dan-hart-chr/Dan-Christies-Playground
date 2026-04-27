export const DEFAULT_SCENE_STATE = {
  exposure: 1.02,
  bloomStrength: 0.06,
  bloomRadius: 0.71,
  bloomThreshold: 0.17,
  fogDensity: 0.012,
  backgroundColor: "#070605",
  fogColor: "#110f0d",
  caveColor: "#ffffff",
  caveRoughness: 0.93,
  caveMetalness: 0.66,
  iceColor: "#ffffff",
  iceRoughness: 0.67,
  iceMetalness: 0.5,
  ambientIntensity: 1.8,
  envMapIntensity: 0.6,
  keyIntensity: 6.4,
  fillIntensity: 1.4,
  rimIntensity: 1.8,
  portalIntensity: 7.6,
  portalColor: "#ead7b8",
  lightBreathing: 0.03,
  lightBreathingSpeed: 0.16,
  fogVolumeIntensity: 0,
  fogVolumeScale: 0.2,
  fogVolumeDrift: 0,
  fogVolumeTurbulence: 0,
  fogVolumeRise: 0,
  fogVolumePulse: 0,
  fogVolumeColor: "#eed6af",
};

export const SCENE_CONTROL_DEFINITIONS = [
  { type: "section", label: "Atmosphere" },
  { type: "range", key: "exposure", label: "Exposure", min: 0.2, max: 2.2, step: 0.01 },
  { type: "range", key: "bloomStrength", label: "Bloom Strength", min: 0, max: 2.5, step: 0.01 },
  { type: "range", key: "bloomRadius", label: "Bloom Radius", min: 0, max: 1.5, step: 0.01 },
  { type: "range", key: "bloomThreshold", label: "Bloom Threshold", min: 0, max: 1, step: 0.01 },
  { type: "range", key: "fogDensity", label: "Fog Density", min: 0, max: 0.12, step: 0.001 },
  { type: "color", key: "backgroundColor", label: "Background" },
  { type: "color", key: "fogColor", label: "Fog Color" },
  { type: "section", label: "Cave" },
  { type: "color", key: "caveColor", label: "Rock Color" },
  { type: "range", key: "caveRoughness", label: "Rock Roughness", min: 0, max: 1, step: 0.01 },
  { type: "range", key: "caveMetalness", label: "Rock Metalness", min: 0, max: 1, step: 0.01 },
  { type: "color", key: "iceColor", label: "Ice Color" },
  { type: "range", key: "iceRoughness", label: "Ice Roughness", min: 0, max: 1, step: 0.01 },
  { type: "range", key: "iceMetalness", label: "Ice Metalness", min: 0, max: 1, step: 0.01 },
  { type: "section", label: "Ambient" },
  { type: "range", key: "ambientIntensity", label: "Ambient", min: 0, max: 3, step: 0.01 },
  { type: "range", key: "envMapIntensity", label: "Env Map", min: 0, max: 2, step: 0.01 },
  { type: "section", label: "Light Animation" },
  { type: "range", key: "lightBreathing", label: "Cloud Dimming", min: 0, max: 0.5, step: 0.01 },
  { type: "range", key: "lightBreathingSpeed", label: "Cloud Speed", min: 0.05, max: 1, step: 0.01 },
  { type: "section", label: "Light Haze" },
  { type: "range", key: "fogVolumeIntensity", label: "Intensity", min: 0, max: 3, step: 0.01 },
  { type: "range", key: "fogVolumeScale", label: "Size", min: 0.2, max: 4, step: 0.01 },
  { type: "range", key: "fogVolumeDrift", label: "Drift Speed", min: 0, max: 3, step: 0.01 },
  { type: "range", key: "fogVolumeTurbulence", label: "Turbulence", min: 0, max: 4, step: 0.01 },
  { type: "range", key: "fogVolumeRise", label: "Rise", min: 0, max: 2, step: 0.01 },
  { type: "range", key: "fogVolumePulse", label: "Pulse", min: 0, max: 1, step: 0.01 },
  { type: "color", key: "fogVolumeColor", label: "Haze Color" },
];

export function createSceneControls(container, { state, onChange, onOpen }) {
  const nextState = { ...state };
  const bindings = new Map();

  const shell = document.createElement("div");
  shell.className = "settings-shell";

  const toggle = document.createElement("button");
  toggle.className = "settings-toggle";
  toggle.type = "button";
  toggle.textContent = "Lookdev";
  toggle.setAttribute("aria-expanded", "false");
  shell.append(toggle);

  const panel = document.createElement("section");
  panel.className = "settings-panel is-hidden";
  panel.setAttribute("aria-hidden", "true");
  shell.append(panel);

  const header = document.createElement("div");
  header.className = "settings-header";
  panel.append(header);

  const title = document.createElement("h2");
  title.className = "settings-title";
  title.textContent = "Cave Lookdev";
  header.append(title);

  const note = document.createElement("p");
  note.className = "settings-note";
  note.textContent = "Adjust atmosphere, material response, and live light levels.";
  header.append(note);

  const controls = document.createElement("div");
  controls.className = "settings-controls";
  panel.append(controls);

  for (const definition of SCENE_CONTROL_DEFINITIONS) {
    if (definition.type === "section") {
      const label = document.createElement("p");
      label.className = "settings-section-label";
      label.textContent = definition.label;
      controls.append(label);
      continue;
    }

    if (definition.type === "range") {
      controls.append(createRangeControl(definition));
      continue;
    }

    controls.append(createColorControl(definition));
  }

  toggle.addEventListener("click", () => {
    const willOpen = panel.classList.contains("is-hidden");
    if (willOpen) {
      onOpen?.();
    }
    panel.classList.toggle("is-hidden", !willOpen);
    toggle.setAttribute("aria-expanded", String(willOpen));
    panel.setAttribute("aria-hidden", String(!willOpen));
  });

  container.append(shell);

  function createRangeControl({ key, label, min, max, step }) {
    const row = document.createElement("label");
    row.className = "settings-row";

    const rowHeader = document.createElement("div");
    rowHeader.className = "settings-row-header";
    row.append(rowHeader);

    const labelElement = document.createElement("span");
    labelElement.className = "settings-label";
    labelElement.textContent = label;
    rowHeader.append(labelElement);

    const number = document.createElement("input");
    number.className = "settings-number";
    number.type = "number";
    number.min = String(min);
    number.max = String(max);
    number.step = String(step);
    rowHeader.append(number);

    const range = document.createElement("input");
    range.className = "settings-range";
    range.type = "range";
    range.min = String(min);
    range.max = String(max);
    range.step = String(step);
    row.append(range);

    const onInput = (rawValue) => {
      const parsed = clampValue(Number(rawValue), min, max);
      if (!Number.isFinite(parsed)) {
        return;
      }

      nextState[key] = parsed;
      syncBinding(key);
      onChange({ ...nextState });
    };

    range.addEventListener("input", (event) => onInput(event.target.value));
    number.addEventListener("input", (event) => onInput(event.target.value));

    bindings.set(key, {
      sync() {
        range.value = String(nextState[key]);
        number.value = formatValue(nextState[key], step);
      },
    });

    bindings.get(key).sync();
    return row;
  }

  function createColorControl({ key, label }) {
    const row = document.createElement("label");
    row.className = "settings-row";

    const rowHeader = document.createElement("div");
    rowHeader.className = "settings-row-header";
    row.append(rowHeader);

    const labelElement = document.createElement("span");
    labelElement.className = "settings-label";
    labelElement.textContent = label;
    rowHeader.append(labelElement);

    const hexInput = document.createElement("input");
    hexInput.className = "settings-color-hex";
    hexInput.type = "text";
    hexInput.spellcheck = false;
    rowHeader.append(hexInput);

    const colorInput = document.createElement("input");
    colorInput.className = "settings-color";
    colorInput.type = "color";
    row.append(colorInput);

    const onInput = (rawValue) => {
      const normalized = normalizeHexColor(rawValue);
      if (!normalized) {
        return;
      }

      nextState[key] = normalized;
      syncBinding(key);
      onChange({ ...nextState });
    };

    colorInput.addEventListener("input", (event) => onInput(event.target.value));
    hexInput.addEventListener("change", (event) => onInput(event.target.value));

    bindings.set(key, {
      sync() {
        colorInput.value = nextState[key];
        hexInput.value = nextState[key];
      },
    });

    bindings.get(key).sync();
    return row;
  }

  function syncBinding(key) {
    bindings.get(key)?.sync();
  }

  return {
    close() {
      panel.classList.add("is-hidden");
      panel.setAttribute("aria-hidden", "true");
      toggle.setAttribute("aria-expanded", "false");
    },
    setVisible(visible) {
      shell.style.display = visible ? "" : "none";
    },
  };
}

function clampValue(value, min, max) {
  if (!Number.isFinite(value)) {
    return Number.NaN;
  }

  return Math.min(max, Math.max(min, value));
}

function formatValue(value, step) {
  if (!Number.isFinite(value)) {
    return "";
  }

  const decimals = countDecimals(step);
  return value.toFixed(decimals);
}

function countDecimals(value) {
  const valueString = String(value);
  const decimalIndex = valueString.indexOf(".");
  return decimalIndex === -1 ? 0 : valueString.length - decimalIndex - 1;
}

function normalizeHexColor(value) {
  const trimmed = value.trim();
  const normalized = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  return /^#[0-9a-fA-F]{6}$/.test(normalized) ? normalized.toLowerCase() : null;
}
