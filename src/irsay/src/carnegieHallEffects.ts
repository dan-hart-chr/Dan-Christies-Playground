import gsap from 'gsap'

/**
 * Carnegie Hall Background Shift Animation
 * Inspired by Codrops BackgroundShift effect
 * Creates pill-shaped layers that slide down from the top
 */

export interface ShiftLayerOptions {
  container: HTMLElement
  duration?: number
  ease?: string
}

export interface ShiftController {
  animateIn: () => gsap.core.Timeline
  animateOut: () => gsap.core.Timeline
  reset: () => void
  destroy: () => void
}

/**
 * Creates the background shift animation controller
 */
export function createBackgroundShift(options: ShiftLayerOptions): ShiftController {
  const {
    container,
    duration = 0.9,
    ease = 'power3.out'
  } = options

  const layers = Array.from(container.querySelectorAll('.carnegiehall-shift__layer-inner')) as HTMLElement[]

  if (layers.length === 0) {
    console.warn('Carnegie Hall: No shift layers found')
    return {
      animateIn: () => gsap.timeline(),
      animateOut: () => gsap.timeline(),
      reset: () => {},
      destroy: () => {}
    }
  }

  // Set initial state - layers hidden above viewport
  gsap.set(layers, {
    y: '-100%'
  })

  /**
   * Animate layers sliding down into view
   */
  function animateIn(): gsap.core.Timeline {
    const tl = gsap.timeline()

    // Ensure layers start hidden above viewport
    gsap.set(layers, { y: '-100%' })

    // Stagger the layers sliding down
    // First and third layers come down together, middle layer slightly delayed
    if (layers[0]) {
      tl.to(layers[0], {
        y: '0%',
        duration,
        ease
      })
    }
    if (layers[2]) {
      tl.to(layers[2], {
        y: '0%',
        duration,
        ease
      }, '<0.05') // Nearly simultaneous with first
    }
    if (layers[1]) {
      tl.to(layers[1], {
        y: '0%',
        duration: duration * 1.1, // Slightly longer for middle layer
        ease
      }, `-=${duration * 0.7}`) // Overlap with others
    }

    return tl
  }

  /**
   * Animate layers sliding back up out of view
   */
  function animateOut(): gsap.core.Timeline {
    const tl = gsap.timeline()

    // Reverse order - middle first, then outer
    if (layers[1]) {
      tl.to(layers[1], {
        y: '-100%',
        duration: duration * 0.8,
        ease: 'power2.in'
      })
    }

    const outerLayers = [layers[0], layers[2]].filter(Boolean)
    if (outerLayers.length > 0) {
      tl.to(outerLayers, {
        y: '-100%',
        duration: duration * 0.8,
        ease: 'power2.in',
        stagger: 0.05
      }, '-=0.4')
    }

    return tl
  }

  /**
   * Reset layers to initial hidden state
   */
  function reset(): void {
    gsap.killTweensOf(layers)
    gsap.set(layers, { clearProps: 'all' })
    gsap.set(layers, { y: '-100%' })
  }

  /**
   * Clean up
   */
  function destroy(): void {
    gsap.killTweensOf(layers)
    reset()
  }

  return {
    animateIn,
    animateOut,
    reset,
    destroy
  }
}

/**
 * Easing presets for Carnegie Hall animations
 */
export const carnegieEasings = {
  shiftIn: 'power3.out',
  shiftOut: 'power2.in',
  textReveal: 'expo.out',
  contentSlide: 'back.out(1.7)',
  asideFade: 'power2.out'
}
