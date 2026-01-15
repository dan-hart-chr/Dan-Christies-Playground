import gsap from 'gsap'

const SVG_NS = 'http://www.w3.org/2000/svg'

let filterInjected = false

function createSVGElement(tag: string, attrs: Record<string, string> = {}): SVGElement {
  const el = document.createElementNS(SVG_NS, tag)
  Object.entries(attrs).forEach(([key, value]) => {
    el.setAttribute(key, value)
  })
  return el
}

function ensureFilterExists() {
  if (filterInjected) return

  // Create SVG container
  const svg = createSVGElement('svg', {
    class: 'svg-filters',
    style: 'position:absolute;width:0;height:0;pointer-events:none;'
  })

  const defs = createSVGElement('defs')

  // Create filter
  const filter = createSVGElement('filter', { id: 'goo-title' })

  // feGaussianBlur
  const feBlur = createSVGElement('feGaussianBlur', {
    in: 'SourceGraphic',
    stdDeviation: '0',
    result: 'blur'
  })

  // feColorMatrix
  const feColorMatrix = createSVGElement('feColorMatrix', {
    in: 'blur',
    mode: 'matrix',
    values: '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8',
    result: 'goo'
  })

  // feTurbulence - horizontal displacement pattern
  const feTurbulence = createSVGElement('feTurbulence', {
    type: 'fractalNoise',
    baseFrequency: '1 0.01',
    numOctaves: '1',
    seed: '1',
    result: 'noise'
  })

  // feDisplacementMap
  const feDisplacementMap = createSVGElement('feDisplacementMap', {
    in: 'goo',
    in2: 'noise',
    scale: '0',
    result: 'displacement'
  })

  // feComposite
  const feComposite = createSVGElement('feComposite', {
    in: 'SourceGraphic',
    in2: 'displacement',
    operator: 'atop'
  })

  // Assemble filter
  filter.appendChild(feBlur)
  filter.appendChild(feColorMatrix)
  filter.appendChild(feTurbulence)
  filter.appendChild(feDisplacementMap)
  filter.appendChild(feComposite)

  defs.appendChild(filter)
  svg.appendChild(defs)
  document.body.appendChild(svg)

  filterInjected = true
}

export interface TextFilterOptions {
  duration?: number
  ease?: string
  startBlur?: number
  startScale?: number
  delay?: number
}

export function animateTextWithFilter(
  element: HTMLElement,
  options: TextFilterOptions = {}
): gsap.core.Timeline {
  const {
    duration = 1.8,
    ease = 'expo.out',
    startBlur = 70,
    startScale = 200,
    delay = 0
  } = options

  // Ensure filter is in DOM
  ensureFilterExists()

  // Get filter elements
  const feBlur = document.querySelector('#goo-title feGaussianBlur')
  const feDisplacementMap = document.querySelector('#goo-title feDisplacementMap')

  if (!feBlur || !feDisplacementMap) {
    console.warn('SVG filter elements not found')
    return gsap.timeline()
  }

  // Apply filter to element
  element.style.filter = 'url(#goo-title)'

  // Object to store animated values
  const primitiveValues = { stdDeviation: startBlur, scale: startScale }

  // Set initial state
  gsap.set(element, { opacity: 0 })

  // Reset filter values
  feBlur.setAttribute('stdDeviation', String(startBlur))
  feDisplacementMap.setAttribute('scale', String(startScale))

  // Create animation timeline
  const tl = gsap.timeline({
    delay,
    defaults: {
      duration,
      ease,
    },
    onUpdate: () => {
      feBlur.setAttribute('stdDeviation', String(primitiveValues.stdDeviation))
      feDisplacementMap.setAttribute('scale', String(primitiveValues.scale))
    },
    onComplete: () => {
      // Remove filter after animation for crisp text
      element.style.filter = 'none'
    }
  })

  // Animate filter values from distorted to normal
  tl.to(primitiveValues, {
    stdDeviation: 0,
    scale: 0
  }, 0)

  // Fade in the element
  tl.to(element, {
    opacity: 1
  }, 0)

  return tl
}

export function resetTextFilter(element: HTMLElement) {
  element.style.filter = 'none'
  gsap.set(element, { clearProps: 'opacity' })
}
