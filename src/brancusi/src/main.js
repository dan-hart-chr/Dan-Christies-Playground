import "./style.css";
import { createShowcaseUi } from "./showcaseUi.js";
import { createShowcaseAudio, getAnalyticsLanguageCode } from "./showcaseAudio.js";

const BASE = import.meta.env.BASE_URL;
const IMAGE_SEQUENCE_URLS = [
  "brancusi-1.webp",
  "brancusi-2.webp",
  "brancusi-3.webp",
  "brancusi-4.webp",
  "brancusi-5.webp",
  "brancusi-6.webp",
  "brancusi-7.webp",
  "brancusi-8.webp",
].map((fileName) => `${BASE}brancusi-sequence/${fileName}`);

const MODEL_VIEW = {
  title: "Model View",
  meta: "Single Object",
  body: "A focused view of Constantin Brancusi's Danaide.",
};

function clampValue(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

const app = document.querySelector("#app");
const viewport = document.createElement("div");
viewport.className = "app-viewport";
app.append(viewport);

const imageSequenceViewer = document.createElement("div");
imageSequenceViewer.className = "image-sequence-viewer";
const imageSequenceImage = document.createElement("img");
imageSequenceImage.className = "image-sequence-image";
imageSequenceImage.alt = "Constantin Brancusi, Danaïde";
imageSequenceImage.decoding = "async";
imageSequenceImage.draggable = false;
imageSequenceViewer.append(imageSequenceImage);
viewport.append(imageSequenceViewer);

let imageSequenceFrame = 0;
let imageSequenceTarget = 0;
let touchStartY = 0;
let touchStartTarget = 0;
let isTouching = false;

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

window.addEventListener("wheel", handleWheel, { passive: true });
window.addEventListener("touchstart", handleTouchStart, { passive: true });
window.addEventListener("touchmove", handleTouchMove, { passive: true });
window.addEventListener("touchend", handleTouchEnd, { passive: true });
window.addEventListener("touchcancel", handleTouchEnd, { passive: true });

initImageExperience();

function initImageExperience() {
  showcaseUi.setStatus("Loading images.");
  setImageSequenceFrame(0);
  void preloadImageSequence();

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
}

function preloadImageSequence() {
  let loaded = 0;

  return Promise.allSettled(
    IMAGE_SEQUENCE_URLS.map((url) =>
      new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
          loaded += 1;
          showcaseUi.setProgress(loaded / IMAGE_SEQUENCE_URLS.length);
          resolve(image);
        };
        image.onerror = reject;
        image.src = url;
      }),
    ),
  ).then((results) => {
    const failed = results.filter((result) => result.status === "rejected");
    if (failed.length) {
      console.warn(`${failed.length} Brancusi image sequence asset(s) failed to preload.`, failed);
    }
    showcaseUi.setProgress(1);
  });
}

function setImageSequenceFrame(nextFrame) {
  const clampedFrame = clampValue(Math.round(nextFrame), 0, IMAGE_SEQUENCE_URLS.length - 1);
  if (clampedFrame === imageSequenceFrame && imageSequenceImage.src) return;
  imageSequenceFrame = clampedFrame;
  imageSequenceImage.src = IMAGE_SEQUENCE_URLS[imageSequenceFrame];
}

function setImageSequenceTarget(nextTarget) {
  imageSequenceTarget = clampValue(nextTarget, 0, IMAGE_SEQUENCE_URLS.length - 1);
  setImageSequenceFrame(imageSequenceTarget);
}

function handleWheel(event) {
  if (!app.classList.contains("is-revealing-experience")) return;
  if (event.ctrlKey || event.metaKey) return;
  setImageSequenceTarget(imageSequenceTarget + event.deltaY * 0.006);
}

function handleTouchStart(event) {
  if (!app.classList.contains("is-revealing-experience")) return;
  const touch = event.touches[0];
  if (!touch) return;
  isTouching = true;
  touchStartY = touch.clientY;
  touchStartTarget = imageSequenceTarget;
}

function handleTouchMove(event) {
  if (!isTouching) return;
  const touch = event.touches[0];
  if (!touch) return;
  const deltaY = touchStartY - touch.clientY;
  setImageSequenceTarget(touchStartTarget + deltaY * 0.018);
}

function handleTouchEnd() {
  isTouching = false;
}
