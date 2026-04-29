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
const BASE = import.meta.env.BASE_URL;
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
const ARTIST_DATES = "(1867-1957)";

const UI_TEXTS = {
  english: {
    artworkTitle: "Danaïde, Conceived and cast circa 1913",
    viewTranscript: "VIEW TRANSCRIPT",
    transcriptShort: "TRANSCRIPT",
    detailsBid: "DETAILS & BID",
    continueLabel: "CONTINUE",
  },
  german: {
    artworkTitle: "Danaïde, entstanden um 1913; diese Bronzefassung kurz darauf gegossen",
    viewTranscript: "TRANSKRIPT ANZEIGEN",
    transcriptShort: "TRANSKRIPT",
    detailsBid: "DETAILS & BID",
    continueLabel: "WEITER",
  },
  french: {
    artworkTitle: "Danaïde, conçue vers 1913 ; cette version en bronze coulée peu après",
    viewTranscript: "VOIR LA TRANSCRIPTION",
    transcriptShort: "TRANSCRIPTION",
    detailsBid: "DETAILS & BID",
    continueLabel: "CONTINUER",
  },
  japanese: {
    artworkTitle: "《ダナイード》、1913年頃に構想され、このブロンズ版はその直後に鋳造された",
    viewTranscript: "トランスクリプトを見る",
    transcriptShort: "トランスクリプト",
    detailsBid: "DETAILS & BID",
    continueLabel: "続ける",
  },
};

export function createShowcaseUi(container, sceneInfo, { appRoot, onLanguageChange, onMuteToggle } = {}) {

  const root = appRoot || container; // root = #app, container = .app-viewport

  let activeModal = null;   // null | "info" | "transcript" | "language"
  let soundMuted = false;
  let activeLanguageId = "english";

  // ── Artwork info (top-left) ──────────────────────────────────────────
  const artworkInfo = el("div", "artwork-info");

  // Artist name + dates on separate lines; dates span is nowrap so the
  // "(1867-1957)" never splits across a line break.
  const artistName = el("h1", "artwork-artist");
  const artistNameText = el("span", "artwork-artist-name", { text: ARTIST_NAME });
  const artistDates = el("span", "artwork-artist-dates", { text: ARTIST_DATES });
  artistName.append(artistNameText, document.createElement("br"), artistDates);

  const artworkTitle = el("p", "artwork-title", {
    text: UI_TEXTS.english.artworkTitle,
  });

  artworkInfo.append(artistName, artworkTitle);

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
    href: "https://www.christies.com/lot/constantin-brancusi-1867-1957--6585085",
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
    { kind: "link", label: "HOME", href: "https://christies.com/" },
    { kind: "link", label: "VIEW COLLECTION", href: "https://www.christies.com/en/auction/masterpieces-the-private-collection-of-s-i-newhouse-31380/" },
    { kind: "cookie" },
    { kind: "link", label: "VIEW POLLOCK 7A", href: "https://experience.christies.com/pollock" },
  ];
  footerItems.forEach((item, i) => {
    if (i > 0) {
      const divider = el("span", "footer-divider", { text: "|" });
      footerNav.append(divider);
    }

    if (item.kind === "cookie") {
      const footerCookieWrap = el("div", "footer-cookie-wrap");
      const cookieSettingsBtn = el("button", "footer-cookie-button", { id: "ot-sdk-btn", type: "button", text: "Cookie settings" });
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
      "Scroll to explore Brancusi\u2019s Dana\u00efde from every angle in 3D.",
    german:
      "Scrollen Sie, um Brancusis Dana\u00efde aus jedem Winkel in 3D zu erkunden.",
    french:
      "Faites d\u00e9filer pour explorer la Dana\u00efde de Brancusi sous tous les angles en 3D.",
    japanese:
      "\u30b9\u30af\u30ed\u30fc\u30eb\u3057\u3066\u30013D\u3067\u30d6\u30e9\u30f3\u30af\u30fc\u30b7\u306e\u300a\u30c0\u30ca\u30a4\u30fc\u30c9\u300b\u3092\u3042\u3089\u3086\u308b\u89d2\u5ea6\u304b\u3089\u3054\u89a7\u304f\u3060\u3055\u3044\u3002",
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
      "Strahlend in ihrer Materialit\u00e4t und radikal in ihrer formalen Raffinesse ist Constantin Brancusis Werk eine Ikone der modernen Kunst. Durch seine eigene kraftvolle Vision verwandelte Brancusi das weibliche Gesicht in eine abstrahierte Anordnung harmonischer Formen und ver\u00e4nderte damit f\u00fcr immer den Verlauf der Bildhauerei im 20. Jahrhundert.",
      "Hier wird der Kopf von Margit Pogany, einer Kunststudentin, die der K\u00fcnstler 1910 kennenlernte, als Kontinuum anmutiger Kurven neu interpretiert. Geschwungene, fl\u00e4chige B\u00f6gen deuten ihren Blick und ihre gro\u00dfen Augen an, w\u00e4hrend von hinten ihr ordentlicher Haarknoten eine Spirale bildet, eine schlangenf\u00f6rmige Haarstr\u00e4hne, die knapp hinter ihrem Ohr versteckt ist. Physiognomische Details werden in Brancusis Streben nach Harmonie auf die elementarsten und reinsten Formen reduziert. \u201ENicht die \u00e4u\u00dfere Form ist real, sondern das Wesen der Dinge\u201C, erkl\u00e4rte er einmal. \u201EAuf dieser Grundlage ist es unm\u00f6glich, etwas Reales auszudr\u00fccken, indem man oberfl\u00e4chliche Erscheinungen nachahmt.\u201C",
      "Brancusi war ein Meister seines Materials. Urspr\u00fcnglich in Marmor ausgef\u00fchrt, \u00fcbertrug Brancusi dieses Motiv um 1913 in Bronze und schuf sechs Abg\u00fcsse von Dana\u00efde. In den fr\u00fchen Abg\u00fcssen nutzte er Vergoldung, um seine k\u00fcnstlerischen Ziele zu erreichen \u2013 eine Technik, die in seinem Schaffen selten anzutreffen ist, wobei die Oberfl\u00e4chenbehandlung ebenso wichtig war wie das Motiv selbst. \u201EJedes Material hat eine eigene Sprache, die ich nicht beseitigen und durch meine eigene ersetzen will\u201C, erkl\u00e4rte Brancusi, \u201Esondern lediglich dazu bringen m\u00f6chte, das, was ich denke und sehe, in seiner eigenen Sprache auszudr\u00fccken, die ihm allein eigen ist.\u201C",
      "Die vergoldete Oberfl\u00e4che zaubert endlose Lichtreflexe hervor, w\u00e4hrend die Figur gleichzeitig von innen zu leuchten scheint, wie eine antike G\u00f6ttin oder Ikone aus einer vergangenen Epoche. Zusammen mit der leuchtenden Vergoldung erinnert die dunkle Patina ihres Haares an die antike Kunst Ostasiens. Durch die Verschmelzung einer individuellen Pr\u00e4senz seiner eigenen Zeit mit dem Aussehen und der Bedeutung von Kunstwerken der Vergangenheit schuf Brancusi eine v\u00f6llig einzigartige Bildsprache und eine neue Form der Weiblichkeit.",
    ],
    french: [
      "Rayonnante par sa matérialité et radicale dans son raffinement formel, Danaïde de Constantin Brancusi est une icône de l’art moderne. Grâce à sa vision puissante, Brancusi a transformé le visage féminin en un agencement abstrait de formes harmonieuses, modifiant ainsi à jamais l’histoire de la sculpture au XXe siècle.",
      "Ici, la tête de Margit Pogany, une étudiante en art que l’artiste a rencontrée en 1910, est réinterprétée comme un continuum de courbes gracieuses. Des arcs courbes et plats suggèrent son regard et ses grands yeux, tandis que, vu de dos, son chignon soigné forme une spirale, une mèche de cheveux ondulée, dissimulée juste derrière son oreille. Dans sa quête d’harmonie, Brancusi réduit les détails physionomiques aux formes les plus élémentaires et les plus pures. « Ce n’est pas la forme extérieure qui est réelle, mais l’essence des choses », a-t-il déclaré un jour. « Sur cette base, il est impossible d’exprimer quelque chose de réel en imitant des apparences superficielles. »",
      "Brancusi était un maître de son matériau. Initialement réalisé en marbre, Brancusi transposa ce motif en bronze vers 1913 et créa six fontes de Danaïde. Dans les premières fontes, il utilisa la dorure pour atteindre ses objectifs artistiques – une technique rare dans son œuvre, où le traitement de surface était tout aussi important que le motif lui-même. « Chaque matériau possède son propre langage, que je ne veux pas effacer pour le remplacer par le mien », expliquait Brancusi, « mais simplement amener à exprimer ce que je pense, ce que je vois dans son propre langage, qui lui est propre. »",
      "La surface dorée fait naître d’interminables reflets de lumière, tandis que la figure semble en même temps rayonner de l’intérieur, telle une déesse antique ou une icône d’une époque révolue. Associée à la dorure éclatante, la patine sombre de ses cheveux rappelle l’art antique d’Asie orientale. En fusionnant une présence individuelle de son époque avec l’apparence et la signification d’œuvres d’art du passé, Brancusi a créé un langage visuel tout à fait unique et une nouvelle forme de féminité.",
    ],
    japanese: [
      "\u305d\u306e\u7d20\u6750\u611f\u304c\u8f1d\u304d\u3001\u5f62\u5f0f\u7684\u306a\u6d17\u7df4\u3055\u304c\u969b\u7acb\u3064\u30b3\u30f3\u30b9\u30bf\u30f3\u30c6\u30a3\u30f3\u30fb\u30d6\u30e9\u30f3\u30af\u30fc\u30b7\u306f\u3001\u73fe\u4ee3\u7f8e\u8853\u306e\u8c61\u5fb4\u7684\u5b58\u5728\u3067\u3042\u308b\u3002\u30d6\u30e9\u30f3\u30af\u30fc\u30b7\u306f\u72ec\u81ea\u306e\u529b\u5f37\u3044\u30d3\u30b8\u30e7\u30f3\u306b\u3088\u3063\u3066\u3001\u5973\u6027\u306e\u9854\u3092\u8abf\u548c\u306e\u3068\u308c\u305f\u5f62\u614b\u306e\u62bd\u8c61\u7684\u306a\u69cb\u6210\u3078\u3068\u5909\u5bb9\u3055\u305b\u3001\u305d\u308c\u306b\u3088\u3063\u306520\u4e16\u7d00\u306e\u5f6b\u523b\u306e\u6b74\u53f2\u3092\u6c38\u9060\u306b\u5909\u3048\u305f\u3002",
      "\u3053\u3053\u3067\u306f\u30011910\u5e74\u306b\u82b8\u8853\u5bb6\u304c\u51fa\u4f1a\u3063\u305f\u7f8e\u8853\u5b66\u751f\u30de\u30eb\u30ae\u30c3\u30c8\u30fb\u30dd\u30ac\u30cb\u30fc\u306e\u982d\u90e8\u304c\u3001\u512a\u7f8e\u306a\u66f2\u7dda\u306e\u9023\u7d9a\u4f53\u3068\u3057\u3066\u518d\u89e3\u91c8\u3055\u308c\u3066\u3044\u308b\u3002\u3046\u306d\u308b\u3088\u3046\u306a\u5e73\u9762\u7684\u306a\u30a2\u30fc\u30c1\u304c\u5f7c\u5973\u306e\u8996\u7dda\u3068\u5927\u304d\u306a\u77b3\u3092\u6697\u793a\u3057\u3001\u5f8c\u982d\u90e8\u3067\u306f\u6574\u3063\u305f\u9aea\u7d50\u3044\u304c\u87ba\u65cb\u3092\u63cf\u304d\u3001\u8033\u306e\u3059\u3050\u5f8c\u308d\u306b\u96a0\u308c\u308b\u86c7\u306e\u3088\u3046\u306a\u4e00\u7b4b\u306e\u9aea\u304c\u6d6e\u304b\u3073\u4e0a\u304c\u308b\u3002\u30d6\u30e9\u30f3\u30af\u30fc\u30b7\u304c\u8abf\u548c\u3092\u8ffd\u6c42\u3059\u308b\u4e2d\u3067\u3001\u9854\u8c8c\u306e\u7d30\u90e8\u306f\u6700\u3082\u57fa\u672c\u7684\u304b\u3064\u7d14\u7c8b\u306a\u5f62\u614b\u3078\u3068\u9084\u5143\u3055\u308c\u3066\u3044\u308b\u3002\u300c\u73fe\u5b9f\u306a\u306e\u306f\u5916\u898b\u3067\u306f\u306a\u304f\u3001\u7269\u4e8b\u306e\u672c\u8cea\u3067\u3042\u308b\u300d\u3068\u5f7c\u306f\u304b\u3064\u3066\u8a9e\u3063\u305f\u3002\u300c\u3053\u306e\u89b3\u70b9\u304b\u3089\u3059\u308c\u3070\u3001\u8868\u9762\u7684\u306a\u5916\u89b3\u3092\u6a21\u5023\u3057\u3066\u73fe\u5b9f\u3092\u8868\u73fe\u3059\u308b\u3053\u3068\u306f\u4e0d\u53ef\u80fd\u3060\u3002\u300d",
      "\u30d6\u30e9\u30f3\u30af\u30fc\u30b7\u306f\u7d20\u6750\u306e\u9054\u4eba\u3067\u3042\u3063\u305f\u3002\u5f53\u521d\u306f\u5927\u7406\u77f3\u3067\u5236\u4f5c\u3055\u308c\u305f\u304c\u3001\u30d6\u30e9\u30f3\u30af\u30fc\u30b7\u306f1913\u5e74\u9803\u3001\u3053\u306e\u30e2\u30c1\u30fc\u30d5\u3092\u30d6\u30ed\u30f3\u30ba\u306b\u79fb\u3057\u30016\u4f53\u306e\u92f3\u9020\u4f5c\u54c1\u3092\u5236\u4f5c\u3057\u305f\u3002\u521d\u671f\u306e\u92f3\u9020\u4f5c\u54c1\u3067\u306f\u3001\u82b8\u8853\u7684\u76ee\u6a19\u3092\u9054\u6210\u3059\u308b\u305f\u3081\u306b\u91d1\u30e1\u30c3\u30ad\u3092\u65bd\u3057\u305f\u3002\u3053\u308c\u306f\u5f7c\u306e\u4f5c\u54c1\u3067\u306f\u7a00\u306a\u6280\u6cd5\u3067\u3042\u308a\u3001\u8868\u9762\u51e6\u7406\u306f\u30e2\u30c1\u30fc\u30d5\u305d\u306e\u3082\u306e\u3068\u540c\u3058\u304f\u3089\u3044\u91cd\u8981\u8996\u3055\u308c\u3066\u3044\u305f\u3002\u300c\u3042\u3089\u3086\u308b\u7d20\u6750\u306b\u306f\u72ec\u81ea\u306e\u8a00\u8a9e\u304c\u3042\u308a\u3001\u79c1\u306f\u305d\u308c\u3092\u6392\u9664\u3057\u3066\u81ea\u5206\u306e\u8a00\u8a9e\u306b\u7f6e\u304d\u63db\u3048\u3088\u3046\u3068\u306f\u3057\u306a\u3044\u300d\u3068\u30d6\u30e9\u30f3\u30af\u30fc\u30b7\u306f\u8aac\u660e\u3057\u305f\u3002\u300c\u305f\u3060\u3001\u79c1\u304c\u8003\u3048\u3001\u898b\u3066\u3044\u308b\u3053\u3068\u3092\u3001\u305d\u306e\u7d20\u6750\u306b\u56fa\u6709\u306e\u3001\u305d\u308c\u3060\u3051\u304c\u6301\u3064\u8a00\u8a9e\u3067\u8868\u73fe\u3055\u305b\u305f\u3044\u3060\u3051\u306a\u306e\u3060\u3002\u300d",
      "\u91d1\u7b94\u3092\u65bd\u3055\u308c\u305f\u8868\u9762\u306f\u679c\u3066\u3057\u306a\u3044\u5149\u306e\u53cd\u5c04\u3092\u751f\u307f\u51fa\u3057\u3001\u305d\u306e\u50cf\u306f\u307e\u308b\u3067\u53e4\u4ee3\u306e\u5973\u795e\u3084\u904e\u304e\u53bb\u3063\u305f\u6642\u4ee3\u306e\u30a4\u30b3\u30f3\u306e\u3088\u3046\u306b\u3001\u5185\u5074\u304b\u3089\u8f1d\u3044\u3066\u3044\u308b\u304b\u306e\u3088\u3046\u306b\u898b\u3048\u308b\u3002\u8f1d\u304f\u91d1\u7b94\u3068\u76f8\u307e\u3063\u3066\u3001\u5f7c\u5973\u306e\u9aea\u306e\u6697\u3044\u7dd1\u9752\u306f\u3001\u6771\u30a2\u30b8\u30a2\u306e\u53e4\u4ee3\u82b8\u8853\u3092\u5f77\u5f7f\u3068\u3055\u305b\u308b\u3002\u81ea\u8eab\u306e\u6642\u4ee3\u306b\u304a\u3051\u308b\u500b\u3005\u306e\u5b58\u5728\u611f\u3068\u3001\u904e\u53bb\u306e\u82b8\u8853\u4f5c\u54c1\u306e\u69d8\u76f8\u3084\u610f\u5473\u3092\u878d\u5408\u3055\u305b\u308b\u3053\u3068\u3067\u3001\u30d6\u30e9\u30f3\u30af\u30fc\u30b7\u306f\u5168\u304f\u72ec\u81ea\u306e\u8996\u899a\u8a00\u8a9e\u3068\u3001\u65b0\u305f\u306a\u5973\u6027\u50cf\u3092\u5275\u308a\u51fa\u3057\u305f\u3002",
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
  const transcriptHeaderTitle = el("p", "transcript-header-title", {
    text: UI_TEXTS.english.artworkTitle,
  });
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
      const shortCodes = { english: "EN", german: "DE", french: "FR", japanese: "JP" };
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
    artworkTitle.textContent = t.artworkTitle;
    transcriptHeaderTitle.textContent = t.artworkTitle;
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
