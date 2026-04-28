import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { createShowcaseUi } from "./showcaseUi.js";
import { createModelStudioUi } from "./modelStudioUi.js";
import { createShowcaseAudio, getAnalyticsLanguageCode } from "./showcaseAudio.js";

const isMobile = window.matchMedia("(pointer: coarse)").matches;
const MAX_DPR = isMobile ? 1.5 : 2;
const BASE = import.meta.env.BASE_URL;
const HEAD_ASSET_URL = `${BASE}brancusi-head.glb`;
const HDR_ASSET_URL = `${BASE}map.hdr`;

const MODEL_VIEW = {
  title: "Model View",
  meta: "Single Object",
  body: "A focused 3D view of Constantin Brancusi's Danaide.",
};

const MODEL_NORMALIZED_HEIGHT = 2.1;
const MODEL_INITIAL_ROTATION_Y = Math.PI - 0.928;
const colorSchemeQuery = window.matchMedia("(prefers-color-scheme: light)");
const COLOR_MODE_BACKGROUND = {
  dark: "#050505",
  light: "#ffffff",
};
let colorMode = colorSchemeQuery.matches ? "light" : "dark";
let hasManualColorMode = false;

const DEFAULT_STUDIO_STATE = {
  backgroundColor: COLOR_MODE_BACKGROUND[colorMode],
  exposure: 1,
  environmentIntensity: 1,
  ambientIntensity: 1.2,
  keyIntensity: 2.2,
  fillIntensity: 0.6,
  rimIntensity: 0.9,
  modelScale: isMobile ? 0.9 : 1,
  cameraDistance: isMobile ? 6.2 : 5.4,
  autoRotateSpeed: 0.08,
};

const app = document.querySelector("#app");
const viewport = document.createElement("div");
viewport.className = "app-viewport";
app.append(viewport);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false,
});
renderer.domElement.className = "showcase-scene-canvas";
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = DEFAULT_STUDIO_STATE.exposure;
renderer.setClearColor(DEFAULT_STUDIO_STATE.backgroundColor, 1);
viewport.append(renderer.domElement);

const canvas = renderer.domElement;
const initCssW = canvas.clientWidth || window.innerWidth;
const initCssH = canvas.clientHeight || window.innerHeight;
const initDpr = Math.min(window.devicePixelRatio, MAX_DPR);
renderer.setSize(Math.round(initCssW * initDpr), Math.round(initCssH * initDpr), false);

const scene = new THREE.Scene();
scene.background = new THREE.Color(DEFAULT_STUDIO_STATE.backgroundColor);

const camera = new THREE.PerspectiveCamera(30, initCssW / initCssH, 0.1, 100);
const cameraTarget = new THREE.Vector3(0, 0, 0);
scene.add(camera);

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enabled = false;
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.06;
orbitControls.enablePan = false;
orbitControls.enableZoom = false;
orbitControls.enableRotate = false;
orbitControls.target.copy(cameraTarget);

const modelRoot = new THREE.Group();
scene.add(modelRoot);

const modelSpin = new THREE.Group();
modelRoot.add(modelSpin);

const ambientLight = new THREE.HemisphereLight("#ffffff", "#d7d7d7", DEFAULT_STUDIO_STATE.ambientIntensity);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight("#ffffff", DEFAULT_STUDIO_STATE.keyIntensity);
keyLight.position.set(3.6, 4.2, 5.5);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight("#ffffff", DEFAULT_STUDIO_STATE.fillIntensity);
fillLight.position.set(-4.4, 2.2, 3.2);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight("#ffffff", DEFAULT_STUDIO_STATE.rimIntensity);
rimLight.position.set(0.4, 3.4, -4.8);
scene.add(rimLight);

const studioState = { ...DEFAULT_STUDIO_STATE };
let storedEnvMap = null;
let sculptureObject = null;
let scrollRotation = 0;
let scrollRotationTarget = 0;
let lastFrameSeconds = 0;

const showcaseAudio = createShowcaseAudio();

function getArtName() {
  return window.artName;
}

function setAnalyticsPageLanguage(languageId) {
  if (!window.AnalyticsDataLayer?.page) return;
  window.AnalyticsDataLayer.page.language = getAnalyticsLanguageCode(languageId);
}

function fireExperienceViewPage() {
  if (window.viewPageViewFired) return;
  window.viewPageViewFired = true;
  const artName = getArtName();
  if (window.AnalyticsDataLayer?.page) {
    window.AnalyticsDataLayer.page.name = `experience:${artName}:view`;
    window.AnalyticsDataLayer.page.template = "experience:view";
  }
  window._satellite?.track("experience_virtual_page_view");
}

const showcaseUi = createShowcaseUi(viewport, MODEL_VIEW, {
  appRoot: app,
  onLanguageChange(languageId) {
    setAnalyticsPageLanguage(languageId);
    showcaseAudio.setLanguage(languageId);
  },
  onMuteToggle(muted) {
    showcaseAudio.setMuted(muted);
  },
});

const topControls = document.createElement("div");
topControls.className = "top-controls";
viewport.append(topControls);

const colorModeToggle = document.createElement("button");
colorModeToggle.className = "theme-toggle";
colorModeToggle.type = "button";
colorModeToggle.addEventListener("click", () => {
  setColorMode(colorMode === "light" ? "dark" : "light", { manual: true });
});
topControls.append(colorModeToggle);

const studioUi = createModelStudioUi(topControls, {
  state: studioState,
  onChange: applyStudioState,
  onPrint: printStudioState,
  onCopy: copyStudioOutput,
});

updateColorModeToggle();
applyStudioState(studioState);
if (colorSchemeQuery.addEventListener) {
  colorSchemeQuery.addEventListener("change", handleSystemColorSchemeChange);
} else {
  colorSchemeQuery.addListener(handleSystemColorSchemeChange);
}
window.addEventListener("resize", handleResize);
new ResizeObserver(handleResize).observe(canvas);
window.addEventListener("wheel", handleWheel, { passive: true });
window.addEventListener("touchstart", handleTouchStart, { passive: true });
window.addEventListener("touchmove", handleTouchMove, { passive: true });
window.addEventListener("touchend", handleTouchEnd, { passive: true });
window.addEventListener("touchcancel", handleTouchEnd, { passive: true });

void init();
render();

async function init() {
  const manager = new THREE.LoadingManager();
  manager.onProgress = (_url, loaded, total) => {
    if (total > 0) {
      showcaseUi.setProgress(loaded / total);
    }
  };

  const gltfLoader = new GLTFLoader(manager);
  const rgbeLoader = new RGBELoader(manager);

  try {
    showcaseUi.setStatus("Loading model.");

    const [headGltf, hdrTexture] = await Promise.all([
      loadAsset(gltfLoader, HEAD_ASSET_URL),
      loadAsset(rgbeLoader, HDR_ASSET_URL),
    ]);

    const pmrem = new THREE.PMREMGenerator(renderer);
    storedEnvMap = pmrem.fromEquirectangular(hdrTexture).texture;
    hdrTexture.dispose();
    pmrem.dispose();

    setupSculpture(headGltf.scene);
    applyStudioState(studioState);
    frameCamera();
    showcaseUi.setProgress(1);

    window.setTimeout(() => {
      showcaseUi.revealExperience({
        onLanguageSelected(langId) {
          setAnalyticsPageLanguage(langId);
          showcaseAudio.setLanguage(langId);
        },
        onInstructionsDismissed() {
          fireExperienceViewPage();
          showcaseAudio.start().then(() => showcaseAudio.startQuotes());
        },
      });
    }, 180);
  } catch (error) {
    console.error(error);
    showcaseUi.setStatus("Model load failed. Check the console for details.");
  }
}

function setupSculpture(object) {
  sculptureObject = object;

  object.traverse((child) => {
    if (!child.isMesh) return;

    child.castShadow = false;
    child.receiveShadow = false;

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of materials) {
      if (!material) continue;
      if (material.map) {
        material.map.colorSpace = THREE.SRGBColorSpace;
      }
      material.envMapIntensity = studioState.environmentIntensity;
      material.needsUpdate = true;
    }
  });

  normalizeObject(object, MODEL_NORMALIZED_HEIGHT);
  modelSpin.add(object);
  modelSpin.rotation.y = MODEL_INITIAL_ROTATION_Y;
}

function normalizeObject(object, targetHeight) {
  const bounds = new THREE.Box3().setFromObject(object);
  const size = bounds.getSize(new THREE.Vector3());
  const scale = targetHeight / size.y;
  object.scale.multiplyScalar(scale);
  object.updateMatrixWorld(true);

  const scaledBounds = new THREE.Box3().setFromObject(object);
  const center = scaledBounds.getCenter(new THREE.Vector3());
  object.position.x -= center.x;
  object.position.y -= center.y;
  object.position.z -= center.z;
  object.updateMatrixWorld(true);
}

function applyStudioState(nextState) {
  Object.assign(studioState, nextState);

  const lightScene = isLightColor(studioState.backgroundColor);
  colorMode = lightScene ? "light" : "dark";
  document.documentElement.style.colorScheme = colorMode;
  renderer.setClearColor(studioState.backgroundColor, 1);
  renderer.toneMappingExposure = studioState.exposure;
  scene.background.set(studioState.backgroundColor);
  app.classList.toggle("is-light-scene", lightScene);
  scene.environment = studioState.environmentIntensity > 0 ? storedEnvMap : null;
  scene.environmentIntensity = studioState.environmentIntensity;

  ambientLight.intensity = studioState.ambientIntensity;
  keyLight.intensity = studioState.keyIntensity;
  fillLight.intensity = studioState.fillIntensity;
  rimLight.intensity = studioState.rimIntensity;
  modelRoot.scale.setScalar(studioState.modelScale);

  if (sculptureObject) {
    sculptureObject.traverse((child) => {
      if (!child.isMesh) return;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) {
        if (!material) continue;
        material.envMapIntensity = studioState.environmentIntensity;
        material.needsUpdate = true;
      }
    });
  }

  frameCamera();
  updateColorModeToggle();
  studioUi?.setState(studioState);
}

function handleSystemColorSchemeChange(event) {
  if (hasManualColorMode) return;
  setColorMode(event.matches ? "light" : "dark");
}

function setColorMode(nextMode, { manual = false } = {}) {
  if (manual) {
    hasManualColorMode = true;
  }

  const normalizedMode = nextMode === "light" ? "light" : "dark";
  applyStudioState({
    ...studioState,
    backgroundColor: COLOR_MODE_BACKGROUND[normalizedMode],
  });
}

function updateColorModeToggle() {
  const nextMode = colorMode === "light" ? "dark" : "light";
  colorModeToggle.innerHTML = nextMode === "light" ? createSunIcon() : createMoonIcon();
  colorModeToggle.setAttribute("aria-label", `Switch to ${nextMode} mode`);
  colorModeToggle.setAttribute("title", `Switch to ${nextMode} mode`);
}

function frameCamera() {
  cameraTarget.set(0, 0, 0);
  camera.position.set(0, 0.08, studioState.cameraDistance);
  camera.lookAt(cameraTarget);
  orbitControls.target.copy(cameraTarget);
  orbitControls.update();
}

function handleResize() {
  const cssW = canvas.clientWidth;
  const cssH = canvas.clientHeight;
  if (!cssW || !cssH) return;

  camera.aspect = cssW / cssH;
  camera.updateProjectionMatrix();

  const dpr = Math.min(window.devicePixelRatio, MAX_DPR);
  renderer.setSize(Math.round(cssW * dpr), Math.round(cssH * dpr), false);
}

function handleWheel(event) {
  if (event.target instanceof Element && event.target.closest(".modal-card, .debug-panel")) return;
  scrollRotationTarget += event.deltaY * 0.002;
}

let touchRotationId = null;
let touchRotationLastY = 0;

function handleTouchStart(event) {
  if (event.target instanceof Element && event.target.closest(".modal-card, .debug-panel")) return;
  if (event.touches.length !== 1) {
    touchRotationId = null;
    return;
  }

  const touch = event.touches[0];
  touchRotationId = touch.identifier;
  touchRotationLastY = touch.clientY;
}

function handleTouchMove(event) {
  if (touchRotationId === null) return;

  for (const touch of event.changedTouches) {
    if (touch.identifier !== touchRotationId) continue;
    const deltaY = touchRotationLastY - touch.clientY;
    touchRotationLastY = touch.clientY;
    scrollRotationTarget += deltaY * 0.012;
    break;
  }
}

function handleTouchEnd(event) {
  if (touchRotationId === null) return;

  for (const touch of event.changedTouches) {
    if (touch.identifier === touchRotationId) {
      touchRotationId = null;
      break;
    }
  }
}

function applySculptureRotation(nowSeconds) {
  const deltaSeconds = lastFrameSeconds ? Math.min(nowSeconds - lastFrameSeconds, 0.05) : 1 / 60;
  lastFrameSeconds = nowSeconds;
  scrollRotationTarget += studioState.autoRotateSpeed * deltaSeconds;
  scrollRotation += (scrollRotationTarget - scrollRotation) * 0.08;
  modelSpin.rotation.y = MODEL_INITIAL_ROTATION_Y + scrollRotation;
}

function render(now = 0) {
  requestAnimationFrame(render);
  const nowSeconds = now * 0.001;
  applySculptureRotation(nowSeconds);
  orbitControls.update();
  renderer.render(scene, camera);
}

function printStudioState() {
  return JSON.stringify(
    {
      look: {
        backgroundColor: studioState.backgroundColor,
        exposure: roundValue(studioState.exposure),
        environmentIntensity: roundValue(studioState.environmentIntensity),
      },
      lights: {
        ambientIntensity: roundValue(studioState.ambientIntensity),
        keyIntensity: roundValue(studioState.keyIntensity),
        fillIntensity: roundValue(studioState.fillIntensity),
        rimIntensity: roundValue(studioState.rimIntensity),
      },
      model: {
        normalizedHeight: MODEL_NORMALIZED_HEIGHT,
        scale: roundValue(studioState.modelScale),
        rotationY: roundValue(modelSpin.rotation.y),
      },
      camera: {
        distance: roundValue(studioState.cameraDistance),
        position: camera.position.toArray().map(roundValue),
        target: cameraTarget.toArray().map(roundValue),
      },
      motion: {
        autoRotateSpeed: roundValue(studioState.autoRotateSpeed),
      },
    },
    null,
    2,
  );
}

async function copyStudioOutput(text) {
  if (!text) return false;

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (_error) {
    return false;
  }
}

function roundValue(value) {
  return Number(value.toFixed(3));
}

function isLightColor(hexColor) {
  const match = /^#?([0-9a-f]{6})$/i.exec(hexColor);
  if (!match) return false;

  const value = match[1];
  const red = parseInt(value.slice(0, 2), 16) / 255;
  const green = parseInt(value.slice(2, 4), 16) / 255;
  const blue = parseInt(value.slice(4, 6), 16) / 255;
  return red * 0.299 + green * 0.587 + blue * 0.114 > 0.68;
}

function createSunIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/>
      <path d="M12 2.75v2.5M12 18.75v2.5M4.22 4.22l1.77 1.77M18.01 18.01l1.77 1.77M2.75 12h2.5M18.75 12h2.5M4.22 19.78l1.77-1.77M18.01 5.99l1.77-1.77" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    </svg>
  `;
}

function createMoonIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19.2 14.7A7.58 7.58 0 0 1 9.3 4.8a7.6 7.6 0 1 0 9.9 9.9Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
}

function loadAsset(loader, url) {
  return new Promise((resolve, reject) => {
    loader.load(url, resolve, undefined, reject);
  });
}

if (import.meta.env.DEV) {
  window.__BRANCUSI__ = {
    camera,
    cameraTarget,
    modelRoot,
    modelSpin,
    studioState,
    applyStudioState,
  };
}
