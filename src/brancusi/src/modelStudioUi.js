export function createModelStudioUi(
  container,
  {
    state,
    onChange,
    onPrint,
    onCopy,
  } = {},
) {
  const nextState = { ...state };
  const bindings = new Map();

  const shell = document.createElement("div");
  shell.className = "debug-shell model-studio-shell";

  const toggle = document.createElement("button");
  toggle.className = "debug-toggle";
  toggle.type = "button";
  toggle.textContent = "Studio";
  shell.append(toggle);

  const panel = document.createElement("section");
  panel.className = "debug-panel is-hidden";
  shell.append(panel);

  const header = document.createElement("div");
  header.className = "debug-header";
  panel.append(header);

  const titleGroup = document.createElement("div");
  titleGroup.className = "debug-header-copy";
  header.append(titleGroup);

  const title = document.createElement("h2");
  title.className = "debug-title";
  title.textContent = "Model Studio";
  titleGroup.append(title);

  const note = document.createElement("p");
  note.className = "debug-note";
  note.textContent = "Controls for the standalone Brancusi head viewer.";
  titleGroup.append(note);

  const closeButton = document.createElement("button");
  closeButton.className = "debug-action-button";
  closeButton.type = "button";
  closeButton.textContent = "Close";
  header.append(closeButton);

  const controls = document.createElement("div");
  controls.className = "settings-controls";
  panel.append(controls);

  appendSection("Background");
  const backgroundPresetControl = createSegmentControl({
    label: "Preset",
    value: getBackgroundPreset(nextState.backgroundColor),
    options: [
      { value: "black", label: "Black" },
      { value: "white", label: "White" },
    ],
    onChange(value) {
      updateState({ backgroundColor: value === "white" ? "#ffffff" : "#050505" });
    },
  });
  controls.append(backgroundPresetControl.element);
  bindings.set("backgroundPreset", {
    sync() {
      backgroundPresetControl.setValue(getBackgroundPreset(nextState.backgroundColor));
    },
  });
  controls.append(createColorControl({ key: "backgroundColor", label: "Background" }));

  appendSection("Rendering");
  controls.append(createRangeControl({ key: "exposure", label: "Exposure", min: 0.2, max: 2.2, step: 0.01 }));
  controls.append(createRangeControl({ key: "environmentIntensity", label: "HDR Environment", min: 0, max: 2.5, step: 0.01 }));

  appendSection("Neutral Lights");
  controls.append(createRangeControl({ key: "ambientIntensity", label: "Ambient", min: 0, max: 4, step: 0.01 }));
  controls.append(createRangeControl({ key: "keyIntensity", label: "Key", min: 0, max: 6, step: 0.01 }));
  controls.append(createRangeControl({ key: "fillIntensity", label: "Fill", min: 0, max: 4, step: 0.01 }));
  controls.append(createRangeControl({ key: "rimIntensity", label: "Rim", min: 0, max: 4, step: 0.01 }));

  appendSection("Model");
  controls.append(createRangeControl({ key: "modelScale", label: "Scale", min: 0.6, max: 2.2, step: 0.01 }));
  controls.append(createRangeControl({ key: "cameraDistance", label: "Camera Distance", min: 2.2, max: 8, step: 0.01 }));
  controls.append(createRangeControl({ key: "autoRotateSpeed", label: "Auto Rotate", min: 0, max: 0.35, step: 0.005 }));

  const outputRow = document.createElement("div");
  outputRow.className = "debug-segment";
  controls.append(outputRow);

  const printButton = document.createElement("button");
  printButton.className = "debug-action-button";
  printButton.type = "button";
  printButton.textContent = "Print JSON";
  outputRow.append(printButton);

  const copyButton = document.createElement("button");
  copyButton.className = "debug-action-button";
  copyButton.type = "button";
  copyButton.textContent = "Copy";
  outputRow.append(copyButton);

  const output = document.createElement("pre");
  output.className = "debug-output is-hidden";
  controls.append(output);

  toggle.addEventListener("click", () => setOpen(panel.classList.contains("is-hidden")));
  closeButton.addEventListener("click", () => setOpen(false));

  printButton.addEventListener("click", () => {
    output.textContent = onPrint?.() ?? "";
    output.classList.toggle("is-hidden", !output.textContent);
  });

  copyButton.addEventListener("click", async () => {
    const text = output.textContent || onPrint?.() || "";
    const didCopy = await onCopy?.(text);
    copyButton.textContent = didCopy ? "Copied" : "Copy";
    window.setTimeout(() => {
      copyButton.textContent = "Copy";
    }, 1200);
  });

  container.append(shell);

  return {
    setState(next) {
      Object.assign(nextState, next);
      for (const binding of bindings.values()) {
        binding.sync();
      }
    },
  };

  function appendSection(label) {
    const sectionLabel = document.createElement("p");
    sectionLabel.className = "settings-section-label";
    sectionLabel.textContent = label;
    controls.append(sectionLabel);
  }

  function setOpen(open) {
    panel.classList.toggle("is-hidden", !open);
    toggle.textContent = open ? "Close Studio" : "Studio";
  }

  function updateState(patch) {
    Object.assign(nextState, patch);
    for (const binding of bindings.values()) {
      binding.sync();
    }
    onChange?.({ ...nextState });
  }

  function createRangeControl({ key, label, min, max, step }) {
    const row = document.createElement("label");
    row.className = "settings-row";

    const header = document.createElement("div");
    header.className = "settings-row-header";
    row.append(header);

    const labelElement = document.createElement("span");
    labelElement.className = "settings-label";
    labelElement.textContent = label;
    header.append(labelElement);

    const number = document.createElement("input");
    number.className = "settings-number";
    number.type = "number";
    number.min = String(min);
    number.max = String(max);
    number.step = String(step);
    header.append(number);

    const range = document.createElement("input");
    range.className = "settings-range";
    range.type = "range";
    range.min = String(min);
    range.max = String(max);
    range.step = String(step);
    row.append(range);

    const onInput = (rawValue) => {
      const parsed = clampValue(Number(rawValue), min, max);
      if (!Number.isFinite(parsed)) return;
      updateState({ [key]: parsed });
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

    const header = document.createElement("div");
    header.className = "settings-row-header";
    row.append(header);

    const labelElement = document.createElement("span");
    labelElement.className = "settings-label";
    labelElement.textContent = label;
    header.append(labelElement);

    const hex = document.createElement("input");
    hex.className = "settings-color-hex";
    hex.type = "text";
    hex.spellcheck = false;
    header.append(hex);

    const color = document.createElement("input");
    color.className = "settings-color";
    color.type = "color";
    row.append(color);

    const onInput = (rawValue) => {
      const normalized = normalizeHexColor(rawValue);
      if (!normalized) return;
      updateState({ [key]: normalized });
    };

    color.addEventListener("input", (event) => onInput(event.target.value));
    hex.addEventListener("change", (event) => onInput(event.target.value));

    bindings.set(key, {
      sync() {
        color.value = nextState[key];
        hex.value = nextState[key];
      },
    });

    bindings.get(key).sync();
    return row;
  }
}

function createSegmentControl({ label, value, options, onChange }) {
  const element = document.createElement("div");
  element.className = "settings-row";

  const labelElement = document.createElement("span");
  labelElement.className = "settings-label";
  labelElement.textContent = label;
  element.append(labelElement);

  const group = document.createElement("div");
  group.className = "debug-segment";
  element.append(group);

  const buttons = new Map();

  for (const option of options) {
    const button = document.createElement("button");
    button.className = "debug-action-button";
    button.type = "button";
    button.textContent = option.label;
    button.classList.toggle("is-active", option.value === value);
    button.addEventListener("click", () => {
      for (const [buttonValue, targetButton] of buttons) {
        targetButton.classList.toggle("is-active", buttonValue === option.value);
      }
      onChange(option.value);
    });
    buttons.set(option.value, button);
    group.append(button);
  }

  return {
    element,
    setValue(nextValue) {
      for (const [buttonValue, targetButton] of buttons) {
        targetButton.classList.toggle("is-active", buttonValue === nextValue);
      }
    },
  };
}

function getBackgroundPreset(color) {
  return color?.toLowerCase() === "#ffffff" ? "white" : "black";
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
