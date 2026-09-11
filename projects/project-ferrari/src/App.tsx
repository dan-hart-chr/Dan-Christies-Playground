import { useEffect, useRef, useState, type PointerEvent } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(ScrollTrigger, SplitText)

const chapters = [
  { number: '01', title: 'Paul Signac & Les Independents', date: 'Oct 2026', status: 'Available now', image: '/images/book-1.png', active: true },
  { number: '02', title: 'Josef Albers', date: 'Oct 2026', status: 'Coming soon', image: '/images/book-2.png' },
  { number: '03', title: 'Odilon Redon', date: 'Dec 2026', status: 'Coming soon', image: '/images/book-3.png' },
  { number: '04', title: 'Lyonel Feininger', date: 'Mar 2027', status: 'Coming soon', image: '/images/book-4.png' },
  { number: '05', title: 'Paul Signac - Les Ports de France', date: 'Mar 2027', status: 'Coming soon', image: '/images/book-5.png' },
  { number: '06', title: "Les Maitres de l'Estampe", date: 'Mar 2027', status: 'Coming soon', image: '/images/book-6.png' },
]

const lots = [
  {
    title: 'Paul Signac (1863-1935)',
    subtitle: 'Saint-Briac. Les Balises (Opus 210), 1890',
    estimate: '$7,000,000 - 10,000,000',
    image: '/images/hero-signac.png',
    nodeName: 'SnappableSection 1',
  },
  {
    title: 'Paul Signac (1863-1935)',
    subtitle: 'Saint-Cloud, 1903',
    estimate: 'EUR 1,500,000 - 2,000,000',
    image: '/images/saint-cloud-1903.png',
    nodeName: 'SnappableSection 2',
  },
  {
    title: 'Paul Signac (1863-1935)',
    subtitle: 'Sainte-Anne (Saint-Tropez), 1905',
    estimate: '$6,000,000 - 8,500,000',
    image: '/images/sainte-anne-saint-tropez.png',
    details: ['oil on canvas', '73 x 92cm', 'Painted in 1905', '$6,000,000 - 8,000,000 USD'],
    nodeName: 'SnappableSection 3',
  },
]

const editorialVisuals = [
  {
    type: 'image',
    image: '/images/portrait-signac.png',
    alt: 'Portrait de Paul Signac',
    caption: 'Portrait de Paul Signac, February 1924.',
  },
  {
    type: 'quote',
    quote: "I always experience a very painterly emotion in front of Signac's canvases; I like to look at them close up as much as from far away. There's a play of hues in them as ravishing as happy combinations of gems, and it is his alone",
    cite: 'Henri-Edmond Cross',
  },
  {
    type: 'image',
    image: '/images/arriere-du-tub.png',
    alt: 'Paul Signac, Arriere du Tub',
    caption: 'Paul Signac, Arriere du Tub, 1888. Private Collection.',
  },
]

const editorialBlocks = [
  {
    imageIndex: 0,
    className: 'editorial-heading-block',
    eyebrow: 'Caillebotte, Signac and their passion for sailing',
    title: 'Following the whims of the wind...',
    paragraphs: [
      'In his 1845 manual dedicated to the new fashion of pleasure boating, Jules Jacquin eloquently captures a sense of the intense emotions the pastime could provoke in a person: “Never [has] the lover who for the first time holds in his arms his idol, nor the drinker who uncaps an old bottle, experienced such vivacious emotions as the ones felt by the Boatman who rushes downwind, sheet in hand, tiller under his arm, and taming with pride the wind and the water...”',
      'It was this heady mixture of liberation and excitement that led boating to become one of the most popular pastimes in France during the nineteenth century. While many Parisian-based artists engaged in boating at some point in their career, two figures stand out as true visionaries: Paul Signac and Gustave Caillebotte.',
    ],
  },
  {
    imageIndex: 1,
    paragraphs: [
      'Equally at home aboard a yacht as they were behind their easels, both men were inextricably bound to the two disciplines, their artistic identities shaped by their untrammelled passion for the water. Their knowledge regarding the sport was unrivalled by their contemporaries, and lent their depictions of sailing on the Seine and along the French coastline an authenticity and richness of detail that set their compositions apart from the rest of their milieu.',
      'Through their own personal, deep connection to sailing, both Signac and Caillebotte successfully captured the sense of adventure, the competitiveness, and the freedom that life on the water offered modern man.',
    ],
  },
  {
    imageIndex: 2,
    paragraphs: [
      'As with many leisure activities that became popular in French society during the nineteenth century, the arrival of sailing and rowing in France can be traced back to the influence of British investors active in Le Havre, Rouen and Paris during the 1830s. Rather unusually, the French interest in boating was born on the country’s river-ways rather than the coast, and initially drew an elite crowd before becoming popular amongst all social classes.',
      'For those more serious about the sport, dedicated clubs sprang up around the country, with thirty-seven individual organisations registered by 1875. These clubs held regattas regularly through the summer season, drawing crews from across the country to participate in races and sailing displays, eager to demonstrate their skills and discover the latest developments in boating technology.',
    ],
  },
  {
    imageIndex: 2,
    paragraphs: [
      'For Gustave Caillebotte, his fascination with boating predated the birth of his artistic career. As a youth, he would spend hours watching water-based traffic as it passed by his family’s country estate on the banks of the river Yerres, and he soon became a keen rower, inspired by the light skiffs which were a familiar sight along this stretch of water.',
      'The theme of boating along the Yerres became an important cornerstone of Caillebotte’s oeuvre during the late 1870s. Whereas artists such as Monet and Renoir had focused on the leisurely aspects of boating, Caillebotte often drew attention to the sheer physicality and degree of technical skill required to helm a craft.',
    ],
  },
]

export default function App() {
  const [activeChapterIndex, setActiveChapterIndex] = useState(0)
  const [isChapterPreviewVisible, setIsChapterPreviewVisible] = useState(false)
  const [activeEditorialImage, setActiveEditorialImage] = useState(0)
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false)
  const shellRef = useRef<HTMLElement | null>(null)
  const heroRef = useRef<HTMLElement | null>(null)
  const chaptersRef = useRef<HTMLElement | null>(null)
  const chapterListRef = useRef<HTMLDivElement | null>(null)
  const chapterPeekRef = useRef<HTMLDivElement | null>(null)
  const finalSnapRef = useRef<HTMLElement | null>(null)
  const miniNavRef = useRef<HTMLElement | null>(null)
  const editorialRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!heroRef.current) return

    let titleSplit: SplitText | undefined
    let copySplit: SplitText | undefined

    const ctx = gsap.context(() => {
      titleSplit = new SplitText('.hero-title', { type: 'lines', linesClass: 'hero-title-line' })
      copySplit = new SplitText('.hero-copy', { type: 'lines', linesClass: 'hero-copy-line' })
      // Copy reveals bottom-up: last line animates first.
      const copyLines = [...copySplit.lines].reverse()

      gsap.timeline({ delay: 0.45 })
        .fromTo('.hero-artwork', { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 1.45, ease: 'power3.out' }, 0)
        .fromTo(titleSplit.lines, { opacity: 0, y: 32 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out', stagger: 0.12 }, 0.46)
        .fromTo(copyLines, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', stagger: 0.1 }, 0.9)
    }, heroRef)

    return () => {
      ctx.revert()
      titleSplit?.revert()
      copySplit?.revert()
    }
  }, [])

  useEffect(() => {
    const section = chaptersRef.current
    const list = chapterListRef.current
    const peek = chapterPeekRef.current
    if (!section || !list || !peek) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    let targetX = 0
    let targetY = 0
    let renderedX = 0
    let renderedY = 0
    let previousX = 0
    let animationFrame = 0
    let isActive = false

    const place = (clientX: number, clientY: number) => {
      const rect = section.getBoundingClientRect()
      targetX = clientX - rect.left
      targetY = clientY - rect.top
    }

    const render = () => {
      renderedX += (targetX - renderedX) * 0.16
      renderedY += (targetY - renderedY) * 0.16

      const velocity = renderedX - previousX
      previousX = renderedX
      const tilt = Math.max(-8, Math.min(8, velocity * 0.6))

      peek.style.setProperty('--peek-x', `${renderedX}px`)
      peek.style.setProperty('--peek-y', `${renderedY}px`)
      peek.style.setProperty('--peek-tilt', `${tilt}deg`)

      if (isActive) animationFrame = requestAnimationFrame(render)
    }

    const start = (event: PointerEvent, index: number) => {
      if (event.pointerType !== 'mouse' || !finePointer.matches) return

      place(event.clientX, event.clientY)
      setActiveChapterIndex(index)
      setIsChapterPreviewVisible(true)

      if (isActive) return

      renderedX = targetX
      renderedY = targetY
      previousX = renderedX
      isActive = true
      peek.style.setProperty('--peek-x', `${renderedX}px`)
      peek.style.setProperty('--peek-y', `${renderedY}px`)

      if (!reduceMotion.matches) animationFrame = requestAnimationFrame(render)
    }

    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || !finePointer.matches) return
      place(event.clientX, event.clientY)

      if (reduceMotion.matches) {
        peek.style.setProperty('--peek-x', `${targetX}px`)
        peek.style.setProperty('--peek-y', `${targetY}px`)
      }
    }

    const stop = () => {
      isActive = false
      cancelAnimationFrame(animationFrame)
      setIsChapterPreviewVisible(false)
    }

    const rows = Array.from(list.querySelectorAll<HTMLElement>('.chapter-row'))
    const handlers = rows.map((row, index) => {
      const onPointerEnter = (event: PointerEvent) => start(event, index)
      const onPointerMove = (event: PointerEvent) => move(event)

      row.addEventListener('pointerenter', onPointerEnter)
      row.addEventListener('pointermove', onPointerMove)

      return { row, onPointerEnter, onPointerMove }
    })

    list.addEventListener('pointerleave', stop)

    return () => {
      cancelAnimationFrame(animationFrame)
      handlers.forEach(({ row, onPointerEnter, onPointerMove }) => {
        row.removeEventListener('pointerenter', onPointerEnter)
        row.removeEventListener('pointermove', onPointerMove)
      })
      list.removeEventListener('pointerleave', stop)
    }
  }, [])

  useEffect(() => {
    const shell = shellRef.current
    if (!shell) return

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.reveal-group').forEach((group) => {
        const lines = group.querySelectorAll<HTMLElement>('.reveal-line')

        gsap.fromTo(lines.length ? lines : group,
          { opacity: 0, y: 18 },
          {
            opacity: 1,
            y: 0,
            duration: 0.72,
            ease: 'power2.out',
            stagger: 0.08,
            scrollTrigger: {
              trigger: group,
              scroller: shell,
              start: 'top 72%',
              once: true,
            },
          }
        )
      })

      gsap.fromTo('.chapter-row',
        { opacity: 0, y: 18 },
        {
          opacity: 1,
          y: 0,
          duration: 0.64,
          ease: 'power2.out',
          stagger: 0.07,
          scrollTrigger: {
            trigger: '.chapters-section',
            scroller: shell,
            start: 'top 65%',
            once: true,
          },
        }
      )

      gsap.utils.toArray<HTMLElement>('.editorial-trigger').forEach((block) => {
        const imageIndex = Number(block.dataset.imageIndex ?? 0)

        ScrollTrigger.create({
          trigger: block,
          scroller: shell,
          start: 'top center',
          end: 'bottom center',
          onEnter: () => setActiveEditorialImage(imageIndex),
          onEnterBack: () => setActiveEditorialImage(imageIndex),
        })
      })
    }, shell)

    return () => ctx.revert()
  }, [])

  const updateSnapState = () => {
    const shell = shellRef.current
    const chapters = chaptersRef.current
    const editorial = editorialRef.current
    const chapterHero = shell?.querySelector<HTMLElement>('.chapter-intro')
    const firstLot = shell?.querySelector<HTMLElement>('.lot-section')
    if (!shell || !chapters || !editorial || !chapterHero) return

    const chaptersStart = chapters.offsetTop
    const chapterHeroStart = chapterHero.offsetTop
    const editorialStart = editorial.offsetTop
    shell.classList.toggle('is-chapters-active', shell.scrollTop >= chaptersStart - 8 && shell.scrollTop < chapterHeroStart - 8)
    shell.classList.toggle('is-editorial-active', shell.scrollTop >= editorialStart - 8)

    if (miniNavRef.current && firstLot) {
      miniNavRef.current.classList.toggle('is-visible', shell.scrollTop >= firstLot.offsetTop - 8)
    }
  }

  const scrollToChapterHero = () => {
    const shell = shellRef.current
    const chapterHero = shell?.querySelector<HTMLElement>('.chapter-intro')
    if (!chapterHero) return

    shell.scrollTo({ top: chapterHero.offsetTop, behavior: 'smooth' })
  }

  useEffect(() => {
    if (!isChapterModalOpen) return

    const shell = shellRef.current
    const previousOverflow = shell?.style.overflow
    if (shell) shell.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsChapterModalOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      if (shell) shell.style.overflow = previousOverflow ?? ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isChapterModalOpen])

  return (
    <main ref={shellRef} className="site-shell" data-name="Modernism_1440px" onScroll={updateSnapState}>
      <section ref={heroRef} className="snap-section hero-section" data-name="HeroSection">
        <h1 className="hero-title">Radiant Modernism</h1>
        <img className="hero-artwork" src="/images/hero-signac.png" alt="Paul Signac coastal painting" />
        <p className="hero-copy">
          A whirlwind of radiant artworks that feel really modern and cool, Dom change this copy please and thank you
        </p>
      </section>

      <section ref={chaptersRef} className="free-section chapters-section" data-name="Chapters Hover List">
        <h2 className="reveal-group"><span className="reveal-line">Chapters</span></h2>
        <div ref={chapterListRef} className="chapter-list" aria-label="Chapters">
          {chapters.map((item, index) => (
            <button
              className={`chapter-row ${item.active ? 'is-active' : ''}`}
              aria-disabled={!item.active}
              key={item.number}
              onClick={() => {
                if (item.active) scrollToChapterHero()
              }}
              onFocus={() => {
                setActiveChapterIndex(index)
                setIsChapterPreviewVisible(true)
              }}
              onBlur={() => setIsChapterPreviewVisible(false)}
              type="button"
            >
              <img className="chapter-card-image" src={item.image} alt="" aria-hidden="true" />
              <span className="chapter-card-info">
                <span className="chapter-number">{item.number}</span>
                <span className="chapter-title">{item.title}</span>
                <span className="chapter-date">{item.date}</span>
              </span>
              <span className="status-pill">{item.status}</span>
            </button>
          ))}
        </div>
        <div ref={chapterPeekRef} className={`chapter-peek ${isChapterPreviewVisible ? 'is-visible' : ''}`} aria-hidden="true">
          {chapters.map((item, index) => (
            <img className={index === activeChapterIndex ? 'is-active' : ''} src={item.image} alt="" key={item.number} />
          ))}
        </div>
      </section>

      <section className="snap-section chapter-intro" data-name="HeroSection">
        <div className="reveal-group">
          <h2 className="reveal-line">Paul Signac &amp; Les Independents</h2>
          <p className="reveal-line"><span>Chapter 1</span><span>Oct 2026</span></p>
        </div>
      </section>

      {lots.map((lot, index) => (
        <section ref={index === lots.length - 1 ? finalSnapRef : undefined} className="snap-section lot-section" data-name={lot.nodeName} key={lot.nodeName}>
          <div className="lot-copy reveal-group">
            <div>
              <h2 className="reveal-line">{lot.title}</h2>
              <p className="reveal-line">{lot.subtitle}</p>
            </div>
            <strong className="reveal-line">{lot.estimate}</strong>
            {lot.details && (
              <ul>
                {lot.details.map((detail) => <li className="reveal-line" key={detail}>{detail}</li>)}
              </ul>
            )}
            <a className="view-lot reveal-line" href="#editorial">View lot <ArrowIcon /></a>
          </div>
          <img className="lot-image" src={lot.image} alt={lot.subtitle} />
        </section>
      ))}

      <section ref={editorialRef} id="editorial" className="editorial-section" data-name="EditorialSection">
        <div className="editorial-layout">
          <aside className="editorial-sticky-visual" aria-live="polite">
            <div className="editorial-image-stage">
              {editorialVisuals.map((visual, index) => (
                <figure className={`editorial-visual ${index === activeEditorialImage ? 'is-active' : ''}`} key={`${visual.type}-${index}`}>
                  {visual.type === 'quote' ? (
                    <blockquote className="editorial-quote-visual">
                      {visual.quote}
                      <cite>{visual.cite}</cite>
                    </blockquote>
                  ) : (
                    <>
                      <img src={visual.image} alt={visual.alt} />
                      <figcaption>{visual.caption}</figcaption>
                    </>
                  )}
                </figure>
              ))}
            </div>
          </aside>

          <div className="editorial-scroll-copy">
            {editorialBlocks.map((block, index) => (
              <article className={`editorial-trigger reveal-group ${block.className ?? ''}`} data-image-index={block.imageIndex} key={index}>
                {'title' in block && block.title && <h2 className="reveal-line">{block.title}</h2>}
                {'eyebrow' in block && block.eyebrow && <h3 className="reveal-line">{block.eyebrow}</h3>}
                {'paragraphs' in block && block.paragraphs?.map((paragraph) => <p className="reveal-line" key={paragraph}>{paragraph}</p>)}
                {'title' in block && block.cite && !('paragraphs' in block) && <cite className="reveal-line">{block.cite}</cite>}
              </article>
            ))}
          </div>
        </div>

        <figure className="editorial-wide-break">
          <img src="/images/canotiers.png" alt="Gustave Caillebotte rowing scene" />
          <figcaption>Gustave Caillebotte, Canotiers ramant sur l'Yerres, 1877. Private Collection.</figcaption>
        </figure>

        <div className="editorial-lower">
          <div className="editorial-bottom-quote reveal-group">
            <h2 className="reveal-line">Let's liberate ourselves! Our goal must be to create beautiful harmonies</h2>
            <cite className="reveal-line">Paul Signac</cite>
          </div>
          <figure className="editorial-bottom-figure">
            <img src="/images/drafting-table.png" alt="Gustave Caillebotte at drafting table" />
            <figcaption>Gustave Caillebotte at his naval architect's drafting table, 1891-1892.</figcaption>
          </figure>
          <article className="editorial-bottom-copy reveal-group">
            <p className="reveal-line">Manned by two experienced oarsmen in complete boating regalia, the boat is propelled forwards by the figures’ strength alone: their arms stretching to their full extent, their muscles straining as they raise the heavy oars out of the water in one fluid, synchronised motion. There is a hint of competitiveness suggested by the manner in which the rear oarsman glances to the side, as if measuring the boat’s progress against another skiff rowing alongside.</p>
            <p className="reveal-line">Caillebotte’s interest in sailing soon shifted from rowing to the rapidly developing sport of yachting. Acquiring his first racing boat, the Iris, in 1878, he threw himself headlong into the sport, and within a few short years had risen to become one of the most influential yachtsmen in France.</p>
          </article>
        </div>
      </section>

      <nav ref={miniNavRef} className="mini-nav" aria-label="Chapter navigation">
        <button
          type="button"
          className="icon-circle-btn"
          aria-haspopup="dialog"
          aria-expanded={isChapterModalOpen}
          aria-label="Browse chapters"
          onClick={() => setIsChapterModalOpen(true)}
        >
          <BookIcon />
        </button>
        <button type="button" className="icon-circle-btn" aria-label="Back to chapter introduction" onClick={scrollToChapterHero}>
          <UpArrowIcon />
        </button>
      </nav>

      <div
        className={`chapter-modal-overlay ${isChapterModalOpen ? 'is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Chapters"
        aria-hidden={!isChapterModalOpen}
        onClick={() => setIsChapterModalOpen(false)}
      >
        <div className="chapter-modal" onClick={(event) => event.stopPropagation()}>
          <div className="chapter-modal-header">
            <h2 className="chapter-modal-title">Chapters</h2>
            <button type="button" className="icon-circle-btn" aria-label="Close chapters" onClick={() => setIsChapterModalOpen(false)}>
              <CloseGlyphIcon />
            </button>
          </div>
          <div className="chapter-modal-body">
            <div className="chapter-list">
              {chapters.map((item, index) => (
                <button
                  className={`chapter-row ${item.active ? 'is-active' : ''}`}
                  aria-disabled={!item.active}
                  key={item.number}
                  style={{ transitionDelay: `${index * 0.3}s` }}
                  onClick={() => {
                    if (!item.active) return
                    setIsChapterModalOpen(false)
                    scrollToChapterHero()
                  }}
                  type="button"
                >
                  <img className="chapter-card-image" src={item.image} alt="" aria-hidden="true" />
                  <span className="chapter-card-info">
                    <span className="chapter-number">{item.number}</span>
                    <span className="chapter-title">{item.title}</span>
                    <span className="chapter-date">{item.date}</span>
                  </span>
                  <span className="status-pill">{item.status}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

function ArrowIcon() {
  return (
    <svg className="view-lot-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M3 8h9M8.5 3.5 13 8l-4.5 4.5" />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg className="book-icon" viewBox="0 0 32 23.0842" aria-hidden="true" focusable="false">
      <path d="M32 2.52726V22.5853C31.9339 22.9733 31.5168 23.1804 31.1532 23.0404C26.4952 20.7789 21.1713 20.5398 16.2615 21.7385C16.1206 21.7677 15.9757 21.7833 15.8337 21.7531C10.9065 20.5446 5.51158 20.813 0.862369 23.0287C0.443337 23.1599 0.037917 22.9704 0 22.5115V2.50198C0.0204168 2.22878 0.145835 2.02267 0.418059 1.93809L2.62794 1.91184C2.65711 1.65711 2.66975 1.39169 2.66586 1.1185C2.70572 0.843356 2.82336 0.704327 3.08003 0.601271C6.06866 -0.176514 9.53953 -0.299015 12.5068 0.829745C13.7979 1.32072 15.0637 2.07809 15.9815 3.11546C17.7714 1.21086 20.5199 0.244462 23.036 0.058766C24.9951 -0.0860963 27.0727 0.0889054 28.9569 0.625577C29.1796 0.737383 29.2593 0.837523 29.303 1.08253C29.3244 1.36253 29.3361 1.64059 29.34 1.91475L31.5547 1.93712C31.8435 2.0217 31.9844 2.23656 32 2.52629V2.52726Z" fill="#393939" />
      <path d="M10.3931 18.0731L9.62314 17.9779C9.13411 17.9176 8.66646 17.869 8.17451 17.8699L6.45269 17.8719L5.76824 17.902C5.46782 17.9156 5.18004 17.9545 4.87671 17.9769L4.4674 18.008C4.28948 18.0216 4.11837 18.0585 3.94531 18.0381V1.74355L5.00115 1.55008L5.32588 1.49952C5.49602 1.47327 5.67491 1.4441 5.84699 1.43049L6.687 1.36438L8.58285 1.37216L9.54439 1.47035L10.3737 1.61619L11.6016 1.94577C12.4805 2.18202 13.899 2.97925 14.5689 3.59856L14.9276 3.9301L15.3749 4.4026L15.3768 19.8241C14.1255 19.0288 12.8101 18.5738 11.4393 18.2647L10.3941 18.0751L10.3931 18.0731Z" fill="#FEFEFE" />
      <path d="M22.406 17.972L21.8703 18.0342C21.743 18.0488 21.6185 18.042 21.4921 18.0974C20.41 18.2511 19.3756 18.532 18.3606 18.9326C17.7617 19.1727 17.2124 19.4527 16.6232 19.8144L16.6213 4.36954L16.9975 3.98065C17.8589 3.08912 19.2113 2.33078 20.3974 1.9448L21.6 1.61521L21.9452 1.55883C22.0502 1.54133 22.1552 1.51605 22.2631 1.50146L22.7833 1.43049L23.4376 1.36438L25.279 1.36632L26.084 1.43341L26.642 1.50049L26.9959 1.55396L28.0343 1.74452V18.0381C27.8029 18.077 27.588 18.0177 27.3664 17.9963L26.6236 17.9263L26.2463 17.8991L25.6397 17.8719H23.6398L23.0798 17.902L22.406 17.971V17.972Z" fill="#FEFEFE" />
      <path d="M12.4309 19.8154C12.2462 19.9301 12.0761 19.8134 11.9069 19.8047L11.2507 19.7677L10.9026 19.7395L8.89105 19.7463L8.26785 19.7784C8.01896 19.7911 7.78368 19.8251 7.53479 19.8513L6.78325 19.9301L6.35742 20.0011L6.00838 20.0594C5.88783 20.0798 5.78186 20.0954 5.65838 20.1187L5.24421 20.1965L4.25254 20.4298L2.56572 20.9257L1.25029 21.403V3.23009H2.72127V18.779C2.7485 19.1348 3.02364 19.4275 3.37753 19.3856L4.56657 19.2447L5.21991 19.1776L5.81297 19.1455L6.12991 19.1124L8.68396 19.1173L9.27897 19.1844L9.87786 19.2408L10.468 19.3487L10.7256 19.4061L11.0475 19.4634L11.412 19.5402C11.7582 19.6131 12.0693 19.7444 12.4329 19.8154H12.4309Z" fill="#EEE7AE" />
      <path d="M20.9934 19.7395L20.5821 19.7804L20.0756 19.8037C19.8957 19.8125 19.7246 19.9165 19.535 19.8144L20.7591 19.4975L22.0492 19.2525L22.6938 19.1854L23.2888 19.1173L25.9362 19.1115L26.2531 19.1455L26.8141 19.1776L27.4995 19.2447L28.0586 19.3108L28.4689 19.3701C28.9248 19.4352 29.1504 19.2865 29.3128 18.8412V3.23009L30.7867 3.22912L30.7594 6.44234L30.7507 21.4021L29.2748 20.8702L28.0693 20.5086L27.4383 20.3559L26.5973 20.1634L26.1404 20.0837L25.8224 20.0273L25.4744 19.967C25.3101 19.9388 25.1691 19.9252 25.0029 19.9068L24.4127 19.8416L23.7662 19.7755L23.1488 19.7405L20.9953 19.7376L20.9934 19.7395Z" fill="#EEE7AE" />
      <path d="M3.84533 1.73146L3.84248 18.0445L3.90956 18.0445L3.91241 1.73147L3.84533 1.73146Z" fill="black" />
    </svg>
  )
}

function UpArrowIcon() {
  return (
    <svg className="mini-nav-icon" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path d="M24.75 10C24.75 11.2928 25.2844 13.5296 26.4893 15.8047C27.688 18.0681 29.5062 20.2839 32 21.6191L31.6465 22.2803L31.292 22.9424C28.4607 21.4265 26.4559 18.9479 25.1631 16.5068C25.0163 16.2296 24.8797 15.9509 24.75 15.6738V38H23.25V15.6992C23.1205 15.9752 22.9835 16.2524 22.8369 16.5283C21.5434 18.9636 19.5387 21.4273 16.709 22.9424L16.3545 22.2803L16 21.6191C18.4954 20.2831 20.3137 18.0796 21.5117 15.8242C22.7156 13.5576 23.25 11.3213 23.25 10H24.75Z" fill="currentColor" />
    </svg>
  )
}

function CloseGlyphIcon() {
  return (
    <svg className="mini-nav-icon" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path d="M31.998 17.0605L25.0596 23.9961L31.998 30.9326L30.9375 31.9932L23.999 25.0566L17.0605 31.9932L16 30.9326L22.9375 23.9961L16 17.0605L17.0605 16L23.999 22.9355L30.9375 16L31.998 17.0605Z" fill="currentColor" />
    </svg>
  )
}
