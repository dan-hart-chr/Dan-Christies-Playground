import { NYC_LOCATIONS } from './locations'
import { animateTextWithFilter, resetTextFilter } from './textFilterEffect'
import {
  splitText,
  createMouseParallax,
  animate3DText,
  easingPresets,
  type SplitTextResult,
  type ParallaxController
} from './edSullivanEffects'
import { createBackgroundShift, type ShiftController } from './carnegieHallEffects'
import { NassauLaserEffect } from './nassauLasers'
import gsap from 'gsap'

// Locations that have detail overlays (all except Christie's)
const OVERLAY_LOCATION_IDS = [
  'mannys-music',
  'rko-theatre',
  'carnegie-hall',
  'madison-square-garden',
  'shea-stadium',
  'town-hall',
  'radio-city',
  'hendrix-apartment',
  'apollo-theatre',
  'belmont-park',
  'nassau-coliseum'
]

// Map location IDs to layout attribute values
const LAYOUT_MAP: Record<string, string> = {
  'mannys-music': 'mannys',
  'rko-theatre': 'rko',
  'carnegie-hall': 'carnegiehall',
  'madison-square-garden': 'msg',
  'shea-stadium': 'shea',
  'town-hall': 'townhall',
  'radio-city': 'radiocity',
  'hendrix-apartment': 'hendrix',
  'apollo-theatre': 'apollo',
  'belmont-park': 'belmont',
  'nassau-coliseum': 'nassau'
}

// Background colors for each layout's morph box
const MORPH_COLORS: Record<string, string> = {
  'mannys-music': '#0a0a0f',
  'rko-theatre': '#000000',
  'carnegie-hall': '#d65430',
  'madison-square-garden': '#000000',
  'shea-stadium': '#0a1628',
  'town-hall': '#0a0e2a',
  'radio-city': '#08080c',
  'hendrix-apartment': '#000000',
  'apollo-theatre': '#1a0505',
  'belmont-park': '#0a1a0a',
  'nassau-coliseum': '#0a0a1a'
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
  private sourceRect: DOMRect | null = null
  private triggerElement: HTMLElement | null = null
  private focusTrapHandler: ((e: KeyboardEvent) => void) | null = null
  private escapeHandler: ((e: KeyboardEvent) => void) | null = null

  // Split text instances for each location
  private splitTexts: Record<string, SplitTextResult | null> = {}

  // Effect controllers
  private mouseParallax: ParallaxController | null = null
  private carnegieShiftController: ShiftController | null = null

  // MSG specific
  private chaseLightInterval: ReturnType<typeof setInterval> | null = null
  private sparkInterval: ReturnType<typeof setInterval> | null = null
  private msgChaseLights: HTMLElement[] | null = null

  // Apollo specific
  private apolloMarqueeInterval: ReturnType<typeof setInterval> | null = null
  private apolloMarqueeBulbs: HTMLElement[] | null = null
  private apolloMarqueeGroups: HTMLElement[][] = []

  // Nassau specific
  private nassauLaserEffect: NassauLaserEffect | null = null

  constructor() {
    this.overlay = document.getElementById('detail-overlay')!
    this.closeBtn = document.getElementById('detail-close')!
    this.morphBox = document.getElementById('morph-box')!
    this.contentEl = document.getElementById('detail-content')!
    this.bindEvents()
  }

  private bindEvents() {
    this.closeBtn.addEventListener('click', () => this.close())
    this.escapeHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close()
      }
    }
    document.addEventListener('keydown', this.escapeHandler)
  }

  private enableFocusTrap() {
    this.focusTrapHandler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const focusable = this.overlay.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return
      const first = focusable[0]!
      const last = focusable[focusable.length - 1]!
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', this.focusTrapHandler)
  }

  private disableFocusTrap() {
    if (this.focusTrapHandler) {
      document.removeEventListener('keydown', this.focusTrapHandler)
      this.focusTrapHandler = null
    }
  }

  // ─── COMMON ANIMATION HELPERS ───────────────────────────────────────

  private morphOpen(color: string, onLayoutReady?: () => void): gsap.core.Timeline {
    const rect = this.sourceRect!
    const windowW = window.innerWidth
    const windowH = window.innerHeight

    // Position morphBox over the source element
    gsap.set(this.morphBox, {
      left: rect.left + 'px',
      top: rect.top + 'px',
      width: rect.width + 'px',
      height: rect.height + 'px',
      borderRadius: 16,
      opacity: 1,
      background: color
    })

    // Keep content hidden — layout and content are set up AFTER the morphBox
    // has expanded to cover the screen, so the background never flashes in early
    gsap.set(this.contentEl, { opacity: 0 })
    this.overlay.classList.add('active')
    this.overlay.removeAttribute('aria-hidden')

    const tl = gsap.timeline()

    tl.to(this.morphBox, {
      duration: 0.7,
      left: '0px',
      top: '0px',
      width: windowW + 'px',
      height: windowH + 'px',
      borderRadius: 0,
      ease: 'power3.inOut'
    })

    // MorphBox now covers the screen — safe to set layout and reveal content behind it
    tl.call(() => {
      this.overlay.setAttribute('data-layout', LAYOUT_MAP[this.currentLocationId!]!)
      if (onLayoutReady) onLayoutReady()
      gsap.set(this.contentEl, { opacity: 1 })
    }, undefined, '-=0.15')

    tl.to(this.morphBox, {
      duration: 0.3,
      opacity: 0,
      ease: 'power2.out'
    }, '-=0.15')

    return tl
  }

  private morphClose(color: string): gsap.core.Timeline {
    const windowW = window.innerWidth
    const windowH = window.innerHeight
    const rect = this.sourceRect

    const tl = gsap.timeline()

    // Set morphBox to full screen but invisible
    tl.set(this.morphBox, {
      left: '0px',
      top: '0px',
      width: windowW + 'px',
      height: windowH + 'px',
      borderRadius: 0,
      opacity: 0,
      background: color
    })

    // Fade morphBox in to cover the content
    tl.to(this.morphBox, {
      duration: 0.3,
      opacity: 1,
      ease: 'power2.in'
    })

    // Now that morphBox covers everything, hide content and remove layout
    tl.call(() => {
      gsap.set(this.contentEl, { opacity: 0 })
      this.overlay.removeAttribute('data-layout')
    })

    // Shrink morphBox back to the button
    tl.to(this.morphBox, {
      duration: 0.7,
      left: rect ? rect.left + 'px' : '50%',
      top: rect ? rect.top + 'px' : '50%',
      width: rect ? rect.width + 'px' : '200px',
      height: rect ? rect.height + 'px' : '60px',
      borderRadius: 16,
      ease: 'power3.inOut'
    })

    tl.to(this.morphBox, {
      duration: 0.3,
      opacity: 0,
      ease: 'power2.out'
    }, '-=0.15')

    return tl
  }

  private closeButtonIn(tl: gsap.core.Timeline) {
    gsap.set(this.closeBtn, { opacity: 0 })
    tl.to(this.closeBtn, {
      duration: 0.3,
      opacity: 1,
      ease: 'power2.out'
    }, 0.4)
  }

  private closeButtonOut(tl: gsap.core.Timeline) {
    tl.to(this.closeBtn, {
      duration: 0.2,
      opacity: 0,
      ease: 'power2.in'
    })
  }

  private titleAnimateIn(
    tl: gsap.core.Timeline,
    titleEl: HTMLElement,
    splitKey: string,
    offset = '-=0.3'
  ) {
    if (!this.splitTexts[splitKey]) {
      this.splitTexts[splitKey] = splitText(titleEl, { type: 'chars,words' })
    }
    const split = this.splitTexts[splitKey]!

    gsap.set(split.chars, {
      opacity: 0,
      rotateY: 90,
      xPercent: -40,
      yPercent: 60,
      scale: 0.6
    })
    gsap.set(titleEl, { opacity: 1 })

    if (split.chars.length > 0) {
      tl.add(
        animate3DText({
          element: titleEl,
          splitResult: split,
          duration: 1,
          ease: easingPresets.lookbookText,
          stagger: 0.02
        }),
        offset
      )
    } else {
      tl.add(() => {
        animateTextWithFilter(titleEl, {
          duration: 1,
          ease: 'expo.out',
          startBlur: 60,
          startScale: 180
        })
      }, offset)
    }
  }

  private titleAnimateOut(tl: gsap.core.Timeline, splitKey: string, titleEl: HTMLElement, offset = '-=0.3') {
    const split = this.splitTexts[splitKey]
    if (split && split.chars.length > 0) {
      tl.to(split.chars, {
        duration: 0.4,
        opacity: 0,
        rotateY: -90,
        yPercent: -50,
        scale: 0.7,
        stagger: { each: 0.015, from: 'end' },
        ease: 'power2.in'
      }, offset)
    } else {
      tl.to(titleEl, {
        duration: 0.5,
        opacity: 0,
        y: -30,
        ease: 'power2.in'
      }, offset)
    }
  }

  private resetState(elements: (HTMLElement | NodeListOf<HTMLElement> | null)[], splitKeys: string[]) {
    // Kill any in-flight tweens (e.g. parallax reset) before clearing props
    elements.forEach(el => {
      if (el) gsap.killTweensOf(el)
    })

    gsap.set(this.morphBox, { clearProps: 'all' })
    gsap.set(this.contentEl, { clearProps: 'all' })
    gsap.set(this.closeBtn, { clearProps: 'all' })

    elements.forEach(el => {
      if (el) gsap.set(el, { clearProps: 'all' })
    })

    splitKeys.forEach(key => {
      if (this.splitTexts[key]) {
        this.splitTexts[key]!.revert()
        this.splitTexts[key] = null
      }
    })

    // Clean up Nassau laser effect
    if (this.nassauLaserEffect) {
      this.nassauLaserEffect.stop()
      this.nassauLaserEffect.destroy()
      this.nassauLaserEffect = null
    }

    // Disable focus trap
    this.disableFocusTrap()

    // Set aria-hidden when closed
    this.overlay.setAttribute('aria-hidden', 'true')

    // Restore aria-hidden on background
    const app = document.getElementById('app')
    if (app) {
      Array.from(app.children).forEach(child => {
        (child as HTMLElement).removeAttribute('aria-hidden')
      })
    }

    // Restore focus to trigger element
    if (this.triggerElement) {
      this.triggerElement.focus()
      this.triggerElement = null
    }

    this.overlay.removeAttribute('data-layout')
    this.overlay.classList.remove('active')
    this.isOpen = false
    this.isAnimating = false
    this.currentLocationId = null
    this.sourceRect = null
  }

  // ─── OPEN ENTRY POINT ──────────────────────────────────────────────

  open(locationId: string, fromElement: HTMLElement) {
    if (this.isOpen || this.isAnimating) return
    if (!OVERLAY_LOCATION_IDS.includes(locationId)) return

    this.isAnimating = true
    this.isOpen = true
    this.currentLocationId = locationId
    this.triggerElement = fromElement

    const location = NYC_LOCATIONS.find(l => l.id === locationId)
    if (!location) return

    this.sourceRect = fromElement.getBoundingClientRect()

    // Set aria-label to current location name
    this.overlay.setAttribute('aria-label', `${location.name} details`)

    // Hide background from screen readers
    const app = document.getElementById('app')
    if (app) {
      Array.from(app.children).forEach(child => {
        if (child !== this.overlay) {
          (child as HTMLElement).setAttribute('aria-hidden', 'true')
        }
      })
    }

    // Enable focus trap and focus close button after animation
    this.enableFocusTrap()

    switch (locationId) {
      case 'mannys-music': this.openMannys(); break
      case 'rko-theatre': this.openRKO(); break
      case 'carnegie-hall': this.openCarnegieHall(); break
      case 'madison-square-garden': this.openMSG(); break
      case 'shea-stadium': this.openShea(); break
      case 'town-hall': this.openTownHall(); break
      case 'radio-city': this.openRadioCity(); break
      case 'hendrix-apartment': this.openHendrix(); break
      case 'apollo-theatre': this.openApollo(); break
      case 'belmont-park': this.openBelmont(); break
      case 'nassau-coliseum': this.openNassau(); break
    }
  }

  // ─── CLOSE ENTRY POINT ─────────────────────────────────────────────

  close() {
    if (!this.isOpen || this.isAnimating) return
    this.isAnimating = true

    switch (this.currentLocationId) {
      case 'mannys-music': this.closeMannys(); break
      case 'rko-theatre': this.closeRKO(); break
      case 'carnegie-hall': this.closeCarnegieHall(); break
      case 'madison-square-garden': this.closeMSG(); break
      case 'shea-stadium': this.closeShea(); break
      case 'town-hall': this.closeTownHall(); break
      case 'radio-city': this.closeRadioCity(); break
      case 'hendrix-apartment': this.closeHendrix(); break
      case 'apollo-theatre': this.closeApollo(); break
      case 'belmont-park': this.closeBelmont(); break
      case 'nassau-coliseum': this.closeNassau(); break
    }
  }

  // ─── MANNY'S MUSIC ─────────────────────────────────────────────────

  private openMannys() {
    const color = MORPH_COLORS['mannys-music']!
    const title = document.querySelector('.mannys-title') as HTMLElement
    const desc = document.querySelector('.mannys-description') as HTMLElement
    const eyebrow = document.querySelector('.mannys-eyebrow') as HTMLElement
    const images = document.querySelectorAll('.mannys-image') as NodeListOf<HTMLElement>
    const viewLot = document.querySelector('#detail-mannys .view-lot-btn') as HTMLElement

    const tl = this.morphOpen(color, () => {
      gsap.set(eyebrow, { opacity: 0, y: -20 })
      gsap.set(desc, { opacity: 0, y: 30 })
      gsap.set(images, {
        opacity: 0,
        x: 0,
        xPercent: 0,
        yPercent: 0,
        rotation: 0,
        rotateX: 0,
        rotateY: 0
      })
      if (viewLot) gsap.set(viewLot, { opacity: 0, y: 20 })
      gsap.set(this.closeBtn, { opacity: 0 })
    })

    tl.defaults = { ease: 'expo.out' }

    tl.to(images, {
      duration: 0.9,
      opacity: 1,
      stagger: 0.15,
      ease: 'power2.out'
    }, '-=0.2')

    tl.to(eyebrow, {
      duration: 0.5,
      opacity: 1,
      y: 0,
      ease: 'power3.out'
    }, '-=0.6')

    this.titleAnimateIn(tl, title, 'mannys', '-=0.4')

    tl.to(desc, {
      duration: 0.8,
      opacity: 1,
      y: 0,
      ease: 'back.out(1.7)'
    }, '-=0.5')

    if (viewLot) {
      tl.to(viewLot, {
        duration: 0.6,
        opacity: 1,
        y: 0,
        ease: 'power3.out'
      }, '-=0.3')
    }

    this.closeButtonIn(tl)

    tl.eventCallback('onComplete', () => {
      this.isAnimating = false
      this.closeBtn.focus()
      if (!this.mouseParallax) {
        this.mouseParallax = createMouseParallax({
          elements: images,
          depths: [1.2],
          maxMovement: 20,
          maxRotation: 3,
          smoothness: 0.85
        })
      }
      this.mouseParallax.enable()
    })
  }

  private closeMannys() {
    if (this.mouseParallax) this.mouseParallax.disable()

    const title = document.querySelector('.mannys-title') as HTMLElement
    const desc = document.querySelector('.mannys-description') as HTMLElement
    const eyebrow = document.querySelector('.mannys-eyebrow') as HTMLElement
    const images = document.querySelectorAll('.mannys-image') as NodeListOf<HTMLElement>
    const viewLot = document.querySelector('#detail-mannys .view-lot-btn') as HTMLElement

    const tl = gsap.timeline({
      defaults: { ease: 'power2.in' },
      onComplete: () => {
        if (this.mouseParallax) { this.mouseParallax.destroy(); this.mouseParallax = null }
        if (title) resetTextFilter(title)
        this.resetState([images, desc, eyebrow, title, viewLot], ['mannys'])
      }
    })

    this.closeButtonOut(tl)
    if (viewLot) tl.to(viewLot, { duration: 0.5, opacity: 0, y: 20, ease: 'power2.in' }, 0.15)
    tl.to(desc, { duration: 0.4, opacity: 0, y: -30 }, '-=0.2')
    this.titleAnimateOut(tl, 'mannys', title, '-=0.3')
    tl.to(eyebrow, { duration: 0.3, opacity: 0, y: -20 }, '-=0.3')
    tl.to(images, { duration: 0.5, opacity: 0, stagger: 0.08 }, '-=0.3')
    tl.add(this.morphClose(MORPH_COLORS['mannys-music']!), '+=0.1')
  }

  // ─── RKO THEATRE ───────────────────────────────────────────────────

  private openRKO() {
    const color = MORPH_COLORS['rko-theatre']!
    const heroImage = document.getElementById('rko-hero-image')
    const title = document.querySelector('.rko-title') as HTMLElement
    const eyebrow = document.querySelector('.rko-eyebrow') as HTMLElement
    const desc = document.querySelector('.rko-description') as HTMLElement
    const rays = document.querySelectorAll('.rko-rays__beam') as NodeListOf<HTMLElement>
    const star = document.querySelector('.rko-star') as HTMLElement
    const viewLot = document.querySelector('#detail-rko .view-lot-btn') as HTMLElement

    const tl = this.morphOpen(color, () => {
      gsap.set(heroImage, { opacity: 0, scale: 0.85, rotate: -3 })
      gsap.set(eyebrow, { opacity: 0, y: -20 })
      gsap.set(desc, { opacity: 0, y: 30 })
      gsap.set(rays, { opacity: 0 })
      gsap.set(star, { opacity: 0, scale: 0 })
      if (viewLot) gsap.set(viewLot, { opacity: 0, y: 20 })
      gsap.set(this.closeBtn, { opacity: 0 })
    })

    tl.to(rays, { duration: 0.6, opacity: 1, stagger: 0.05, ease: 'power2.out' }, '-=0.2')
    tl.to(heroImage, { duration: 1, opacity: 1, scale: 1, rotate: 0, ease: 'back.out(1.4)' }, '-=0.4')
    tl.to(eyebrow, { duration: 0.5, opacity: 1, y: 0, ease: 'back.out(1.7)' }, '-=0.5')
    this.titleAnimateIn(tl, title, 'rko', '-=0.3')
    tl.to(desc, { duration: 0.8, opacity: 1, y: 0, ease: 'back.out(1.7)' }, '-=0.6')
    if (viewLot) { tl.to(viewLot, { duration: 0.6, opacity: 1, y: 0, ease: 'power3.out' }, '-=0.3') }
    tl.to(star, { duration: 0.5, opacity: 1, scale: 1, ease: 'back.out(3)' }, '-=0.4')
    this.closeButtonIn(tl)
    tl.eventCallback('onComplete', () => { this.isAnimating = false; this.closeBtn.focus() })
  }

  private closeRKO() {
    const heroImage = document.getElementById('rko-hero-image')
    const title = document.querySelector('.rko-title') as HTMLElement
    const eyebrow = document.querySelector('.rko-eyebrow') as HTMLElement
    const desc = document.querySelector('.rko-description') as HTMLElement
    const rays = document.querySelectorAll('.rko-rays__beam') as NodeListOf<HTMLElement>
    const star = document.querySelector('.rko-star') as HTMLElement
    const viewLot = document.querySelector('#detail-rko .view-lot-btn') as HTMLElement

    const tl = gsap.timeline({
      defaults: { ease: 'power2.in' },
      onComplete: () => {
        if (title) resetTextFilter(title)
        this.resetState(
          [heroImage, rays, star, eyebrow, desc, title, viewLot],
          ['rko']
        )
      }
    })

    this.closeButtonOut(tl)
    if (viewLot) tl.to(viewLot, { duration: 0.5, opacity: 0, y: 20, ease: 'power2.in' }, 0.15)
    tl.to(star, { duration: 0.3, opacity: 0, scale: 0 }, '-=0.2')
    tl.to(desc, { duration: 0.4, opacity: 0, y: -30 }, '-=0.2')
    tl.to(eyebrow, { duration: 0.3, opacity: 0, y: -20 }, '-=0.3')
    this.titleAnimateOut(tl, 'rko', title, '-=0.2')
    tl.to(rays, { duration: 0.3, opacity: 0 }, '-=0.3')
    tl.to(heroImage, { duration: 0.6, opacity: 0, scale: 0.85, ease: 'power3.in' }, '-=0.2')
    tl.add(this.morphClose(MORPH_COLORS['rko-theatre']!), '+=0.1')
  }

  // ─── CARNEGIE HALL ─────────────────────────────────────────────────

  private openCarnegieHall() {
    const color = MORPH_COLORS['carnegie-hall']!
    const rect = this.sourceRect!
    const windowW = window.innerWidth
    const windowH = window.innerHeight

    gsap.set(this.morphBox, {
      left: rect.left + 'px',
      top: rect.top + 'px',
      width: rect.width + 'px',
      height: rect.height + 'px',
      borderRadius: 16,
      opacity: 1,
      background: color
    })

    const shiftContainer = document.getElementById('carnegiehall-shift')
    const title = document.querySelector('.carnegiehall-title') as HTMLElement
    const desc = document.querySelector('.carnegiehall-description') as HTMLElement

    if (shiftContainer && !this.carnegieShiftController) {
      this.carnegieShiftController = createBackgroundShift({
        container: shiftContainer,
        duration: 0.9
      })
    }

    if (!this.splitTexts['carnegiehall']) {
      this.splitTexts['carnegiehall'] = splitText(title, { type: 'chars,words' })
    }

    gsap.set(this.contentEl, { opacity: 0 })

    if (this.splitTexts['carnegiehall']) {
      gsap.set(this.splitTexts['carnegiehall'].chars, {
        opacity: 0, rotateY: 90, xPercent: -40, yPercent: 60, scale: 0.6
      })
    }
    gsap.set(title, { opacity: 1 })
    gsap.set(desc, { opacity: 0, y: 40 })
    gsap.set(this.closeBtn, { opacity: 0 })

    this.overlay.classList.add('active')

    const tl = gsap.timeline({
      defaults: { ease: 'expo.inOut' },
      onComplete: () => { this.isAnimating = false; this.closeBtn.focus() }
    })

    tl.to(this.morphBox, {
      duration: 0.7,
      left: '0px', top: '0px',
      width: windowW + 'px', height: windowH + 'px',
      borderRadius: 0, ease: 'power3.inOut'
    })

    // Set layout and reveal content only after morphBox covers the screen
    tl.call(() => {
      this.overlay.setAttribute('data-layout', 'carnegiehall')
      gsap.set(this.contentEl, { opacity: 1 })
    }, undefined, '-=0.15')

    tl.to(this.morphBox, { duration: 0.3, opacity: 0, ease: 'power2.out' }, '-=0.15')

    if (this.carnegieShiftController) {
      tl.add(this.carnegieShiftController.animateIn(), '-=0.3')
    }

    if (this.splitTexts['carnegiehall'] && this.splitTexts['carnegiehall'].chars.length > 0) {
      tl.add(animate3DText({
        element: title,
        splitResult: this.splitTexts['carnegiehall'],
        duration: 1,
        ease: easingPresets.lookbookText,
        stagger: 0.02
      }), '-=0.6')
    } else {
      tl.add(() => {
        animateTextWithFilter(title, { duration: 1, ease: 'expo.out', startBlur: 60, startScale: 180 })
      }, '-=0.6')
    }

    tl.to(desc, { duration: 0.8, opacity: 1, y: 0, ease: 'back.out(1.7)' }, '-=0.5')
    this.closeButtonIn(tl)
  }

  private closeCarnegieHall() {
    const shiftLayers = document.querySelectorAll('.carnegiehall-shift__layer-inner') as NodeListOf<HTMLElement>
    const title = document.querySelector('.carnegiehall-title') as HTMLElement
    const desc = document.querySelector('.carnegiehall-description') as HTMLElement

    const tl = gsap.timeline({
      defaults: { ease: 'expo.inOut' },
      onComplete: () => {
        if (this.carnegieShiftController) { this.carnegieShiftController.destroy(); this.carnegieShiftController = null }
        if (title) resetTextFilter(title)
        this.resetState([shiftLayers, desc, title], ['carnegiehall'])
      }
    })

    this.closeButtonOut(tl)
    tl.to(desc, { duration: 0.4, opacity: 0, y: -30 }, '-=0.2')
    this.titleAnimateOut(tl, 'carnegiehall', title, '-=0.3')

    if (this.carnegieShiftController) {
      tl.add(this.carnegieShiftController.animateOut(), '-=0.3')
    }

    tl.add(this.morphClose(MORPH_COLORS['carnegie-hall']!))
  }

  // ─── MADISON SQUARE GARDEN ─────────────────────────────────────────

  private openMSG() {
    const rect = this.sourceRect!
    const windowW = window.innerWidth
    const windowH = window.innerHeight

    gsap.set(this.morphBox, {
      left: rect.left + 'px', top: rect.top + 'px',
      width: rect.width + 'px', height: rect.height + 'px',
      borderRadius: 16, opacity: 1, background: '#000000'
    })

    const ledGrid = document.getElementById('msg-led-grid')
    const scanlines = document.querySelector('.msg-scanlines') as HTMLElement
    const jumbotron = document.getElementById('msg-jumbotron')
    const bgImage = document.getElementById('msg-bg')
    const eyebrow = document.getElementById('msg-eyebrow')
    const titleLines = document.querySelectorAll('.msg-title-line') as NodeListOf<HTMLElement>
    const infoPanel = document.getElementById('msg-info-panel')
    const stats = document.querySelectorAll('.msg-stat') as NodeListOf<HTMLElement>
    const chaseLightsContainer = document.getElementById('msg-chase-lights')

    // Create chase lights
    if (chaseLightsContainer && chaseLightsContainer.children.length === 0) {
      for (let i = 0; i < 60; i++) {
        const light = document.createElement('div')
        light.className = 'msg-chase-light'
        const progress = i / 60
        if (progress < 0.25) {
          light.style.top = '0'; light.style.left = `${(progress / 0.25) * 100}%`
        } else if (progress < 0.5) {
          light.style.right = '0'; light.style.top = `${((progress - 0.25) / 0.25) * 100}%`
        } else if (progress < 0.75) {
          light.style.bottom = '0'; light.style.right = `${((progress - 0.5) / 0.25) * 100}%`
        } else {
          light.style.left = '0'; light.style.bottom = `${((progress - 0.75) / 0.25) * 100}%`
        }
        chaseLightsContainer.appendChild(light)
      }
    }

    gsap.set(this.contentEl, { opacity: 0 })
    gsap.set(ledGrid, { opacity: 0 })
    gsap.set(scanlines, { opacity: 0 })
    gsap.set(jumbotron, { opacity: 0, scale: 0.9 })
    gsap.set(bgImage, { opacity: 0, scale: 1.2 })
    gsap.set(eyebrow, { opacity: 0, y: 20 })
    gsap.set(titleLines, { opacity: 0, y: 40 })
    gsap.set(infoPanel, { opacity: 0, y: 50 })
    gsap.set(stats, { opacity: 0, y: 20 })
    gsap.set(this.closeBtn, { opacity: 0 })

    this.overlay.classList.add('active')

    const tl = gsap.timeline({
      defaults: { ease: 'expo.out' },
      onComplete: () => {
        this.isAnimating = false
        this.closeBtn.focus()
        this.startChaseLightAnimation()
        this.startSparkAnimation()
      }
    })

    tl.to(this.morphBox, {
      duration: 0.7,
      left: '0px', top: '0px',
      width: windowW + 'px', height: windowH + 'px',
      borderRadius: 0, ease: 'power3.inOut'
    })

    // Set layout and reveal content only after morphBox covers the screen
    tl.call(() => {
      this.overlay.setAttribute('data-layout', 'msg')
      gsap.set(this.contentEl, { opacity: 1 })
    }, undefined, '-=0.15')

    tl.to(this.morphBox, { duration: 0.3, opacity: 0, ease: 'power2.out' }, '-=0.15')
    tl.to(ledGrid, { duration: 0.5, opacity: 0.6, ease: 'power2.out' }, '-=0.2')
    tl.to(jumbotron, { duration: 0.8, opacity: 1, scale: 1, ease: 'back.out(1.4)' }, '-=0.3')
    tl.to(scanlines, { duration: 0.4, opacity: 1, ease: 'power2.out' }, '-=0.5')
    tl.to(eyebrow, { duration: 0.6, opacity: 1, y: 0, ease: 'power3.out' }, '-=0.3')
    tl.to(bgImage, { duration: 1.5, opacity: 1, scale: 1, ease: 'power2.out' }, '-=0.5')
    tl.to(titleLines, { duration: 0.8, opacity: 1, y: 0, stagger: 0.12, ease: 'power3.out' }, '-=1.2')
    tl.to(infoPanel, { duration: 0.7, opacity: 1, y: 0, ease: 'power3.out' }, '-=0.4')
    tl.to(stats, { duration: 0.5, opacity: 1, y: 0, stagger: 0.1, ease: 'back.out(2)' }, '-=0.3')
    this.closeButtonIn(tl)
  }

  private startChaseLightAnimation() {
    if (!this.msgChaseLights) {
      const lights = document.querySelectorAll('.msg-chase-light') as NodeListOf<HTMLElement>
      this.msgChaseLights = Array.from(lights)
    }

    const lights = this.msgChaseLights
    if (!lights || lights.length === 0) return

    const trailLength = 8
    let activeIndex = 0
    let previousTrail: number[] = []

    const applyTrail = (centerIndex: number) => {
      const nextTrail: number[] = []
      for (let distance = 0; distance < trailLength; distance++) {
        nextTrail.push((centerIndex - distance + lights.length) % lights.length)
      }

      const nextSet = new Set(nextTrail)
      previousTrail.forEach(index => {
        if (!nextSet.has(index)) {
          const light = lights[index]
          if (light) {
            light.classList.remove('active')
            light.style.opacity = '0.2'
          }
        }
      })

      nextTrail.forEach((index, distance) => {
        const light = lights[index]
        if (!light) return
        const isActive = distance === 0
        light.classList.toggle('active', isActive)
        light.style.opacity = isActive
          ? '1'
          : String(0.3 + (0.7 * (1 - distance / trailLength)))
      })

      previousTrail = nextTrail
    }

    applyTrail(activeIndex)
    activeIndex = (activeIndex + 1) % lights.length

    this.chaseLightInterval = setInterval(() => {
      applyTrail(activeIndex)
      activeIndex = (activeIndex + 1) % lights.length
    }, 80)
  }

  private startSparkAnimation() {
    const container = document.getElementById('msg-chase-lights')
    if (!container) return

    const createSpark = () => {
      const rect = container.getBoundingClientRect()
      const perimeter = 2 * (rect.width + rect.height)
      const pos = Math.random() * perimeter
      let x: number, y: number

      if (pos < rect.width) { x = pos; y = 0 }
      else if (pos < rect.width + rect.height) { x = rect.width; y = pos - rect.width }
      else if (pos < 2 * rect.width + rect.height) { x = rect.width - (pos - rect.width - rect.height); y = rect.height }
      else { x = 0; y = rect.height - (pos - 2 * rect.width - rect.height) }

      const spark = document.createElement('div')
      spark.className = 'msg-spark'
      spark.style.left = `${x}px`
      spark.style.top = `${y}px`
      container.appendChild(spark)
      requestAnimationFrame(() => spark.classList.add('flash'))

      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          const trail = document.createElement('div')
          trail.className = 'msg-spark-trail'
          trail.style.left = `${x}px`
          trail.style.top = `${y}px`
          const angle = Math.random() * Math.PI * 2
          const distance = 20 + Math.random() * 30
          trail.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
          trail.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
          container.appendChild(trail)
          requestAnimationFrame(() => trail.classList.add('animate'))
          setTimeout(() => trail.remove(), 600)
        }, i * 30)
      }
      setTimeout(() => spark.remove(), 450)
    }

    const createSparkBurst = () => {
      const shouldDouble = Math.random() < 0.25
      const numSparks = shouldDouble ? 2 : 1
      for (let i = 0; i < numSparks; i++) {
        setTimeout(() => createSpark(), i * 45)
      }
    }

    this.sparkInterval = setInterval(() => {
      createSparkBurst()
    }, 280 + Math.random() * 260)
  }

  private closeMSG() {
    if (this.chaseLightInterval) { clearInterval(this.chaseLightInterval); this.chaseLightInterval = null }
    if (this.sparkInterval) { clearInterval(this.sparkInterval); this.sparkInterval = null }
    this.msgChaseLights = null

    const ledGrid = document.getElementById('msg-led-grid')
    const scanlines = document.querySelector('.msg-scanlines') as HTMLElement
    const jumbotron = document.getElementById('msg-jumbotron')
    const bgImage = document.getElementById('msg-bg')
    const eyebrow = document.getElementById('msg-eyebrow')
    const titleLines = document.querySelectorAll('.msg-title-line') as NodeListOf<HTMLElement>
    const infoPanel = document.getElementById('msg-info-panel')
    const stats = document.querySelectorAll('.msg-stat') as NodeListOf<HTMLElement>
    const chaseLights = document.querySelectorAll('.msg-chase-light') as NodeListOf<HTMLElement>

    const clearChildren = (el: HTMLElement | null) => {
      if (!el) return
      while (el.firstChild) el.removeChild(el.firstChild)
    }

    const tl = gsap.timeline({
      defaults: { ease: 'power2.in' },
      onComplete: () => {
        clearChildren(document.getElementById('msg-chase-lights'))
        this.resetState(
          [ledGrid, scanlines, jumbotron, bgImage, eyebrow, titleLines, infoPanel, stats],
          []
        )
      }
    })

    this.closeButtonOut(tl)
    tl.to(stats, { duration: 0.3, opacity: 0, y: 20, stagger: { each: 0.05, from: 'end' } }, '-=0.2')
    tl.to(infoPanel, { duration: 0.4, opacity: 0, y: 50 }, '-=0.2')
    tl.to(titleLines, { duration: 0.4, opacity: 0, y: -20, stagger: { each: 0.08, from: 'end' } }, '-=0.3')
    tl.to(eyebrow, { duration: 0.3, opacity: 0, y: -15 }, '-=0.3')
    tl.to(bgImage, { duration: 0.5, opacity: 0, scale: 1.1 }, '-=0.3')
    tl.to(jumbotron, { duration: 0.5, opacity: 0, scale: 0.9, ease: 'power3.in' }, '-=0.2')
    tl.to(chaseLights, { duration: 0.3, opacity: 0 }, '-=0.4')
    tl.to([scanlines, ledGrid], { duration: 0.3, opacity: 0 }, '-=0.3')
    tl.add(this.morphClose('#000000'))
  }

  // ─── SHEA STADIUM ──────────────────────────────────────────────────

  private openShea() {
    const color = MORPH_COLORS['shea-stadium']!
    const scoreboard = document.getElementById('shea-scoreboard')
    const title = document.querySelector('.shea-title') as HTMLElement
    const desc = document.querySelector('.shea-description') as HTMLElement
    const ticker = document.getElementById('shea-ticker')
    const viewLot = document.querySelector('#detail-shea .view-lot-btn') as HTMLElement

    const tl = this.morphOpen(color, () => {
      gsap.set(scoreboard, { opacity: 0, scale: 0.85 })
      gsap.set(desc, { opacity: 0, y: 30 })
      gsap.set(ticker, { opacity: 0 })
      if (viewLot) gsap.set(viewLot, { opacity: 0, y: 20 })
      gsap.set(this.closeBtn, { opacity: 0 })
    })

    tl.to(scoreboard, { duration: 0.8, opacity: 1, scale: 1, ease: 'back.out(1.4)' }, '-=0.2')
    tl.to(ticker, { duration: 0.5, opacity: 1, ease: 'power2.out' }, '-=0.4')
    this.titleAnimateIn(tl, title, 'shea', '-=0.3')
    tl.to(desc, { duration: 0.8, opacity: 1, y: 0, ease: 'back.out(1.7)' }, '-=0.5')
    if (viewLot) { tl.to(viewLot, { duration: 0.6, opacity: 1, y: 0, ease: 'power3.out' }, '-=0.3') }
    this.closeButtonIn(tl)
    tl.eventCallback('onComplete', () => { this.isAnimating = false; this.closeBtn.focus() })
  }

  private closeShea() {
    const color = MORPH_COLORS['shea-stadium']!
    const scoreboard = document.getElementById('shea-scoreboard')
    const title = document.querySelector('.shea-title') as HTMLElement
    const desc = document.querySelector('.shea-description') as HTMLElement
    const ticker = document.getElementById('shea-ticker')
    const viewLot = document.querySelector('#detail-shea .view-lot-btn') as HTMLElement

    const tl = gsap.timeline({
      defaults: { ease: 'power2.in' },
      onComplete: () => {
        if (title) resetTextFilter(title)
        this.resetState([scoreboard, desc, ticker, title, viewLot], ['shea'])
      }
    })

    this.closeButtonOut(tl)
    if (viewLot) tl.to(viewLot, { duration: 0.5, opacity: 0, y: 20, ease: 'power2.in' }, 0.15)
    tl.to(desc, { duration: 0.4, opacity: 0, y: -30 }, '-=0.2')
    this.titleAnimateOut(tl, 'shea', title, '-=0.3')
    tl.to(ticker, { duration: 0.3, opacity: 0 }, '-=0.3')
    tl.to(scoreboard, { duration: 0.5, opacity: 0, scale: 0.9 }, '-=0.2')
    tl.add(this.morphClose(color), '+=0.1')
  }

  // ─── TOWN HALL ─────────────────────────────────────────────────────

  private openTownHall() {
    const color = MORPH_COLORS['town-hall']!
    const handbill = document.getElementById('townhall-handbill')
    const rings = document.querySelectorAll('.townhall-ring') as NodeListOf<HTMLElement>
    const title = document.querySelector('.townhall-title') as HTMLElement
    const eyebrow = document.querySelector('.townhall-eyebrow') as HTMLElement
    const desc = document.querySelector('.townhall-description') as HTMLElement
    const viewLot = document.querySelector('#detail-townhall .view-lot-btn') as HTMLElement

    const tl = this.morphOpen(color, () => {
      gsap.set(handbill, { opacity: 0, scale: 0.8, rotateY: -15 })
      gsap.set(rings, { opacity: 0, scale: 0.6 })
      gsap.set(eyebrow, { opacity: 0, y: -15 })
      gsap.set(desc, { opacity: 0, y: 30 })
      if (viewLot) gsap.set(viewLot, { opacity: 0, y: 20 })
      gsap.set(this.closeBtn, { opacity: 0 })
    })

    tl.to(rings, { duration: 1.2, opacity: 1, scale: 1, stagger: 0.15, ease: 'power2.out' }, '-=0.3')
    tl.to(handbill, { duration: 1, opacity: 1, scale: 1, rotateY: 0, ease: 'back.out(1.4)' }, '-=0.9')
    tl.to(eyebrow, { duration: 0.5, opacity: 1, y: 0, ease: 'power3.out' }, '-=0.6')
    this.titleAnimateIn(tl, title, 'townhall', '-=0.4')
    tl.to(desc, { duration: 0.8, opacity: 1, y: 0, ease: 'back.out(1.7)' }, '-=0.5')
    if (viewLot) { tl.to(viewLot, { duration: 0.6, opacity: 1, y: 0, ease: 'power3.out' }, '-=0.3') }
    this.closeButtonIn(tl)
    tl.eventCallback('onComplete', () => { this.isAnimating = false; this.closeBtn.focus() })
  }

  private closeTownHall() {
    const color = MORPH_COLORS['town-hall']!
    const handbill = document.getElementById('townhall-handbill')
    const rings = document.querySelectorAll('.townhall-ring') as NodeListOf<HTMLElement>
    const title = document.querySelector('.townhall-title') as HTMLElement
    const eyebrow = document.querySelector('.townhall-eyebrow') as HTMLElement
    const desc = document.querySelector('.townhall-description') as HTMLElement
    const viewLot = document.querySelector('#detail-townhall .view-lot-btn') as HTMLElement

    const tl = gsap.timeline({
      defaults: { ease: 'power2.in' },
      onComplete: () => {
        if (title) resetTextFilter(title)
        this.resetState([handbill, rings, eyebrow, desc, title, viewLot], ['townhall'])
      }
    })

    this.closeButtonOut(tl)
    if (viewLot) tl.to(viewLot, { duration: 0.5, opacity: 0, y: 20, ease: 'power2.in' }, 0.15)
    tl.to(desc, { duration: 0.4, opacity: 0, y: -30 }, '-=0.2')
    this.titleAnimateOut(tl, 'townhall', title, '-=0.3')
    tl.to(eyebrow, { duration: 0.3, opacity: 0, y: -15 }, '-=0.3')
    tl.to(handbill, { duration: 0.5, opacity: 0, scale: 0.85, rotateY: 15 }, '-=0.3')
    tl.to(rings, { duration: 0.6, opacity: 0, scale: 0.8, stagger: 0.05 }, '-=0.4')
    tl.add(this.morphClose(color), '+=0.1')
  }

  // ─── RADIO CITY ────────────────────────────────────────────────────

  private openRadioCity() {
    const color = MORPH_COLORS['radio-city']!
    const images = document.querySelectorAll('.radiocity-image') as NodeListOf<HTMLElement>
    const title = document.querySelector('.radiocity-title') as HTMLElement
    const subtitle = document.querySelector('.radiocity-subtitle') as HTMLElement
    const eyebrow = document.querySelector('.radiocity-eyebrow') as HTMLElement
    const desc = document.querySelector('.radiocity-description') as HTMLElement
    const viewLot = document.querySelector('#detail-radiocity .view-lot-btn') as HTMLElement

    const tl = this.morphOpen(color, () => {
      gsap.set(images, { opacity: 0, y: 40 })
      gsap.set(subtitle, { opacity: 0, y: 15 })
      gsap.set(eyebrow, { opacity: 0, y: -20 })
      gsap.set(desc, { opacity: 0, y: 30 })
      if (viewLot) gsap.set(viewLot, { opacity: 0, y: 20 })
      gsap.set(this.closeBtn, { opacity: 0 })
    })

    tl.to(images, { duration: 1, opacity: 1, y: 0, stagger: 0.18, ease: 'power3.out' }, '-=0.2')
    tl.to(eyebrow, { duration: 0.5, opacity: 1, y: 0, ease: 'power3.out' }, '-=0.6')
    this.titleAnimateIn(tl, title, 'radiocity', '-=0.4')
    tl.to(subtitle, { duration: 0.6, opacity: 1, y: 0, ease: 'power2.out' }, '-=0.5')
    tl.to(desc, { duration: 0.8, opacity: 1, y: 0, ease: 'power2.out' }, '-=0.4')
    if (viewLot) { tl.to(viewLot, { duration: 0.6, opacity: 1, y: 0, ease: 'power3.out' }, '-=0.3') }
    this.closeButtonIn(tl)
    tl.eventCallback('onComplete', () => { this.isAnimating = false; this.closeBtn.focus() })
  }

  private closeRadioCity() {
    const color = MORPH_COLORS['radio-city']!
    const images = document.querySelectorAll('.radiocity-image') as NodeListOf<HTMLElement>
    const title = document.querySelector('.radiocity-title') as HTMLElement
    const subtitle = document.querySelector('.radiocity-subtitle') as HTMLElement
    const eyebrow = document.querySelector('.radiocity-eyebrow') as HTMLElement
    const desc = document.querySelector('.radiocity-description') as HTMLElement
    const viewLot = document.querySelector('#detail-radiocity .view-lot-btn') as HTMLElement

    const tl = gsap.timeline({
      defaults: { ease: 'power2.in' },
      onComplete: () => {
        if (title) resetTextFilter(title)
        this.resetState(
          [images, subtitle, eyebrow, desc, title, viewLot],
          ['radiocity']
        )
      }
    })

    this.closeButtonOut(tl)
    if (viewLot) tl.to(viewLot, { duration: 0.5, opacity: 0, y: 20, ease: 'power2.in' }, 0.15)
    tl.to(desc, { duration: 0.4, opacity: 0, y: -30 }, '-=0.2')
    tl.to(subtitle, { duration: 0.3, opacity: 0, y: -15 }, '-=0.3')
    this.titleAnimateOut(tl, 'radiocity', title, '-=0.3')
    tl.to(eyebrow, { duration: 0.3, opacity: 0, y: -20 }, '-=0.3')
    tl.to(images, { duration: 0.5, opacity: 0, y: -30, stagger: 0.08 }, '-=0.3')
    tl.add(this.morphClose(color), '+=0.1')
  }

  // ─── HENDRIX APARTMENT ─────────────────────────────────────────────

  private openHendrix() {
    const color = MORPH_COLORS['hendrix-apartment']!
    const heroImage = document.querySelector('.hendrix-image--hero') as HTMLElement
    const reelLeft = document.getElementById('hendrix-reel-left')
    const reelRight = document.getElementById('hendrix-reel-right')
    const title = document.querySelector('.hendrix-title') as HTMLElement
    const eyebrow = document.querySelector('.hendrix-eyebrow') as HTMLElement
    const desc = document.querySelector('.hendrix-description') as HTMLElement
    const viewLot = document.querySelector('#detail-hendrix .view-lot-btn') as HTMLElement

    const isMobile = window.innerWidth <= 768

    const tl = this.morphOpen(color, () => {
      gsap.set(heroImage, {
        opacity: 0, y: 40,
        yPercent: 0,
        xPercent: 0,
        rotation: 0
      })
      gsap.set(reelLeft, { opacity: 0, scale: 0.5 })
      gsap.set(reelRight, { opacity: 0, scale: 0.5 })
      gsap.set(eyebrow, { opacity: 0, y: -20 })
      gsap.set(desc, { opacity: 0, y: 30 })
      if (viewLot) gsap.set(viewLot, { opacity: 0, y: 20 })
      gsap.set(this.closeBtn, { opacity: 0 })
    })

    // Hero image fades up into place
    tl.to(heroImage, {
      duration: 1,
      opacity: 1, y: 0,
      ease: 'power3.out'
    }, '-=0.3')

    // Reels fade in and start spinning
    tl.to(reelLeft, {
      duration: 0.8, opacity: 1, scale: 1,
      ease: 'power2.out',
      onComplete: () => reelLeft?.classList.add('spinning')
    }, '-=0.9')
    tl.to(reelRight, {
      duration: 0.8, opacity: 1, scale: 1,
      ease: 'power2.out',
      onComplete: () => reelRight?.classList.add('spinning')
    }, '-=0.7')

    tl.to(eyebrow, { duration: 0.5, opacity: 1, y: 0, ease: 'power3.out' }, '-=0.5')
    this.titleAnimateIn(tl, title, 'hendrix', '-=0.3')
    tl.to(desc, { duration: 0.8, opacity: 1, y: 0, ease: 'back.out(1.7)' }, '-=0.5')
    if (viewLot) { tl.to(viewLot, { duration: 0.6, opacity: 1, y: 0, ease: 'power3.out' }, '-=0.3') }
    this.closeButtonIn(tl)

    tl.eventCallback('onComplete', () => {
      this.isAnimating = false
      this.closeBtn.focus()
      const images = document.querySelectorAll('.hendrix-image') as NodeListOf<HTMLElement>
      if (!this.mouseParallax && !isMobile) {
        this.mouseParallax = createMouseParallax({
          elements: images,
          depths: [0.4],
          maxMovement: 12,
          maxRotation: 1.5,
          smoothness: 0.9
        })
      }
      if (!isMobile) this.mouseParallax?.enable()
    })
  }

  private closeHendrix() {
    const color = MORPH_COLORS['hendrix-apartment']!
    if (this.mouseParallax) this.mouseParallax.disable()

    const heroImage = document.querySelector('.hendrix-image--hero') as HTMLElement
    const reelLeft = document.getElementById('hendrix-reel-left')
    const reelRight = document.getElementById('hendrix-reel-right')
    const title = document.querySelector('.hendrix-title') as HTMLElement
    const eyebrow = document.querySelector('.hendrix-eyebrow') as HTMLElement
    const desc = document.querySelector('.hendrix-description') as HTMLElement
    const viewLot = document.querySelector('#detail-hendrix .view-lot-btn') as HTMLElement

    const tl = gsap.timeline({
      defaults: { ease: 'power2.in' },
      onComplete: () => {
        reelLeft?.classList.remove('spinning')
        reelRight?.classList.remove('spinning')
        if (this.mouseParallax) { this.mouseParallax.destroy(); this.mouseParallax = null }
        if (title) resetTextFilter(title)
        this.resetState([heroImage, reelLeft, reelRight, eyebrow, desc, title, viewLot], ['hendrix'])
      }
    })

    this.closeButtonOut(tl)
    if (viewLot) tl.to(viewLot, { duration: 0.5, opacity: 0, y: 20, ease: 'power2.in' }, 0.15)
    tl.to(desc, { duration: 0.4, opacity: 0, y: -30 }, '-=0.2')
    this.titleAnimateOut(tl, 'hendrix', title, '-=0.3')
    tl.to(eyebrow, { duration: 0.3, opacity: 0, y: -20 }, '-=0.3')
    tl.to(heroImage, { duration: 0.6, opacity: 0, y: -30 }, '-=0.3')
    tl.to([reelLeft, reelRight], { duration: 0.4, opacity: 0, scale: 0.5 }, '-=0.4')
    tl.add(this.morphClose(color), '+=0.1')
  }

  // ─── APOLLO THEATRE ────────────────────────────────────────────────

  private openApollo() {
    const color = MORPH_COLORS['apollo-theatre']!
    const images = document.querySelectorAll('.apollo-image') as NodeListOf<HTMLElement>
    const title = document.querySelector('.apollo-title') as HTMLElement
    const eyebrow = document.querySelector('.apollo-eyebrow') as HTMLElement
    const desc = document.querySelector('.apollo-description') as HTMLElement
    const marqueeLights = document.getElementById('apollo-marquee-lights')
    const viewLot = document.querySelector('#detail-apollo .view-lot-btn') as HTMLElement

    const tl = this.morphOpen(color, () => {
      gsap.set(images, { opacity: 0, scale: 0.8 })
      gsap.set(eyebrow, { opacity: 0, y: -20 })
      gsap.set(desc, { opacity: 0, y: 30 })
      gsap.set(marqueeLights, { opacity: 0 })
      if (viewLot) gsap.set(viewLot, { opacity: 0, y: 20 })
      gsap.set(this.closeBtn, { opacity: 0 })
    })

    tl.to(marqueeLights, { duration: 0.5, opacity: 1, ease: 'power2.out' }, '-=0.2')
    tl.to(images, { duration: 0.9, opacity: 1, scale: 1, stagger: 0.15, ease: 'back.out(1.4)' }, '-=0.3')
    tl.to(eyebrow, { duration: 0.5, opacity: 1, y: 0, ease: 'power3.out' }, '-=0.5')
    this.titleAnimateIn(tl, title, 'apollo', '-=0.3')
    tl.to(desc, { duration: 0.8, opacity: 1, y: 0, ease: 'back.out(1.7)' }, '-=0.5')
    if (viewLot) { tl.to(viewLot, { duration: 0.6, opacity: 1, y: 0, ease: 'power3.out' }, '-=0.3') }
    this.closeButtonIn(tl)

    tl.eventCallback('onComplete', () => {
      this.isAnimating = false
      this.closeBtn.focus()
      this.startApolloMarquee()
    })
  }

  private startApolloMarquee() {
    const container = document.getElementById('apollo-marquee-lights')
    if (!container) return

    if (!this.apolloMarqueeBulbs || this.apolloMarqueeBulbs.length === 0) {
      const bulbsPerEdge = 20
      const inset = 10 // px from edge
      const bulbPositions: { x: string; y: string }[] = []

      for (let i = 0; i < bulbsPerEdge; i++) {
        bulbPositions.push({ y: `${(i / bulbsPerEdge) * 100}%`, x: `${inset}px` })
        bulbPositions.push({ y: `${(i / bulbsPerEdge) * 100}%`, x: `calc(100% - ${inset}px)` })
        bulbPositions.push({ x: `${(i / bulbsPerEdge) * 100}%`, y: `${inset}px` })
        bulbPositions.push({ x: `${(i / bulbsPerEdge) * 100}%`, y: `calc(100% - ${inset}px)` })
      }

      this.apolloMarqueeBulbs = []
      this.apolloMarqueeGroups = []
      for (let i = 0; i < bulbPositions.length; i++) {
        const bulb = document.createElement('div')
        bulb.className = 'apollo-marquee-bulb'
        bulb.style.position = 'absolute'
        bulb.style.left = bulbPositions[i]!.x
        bulb.style.top = bulbPositions[i]!.y
        container.appendChild(bulb)
        this.apolloMarqueeBulbs.push(bulb)
      }
    }

    const bulbs = this.apolloMarqueeBulbs
    if (!bulbs || bulbs.length === 0) return

    if (this.apolloMarqueeGroups.length === 0) {
      for (let i = 0; i < 3; i++) {
        this.apolloMarqueeGroups.push([])
      }
      for (let i = 0; i < bulbs.length; i++) {
        const phase = i % 3
        this.apolloMarqueeGroups[phase]!.push(bulbs[i]!)
      }
      for (const group of this.apolloMarqueeGroups) {
        for (const bulb of group) {
          bulb.classList.remove('on')
          bulb.style.opacity = ''
        }
      }
    }

    let activePhase = 0
    this.apolloMarqueeGroups[activePhase]!.forEach(bulb => {
      bulb.classList.add('on')
      bulb.style.opacity = '1'
    })

    this.apolloMarqueeInterval = setInterval(() => {
      const nextPhase = (activePhase + 1) % 3
      const offGroup = this.apolloMarqueeGroups[activePhase] ?? []
      const onGroup = this.apolloMarqueeGroups[nextPhase] ?? []

      offGroup.forEach(bulb => {
        bulb.classList.remove('on')
        bulb.style.opacity = '0.3'
      })
      onGroup.forEach(bulb => {
        bulb.classList.add('on')
        bulb.style.opacity = '1'
      })

      activePhase = nextPhase
    }, 220)
  }

  private closeApollo() {
    const color = MORPH_COLORS['apollo-theatre']!
    if (this.apolloMarqueeInterval) { clearInterval(this.apolloMarqueeInterval); this.apolloMarqueeInterval = null }
    if (this.apolloMarqueeBulbs) {
      for (const bulb of this.apolloMarqueeBulbs) {
        bulb.classList.remove('on')
        bulb.style.opacity = ''
      }
    }
    this.apolloMarqueeBulbs = null
    this.apolloMarqueeGroups = []

    const images = document.querySelectorAll('.apollo-image') as NodeListOf<HTMLElement>
    const title = document.querySelector('.apollo-title') as HTMLElement
    const eyebrow = document.querySelector('.apollo-eyebrow') as HTMLElement
    const desc = document.querySelector('.apollo-description') as HTMLElement
    const marqueeLights = document.getElementById('apollo-marquee-lights')
    const viewLot = document.querySelector('#detail-apollo .view-lot-btn') as HTMLElement

    const clearChildren = (el: HTMLElement | null) => {
      if (!el) return
      while (el.firstChild) el.removeChild(el.firstChild)
    }

    const tl = gsap.timeline({
      defaults: { ease: 'power2.in' },
      onComplete: () => {
        clearChildren(document.getElementById('apollo-marquee-lights'))
        if (title) resetTextFilter(title)
        this.resetState([images, eyebrow, desc, marqueeLights, title, viewLot], ['apollo'])
      }
    })

    this.closeButtonOut(tl)
    if (viewLot) tl.to(viewLot, { duration: 0.5, opacity: 0, y: 20, ease: 'power2.in' }, 0.15)
    tl.to(desc, { duration: 0.4, opacity: 0, y: -30 }, '-=0.2')
    this.titleAnimateOut(tl, 'apollo', title, '-=0.3')
    tl.to(eyebrow, { duration: 0.3, opacity: 0, y: -20 }, '-=0.3')
    tl.to(images, { duration: 0.5, opacity: 0, scale: 0.8, stagger: 0.08 }, '-=0.3')
    tl.to(marqueeLights, { duration: 0.3, opacity: 0 }, '-=0.3')
    tl.add(this.morphClose(color), '+=0.1')
  }

  // ─── BELMONT PARK ──────────────────────────────────────────────────

  private openBelmont() {
    const color = MORPH_COLORS['belmont-park']!
    const images = document.querySelectorAll('.belmont-image') as NodeListOf<HTMLElement>
    const title = document.querySelector('.belmont-title') as HTMLElement
    const eyebrow = document.querySelector('.belmont-eyebrow') as HTMLElement
    const desc = document.querySelector('.belmont-description') as HTMLElement
    const rails = document.querySelectorAll('.belmont-rail') as NodeListOf<HTMLElement>
    const viewLot = document.querySelector('#detail-belmont .view-lot-btn') as HTMLElement

    const tl = this.morphOpen(color, () => {
      gsap.set(images, { opacity: 0, scale: 0.8 })
      gsap.set(eyebrow, { opacity: 0, y: -20 })
      gsap.set(desc, { opacity: 0, y: 30 })
      gsap.set(rails, { scaleX: 0 })
      if (viewLot) gsap.set(viewLot, { opacity: 0, y: 20 })
      gsap.set(this.closeBtn, { opacity: 0 })
    })

    tl.to(rails, { duration: 0.8, scaleX: 1, stagger: 0.1, ease: 'power3.out' }, '-=0.2')
    tl.to(images, { duration: 0.8, opacity: 1, scale: 1, stagger: 0.15, ease: 'back.out(1.2)' }, '-=0.5')
    tl.to(eyebrow, { duration: 0.5, opacity: 1, y: 0, ease: 'power3.out' }, '-=0.4')
    this.titleAnimateIn(tl, title, 'belmont', '-=0.3')
    tl.to(desc, { duration: 0.8, opacity: 1, y: 0, ease: 'back.out(1.7)' }, '-=0.5')
    if (viewLot) { tl.to(viewLot, { duration: 0.6, opacity: 1, y: 0, ease: 'power3.out' }, '-=0.3') }
    this.closeButtonIn(tl)
    tl.eventCallback('onComplete', () => { this.isAnimating = false; this.closeBtn.focus() })
  }

  private closeBelmont() {
    const color = MORPH_COLORS['belmont-park']!
    const images = document.querySelectorAll('.belmont-image') as NodeListOf<HTMLElement>
    const title = document.querySelector('.belmont-title') as HTMLElement
    const eyebrow = document.querySelector('.belmont-eyebrow') as HTMLElement
    const desc = document.querySelector('.belmont-description') as HTMLElement
    const rails = document.querySelectorAll('.belmont-rail') as NodeListOf<HTMLElement>
    const viewLot = document.querySelector('#detail-belmont .view-lot-btn') as HTMLElement

    const tl = gsap.timeline({
      defaults: { ease: 'power2.in' },
      onComplete: () => {
        if (title) resetTextFilter(title)
        this.resetState([images, eyebrow, desc, rails, title, viewLot], ['belmont'])
      }
    })

    this.closeButtonOut(tl)
    if (viewLot) tl.to(viewLot, { duration: 0.5, opacity: 0, y: 20, ease: 'power2.in' }, 0.15)
    tl.to(desc, { duration: 0.4, opacity: 0, y: -30 }, '-=0.2')
    this.titleAnimateOut(tl, 'belmont', title, '-=0.3')
    tl.to(eyebrow, { duration: 0.3, opacity: 0, y: -20 }, '-=0.3')
    tl.to(images, { duration: 0.5, opacity: 0, scale: 0.8, stagger: 0.08 }, '-=0.3')
    tl.to(rails, { duration: 0.5, scaleX: 0, stagger: 0.05 }, '-=0.3')
    tl.add(this.morphClose(color), '+=0.1')
  }

  // ─── NASSAU COLISEUM ───────────────────────────────────────────────

  private openNassau() {
    const color = MORPH_COLORS['nassau-coliseum']!
    const laserCanvas = document.getElementById('nassau-laser-canvas') as HTMLCanvasElement | null
    const images = document.querySelectorAll('.nassau-image') as NodeListOf<HTMLElement>
    const title = document.querySelector('.nassau-title') as HTMLElement
    const eyebrow = document.querySelector('.nassau-eyebrow') as HTMLElement
    const desc = document.querySelector('.nassau-description') as HTMLElement
    const stageLight = document.querySelector('.nassau-stage-light') as HTMLElement
    const haze = document.querySelector('.nassau-haze') as HTMLElement
    const viewLot = document.querySelector('#detail-nassau .view-lot-btn') as HTMLElement
    const nassauLasers = document.getElementById('nassau-lasers')

    if (nassauLasers && !nassauLasers.querySelector('.nassau-laser')) {
      for (let i = 1; i <= 12; i++) {
        const beam = document.createElement('div')
        beam.className = `nassau-laser nassau-laser--${i}`
        nassauLasers.appendChild(beam)
      }
    }

    const tl = this.morphOpen(color, () => {
      if (laserCanvas) gsap.set(laserCanvas, { opacity: 0 })
      gsap.set(stageLight, { opacity: 0 })
      gsap.set(haze, { opacity: 0 })
      if (nassauLasers) gsap.set(nassauLasers, { opacity: 0 })
      gsap.set(images, { opacity: 0, scale: 0.8 })
      gsap.set(eyebrow, { opacity: 0, y: -20 })
      gsap.set(desc, { opacity: 0, y: 30 })
      if (viewLot) gsap.set(viewLot, { opacity: 0, y: 20 })
      gsap.set(this.closeBtn, { opacity: 0 })
    })

    tl.to(stageLight, { duration: 0.6, opacity: 1, ease: 'power2.out' }, '-=0.2')
    // Fade in the WebGL laser canvas
    if (laserCanvas) {
      tl.to(laserCanvas, { duration: 1.0, opacity: 1, ease: 'power2.out' }, '-=0.4')
    }
    if (nassauLasers) {
      tl.to(nassauLasers, { duration: 1.0, opacity: 1, ease: 'power2.out' }, '-=0.5')
    }
    tl.to(haze, { duration: 1.2, opacity: 0.8, ease: 'power2.out' }, '-=0.6')
    tl.to(images, { duration: 0.8, opacity: 1, scale: 1, stagger: 0.15, ease: 'back.out(1.2)' }, '-=0.8')
    tl.to(eyebrow, { duration: 0.5, opacity: 1, y: 0, ease: 'power3.out' }, '-=0.4')
    this.titleAnimateIn(tl, title, 'nassau', '-=0.3')
    tl.to(desc, { duration: 0.8, opacity: 1, y: 0, ease: 'back.out(1.7)' }, '-=0.5')
    if (viewLot) { tl.to(viewLot, { duration: 0.6, opacity: 1, y: 0, ease: 'power3.out' }, '-=0.3') }
    this.closeButtonIn(tl)
    tl.eventCallback('onComplete', () => {
      this.isAnimating = false
      this.closeBtn.focus()
      // Start Three.js laser effect
      if (laserCanvas && !this.nassauLaserEffect) {
        this.nassauLaserEffect = new NassauLaserEffect(laserCanvas)
        this.nassauLaserEffect.start()
      }
      if (nassauLasers && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        nassauLasers.classList.add('animating')
      }
      // Subtle haze opacity pulse
      if (haze) {
        gsap.to(haze, {
          opacity: 0.5,
          duration: 3,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut'
        })
      }
    })
  }

  private closeNassau() {
    const color = MORPH_COLORS['nassau-coliseum']!
    const laserCanvas = document.getElementById('nassau-laser-canvas') as HTMLCanvasElement | null
    const images = document.querySelectorAll('.nassau-image') as NodeListOf<HTMLElement>
    const title = document.querySelector('.nassau-title') as HTMLElement
    const eyebrow = document.querySelector('.nassau-eyebrow') as HTMLElement
    const desc = document.querySelector('.nassau-description') as HTMLElement
    const stageLight = document.querySelector('.nassau-stage-light') as HTMLElement
    const haze = document.querySelector('.nassau-haze') as HTMLElement
    const viewLot = document.querySelector('#detail-nassau .view-lot-btn') as HTMLElement
    const nassauLasers = document.getElementById('nassau-lasers')

    if (nassauLasers) {
      nassauLasers.classList.remove('animating')
    }

    // Stop Three.js laser effect
    if (this.nassauLaserEffect) {
      this.nassauLaserEffect.stop()
      this.nassauLaserEffect.destroy()
      this.nassauLaserEffect = null
    }
    // Kill any running haze tweens
    if (haze) gsap.killTweensOf(haze)

    const tl = gsap.timeline({
      defaults: { ease: 'power2.in' },
      onComplete: () => {
        if (title) resetTextFilter(title)
        this.resetState([stageLight, haze, images, eyebrow, desc, title, viewLot], ['nassau'])
      }
    })

    this.closeButtonOut(tl)
    if (viewLot) tl.to(viewLot, { duration: 0.5, opacity: 0, y: 20, ease: 'power2.in' }, 0.15)
    tl.to(desc, { duration: 0.4, opacity: 0, y: -30 }, '-=0.2')
    this.titleAnimateOut(tl, 'nassau', title, '-=0.3')
    tl.to(eyebrow, { duration: 0.3, opacity: 0, y: -20 }, '-=0.3')
    tl.to(images, { duration: 0.5, opacity: 0, scale: 0.8, stagger: 0.08 }, '-=0.3')
    if (laserCanvas) {
      tl.to(laserCanvas, { duration: 0.5, opacity: 0 }, '-=0.3')
    }
    tl.to([stageLight, haze], { duration: 0.3, opacity: 0 }, '-=0.3')
    tl.add(this.morphClose(color), '+=0.1')
  }

  // ─── PUBLIC ACCESSORS ──────────────────────────────────────────────

  getCurrentLocationId() { return this.currentLocationId }
  getIsOpen() { return this.isOpen }
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

// HMR support
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (detailOverlayInstance) {
      const instance = detailOverlayInstance as unknown as {
        mouseParallax?: { destroy: () => void }
        splitTexts?: Record<string, { revert: () => void } | null>
        carnegieShiftController?: { destroy: () => void }
        nassauLaserEffect?: { stop: () => void; destroy: () => void }
        chaseLightInterval?: ReturnType<typeof setInterval>
        sparkInterval?: ReturnType<typeof setInterval>
        msgChaseLights?: HTMLElement[] | null
        apolloMarqueeInterval?: ReturnType<typeof setInterval>
        apolloMarqueeBulbs?: HTMLElement[] | null
        apolloMarqueeGroups?: HTMLElement[][]
        overlay?: HTMLElement
        morphBox?: HTMLElement
        escapeHandler?: ((e: KeyboardEvent) => void) | null
      }
      if (instance.mouseParallax) instance.mouseParallax.destroy()
      if (instance.carnegieShiftController) instance.carnegieShiftController.destroy()
      if (instance.nassauLaserEffect) {
        instance.nassauLaserEffect.stop()
        instance.nassauLaserEffect.destroy()
      }
      if (instance.chaseLightInterval) clearInterval(instance.chaseLightInterval)
      if (instance.sparkInterval) clearInterval(instance.sparkInterval)
      if (instance.apolloMarqueeInterval) clearInterval(instance.apolloMarqueeInterval)
      if (instance.splitTexts) {
        Object.values(instance.splitTexts).forEach(st => { if (st) st.revert() })
      }
      if (instance.escapeHandler) {
        document.removeEventListener('keydown', instance.escapeHandler)
      }
      instance.overlay?.classList.remove('active')
      instance.overlay?.removeAttribute('data-layout')
      if (instance.morphBox) gsap.set(instance.morphBox, { clearProps: 'all' })
    }
    detailOverlayInstance = null
  })
}
