/**
 * Ed Sullivan Modal - Enhanced Visual Effects
 * Inspired by VWLab kinect-transition and lookbook-phase2 projects
 */

import gsap from 'gsap'

// ============================================================================
// TEXT SPLITTING UTILITY (SplitText alternative)
// ============================================================================

export interface SplitTextResult {
  chars: HTMLSpanElement[]
  words: HTMLSpanElement[]
  lines: HTMLSpanElement[]
  revert: () => void
  originalNodes: Node[]
}

/**
 * Split text element into characters and words for animation
 * Similar to GSAP's SplitText plugin
 * Uses safe DOM methods - no innerHTML
 */
export function splitText(element: HTMLElement, options: { type?: string } = {}): SplitTextResult {
  // Store original nodes for revert
  const originalNodes: Node[] = Array.from(element.childNodes).map(node => node.cloneNode(true))
  const text = element.textContent || ''
  const type = options.type || 'chars,words'

  const chars: HTMLSpanElement[] = []
  const words: HTMLSpanElement[] = []
  const lines: HTMLSpanElement[] = []

  // Clear element using safe DOM method
  while (element.firstChild) {
    element.removeChild(element.firstChild)
  }

  // Split by words first
  const wordStrings = text.split(/\s+/).filter(w => w.length > 0)

  wordStrings.forEach((wordText, wordIndex) => {
    const wordSpan = document.createElement('span')
    wordSpan.className = 'word-split'

    if (type.includes('chars')) {
      // Split word into characters
      wordText.split('').forEach(charText => {
        const charSpan = document.createElement('span')
        charSpan.className = 'char-split'
        charSpan.textContent = charText
        wordSpan.appendChild(charSpan)
        chars.push(charSpan)
      })
    } else {
      wordSpan.textContent = wordText
    }

    words.push(wordSpan)
    element.appendChild(wordSpan)

    // Add space between words (except last)
    if (wordIndex < wordStrings.length - 1) {
      const space = document.createTextNode(' ')
      element.appendChild(space)
    }
  })

  const revert = () => {
    // Clear current content
    while (element.firstChild) {
      element.removeChild(element.firstChild)
    }
    // Restore original nodes
    originalNodes.forEach(node => {
      element.appendChild(node.cloneNode(true))
    })
  }

  return { chars, words, lines, revert, originalNodes }
}

// ============================================================================
// KINECT-STYLE LAYERED IMAGE EFFECT
// ============================================================================

interface KinectLayerOptions {
  layerCount?: number
  depthMultiplier?: number
  container: HTMLElement
  imageUrl: string
}

interface KinectLayerResult {
  layers: HTMLDivElement[]
  container: HTMLDivElement
  animateIn: (options?: { duration?: number; ease?: string; stagger?: number }) => gsap.core.Timeline
  animateOut: (options?: { duration?: number; ease?: string }) => gsap.core.Timeline
  destroy: () => void
}

/**
 * Create Kinect-style layered image effect
 * Splits image into horizontal layers with depth positioning
 */
export function createKinectLayers(options: KinectLayerOptions): KinectLayerResult {
  const { container, imageUrl, layerCount = 12, depthMultiplier = 3 } = options

  const wrapper = document.createElement('div')
  wrapper.className = 'kinect-wrapper'

  const layers: HTMLDivElement[] = []
  const centerIndex = (layerCount - 1) / 2

  for (let i = 0; i < layerCount; i++) {
    const layer = document.createElement('div')
    layer.className = 'kinect-layer'

    const distanceFromCenter = Math.abs(i - centerIndex)
    const zOffset = -distanceFromCenter * depthMultiplier

    // Dynamic values that must be set inline (computed at runtime)
    layer.style.height = `${100 / layerCount}%`
    layer.style.top = `${(i / layerCount) * 100}%`
    layer.style.backgroundImage = `url(${imageUrl})`
    layer.style.backgroundSize = `100% ${layerCount * 100}%`
    layer.style.backgroundPosition = `0 ${-(i * 100)}%`
    layer.style.transform = `translateZ(${zOffset}px)`

    // Store metadata for animation ordering
    layer.dataset.distanceFromCenter = distanceFromCenter.toString()
    layer.dataset.index = i.toString()

    layers.push(layer)
    wrapper.appendChild(layer)
  }

  // Sort layers by distance from center (center layers render on top)
  const sortedLayers = [...layers].sort((a, b) =>
    parseFloat(a.dataset.distanceFromCenter!) - parseFloat(b.dataset.distanceFromCenter!)
  )

  // Re-append in sorted order for proper z-index stacking
  sortedLayers.forEach(layer => wrapper.appendChild(layer))

  container.appendChild(wrapper)

  const animateIn = (opts: { duration?: number; ease?: string; stagger?: number } = {}) => {
    const { duration = 1.6, ease = 'back.inOut(3)', stagger = 0.02 } = opts

    const tl = gsap.timeline()

    // Animate each layer based on distance from center
    layers.forEach(layer => {
      const distFromCenter = parseFloat(layer.dataset.distanceFromCenter!)

      tl.from(layer, {
        y: 150,
        opacity: 0,
        scaleY: 1.3,
        scaleX: 1.1,
        duration,
        ease,
      }, distFromCenter * stagger)

      // Add subtle scale pulse
      tl.from(layer, {
        z: -50,
        duration: duration * 0.6,
        ease: 'power2.out',
      }, `<${duration * 0.3}`)
    })

    return tl
  }

  const animateOut = (opts: { duration?: number; ease?: string } = {}) => {
    const { duration = 0.8, ease = 'power2.in' } = opts

    const tl = gsap.timeline()

    layers.forEach((layer, i) => {
      tl.to(layer, {
        y: -80,
        opacity: 0,
        duration,
        ease,
      }, i * 0.02)
    })

    return tl
  }

  const destroy = () => {
    wrapper.remove()
  }

  return { layers, container: wrapper, animateIn, animateOut, destroy }
}

// ============================================================================
// MOUSE PARALLAX EFFECT
// ============================================================================

interface ParallaxOptions {
  elements: NodeListOf<Element> | HTMLElement[]
  depths?: number[]
  maxMovement?: number
  maxRotation?: number
  smoothness?: number
}

export interface ParallaxController {
  enable: () => void
  disable: () => void
  destroy: () => void
}

/**
 * Create interactive mouse-based parallax effect
 * Elements move based on mouse position with configurable depth
 */
export function createMouseParallax(options: ParallaxOptions): ParallaxController {
  const {
    elements,
    depths = [1, 0.6, 1.4],
    maxMovement = 25,
    maxRotation = 4,
    smoothness = 0.8
  } = options

  let isEnabled = false
  let animationId: number | null = null
  let targetX = 0
  let targetY = 0
  let currentX = 0
  let currentY = 0

  const onMouseMove = (e: MouseEvent) => {
    // Normalize mouse position to -1 to 1
    targetX = (e.clientX / window.innerWidth - 0.5) * 2
    targetY = (e.clientY / window.innerHeight - 0.5) * 2
  }

  const animate = () => {
    if (!isEnabled) return

    // Smooth interpolation
    currentX += (targetX - currentX) * (1 - smoothness)
    currentY += (targetY - currentY) * (1 - smoothness)

    elements.forEach((el, i) => {
      const depth = depths[i % depths.length] ?? 1
      const moveX = currentX * maxMovement * depth
      const moveY = currentY * maxMovement * depth
      const rotateYVal = currentX * maxRotation * depth
      const rotateXVal = -currentY * maxRotation * depth

      gsap.set(el, {
        x: moveX,
        y: moveY,
        rotateY: rotateYVal,
        rotateX: rotateXVal,
      })
    })

    animationId = requestAnimationFrame(animate)
  }

  const enable = () => {
    if (isEnabled) return
    isEnabled = true
    document.addEventListener('mousemove', onMouseMove, { passive: true })
    animate()
  }

  const disable = () => {
    isEnabled = false
    document.removeEventListener('mousemove', onMouseMove)
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
    }

    // Reset positions smoothly
    elements.forEach(el => {
      gsap.to(el, {
        x: 0,
        y: 0,
        rotateY: 0,
        rotateX: 0,
        duration: 0.6,
        ease: 'power2.out'
      })
    })
  }

  const destroy = () => {
    disable()
  }

  return { enable, disable, destroy }
}

// ============================================================================
// CLIP-PATH REVEAL ANIMATIONS
// ============================================================================

interface ClipPathRevealOptions {
  element: HTMLElement
  type?: 'circle' | 'inset' | 'polygon'
  direction?: 'bottom' | 'center' | 'left' | 'right'
  duration?: number
  ease?: string
}

/**
 * Animate element reveal using clip-path
 * Creates geometric reveal effects
 */
export function animateClipPathReveal(options: ClipPathRevealOptions): gsap.core.Tween {
  const {
    element,
    type = 'circle',
    direction = 'bottom',
    duration = 1.2,
    ease = 'expo.out'
  } = options

  let fromPath: string
  let toPath: string

  switch (type) {
    case 'circle':
      if (direction === 'bottom') {
        fromPath = 'circle(0% at 50% 100%)'
        toPath = 'circle(150% at 50% 100%)'
      } else if (direction === 'center') {
        fromPath = 'circle(0% at 50% 50%)'
        toPath = 'circle(150% at 50% 50%)'
      } else {
        fromPath = 'circle(0% at 0% 50%)'
        toPath = 'circle(150% at 0% 50%)'
      }
      break

    case 'inset':
      if (direction === 'center') {
        fromPath = 'inset(50% round 1rem)'
        toPath = 'inset(0% round 0.75rem)'
      } else {
        fromPath = 'inset(100% 0% 0% 0% round 1rem)'
        toPath = 'inset(0% 0% 0% 0% round 0.75rem)'
      }
      break

    case 'polygon':
      // Diamond to rectangle morph
      fromPath = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
      toPath = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'
      break

    default:
      fromPath = 'circle(0% at 50% 100%)'
      toPath = 'circle(150% at 50% 100%)'
  }

  gsap.set(element, { clipPath: fromPath })

  return gsap.to(element, {
    clipPath: toPath,
    duration,
    ease,
  })
}

/**
 * Reset clip-path to fully visible
 */
export function resetClipPath(element: HTMLElement): void {
  gsap.set(element, { clipPath: 'none' })
}

// ============================================================================
// 3D TEXT ANIMATION
// ============================================================================

interface Text3DAnimationOptions {
  element: HTMLElement
  splitResult: SplitTextResult
  duration?: number
  ease?: string
  stagger?: number
}

/**
 * Animate split text with 3D rotations
 * Creates dramatic character-by-character reveals
 */
export function animate3DText(options: Text3DAnimationOptions): gsap.core.Timeline {
  const {
    splitResult,
    duration = 1.6,
    ease = 'expo.out',
    stagger = 0.03,
  } = options

  const tl = gsap.timeline()

  splitResult.chars.forEach((char, index) => {
    tl.to(char, {
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0,
      opacity: 1,
      xPercent: 0,
      yPercent: 0,
      scale: 1,
      duration,
      ease,
      transformOrigin: '50% 100%',
    }, index * stagger)
  })

  return tl
}

// ============================================================================
// STAGGER PATTERNS
// ============================================================================

export const staggerPatterns = {
  // From center outward
  centerOut: (elements: Element[]) => {
    const center = Math.floor(elements.length / 2)
    return elements.map((_, i) => Math.abs(i - center) * 0.05)
  },

  // Random stagger
  random: (elements: Element[], baseDelay = 0.05) => {
    return elements.map(() => Math.random() * baseDelay * elements.length)
  },

  // Wave pattern
  wave: (elements: Element[], frequency = 0.1) => {
    return elements.map((_, i) => Math.sin(i * 0.5) * frequency + frequency)
  },

  // Cascade from edges
  edgesIn: (elements: Element[], delay = 0.03) => {
    const center = elements.length / 2
    return elements.map((_, i) => (center - Math.abs(i - center)) * delay)
  }
}

// ============================================================================
// ENHANCED EASING PRESETS
// ============================================================================

export const easingPresets = {
  // VWLab signature easing
  vwlabSnap: 'back.out(2.5)',
  vwlabBounce: 'back.inOut(4)',
  vwlabSmooth: 'expo.inOut',
  vwlabReveal: 'expo.out',

  // Kinect-inspired
  kinectEntrance: 'back.inOut(3)',
  kinectExit: 'power3.in',

  // Lookbook-inspired
  lookbookText: 'expo.out',
  lookbookImage: 'power3.inOut',
  lookbookFlip: 'back.inOut(1.2)',
}
