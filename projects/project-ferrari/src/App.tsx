import { useEffect, useRef, useState, type PointerEvent } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

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
  const shellRef = useRef<HTMLElement | null>(null)
  const heroRef = useRef<HTMLElement | null>(null)
  const chaptersRef = useRef<HTMLElement | null>(null)
  const chapterListRef = useRef<HTMLDivElement | null>(null)
  const chapterPeekRef = useRef<HTMLDivElement | null>(null)
  const finalSnapRef = useRef<HTMLElement | null>(null)
  const editorialRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!heroRef.current) return

    const ctx = gsap.context(() => {
      gsap.timeline({ delay: 0.45 })
        .fromTo('.hero-artwork', { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 1.45, ease: 'power3.out' }, 0)
        .fromTo('.hero-title', { opacity: 0, filter: 'blur(18px)' }, { opacity: 1, filter: 'blur(0px)', duration: 1.15, ease: 'power2.out' }, 0.46)
        .fromTo('.hero-copy', { opacity: 0, filter: 'blur(14px)', y: 18 }, { opacity: 1, filter: 'blur(0px)', y: 0, duration: 1.2, ease: 'power2.out' }, 0.9)
    }, heroRef)

    return () => ctx.revert()
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

    gsap.registerPlugin(ScrollTrigger)

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
    if (!shell || !chapters || !editorial || !chapterHero) return

    const chaptersStart = chapters.offsetTop
    const chapterHeroStart = chapterHero.offsetTop
    const editorialStart = editorial.offsetTop
    shell.classList.toggle('is-chapters-active', shell.scrollTop >= chaptersStart - 8 && shell.scrollTop < chapterHeroStart - 8)
    shell.classList.toggle('is-editorial-active', shell.scrollTop >= editorialStart - 8)
  }

  const scrollToChapterHero = () => {
    const shell = shellRef.current
    const chapterHero = shell?.querySelector<HTMLElement>('.chapter-intro')
    if (!chapterHero) return

    shell.scrollTo({ top: chapterHero.offsetTop, behavior: 'smooth' })
  }

  return (
    <main ref={shellRef} className="site-shell" data-name="Modernism_1440px" onScroll={updateSnapState}>
      <section ref={heroRef} className="snap-section hero-section" data-name="HeroSection">
        <h1 className="hero-title">Radiant Modernism</h1>
        <img className="hero-artwork" src="/images/hero-signac.png" alt="Paul Signac coastal painting" />
        <p className="hero-copy">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
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
