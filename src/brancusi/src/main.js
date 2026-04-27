import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { createDebugLayoutUi } from "./debugLayoutUi.js";
import { createRadialSpriteTexture } from "./proceduralTextures.js";
import { DEFAULT_SCENE_STATE, SCENE_CONTROL_DEFINITIONS } from "./sceneControls.js";
import { createShowcaseUi } from "./showcaseUi.js";
import { createFogVolume } from "./fogVolume.js";
import { DEFAULT_ENTRANCE_TIMELINE, createEntranceTabContent, runEntranceTimeline } from "./entranceTimeline.js";
import { createCaveAudio, getAnalyticsLanguageCode } from "./caveAudio.js";

const isMobile = window.matchMedia("(pointer: coarse)").matches;
const MAX_DPR = isMobile ? 1.5 : 2;

const BASE = import.meta.env.BASE_URL;
const CAVE_ASSET_URL = `${BASE}Cave.FBX`;
const HEAD_ASSET_URL = `${BASE}brancusi-head.glb`;

const SCENE_VIEW = {
  title: "Cave View",
  meta: "Single Shot",
  body:
    "A single cave study with one saved shot state, live look-dev controls, and layout tools for the chamber, camera, lights, and focus.",
  position: [-29.711, 6.894, -16.031],
  target: [-26.827, 5.739, -1.95],
};

const SCOUT_VIEW = {
  position: [-28.031, 6.221, -7.829],
  target: [-26.827, 5.739, -1.95],
};

const STATIC_DEBUG_TARGETS = [
  { id: "cave", label: "Cave", allowRotate: true },
  { id: "camera", label: "Camera", allowRotate: false },
  { id: "focus", label: "Focus", allowRotate: false },
  { id: "sculpture", label: "Sculpture", allowRotate: true },
  { id: "fog", label: "Fog Volume", allowRotate: false },
];

const DEFAULT_LIGHTS = [
  {
    id: "light-9",
    name: "Spot 09",
    type: "spot",
    color: "#d6d6d6",
    intensity: 28.136,
    visible: true,
    castShadow: true,
    position: [-3.958, 2.429, 27.882],
    rotation: [-0.717, -0.963, -0.621],
    target: [-27.552, 13.209, 40.246],
    distance: 60,
    decay: 0,
    angle: 0.95,
    penumbra: 1,
  },
  {
    id: "light-3",
    name: "Spot 03",
    type: "spot",
    color: "#ffffff",
    intensity: 21.737,
    visible: true,
    castShadow: true,
    position: [-5.163, 3.823, 27.095],
    rotation: [-0.333, -1.112, -0.301],
    target: [-15.837, 5.548, 32.082],
    distance: 14.6,
    decay: 0,
    angle: 1.45,
    penumbra: 0,
  },
  {
    id: "light-4",
    name: "Point 04",
    type: "point",
    color: "#ffffff",
    intensity: 0,
    visible: true,
    castShadow: false,
    position: [-13.037, 7.948, 34.282],
    rotation: [0, 0, 0],
    distance: 18,
    decay: 1.35,
  },
  {
    id: "light-5",
    name: "Spot 05",
    type: "spot",
    color: "#ccb561",
    intensity: 44.135,
    visible: true,
    castShadow: true,
    position: [-21.82, 11.729, -19.437],
    rotation: [0.285, -0.213, 0.062],
    target: [-26.566, 5.548, 1.639],
    distance: 32.7,
    decay: 0.75,
    angle: 0.38,
    penumbra: 1,
  },
  {
    id: "light-6",
    name: "Spot 06",
    type: "spot",
    color: "#dfd69a",
    intensity: 19.86,
    visible: true,
    castShadow: true,
    position: [-33.153, 13.631, -10.506],
    rotation: [0.644, 0.53, -0.363],
    target: [-26.827, 7.148, -1.869],
    distance: 28.8,
    decay: 0.85,
    angle: 0.43,
    penumbra: 0.35,
  },
];

const LIGHT_TARGET_PREFIX = "light:";
const LIGHT_AIM_PREFIX = "lightAim:";

const CinematicGradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    vignette: { value: 0.24 },
    contrast: { value: 1.05 },
    saturation: { value: 0.94 },
    lift: { value: 0.012 },
    temperature: { value: -0.01 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float vignette;
    uniform float contrast;
    uniform float saturation;
    uniform float lift;
    uniform float temperature;
    varying vec2 vUv;

    void main() {
      vec4 sampleColor = texture2D(tDiffuse, vUv);
      vec3 color = sampleColor.rgb;
      float grey = dot(color, vec3(0.2126, 0.7152, 0.0722));
      color = mix(vec3(grey), color, saturation);
      color = (color - 0.5) * contrast + 0.5;
      color += vec3(lift + temperature, lift * 0.6, lift - temperature);

      vec2 centeredUv = vUv - 0.5;
      float mask = smoothstep(0.88, 0.14, dot(centeredUv, centeredUv) * 1.9);
      color *= mix(1.0 - vignette, 1.0, mask);

      gl_FragColor = vec4(color, sampleColor.a);
    }
  `,
};

const app = document.querySelector("#app");
const viewport = document.createElement("div");
viewport.className = "app-viewport";
app.append(viewport);
const DEFAULT_ORBIT_LIMITS = {
  minDistance: 1.4,
  maxDistance: 24,
};
const DEBUG_ORBIT_LIMITS = {
  minDistance: 0.18,
  maxDistance: 220,
};
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false,
});
renderer.domElement.className = "showcase-scene-canvas";
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = DEFAULT_SCENE_STATE.exposure;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.setClearColor(DEFAULT_SCENE_STATE.backgroundColor, 1);
viewport.append(renderer.domElement);

// CSS controls the canvas display size (width:100%; height:100%).
// We only set the drawing-buffer resolution here, never inline styles.
// Do NOT use setPixelRatio — we multiply by DPR ourselves so the
// composer, camera, and renderer all agree on exact pixel counts.
const canvas = renderer.domElement;
const initCssW = canvas.clientWidth || window.innerWidth;
const initCssH = canvas.clientHeight || window.innerHeight;
const initDpr = Math.min(window.devicePixelRatio, MAX_DPR);
renderer.setSize(Math.round(initCssW * initDpr), Math.round(initCssH * initDpr), false);

const scene = new THREE.Scene();
scene.background = new THREE.Color(DEFAULT_SCENE_STATE.backgroundColor);
scene.fog = new THREE.FogExp2(DEFAULT_SCENE_STATE.fogColor, DEFAULT_SCENE_STATE.fogDensity);

const camera = new THREE.PerspectiveCamera(28, initCssW / initCssH, 0.1, 420);
camera.setFocalLength(18);
camera.position.fromArray(SCOUT_VIEW.position);
scene.add(camera);

const layoutCamera = new THREE.PerspectiveCamera(28, 16 / 9, 0.1, 420);
layoutCamera.position.copy(camera.position);
layoutCamera.visible = false;
scene.add(layoutCamera);

const debugPreviewCamera = new THREE.PerspectiveCamera(28, 16 / 9, 0.1, 420);
debugPreviewCamera.visible = false;
scene.add(debugPreviewCamera);

const shotCameraState = {
  focalLength: 58,
  zoom: 1,
  focusDistance: 33.6,
  aperture: 2.5,
  maxBlur: 0,
};

const layoutCameraHelper = new THREE.CameraHelper(layoutCamera);
layoutCameraHelper.visible = false;
setDebugHelperDepth(layoutCameraHelper);
scene.add(layoutCameraHelper);

const debugShotCameraHandle = createDebugHandle(new THREE.OctahedronGeometry(0.12, 0), "#8fd2ff");
debugShotCameraHandle.visible = false;
layoutCamera.add(debugShotCameraHandle);

const shotCameraRotationProxy = new THREE.Object3D();
scene.add(shotCameraRotationProxy);

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enabled = false;
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.06;
orbitControls.enablePan = true;
orbitControls.screenSpacePanning = true;
orbitControls.rotateSpeed = 0.9;
orbitControls.zoomSpeed = 0.9;
orbitControls.minDistance = DEFAULT_ORBIT_LIMITS.minDistance;
orbitControls.maxDistance = DEFAULT_ORBIT_LIMITS.maxDistance;
orbitControls.target.fromArray(SCOUT_VIEW.target);
orbitControls.update();

const composer = new EffectComposer(renderer);
const mainRenderPass = new RenderPass(scene, camera);
composer.addPass(mainRenderPass);

const mainBokehPass = new BokehPass(scene, layoutCamera, {
  focus: shotCameraState.focusDistance,
  aperture: 0,
  maxblur: shotCameraState.maxBlur,
});
mainBokehPass.enabled = false;
composer.addPass(mainBokehPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(Math.round(initCssW * initDpr), Math.round(initCssH * initDpr)),
  DEFAULT_SCENE_STATE.bloomStrength,
  DEFAULT_SCENE_STATE.bloomRadius,
  DEFAULT_SCENE_STATE.bloomThreshold,
);
composer.addPass(bloomPass);

const gradePass = new ShaderPass(CinematicGradeShader);
if (isMobile) {
  bloomPass.enabled = false;
  gradePass.enabled = false;
}
composer.addPass(gradePass);
composer.addPass(new OutputPass());

const textureLoader = new THREE.TextureLoader();
const caveMaps = loadPbrTextureSet(textureLoader, "Cave", renderer);
const rockMaps = loadPbrTextureSet(textureLoader, "Rock", renderer);

const world = new THREE.Group();
scene.add(world);

const caveRoot = new THREE.Group();
const chamberAnchor = new THREE.Object3D();
world.add(caveRoot);
caveRoot.add(chamberAnchor);

const cameraTarget = new THREE.Object3D();
cameraTarget.position.fromArray(SCENE_VIEW.target);
scene.add(cameraTarget);

const debugShotFocusHandle = createDebugHandle(new THREE.IcosahedronGeometry(0.09, 0), "#ffd58f");
debugShotFocusHandle.visible = false;
cameraTarget.add(debugShotFocusHandle);

const debugShotLine = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
  new THREE.LineBasicMaterial({
    color: "#7fa7d6",
    depthTest: false,
    transparent: true,
    opacity: 0.7,
  }),
);
debugShotLine.visible = false;
debugShotLine.renderOrder = 19;
scene.add(debugShotLine);

const chamberAim = new THREE.Object3D();
scene.add(chamberAim);

const ambientLight = new THREE.HemisphereLight("#d8d0c4", "#080706", DEFAULT_SCENE_STATE.ambientIntensity);
scene.add(ambientLight);

const lightRig = new THREE.Group();
scene.add(lightRig);

const debugLightRig = new THREE.Group();
debugLightRig.visible = false;
scene.add(debugLightRig);

const debugAmbientLight = new THREE.AmbientLight("#eef2ff", 1.8);
debugLightRig.add(debugAmbientLight);

const debugHemisphereLight = new THREE.HemisphereLight("#eef4ff", "#2a3644", 3.8);
debugLightRig.add(debugHemisphereLight);

const debugWorkLight = new THREE.SpotLight("#fff8ef", 40, 220, 1.22, 0.72, 0);
debugWorkLight.castShadow = false;
debugLightRig.add(debugWorkLight);

const debugWorkTarget = new THREE.Object3D();
scene.add(debugWorkTarget);
debugWorkLight.target = debugWorkTarget;

const debugFillLight = new THREE.PointLight("#d5e3ff", 10, 200, 0);
debugLightRig.add(debugFillLight);

const debugBackLight = new THREE.PointLight("#fff1da", 7.5, 180, 0);
debugLightRig.add(debugBackLight);

const caveRockMaterial = new THREE.MeshStandardMaterial({
  color: DEFAULT_SCENE_STATE.caveColor,
  map: caveMaps.map,
  bumpMap: caveMaps.bumpMap,
  bumpScale: 0.18,
  normalMap: caveMaps.normalMap,
  normalScale: new THREE.Vector2(1.6, 1.6),
  roughnessMap: caveMaps.roughnessMap,
  metalnessMap: caveMaps.metalnessMap,
  roughness: DEFAULT_SCENE_STATE.caveRoughness,
  metalness: DEFAULT_SCENE_STATE.caveMetalness,
  envMapIntensity: 0.45,
  side: THREE.DoubleSide,
});

const caveIceMaterial = new THREE.MeshStandardMaterial({
  color: DEFAULT_SCENE_STATE.iceColor,
  map: rockMaps.map,
  bumpMap: rockMaps.bumpMap,
  bumpScale: 0.12,
  normalMap: rockMaps.normalMap,
  normalScale: new THREE.Vector2(1.4, 1.4),
  roughnessMap: rockMaps.roughnessMap,
  metalnessMap: rockMaps.metalnessMap,
  roughness: DEFAULT_SCENE_STATE.iceRoughness,
  metalness: DEFAULT_SCENE_STATE.iceMetalness,
  envMapIntensity: 0.4,
  side: THREE.DoubleSide,
});

const sculptureHeadMaterial = new THREE.MeshStandardMaterial({
  color: "#c9a84c",
  roughness: 0.22,
  metalness: 1.0,
  envMapIntensity: 0.8,
});

const sculptureBaseMaterial = new THREE.MeshStandardMaterial({
  color: "#c9a84c",
  roughness: 0.22,
  metalness: 1.0,
  envMapIntensity: 0.8,
});

const sculpturePedestalMaterial = new THREE.MeshStandardMaterial({
  color: "#d8d2c4",
  roughness: 0.85,
  metalness: 0.0,
  envMapIntensity: 0.15,
});

const sculptureRoot = new THREE.Group();
world.add(sculptureRoot);

let sculptureHeadGroup = null;
const caveAudio = createCaveAudio();

function getArtName() {
  return window.artName || window.location.pathname.replace(/^\/|\/$/g, "");
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

const dust = createDustCloud(isMobile ? 60 : undefined);
scene.add(dust.points);

const fogVolume = createFogVolume(isMobile ? 12 : undefined);
fogVolume.mesh.position.set(-12.515, 6.651, 33.032);
fogVolume.setIntensity(DEFAULT_SCENE_STATE.fogVolumeIntensity);
fogVolume.setScale(DEFAULT_SCENE_STATE.fogVolumeScale);
fogVolume.setDriftSpeed(DEFAULT_SCENE_STATE.fogVolumeDrift);
fogVolume.setTurbulence(DEFAULT_SCENE_STATE.fogVolumeTurbulence);
fogVolume.setRise(DEFAULT_SCENE_STATE.fogVolumeRise);
fogVolume.setPulse(DEFAULT_SCENE_STATE.fogVolumePulse);
fogVolume.setColor(DEFAULT_SCENE_STATE.fogVolumeColor);
scene.add(fogVolume.mesh);

const debugMarkerRoot = new THREE.Group();
debugMarkerRoot.visible = false;
scene.add(debugMarkerRoot);

const lightEntries = [];
let lightSerial = Math.max(...DEFAULT_LIGHTS.map((l) => Number(l.id.split("-")[1]) || 0)) + 1;

const transformControls = new TransformControls(camera, renderer.domElement);
transformControls.enabled = false;
transformControls.setSize(1.2);
const transformControlsHelper = transformControls.getHelper();
transformControlsHelper.visible = false;
scene.add(transformControlsHelper);
transformControls.addEventListener("dragging-changed", (event) => {
  debugState.dragging = event.value;
  syncOrbitControlsEnabled();
});
transformControls.addEventListener("mouseDown", () => {
  debugState.dragging = true;
  syncOrbitControlsEnabled();
});
transformControls.addEventListener("mouseUp", () => {
  debugState.dragging = false;
  syncOrbitControlsEnabled();
});
transformControls.addEventListener("objectChange", () => {
  // Force uniform scale — find which axis changed and apply to all
  const obj = transformControls.object;
  if (obj && debugState.mode === "scale") {
    const prev = obj.userData._prevUniformScale || 1;
    const sx = obj.scale.x, sy = obj.scale.y, sz = obj.scale.z;
    // Pick the axis that differs most from the previous uniform value
    const dx = Math.abs(sx - prev), dy = Math.abs(sy - prev), dz = Math.abs(sz - prev);
    const s = dx >= dy && dx >= dz ? sx : dy >= dz ? sy : sz;
    obj.scale.set(s, s, s);
    obj.userData._prevUniformScale = s;
  }
  syncShotCameraStateFromTarget(debugState.target);
  syncManagedLightStateFromTarget(debugState.target);
  syncLookTargets();
  syncDebugMarkers();
  updateDebugShotVisuals();
  debugUi.setLights(getStudioLightList(), debugState.target);
});

const showcaseUi = createShowcaseUi(viewport, SCENE_VIEW, {
  appRoot: app,
  onLanguageChange(languageId) {
    setAnalyticsPageLanguage(languageId);
    caveAudio.setLanguage(languageId);
  },
  onMuteToggle(muted) {
    caveAudio.setMuted(muted);
  },
});

const sceneState = { ...DEFAULT_SCENE_STATE };
const viewState = {
  mode: "camera",
};
const lightingState = {
  mode: "production",
};
const shellState = {
  mode: "solid",
};
const scoutCameraState = {
  position: [...SCOUT_VIEW.position],
  target: [...SCOUT_VIEW.target],
};
const scoutState = {
  mode: "orbit",
  pivotLabel: "Shot Focus",
};
const freeformState = {
  dragging: false,
  pointerId: null,
  x: 0,
  y: 0,
  distance: 10,
  spherical: new THREE.Spherical(10, Math.PI * 0.5, 0),
};

const debugState = {
  enabled: false,
  dragging: false,
  mode: "translate",
  target: "cave",
};

let debugUi = null;
let activeEntranceTimeline = null;


const entranceTimeline = JSON.parse(JSON.stringify(DEFAULT_ENTRANCE_TIMELINE));

function replayEntrance({ onComplete } = {}) {
  if (activeEntranceTimeline) {
    activeEntranceTimeline.cancel();
  }
  activeEntranceTimeline = runEntranceTimeline({
    timeline: entranceTimeline,
    applySceneState,
    setLightIntensity(lightId, intensity) {
      const entry = getLightEntryById(lightId);
      if (entry) {
        entry.state.intensity = intensity;
        entry.light.intensity = intensity;
      }
    },
    getSceneState() {
      return sceneState;
    },
    setCameraState(position, target, focalLength) {
      applySavedShot(position, target);
      if (typeof focalLength === "number") {
        setShotCameraSettings({ focalLength });
      }
    },
    onComplete,
  });
}

const entranceTabContent = createEntranceTabContent({
  timeline: entranceTimeline,
  onReplay: replayEntrance,
});

for (const config of DEFAULT_LIGHTS) {
  addManagedLight(config);
}

debugUi = createDebugLayoutUi(viewport, {
  staticTargets: STATIC_DEBUG_TARGETS,
  sceneDefinitions: SCENE_CONTROL_DEFINITIONS,
  sceneState,
  cameraSettings: shotCameraState,
  onToggle: setDebugMode,
  onPrint: printDebugPositions,
  onModeChange: setDebugTransformMode,
  onTargetChange: setDebugTarget,
  onViewModeChange: setViewMode,
  onLightingModeChange: setLightingMode,
  onShellModeChange: setShellMode,
  onCopy: copyDebugOutput,
  onSceneChange: applySceneState,
  onCameraSettingsChange: setShotCameraSettings,
  onAddLight: addLightOfType,
  onDeleteLight: removeManagedLight,
  onLightChange: updateManagedLight,
  onScoutModeChange: setScoutMode,
  entranceTabContent,
});
debugUi.setTarget(debugState.target);
debugUi.setLights(getStudioLightList(), debugState.target);
debugUi.setSelected("Cave");
debugUi.setRotationEnabled(true);
debugUi.setViewMode(viewState.mode);
debugUi.setLightingMode(lightingState.mode);
debugUi.setShellMode(shellState.mode);
debugUi.setSceneState(sceneState);
debugUi.setCameraSettings(shotCameraState);
debugUi.setScoutMode(scoutState.mode);
debugUi.setScoutPivotLabel(scoutState.pivotLabel);
debugUi.setScoutVisible(false);

const panelToolbar = document.createElement("div");
panelToolbar.className = "panel-toolbar";
viewport.append(panelToolbar);

const debugToggle = viewport.querySelector(".debug-shell > .debug-toggle");
panelToolbar.append(debugToggle);

let caveAsset = null;
let storedEnvMap = null;
let debugPreviewRenderer = null;
let debugPreviewComposer = null;
let debugPreviewRenderPass = null;
let debugPreviewBokehPass = null;
let debugPreviewBloomPass = null;
let debugPreviewGradePass = null;
let debugPreviewSize = { width: 0, height: 0 };

applySceneState(sceneState);
applyShotCameraSettings();
applyScoutControlMode();
syncOrbitControlsEnabled();
syncLookTargets();
syncDebugMarkers();

// ResizeObserver is more reliable than window "resize" on iOS Safari —
// it fires for CSS-driven size changes (dvh shifts, URL-bar hide/show).
new ResizeObserver(handleResize).observe(canvas);
window.addEventListener("resize", handleResize);
window.addEventListener("keydown", handleKeydown);
window.addEventListener("pointermove", handleFreeformPointerMove);
window.addEventListener("pointerup", handleFreeformPointerUp);
window.addEventListener("pointercancel", handleFreeformPointerUp);
renderer.domElement.addEventListener("pointerdown", handleFreeformPointerDown);

void init();
render();

async function init() {
  const manager = new THREE.LoadingManager();
  manager.onProgress = (_url, itemsLoaded, itemsTotal) => {
    if (itemsTotal > 0) {
      showcaseUi.setProgress(itemsLoaded / itemsTotal);
    }
  };

  const fbxLoader = new FBXLoader(manager);
  const gltfLoader = new GLTFLoader(manager);
  const rgbeLoader = new RGBELoader(manager);
  try {
    showcaseUi.setStatus("Loading cave.");

    const [cave, headGltf, hdrTexture] = await Promise.all([
      loadAsset(fbxLoader, CAVE_ASSET_URL),
      new Promise((resolve, reject) => {
        gltfLoader.load(HEAD_ASSET_URL, resolve, undefined, reject);
      }),
      loadAsset(rgbeLoader, `${BASE}map.hdr`),
    ]);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envMap = pmrem.fromEquirectangular(hdrTexture).texture;
    storedEnvMap = envMap;
    scene.environment = envMap;
    hdrTexture.dispose();
    pmrem.dispose();

    showcaseUi.setStatus("Styling geometry and setting the chamber.");
    caveAsset = setupCaveAsset(cave);
    setupSculpture(headGltf.scene);

    setDefaultLayout();
    syncLookTargets();
    syncDebugMarkers();
    applySavedShot(SCENE_VIEW.position, SCENE_VIEW.target);

    showcaseUi.setProgress(1);

    window.setTimeout(() => {
      showcaseUi.revealExperience({
        onLanguageSelected(langId) {
          // Browser audio is unlocked by this user gesture, but stays silent
          // until the instructions modal is dismissed.
          setAnalyticsPageLanguage(langId);
          caveAudio.setLanguage(langId);
        },
        onInstructionsDismissed() {
          fireExperienceViewPage();
          // Quotes start as soon as audio buffers finish decoding, in parallel
          // with the entrance animation.
          caveAudio.start().then(() => caveAudio.startQuotes());
          replayEntrance();
        },
      });
    }, 180);
  } catch (error) {
    console.error(error);
    showcaseUi.setStatus("Scene load failed. Check the console for details.");
  }
}

function setupCaveAsset(object) {
  object.traverse((child) => {
    if (!child.isMesh) {
      return;
    }

    child.castShadow = true;
    child.receiveShadow = true;
    child.material = [caveRockMaterial, caveIceMaterial];
  });

  normalizeObject(object, 26);
  caveRoot.add(object);
  return object;
}

function setupSculpture(object) {
  const headMeshes = [];

  object.traverse((child) => {
    if (!child.isMesh) {
      return;
    }

    child.castShadow = true;
    child.receiveShadow = true;
    // Keep the GLB's baked PBR materials (BaseColor, Metallic, Normal, Roughness)
    // but ensure env map integration works
    if (child.material) {
      child.material.envMapIntensity = 0.8;
    }
    headMeshes.push(child);
  });

  // Normalize and center the sculpture
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const targetHeight = 2.4;
  const scale = targetHeight / size.y;
  object.scale.multiplyScalar(scale);
  object.updateMatrixWorld(true);

  const scaledBox = new THREE.Box3().setFromObject(object);
  const center = scaledBox.getCenter(new THREE.Vector3());
  object.position.x -= center.x;
  object.position.z -= center.z;
  object.position.y -= scaledBox.min.y;

  sculptureRoot.add(object);

  // Create a pivot group for the gold head pieces so they rotate together.
  // The pivot sits at the center of the head bounding box (in sculptureRoot space).
  if (headMeshes.length > 0) {
    object.updateMatrixWorld(true);
    const headBox = new THREE.Box3();
    for (const m of headMeshes) {
      headBox.expandByObject(m);
    }
    const headCenter = headBox.getCenter(new THREE.Vector3());
    // Convert to sculptureRoot local space
    sculptureRoot.updateMatrixWorld(true);
    sculptureRoot.worldToLocal(headCenter);

    const pivot = new THREE.Group();
    pivot.position.copy(headCenter);
    sculptureRoot.add(pivot);

    // Re-parent each head mesh into the pivot
    for (const m of headMeshes) {
      const worldPos = new THREE.Vector3();
      const worldQuat = new THREE.Quaternion();
      const worldScale = new THREE.Vector3();
      m.updateMatrixWorld(true);
      m.matrixWorld.decompose(worldPos, worldQuat, worldScale);

      // Convert to pivot local space
      pivot.updateMatrixWorld(true);
      const pivotInverse = new THREE.Matrix4().copy(pivot.matrixWorld).invert();
      worldPos.applyMatrix4(pivotInverse);

      m.removeFromParent();
      pivot.add(m);
      m.position.copy(worldPos);
      m.quaternion.copy(worldQuat);
      // Apply the inverse of the pivot's world quaternion to get local rotation
      const pivotWorldQuat = new THREE.Quaternion();
      pivot.getWorldQuaternion(pivotWorldQuat);
      m.quaternion.premultiply(pivotWorldQuat.invert());
      m.scale.copy(worldScale);
      // Undo the pivot's world scale
      const pivotWorldScale = new THREE.Vector3();
      pivot.getWorldScale(pivotWorldScale);
      m.scale.divide(pivotWorldScale);
    }

    sculptureHeadGroup = pivot;
  }
  sculptureRoot.position.set(-26.285, 1.053, -0.934);
  sculptureRoot.rotation.set(0.012, -0.928, 0.01);
  sculptureRoot.scale.setScalar(2.803);
}

function setDefaultLayout() {
  caveRoot.position.set(0.42, -0.54, 0.18);
  caveRoot.rotation.set(0, 0.2, 0);
  chamberAnchor.position.set(1.12, 1.1, -0.58);
}

function addLightOfType(type) {
  const focus = cameraTarget.position.clone();
  const position = focus.clone().add(
    new THREE.Vector3(
      type === "directional" ? 4.8 : 2.8,
      type === "point" ? 2.4 : 3.4,
      type === "point" ? 2.2 : 4.1,
    ),
  );

  const entry = addManagedLight({
    type,
    position: position.toArray(),
    target: focus.toArray(),
  });

  setDebugTarget(getLightTargetId(entry.state.id));
}

function addManagedLight(config) {
  const state = createManagedLightState(config);
  const marker = createDebugMarker(state.color, 0.065);
  const targetMarker = createDebugMarker("#8fcfff", 0.045);
  targetMarker.visible = false;
  const aimLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
    new THREE.LineBasicMaterial({
      color: state.color,
      depthTest: false,
      transparent: true,
      opacity: 0.78,
    }),
  );
  aimLine.visible = false;
  aimLine.renderOrder = 18;

  const entry = {
    state,
    light: null,
    targetObject: null,
    rotationProxy: null,
    marker,
    targetMarker,
    aimLine,
    helper: null,
  };

  debugMarkerRoot.add(marker, targetMarker, aimLine);
  rebuildManagedLight(entry, state.type);
  lightEntries.push(entry);
  syncStudioLightUi();
  return entry;
}

function removeManagedLight(id) {
  const index = lightEntries.findIndex((entry) => entry.state.id === id);
  if (index === -1) {
    return;
  }

  const [entry] = lightEntries.splice(index, 1);
  destroyManagedLight(entry);
  syncDebugMarkers();

  if (debugState.target === getLightTargetId(id) || debugState.target === getLightAimTargetId(id)) {
    debugState.target = "cave";
    debugUi?.setSelected("Cave");
    debugUi?.setTarget("cave");
    debugUi?.setRotationEnabled(true);

    if (debugState.enabled) {
      attachDebugTarget();
    }
  }

  syncStudioLightUi();
}

function updateManagedLight(id, patch) {
  const entry = getLightEntryById(id);
  if (!entry) {
    return;
  }

  const previousType = entry.state.type;
  const nextType = normalizeLightType(patch.type ?? entry.state.type);
  entry.state = {
    ...entry.state,
    ...patch,
    type: nextType,
  };

  if (typeof patch.name === "string") {
    entry.state.name = patch.name.trim() || entry.state.name;
  }

  if (previousType !== nextType) {
    if (supportsLightTarget(nextType) && !Array.isArray(entry.state.target)) {
      entry.state.target = cameraTarget.position.toArray();
    }

    rebuildManagedLight(entry, nextType);
  } else {
    applyManagedLightState(entry);
  }

  if (!supportsLightTarget(nextType) && debugState.target === getLightAimTargetId(id)) {
    setDebugTarget(getLightTargetId(id));
    return;
  }

  if (
    (debugState.target === getLightTargetId(id) || debugState.target === getLightAimTargetId(id)) &&
    !canRotateDebugTarget(debugState.target) &&
    debugState.mode === "rotate"
  ) {
    debugState.mode = "translate";
    debugUi?.setMode(debugState.mode);
  }

  syncDebugMarkers();

  if (patch.type || typeof patch.name === "string") {
    if (debugState.target === getLightTargetId(id) || debugState.target === getLightAimTargetId(id)) {
      debugUi?.setSelected(getDebugTargetLabel(debugState.target));
      debugUi?.setRotationEnabled(canRotateDebugTarget(debugState.target));

      if (debugState.enabled) {
        attachDebugTarget();
      }
    }

    syncStudioLightUi();
  }
}

function createManagedLightState(config) {
  const type = normalizeLightType(config.type);
  const nextIndex = config.id ? lightSerial : lightSerial + 1;
  if (!config.id) {
    lightSerial = nextIndex;
  }

  return {
    id: config.id ?? `light-${nextIndex}`,
    name: config.name ?? `${capitalizeWord(type)} ${String(nextIndex).padStart(2, "0")}`,
    type,
    color: config.color ?? "#ffffff",
    intensity: config.intensity ?? 4,
    visible: config.visible ?? true,
    castShadow: config.castShadow ?? type !== "point",
    shadowSize: config.shadowSize ?? (isMobile ? 512 : 1024),
    position: [...(config.position ?? [2.4, 3.2, 2.8])],
    target: [...(config.target ?? cameraTarget.position.toArray())],
    rotation: [...(config.rotation ?? [0, 0, 0])],
    distance: config.distance ?? 18,
    decay: config.decay ?? 1.35,
    angle: config.angle ?? 0.55,
    penumbra: config.penumbra ?? 0.35,
  };
}

function rebuildManagedLight(entry, nextType) {
  destroyManagedLightObject(entry);

  const light = createThreeLight(nextType, entry.state);
  light.name = entry.state.name;
  lightRig.add(light);

  entry.light = light;
  entry.targetObject = null;
  entry.rotationProxy = new THREE.Object3D();
  entry.helper = null;
  scene.add(entry.rotationProxy);

  if (supportsLightTarget(nextType)) {
    entry.targetObject = new THREE.Object3D();
    entry.targetObject.position.fromArray(entry.state.target);
    scene.add(entry.targetObject);
    entry.light.target = entry.targetObject;

    if (nextType === "spot") {
      entry.helper = new THREE.SpotLightHelper(entry.light, entry.state.color);
    } else if (nextType === "directional") {
      entry.helper = new THREE.DirectionalLightHelper(entry.light, 2.2, entry.state.color);
    }

    if (entry.helper) {
      setDebugHelperDepth(entry.helper);
      entry.helper.visible = false;
      debugMarkerRoot.add(entry.helper);
    }
  }

  applyManagedLightState(entry);
}

function applyManagedLightState(entry) {
  const { state, light, targetObject, rotationProxy } = entry;
  light.name = state.name;
  light.color.set(state.color);
  light.intensity = state.intensity;
  light.visible = state.visible;
  light.castShadow = state.castShadow;
  light.position.fromArray(state.position);
  applyShadowMapSize(light, state.shadowSize);

  if (targetObject) {
    targetObject.position.fromArray(state.target);
  }

  if (rotationProxy) {
    rotationProxy.position.copy(light.position);
    if (targetObject) {
      rotationProxy.lookAt(targetObject.position);
      state.rotation = rotationProxy.rotation.toArray().slice(0, 3);
    } else {
      rotationProxy.rotation.set(...state.rotation);
      light.rotation.set(...state.rotation);
    }
    rotationProxy.updateMatrixWorld();
  }

  if (light.isSpotLight) {
    light.distance = state.distance;
    light.decay = state.decay;
    light.angle = state.angle;
    light.penumbra = state.penumbra;
    light.shadow.bias = -0.00015;
    light.shadow.normalBias = 0.025;
  } else if (light.isPointLight) {
    light.distance = state.distance;
    light.decay = state.decay;
    light.shadow.bias = -0.0002;
    light.shadow.normalBias = 0.02;
  } else if (light.isDirectionalLight) {
    light.shadow.bias = -0.00015;
    light.shadow.normalBias = 0.02;
  }

  entry.marker.material.color.set(state.color);
  entry.targetMarker.visible = false;
  entry.aimLine.material.color.set(state.color);

  if (entry.helper) {
    if ("color" in entry.helper) {
      entry.helper.color?.set?.(state.color);
    }
    entry.helper.update?.();
  }
}

function createThreeLight(type, state) {
  if (type === "spot") {
    const light = new THREE.SpotLight(state.color, state.intensity, state.distance, state.angle, state.penumbra, state.decay);
    light.shadow.radius = 2;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 80;
    return light;
  }

  if (type === "directional") {
    const light = new THREE.DirectionalLight(state.color, state.intensity);
    light.shadow.radius = 2;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 120;
    light.shadow.camera.left = -40;
    light.shadow.camera.right = 40;
    light.shadow.camera.top = 40;
    light.shadow.camera.bottom = -40;
    return light;
  }

  const light = new THREE.PointLight(state.color, state.intensity, state.distance, state.decay);
  light.shadow.radius = 2;
  light.shadow.camera.near = 0.5;
  light.shadow.camera.far = 60;
  return light;
}

function destroyManagedLightObject(entry) {
  if (entry.light) {
    lightRig.remove(entry.light);
  }

  if (entry.targetObject?.parent) {
    entry.targetObject.parent.remove(entry.targetObject);
  }

  if (entry.rotationProxy?.parent) {
    entry.rotationProxy.parent.remove(entry.rotationProxy);
  }

  if (entry.helper?.parent) {
    entry.helper.parent.remove(entry.helper);
  }

  entry.helper?.dispose?.();
  entry.helper = null;
}

function destroyManagedLight(entry) {
  destroyManagedLightObject(entry);

  if (entry.marker.parent) {
    entry.marker.parent.remove(entry.marker);
  }

  if (entry.targetMarker.parent) {
    entry.targetMarker.parent.remove(entry.targetMarker);
  }

  if (entry.aimLine.parent) {
    entry.aimLine.parent.remove(entry.aimLine);
  }
}

function syncManagedLightStateFromTarget(target) {
  const lightId = getLightIdFromTarget(target);
  if (!lightId) {
    return;
  }

  const entry = getLightEntryById(lightId);
  if (!entry) {
    return;
  }

  if (isLightTargetId(target)) {
    entry.state.position = entry.light.position.toArray();

    if (entry.rotationProxy) {
      entry.rotationProxy.position.copy(entry.light.position);
    }

    if (debugState.mode === "rotate" && entry.rotationProxy) {
      entry.state.rotation = entry.rotationProxy.rotation.toArray().slice(0, 3);

      if (entry.targetObject) {
        const distance = entry.targetObject.position.distanceTo(entry.light.position);
        const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(entry.rotationProxy.quaternion).normalize();
        entry.targetObject.position.copy(entry.light.position).addScaledVector(direction, distance);
        entry.state.target = entry.targetObject.position.toArray();
      } else {
        entry.light.rotation.copy(entry.rotationProxy.rotation);
      }
    } else if (entry.rotationProxy && entry.targetObject) {
      entry.rotationProxy.lookAt(entry.targetObject.position);
    }
  }

  if (isLightAimTargetId(target) && entry.targetObject) {
    entry.state.target = entry.targetObject.position.toArray();

    if (entry.rotationProxy) {
      entry.rotationProxy.position.copy(entry.light.position);
      entry.rotationProxy.lookAt(entry.targetObject.position);
      entry.state.rotation = entry.rotationProxy.rotation.toArray().slice(0, 3);
    }
  }
}

function getStudioLightList() {
  return lightEntries.map((entry) => ({
    id: entry.state.id,
    name: entry.state.name,
    type: entry.state.type,
    color: entry.state.color,
    intensity: entry.light.intensity,
    visible: entry.light.visible,
    castShadow: entry.light.castShadow,
    distance: "distance" in entry.light ? entry.light.distance : entry.state.distance,
    decay: "decay" in entry.light ? entry.light.decay : entry.state.decay,
    angle: entry.light.isSpotLight ? entry.light.angle : entry.state.angle,
    penumbra: entry.light.isSpotLight ? entry.light.penumbra : entry.state.penumbra,
    shadowSize: entry.state.shadowSize,
    hasTarget: Boolean(entry.targetObject),
  }));
}

function syncStudioLightUi() {
  if (!debugUi) {
    return;
  }

  debugUi.setLights(getStudioLightList(), debugState.target);
}

function setScoutMode(mode) {
  scoutState.mode = mode === "pan" || mode === "dolly" || mode === "orbit" ? mode : "freeform";
  applyScoutControlMode();
  if (scoutState.mode === "freeform") {
    syncFreeformSphericalFromCamera();
  }
  renderer.domElement.style.cursor = scoutState.mode === "freeform" ? "grab" : "";
  syncOrbitControlsEnabled();
  debugUi?.setScoutMode(scoutState.mode);
}

function applyScoutControlMode() {
  orbitControls.mouseButtons.LEFT =
    scoutState.mode === "freeform"
      ? THREE.MOUSE.ROTATE
      : scoutState.mode === "pan"
      ? THREE.MOUSE.PAN
      : scoutState.mode === "dolly"
        ? THREE.MOUSE.DOLLY
        : THREE.MOUSE.ROTATE;

  orbitControls.mouseButtons.MIDDLE = THREE.MOUSE.DOLLY;
  orbitControls.mouseButtons.RIGHT = scoutState.mode === "pan" ? THREE.MOUSE.ROTATE : THREE.MOUSE.PAN;
}

function setScoutPivotFromTarget(target) {
  const nextTarget = getDebugTargetWorldPosition(target, new THREE.Vector3());
  orbitControls.target.copy(nextTarget);
  orbitControls.update();
  updateScoutPivotLabel(getDebugTargetLabel(target));
}

function centerGlobalCameraOnTarget(target) {
  const nextTarget = getDebugTargetWorldPosition(target, new THREE.Vector3());
  const offset = new THREE.Vector3().subVectors(camera.position, orbitControls.target);

  if (offset.lengthSq() < 0.0001) {
    offset.set(5.6, 3.2, 5.2);
  }

  camera.position.copy(nextTarget).add(offset);
  orbitControls.target.copy(nextTarget);
  orbitControls.update();
  updateScoutPivotLabel(getDebugTargetLabel(target));
}

function syncFreeformSphericalFromCamera() {
  const offset = new THREE.Vector3().subVectors(orbitControls.target, camera.position);
  if (offset.lengthSq() < 0.0001) {
    offset.set(0, 0, -10).applyQuaternion(camera.quaternion);
  }

  freeformState.distance = Math.max(offset.length(), 0.25);
  freeformState.spherical.setFromVector3(offset);
}

function shouldUseFreeformControls() {
  return debugState.enabled && !debugState.dragging && viewState.mode === "global" && scoutState.mode === "freeform";
}

function handleFreeformPointerDown(event) {
  if (!shouldUseFreeformControls() || event.button !== 0 || transformControls.axis) {
    return;
  }

  freeformState.dragging = true;
  freeformState.pointerId = event.pointerId;
  freeformState.x = event.clientX;
  freeformState.y = event.clientY;
  syncFreeformSphericalFromCamera();
  renderer.domElement.style.cursor = "grabbing";
  event.preventDefault();
}

function handleFreeformPointerMove(event) {
  if (!freeformState.dragging || event.pointerId !== freeformState.pointerId) {
    return;
  }

  const deltaX = event.clientX - freeformState.x;
  const deltaY = event.clientY - freeformState.y;
  freeformState.x = event.clientX;
  freeformState.y = event.clientY;

  freeformState.spherical.theta -= deltaX * 0.005;
  freeformState.spherical.phi += deltaY * 0.005;
  freeformState.spherical.phi = THREE.MathUtils.clamp(freeformState.spherical.phi, 0.02, Math.PI - 0.02);

  const lookOffset = new THREE.Vector3().setFromSpherical(freeformState.spherical);
  orbitControls.target.copy(camera.position).add(lookOffset);
  camera.lookAt(orbitControls.target);
  camera.updateMatrixWorld();
  updateScoutPivotLabel("Freeform View");
  event.preventDefault();
}

function handleFreeformPointerUp(event) {
  if (event.pointerId !== freeformState.pointerId) {
    return;
  }

  freeformState.dragging = false;
  freeformState.pointerId = null;
  renderer.domElement.style.cursor = "";
}

function getDebugTargetWorldPosition(target, vector) {
  if (target === "cave") {
    return chamberAim.getWorldPosition(vector);
  }

  if (target === "camera") {
    return vector.copy(layoutCamera.position);
  }

  if (target === "focus") {
    return vector.copy(cameraTarget.position);
  }

  if (target === "sculpture") {
    return vector.copy(sculptureRoot.position);
  }

  if (target === "fog") {
    return vector.copy(fogVolume.mesh.position);
  }

  if (isLightTargetId(target)) {
    const entry = getLightEntryById(getLightIdFromTarget(target));
    return entry ? vector.copy(entry.light.position) : chamberAim.getWorldPosition(vector);
  }

  if (isLightAimTargetId(target)) {
    const entry = getLightEntryById(getLightIdFromTarget(target));
    return entry?.targetObject ? vector.copy(entry.targetObject.position) : chamberAim.getWorldPosition(vector);
  }

  return chamberAim.getWorldPosition(vector);
}

function getLightEntryById(id) {
  return lightEntries.find((entry) => entry.state.id === id) ?? null;
}

function supportsLightTarget(type) {
  return type === "spot" || type === "directional";
}

function normalizeLightType(type) {
  return type === "directional" || type === "point" ? type : "spot";
}

function isLightTargetId(target) {
  return typeof target === "string" && target.startsWith(LIGHT_TARGET_PREFIX);
}

function isLightAimTargetId(target) {
  return typeof target === "string" && target.startsWith(LIGHT_AIM_PREFIX);
}

function getLightIdFromTarget(target) {
  if (isLightTargetId(target)) {
    return target.slice(LIGHT_TARGET_PREFIX.length);
  }

  if (isLightAimTargetId(target)) {
    return target.slice(LIGHT_AIM_PREFIX.length);
  }

  return null;
}

function getLightTargetId(id) {
  return `${LIGHT_TARGET_PREFIX}${id}`;
}

function getLightAimTargetId(id) {
  return `${LIGHT_AIM_PREFIX}${id}`;
}

function updateScoutPivotLabel(label) {
  scoutState.pivotLabel = label ? `${label} Pivot` : "Shot Focus";
  debugUi?.setScoutPivotLabel(scoutState.pivotLabel);
}

function setLightingMode(mode) {
  lightingState.mode = mode === "debug" ? "debug" : "production";
  debugUi?.setLightingMode(lightingState.mode);
}

function applySceneState(nextState) {
  Object.assign(sceneState, nextState);

  renderer.setClearColor(sceneState.backgroundColor, 1);
  renderer.toneMappingExposure = sceneState.exposure;
  scene.background.set(sceneState.backgroundColor);
  applyFogMode("production");

  bloomPass.strength = sceneState.bloomStrength;
  bloomPass.radius = sceneState.bloomRadius;
  bloomPass.threshold = sceneState.bloomThreshold;

  if (debugPreviewBloomPass) {
    debugPreviewBloomPass.strength = sceneState.bloomStrength;
    debugPreviewBloomPass.radius = sceneState.bloomRadius;
    debugPreviewBloomPass.threshold = sceneState.bloomThreshold;
  }

  caveRockMaterial.color.set(sceneState.caveColor);
  caveRockMaterial.roughness = sceneState.caveRoughness;
  caveRockMaterial.metalness = sceneState.caveMetalness;
  caveRockMaterial.needsUpdate = true;

  caveIceMaterial.color.set(sceneState.iceColor);
  caveIceMaterial.roughness = sceneState.iceRoughness;
  caveIceMaterial.metalness = sceneState.iceMetalness;
  caveIceMaterial.needsUpdate = true;

  ambientLight.intensity = sceneState.ambientIntensity;

  const envScale = sceneState.envMapIntensity;
  scene.environment = envScale > 0 ? storedEnvMap : null;
  scene.environmentIntensity = envScale;
  caveRockMaterial.envMapIntensity = 0.45 * envScale;
  caveIceMaterial.envMapIntensity = 0.4 * envScale;
  // Update env map intensity on all sculpture meshes (GLB baked materials)
  sculptureRoot.traverse((child) => {
    if (child.isMesh && child.material) {
      child.material.envMapIntensity = 0.8 * envScale;
    }
  });

  fogVolume.setIntensity(sceneState.fogVolumeIntensity);
  fogVolume.setScale(sceneState.fogVolumeScale);
  fogVolume.setDriftSpeed(sceneState.fogVolumeDrift);
  fogVolume.setTurbulence(sceneState.fogVolumeTurbulence);
  fogVolume.setRise(sceneState.fogVolumeRise);
  fogVolume.setPulse(sceneState.fogVolumePulse);
  fogVolume.setColor(sceneState.fogVolumeColor);

  if (debugPreviewRenderer) {
    debugPreviewRenderer.setClearColor(sceneState.backgroundColor, 1);
  }

  debugUi?.setSceneState(sceneState);
}

function setShotCameraSettings(patch) {
  if (typeof patch.focalLength === "number") {
    shotCameraState.focalLength = THREE.MathUtils.clamp(patch.focalLength, 18, 135);
  }

  if (typeof patch.zoom === "number") {
    shotCameraState.zoom = THREE.MathUtils.clamp(patch.zoom, 1, 4);
  }

  if (typeof patch.focusDistance === "number") {
    shotCameraState.focusDistance = THREE.MathUtils.clamp(patch.focusDistance, 0.5, 120);
  }

  if (typeof patch.aperture === "number") {
    shotCameraState.aperture = THREE.MathUtils.clamp(patch.aperture, 0, 12);
  }

  if (typeof patch.maxBlur === "number") {
    shotCameraState.maxBlur = THREE.MathUtils.clamp(patch.maxBlur, 0, 0.03);
  }

  applyShotCameraSettings();
  debugUi?.setCameraSettings(shotCameraState);
}

function applyShotCameraSettings() {
  layoutCamera.setFocalLength(shotCameraState.focalLength);
  layoutCamera.zoom = shotCameraState.zoom;
  layoutCamera.updateProjectionMatrix();
  syncBokehPass(mainBokehPass, layoutCamera);

  if (debugPreviewBokehPass) {
    syncBokehPass(debugPreviewBokehPass, debugPreviewCamera);
  }
}

function syncBokehPass(pass, passCamera) {
  if (!pass) {
    return;
  }

  pass.camera = passCamera;
  pass.uniforms.focus.value = shotCameraState.focusDistance;
  pass.uniforms.aperture.value = shotCameraState.aperture * 0.00001;
  pass.uniforms.maxblur.value = shotCameraState.maxBlur;
  pass.uniforms.aspect.value = passCamera.aspect;
}

function shouldEnableShotDof() {
  return shotCameraState.aperture > 0 && shotCameraState.maxBlur > 0;
}

function applyLightingRig(mode) {
  const useDebugLighting = mode === "debug" && debugState.enabled;
  ambientLight.visible = !useDebugLighting;
  lightRig.visible = !useDebugLighting;
  debugLightRig.visible = useDebugLighting;
}

function applyLightBreathing(time) {
  const amount = sceneState.lightBreathing;
  if (amount <= 0) return;

  const speed = sceneState.lightBreathingSpeed;
  // Layer multiple sine waves for an organic, cloud-like feel
  const wave =
    Math.sin(time * speed * 0.7) * 0.5 +
    Math.sin(time * speed * 1.3 + 1.4) * 0.3 +
    Math.sin(time * speed * 0.4 + 2.7) * 0.2;

  const dimming = 1 - amount * wave;

  for (const entry of lightEntries) {
    entry.light.intensity = entry.state.intensity * dimming;
  }

  renderer.toneMappingExposure = sceneState.exposure * (1 - amount * 0.5 * wave);
}

// ── Scroll + auto rotation of head ───────────────────────────────────────
let scrollRotation = 0;       // accumulated scroll in radians
let scrollRotationTarget = 0; // smoothing target
const SCROLL_SENSITIVITY = 0.002; // radians per pixel of wheel scroll
const TOUCH_SENSITIVITY = 0.012;  // radians per pixel of touch swipe
const AUTO_ROTATE_SPEED = 0.1;    // radians per second

function applySculptureHeadRotation(time) {
  if (!sculptureHeadGroup) return;
  // Auto-rotate advances the target continuously
  scrollRotationTarget += AUTO_ROTATE_SPEED * (1 / 60); // approx per-frame
  // Smooth lerp toward target
  scrollRotation += (scrollRotationTarget - scrollRotation) * 0.05;
  sculptureHeadGroup.rotation.y = Math.PI + scrollRotation;
}

window.addEventListener("wheel", (e) => {
  if (debugState.enabled) return;
  // Don't let scroll inside a modal (e.g. the transcript box) rotate the head.
  if (e.target instanceof Element && e.target.closest(".modal-card")) return;
  scrollRotationTarget += e.deltaY * SCROLL_SENSITIVITY;
}, { passive: true });

// iOS/Android don't fire wheel events for touch swipes, so map single-finger
// vertical drags to the same rotation target.
let touchRotationId = null;
let touchRotationLastY = 0;

window.addEventListener("touchstart", (e) => {
  if (debugState.enabled) return;
  if (e.target instanceof Element && e.target.closest(".modal-card")) return;
  if (e.touches.length !== 1) {
    touchRotationId = null;
    return;
  }
  const touch = e.touches[0];
  touchRotationId = touch.identifier;
  touchRotationLastY = touch.clientY;
}, { passive: true });

window.addEventListener("touchmove", (e) => {
  if (touchRotationId === null || debugState.enabled) return;
  for (const touch of e.changedTouches) {
    if (touch.identifier !== touchRotationId) continue;
    const deltaY = touchRotationLastY - touch.clientY;
    touchRotationLastY = touch.clientY;
    scrollRotationTarget += deltaY * TOUCH_SENSITIVITY;
    break;
  }
}, { passive: true });

const endTouchRotation = (e) => {
  if (touchRotationId === null) return;
  for (const touch of e.changedTouches) {
    if (touch.identifier === touchRotationId) {
      touchRotationId = null;
      break;
    }
  }
};
window.addEventListener("touchend", endTouchRotation, { passive: true });
window.addEventListener("touchcancel", endTouchRotation, { passive: true });

function applyFogMode(mode) {
  if (!scene.fog) {
    return;
  }

  scene.fog.color.set(sceneState.fogColor);
  scene.fog.density = mode === "studio" ? Math.min(sceneState.fogDensity, 0.008) : sceneState.fogDensity;
}

function setShellMode(mode) {
  shellState.mode = mode === "interior" ? "interior" : "solid";
  debugUi?.setShellMode(shellState.mode);
}

function applyShellMode(mode) {
  const useInteriorShell = debugState.enabled && mode === "interior";

  for (const material of [caveRockMaterial, caveIceMaterial]) {
    const nextSide = useInteriorShell ? THREE.BackSide : THREE.DoubleSide;
    const nextTransparent = useInteriorShell;
    const nextOpacity = useInteriorShell ? 0.24 : 1;
    const nextDepthWrite = !useInteriorShell;

    if (
      material.side !== nextSide ||
      material.transparent !== nextTransparent ||
      material.opacity !== nextOpacity ||
      material.depthWrite !== nextDepthWrite
    ) {
      material.side = nextSide;
      material.transparent = nextTransparent;
      material.opacity = nextOpacity;
      material.depthWrite = nextDepthWrite;
      material.needsUpdate = true;
    }
  }
}

function syncDebugLighting(activeViewportCamera) {
  const nextTarget =
    viewState.mode === "global" ? orbitControls.target.clone() : cameraTarget.position.clone();
  const nextPosition = activeViewportCamera.position.clone();
  const forward = nextTarget.clone().sub(nextPosition);

  if (forward.lengthSq() < 0.0001) {
    forward.set(0, 0, -1).applyQuaternion(activeViewportCamera.quaternion);
  } else {
    forward.normalize();
  }

  const up = activeViewportCamera.up.clone().normalize();
  const right = new THREE.Vector3().crossVectors(forward, up).normalize();

  debugWorkLight.position.copy(nextPosition);
  debugWorkTarget.position.copy(nextTarget);

  debugFillLight.position
    .copy(nextTarget)
    .addScaledVector(up, 16)
    .addScaledVector(right, -10)
    .addScaledVector(forward, -8);

  debugBackLight.position
    .copy(nextTarget)
    .addScaledVector(up, 8)
    .addScaledVector(right, 14)
    .addScaledVector(forward, 10);
}

function applySavedShot(position, target) {
  camera.position.fromArray(position);
  layoutCamera.position.fromArray(position);
  layoutCamera.up.set(0, 1, 0);
  cameraTarget.position.fromArray(target);
  orbitControls.target.fromArray(target);
  applyShotCameraSettings();
  orbitControls.update();
}

function setViewMode(mode) {
  const nextMode = mode === "global" ? "global" : "camera";

  if (viewState.mode !== nextMode && nextMode === "global") {
    syncGlobalCameraFromShot();
  }

  viewState.mode = nextMode;
  debugUi.setViewMode(viewState.mode);
  debugUi.setScoutVisible(debugState.enabled && viewState.mode === "global");
  renderer.domElement.style.cursor =
    debugState.enabled && viewState.mode === "global" && scoutState.mode === "freeform" ? "grab" : "";
  syncOrbitControlsEnabled();
}

function setDebugMode(enabled) {
  if (enabled) {
    ensureDebugPreviewRenderer();
    setViewMode("global");
  }

  debugState.enabled = enabled;
  debugState.dragging = false;
  applyOrbitControlState(enabled);
  syncOrbitControlsEnabled();
  debugUi.setEnabled(enabled);
  debugUi.setViewMode(viewState.mode);
  debugUi.setScoutVisible(enabled && viewState.mode === "global");
  debugUi.setLightingMode(lightingState.mode);
  renderer.domElement.style.cursor = enabled && viewState.mode === "global" && scoutState.mode === "freeform" ? "grab" : "";
  debugMarkerRoot.visible = enabled;
  setDebugShotVisibility(enabled);
  applyLightingRig(enabled ? lightingState.mode : "production");

  if (!enabled) {
    transformControls.enabled = false;
    transformControls.detach();
    transformControlsHelper.visible = false;
    debugState.target = "cave";
    debugUi.setSelected("Cave");
    debugUi.setTarget("cave");
    debugUi.setLights(getStudioLightList(), "cave");
    debugUi.setRotationEnabled(true);
    debugUi.setMode(debugState.mode);
    debugUi.setOutput("");
    setViewMode("camera");
    orbitControls.update();
    return;
  }

  debugState.target = "cave";
  debugUi.setSelected("Cave");
  debugUi.setTarget("cave");
  debugUi.setLights(getStudioLightList(), "cave");
  debugUi.setRotationEnabled(true);
  debugUi.setMode(debugState.mode);
  debugUi.setOutput("");
  transformControls.enabled = true;
  attachDebugTarget();
}

function setDebugTransformMode(mode) {
  if (mode === "rotate" && !canRotateDebugTarget(debugState.target)) {
    return;
  }

  debugState.mode = mode;
  debugUi.setMode(mode);

  if (debugState.enabled) {
    attachDebugTarget();
  }
}

function setDebugTarget(target) {
  debugState.target = target;

  if (!canRotateDebugTarget(target) && debugState.mode === "rotate") {
    debugState.mode = "translate";
    debugUi.setMode(debugState.mode);
  }

  debugUi.setTarget(target);
  debugUi.setSelected(getDebugTargetLabel(target));
  debugUi.setLights(getStudioLightList(), target);
  debugUi.setRotationEnabled(canRotateDebugTarget(target));
  syncOrbitControlsEnabled();

  if (debugState.enabled) {
    attachDebugTarget();
  }
}

function attachDebugTarget() {
  if (debugState.target === "camera" && debugState.mode === "rotate") {
    syncShotCameraRotationProxyFromShot();
  }

  const object = getDebugTargetObject(debugState.target);
  transformControls.attach(object);
  transformControlsHelper.visible = true;
  transformControls.setMode(canRotateDebugTarget(debugState.target) ? debugState.mode : "translate");
  transformControls.showX = true;
  transformControls.showY = true;
  transformControls.showZ = true;
}

function canRotateDebugTarget(target) {
  if (target === "cave") {
    return true;
  }

  if (target === "camera") {
    return true;
  }

  if (target === "sculpture") {
    return true;
  }

  if (isLightTargetId(target)) {
    const entry = getLightEntryById(getLightIdFromTarget(target));
    return Boolean(entry?.rotationProxy) && supportsLightTarget(entry.state.type);
  }

  return false;
}

function getDebugTargetLabel(target) {
  const staticTarget = STATIC_DEBUG_TARGETS.find((entry) => entry.id === target);
  if (staticTarget) {
    return staticTarget.label;
  }

  if (isLightTargetId(target) || isLightAimTargetId(target)) {
    const entry = getLightEntryById(getLightIdFromTarget(target));
    if (!entry) {
      return "Light";
    }

    return isLightAimTargetId(target) ? `${entry.state.name} Aim` : entry.state.name;
  }

  return "Cave";
}

function getDebugTargetObject(target) {
  if (target === "cave") {
    return caveRoot;
  }

  if (target === "camera") {
    return debugState.mode === "rotate" ? shotCameraRotationProxy : layoutCamera;
  }

  if (target === "focus") {
    return cameraTarget;
  }

  if (target === "sculpture") {
    return sculptureRoot;
  }

  if (target === "fog") {
    return fogVolume.mesh;
  }

  if (isLightTargetId(target) || isLightAimTargetId(target)) {
    const entry = getLightEntryById(getLightIdFromTarget(target));
    if (!entry) {
      return caveRoot;
    }

    if (isLightAimTargetId(target)) {
      return entry.targetObject ?? entry.light;
    }

    if (debugState.mode === "rotate" && entry.rotationProxy) {
      return entry.rotationProxy;
    }

    return entry.light;
  }

  return caveRoot;
}

function printDebugPositions() {
  const output = JSON.stringify(
    {
      cave: {
        position: roundArray(caveRoot.position.toArray()),
        rotation: roundArray(caveRoot.rotation.toArray().slice(0, 3)),
      },
      focus: {
        position: roundArray(cameraTarget.position.toArray()),
      },
      shotCamera: {
        position: roundArray(layoutCamera.position.toArray()),
        rotation: roundArray(layoutCamera.rotation.toArray().slice(0, 3)),
        target: roundArray(cameraTarget.position.toArray()),
        focalLength: roundValue(shotCameraState.focalLength),
        zoom: roundValue(shotCameraState.zoom),
        focusDistance: roundValue(shotCameraState.focusDistance),
        aperture: roundValue(shotCameraState.aperture),
        maxBlur: roundValue(shotCameraState.maxBlur),
      },
      lights: lightEntries.map((entry) => ({
        id: entry.state.id,
        name: entry.state.name,
        type: entry.state.type,
        color: entry.state.color,
        intensity: roundValue(entry.light.intensity),
        visible: entry.light.visible,
        castShadow: entry.light.castShadow,
        position: roundArray(entry.light.position.toArray()),
        rotation: roundArray((entry.rotationProxy ?? entry.light).rotation.toArray().slice(0, 3)),
        target: entry.targetObject ? roundArray(entry.targetObject.position.toArray()) : null,
        distance: "distance" in entry.light ? roundValue(entry.light.distance) : null,
        decay: "decay" in entry.light ? roundValue(entry.light.decay) : null,
        angle: entry.light.isSpotLight ? roundValue(entry.light.angle) : null,
        penumbra: entry.light.isSpotLight ? roundValue(entry.light.penumbra) : null,
      })),
      sculpture: {
        position: roundArray(sculptureRoot.position.toArray()),
        rotation: roundArray(sculptureRoot.rotation.toArray().slice(0, 3)),
        scale: roundValue(sculptureRoot.scale.x),
      },
      fog: {
        position: roundArray(fogVolume.mesh.position.toArray()),
      },
      look: serializeLookState(sceneState),
      camera: {
        position: roundArray(camera.position.toArray()),
        target: roundArray(orbitControls.target.toArray()),
      },
    },
    null,
    2,
  );

  debugUi.setOutput(output);
  return output;
}

async function copyDebugOutput(text) {
  if (!text) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (_error) {
    return false;
  }
}

function handleResize() {
  const cssW = canvas.clientWidth;
  const cssH = canvas.clientHeight;
  if (!cssW || !cssH) return;

  camera.aspect = cssW / cssH;
  camera.updateProjectionMatrix();
  layoutCamera.aspect = cssW / cssH;
  layoutCamera.updateProjectionMatrix();

  const dpr = Math.min(window.devicePixelRatio, MAX_DPR);
  const bufW = Math.round(cssW * dpr);
  const bufH = Math.round(cssH * dpr);
  renderer.setSize(bufW, bufH, false);
  composer.setSize(bufW, bufH);
  syncDebugPreviewSize();
}

function applyOrbitControlState(debugEnabled) {
  orbitControls.minDistance = debugEnabled ? DEBUG_ORBIT_LIMITS.minDistance : DEFAULT_ORBIT_LIMITS.minDistance;
  orbitControls.maxDistance = debugEnabled ? DEBUG_ORBIT_LIMITS.maxDistance : DEFAULT_ORBIT_LIMITS.maxDistance;
  orbitControls.enablePan = true;
  orbitControls.screenSpacePanning = true;
}

function syncOrbitControlsEnabled() {
  orbitControls.enabled =
    debugState.enabled && !debugState.dragging && viewState.mode === "global" && scoutState.mode !== "freeform";
}

function syncGlobalCameraFromShot() {
  camera.position.fromArray(scoutCameraState.position);
  camera.up.set(0, 1, 0);
  orbitControls.target.fromArray(scoutCameraState.target);
  orbitControls.update();
  updateScoutPivotLabel("Shot Focus");
}

function syncShotCameraRotationProxyFromShot() {
  shotCameraRotationProxy.position.copy(layoutCamera.position);
  shotCameraRotationProxy.quaternion.copy(layoutCamera.quaternion);
  shotCameraRotationProxy.updateMatrixWorld();
}

function syncShotCameraTargetFromRotationProxy() {
  const distance = Math.max(layoutCamera.position.distanceTo(cameraTarget.position), 0.25);
  const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(shotCameraRotationProxy.quaternion).normalize();
  cameraTarget.position.copy(layoutCamera.position).addScaledVector(direction, distance);
}

function syncShotCameraStateFromTarget(target) {
  if (target === "camera") {
    if (debugState.mode === "rotate") {
      syncShotCameraTargetFromRotationProxy();
    } else {
      syncShotCameraRotationProxyFromShot();
    }
    return;
  }

  if (target === "focus") {
    syncShotCameraRotationProxyFromShot();
  }
}

function getMainViewportCamera() {
  return viewState.mode === "camera" ? layoutCamera : camera;
}

function handleKeydown(event) {
  if (!debugState.enabled) {
    return;
  }

  if (event.code === "KeyG") {
    setDebugTransformMode("translate");
  }

  if (event.code === "KeyR" && canRotateDebugTarget(debugState.target)) {
    setDebugTransformMode("rotate");
  }

  if (event.code === "KeyS") {
    setDebugTransformMode("scale");
  }
}

function render(now = 0) {
  requestAnimationFrame(render);

  const time = now * 0.001;
  updateDustCloud(dust, time);
  syncLayoutCamera();
  syncDebugMarkers();

  orbitControls.update();
  scoutCameraState.position = camera.position.toArray();
  scoutCameraState.target = orbitControls.target.toArray();
  const activeViewportCamera = getMainViewportCamera();
  syncDebugLighting(activeViewportCamera);
  applyLightingRig(debugState.enabled ? lightingState.mode : "production");
  applyFogMode(debugState.enabled && viewState.mode === "global" ? "studio" : "production");
  applyShellMode(debugState.enabled ? shellState.mode : "solid");
  mainRenderPass.camera = activeViewportCamera;
  mainBokehPass.enabled = activeViewportCamera === layoutCamera && shouldEnableShotDof();
  syncBokehPass(mainBokehPass, layoutCamera);
  transformControls.camera = activeViewportCamera;

  applyLightBreathing(time);
  applySculptureHeadRotation();
  fogVolume.update(time);
  composer.render();
  renderDebugPreview();
}

function syncLookTargets() {
  chamberAnchor.getWorldPosition(chamberAim.position);
}

function setDebugShotVisibility(visible) {
  debugShotCameraHandle.visible = visible;
  debugShotFocusHandle.visible = visible;
  debugShotLine.visible = visible;
  layoutCameraHelper.visible = visible;
}

function updateDebugShotVisuals() {
  layoutCamera.lookAt(cameraTarget.position);
  layoutCamera.updateMatrixWorld();
  syncShotCameraRotationProxyFromShot();
  layoutCameraHelper.update();

  const positions = debugShotLine.geometry.attributes.position.array;
  positions[0] = layoutCamera.position.x;
  positions[1] = layoutCamera.position.y;
  positions[2] = layoutCamera.position.z;
  positions[3] = cameraTarget.position.x;
  positions[4] = cameraTarget.position.y;
  positions[5] = cameraTarget.position.z;
  debugShotLine.geometry.attributes.position.needsUpdate = true;
  debugShotLine.geometry.computeBoundingSphere();
}

function syncDebugPreviewCamera() {
  debugPreviewCamera.position.copy(layoutCamera.position);
  debugPreviewCamera.quaternion.copy(layoutCamera.quaternion);
  debugPreviewCamera.up.copy(layoutCamera.up);
  debugPreviewCamera.fov = layoutCamera.fov;
  debugPreviewCamera.zoom = layoutCamera.zoom;
  debugPreviewCamera.near = layoutCamera.near;
  debugPreviewCamera.far = layoutCamera.far;
  debugPreviewCamera.focus = layoutCamera.focus;
  debugPreviewCamera.filmGauge = layoutCamera.filmGauge;
  debugPreviewCamera.filmOffset = layoutCamera.filmOffset;
  debugPreviewCamera.updateProjectionMatrix();
  debugPreviewCamera.updateMatrixWorld();
}

function syncLayoutCamera() {
  updateDebugShotVisuals();
}

function syncDebugMarkers() {
  for (const entry of lightEntries) {
    const isLightSelected = debugState.target === `${LIGHT_TARGET_PREFIX}${entry.state.id}`;
    const isAimSelected = debugState.target === `${LIGHT_AIM_PREFIX}${entry.state.id}`;
    const shouldShowAim = debugState.enabled && Boolean(entry.targetObject) && (isLightSelected || isAimSelected);

    entry.marker.position.copy(entry.light.position);
    entry.marker.material.color.copy(entry.light.color);
    entry.marker.visible = debugState.enabled && isLightSelected;

    if (entry.targetMarker && entry.targetObject) {
      entry.targetMarker.position.copy(entry.targetObject.position);
      entry.targetMarker.visible = debugState.enabled && isAimSelected;
    }

    if (entry.targetObject) {
      const positions = entry.aimLine.geometry.attributes.position.array;
      positions[0] = entry.light.position.x;
      positions[1] = entry.light.position.y;
      positions[2] = entry.light.position.z;
      positions[3] = entry.targetObject.position.x;
      positions[4] = entry.targetObject.position.y;
      positions[5] = entry.targetObject.position.z;
      entry.aimLine.geometry.attributes.position.needsUpdate = true;
      entry.aimLine.geometry.computeBoundingSphere();
      entry.aimLine.material.color.copy(entry.light.color);
      entry.aimLine.visible = shouldShowAim;
    } else {
      entry.aimLine.visible = false;
    }

    if (entry.helper) {
      if (entry.helper.cone?.material?.color) {
        entry.helper.cone.material.color.copy(entry.light.color);
      }
      if (entry.helper.lightPlane?.material?.color) {
        entry.helper.lightPlane.material.color.copy(entry.light.color);
      }
      if (entry.helper.targetLine?.material?.color) {
        entry.helper.targetLine.material.color.copy(entry.light.color);
      }
      entry.helper.visible = shouldShowAim;
      entry.helper.update?.();
    }
  }
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
  object.position.z -= center.z;
  object.position.y -= scaledBounds.min.y;
  object.updateMatrixWorld(true);
}

function createDustCloud(count = 140) {
  const positions = new Float32Array(count * 3);
  const basePositions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const speeds = new Float32Array(count);

  for (let index = 0; index < count; index += 1) {
    const offset = index * 3;
    const x = THREE.MathUtils.randFloatSpread(5.2);
    const y = Math.random() * 2.8 + 0.15;
    const z = THREE.MathUtils.randFloatSpread(4.8);

    positions[offset] = x;
    positions[offset + 1] = y;
    positions[offset + 2] = z;

    basePositions[offset] = x;
    basePositions[offset + 1] = y;
    basePositions[offset + 2] = z;

    phases[index] = Math.random() * Math.PI * 2;
    speeds[index] = THREE.MathUtils.randFloat(0.2, 0.7);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    map: createRadialSpriteTexture({
      innerColor: "rgba(255,255,255,0.95)",
      middleColor: "rgba(214,194,165,0.14)",
      outerColor: "rgba(214,194,165,0)",
    }),
    color: "#d7c8b4",
    size: 0.07,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.08,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  return { points, basePositions, phases, speeds };
}

function updateDustCloud(dustCloud, time) {
  const positions = dustCloud.points.geometry.attributes.position.array;

  for (let index = 0; index < dustCloud.phases.length; index += 1) {
    const offset = index * 3;
    const drift = time * dustCloud.speeds[index] + dustCloud.phases[index];

    positions[offset] = dustCloud.basePositions[offset] + Math.cos(drift) * 0.05;
    positions[offset + 1] = dustCloud.basePositions[offset + 1] + Math.sin(drift * 0.8) * 0.08;
    positions[offset + 2] = dustCloud.basePositions[offset + 2] + Math.sin(drift * 0.65) * 0.05;
  }

  dustCloud.points.geometry.attributes.position.needsUpdate = true;
  dustCloud.points.rotation.y = time * 0.025;
}

function createDebugHandle(geometry, color) {
  const handle = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({
      color,
      depthTest: false,
      transparent: true,
      opacity: 0.92,
    }),
  );
  handle.renderOrder = 20;
  return handle;
}

function setDebugHelperDepth(helper) {
  helper.traverse((child) => {
    if (!child.material) {
      return;
    }

    const materials = Array.isArray(child.material) ? child.material : [child.material];

    for (const material of materials) {
      material.depthTest = false;
      material.transparent = true;
      material.opacity = 0.82;
    }
  });
}

function createDebugMarker(color, radius = 0.045) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(radius, 14, 14),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
    }),
  );
}

function applyShadowMapSize(light, size) {
  if (!light.shadow) {
    return;
  }

  if (light.shadow.mapSize.x === size && light.shadow.mapSize.y === size) {
    return;
  }

  light.shadow.mapSize.set(size, size);
  light.shadow.map?.dispose?.();
  light.shadow.map = null;
}

function capitalizeWord(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function roundValue(value) {
  return Number(value.toFixed(3));
}

function roundArray(values) {
  return values.map((value) => Number(value.toFixed(3)));
}

function serializeLookState(state) {
  return Object.fromEntries(
    Object.entries(state).map(([key, value]) => [key, typeof value === "number" ? roundValue(value) : value]),
  );
}

function loadAsset(loader, url) {
  return new Promise((resolve, reject) => {
    loader.load(url, resolve, undefined, reject);
  });
}

function loadPbrTextureSet(loader, label, activeRenderer) {
  const textures = {
    map: loader.load(`${BASE}pbr/iceCave_${label}_BaseColor.png`),
    bumpMap: loader.load(`${BASE}pbr/iceCave_${label}_Height.png`),
    metalnessMap: loader.load(`${BASE}pbr/iceCave_${label}_Metallic.png`),
    normalMap: loader.load(`${BASE}pbr/iceCave_${label}_Normal.png`),
    roughnessMap: loader.load(`${BASE}pbr/iceCave_${label}_Roughness.png`),
  };

  textures.map.colorSpace = THREE.SRGBColorSpace;

  const anisotropy = Math.min(activeRenderer.capabilities.getMaxAnisotropy(), isMobile ? 4 : 8);

  for (const texture of Object.values(textures)) {
    texture.anisotropy = anisotropy;
  }

  return textures;
}

function ensureDebugPreviewRenderer() {
  if (debugPreviewRenderer) {
    return;
  }

  debugPreviewRenderer = new THREE.WebGLRenderer({
    canvas: debugUi.getPreviewCanvas(),
    antialias: true,
    alpha: false,
  });
  debugPreviewRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  debugPreviewRenderer.outputColorSpace = renderer.outputColorSpace;
  debugPreviewRenderer.toneMapping = renderer.toneMapping;
  debugPreviewRenderer.shadowMap.enabled = renderer.shadowMap.enabled;
  debugPreviewRenderer.shadowMap.type = renderer.shadowMap.type;
  debugPreviewRenderer.setClearColor(sceneState.backgroundColor, 1);

  debugPreviewComposer = new EffectComposer(debugPreviewRenderer);
  debugPreviewRenderPass = new RenderPass(scene, debugPreviewCamera);
  debugPreviewComposer.addPass(debugPreviewRenderPass);

  debugPreviewBokehPass = new BokehPass(scene, debugPreviewCamera, {
    focus: shotCameraState.focusDistance,
    aperture: 0,
    maxblur: shotCameraState.maxBlur,
  });
  debugPreviewBokehPass.enabled = false;
  debugPreviewComposer.addPass(debugPreviewBokehPass);

  debugPreviewBloomPass = new UnrealBloomPass(
    new THREE.Vector2(1, 1),
    sceneState.bloomStrength,
    sceneState.bloomRadius,
    sceneState.bloomThreshold,
  );
  debugPreviewComposer.addPass(debugPreviewBloomPass);

  debugPreviewGradePass = new ShaderPass(CinematicGradeShader);
  debugPreviewComposer.addPass(debugPreviewGradePass);
  debugPreviewComposer.addPass(new OutputPass());

  syncDebugPreviewSize();
  syncBokehPass(debugPreviewBokehPass, debugPreviewCamera);
}

function syncDebugPreviewSize() {
  if (!debugPreviewRenderer) {
    return;
  }

  const canvas = debugUi.getPreviewCanvas();
  const width = Math.max(240, Math.round(canvas.clientWidth || 280));
  const height = Math.max(135, Math.round(canvas.clientHeight || width * (9 / 16)));

  if (width === debugPreviewSize.width && height === debugPreviewSize.height) {
    return;
  }

  debugPreviewSize = { width, height };
  debugPreviewRenderer.setSize(width, height, false);
  debugPreviewComposer?.setSize(width, height);
  debugPreviewCamera.aspect = width / height;
  debugPreviewCamera.updateProjectionMatrix();
}

let debugPreviewLastTime = 0;
function renderDebugPreview() {
  if (!debugState.enabled || !debugPreviewRenderer || !debugPreviewComposer || !debugPreviewRenderPass) {
    return;
  }

  // Throttle preview to ~15fps
  const now = performance.now();
  if (now - debugPreviewLastTime < 66) return;
  debugPreviewLastTime = now;

  syncDebugPreviewSize();
  debugPreviewRenderer.toneMappingExposure = renderer.toneMappingExposure;
  updateDebugShotVisuals();
  syncDebugPreviewCamera();
  syncBokehPass(debugPreviewBokehPass, debugPreviewCamera);
  debugPreviewBokehPass.enabled = shouldEnableShotDof();

  const visibilityState = {
    debugMarkerRoot: debugMarkerRoot.visible,
    transformControlsHelper: transformControlsHelper.visible,
    layoutCameraHelper: layoutCameraHelper.visible,
    debugShotLine: debugShotLine.visible,
    debugShotCameraHandle: debugShotCameraHandle.visible,
    debugShotFocusHandle: debugShotFocusHandle.visible,
  };

  debugMarkerRoot.visible = false;
  transformControlsHelper.visible = false;
  layoutCameraHelper.visible = false;
  debugShotLine.visible = false;
  debugShotCameraHandle.visible = false;
  debugShotFocusHandle.visible = false;

  applyLightingRig("production");
  applyFogMode("production");
  applyShellMode("solid");
  debugPreviewRenderPass.camera = debugPreviewCamera;
  debugPreviewComposer.render();
  applyLightingRig(lightingState.mode);
  applyFogMode(debugState.enabled && viewState.mode === "global" ? "studio" : "production");
  applyShellMode(shellState.mode);

  debugMarkerRoot.visible = visibilityState.debugMarkerRoot;
  transformControlsHelper.visible = visibilityState.transformControlsHelper;
  layoutCameraHelper.visible = visibilityState.layoutCameraHelper;
  debugShotLine.visible = visibilityState.debugShotLine;
  debugShotCameraHandle.visible = visibilityState.debugShotCameraHandle;
  debugShotFocusHandle.visible = visibilityState.debugShotFocusHandle;
}

if (import.meta.env.DEV) {
  window.__BRANCUSI__ = {
    camera,
    layoutCamera,
    orbitControls,
    caveRoot,
    chamberAnchor,
    cameraTarget,
    lightEntries,
    shotCameraState,
    applySceneState,
    sceneState,
  };
}
