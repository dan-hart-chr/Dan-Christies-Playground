import { NYC_LOCATIONS } from './locations'
import { animateTextWithFilter, resetTextFilter } from './textFilterEffect'
import {
  splitText,
  createMouseParallax,
  animateClipPathReveal,
  animate3DText,
  easingPresets,
  type SplitTextResult,
  type ParallaxController
} from './edSullivanEffects'
import { createBackgroundShift, type ShiftController } from './carnegieHallEffects'
import gsap from 'gsap'

// Extended location content for detail pages
interface LocationDetail {
  eyebrow: string
  intro: string
  historyParagraphs: string[]
  note: string
}


const LOCATION_DETAILS: Record<string, LocationDetail> = {
  'ed-sullivan': {
    eyebrow: 'Historic Theatre',
    intro: 'The Ed Sullivan Theater stands as one of America\'s most iconic entertainment venues, forever linked to the moment that changed music history when The Beatles performed on February 9, 1964.',
    historyParagraphs: [
      'Originally opened as Hammerstein\'s Theatre in 1927, this Broadway landmark was designed by architect Herbert J. Krapp in a neo-Gothic style. The theater seated 1,697 people and quickly became one of New York\'s premier venues.',
      'CBS acquired the theater in 1936, renaming it Studio 50. It became the home of The Ed Sullivan Show in 1948, broadcasting some of the most memorable moments in television history for the next 23 years.',
      'The Beatles\' appearance drew an estimated 73 million viewers—the largest TV audience in American history at that time. Elvis Presley, The Rolling Stones, and countless other legends graced this stage.'
    ],
    note: 'Today, the theater continues its legacy as the home of The Late Show with Stephen Colbert, maintaining its place at the heart of American entertainment.'
  },
  'cbs-studios': {
    eyebrow: 'Broadcast Landmark',
    intro: 'The CBS Broadcast Center served as the nerve center of American television news and entertainment, where countless historic moments were captured and transmitted to millions of homes.',
    historyParagraphs: [
      'Located at 524 West 57th Street, the CBS Broadcast Center opened in 1964 as a state-of-the-art production facility. The massive complex housed studios, control rooms, and the technical infrastructure that powered CBS\'s programming.',
      'For decades, this facility produced some of television\'s most beloved shows and broke major news stories that shaped public consciousness. The building represented the golden age of network television.',
      'News anchors like Walter Cronkite and Dan Rather delivered historic broadcasts from these studios, from moon landings to presidential elections.'
    ],
    note: 'The facility was sold in 2019 as broadcast technology evolved, marking the end of an era in television production.'
  },
  'carnegie-hall': {
    eyebrow: 'Concert Hall',
    intro: 'Carnegie Hall has stood for over 130 years as the pinnacle of musical achievement, where the world\'s greatest artists have performed in one of the most acoustically perfect venues ever constructed.',
    historyParagraphs: [
      'Industrialist Andrew Carnegie funded the construction of this magnificent concert hall, which opened on May 5, 1891. The opening night concert was conducted by Tchaikovsky himself, establishing the venue\'s reputation for excellence.',
      'The hall\'s exceptional acoustics were achieved through a combination of architectural genius and fortunate accident—the elliptical ceiling and narrow rectangular shape create a warm, resonant sound that has never been duplicated.',
      'From classical legends like Rachmaninoff and Horowitz to rock icons like The Beatles and Led Zeppelin, Carnegie Hall has welcomed every genre of music to its hallowed stage.'
    ],
    note: 'The famous answer to "How do you get to Carnegie Hall?" remains: "Practice, practice, practice."'
  },
  'rko-theatre': {
    eyebrow: 'Historic Site',
    intro: 'The RKO Proctor\'s 58th Street Theatre was Manhattan\'s first atmospheric-style movie palace, creating the illusion of watching films under a Mediterranean night sky.',
    historyParagraphs: [
      'Opening in 1929, this remarkable theater was designed by Thomas W. Lamb to transport audiences to a Spanish courtyard beneath twinkling stars. The 3,163-seat venue featured an elaborate Mediterranean village setting with towers, balconies, and a ceiling that mimicked a twilight sky.',
      'The theater represented the height of movie palace opulence, where going to the pictures was a complete escape from everyday life. Audiences dressed in their finest to experience films in surroundings fit for royalty.',
      'As television rose and attendance declined, the grand theater struggled. Despite preservation efforts, it was demolished in 1967 to make way for luxury apartments.'
    ],
    note: 'Though the building is gone, the RKO Proctor\'s represents an irreplaceable era of theatrical grandeur that will never be replicated.'
  },
  'mannys-music': {
    eyebrow: 'Music Store Legend',
    intro: 'Manny\'s Music Store was the sacred ground where generations of rock legends bought their first guitars and where the sound of rock and roll was literally shaped.',
    historyParagraphs: [
      'Founded in 1935 by Manny Goldrich on West 48th Street—the heart of "Music Row"—Manny\'s became the most famous music store in the world. Its cramped, chaotic interior was a treasure trove where musicians could find any instrument imaginable.',
      'The store\'s "Wall of Fame" featured photos of virtually every major musician of the 20th century. Jimi Hendrix bought his first American guitar here. The Beatles, Rolling Stones, Eric Clapton, and countless others were regular customers.',
      'Staff members were legendary musicians themselves, offering expertise and stories that couldn\'t be found anywhere else. Walking into Manny\'s meant walking into rock history.'
    ],
    note: 'After 74 years, Manny\'s closed in 2009, but its legacy lives on in the countless songs played on instruments that passed through its doors.'
  },
  'madison-square-garden': {
    eyebrow: 'The World\'s Most Famous Arena',
    intro: 'Madison Square Garden has hosted the most legendary concerts in rock history, from John Lennon\'s last full concert to countless performances that have become the stuff of legend.',
    historyParagraphs: [
      'The current Madison Square Garden, the fourth venue to bear the name, opened in 1968 atop Penn Station. Designed by Charles Luckman, the distinctive circular arena can hold up to 20,000 people for concerts.',
      'MSG has witnessed historic moments: John Lennon\'s surprise appearance with Elton John in 1974 (his last full concert), George Harrison\'s Concert for Bangladesh, and hundreds of sold-out runs by artists from Elvis to The Rolling Stones to Billy Joel.',
      'The arena has maintained its status as the ultimate venue for rock musicians—a place where careers are cemented and legends are made. Playing MSG remains every musician\'s dream.'
    ],
    note: 'Billy Joel has performed more consecutive sold-out shows at MSG than any other artist, with over 100 lifetime performances at the venue.'
  },
  'christies': {
    eyebrow: 'Auction House',
    intro: 'Christie\'s at Rockefeller Center has become the world\'s premier destination for the auction of historic musical instruments, memorabilia, and artifacts that tell the story of popular music.',
    historyParagraphs: [
      'Founded in London in 1766 by James Christie, the auction house established its Rockefeller Center salesroom in 1997. The location at 20 Rockefeller Plaza has become synonymous with record-breaking sales of musical heritage.',
      'Christie\'s has auctioned some of the most valuable instruments in history: John Lennon\'s guitars, Eric Clapton\'s "Blackie" Stratocaster, and countless pieces that connect collectors to musical history.',
      'The auction house\'s music memorabilia sales have helped establish the field as a serious area of collecting, preserving artifacts that might otherwise be lost to time.'
    ],
    note: 'The Jim Irsay Collection represents one of the most significant private collections of rock and roll memorabilia ever assembled, preserving instruments that shaped musical history.'
  }
}

// Detail overlay controller
class DetailOverlay {
  private overlay: HTMLElement
  private closeBtn: HTMLElement
  private morphBox: HTMLElement
  private contentEl: HTMLElement
  private currentLocationId: string | null = null
  private isOpen = false
  private isAnimating = false

  // Store source element rect for close animation
  private sourceRect: DOMRect | null = null

  // Enhanced effects - VWLab inspired
  private titleSplitText: SplitTextResult | null = null
  private mouseParallax: ParallaxController | null = null

  // Carnegie Hall specific
  private carnegieShiftController: ShiftController | null = null
  private carnegieTitleSplitText: SplitTextResult | null = null

  // MSG specific - chase light and spark animations
  private chaseLightInterval: ReturnType<typeof setInterval> | null = null
  private sparkInterval: ReturnType<typeof setInterval> | null = null

  // RKO Theatre specific
  private rkoTitleSplitText: SplitTextResult | null = null

  // CBS Studios specific
  private cbsTitleSplitText: SplitTextResult | null = null

  constructor() {
    this.overlay = document.getElementById('detail-overlay')!
    this.closeBtn = document.getElementById('detail-close')!
    this.morphBox = document.getElementById('morph-box')!
    this.contentEl = document.getElementById('detail-content')!

    this.bindEvents()
  }

  private bindEvents() {
    this.closeBtn.addEventListener('click', () => this.close())

    // Close on escape key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close()
      }
    })
  }

  open(locationId: string, fromElement: HTMLElement) {
    if (this.isOpen || this.isAnimating) return

    // Only these locations have full screen modals
    if (locationId !== 'ed-sullivan' && locationId !== 'carnegie-hall' && locationId !== 'madison-square-garden' && locationId !== 'rko-theatre' && locationId !== 'cbs-studios') return

    this.isAnimating = true
    this.isOpen = true
    this.currentLocationId = locationId

    // Get location data
    const location = NYC_LOCATIONS.find(l => l.id === locationId)
    const details = LOCATION_DETAILS[locationId]

    if (!location || !details) return

    // Store source rect for close animation
    this.sourceRect = fromElement.getBoundingClientRect()

    // Route to appropriate layout handler
    if (locationId === 'carnegie-hall') {
      this.openCarnegieHall()
      return
    }

    if (locationId === 'madison-square-garden') {
      this.openMSG()
      return
    }

    if (locationId === 'rko-theatre') {
      this.openRKO()
      return
    }

    if (locationId === 'cbs-studios') {
      this.openCBS()
      return
    }

    // Set Ed Sullivan layout
    this.overlay.setAttribute('data-layout', 'edsullivan')

    // Set initial states - use pixel values throughout for reliable animation
    const rect = this.sourceRect
    const windowW = window.innerWidth
    const windowH = window.innerHeight

    gsap.set(this.morphBox, {
      left: rect.left + 'px',
      top: rect.top + 'px',
      width: rect.width + 'px',
      height: rect.height + 'px',
      borderRadius: 16,
      opacity: 1
    })

    const images = document.querySelectorAll('.edsullivan-image') as NodeListOf<HTMLElement>
    const title = document.querySelector('.edsullivan-title') as HTMLElement
    const desc = document.querySelector('.edsullivan-description') as HTMLElement

    // Split title text for 3D character animation
    if (title && !this.titleSplitText) {
      this.titleSplitText = splitText(title, { type: 'chars,words' })
    }

    // Content container visible (so shader can render), but elements hidden
    gsap.set(this.contentEl, { opacity: 1 })

    // Images start with clip-path for circular reveal
    gsap.set(images, {
      opacity: 1,
      clipPath: 'circle(0% at 50% 100%)',
      y: 0,
      scale: 1
    })

    // Title chars hidden for 3D reveal
    if (this.titleSplitText) {
      gsap.set(this.titleSplitText.chars, {
        opacity: 0,
        rotateY: 90,
        xPercent: -40,
        yPercent: 60,
        scale: 0.6
      })
    }
    gsap.set(title, { opacity: 1 })
    gsap.set(desc, { opacity: 0, y: 40 })
    gsap.set(this.closeBtn, { opacity: 0, scale: 0.5, rotate: -180 })


    // Show overlay
    this.overlay.classList.add('active')

    // Create master timeline with VWLab-inspired curves
    const tl = gsap.timeline({
      defaults: { ease: 'expo.inOut' },
      onComplete: () => {
        this.isAnimating = false

        // Enable mouse parallax after animation completes
        if (!this.mouseParallax) {
          this.mouseParallax = createMouseParallax({
            elements: images,
            depths: [1.2, 0.7, 1.5],  // Different depth per image
            maxMovement: 20,
            maxRotation: 3,
            smoothness: 0.85
          })
        }
        this.mouseParallax.enable()
      }
    })

    // Phase 1: Morph box expands to fullscreen
    tl.to(this.morphBox, {
      duration: 0.7,
      left: '0px',
      top: '0px',
      width: windowW + 'px',
      height: windowH + 'px',
      borderRadius: 0,
      ease: 'power3.inOut'
    })

    // Phase 2: Morph box fades out - shader is already rendering underneath
    tl.to(this.morphBox, {
      duration: 0.3,
      opacity: 0,
      ease: 'power2.out'
    }, '-=0.15')

    // Phase 3: Clip-path circular reveal for images - MORE PARALLEL
    // All images start at nearly the same time with slight stagger
    images.forEach((img, i) => {
      const directions: Array<'bottom' | 'center' | 'bottom'> = ['bottom', 'center', 'bottom']

      tl.add(
        animateClipPathReveal({
          element: img,
          type: 'circle',
          direction: directions[i % 3],
          duration: 0.9,  // Faster
          ease: easingPresets.vwlabSnap
        }),
        i === 0 ? '-=0.2' : `<${i * 0.08}`  // Nearly parallel with tiny stagger
      )
    })

    // Phase 4: 3D Character reveal for title - starts with images
    if (this.titleSplitText && this.titleSplitText.chars.length > 0) {
      tl.add(
        animate3DText({
          element: title,
          splitResult: this.titleSplitText,
          duration: 1,
          ease: easingPresets.lookbookText,
          stagger: 0.02
        }),
        '<0.1'  // Start just after images begin
      )
    } else if (title) {
      // Fallback to SVG filter if split failed
      tl.add(() => {
        animateTextWithFilter(title, {
          duration: 1,
          ease: 'expo.out',
          startBlur: 60,
          startScale: 180
        })
      }, '<0.1')
    }

    // Phase 5: Description slides up with bounce - overlaps with title
    tl.to(desc, {
      duration: 0.8,
      opacity: 1,
      y: 0,
      ease: easingPresets.vwlabSnap
    }, '<0.3')

    // Phase 6: Close button spins in - overlaps
    tl.to(this.closeBtn, {
      duration: 0.5,
      opacity: 1,
      scale: 1,
      rotate: 0,
      ease: 'back.out(2.5)'
    }, '<0.2')
  }

  /**
   * Open Carnegie Hall layout with background shift effect
   */
  private openCarnegieHall() {
    // Set Carnegie Hall layout
    this.overlay.setAttribute('data-layout', 'carnegiehall')

    // Get dimensions
    const rect = this.sourceRect!
    const windowW = window.innerWidth
    const windowH = window.innerHeight

    // Set morph box color to match Carnegie Hall background
    gsap.set(this.morphBox, {
      left: rect.left + 'px',
      top: rect.top + 'px',
      width: rect.width + 'px',
      height: rect.height + 'px',
      borderRadius: 16,
      opacity: 1,
      background: '#d65430'
    })

    // Get Carnegie Hall elements
    const shiftContainer = document.getElementById('carnegiehall-shift')
    const title = document.querySelector('.carnegiehall-title') as HTMLElement
    const desc = document.querySelector('.carnegiehall-description') as HTMLElement
    const aside = document.querySelector('.carnegiehall-aside') as HTMLElement

    // Initialize background shift controller
    if (shiftContainer && !this.carnegieShiftController) {
      this.carnegieShiftController = createBackgroundShift({
        container: shiftContainer,
        duration: 0.9
      })
    }

    // Split title text for character animation
    if (title && !this.carnegieTitleSplitText) {
      this.carnegieTitleSplitText = splitText(title, { type: 'chars,words' })
    }

    // Content container visible but elements hidden
    gsap.set(this.contentEl, { opacity: 1 })

    // Title chars hidden for reveal
    if (this.carnegieTitleSplitText) {
      gsap.set(this.carnegieTitleSplitText.chars, {
        opacity: 0,
        rotateY: 90,
        xPercent: -40,
        yPercent: 60,
        scale: 0.6
      })
    }
    gsap.set(title, { opacity: 1 })
    gsap.set(desc, { opacity: 0, y: 40 })
    gsap.set(aside, { opacity: 0, x: 40 })
    gsap.set(this.closeBtn, { opacity: 0, scale: 0.5, rotate: -180 })

    // Show overlay
    this.overlay.classList.add('active')

    // Create master timeline
    const tl = gsap.timeline({
      defaults: { ease: 'expo.inOut' },
      onComplete: () => {
        this.isAnimating = false
      }
    })

    // Phase 1: Morph box expands to fullscreen
    tl.to(this.morphBox, {
      duration: 0.7,
      left: '0px',
      top: '0px',
      width: windowW + 'px',
      height: windowH + 'px',
      borderRadius: 0,
      ease: 'power3.inOut'
    })

    // Phase 2: Morph box fades out as content becomes visible
    tl.to(this.morphBox, {
      duration: 0.3,
      opacity: 0,
      ease: 'power2.out'
    }, '-=0.15')

    // Phase 3: Background shift layers animate in
    if (this.carnegieShiftController) {
      tl.add(this.carnegieShiftController.animateIn(), '-=0.3')
    }

    // Phase 4: Title characters animate in with 3D effect
    if (this.carnegieTitleSplitText && this.carnegieTitleSplitText.chars.length > 0) {
      tl.add(
        animate3DText({
          element: title,
          splitResult: this.carnegieTitleSplitText,
          duration: 1,
          ease: easingPresets.lookbookText,
          stagger: 0.02
        }),
        '-=0.6'
      )
    } else if (title) {
      // Fallback to filter animation
      tl.add(() => {
        animateTextWithFilter(title, {
          duration: 1,
          ease: 'expo.out',
          startBlur: 60,
          startScale: 180
        })
      }, '-=0.6')
    }

    // Phase 5: Description slides up
    tl.to(desc, {
      duration: 0.8,
      opacity: 1,
      y: 0,
      ease: 'back.out(1.7)'
    }, '-=0.5')

    // Phase 6: Aside fades in from right
    tl.to(aside, {
      duration: 0.6,
      opacity: 1,
      x: 0,
      ease: 'power2.out'
    }, '-=0.4')

    // Phase 7: Close button spins in
    tl.to(this.closeBtn, {
      duration: 0.5,
      opacity: 1,
      scale: 1,
      rotate: 0,
      ease: 'back.out(2.5)'
    }, '-=0.3')
  }

  close() {
    if (!this.isOpen || this.isAnimating) return

    this.isAnimating = true

    // Route to appropriate close handler
    if (this.currentLocationId === 'carnegie-hall') {
      this.closeCarnegieHall()
      return
    }

    if (this.currentLocationId === 'madison-square-garden') {
      this.closeMSG()
      return
    }

    if (this.currentLocationId === 'rko-theatre') {
      this.closeRKO()
      return
    }

    if (this.currentLocationId === 'cbs-studios') {
      this.closeCBS()
      return
    }

    // Disable parallax immediately
    if (this.mouseParallax) {
      this.mouseParallax.disable()
    }

    // Get Ed Sullivan elements
    const images = document.querySelectorAll('.edsullivan-image') as NodeListOf<HTMLElement>
    const title = document.querySelector('.edsullivan-title') as HTMLElement
    const desc = document.querySelector('.edsullivan-description') as HTMLElement

    // Create close timeline
    const tl = gsap.timeline({
      defaults: { ease: 'expo.inOut' },
      onComplete: () => {
        // Destroy parallax controller
        if (this.mouseParallax) {
          this.mouseParallax.destroy()
          this.mouseParallax = null
        }

        // Revert split text
        if (this.titleSplitText) {
          this.titleSplitText.revert()
          this.titleSplitText = null
        }

        // Reset all animated elements for next open
        gsap.set(this.morphBox, { clearProps: 'all' })
        gsap.set(this.contentEl, { clearProps: 'all' })
        gsap.set(this.closeBtn, { clearProps: 'all' })
        gsap.set(images, { clearProps: 'all' })
        gsap.set(desc, { clearProps: 'all' })

        // Reset title filter
        if (title) {
          resetTextFilter(title)
          gsap.set(title, { clearProps: 'all' })
        }

        this.overlay.removeAttribute('data-layout')
        this.overlay.classList.remove('active')
        this.isOpen = false
        this.isAnimating = false
        this.currentLocationId = null
        this.sourceRect = null

      }
    })

    // Phase 1: Close button spins out
    tl.to(this.closeBtn, {
      duration: 0.3,
      opacity: 0,
      scale: 0.5,
      rotate: 180,
      ease: 'power2.in'
    })

    // Phase 2: Description fades up and out
    .to(desc, {
      duration: 0.4,
      opacity: 0,
      y: -30,
      ease: 'power2.in'
    }, '-=0.2')

    // Phase 3: Title characters fly out (if split text exists)
    if (this.titleSplitText && this.titleSplitText.chars.length > 0) {
      // Animate chars out with stagger from end
      tl.to(this.titleSplitText.chars, {
        duration: 0.4,
        opacity: 0,
        rotateY: -90,
        yPercent: -50,
        scale: 0.7,
        stagger: {
          each: 0.015,
          from: 'end'
        },
        ease: 'power2.in'
      }, '-=0.3')
    } else {
      tl.to(title, {
        duration: 0.5,
        opacity: 0,
        y: -30,
        ease: 'power2.in'
      }, '-=0.3')
    }

    // Phase 4: Images shrink back with clip-path
    images.forEach((img, i) => {
      tl.to(img, {
        clipPath: 'circle(0% at 50% 50%)',
        scale: 0.9,
        duration: 0.5,
        ease: 'power3.in'
      }, i === 0 ? '-=0.4' : '-=0.35')
    })

    // Fade out the content container so morph box is visible
    tl.to(this.contentEl, {
      duration: 0.3,
      opacity: 0,
      ease: 'power2.in'
    }, '-=0.2')

    // Phase 5: Morph back to source
    if (this.sourceRect) {
      const windowW = window.innerWidth
      const windowH = window.innerHeight
      const rect = this.sourceRect

      // Set morph box to fullscreen (pixel values)
      tl.set(this.morphBox, {
        left: '0px',
        top: '0px',
        width: windowW + 'px',
        height: windowH + 'px',
        borderRadius: 0,
        opacity: 1
      })

      // Animate to source position (pixel values)
      tl.to(this.morphBox, {
        duration: 0.7,
        left: rect.left + 'px',
        top: rect.top + 'px',
        width: rect.width + 'px',
        height: rect.height + 'px',
        borderRadius: 16,
        ease: 'power3.inOut'
      })

      // Fade out morph box
      tl.to(this.morphBox, {
        duration: 0.3,
        opacity: 0,
        ease: 'power2.out'
      }, '-=0.15')
    }
  }

  /**
   * Close Carnegie Hall layout
   */
  private closeCarnegieHall() {
    // Get Carnegie Hall elements
    const shiftLayers = document.querySelectorAll('.carnegiehall-shift__layer-inner') as NodeListOf<HTMLElement>
    const title = document.querySelector('.carnegiehall-title') as HTMLElement
    const desc = document.querySelector('.carnegiehall-description') as HTMLElement
    const aside = document.querySelector('.carnegiehall-aside') as HTMLElement

    // Create close timeline
    const tl = gsap.timeline({
      defaults: { ease: 'expo.inOut' },
      onComplete: () => {
        // Destroy shift controller
        if (this.carnegieShiftController) {
          this.carnegieShiftController.destroy()
          this.carnegieShiftController = null
        }

        // Revert split text
        if (this.carnegieTitleSplitText) {
          this.carnegieTitleSplitText.revert()
          this.carnegieTitleSplitText = null
        }

        // Reset all animated elements
        gsap.set(this.morphBox, { clearProps: 'all' })
        gsap.set(this.contentEl, { clearProps: 'all' })
        gsap.set(this.closeBtn, { clearProps: 'all' })
        gsap.set(shiftLayers, { clearProps: 'all' })
        gsap.set(desc, { clearProps: 'all' })
        gsap.set(aside, { clearProps: 'all' })

        if (title) {
          resetTextFilter(title)
          gsap.set(title, { clearProps: 'all' })
        }

        this.overlay.removeAttribute('data-layout')
        this.overlay.classList.remove('active')
        this.isOpen = false
        this.isAnimating = false
        this.currentLocationId = null
        this.sourceRect = null

      }
    })

    // Phase 1: Close button spins out
    tl.to(this.closeBtn, {
      duration: 0.3,
      opacity: 0,
      scale: 0.5,
      rotate: 180,
      ease: 'power2.in'
    })

    // Phase 2: Aside fades out
    .to(aside, {
      duration: 0.3,
      opacity: 0,
      x: 30,
      ease: 'power2.in'
    }, '-=0.2')

    // Phase 3: Description fades up and out
    .to(desc, {
      duration: 0.4,
      opacity: 0,
      y: -30,
      ease: 'power2.in'
    }, '-=0.2')

    // Phase 4: Title characters fly out
    if (this.carnegieTitleSplitText && this.carnegieTitleSplitText.chars.length > 0) {
      tl.to(this.carnegieTitleSplitText.chars, {
        duration: 0.4,
        opacity: 0,
        rotateY: -90,
        yPercent: -50,
        scale: 0.7,
        stagger: {
          each: 0.015,
          from: 'end'
        },
        ease: 'power2.in'
      }, '-=0.3')
    } else {
      tl.to(title, {
        duration: 0.5,
        opacity: 0,
        y: -30,
        ease: 'power2.in'
      }, '-=0.3')
    }

    // Phase 5: Shift layers animate out
    if (this.carnegieShiftController) {
      tl.add(this.carnegieShiftController.animateOut(), '-=0.3')
    }

    // Fade out content container
    tl.to(this.contentEl, {
      duration: 0.3,
      opacity: 0,
      ease: 'power2.in'
    }, '-=0.4')

    // Phase 6: Morph back to source
    if (this.sourceRect) {
      const windowW = window.innerWidth
      const windowH = window.innerHeight
      const rect = this.sourceRect

      // Set morph box to fullscreen with Carnegie Hall color
      tl.set(this.morphBox, {
        left: '0px',
        top: '0px',
        width: windowW + 'px',
        height: windowH + 'px',
        borderRadius: 0,
        opacity: 1,
        background: '#d65430'
      })

      // Animate to source position
      tl.to(this.morphBox, {
        duration: 0.7,
        left: rect.left + 'px',
        top: rect.top + 'px',
        width: rect.width + 'px',
        height: rect.height + 'px',
        borderRadius: 16,
        ease: 'power3.inOut'
      })

      // Fade out morph box
      tl.to(this.morphBox, {
        duration: 0.3,
        opacity: 0,
        ease: 'power2.out'
      }, '-=0.15')
    }
  }

  /**
   * Open Madison Square Garden layout - Jumbotron/LED Style
   */
  private openMSG() {
    // Set MSG layout
    this.overlay.setAttribute('data-layout', 'msg')

    // Get dimensions
    const rect = this.sourceRect!
    const windowW = window.innerWidth
    const windowH = window.innerHeight

    // Set morph box color to match MSG background (dark)
    gsap.set(this.morphBox, {
      left: rect.left + 'px',
      top: rect.top + 'px',
      width: rect.width + 'px',
      height: rect.height + 'px',
      borderRadius: 16,
      opacity: 1,
      background: '#0a0a0a'
    })

    // Get MSG elements
    const ledGrid = document.getElementById('msg-led-grid')
    const scanlines = document.querySelector('.msg-scanlines') as HTMLElement
    const jumbotron = document.getElementById('msg-jumbotron')
    const bgImage = document.getElementById('msg-bg')
    const eyebrow = document.getElementById('msg-eyebrow')
    const titleLines = document.querySelectorAll('.msg-title-line') as NodeListOf<HTMLElement>
    const infoPanel = document.getElementById('msg-info-panel')
    const stats = document.querySelectorAll('.msg-stat') as NodeListOf<HTMLElement>
    const chaseLightsContainer = document.getElementById('msg-chase-lights')

    // Create chase lights around the border
    if (chaseLightsContainer && chaseLightsContainer.children.length === 0) {
      const totalLights = 60
      for (let i = 0; i < totalLights; i++) {
        const light = document.createElement('div')
        light.className = 'msg-chase-light'
        const progress = i / totalLights
        // Position lights around the perimeter
        if (progress < 0.25) {
          // Top edge
          light.style.top = '0'
          light.style.left = `${(progress / 0.25) * 100}%`
        } else if (progress < 0.5) {
          // Right edge
          light.style.right = '0'
          light.style.top = `${((progress - 0.25) / 0.25) * 100}%`
        } else if (progress < 0.75) {
          // Bottom edge
          light.style.bottom = '0'
          light.style.right = `${((progress - 0.5) / 0.25) * 100}%`
        } else {
          // Left edge
          light.style.left = '0'
          light.style.bottom = `${((progress - 0.75) / 0.25) * 100}%`
        }
        chaseLightsContainer.appendChild(light)
      }
    }

    // Content container visible but elements hidden
    gsap.set(this.contentEl, { opacity: 1 })
    gsap.set(ledGrid, { opacity: 0 })
    gsap.set(scanlines, { opacity: 0 })
    gsap.set(jumbotron, { opacity: 0, scale: 0.9 })
    gsap.set(bgImage, { opacity: 0, scale: 1.2 })
    gsap.set(eyebrow, { opacity: 0, y: 20 })
    gsap.set(titleLines, { opacity: 0, y: 40 })
    gsap.set(infoPanel, { opacity: 0, y: 50 })
    gsap.set(stats, { opacity: 0, y: 20 })
    gsap.set(this.closeBtn, { opacity: 0, scale: 0.5, rotate: -180 })

    // Show overlay
    this.overlay.classList.add('active')

    // Create master timeline
    const tl = gsap.timeline({
      defaults: { ease: 'expo.out' },
      onComplete: () => {
        this.isAnimating = false
        // Start chase light and spark animations
        this.startChaseLightAnimation()
        this.startSparkAnimation()
      }
    })

    // Phase 1: Morph box expands to fullscreen
    tl.to(this.morphBox, {
      duration: 0.7,
      left: '0px',
      top: '0px',
      width: windowW + 'px',
      height: windowH + 'px',
      borderRadius: 0,
      ease: 'power3.inOut'
    })

    // Phase 2: Morph box fades out, LED grid fades in
    tl.to(this.morphBox, {
      duration: 0.3,
      opacity: 0,
      ease: 'power2.out'
    }, '-=0.15')

    tl.to(ledGrid, {
      duration: 0.5,
      opacity: 0.6,
      ease: 'power2.out'
    }, '-=0.2')

    // Phase 3: Jumbotron screen appears with scale
    tl.to(jumbotron, {
      duration: 0.8,
      opacity: 1,
      scale: 1,
      ease: 'back.out(1.4)'
    }, '-=0.3')

    // Phase 4: Scanlines fade in
    tl.to(scanlines, {
      duration: 0.4,
      opacity: 1,
      ease: 'power2.out'
    }, '-=0.5')

    // Phase 5: Eyebrow text types in
    tl.to(eyebrow, {
      duration: 0.6,
      opacity: 1,
      y: 0,
      ease: 'power3.out'
    }, '-=0.3')

    // Phase 6: Background image zooms in with Ken Burns effect
    tl.to(bgImage, {
      duration: 1.5,
      opacity: 1,
      scale: 1,
      ease: 'power2.out'
    }, '-=0.5')

    // Phase 7: Title lines animate in with stagger
    tl.to(titleLines, {
      duration: 0.8,
      opacity: 1,
      y: 0,
      stagger: 0.12,
      ease: 'power3.out'
    }, '-=1.2')

    // Phase 8: Info panel slides up
    tl.to(infoPanel, {
      duration: 0.7,
      opacity: 1,
      y: 0,
      ease: 'power3.out'
    }, '-=0.4')

    // Phase 9: Stats animate in
    tl.to(stats, {
      duration: 0.5,
      opacity: 1,
      y: 0,
      stagger: 0.1,
      ease: 'back.out(2)'
    }, '-=0.3')

    // Phase 10: Close button spins in
    tl.to(this.closeBtn, {
      duration: 0.5,
      opacity: 1,
      scale: 1,
      rotate: 0,
      ease: 'back.out(2.5)'
    }, '-=0.3')
  }

  private startChaseLightAnimation() {
    const lights = document.querySelectorAll('.msg-chase-light') as NodeListOf<HTMLElement>
    if (lights.length === 0) return

    let activeIndex = 0
    const trailLength = 8

    this.chaseLightInterval = setInterval(() => {
      lights.forEach((light, i) => {
        light.classList.remove('active')
        // Create a trail effect
        const distance = (i - activeIndex + lights.length) % lights.length
        if (distance < trailLength) {
          light.style.opacity = String(0.3 + (0.7 * (1 - distance / trailLength)))
        } else {
          light.style.opacity = '0.2'
        }
      })
      const activeLight = lights[activeIndex]
      if (activeLight) activeLight.classList.add('active')
      activeIndex = (activeIndex + 1) % lights.length
    }, 50)
  }

  private stopChaseLightAnimation() {
    if (this.chaseLightInterval) {
      clearInterval(this.chaseLightInterval)
      this.chaseLightInterval = null
    }
  }

  private startSparkAnimation() {
    const chaseLightsContainer = document.getElementById('msg-chase-lights')
    if (!chaseLightsContainer) return

    // Create a spark at random position along the border
    const createSpark = () => {
      const containerRect = chaseLightsContainer.getBoundingClientRect()
      const perimeter = 2 * (containerRect.width + containerRect.height)
      const randomPos = Math.random() * perimeter

      let x: number, y: number

      if (randomPos < containerRect.width) {
        // Top edge
        x = randomPos
        y = 0
      } else if (randomPos < containerRect.width + containerRect.height) {
        // Right edge
        x = containerRect.width
        y = randomPos - containerRect.width
      } else if (randomPos < 2 * containerRect.width + containerRect.height) {
        // Bottom edge
        x = containerRect.width - (randomPos - containerRect.width - containerRect.height)
        y = containerRect.height
      } else {
        // Left edge
        x = 0
        y = containerRect.height - (randomPos - 2 * containerRect.width - containerRect.height)
      }

      // Create main spark
      const spark = document.createElement('div')
      spark.className = 'msg-spark'
      spark.style.left = `${x}px`
      spark.style.top = `${y}px`
      chaseLightsContainer.appendChild(spark)

      // Trigger animation
      requestAnimationFrame(() => {
        spark.classList.add('flash')
      })

      // Create trail particles
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          const trail = document.createElement('div')
          trail.className = 'msg-spark-trail'
          trail.style.left = `${x}px`
          trail.style.top = `${y}px`
          // Random direction for each particle
          const angle = Math.random() * Math.PI * 2
          const distance = 20 + Math.random() * 30
          trail.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
          trail.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
          chaseLightsContainer.appendChild(trail)

          requestAnimationFrame(() => {
            trail.classList.add('animate')
          })

          // Clean up trail
          setTimeout(() => {
            trail.remove()
          }, 600)
        }, i * 30)
      }

      // Clean up spark
      setTimeout(() => {
        spark.remove()
      }, 400)
    }

    // Create sparks at random intervals
    this.sparkInterval = setInterval(() => {
      // Random chance to create 1-3 sparks
      const numSparks = Math.random() < 0.3 ? Math.floor(Math.random() * 2) + 2 : 1
      for (let i = 0; i < numSparks; i++) {
        setTimeout(() => createSpark(), i * 50)
      }
    }, 200 + Math.random() * 300)
  }

  private stopSparkAnimation() {
    if (this.sparkInterval) {
      clearInterval(this.sparkInterval)
      this.sparkInterval = null
    }
  }

  /**
   * Close Madison Square Garden layout - Jumbotron/LED Style
   */
  private closeMSG() {
    // Stop chase light and spark animations
    this.stopChaseLightAnimation()
    this.stopSparkAnimation()

    // Get MSG elements
    const ledGrid = document.getElementById('msg-led-grid')
    const scanlines = document.querySelector('.msg-scanlines') as HTMLElement
    const jumbotron = document.getElementById('msg-jumbotron')
    const bgImage = document.getElementById('msg-bg')
    const eyebrow = document.getElementById('msg-eyebrow')
    const titleLines = document.querySelectorAll('.msg-title-line') as NodeListOf<HTMLElement>
    const infoPanel = document.getElementById('msg-info-panel')
    const stats = document.querySelectorAll('.msg-stat') as NodeListOf<HTMLElement>
    const chaseLights = document.querySelectorAll('.msg-chase-light') as NodeListOf<HTMLElement>

    // Helper to safely clear all children from an element
    const clearChildren = (element: HTMLElement | null) => {
      if (!element) return
      while (element.firstChild) {
        element.removeChild(element.firstChild)
      }
    }

    // Create close timeline
    const tl = gsap.timeline({
      defaults: { ease: 'power2.in' },
      onComplete: () => {
        // Reset all animated elements
        gsap.set(this.morphBox, { clearProps: 'all' })
        gsap.set(this.contentEl, { clearProps: 'all' })
        gsap.set(this.closeBtn, { clearProps: 'all' })
        gsap.set(ledGrid, { clearProps: 'all' })
        gsap.set(scanlines, { clearProps: 'all' })
        gsap.set(jumbotron, { clearProps: 'all' })
        gsap.set(bgImage, { clearProps: 'all' })
        gsap.set(eyebrow, { clearProps: 'all' })
        gsap.set(titleLines, { clearProps: 'all' })
        gsap.set(infoPanel, { clearProps: 'all' })
        gsap.set(stats, { clearProps: 'all' })

        // Remove dynamically created chase lights
        clearChildren(document.getElementById('msg-chase-lights'))

        // data-layout already removed before morph animation
        this.overlay.classList.remove('active')
        this.isOpen = false
        this.isAnimating = false
        this.currentLocationId = null
        this.sourceRect = null
      }
    })

    // Phase 1: Close button spins out
    tl.to(this.closeBtn, {
      duration: 0.3,
      opacity: 0,
      scale: 0.5,
      rotate: 180,
      ease: 'power2.in'
    })

    // Phase 2: Stats fade out
    .to(stats, {
      duration: 0.3,
      opacity: 0,
      y: 20,
      stagger: { each: 0.05, from: 'end' },
      ease: 'power2.in'
    }, '-=0.2')

    // Phase 3: Info panel slides down
    .to(infoPanel, {
      duration: 0.4,
      opacity: 0,
      y: 50,
      ease: 'power2.in'
    }, '-=0.2')

    // Phase 4: Title lines fade out
    .to(titleLines, {
      duration: 0.4,
      opacity: 0,
      y: -20,
      stagger: { each: 0.08, from: 'end' },
      ease: 'power2.in'
    }, '-=0.3')

    // Phase 5: Eyebrow fades
    .to(eyebrow, {
      duration: 0.3,
      opacity: 0,
      y: -15,
      ease: 'power2.in'
    }, '-=0.3')

    // Phase 6: Background image zooms out
    .to(bgImage, {
      duration: 0.5,
      opacity: 0,
      scale: 1.1,
      ease: 'power2.in'
    }, '-=0.3')

    // Phase 7: Jumbotron scales down
    .to(jumbotron, {
      duration: 0.5,
      opacity: 0,
      scale: 0.9,
      ease: 'power3.in'
    }, '-=0.2')

    // Phase 8: Chase lights fade
    .to(chaseLights, {
      duration: 0.3,
      opacity: 0,
      ease: 'power2.in'
    }, '-=0.4')

    // Phase 9: Scanlines and LED grid fade
    .to([scanlines, ledGrid], {
      duration: 0.3,
      opacity: 0,
      ease: 'power2.in'
    }, '-=0.3')

    // Fade out content container
    .to(this.contentEl, {
      duration: 0.2,
      opacity: 0,
      ease: 'power2.in'
    }, '-=0.2')

    // Phase 10: Morph back to source
    const windowW = window.innerWidth
    const windowH = window.innerHeight
    const rect = this.sourceRect

    // Remove layout attribute so overlay background disappears
    // This makes the morph box visible against transparent background
    tl.call(() => {
      this.overlay.removeAttribute('data-layout')
    })

    // Set morph box to fullscreen with MSG dark color
    tl.set(this.morphBox, {
      left: '0px',
      top: '0px',
      width: windowW + 'px',
      height: windowH + 'px',
      borderRadius: 0,
      opacity: 1,
      background: '#0a0a0a'
    })

    // Animate to source position (or center if no rect)
    tl.to(this.morphBox, {
      duration: 0.7,
      left: rect ? rect.left + 'px' : '50%',
      top: rect ? rect.top + 'px' : '50%',
      width: rect ? rect.width + 'px' : '200px',
      height: rect ? rect.height + 'px' : '60px',
      borderRadius: 16,
      ease: 'power3.inOut'
    })

    // Fade out morph box
    tl.to(this.morphBox, {
      duration: 0.3,
      opacity: 0,
      ease: 'power2.out'
    }, '-=0.15')
  }

  /**
   * Open RKO Theatre layout
   */
  private openRKO() {
    // Get dimensions
    const rect = this.sourceRect!
    const windowW = window.innerWidth
    const windowH = window.innerHeight

    // Get RKO elements upfront (they exist in DOM but may not be styled yet)
    const filmstripLeft = document.getElementById('rko-filmstrip-left')
    const filmstripRight = document.getElementById('rko-filmstrip-right')
    const title = document.querySelector('.rko-title') as HTMLElement
    const eyebrow = document.querySelector('.rko-eyebrow') as HTMLElement
    const desc = document.querySelector('.rko-description') as HTMLElement
    const rays = document.querySelectorAll('.rko-rays__beam') as NodeListOf<HTMLElement>
    const star = document.querySelector('.rko-star') as HTMLElement

    // Set morph box color to match RKO background
    gsap.set(this.morphBox, {
      left: rect.left + 'px',
      top: rect.top + 'px',
      width: rect.width + 'px',
      height: rect.height + 'px',
      borderRadius: 16,
      opacity: 1,
      background: '#4a1a2e'
    })

    // Content starts hidden
    gsap.set(this.contentEl, { opacity: 0 })

    // Show overlay (without layout attribute yet - so no background)
    this.overlay.classList.add('active')

    // Create master timeline
    const tl = gsap.timeline({
      defaults: { ease: 'expo.inOut' },
      onComplete: () => {
        this.isAnimating = false
      }
    })

    // Phase 1: Morph box expands to fullscreen
    tl.to(this.morphBox, {
      duration: 0.7,
      left: '0px',
      top: '0px',
      width: windowW + 'px',
      height: windowH + 'px',
      borderRadius: 0,
      ease: 'power3.inOut'
    })

    // Set layout attribute when morph reaches fullscreen (before it fades)
    tl.call(() => {
      this.overlay.setAttribute('data-layout', 'rko')

      // Split title text for character animation
      if (title && !this.rkoTitleSplitText) {
        this.rkoTitleSplitText = splitText(title, { type: 'chars,words' })
      }

      // Title chars hidden for reveal
      if (this.rkoTitleSplitText) {
        gsap.set(this.rkoTitleSplitText.chars, {
          opacity: 0,
          rotateY: 90,
          xPercent: -40,
          yPercent: 60,
          scale: 0.6
        })
      }
      gsap.set(title, { opacity: 1 })
      gsap.set(eyebrow, { opacity: 0, y: -20 })
      gsap.set(desc, { opacity: 0, y: 30 })
      gsap.set(filmstripLeft, { y: '-100%' })
      gsap.set(filmstripRight, { y: '100%' })
      gsap.set(rays, { opacity: 0 })
      gsap.set(star, { opacity: 0, scale: 0 })
      gsap.set(this.closeBtn, { opacity: 0, scale: 0.5, rotate: -180 })

      // Now show content
      gsap.set(this.contentEl, { opacity: 1 })
    })

    // Phase 2: Morph box fades out
    tl.to(this.morphBox, {
      duration: 0.3,
      opacity: 0,
      ease: 'power2.out'
    }, '-=0.1')

    // Phase 3: Film strips slide in from top and bottom
    tl.to(filmstripLeft, {
      duration: 0.9,
      y: '0%',
      ease: 'power3.out'
    }, '-=0.2')

    tl.to(filmstripRight, {
      duration: 0.9,
      y: '0%',
      ease: 'power3.out'
    }, '-=0.8')

    // Phase 4: Spotlight rays fade in
    tl.to(rays, {
      duration: 0.6,
      opacity: 1,
      stagger: 0.05,
      ease: 'power2.out'
    }, '-=0.6')

    // Phase 5: Eyebrow drops in
    tl.to(eyebrow, {
      duration: 0.5,
      opacity: 1,
      y: 0,
      ease: 'back.out(1.7)'
    }, '-=0.4')

    // Phase 6: Title characters animate in - use call since splitText happens in callback
    tl.call(() => {
      if (this.rkoTitleSplitText && this.rkoTitleSplitText.chars.length > 0) {
        animate3DText({
          element: title,
          splitResult: this.rkoTitleSplitText,
          duration: 1,
          ease: easingPresets.lookbookText,
          stagger: 0.02
        })
      } else if (title) {
        animateTextWithFilter(title, {
          duration: 1,
          ease: 'expo.out',
          startBlur: 60,
          startScale: 180
        })
      }
    }, [], '-=0.3')

    // Phase 7: Description fades in
    tl.to(desc, {
      duration: 0.8,
      opacity: 1,
      y: 0,
      ease: 'back.out(1.7)'
    }, '-=0.6')

    // Phase 8: Star pops in
    tl.to(star, {
      duration: 0.5,
      opacity: 1,
      scale: 1,
      ease: 'back.out(3)'
    }, '-=0.4')

    // Phase 9: Close button spins in
    tl.to(this.closeBtn, {
      duration: 0.5,
      opacity: 1,
      scale: 1,
      rotate: 0,
      ease: 'back.out(2.5)'
    }, '-=0.3')
  }

  /**
   * Close RKO Theatre layout
   */
  private closeRKO() {
    // Get RKO elements
    const filmstripLeft = document.getElementById('rko-filmstrip-left')
    const filmstripRight = document.getElementById('rko-filmstrip-right')
    const title = document.querySelector('.rko-title') as HTMLElement
    const eyebrow = document.querySelector('.rko-eyebrow') as HTMLElement
    const desc = document.querySelector('.rko-description') as HTMLElement
    const rays = document.querySelectorAll('.rko-rays__beam') as NodeListOf<HTMLElement>
    const star = document.querySelector('.rko-star') as HTMLElement

    // Create close timeline
    const tl = gsap.timeline({
      defaults: { ease: 'expo.inOut' },
      onComplete: () => {
        // Revert split text
        if (this.rkoTitleSplitText) {
          this.rkoTitleSplitText.revert()
          this.rkoTitleSplitText = null
        }

        // Reset all animated elements
        gsap.set(this.morphBox, { clearProps: 'all' })
        gsap.set(this.contentEl, { clearProps: 'all' })
        gsap.set(this.closeBtn, { clearProps: 'all' })
        gsap.set(filmstripLeft, { clearProps: 'all' })
        gsap.set(filmstripRight, { clearProps: 'all' })
        gsap.set(rays, { clearProps: 'all' })
        gsap.set(star, { clearProps: 'all' })
        gsap.set(eyebrow, { clearProps: 'all' })
        gsap.set(desc, { clearProps: 'all' })

        if (title) {
          resetTextFilter(title)
          gsap.set(title, { clearProps: 'all' })
        }

        // data-layout already removed before morph animation
        this.overlay.classList.remove('active')
        this.isOpen = false
        this.isAnimating = false
        this.currentLocationId = null
        this.sourceRect = null

      }
    })

    // Phase 1: Close button spins out
    tl.to(this.closeBtn, {
      duration: 0.3,
      opacity: 0,
      scale: 0.5,
      rotate: 180,
      ease: 'power2.in'
    })

    // Phase 2: Star shrinks out
    tl.to(star, {
      duration: 0.3,
      opacity: 0,
      scale: 0,
      ease: 'power2.in'
    }, '-=0.2')

    // Phase 3: Description fades out
    tl.to(desc, {
      duration: 0.4,
      opacity: 0,
      y: -30,
      ease: 'power2.in'
    }, '-=0.2')

    // Phase 4: Eyebrow fades out
    tl.to(eyebrow, {
      duration: 0.3,
      opacity: 0,
      y: -20,
      ease: 'power2.in'
    }, '-=0.3')

    // Phase 5: Title characters fly out
    if (this.rkoTitleSplitText && this.rkoTitleSplitText.chars.length > 0) {
      tl.to(this.rkoTitleSplitText.chars, {
        duration: 0.4,
        opacity: 0,
        rotateY: -90,
        yPercent: -50,
        scale: 0.7,
        stagger: {
          each: 0.015,
          from: 'end'
        },
        ease: 'power2.in'
      }, '-=0.2')
    } else {
      tl.to(title, {
        duration: 0.5,
        opacity: 0,
        y: -30,
        ease: 'power2.in'
      }, '-=0.2')
    }

    // Phase 6: Rays fade out
    tl.to(rays, {
      duration: 0.3,
      opacity: 0,
      ease: 'power2.in'
    }, '-=0.3')

    // Phase 7: Film strips slide out
    tl.to(filmstripLeft, {
      duration: 0.7,
      y: '-100%',
      ease: 'power3.in'
    }, '-=0.2')

    tl.to(filmstripRight, {
      duration: 0.7,
      y: '100%',
      ease: 'power3.in'
    }, '-=0.6')

    // Fade out content container
    tl.to(this.contentEl, {
      duration: 0.3,
      opacity: 0,
      ease: 'power2.in'
    }, '-=0.4')

    // Phase 8: Morph back to source
    if (this.sourceRect) {
      const windowW = window.innerWidth
      const windowH = window.innerHeight
      const rect = this.sourceRect

      // Remove layout attribute so overlay background disappears
      // This makes the morph box visible against transparent background
      tl.call(() => {
        this.overlay.removeAttribute('data-layout')
      })

      // Set morph box to fullscreen with RKO color
      tl.set(this.morphBox, {
        left: '0px',
        top: '0px',
        width: windowW + 'px',
        height: windowH + 'px',
        borderRadius: 0,
        opacity: 1,
        background: '#4a1a2e'
      })

      // Animate to source position
      tl.to(this.morphBox, {
        duration: 0.7,
        left: rect.left + 'px',
        top: rect.top + 'px',
        width: rect.width + 'px',
        height: rect.height + 'px',
        borderRadius: 16,
        ease: 'power3.inOut'
      })

      // Fade out morph box
      tl.to(this.morphBox, {
        duration: 0.3,
        opacity: 0,
        ease: 'power2.out'
      }, '-=0.15')
    }
  }

  /**
   * Open CBS Studios layout - Scattered collage with overlapping images
   */
  private openCBS() {
    // Get dimensions
    const rect = this.sourceRect!
    const windowW = window.innerWidth
    const windowH = window.innerHeight

    // Get CBS elements upfront
    const images = document.querySelectorAll('.cbs-image') as NodeListOf<HTMLElement>
    const title = document.querySelector('.cbs-title') as HTMLElement
    const desc = document.querySelector('.cbs-description') as HTMLElement
    const onAir = document.getElementById('cbs-onair') as HTMLElement

    // Set morph box color to match CBS background
    gsap.set(this.morphBox, {
      left: rect.left + 'px',
      top: rect.top + 'px',
      width: rect.width + 'px',
      height: rect.height + 'px',
      borderRadius: 16,
      opacity: 1,
      background: '#1e3a5f'
    })

    // Content starts hidden
    gsap.set(this.contentEl, { opacity: 0 })

    // Show overlay (without layout attribute yet - so no background)
    this.overlay.classList.add('active')

    // Create master timeline
    const tl = gsap.timeline({
      defaults: { ease: 'expo.inOut' },
      onComplete: () => {
        this.isAnimating = false
      }
    })

    // Phase 1: Morph box expands to fullscreen
    tl.to(this.morphBox, {
      duration: 0.7,
      left: '0px',
      top: '0px',
      width: windowW + 'px',
      height: windowH + 'px',
      borderRadius: 0,
      ease: 'power3.inOut'
    })

    // Set layout attribute when morph reaches fullscreen (before it fades)
    tl.call(() => {
      this.overlay.setAttribute('data-layout', 'cbs')

      // Split title text for character animation
      if (title && !this.cbsTitleSplitText) {
        this.cbsTitleSplitText = splitText(title, { type: 'chars,words' })
      }

      // Title chars hidden for reveal
      if (this.cbsTitleSplitText) {
        gsap.set(this.cbsTitleSplitText.chars, {
          opacity: 0,
          rotateY: 90,
          xPercent: -40,
          yPercent: 60,
          scale: 0.6
        })
      }
      gsap.set(title, { opacity: 1 })
      gsap.set(desc, { opacity: 0, y: 30 })
      gsap.set(onAir, { opacity: 0, x: -20 })
      gsap.set(images, { opacity: 0 })
      gsap.set(this.closeBtn, { opacity: 0, scale: 0.5, rotate: -180 })

      // Now show content
      gsap.set(this.contentEl, { opacity: 1 })
    })

    // Phase 2: Morph box fades out
    tl.to(this.morphBox, {
      duration: 0.3,
      opacity: 0,
      ease: 'power2.out'
    }, '-=0.15')

    // Phase 3: ON AIR indicator fades in
    tl.to(onAir, {
      duration: 0.5,
      opacity: 1,
      x: 0,
      ease: 'power2.out'
    }, '-=0.2')

    // Phase 4: Images fly in from different directions with stagger
    // Each image has its own unique entrance
    const imageAnimations = [
      { x: 0, y: 0, rotate: 3, scale: 1 },   // Image 1 - from top right
      { x: 0, y: 0, rotate: -2, scale: 1 },  // Image 2 - from right
      { x: 0, y: 0, rotate: 6, scale: 1 },   // Image 3 - from top
      { x: 0, y: 0, rotate: -4, scale: 1 },  // Image 4 - from bottom right
      { x: 0, y: 0, rotate: 2, scale: 1 },   // Image 5 - from bottom
    ]

    images.forEach((img, i) => {
      const anim = imageAnimations[i] ?? { x: 0, y: 0, rotate: 0, scale: 1 }
      tl.to(img, {
        duration: 0.9,
        opacity: 1,
        x: anim.x,
        y: anim.y,
        rotate: anim.rotate,
        scale: anim.scale,
        ease: 'back.out(1.2)'
      }, i === 0 ? '-=0.25' : `-=${0.75 - i * 0.08}`)
    })

    // Phase 5: Title characters animate in - use call since splitText happens in callback
    tl.call(() => {
      if (this.cbsTitleSplitText && this.cbsTitleSplitText.chars.length > 0) {
        animate3DText({
          element: title,
          splitResult: this.cbsTitleSplitText,
          duration: 1,
          ease: easingPresets.lookbookText,
          stagger: 0.02
        })
      } else if (title) {
        animateTextWithFilter(title, {
          duration: 1,
          ease: 'expo.out',
          startBlur: 60,
          startScale: 180
        })
      }
    }, [], '-=0.6')

    // Phase 6: Description fades up
    tl.to(desc, {
      duration: 0.8,
      opacity: 1,
      y: 0,
      ease: 'power2.out'
    }, '-=0.5')

    // Phase 7: Close button spins in
    tl.to(this.closeBtn, {
      duration: 0.5,
      opacity: 1,
      scale: 1,
      rotate: 0,
      ease: 'back.out(2.5)'
    }, '-=0.3')
  }

  /**
   * Close CBS Studios layout
   */
  private closeCBS() {
    // Get CBS elements
    const images = document.querySelectorAll('.cbs-image') as NodeListOf<HTMLElement>
    const title = document.querySelector('.cbs-title') as HTMLElement
    const desc = document.querySelector('.cbs-description') as HTMLElement
    const onAir = document.getElementById('cbs-onair') as HTMLElement

    // Create close timeline
    const tl = gsap.timeline({
      defaults: { ease: 'expo.inOut' },
      onComplete: () => {
        // Revert split text
        if (this.cbsTitleSplitText) {
          this.cbsTitleSplitText.revert()
          this.cbsTitleSplitText = null
        }

        // Reset all animated elements
        gsap.set(this.morphBox, { clearProps: 'all' })
        gsap.set(this.contentEl, { clearProps: 'all' })
        gsap.set(this.closeBtn, { clearProps: 'all' })
        gsap.set(images, { clearProps: 'all' })
        gsap.set(desc, { clearProps: 'all' })
        gsap.set(onAir, { clearProps: 'all' })

        if (title) {
          resetTextFilter(title)
          gsap.set(title, { clearProps: 'all' })
        }

        // data-layout already removed before morph animation
        this.overlay.classList.remove('active')
        this.isOpen = false
        this.isAnimating = false
        this.currentLocationId = null
        this.sourceRect = null
      }
    })

    // Phase 1: Close button spins out
    tl.to(this.closeBtn, {
      duration: 0.3,
      opacity: 0,
      scale: 0.5,
      rotate: 180,
      ease: 'power2.in'
    })

    // Phase 2: Description fades down
    tl.to(desc, {
      duration: 0.4,
      opacity: 0,
      y: 30,
      ease: 'power2.in'
    }, '-=0.2')

    // Phase 3: Title characters fly out
    if (this.cbsTitleSplitText && this.cbsTitleSplitText.chars.length > 0) {
      tl.to(this.cbsTitleSplitText.chars, {
        duration: 0.4,
        opacity: 0,
        rotateY: -90,
        yPercent: -50,
        scale: 0.7,
        stagger: {
          each: 0.015,
          from: 'end'
        },
        ease: 'power2.in'
      }, '-=0.3')
    } else {
      tl.to(title, {
        duration: 0.5,
        opacity: 0,
        y: -30,
        ease: 'power2.in'
      }, '-=0.3')
    }

    // Phase 4: Images fly out in different directions
    const imagesArray = Array.from(images).reverse()
    imagesArray.forEach((img, i) => {
      // Each flies back to its original off-screen position
      const directions = [
        { x: 80, y: 100, scale: 0.8 },
        { x: 120, y: 60, scale: 0.8 },
        { x: -50, y: -100, scale: 0.7 },
        { x: 60, y: 100, scale: 0.8 },
        { x: 100, y: -80, scale: 0.8 },
      ]
      const dir = directions[4 - i] ?? { x: 0, y: 0, scale: 0.8 }
      tl.to(img, {
        duration: 0.6,
        opacity: 0,
        x: dir.x,
        y: dir.y,
        scale: dir.scale,
        ease: 'power3.in'
      }, i === 0 ? '-=0.2' : '-=0.5')
    })

    // Phase 5: ON AIR fades out
    tl.to(onAir, {
      duration: 0.3,
      opacity: 0,
      x: -20,
      ease: 'power2.in'
    }, '-=0.3')

    // Fade out content container
    tl.to(this.contentEl, {
      duration: 0.3,
      opacity: 0,
      ease: 'power2.in'
    }, '-=0.2')

    // Phase 6: Morph back to source - capture rect now before timeline runs
    const windowW = window.innerWidth
    const windowH = window.innerHeight
    const rect = this.sourceRect

    // Remove layout attribute so overlay background disappears
    // This makes the morph box visible against transparent background
    tl.call(() => {
      this.overlay.removeAttribute('data-layout')
    })

    // Set morph box to fullscreen with CBS color
    tl.set(this.morphBox, {
      left: '0px',
      top: '0px',
      width: windowW + 'px',
      height: windowH + 'px',
      borderRadius: 0,
      opacity: 1,
      background: '#1e3a5f'
    })

    // Animate to source position (or center if no rect)
    tl.to(this.morphBox, {
      duration: 0.7,
      left: rect ? rect.left + 'px' : '50%',
      top: rect ? rect.top + 'px' : '50%',
      width: rect ? rect.width + 'px' : '200px',
      height: rect ? rect.height + 'px' : '60px',
      borderRadius: 16,
      ease: 'power3.inOut'
    })

    // Fade out morph box
    tl.to(this.morphBox, {
      duration: 0.3,
      opacity: 0,
      ease: 'power2.out'
    }, '-=0.15')
  }

  getCurrentLocationId() {
    return this.currentLocationId
  }

  getIsOpen() {
    return this.isOpen
  }
}

// Export singleton instance
let detailOverlayInstance: DetailOverlay | null = null

export function initDetailOverlay(): DetailOverlay {
  if (!detailOverlayInstance) {
    detailOverlayInstance = new DetailOverlay()
  }
  return detailOverlayInstance
}

export function getDetailOverlay(): DetailOverlay | null {
  return detailOverlayInstance
}

// HMR support - clean up on hot reload
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (detailOverlayInstance) {
      // Force close and cleanup - cast to access private members for HMR
      const instance = detailOverlayInstance as unknown as {
        mouseParallax?: { destroy: () => void }
        titleSplitText?: { revert: () => void }
        carnegieShiftController?: { destroy: () => void }
        carnegieTitleSplitText?: { revert: () => void }
        chaseLightInterval?: ReturnType<typeof setInterval>
        sparkInterval?: ReturnType<typeof setInterval>
        rkoTitleSplitText?: { revert: () => void }
        cbsVuMeterInterval?: ReturnType<typeof setInterval>
        overlay?: HTMLElement
        morphBox?: HTMLElement
      }
      if (instance.mouseParallax) {
        instance.mouseParallax.destroy()
      }
      if (instance.titleSplitText) {
        instance.titleSplitText.revert()
      }
      // Carnegie Hall cleanup
      if (instance.carnegieShiftController) {
        instance.carnegieShiftController.destroy()
      }
      if (instance.carnegieTitleSplitText) {
        instance.carnegieTitleSplitText.revert()
      }
      // MSG cleanup
      if (instance.chaseLightInterval) {
        clearInterval(instance.chaseLightInterval)
      }
      if (instance.sparkInterval) {
        clearInterval(instance.sparkInterval)
      }
      // RKO cleanup
      if (instance.rkoTitleSplitText) {
        instance.rkoTitleSplitText.revert()
      }
      // CBS cleanup
      if (instance.cbsVuMeterInterval) {
        clearInterval(instance.cbsVuMeterInterval)
      }
      // Reset overlay state
      instance.overlay?.classList.remove('active')
      instance.overlay?.removeAttribute('data-layout')
      // Clear GSAP props
      if (instance.morphBox) {
        gsap.set(instance.morphBox, { clearProps: 'all' })
      }
    }
    detailOverlayInstance = null
  })
}
