import { useCallback, useEffect, useRef, useState } from "react";
import { GUITARS } from "./guitars.js";
import styles from "./experience.module.css";

const BASE = import.meta.env.BASE_URL;

const N = GUITARS.length;

// ---- focus screen geometry (voku.studio/artifacts pattern) ----
// The active guitar is the big sharp hero, right-of-centre. The two neighbours
// (previous / next) sit on a large circle whose CENTRE is off-screen to the
// LEFT, so you only see the right arc: one guitar curving up-left above and one
// curving down-left below the focus. Only three guitars are ever on screen.
//
// EVERYTHING is sized/placed in U = min(vw, vh) units (the guitar art is also
// `min(82vh, 82vw)` in CSS), so the whole cluster is proportional and can never
// overlap regardless of aspect ratio. The focus is anchored a fixed U-distance
// from the LEFT edge, so on narrow screens it shifts right + shrinks, always
// leaving room for the ring. Values reproduce the 1440×900 look exactly.
const FOCUS_TILT = 68.57; // deg — matches the Figma focus guitar (−68.57° in Figma's CCW frame)
const FOCUS_FROM_LEFT = 0.704; // focus centre X, in U units from the left edge
const FOCUS_DY = 0; // focus centre Y offset from screen centre, in U units
const FOCUS_SCALE = 1.5; // active guitar — the largest element; extends further out than the ring
// v2 hero is a large guitar CENTRED on the screen and fully visible (per the 1440 design).
// Kept a touch smaller so the headstock clears the top-right switcher bar.
const FOCUS_SCALE_V2 = 1.55;
const RING_SCALE_V2 = 0.5; // v2 neighbours
// explicit v2 neighbour slots (fractions of vw / vh): the previous guitar rides
// high in the upper-left; the next guitar tucks low and is covered by the focus
const V2_UP = { x: 0.13, y: 0.12 };
const V2_DOWN = { x: 0.16, y: 0.95 };
const RING_DX = -1.0; // ring centre X relative to the focus, in U units (off to the left)
const RING_DY = 0.07; // ring centre Y relative to the focus, in U units (slightly low)
const RING_R = 0.58; // ring radius, in U units
const RING_SCALE = 0.4; // the two neighbours on the ring — smaller, give the hero space
const RING_BLUR = 40; // px — out-of-focus guitars are heavily blurred
const FOCUS_SLOT = 0; // deg — focus guitar sits at the rightmost point of the ring (3 o'clock)

// ---- small-screen (<1280px) layout ----
// A single near-upright guitar, centred, fitted into the space between the top
// nav and the bottom info card, with the neighbours stacked above/below.
const COMPACT_BP = 1280; // px — below this we use the upright single-column layout
const COMPACT_MOBILE_BP = 640; // px — below this the info becomes a glass card
const COMPACT_TILT = -15; // deg — Figma 15° (CCW) → CSS −15° (matches the design)
const COMPACT_TOP = 96; // px reserved at the top for the nav pill
const COMPACT_GAP = 40; // px gap between the guitar and the info card
const COMPACT_RING_SCALE = 0.9; // off-focus guitars slightly smaller
const COMPACT_MAX_FIT = 1.5; // upper bound on the compact fit scale (bigger hero)
// the guitar art (square PNG) at 15°: visual extents as a fraction of the square
const COMPACT_VISUAL_H = 0.94; // visual guitar height ÷ square side (after rotation)
const COMPACT_VISUAL_W = 0.7; // visual guitar width ÷ square side (after rotation)

// ---- stepping ----
const STEP_LOCK_MS = 700; // min time between steps so each 1400ms glide reads clearly
const WHEEL_THRESHOLD = 12; // px of wheel delta needed to register a step
const SWIPE_THRESHOLD = 40; // px of touch travel needed to register a step

const SIDE_WINDOW = 5; // thumbnails shown in the v2 side strip

// nearest wrapped offset of guitar i from the active index (−N/2 .. N/2)
const wrapOffset = (i, active) => {
  let d = i - active;
  while (d > N / 2) d -= N;
  while (d < -N / 2) d += N;
  return d;
};

export default function Experience({ variant = "v1" }) {
  const isV2 = variant === "v2";
  const sectionRef = useRef(null);
  const itemRefs = useRef([]);
  const infoRef = useRef(null);
  const infoHeightRef = useRef(0); // measured height of the bottom info block (compact)

  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const didInitRef = useRef(false); // first layout snaps into place (no glide)

  const [entered, setEntered] = useState(false);
  const enteredRef = useRef(false);

  const [showHint, setShowHint] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const enterExperience = () => {
    if (enteredRef.current) return;
    enteredRef.current = true;
    setEntered(true);
  };

  // ---- place every guitar for a given active index ----
  // On active change the elements just get new transforms; the CSS `transition`
  // on `.guitar` does the smooth 1400ms glide. `withTransition = false` snaps
  // instantly (first paint, resize, menu jumps).
  const applyLayout = useCallback((idx, withTransition) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const compact = vw < COMPACT_BP;
    const U = Math.min(vw, vh);

    // v2 centres the hero on the screen; v1 keeps its right-of-centre anchor
    const focusScale = isV2 ? FOCUS_SCALE_V2 : FOCUS_SCALE;
    const focusX = isV2 ? vw * 0.5 : FOCUS_FROM_LEFT * U;
    const focusY = isV2 ? vh * 0.5 : vh / 2 + FOCUS_DY * U;
    const ringCX = focusX + RING_DX * U;
    const ringCY = focusY + RING_DY * U;

    // compact geometry (shared across guitars)
    const bottomOffset = vw <= COMPACT_MOBILE_BP ? 16 : 30;
    const infoH = infoHeightRef.current || 200;
    const regionTop = COMPACT_TOP;
    const regionBottom = vh - bottomOffset - infoH - COMPACT_GAP;
    const regionH = Math.max(160, regionBottom - regionTop);
    const cy = regionTop + regionH / 2;
    const cssImgH = Math.min(0.7 * vh, 1.5 * vw); // must match the CSS img height
    const compactFit = Math.min(
      regionH / (cssImgH * COMPACT_VISUAL_H),
      (vw - 28) / (cssImgH * COMPACT_VISUAL_W),
      COMPACT_MAX_FIT
    );

    for (let i = 0; i < N; i++) {
      const el = itemRefs.current[i];
      if (!el) continue;

      const d = wrapOffset(i, idx);
      const ad = Math.abs(d);
      const isFocus = d === 0;
      const visible = ad <= 1; // only prev / focus / next are ever on screen

      let x;
      let y;
      let scale;
      let blur;
      let rot;

      if (compact) {
        rot = COMPACT_TILT;
        x = vw * 0.5;
        y = cy + d * vh * 0.96; // neighbours stacked fully off-screen above/below
        scale = isFocus ? compactFit : compactFit * COMPACT_RING_SCALE;
        blur = isFocus ? 0 : RING_BLUR;
      } else {
        rot = FOCUS_TILT;
        if (isFocus) {
          x = focusX;
          y = focusY;
          scale = focusScale;
          blur = 0;
        } else if (isV2) {
          // previous guitar high upper-left; next guitar low & covered by focus
          const slot = d < 0 ? V2_UP : V2_DOWN;
          x = slot.x * vw;
          y = slot.y * vh;
          scale = RING_SCALE_V2;
          blur = RING_BLUR;
        } else {
          const gamma = ((FOCUS_SLOT + d * (360 / N)) * Math.PI) / 180;
          x = ringCX + U * RING_R * Math.cos(gamma);
          y = ringCY + U * RING_R * Math.sin(gamma);
          scale = RING_SCALE;
          blur = RING_BLUR;
        }
      }

      el.style.transition = withTransition ? "" : "none";
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(${rot}deg) scale(${scale})`;
      el.style.filter = `blur(${blur}px)`;
      el.style.opacity = visible ? "1" : "0";
      el.style.zIndex = `${isFocus ? 1000 : visible ? 500 : 100}`;
    }
  }, [isV2]);

  // re-place the guitars whenever the active lot changes (glides), and re-measure
  // the info card so the compact fit stays exact
  useEffect(() => {
    if (infoRef.current) infoHeightRef.current = infoRef.current.offsetHeight;
    applyLayout(activeRef.current, didInitRef.current);
    didInitRef.current = true;
  }, [active, entered, applyLayout]);

  // re-flow on resize (instant, no glide)
  useEffect(() => {
    const onResize = () => {
      if (infoRef.current) infoHeightRef.current = infoRef.current.offsetHeight;
      applyLayout(activeRef.current, false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [applyLayout]);

  // ---- stepping: wheel / keyboard / touch advance one lot, wrapping endlessly ----
  useEffect(() => {
    if (!entered) return;
    let locked = false;

    const step = (dir) => {
      if (locked || menuOpen) return;
      locked = true;
      setShowHint(false);
      setActive((a) => {
        const na = (a + dir + N) % N; // endless loop: last → first and first → last
        activeRef.current = na;
        return na;
      });
      setTimeout(() => {
        locked = false;
      }, STEP_LOCK_MS);
    };

    const onWheel = (e) => {
      if (menuOpen) return; // let the menu overlay scroll normally
      e.preventDefault();
      if (Math.abs(e.deltaY) < WHEEL_THRESHOLD) return;
      step(e.deltaY > 0 ? 1 : -1);
    };

    const onKey = (e) => {
      if (menuOpen) return;
      if (["ArrowDown", "ArrowRight", "PageDown", " "].includes(e.key)) {
        e.preventDefault();
        step(1);
      } else if (["ArrowUp", "ArrowLeft", "PageUp"].includes(e.key)) {
        e.preventDefault();
        step(-1);
      }
    };

    let touchY = null;
    const onTouchStart = (e) => {
      touchY = e.touches[0].clientY;
    };
    const onTouchEnd = (e) => {
      if (touchY == null) return;
      const dy = e.changedTouches[0].clientY - touchY;
      if (Math.abs(dy) > SWIPE_THRESHOLD) step(dy < 0 ? 1 : -1);
      touchY = null;
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [entered, menuOpen]);

  // a short beat after landing, invite the visitor to explore
  useEffect(() => {
    if (!entered) return;
    const t = setTimeout(() => setShowHint(true), 1500);
    return () => clearTimeout(t);
  }, [entered]);

  // lock page scroll — the carousel is driven by wheel/swipe, the page never scrolls
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // close the menu with Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  // jump straight to a guitar from the menu / side strip — snap there instantly
  const goTo = (i) => {
    activeRef.current = i;
    applyLayout(i, false); // no glide across many lots
    setActive(i);
    setShowHint(false);
    setMenuOpen(false);
  };

  // press Enter on the keyboard to go into the experience
  useEffect(() => {
    const onKey = (e) => {
      if (!enteredRef.current && e.key === "Enter") {
        e.preventDefault();
        enterExperience();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const current = GUITARS[active];

  // windowed set of thumbnails for the v2 side strip, centred on the active one
  const sideStart = Math.max(0, Math.min(active - Math.floor(SIDE_WINDOW / 2), N - SIDE_WINDOW));
  const sideItems = GUITARS.map((g, i) => ({ g, index: i })).slice(
    sideStart,
    sideStart + SIDE_WINDOW
  );

  return (
    <section ref={sectionRef} className={styles.section}>
      <div
        className={`${styles.sticky} ${entered ? styles.live : ""} ${
          isV2 ? styles.v2 : ""
        } ${menuOpen ? styles.menuOpenState : ""}`}
      >
        {/* ---- white backdrop for the collection ---- */}
        <div className={styles.white} aria-hidden="true" />

        {/* ---- guitars ---- */}
        <div className={styles.stage}>
          {GUITARS.map((g, i) => (
            <div
              key={g.src}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              className={styles.guitar}
            >
              <img src={g.src} alt={g.name} draggable={false} />
            </div>
          ))}
        </div>

        {/* ---- top nav (collection title) ---- */}
        <nav className={styles.nav}>
          <img
            className={styles.navLogo}
            src={`${BASE}images/f901ccc3ab9e8852a2efcc34b41de75cad0e01df.png`}
            alt="Marr&rsquo;s Guitars — The Johnny Marr Collection"
          />
          <span className={styles.navLabel}>THE JOHNNY MARR COLLECTION</span>
          <button
            className={styles.navPlus}
            aria-label={menuOpen ? "Close collection menu" : "Open collection menu"}
            aria-expanded={menuOpen}
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <img
              className={`${styles.navChevron} ${menuOpen ? styles.navChevronOpen : ""}`}
              src={`${BASE}icons/chevron-down.svg`}
              alt=""
            />
          </button>
        </nav>

        {/* ---- collection menu (lot picker overlay) ---- */}
        <div className={`${styles.menu} ${menuOpen ? styles.menuOpen : ""}`}>
          <div className={styles.menuPanel}>
            <button
              type="button"
              className={styles.menuClose}
              aria-label="Close collection menu"
              onClick={() => setMenuOpen(false)}
            >
              <span className={styles.menuCloseIcon} />
            </button>
            <div className={styles.menuGrid}>
              {GUITARS.map((g, i) => (
                <div
                  key={g.src}
                  className={styles.menuItem}
                  style={{ transitionDelay: menuOpen ? `${0.06 * i + 0.1}s` : "0s" }}
                  onClick={() => goTo(i)}
                  role="button"
                  tabIndex={menuOpen ? 0 : -1}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      goTo(i);
                    }
                  }}
                >
                  <span className={styles.menuNum}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <img className={styles.menuImg} src={g.src} alt={g.name} draggable={false} />
                  <div className={styles.menuMeta}>
                    <p className={styles.menuName}>{g.name}</p>
                    <p className={styles.menuEstimate}>{g.estimate}</p>
                    <button
                      type="button"
                      className={styles.menuBid}
                      onClick={(e) => e.stopPropagation()}
                    >
                      View and Bid
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ---- v2 side thumbnail menu (lot switcher bar) ---- */}
        {isV2 && (
          <div className={styles.sideMenu}>
            {sideItems.map(({ g, index }) => (
              <button
                key={g.src}
                type="button"
                className={`${styles.sideThumb} ${
                  index === active ? styles.sideThumbActive : ""
                }`}
                onClick={() => goTo(index)}
                aria-label={`Go to ${g.name}`}
              >
                <img src={g.src} alt="" draggable={false} />
              </button>
            ))}
            <button
              type="button"
              className={styles.sidePlus}
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? "Close collection menu" : "Open collection menu"}
              aria-expanded={menuOpen}
            >
              <span className={`${styles.navIcon} ${menuOpen ? styles.navIconOpen : ""}`} />
            </button>
          </div>
        )}

        {/* ---- counter (left) ---- */}
        <div className={styles.counter}>
          <span className={styles.counterCurrent}>
            {String(active + 1).padStart(2, "0")}
          </span>
          <span className={styles.counterTotal}>/ {String(N).padStart(2, "0")}</span>
        </div>

        {/* ---- info (right on desktop, bottom card on compact) ---- */}
        <div ref={infoRef} className={styles.info}>
          <div className={styles.infoHead}>
            <p className={styles.infoName} key={current.src}>
              {current.name}
            </p>
            <span className={styles.infoNum}>
              {String(active + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}
            </span>
          </div>
          <p className={styles.infoText}>{current.text}</p>
          <p className={styles.infoEstimate}>{current.estimate}</p>
          <button type="button" className={styles.infoBid}>
            View and Bid
          </button>
        </div>

        {/* ---- scroll-to-explore glass hint ---- */}
        <div
          className={`${styles.scrollHint} ${showHint ? styles.scrollHintShow : ""}`}
          aria-hidden={!showHint}
        >
          <button
            type="button"
            className={styles.scrollHintClose}
            onClick={() => setShowHint(false)}
            aria-label="Dismiss"
            tabIndex={showHint ? 0 : -1}
          >
            &times;
          </button>
          <img
            className={styles.scrollHintIcon}
            src={`${BASE}icons/mouse-icon.svg`}
            alt=""
          />
          <p className={styles.scrollHintText}>
            Scroll to explore Johnny
            <br />
            Marr&rsquo;s guitar collection
          </p>
          <button
            type="button"
            className={styles.scrollHintCta}
            onClick={() => setShowHint(false)}
            tabIndex={showHint ? 0 : -1}
          >
            Continue
          </button>
        </div>

        {/* ---- landing gate (video + title + ENTER) ---- */}
        <div className={styles.hero}>
          <video
            className={styles.video}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
          >
            <source src={`${BASE}videos/hero.mp4`} type="video/mp4" />
          </video>
          <div className={styles.tint} aria-hidden="true" />
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              <img
                className={styles.heroLogo}
                src={`${BASE}images/9d28894d878355447558ac68c92ce7dbf4e8594e.png`}
                alt="Marr's Guitars — The Johnny Marr Collection"
              />
            </h1>
            <button type="button" className={styles.enter} onClick={enterExperience}>
              Enter
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
