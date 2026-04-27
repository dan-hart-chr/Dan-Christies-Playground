const LAYOUT_TAB = "layout";
const LIGHTS_TAB = "lights";
const LOOK_TAB = "look";
const ENTRANCE_TAB = "entrance";

export function createDebugLayoutUi(
  container,
  {
    staticTargets,
    sceneDefinitions,
    sceneState,
    cameraSettings,
    onToggle,
    onPrint,
    onModeChange,
    onTargetChange,
    onViewModeChange,
    onLightingModeChange,
    onShellModeChange,
    onCopy,
    onSceneChange,
    onCameraSettingsChange,
    onAddLight,
    onDeleteLight,
    onLightChange,
    onScoutModeChange,
    entranceTabContent,
  },
) {
  const staticTargetButtons = new Map();
  const cameraBindings = new Map();
  const sceneBindings = new Map();
  const tabButtons = new Map();
  const tabPanels = new Map();
  const nextCameraSettings = { ...cameraSettings };
  const nextSceneState = { ...sceneState };

  let activeTab = LAYOUT_TAB;
  let activeTarget = staticTargets[0]?.id ?? "cave";
  let scoutVisible = false;

  const shell = document.createElement("div");
  shell.className = "debug-shell";

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
  title.textContent = "Scene Studio";
  titleGroup.append(title);

  const selected = document.createElement("p");
  selected.className = "debug-selected";
  selected.textContent = "Selected: none";
  titleGroup.append(selected);

  const viewportCard = document.createElement("section");
  viewportCard.className = "debug-card";
  panel.append(viewportCard);

  const viewportHeader = document.createElement("div");
  viewportHeader.className = "debug-card-header";
  viewportCard.append(viewportHeader);

  const viewportTitle = document.createElement("p");
  viewportTitle.className = "debug-label";
  viewportTitle.textContent = "Viewport";
  viewportHeader.append(viewportTitle);

  const viewportButtons = document.createElement("div");
  viewportButtons.className = "debug-segment";
  viewportHeader.append(viewportButtons);

  const globalViewButton = document.createElement("button");
  globalViewButton.className = "debug-action-button";
  globalViewButton.type = "button";
  globalViewButton.textContent = "Global";
  globalViewButton.addEventListener("click", () => onViewModeChange("global"));
  viewportButtons.append(globalViewButton);

  const cameraViewButton = document.createElement("button");
  cameraViewButton.className = "debug-action-button";
  cameraViewButton.type = "button";
  cameraViewButton.textContent = "Camera";
  cameraViewButton.addEventListener("click", () => onViewModeChange("camera"));
  viewportButtons.append(cameraViewButton);

  const viewportHint = document.createElement("p");
  viewportHint.className = "debug-note";
  viewportCard.append(viewportHint);

  const lightingRow = document.createElement("div");
  lightingRow.className = "debug-card-row";
  viewportCard.append(lightingRow);

  const lightingLabel = document.createElement("p");
  lightingLabel.className = "debug-label";
  lightingLabel.textContent = "Lighting";
  lightingRow.append(lightingLabel);

  const lightingButtons = document.createElement("div");
  lightingButtons.className = "debug-segment";
  lightingRow.append(lightingButtons);

  const productionLightingButton = document.createElement("button");
  productionLightingButton.className = "debug-action-button";
  productionLightingButton.type = "button";
  productionLightingButton.textContent = "Production";
  productionLightingButton.addEventListener("click", () => onLightingModeChange("production"));
  lightingButtons.append(productionLightingButton);

  const debugLightingButton = document.createElement("button");
  debugLightingButton.className = "debug-action-button";
  debugLightingButton.type = "button";
  debugLightingButton.textContent = "Debug Light";
  debugLightingButton.addEventListener("click", () => onLightingModeChange("debug"));
  lightingButtons.append(debugLightingButton);

  const shellRow = document.createElement("div");
  shellRow.className = "debug-card-row";
  viewportCard.append(shellRow);

  const shellLabel = document.createElement("p");
  shellLabel.className = "debug-label";
  shellLabel.textContent = "Shell";
  shellRow.append(shellLabel);

  const shellButtons = document.createElement("div");
  shellButtons.className = "debug-segment";
  shellRow.append(shellButtons);

  const solidShellButton = document.createElement("button");
  solidShellButton.className = "debug-action-button";
  solidShellButton.type = "button";
  solidShellButton.textContent = "Solid";
  solidShellButton.addEventListener("click", () => onShellModeChange("solid"));
  shellButtons.append(solidShellButton);

  const interiorShellButton = document.createElement("button");
  interiorShellButton.className = "debug-action-button";
  interiorShellButton.type = "button";
  interiorShellButton.textContent = "Interior";
  interiorShellButton.addEventListener("click", () => onShellModeChange("interior"));
  shellButtons.append(interiorShellButton);

  const previewFrame = document.createElement("div");
  previewFrame.className = "debug-preview-frame";
  viewportCard.append(previewFrame);

  const previewCanvas = document.createElement("canvas");
  previewCanvas.className = "debug-preview-canvas";
  previewFrame.append(previewCanvas);

  const tabBar = document.createElement("div");
  tabBar.className = "debug-tab-bar";
  panel.append(tabBar);

  const layoutTabButton = createTabButton(LAYOUT_TAB, "Layout");
  const lightsTabButton = createTabButton(LIGHTS_TAB, "Lights");
  const lookTabButton = createTabButton(LOOK_TAB, "Look");
  const entranceTabButton = createTabButton(ENTRANCE_TAB, "Entrance");
  tabBar.append(layoutTabButton, lightsTabButton, lookTabButton, entranceTabButton);

  const sections = document.createElement("div");
  sections.className = "debug-sections";
  panel.append(sections);

  const layoutSection = createSection(LAYOUT_TAB);
  sections.append(layoutSection);

  const sceneTargetLabel = document.createElement("p");
  sceneTargetLabel.className = "debug-label";
  sceneTargetLabel.textContent = "Target";
  layoutSection.append(sceneTargetLabel);

  const sceneTargetGroup = document.createElement("div");
  sceneTargetGroup.className = "debug-segment";
  layoutSection.append(sceneTargetGroup);

  for (const target of staticTargets) {
    const button = document.createElement("button");
    button.className = "debug-action-button";
    button.type = "button";
    button.textContent = target.label;
    button.addEventListener("click", () => onTargetChange(target.id));
    sceneTargetGroup.append(button);
    staticTargetButtons.set(target.id, button);
  }

  const transformLabel = document.createElement("p");
  transformLabel.className = "debug-label";
  transformLabel.textContent = "Transform";
  layoutSection.append(transformLabel);

  const transformButtons = document.createElement("div");
  transformButtons.className = "debug-segment";
  layoutSection.append(transformButtons);

  const moveButton = document.createElement("button");
  moveButton.className = "debug-action-button is-active";
  moveButton.type = "button";
  moveButton.textContent = "Move";
  moveButton.addEventListener("click", () => onModeChange("translate"));
  transformButtons.append(moveButton);

  const rotateButton = document.createElement("button");
  rotateButton.className = "debug-action-button";
  rotateButton.type = "button";
  rotateButton.textContent = "Rotate";
  rotateButton.addEventListener("click", () => onModeChange("rotate"));
  transformButtons.append(rotateButton);

  const layoutHelp = document.createElement("p");
  layoutHelp.className = "debug-note";
  layoutHelp.textContent =
    "Use the bottom scout bar for Freeform, Orbit, Pan, and Dolly. The side panel is only for selection and transforms.";
  layoutSection.append(layoutHelp);

  const cameraEditor = document.createElement("div");
  cameraEditor.className = "debug-light-editor";
  cameraEditor.hidden = true;
  layoutSection.append(cameraEditor);

  const cameraEditorTitle = document.createElement("p");
  cameraEditorTitle.className = "debug-label";
  cameraEditorTitle.textContent = "Camera Optics";
  cameraEditor.append(cameraEditorTitle);

  const cameraEditorNote = document.createElement("p");
  cameraEditorNote.className = "debug-note";
  cameraEditorNote.textContent =
    "Lens, zoom, and depth-of-field settings affect the saved production camera and the live shot preview.";
  cameraEditor.append(cameraEditorNote);

  const lensPresetControl = createSelectControl({
    label: "Lens Preset",
    value: "custom",
    options: [
      { value: "18", label: "18mm" },
      { value: "24", label: "24mm" },
      { value: "35", label: "35mm" },
      { value: "50", label: "50mm" },
      { value: "85", label: "85mm" },
      { value: "105", label: "105mm" },
      { value: "custom", label: "Custom" },
    ],
    onChange(value) {
      if (value !== "custom") {
        onCameraSettingsChange({ focalLength: Number(value) });
      }
    },
  });
  cameraEditor.append(lensPresetControl.element);

  const focalLengthControl = createRangeControl({
    label: "Focal Length",
    min: 18,
    max: 135,
    step: 1,
    value: nextCameraSettings.focalLength,
    onInput(value) {
      onCameraSettingsChange({ focalLength: clampValue(Number(value), 18, 135) });
    },
  });
  cameraEditor.append(focalLengthControl.element);

  const zoomControl = createRangeControl({
    label: "Zoom",
    min: 1,
    max: 4,
    step: 0.01,
    value: nextCameraSettings.zoom,
    onInput(value) {
      onCameraSettingsChange({ zoom: clampValue(Number(value), 1, 4) });
    },
  });
  cameraEditor.append(zoomControl.element);

  const focusDistanceControl = createRangeControl({
    label: "Focus Distance",
    min: 0.5,
    max: 120,
    step: 0.1,
    value: nextCameraSettings.focusDistance,
    onInput(value) {
      onCameraSettingsChange({ focusDistance: clampValue(Number(value), 0.5, 120) });
    },
  });
  cameraEditor.append(focusDistanceControl.element);

  const apertureControl = createRangeControl({
    label: "Aperture",
    min: 0,
    max: 12,
    step: 0.1,
    value: nextCameraSettings.aperture,
    onInput(value) {
      onCameraSettingsChange({ aperture: clampValue(Number(value), 0, 12) });
    },
  });
  cameraEditor.append(apertureControl.element);

  const blurControl = createRangeControl({
    label: "Max Blur",
    min: 0,
    max: 0.03,
    step: 0.001,
    value: nextCameraSettings.maxBlur,
    onInput(value) {
      onCameraSettingsChange({ maxBlur: clampValue(Number(value), 0, 0.03) });
    },
  });
  cameraEditor.append(blurControl.element);

  cameraBindings.set("lensPreset", {
    sync() {
      lensPresetControl.select.value = getLensPresetValue(nextCameraSettings.focalLength);
    },
  });
  cameraBindings.set("focalLength", {
    sync() {
      focalLengthControl.range.value = String(nextCameraSettings.focalLength);
      focalLengthControl.number.value = formatValue(nextCameraSettings.focalLength, 1);
    },
  });
  cameraBindings.set("zoom", {
    sync() {
      zoomControl.range.value = String(nextCameraSettings.zoom);
      zoomControl.number.value = formatValue(nextCameraSettings.zoom, 0.01);
    },
  });
  cameraBindings.set("focusDistance", {
    sync() {
      focusDistanceControl.range.value = String(nextCameraSettings.focusDistance);
      focusDistanceControl.number.value = formatValue(nextCameraSettings.focusDistance, 0.1);
    },
  });
  cameraBindings.set("aperture", {
    sync() {
      apertureControl.range.value = String(nextCameraSettings.aperture);
      apertureControl.number.value = formatValue(nextCameraSettings.aperture, 0.1);
    },
  });
  cameraBindings.set("maxBlur", {
    sync() {
      blurControl.range.value = String(nextCameraSettings.maxBlur);
      blurControl.number.value = formatValue(nextCameraSettings.maxBlur, 0.001);
    },
  });

  const exportRow = document.createElement("div");
  exportRow.className = "debug-segment";
  layoutSection.append(exportRow);

  const printButton = document.createElement("button");
  printButton.className = "debug-action-button";
  printButton.type = "button";
  printButton.textContent = "Print JSON";
  exportRow.append(printButton);

  const outputActions = document.createElement("div");
  outputActions.className = "debug-output-actions is-hidden";
  exportRow.append(outputActions);

  const copyButton = document.createElement("button");
  copyButton.className = "debug-action-button";
  copyButton.type = "button";
  copyButton.textContent = "Copy";
  outputActions.append(copyButton);

  const output = document.createElement("pre");
  output.className = "debug-output is-hidden";
  layoutSection.append(output);

  const lightsSection = createSection(LIGHTS_TAB);
  sections.append(lightsSection);

  const lightActions = document.createElement("div");
  lightActions.className = "debug-segment";
  lightsSection.append(lightActions);

  const addSpotButton = document.createElement("button");
  addSpotButton.className = "debug-action-button";
  addSpotButton.type = "button";
  addSpotButton.textContent = "Add Spot";
  addSpotButton.addEventListener("click", () => onAddLight("spot"));
  lightActions.append(addSpotButton);

  const addPointButton = document.createElement("button");
  addPointButton.className = "debug-action-button";
  addPointButton.type = "button";
  addPointButton.textContent = "Add Point";
  addPointButton.addEventListener("click", () => onAddLight("point"));
  lightActions.append(addPointButton);

  const addDirectionalButton = document.createElement("button");
  addDirectionalButton.className = "debug-action-button";
  addDirectionalButton.type = "button";
  addDirectionalButton.textContent = "Add Directional";
  addDirectionalButton.addEventListener("click", () => onAddLight("directional"));
  lightActions.append(addDirectionalButton);

  const lightsHelp = document.createElement("p");
  lightsHelp.className = "debug-note";
  lightsHelp.textContent =
    "Select a light to move it. Spot and directional lights also expose an Aim handle for pivoting the target separately.";
  lightsSection.append(lightsHelp);

  const lightList = document.createElement("div");
  lightList.className = "debug-light-list";
  lightsSection.append(lightList);

  const lightEditor = document.createElement("div");
  lightEditor.className = "debug-light-editor";
  lightsSection.append(lightEditor);

  const lookSection = createSection(LOOK_TAB);
  sections.append(lookSection);

  const lookdevControls = document.createElement("div");
  lookdevControls.className = "settings-controls";
  lookSection.append(lookdevControls);

  for (const definition of sceneDefinitions) {
    if (definition.type === "section") {
      const sectionLabel = document.createElement("p");
      sectionLabel.className = "settings-section-label";
      sectionLabel.textContent = definition.label;
      lookdevControls.append(sectionLabel);
      continue;
    }

    if (definition.type === "range") {
      lookdevControls.append(createSceneRangeControl(definition));
      continue;
    }

    lookdevControls.append(createSceneColorControl(definition));
  }

  const entranceSection = createSection(ENTRANCE_TAB);
  sections.append(entranceSection);
  if (entranceTabContent) {
    entranceSection.append(entranceTabContent);
  }

  const scoutHud = document.createElement("section");
  scoutHud.className = "debug-scout-hud is-hidden";

  const scoutSummary = document.createElement("p");
  scoutSummary.className = "debug-scout-summary";
  scoutSummary.textContent = "Pivot: Shot Focus";
  scoutHud.append(scoutSummary);

  const scoutModeButtons = document.createElement("div");
  scoutModeButtons.className = "debug-scout-group";
  scoutHud.append(scoutModeButtons);

  const freeformModeButton = createScoutButton("Freeform", () => onScoutModeChange("freeform"));
  const orbitModeButton = createScoutButton("Orbit", () => onScoutModeChange("orbit"));
  const panModeButton = createScoutButton("Pan", () => onScoutModeChange("pan"));
  const dollyModeButton = createScoutButton("Dolly", () => onScoutModeChange("dolly"));
  scoutModeButtons.append(freeformModeButton, orbitModeButton, panModeButton, dollyModeButton);

  toggle.addEventListener("click", () => {
    const nextEnabled = panel.classList.contains("is-hidden");
    onToggle(nextEnabled);
  });

  printButton.addEventListener("click", () => {
    const nextOutput = onPrint();
    output.textContent = nextOutput;
    output.classList.toggle("is-hidden", !nextOutput);
    outputActions.classList.toggle("is-hidden", !nextOutput);
  });

  copyButton.addEventListener("click", async () => {
    const didCopy = await onCopy(output.textContent);
    copyButton.textContent = didCopy ? "Copied" : "Copy";
    window.setTimeout(() => {
      copyButton.textContent = "Copy";
    }, 1200);
  });

  container.append(shell, scoutHud);
  setTab(LAYOUT_TAB);
  syncCameraEditor();

  return {
    setEnabled(enabled) {
      panel.classList.toggle("is-hidden", !enabled);
      toggle.textContent = enabled ? "Exit Studio" : "Studio";
      updateScoutVisibility(enabled && scoutVisible);
    },
    setSelected(label) {
      selected.textContent = label ? `Selected: ${label}` : "Selected: none";
    },
    setMode(mode) {
      moveButton.classList.toggle("is-active", mode === "translate");
      rotateButton.classList.toggle("is-active", mode === "rotate");
    },
    setViewMode(mode) {
      const isGlobal = mode === "global";
      globalViewButton.classList.toggle("is-active", isGlobal);
      cameraViewButton.classList.toggle("is-active", !isGlobal);
      viewportHint.textContent = isGlobal
        ? "Global scout view. Use the bottom bar to choose Freeform, Orbit, Pan, or Dolly."
        : "Saved production camera view. This is the shot the main experience uses on load.";
    },
    setLightingMode(mode) {
      const isProduction = mode !== "debug";
      productionLightingButton.classList.toggle("is-active", isProduction);
      debugLightingButton.classList.toggle("is-active", !isProduction);
    },
    setShellMode(mode) {
      const isSolid = mode !== "interior";
      solidShellButton.classList.toggle("is-active", isSolid);
      interiorShellButton.classList.toggle("is-active", !isSolid);
    },
    setTarget(target) {
      activeTarget = target;
      for (const [id, button] of staticTargetButtons) {
        button.classList.toggle("is-active", id === target);
      }

      if (isLightTarget(target)) {
        setTab(LIGHTS_TAB);
      } else {
        setTab(LAYOUT_TAB);
      }

      syncCameraEditor();
    },
    setLights(lights, selectedTarget) {
      renderLightList(lights, selectedTarget);
    },
    setRotationEnabled(enabled) {
      rotateButton.disabled = !enabled;
      rotateButton.classList.toggle("is-disabled", !enabled);
      if (!enabled) {
        rotateButton.classList.remove("is-active");
      }
    },
    setSceneState(nextState) {
      Object.assign(nextSceneState, nextState);
      for (const binding of sceneBindings.values()) {
        binding.sync();
      }
    },
    setCameraSettings(nextSettings) {
      Object.assign(nextCameraSettings, nextSettings);
      syncCameraEditor();
    },
    setOutput(text) {
      output.textContent = text;
      output.classList.toggle("is-hidden", !text);
      outputActions.classList.toggle("is-hidden", !text);
    },
    setScoutMode(mode) {
      freeformModeButton.classList.toggle("is-active", mode === "freeform");
      orbitModeButton.classList.toggle("is-active", mode === "orbit");
      panModeButton.classList.toggle("is-active", mode === "pan");
      dollyModeButton.classList.toggle("is-active", mode === "dolly");
    },
    setScoutPivotLabel(label) {
      scoutSummary.textContent = label ? `Pivot: ${label}` : "Pivot: Shot Focus";
    },
    setScoutVisible(visible) {
      scoutVisible = visible;
      updateScoutVisibility(visible);
    },
    getPreviewCanvas() {
      return previewCanvas;
    },
  };

  function createSection(id) {
    const section = document.createElement("section");
    section.className = "debug-tab-panel";
    tabPanels.set(id, section);
    return section;
  }

  function createTabButton(id, label) {
    const button = document.createElement("button");
    button.className = "debug-tab-button";
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", () => setTab(id));
    tabButtons.set(id, button);
    return button;
  }

  function setTab(id) {
    activeTab = id;

    for (const [tabId, button] of tabButtons) {
      button.classList.toggle("is-active", tabId === activeTab);
    }

    for (const [tabId, section] of tabPanels) {
      section.classList.toggle("is-hidden", tabId !== activeTab);
    }
  }

  function updateScoutVisibility(visible) {
    scoutHud.classList.toggle("is-hidden", !visible);
  }

  function syncCameraEditor() {
    cameraEditor.hidden = activeTarget !== "camera";
    for (const binding of cameraBindings.values()) {
      binding.sync();
    }
  }

  function getLensPresetValue(focalLength) {
    const rounded = Math.round(focalLength);
    return [18, 24, 35, 50, 85, 105].includes(rounded) ? String(rounded) : "custom";
  }

  function createSceneRangeControl({ key, label, min, max, step }) {
    const row = createRangeControl({
      label,
      min,
      max,
      step,
      onInput(rawValue) {
        const parsed = clampValue(Number(rawValue), min, max);
        if (!Number.isFinite(parsed)) {
          return;
        }

        nextSceneState[key] = parsed;
        sceneBindings.get(key)?.sync();
        onSceneChange({ ...nextSceneState });
      },
    });

    sceneBindings.set(key, {
      sync() {
        row.range.value = String(nextSceneState[key]);
        row.number.value = formatValue(nextSceneState[key], step);
      },
    });

    sceneBindings.get(key)?.sync();
    return row.element;
  }

  function createSceneColorControl({ key, label }) {
    const row = createColorControl({
      label,
      onInput(rawValue) {
        const normalized = normalizeHexColor(rawValue);
        if (!normalized) {
          return;
        }

        nextSceneState[key] = normalized;
        sceneBindings.get(key)?.sync();
        onSceneChange({ ...nextSceneState });
      },
    });

    sceneBindings.set(key, {
      sync() {
        row.color.value = nextSceneState[key];
        row.hex.value = nextSceneState[key];
      },
    });

    sceneBindings.get(key)?.sync();
    return row.element;
  }

  function renderLightList(lights, selectedTarget) {
    lightList.replaceChildren();

    if (!lights.length) {
      const empty = document.createElement("p");
      empty.className = "debug-note";
      empty.textContent = "No scene lights yet. Add one to start building the production rig.";
      lightList.append(empty);
      renderLightEditor(null, selectedTarget);
      return;
    }

    let selectedLight = null;

    for (const light of lights) {
      const row = document.createElement("div");
      row.className = "debug-light-row";
      lightList.append(row);

      const mainButton = document.createElement("button");
      mainButton.className = "debug-light-button";
      mainButton.type = "button";
      mainButton.addEventListener("click", () => onTargetChange(`light:${light.id}`));
      row.append(mainButton);

      const header = document.createElement("div");
      header.className = "debug-light-button-header";
      mainButton.append(header);

      const name = document.createElement("span");
      name.className = "debug-light-name";
      name.textContent = light.name;
      header.append(name);

      const badge = document.createElement("span");
      badge.className = "debug-light-badge";
      badge.textContent = light.type;
      header.append(badge);

      const meta = document.createElement("span");
      meta.className = "debug-light-meta";
      meta.textContent = `${formatLightIntensity(light.intensity)} intensity${light.visible ? "" : " • hidden"}`;
      mainButton.append(meta);

      mainButton.classList.toggle("is-active", selectedTarget === `light:${light.id}`);

      const tools = document.createElement("div");
      tools.className = "debug-light-tools";
      row.append(tools);

      if (light.hasTarget) {
        const aimButton = document.createElement("button");
        aimButton.className = "debug-mini-button";
        aimButton.type = "button";
        aimButton.textContent = "Aim";
        aimButton.classList.toggle("is-active", selectedTarget === `lightAim:${light.id}`);
        aimButton.addEventListener("click", () => onTargetChange(`lightAim:${light.id}`));
        tools.append(aimButton);
      }

      const deleteButton = document.createElement("button");
      deleteButton.className = "debug-mini-button";
      deleteButton.type = "button";
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", () => onDeleteLight(light.id));
      tools.append(deleteButton);

      if (selectedTarget === `light:${light.id}` || selectedTarget === `lightAim:${light.id}`) {
        selectedLight = light;
      }
    }

    renderLightEditor(selectedLight, selectedTarget);
  }

  function renderLightEditor(light, selectedTarget) {
    lightEditor.replaceChildren();

    if (!light) {
      const empty = document.createElement("p");
      empty.className = "debug-note";
      empty.textContent = "Select a light to edit its beam, shadow, and placement settings.";
      lightEditor.append(empty);
      return;
    }

    const title = document.createElement("p");
    title.className = "debug-label";
    title.textContent = selectedTarget === `lightAim:${light.id}` ? `${light.name} Aim` : light.name;
    lightEditor.append(title);

    if (light.type === "point") {
      const note = document.createElement("p");
      note.className = "debug-note";
      note.textContent =
        "Point lights emit in every direction, so rotation does not change the result. Use Move, or switch the light to Spot or Directional if you need to aim it.";
      lightEditor.append(note);
    }

    if (light.hasTarget) {
      const handleButtons = document.createElement("div");
      handleButtons.className = "debug-segment";
      lightEditor.append(handleButtons);

      const lightHandleButton = document.createElement("button");
      lightHandleButton.className = "debug-action-button";
      lightHandleButton.type = "button";
      lightHandleButton.textContent = "Light";
      lightHandleButton.classList.toggle("is-active", selectedTarget === `light:${light.id}`);
      lightHandleButton.addEventListener("click", () => onTargetChange(`light:${light.id}`));
      handleButtons.append(lightHandleButton);

      const aimHandleButton = document.createElement("button");
      aimHandleButton.className = "debug-action-button";
      aimHandleButton.type = "button";
      aimHandleButton.textContent = "Aim";
      aimHandleButton.classList.toggle("is-active", selectedTarget === `lightAim:${light.id}`);
      aimHandleButton.addEventListener("click", () => onTargetChange(`lightAim:${light.id}`));
      handleButtons.append(aimHandleButton);
    }

    lightEditor.append(
      createTextControl({
        label: "Name",
        value: light.name,
        onChange(value) {
          onLightChange(light.id, { name: value.trim() || light.name });
        },
      }).element,
    );

    lightEditor.append(
      createSelectControl({
        label: "Type",
        value: light.type,
        options: [
          { value: "spot", label: "Spot" },
          { value: "point", label: "Point" },
          { value: "directional", label: "Directional" },
        ],
        onChange(value) {
          onLightChange(light.id, { type: value });
        },
      }).element,
    );

    lightEditor.append(
      createColorControl({
        label: "Color",
        value: light.color,
        onInput(value) {
          const normalized = normalizeHexColor(value);
          if (normalized) {
            onLightChange(light.id, { color: normalized });
          }
        },
      }).element,
    );

    lightEditor.append(
      createCheckboxControl({
        label: "Visible",
        checked: light.visible,
        onChange(value) {
          onLightChange(light.id, { visible: value });
        },
      }).element,
    );

    lightEditor.append(
      createCheckboxControl({
        label: "Cast Shadows",
        checked: light.castShadow,
        onChange(value) {
          onLightChange(light.id, { castShadow: value });
        },
      }).element,
    );

    lightEditor.append(
      createRangeControl({
        label: "Intensity",
        min: 0,
        max: 40,
        step: 0.1,
        value: light.intensity,
        onInput(value) {
          onLightChange(light.id, { intensity: clampValue(Number(value), 0, 40) });
        },
      }).element,
    );

    if (light.type !== "directional") {
      lightEditor.append(
        createRangeControl({
          label: "Distance",
          min: 0,
          max: 60,
          step: 0.1,
          value: light.distance,
          onInput(value) {
            onLightChange(light.id, { distance: clampValue(Number(value), 0, 60) });
          },
        }).element,
      );

      lightEditor.append(
        createRangeControl({
          label: "Decay",
          min: 0,
          max: 4,
          step: 0.05,
          value: light.decay,
          onInput(value) {
            onLightChange(light.id, { decay: clampValue(Number(value), 0, 4) });
          },
        }).element,
      );
    }

    if (light.type === "spot") {
      lightEditor.append(
        createRangeControl({
          label: "Angle",
          min: 0.05,
          max: 1.45,
          step: 0.01,
          value: light.angle,
          onInput(value) {
            onLightChange(light.id, { angle: clampValue(Number(value), 0.05, 1.45) });
          },
        }).element,
      );

      lightEditor.append(
        createRangeControl({
          label: "Penumbra",
          min: 0,
          max: 1,
          step: 0.01,
          value: light.penumbra,
          onInput(value) {
            onLightChange(light.id, { penumbra: clampValue(Number(value), 0, 1) });
          },
        }).element,
      );
    }

    lightEditor.append(
      createSelectControl({
        label: "Shadow Map",
        value: String(light.shadowSize),
        options: [
          { value: "512", label: "512" },
          { value: "1024", label: "1024" },
          { value: "2048", label: "2048" },
          { value: "4096", label: "4096" },
        ],
        onChange(value) {
          onLightChange(light.id, { shadowSize: Number(value) });
        },
      }).element,
    );
  }
}

function createScoutButton(label, onClick) {
  const button = document.createElement("button");
  button.className = "debug-scout-button";
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function isLightTarget(target) {
  return typeof target === "string" && (target.startsWith("light:") || target.startsWith("lightAim:"));
}

function createTextControl({ label, value = "", onChange }) {
  const element = document.createElement("label");
  element.className = "settings-row";

  const header = document.createElement("div");
  header.className = "settings-row-header";
  element.append(header);

  const labelElement = document.createElement("span");
  labelElement.className = "settings-label";
  labelElement.textContent = label;
  header.append(labelElement);

  const input = document.createElement("input");
  input.className = "debug-text-input";
  input.type = "text";
  input.spellcheck = false;
  input.value = value;
  input.addEventListener("change", (event) => onChange(event.target.value));
  header.append(input);

  return { element, input };
}

function createSelectControl({ label, value, options, onChange }) {
  const element = document.createElement("label");
  element.className = "settings-row";

  const header = document.createElement("div");
  header.className = "settings-row-header";
  element.append(header);

  const labelElement = document.createElement("span");
  labelElement.className = "settings-label";
  labelElement.textContent = label;
  header.append(labelElement);

  const select = document.createElement("select");
  select.className = "debug-select";
  for (const optionData of options) {
    const option = document.createElement("option");
    option.value = optionData.value;
    option.textContent = optionData.label;
    select.append(option);
  }

  select.value = value;
  select.addEventListener("change", (event) => onChange(event.target.value));
  header.append(select);

  return { element, select };
}

function createCheckboxControl({ label, checked = false, onChange }) {
  const element = document.createElement("label");
  element.className = "debug-checkbox-row";

  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = checked;
  input.addEventListener("change", (event) => onChange(event.target.checked));
  element.append(input);

  const text = document.createElement("span");
  text.className = "settings-label";
  text.textContent = label;
  element.append(text);

  return { element, input };
}

function createRangeControl({ label, min, max, step, value = min, onInput }) {
  const element = document.createElement("label");
  element.className = "settings-row";

  const header = document.createElement("div");
  header.className = "settings-row-header";
  element.append(header);

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
  number.value = formatValue(value, step);
  header.append(number);

  const range = document.createElement("input");
  range.className = "settings-range";
  range.type = "range";
  range.min = String(min);
  range.max = String(max);
  range.step = String(step);
  range.value = String(value);
  element.append(range);

  const sync = (rawValue) => {
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) {
      return;
    }

    range.value = String(parsed);
    number.value = formatValue(parsed, step);
    onInput(parsed);
  };

  range.addEventListener("input", (event) => sync(event.target.value));
  number.addEventListener("input", (event) => sync(event.target.value));

  return { element, range, number };
}

function createColorControl({ label, value = "#ffffff", onInput }) {
  const element = document.createElement("label");
  element.className = "settings-row";

  const header = document.createElement("div");
  header.className = "settings-row-header";
  element.append(header);

  const labelElement = document.createElement("span");
  labelElement.className = "settings-label";
  labelElement.textContent = label;
  header.append(labelElement);

  const hex = document.createElement("input");
  hex.className = "settings-color-hex";
  hex.type = "text";
  hex.spellcheck = false;
  hex.value = value;
  header.append(hex);

  const color = document.createElement("input");
  color.className = "settings-color";
  color.type = "color";
  color.value = value;
  element.append(color);

  const sync = (rawValue) => {
    const normalized = normalizeHexColor(rawValue);
    if (!normalized) {
      return;
    }

    hex.value = normalized;
    color.value = normalized;
    onInput(normalized);
  };

  color.addEventListener("input", (event) => sync(event.target.value));
  hex.addEventListener("change", (event) => sync(event.target.value));

  return { element, color, hex };
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

function formatLightIntensity(value) {
  return Number.isFinite(value) ? value.toFixed(1) : "0.0";
}
