const BASE = import.meta.env.BASE_URL;

import { LANGUAGES, getAnalyticsLanguageCode } from "./showcaseAudio.js";

/* ── SVG icon factories ────────────────────────────────────────────────────── */

function createSvgIcon(svgMarkup) {
  const template = document.createElement("template");
  template.innerHTML = svgMarkup.trim();
  return () => template.content.firstChild.cloneNode(true);
}

/** Create an <img> element pointing to a public SVG file */
function makeImgIcon(src) {
  return () => {
    const img = document.createElement("img");
    img.src = src;
    img.alt = "";
    img.width = 16;
    img.height = 16;
    img.className = "pill-svg-icon";
    return img;
  };
}

// Icons from public folder SVGs
const makeGlobeIcon = makeImgIcon(`${BASE}languageicon.svg`);
const makeTranscriptIcon = makeImgIcon(`${BASE}transcripticon.svg`);
const makeSoundOnIcon = makeImgIcon(`${BASE}audioicon.svg`);

// Sound-off: still inline since there's no separate muted SVG in public
const makeSoundOffIcon = createSvgIcon(`<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M3 6h2l3-3v10L5 10H3a1 1 0 01-1-1V7a1 1 0 011-1z" fill="currentColor"/>
  <line x1="10" y1="6" x2="14" y2="10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
  <line x1="14" y1="6" x2="10" y2="10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
</svg>`);

const makeInfoIcon = createSvgIcon(`<svg width="2" height="12" viewBox="0 0 2 12" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="1" cy="1" r="1" fill="currentColor"/>
  <rect x="0" y="4" width="2" height="8" rx="0.5" fill="currentColor"/>
</svg>`);

const makeCloseIcon = createSvgIcon(`<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
  <line x1="2" y1="2" x2="13" y2="13" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
  <line x1="13" y1="2" x2="2" y2="13" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
</svg>`);

const makeScrollIcon = createSvgIcon(`<svg width="24" height="38" viewBox="0 0 24 38" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="1" y="1" width="22" height="36" rx="11" stroke="currentColor" stroke-width="1.5"/>
  <circle cx="12" cy="10" r="2" fill="currentColor"/>
</svg>`);

const SHOW_LANGUAGE_SELECTION = true;

/* ── Helper ───────────────────────────────────────────────────────────────── */

function el(tag, className, attrs) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "text") node.textContent = v;
      else node.setAttribute(k, v);
    }
  }
  return node;
}

/* ── Main UI factory ──────────────────────────────────────────────────────── */

// ── Localized UI strings ─────────────────────────────────────────────────────
// Artist name is a proper noun and stays the same; everything else that
// the user sees in the chrome needs a per-language version.
const ARTIST_NAME = "Constantin Brancusi";
const ARTIST_DATES = "(1876–1957)";

const UI_TEXTS = {
  english: {
    artworkTitle: "Danaïde, Conceived and cast circa 1913",
    viewTranscript: "VIEW TRANSCRIPT",
    transcriptShort: "TRANSCRIPT",
    detailsBid: "DETAILS & BIDDING",
    continueLabel: "CONTINUE",
  },
  german: {
    artworkTitle: "Danaïde, konzipiert und gegossen circa 1913",
    viewTranscript: "TRANSKRIPT ANZEIGEN",
    transcriptShort: "TRANSKRIPT",
    detailsBid: "DETAILS & BIETEN",
    continueLabel: "WEITER",
  },
  spanish: {
    artworkTitle: "Danaïde, concebida y fundida circa 1913",
    viewTranscript: "VER TRANSCRIPCIÓN",
    transcriptShort: "TRANSCRIPCIÓN",
    detailsBid: "DETALLES Y PUJA",
    continueLabel: "CONTINUAR",
  },
  french: {
    artworkTitle: "Danaïde, conçue et fondue circa 1913",
    viewTranscript: "VOIR LA TRANSCRIPTION",
    transcriptShort: "TRANSCRIPTION",
    detailsBid: "DÉTAILS ET ENCHÈRES",
    continueLabel: "CONTINUER",
  },
};

function renderArtworkTitle(target, text) {
  target.textContent = "";
  const marker = "circa";
  const index = text.indexOf(marker);

  if (index === -1) {
    target.textContent = text;
    return;
  }

  target.append(
    document.createTextNode(text.slice(0, index)),
    el("em", null, { text: marker }),
    document.createTextNode(text.slice(index + marker.length)),
  );
}

export function createShowcaseUi(container, sceneInfo, { appRoot, onLanguageChange, onMuteToggle } = {}) {

  const root = appRoot || container; // root = #app, container = .app-viewport

  let activeModal = null;   // null | "info" | "transcript" | "language"
  let soundMuted = false;
  let activeLanguageId = "english";

  // ── Artwork info (top-left) ──────────────────────────────────────────
  const artworkInfo = el("div", "artwork-info");
  const christiesLogo = el("span", "christies-logo");
  christiesLogo.setAttribute("aria-label", "Christie\u2019s");
  christiesLogo.style.setProperty("--christies-logo-url", `url("${BASE}Logo.svg")`);

  // Artist name + dates on separate lines; dates span is nowrap so the
  // "(1876–1957)" never splits across a line break.
  const artistName = el("h1", "artwork-artist");
  const artistNameText = el("span", "artwork-artist-name", { text: ARTIST_NAME });
  const artistDates = el("span", "artwork-artist-dates", { text: ARTIST_DATES });
  artistName.append(artistNameText, document.createElement("br"), artistDates);

  const artworkTitle = el("p", "artwork-title");
  renderArtworkTitle(artworkTitle, UI_TEXTS.english.artworkTitle);

  artworkInfo.append(christiesLogo, artistName, artworkTitle);

  // ── Bottom toolbar ───────────────────────────────────────────────────
  const bottomBar = el("div", "bottom-bar");

  // Info button (left)
  const infoBtn = el("button", "pill-button pill-icon-only bottom-info-btn", { type: "button" });
  infoBtn.append(makeInfoIcon());
  infoBtn.setAttribute("aria-label", "Info");
  infoBtn.setAttribute("data-analytics", "infoButton");

  // Center group
  const centerGroup = el("div", "bottom-center");

  // Language button
  const langBtn = el("button", "pill-button pill-with-icon lang-btn", { type: "button" });
  const langBtnIcon = el("span", "pill-icon");
  langBtnIcon.append(makeGlobeIcon());
  const langBtnText = el("span", "pill-text", { text: "ENGLISH" });
  langBtn.append(langBtnIcon, langBtnText);
  langBtn.setAttribute("aria-label", "Language");
  langBtn.setAttribute("data-analytics", "changeLanguageButton:en");

  // Transcript button
  const transcriptBtn = el("button", "pill-button pill-with-icon transcript-btn", { type: "button" });
  const transcriptBtnIcon = el("span", "pill-icon");
  transcriptBtnIcon.append(makeTranscriptIcon());
  const transcriptBtnText = el("span", "pill-text", { text: "VIEW TRANSCRIPT" });
  transcriptBtn.append(transcriptBtnIcon, transcriptBtnText);
  transcriptBtn.setAttribute("aria-label", "View transcript");
  transcriptBtn.setAttribute("data-analytics", "viewTranscriptButton:en");

  // Details & bid button
  const detailsBidBtn = el("a", "pill-button details-bid-btn", {
    href: "https://www.christies.com/lot/constantin-brancusi-1876–1957--6585085",
  });
  const detailsBidBtnText = el("span", "pill-text", { text: "DETAILS & BID" });
  detailsBidBtn.append(detailsBidBtnText);
  detailsBidBtn.setAttribute("aria-label", "Details and bid");
  detailsBidBtn.setAttribute("data-analytics", "christies:footerLink");

  centerGroup.append(langBtn, transcriptBtn, detailsBidBtn);

  // Sound button (right)
  const soundBtn = el("button", "pill-button pill-icon-only bottom-sound-btn", { type: "button" });
  soundBtn.append(makeSoundOnIcon());
  soundBtn.setAttribute("aria-label", "Toggle sound");
  soundBtn.setAttribute("data-analytics", "muteButton");

  bottomBar.append(infoBtn, centerGroup, soundBtn);

  // ── Footer ───────────────────────────────────────────────────────────
  const footer = el("footer", "site-footer");

  const footerNav = el("nav", "footer-nav");
  const footerItems = [
    { kind: "link", label: "HOME", href: "https://www.christies.com/en" },
    { kind: "link", label: "VIEW COLLECTION", href: "https://www.christies.com/en/auction/masterpieces-the-private-collection-of-s-i-newhouse-31380/" },
    { kind: "cookie" },
    { kind: "link", label: "VIEW POLLOCK'S NUMBER 7A, 1948", href: "https://experience.christies.com/pollock/index.html" },
  ];
  footerItems.forEach((item, i) => {
    if (i > 0) {
      const divider = el("span", "footer-divider", { text: "|" });
      footerNav.append(divider);
    }

    if (item.kind === "cookie") {
      const footerCookieWrap = el("div", "footer-cookie-wrap");
      const cookieSettingsBtn = el("button", "footer-cookie-button ot-sdk-show-settings", { id: "ot-sdk-btn", type: "button", text: "Cookie settings" });
      footerCookieWrap.append(cookieSettingsBtn);
      footerNav.append(footerCookieWrap);
      return;
    }

    const link = el("a", "footer-link", { text: item.label, href: item.href });
    footerNav.append(link);
  });

  const footerCopy = el("span", "footer-copy", { text: "\u00A9 CHRISTIE\u2019S 2026" });
  footer.append(footerNav, footerCopy);

  // ── Overlay backdrop ─────────────────────────────────────────────────
  const overlay = el("div", "modal-overlay");

  // ── Instruction (info) modal translations ────────────────────────────
  const INSTRUCTION_TEXTS = {
    english:
      "Scroll to explore Brancusi’s Danaïde from every angle in 3D.",
    german:
      "Scrollen Sie, um Brancusis Danaïde aus jedem Winkel in 3D zu erkunden.",
    spanish:
      "Desplázate para explorar la Danaïde de Brancusi en 3D desde todos los ángulos.",
    french:
      "Faites défiler pour explorer la Danaïde de Brancusi sous tous les angles en 3D.",
  };

  // ── Info modal ───────────────────────────────────────────────────────
  const infoModal = el("div", "modal-card info-modal");
  const infoClose = el("button", "modal-close", { type: "button" });
  infoClose.append(makeCloseIcon());
  infoClose.setAttribute("data-analytics", "glassPanelCloseButton");
  const infoBody = el("div", "modal-body info-modal-body");
  const scrollIconWrap = el("div", "info-scroll-icon");
  scrollIconWrap.append(makeScrollIcon());
  const infoText = el("p", "info-modal-text", {
    text: INSTRUCTION_TEXTS.english,
  });
  const continueBtn = el("button", "info-continue-btn", { type: "button", text: "CONTINUE" });
  continueBtn.setAttribute("data-analytics", "splashContinue");
  infoBody.append(scrollIconWrap, infoText);
  infoModal.append(infoClose, infoBody);

  function renderInstructionsText(langId) {
    infoText.textContent = INSTRUCTION_TEXTS[langId] || INSTRUCTION_TEXTS.english;
  }

  // ── Transcript texts per language ────────────────────────────────────
  const TRANSCRIPT_TEXTS = {
    english: [
      "Radiant in its materiality and radical in its formal refinement, Constantin Brancusi\u2019s Dana\u00efde is an icon of modern art. Through his own powerful vision, Brancusi transformed the female face into an abstracted assortment of harmonious forms, forever changing the course of sculpture in the twentieth century.",
      "Here, the head of Margit Pogany, an art student that the artist met in 1910, is reimagined as continuum of graceful curves. Sweeping planar arcs denote her gaze and large eyes, while from behind, her neat bun forms a spiral, a serpentine lock of hair tucked just behind her ear. Physiognomic detail is distilled to the most elemental and pure forms in Brancusi\u2019s quest for harmony. \u201CIt is not the outward form which is real, it is the essence of things,\u201D he once stated. \u201COn this basis, it is impossible for anyone to express anything real by imitating surface appearances.\u201D",
      "Brancusi was a master of his material. First executed in marble, Brancusi transformed this motif into bronze in around 1913, creating six casts of Dana\u00efde. In the early casts, he used gilding to achieve his artistic aims, a technique rarely seen in his practice, the finish as important as the subject itself. \u201CEach material has a particular language that I do not set out to eliminate and replace with my own,\u201D Brancusi explained, \u201Cbut simply to make it express what I am thinking, what I am seeing, in its own language, that is its alone.\u201D",
      "The gilded surface conjures endless reflections of light, while at the same time, the figure appears to glow from within, as if an ancient goddess or icon from a past epoch. Together with the luminous gilding, the dark patina of her hair evokes the ancient art of East Asia. In his assimilation of an individual presence from his own time, with a look to the appearance and meaning of artworks of the past, Brancusi created an entirely unique sculptural language and a new form of femininity.",
    ],
    german: [
      "Strahlend in ihrer Materialität und radikal in ihrer raffinirten Formensprache ist Constantin Brancusis Danaïde eine Ikone der modernen Kunst. Brancusis schöpferische Vorstellungskraft verwandelte das Frauenbildnis in eine abstrahierte Anordnung harmonischer Formen und veränderte damit für immer die Geschichte der Bildhauerei im 20. Jahrhundert.",
      "Der Kopf Margit Poganys, einer Kunststudentin, die der Künstler 1910 kennenlernte, wird hier als ein Kontinuum anmutiger Kurven neu interpretiert. Ihr Blick und ihre großen Augen werden durch schwungvolle, flächige Bögen angedeutet, während rückseitig ihr sorgfältiger Haarknoten eine Spirale bildet, eine lockige Haarsträhne hinter das Ohr gesteckt. Brancusis künstlerisches Streben nach Harmonie reduziert die Gesichtszüge auf die grundlegendsten und schlichtesten Formen. „Nicht die äußere Form ist real, sondern das Wesen der Dinge“, äußerte sich Brancusi einmal. „So gedacht ist es unmöglich, etwas Wahres auszudrücken, indem man die äußere Erscheinung nachahmt.“",
      "Brancusi war ein Meister seines Materials. Ursprünglich in Marmor ausgeführt, übertrug Brancusi das Motiv um 1913 in Bronze und schuf sechs Abgüsse der Danaïde. Die frühen Abgüsse vergoldete er, eine Technik der er sich selten bediente, wobei die Bearbeitung der Oberfläche ebenso wichtig war wie das Motiv selbst. „Jedes Material hat eine eigene Sprache, die ich nicht auslöschen und durch meine eigene ersetzen will“, erklärte Brancusi, „sondern lediglich dazu bringen möchte, das, was ich denke und sehe, in seiner Sprache auszudrücken, die ihm allein eigen ist.“",
      "Die vergoldete Oberfläche zaubert endlose Lichtreflexe hervor, während die Figur zugleich von innen heraus zu strahlen scheint, eine antike Göttin oder eine Ikone aus einem vergangenen Zeitalter anmutend. Die schimmernde Vergoldung im Kontrast mit der dunklen Patina ihres Haares erinnern an antike ostasiatische Kunst. Indem er sich eine zeitgenössische Figur künstlerisch aneignete, mit Blick auf Form und Bedeutung antiker Kunst, schuf Brancusi eine völlig einzigartige Bildsprache und eine neue Form der Weiblichkeit.",
    ],
    french: [
      "Rayonnante par sa matérialité et radicale dans son raffinement formel, Danaïde de Constantin Brancusi est une icône de l’art moderne. Grâce à sa vision puissante, Brancusi a transformé le visage féminin en un agencement abstrait de formes harmonieuses, modifiant ainsi à jamais l’histoire de la sculpture au XXe siècle.",
      "Ici, la tête de Margit Pogany, une étudiante en art que l’artiste a rencontrée en 1910, est réinterprétée comme un continuum de courbes gracieuses. Des arcs courbes et plats suggèrent son regard et ses grands yeux, tandis que, vu de dos, son chignon soigné forme une spirale, une mèche de cheveux ondulée, dissimulée juste derrière son oreille. Dans sa quête d’harmonie, Brancusi réduit les détails physionomiques aux formes les plus élémentaires et les plus pures. « Ce n’est pas la forme extérieure qui est réelle, mais l’essence des choses », a-t-il déclaré un jour. « Sur cette base, il est impossible d’exprimer quelque chose de réel en imitant des apparences superficielles. »",
      "Brancusi était un maître de son matériau. Initialement réalisé en marbre, Brancusi transposa ce motif en bronze vers 1913 et créa six fontes de Danaïde. Dans les premières fontes, il utilisa la dorure pour atteindre ses objectifs artistiques – une technique rare dans son œuvre, où le traitement de surface était tout aussi important que le motif lui-même. « Chaque matériau possède son propre langage, que je ne veux pas effacer pour le remplacer par le mien », expliquait Brancusi, « mais simplement amener à exprimer ce que je pense, ce que je vois dans son propre langage, qui lui est propre. »",
      "La surface dorée fait naître d’interminables reflets de lumière, tandis que la figure semble en même temps rayonner de l’intérieur, telle une déesse antique ou une icône d’une époque révolue. Associée à la dorure éclatante, la patine sombre de ses cheveux rappelle l’art antique d’Asie orientale. En fusionnant une présence individuelle de son époque avec l’apparence et la signification d’œuvres d’art du passé, Brancusi a créé un langage visuel tout à fait unique et une nouvelle forme de féminité.",
    ],
    spanish: [
      "Radiante en su materialidad y radical en su refinamiento formal, la obra de Constantin Brancusi es un icono del arte moderno. A través de su poderosa visión, Brancusi transformó el rostro femenino en un conjunto abstracto de formas armoniosas, cambiando para siempre el curso de la escultura en el siglo XX.",
      "Aquí, la cabeza de Margit Pogany, una estudiante de arte que el artista conoció en 1910, se reimagina como un continuo de elegantes curvas. Los amplios arcos planos aluden a su mirada y sus grandes ojos, mientras que, por detrás, su pulcro moño forma una espiral, un mechón serpenteante de cabello recogido justo detrás de la oreja. Los detalles fisonómicos se destilan hasta alcanzar las formas más elementales y puras en la búsqueda de armonía de Brancusi. «No es la forma exterior lo que es real, sino la esencia de las cosas», afirmó en una ocasión. «Partiendo de esta base, es imposible que alguien exprese algo real imitando las apariencias superficiales».",
      "Brancusi era un maestro en el uso del material. Realizada inicialmente en mármol, Brancusi transformó este motivo en bronce hacia 1913, creando seis fundiciones de Danaïde. En los primeros ejemplos, utilizó el dorado para alcanzar su objetivo artístico, una técnica poco habitual en su práctica, en la que el acabado era tan importante como el propio tema. «Cada material tiene un lenguaje particular que no pretendo eliminar y sustituir por el mío propio», explicaba Brancusi, «sino simplemente hacer que exprese lo que pienso, lo que veo, en su propio lenguaje, que es solo suyo».",
      "La superficie dorada evoca infinitos reflejos de luz, mientras que, al mismo tiempo, la figura parece brillar desde dentro, como si fuera una antigua diosa o un icono de una época pasada. Junto con el luminoso dorado, la pátina oscura de su cabello evoca el arte antiguo de Asia Oriental. Al asimilar una presencia individual de su propia época, con una mirada hacia la apariencia y el significado de las obras de arte del pasado, Brancusi creó un lenguaje escultórico totalmente único y una nueva forma de feminidad.",
    ],
  };

  // ── Transcript modal ─────────────────────────────────────────────────
  const transcriptModal = el("div", "modal-card transcript-modal");
  const transcriptClose = el("button", "modal-close", { type: "button" });
  transcriptClose.append(makeCloseIcon());
  transcriptClose.setAttribute("data-analytics", "glassPanelCloseButton");
  const transcriptBody = el("div", "modal-body transcript-modal-body");

  // Header inside the transcript modal — artist name (with dates on a
  // separate nowrap span) + translated artwork title.
  const transcriptHeader = el("div", "transcript-header");
  const transcriptHeaderArtist = el("h3", "transcript-header-artist");
  const transcriptHeaderArtistName = el("span", "transcript-header-artist-name", { text: ARTIST_NAME });
  const transcriptHeaderArtistDates = el("span", "transcript-header-artist-dates", { text: ARTIST_DATES });
  transcriptHeaderArtist.append(
    transcriptHeaderArtistName,
    document.createElement("br"),
    transcriptHeaderArtistDates,
  );
  const transcriptHeaderTitle = el("p", "transcript-header-title");
  renderArtworkTitle(transcriptHeaderTitle, UI_TEXTS.english.artworkTitle);
  transcriptHeader.append(transcriptHeaderArtist, transcriptHeaderTitle);

  const transcriptContent = el("div", "transcript-content");

  function renderTranscript(langId) {
    transcriptContent.textContent = "";
    const paragraphs = TRANSCRIPT_TEXTS[langId] || TRANSCRIPT_TEXTS.english;
    for (const text of paragraphs) {
      const p = el("p", null, { text });
      transcriptContent.append(p);
    }
  }
  renderTranscript("english");

  transcriptBody.append(transcriptHeader, transcriptContent);
  transcriptModal.append(transcriptClose, transcriptBody);

  // ── Language modal ───────────────────────────────────────────────────
  const langModal = el("div", "modal-card language-modal");
  const langClose = el("button", "modal-close", { type: "button" });
  langClose.append(makeCloseIcon());
  langClose.setAttribute("data-analytics", "glassPanelCloseButton");
  const langBody = el("div", "modal-body language-modal-body");

  const langOptions = new Map();
  for (const lang of LANGUAGES) {
    const item = el("button", "language-option" + (lang.id === "english" ? " is-active" : ""), {
      type: "button",
      text: lang.label.toUpperCase(),
    });
    item.setAttribute("data-analytics", `language:${getAnalyticsLanguageCode(lang.id)}`);
    item.addEventListener("click", () => {
      activeLanguageId = lang.id;
      onLanguageChange?.(lang.id);
      for (const [id, btn] of langOptions) {
        btn.classList.toggle("is-active", id === lang.id);
      }
      applyUiLanguage(lang.id);
      renderTranscript(lang.id);
      renderInstructionsText(lang.id);
      if (introFlow.active && introFlow.stage === "language") {
        introFlow.handleLanguagePicked(lang.id);
      }
    });
    langOptions.set(lang.id, item);
    langBody.append(item);
  }

  langModal.append(langClose, langBody);

  // ── Intro / loading screen ───────────────────────────────────────────
  const intro = el("section", "showcase-intro");
  intro.setAttribute("aria-label", "Loading experience");

  const introInner = el("div", "showcase-intro-inner");
  intro.append(introInner);

  const introTitle = el("h2", "showcase-intro-title", { text: "Brancusi" });
  introInner.append(introTitle);

  const progressTrack = el("div", "showcase-progress-track");
  introInner.append(progressTrack);

  const progressBar = el("div", "showcase-progress-bar");
  progressTrack.append(progressBar);

  // ── Intro flow state ────────────────────────────────────────────────
  // Stay on the dark intro screen, overlay language → instructions, then
  // fade the intro and fire the experience-start callback.
  const INTRO_LANGUAGE_DELAY_MS = 350;
  const INTRO_INSTRUCTIONS_AUTO_DISMISS_MS = 6000;
  const INTRO_FADE_DURATION_MS = 1200;

  const introFlow = {
    active: false,
    stage: "idle", // "idle" | "language" | "instructions" | "done"
    onLanguageSelected: null,
    onInstructionsDismissed: null,
    autoDismissTimer: null,
    handleLanguagePicked(langId) {
      if (this.stage !== "language") return;
      this.stage = "transitioning";
      this.onLanguageSelected?.(langId);
      closeModal();
      // Defer removing the intro class until after the modal's fade-out
      // finishes; otherwise the × flashes visible during the transition.
      window.setTimeout(() => langModal.classList.remove("is-intro-modal"), 320);
      setTimeout(() => {
        if (!this.active) return;
        this.stage = "instructions";
        // Add Continue button for the intro-only affordance
        if (!continueBtn.isConnected) infoModal.append(continueBtn);
        infoModal.classList.add("is-intro-instructions", "is-intro-modal");
        openModal("info");
        this.autoDismissTimer = window.setTimeout(() => {
          if (this.stage === "instructions") this.dismissInstructions();
        }, INTRO_INSTRUCTIONS_AUTO_DISMISS_MS);
      }, 380);
    },
    dismissInstructions() {
      if (this.stage !== "instructions") return;
      closeModal();
      this.finishInstructions();
    },
    finishInstructions() {
      if (this.autoDismissTimer) {
        clearTimeout(this.autoDismissTimer);
        this.autoDismissTimer = null;
      }
      if (this.stage === "done") return;
      this.stage = "done";
      // Defer the visual cleanup until after the close transition so the ×
      // and the non-intro styling don't flash in during the fade-out.
      window.setTimeout(() => {
        if (continueBtn.isConnected) continueBtn.remove();
        infoModal.classList.remove("is-intro-instructions", "is-intro-modal");
      }, 320);
      // Fade the dark intro and reveal the scene
      intro.classList.add("is-hidden");
      root.classList.remove("is-intro-flow");
      root.classList.add("is-revealing-experience");
      // Fire immediately — the scene animation will run while the dark
      // intro layer finishes fading out on top.
      this.onInstructionsDismissed?.();
      this.active = false;
    },
    showInstructions() {
      if (!this.active) return;
      this.stage = "instructions";
      this.onLanguageSelected?.(activeLanguageId);
      if (!continueBtn.isConnected) infoModal.append(continueBtn);
      infoModal.classList.add("is-intro-instructions", "is-intro-modal");
      openModal("info");
      this.autoDismissTimer = window.setTimeout(() => {
        if (this.stage === "instructions") this.dismissInstructions();
      }, INTRO_INSTRUCTIONS_AUTO_DISMISS_MS);
    },
  };

  continueBtn.addEventListener("click", () => {
    if (introFlow.active && introFlow.stage === "instructions") {
      introFlow.dismissInstructions();
    }
  });

  // ── Assemble DOM ─────────────────────────────────────────────────────
  container.append(artworkInfo, bottomBar, overlay, infoModal, transcriptModal, langModal, intro);
  root.append(footer);

  // ── Event handlers ───────────────────────────────────────────────────

  function getLanguageButtonLabel() {
    const lang = LANGUAGES.find((l) => l.id === activeLanguageId);
    const isMobile = window.innerWidth <= 640;
    if (isMobile) {
      const shortCodes = { english: "EN", german: "DE", spanish: "ES", french: "FR" };
      return shortCodes[activeLanguageId] || (lang ? lang.label.substring(0, 2).toUpperCase() : "EN");
    }
    return lang ? lang.label.toUpperCase() : "ENGLISH";
  }

  function openModal(name) {
    closeModal();
    activeModal = name;
    overlay.classList.add("is-visible");
    root.classList.add("has-modal");

    if (name === "info") {
      infoModal.classList.add("is-visible");
      infoBtn.classList.add("is-active");
    } else if (name === "transcript") {
      transcriptModal.classList.add("is-visible");
      transcriptBtn.classList.add("is-active");
    } else if (name === "language") {
      langModal.classList.add("is-visible");
      langBtn.classList.add("is-active");
    }
  }

  function closeModal() {
    if (!activeModal) return;
    overlay.classList.remove("is-visible");
    root.classList.remove("has-modal");
    infoModal.classList.remove("is-visible");
    transcriptModal.classList.remove("is-visible");
    langModal.classList.remove("is-visible");
    infoBtn.classList.remove("is-active");
    transcriptBtn.classList.remove("is-active");
    langBtn.classList.remove("is-active");
    activeModal = null;
  }

  infoBtn.addEventListener("click", () => {
    if (activeModal === "info") { closeModal(); return; }
    openModal("info");
  });

  transcriptBtn.addEventListener("click", () => {
    if (activeModal === "transcript") { closeModal(); return; }
    openModal("transcript");
  });

  langBtn.addEventListener("click", () => {
    if (activeModal === "language") { closeModal(); return; }
    openModal("language");
  });

  infoClose.addEventListener("click", () => {
    if (introFlow.active && introFlow.stage === "instructions") {
      introFlow.dismissInstructions();
      return;
    }
    closeModal();
  });
  transcriptClose.addEventListener("click", closeModal);
  langClose.addEventListener("click", () => {
    if (introFlow.active && introFlow.stage === "language") return;
    closeModal();
  });
  overlay.addEventListener("click", () => {
    if (introFlow.active && (introFlow.stage === "language" || introFlow.stage === "instructions")) {
      return;
    }
    closeModal();
  });


  soundBtn.addEventListener("click", () => {
    soundMuted = !soundMuted;
    soundBtn.textContent = "";
    soundBtn.append(soundMuted ? makeSoundOffIcon() : makeSoundOnIcon());
    soundBtn.classList.toggle("is-muted", soundMuted);
    onMuteToggle?.(soundMuted);
  });

  // Apply all localized chrome labels + modal copy for the active language.
  function applyUiLanguage(langId) {
    const t = UI_TEXTS[langId] || UI_TEXTS.english;
    renderArtworkTitle(artworkTitle, t.artworkTitle);
    renderArtworkTitle(transcriptHeaderTitle, t.artworkTitle);
    continueBtn.textContent = t.continueLabel;
    detailsBidBtnText.textContent = t.detailsBid;
    updateAnalyticsLanguageAttributes(langId);
    updateResponsiveLabels();
  }

  function updateAnalyticsLanguageAttributes(langId) {
    const code = getAnalyticsLanguageCode(langId);
    langBtn.setAttribute("data-analytics", `changeLanguageButton:${code}`);
    transcriptBtn.setAttribute("data-analytics", `viewTranscriptButton:${code}`);
  }

  // Responsive label updates (depends on the active language)
  function updateResponsiveLabels() {
    const isMobile = window.innerWidth <= 640;
    const t = UI_TEXTS[activeLanguageId] || UI_TEXTS.english;
    langBtnText.textContent = getLanguageButtonLabel();
    transcriptBtnText.textContent = isMobile ? t.transcriptShort : t.viewTranscript;
  }
  window.addEventListener("resize", updateResponsiveLabels);
  applyUiLanguage("english");

  // ── Public API ───────────────────────────────────────────────────────
  return {
    setProgress(value) {
      const clamped = Math.max(0, Math.min(1, value));
      progressBar.style.transform = `scaleX(${clamped})`;
    },
    setStatus(_text) {
      // no-op — kept for API compat
    },
    revealExperience({ onLanguageSelected, onInstructionsDismissed } = {}) {
      progressTrack.classList.add("is-hidden");
      introFlow.active = true;
      introFlow.stage = SHOW_LANGUAGE_SELECTION ? "language" : "instructions";
      introFlow.onLanguageSelected = onLanguageSelected;
      introFlow.onInstructionsDismissed = onInstructionsDismissed;
      // Flag the root so CSS can lift modals above the dark intro layer
      root.classList.add("is-intro-flow");

      window.setTimeout(() => {
        if (!introFlow.active) return;
        if (!SHOW_LANGUAGE_SELECTION) {
          introFlow.showInstructions();
          return;
        }
        langModal.classList.add("is-intro-modal");
        openModal("language");
      }, INTRO_LANGUAGE_DELAY_MS);
    },
    getSoundMuted() {
      return soundMuted;
    },
  };
}
