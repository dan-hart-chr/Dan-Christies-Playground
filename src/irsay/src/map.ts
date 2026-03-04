import mapboxgl from 'mapbox-gl'
import { NYC_LOCATIONS, getLocationCenter, formatCoords } from './locations'
import { showRouteToChristies } from './routeService'

// Polyfill roundRect for Safari < 16 and older browsers
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (
    x: number, y: number, w: number, h: number,
    radii?: number | number[]
  ) {
    const r = typeof radii === 'number' ? [radii, radii, radii, radii]
            : Array.isArray(radii) ? radii
            : [0, 0, 0, 0]
    const [tl, tr, br, bl] = (r.length === 1 ? [r[0], r[0], r[0], r[0]]
      : r.length === 2 ? [r[0], r[1], r[0], r[1]]
      : r.length === 3 ? [r[0], r[1], r[2], r[1]]
      : [r[0], r[1], r[2], r[3]]) as [number, number, number, number]
    this.moveTo(x + tl, y)
    this.lineTo(x + w - tr, y)
    this.arcTo(x + w, y, x + w, y + tr, tr)
    this.lineTo(x + w, y + h - br)
    this.arcTo(x + w, y + h, x + w - br, y + h, br)
    this.lineTo(x + bl, y + h)
    this.arcTo(x, y + h, x, y + h - bl, bl)
    this.lineTo(x, y + tl)
    this.arcTo(x, y, x + tl, y, tl)
    this.closePath()
    return this
  }
}

// Configuration
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'YOUR_MAPBOX_TOKEN_HERE'
const PITCH = 65
const ZOOM_DESKTOP = 15.5
const ZOOM_MOBILE = 14.5
const getZoom = () => window.innerWidth <= 768 ? ZOOM_MOBILE : ZOOM_DESKTOP
const getOffset = (): [number, number] => window.innerWidth <= 768 ? [0, -window.innerHeight * 0.15] : [0, 0]
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
const MANNYS_LOCATION_INDEX = NYC_LOCATIONS.findIndex(location => location.id === 'mannys-music')

// ─── CANVAS PIN DIMENSIONS ───────────────────────────────────────────────────
const PIN_W = 320
const PIN_H = 120

// Preload Christie's logo for map pin
const christiesLogo = new Image()
christiesLogo.src = '/christiesmarker.png'

// ─── MANNY'S NEON SIGN (Canvas) ──────────────────────────────────────────────

function createMannysNeonSign(isActive: boolean, flickerIntensity = 1): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = PIN_W; canvas.height = PIN_H
  const ctx = canvas.getContext('2d')!
  const gm = 0.3 + flickerIntensity * 0.7
  const bb = isActive ? 25 : 18

  ctx.fillStyle = 'rgba(0,0,0,0.7)'
  ctx.beginPath(); ctx.roundRect(0, 0, PIN_W, PIN_H, 12); ctx.fill()

  // Neon border
  ctx.strokeStyle = `rgba(255,26,75,${0.5 * flickerIntensity})`
  ctx.lineWidth = 6; ctx.shadowColor = '#ff1a4b'; ctx.shadowBlur = bb * 1.2 * gm
  ctx.beginPath(); ctx.roundRect(8, 8, PIN_W - 16, PIN_H - 16, 8); ctx.stroke()
  ctx.strokeStyle = `rgba(255,200,210,${0.8 * flickerIntensity})`
  ctx.lineWidth = 2; ctx.shadowColor = '#fff'; ctx.shadowBlur = 8 * gm
  ctx.beginPath(); ctx.roundRect(8, 8, PIN_W - 16, PIN_H - 16, 8); ctx.stroke()

  // Script text
  ctx.font = 'italic 58px "Brush Script MT","Segoe Script",cursive'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  const ty = PIN_H / 2 - 8

  ctx.shadowColor = '#ff1a4b'; ctx.shadowBlur = bb * 1.5 * gm
  ctx.fillStyle = `rgba(255,26,75,${0.6 * flickerIntensity})`; ctx.fillText("Manny's", PIN_W / 2, ty)
  ctx.shadowColor = '#ff6b8a'; ctx.shadowBlur = bb * gm
  ctx.fillStyle = `rgba(255,107,138,${0.8 * flickerIntensity})`; ctx.fillText("Manny's", PIN_W / 2, ty)
  ctx.shadowColor = '#fff'; ctx.shadowBlur = (isActive ? 8 : 5) * gm
  ctx.fillStyle = isActive ? '#fff' : '#ffccd5'; ctx.fillText("Manny's", PIN_W / 2, ty)

  // Underline
  ctx.beginPath(); ctx.moveTo(60, ty + 30); ctx.quadraticCurveTo(PIN_W / 2, ty + 45, PIN_W - 50, ty + 25)
  ctx.strokeStyle = `rgba(255,107,138,${flickerIntensity})`; ctx.lineWidth = 3
  ctx.shadowColor = '#ff1a4b'; ctx.shadowBlur = bb * gm; ctx.stroke()
  ctx.strokeStyle = isActive ? '#fff' : '#ffccd5'; ctx.lineWidth = 2
  ctx.shadowBlur = 5 * gm; ctx.shadowColor = '#fff'; ctx.stroke()

  return ctx.getImageData(0, 0, PIN_W, PIN_H)
}

// ─── RKO THEATRE PIN (Art Deco) ──────────────────────────────────────────────

function createRKOPin(isActive: boolean): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = PIN_W; canvas.height = PIN_H
  const ctx = canvas.getContext('2d')!
  const a = isActive ? 1 : 0.7

  // Reset shadow state
  ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'

  // Consistent dark bg
  ctx.fillStyle = 'rgba(8,8,14,0.88)'
  ctx.beginPath(); ctx.roundRect(0, 0, PIN_W, PIN_H, 12); ctx.fill()

  // Two-pass border — outer gold glow
  ctx.strokeStyle = `rgba(218,165,32,${0.7 * a})`
  ctx.lineWidth = 3; ctx.shadowColor = '#daa520'; ctx.shadowBlur = isActive ? 14 : 6
  ctx.beginPath(); ctx.roundRect(6, 6, PIN_W - 12, PIN_H - 12, 8); ctx.stroke()
  // Inner bright hairline
  ctx.strokeStyle = `rgba(255,235,160,${0.5 * a})`
  ctx.lineWidth = 1.5; ctx.shadowColor = '#ffe8a0'; ctx.shadowBlur = isActive ? 4 : 2
  ctx.beginPath(); ctx.roundRect(10, 10, PIN_W - 20, PIN_H - 20, 6); ctx.stroke()

  // "RKO" text — 2-pass glow + bright
  ctx.font = 'bold 56px "Playfair Display",Georgia,serif'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.shadowColor = '#daa520'; ctx.shadowBlur = isActive ? 22 : 10
  ctx.fillStyle = `rgba(218,165,32,${0.5 * a})`
  ctx.fillText('RKO', PIN_W / 2, PIN_H / 2 - 4)
  ctx.shadowColor = '#fff'; ctx.shadowBlur = isActive ? 4 : 2
  ctx.fillStyle = `rgba(255,255,255,${a})`
  ctx.fillText('RKO', PIN_W / 2, PIN_H / 2 - 4)

  // Subtitle — 2-pass
  ctx.font = '500 13px "Inter",sans-serif'
  ctx.letterSpacing = '4px'
  ctx.shadowColor = '#daa520'; ctx.shadowBlur = isActive ? 8 : 4
  ctx.fillStyle = `rgba(218,165,32,${0.5 * a})`
  ctx.fillText('THEATRE', PIN_W / 2, PIN_H / 2 + 24)
  ctx.shadowBlur = 0
  ctx.fillStyle = `rgba(218,165,32,${0.9 * a})`
  ctx.fillText('THEATRE', PIN_W / 2, PIN_H / 2 + 24)

  // Marquee bulb dots — deterministic pattern (seeded from index)
  ctx.shadowColor = isActive ? '#fffaf0' : '#daa520'; ctx.shadowBlur = isActive ? 6 : 3
  for (let i = 0; i < 18; i++) {
    const x = 20 + (i / 17) * (PIN_W - 40)
    // Deterministic brightness: use simple hash from index
    const brightness = 0.3 + ((i * 7 + 3) % 5) / 8
    ctx.fillStyle = `rgba(255,250,240,${brightness * a})`
    ctx.beginPath(); ctx.arc(x, 18, 2, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(x, PIN_H - 18, 2, 0, Math.PI * 2); ctx.fill()
  }

  return ctx.getImageData(0, 0, PIN_W, PIN_H)
}

// ─── CARNEGIE HALL PIN (Elegant Serif) ───────────────────────────────────────

function createCarnegieHallPin(isActive: boolean): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = PIN_W; canvas.height = PIN_H
  const ctx = canvas.getContext('2d')!
  const a = isActive ? 1 : 0.7

  // Reset shadow state
  ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'

  // Dark background — reads well on the dusk map
  ctx.fillStyle = `rgba(10,8,14,${0.94 * a})`
  ctx.beginPath(); ctx.roundRect(0, 0, PIN_W, PIN_H, 12); ctx.fill()

  // "CARNEGIE HALL" — dark serif text, like the classic logo
  ctx.font = '700 26px "Playfair Display",Georgia,serif'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.letterSpacing = '2px'
  ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'
  ctx.fillStyle = `rgba(255,255,255,${0.95 * a})`
  ctx.fillText('CARNEGIE HALL', PIN_W / 2, PIN_H / 2 - 6)

  // Signature red underline bar
  const barW = 200, barH = 5
  ctx.fillStyle = `rgba(220,20,30,${0.9 * a})`
  ctx.fillRect(PIN_W / 2 - barW / 2, PIN_H / 2 + 14, barW, barH)

  ctx.letterSpacing = '0px'

  return ctx.getImageData(0, 0, PIN_W, PIN_H)
}

// ─── MSG PIN (LED Jumbotron) ─────────────────────────────────────────────────

function createMSGPin(isActive: boolean): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = PIN_W; canvas.height = PIN_H
  const ctx = canvas.getContext('2d')!
  const a = isActive ? 1 : 0.7

  // Reset shadow state
  ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'

  // Dark facade background — like the building at night
  ctx.fillStyle = `rgba(8,8,12,${0.95 * a})`
  ctx.beginPath(); ctx.roundRect(0, 0, PIN_W, PIN_H, 12); ctx.fill()

  // Subtle circular marquee element behind text — the iconic round window/sign
  ctx.strokeStyle = `rgba(255,255,255,${0.08 * a})`
  ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.arc(PIN_W / 2, PIN_H / 2, 44, 0, Math.PI * 2); ctx.stroke()
  // Radial lines inside the circle (like the spoked window)
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(PIN_W / 2, PIN_H / 2)
    ctx.lineTo(PIN_W / 2 + Math.cos(angle) * 44, PIN_H / 2 + Math.sin(angle) * 44)
    ctx.stroke()
  }

  // Thin clean border
  ctx.strokeStyle = `rgba(255,255,255,${0.15 * a})`
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.roundRect(6, 6, PIN_W - 12, PIN_H - 12, 8); ctx.stroke()

  // "MSG" — large bold white, dominant, centered in the pin
  ctx.font = 'bold 58px "Inter","Helvetica Neue",sans-serif'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.letterSpacing = '8px'
  // Wide white glow — like the backlit sign at night
  ctx.shadowColor = `rgba(255,255,255,${isActive ? 0.6 : 0.2})`
  ctx.shadowBlur = isActive ? 24 : 10
  ctx.fillStyle = `rgba(255,255,255,${0.3 * a})`
  ctx.fillText('MSG', PIN_W / 2, PIN_H / 2 - 4)
  // Bright white core
  ctx.shadowColor = '#fff'; ctx.shadowBlur = isActive ? 6 : 2
  ctx.fillStyle = `rgba(255,255,255,${a})`
  ctx.fillText('MSG', PIN_W / 2, PIN_H / 2 - 4)

  // "MADISON SQ GARDEN" — smaller text below
  ctx.letterSpacing = '3px'
  ctx.font = '600 11px "Inter","Helvetica Neue",sans-serif'
  ctx.shadowColor = `rgba(255,255,255,${isActive ? 0.6 : 0.2})`
  ctx.shadowBlur = isActive ? 10 : 4
  ctx.fillStyle = `rgba(255,255,255,${0.7 * a})`
  ctx.fillText('MADISON SQ GARDEN', PIN_W / 2, PIN_H / 2 + 28)

  ctx.letterSpacing = '0px'

  return ctx.getImageData(0, 0, PIN_W, PIN_H)
}

// ─── SHEA STADIUM PIN (Blue & Orange) ────────────────────────────────────────

function createSheaPin(isActive: boolean): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = PIN_W; canvas.height = PIN_H
  const ctx = canvas.getContext('2d')!
  const a = isActive ? 1 : 0.7

  // Reset shadow state
  ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'

  // Deep Mets navy background — matches the patch
  ctx.fillStyle = `rgba(0,30,80,${0.94 * a})`
  ctx.beginPath(); ctx.roundRect(0, 0, PIN_W, PIN_H, 12); ctx.fill()

  // Orange border band (outer) — like the orange ring on the patch
  ctx.strokeStyle = `rgba(255,89,16,${0.85 * a})`
  ctx.lineWidth = 4; ctx.shadowBlur = 0
  ctx.beginPath(); ctx.roundRect(3, 3, PIN_W - 6, PIN_H - 6, 10); ctx.stroke()

  // White trim (thin line inside the orange) — like the patch's white edge
  ctx.strokeStyle = `rgba(255,255,255,${0.6 * a})`
  ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.roundRect(7, 7, PIN_W - 14, PIN_H - 14, 8); ctx.stroke()

  // "SHEA" — bold white, slightly arched feel via letter spacing
  ctx.font = 'bold 48px "Inter","Helvetica Neue",sans-serif'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.letterSpacing = '6px'
  // White text with subtle outer glow
  ctx.shadowColor = `rgba(255,255,255,${isActive ? 0.5 : 0.2})`
  ctx.shadowBlur = isActive ? 10 : 4
  ctx.fillStyle = `rgba(255,255,255,${a})`
  ctx.fillText('SHEA', PIN_W / 2, PIN_H / 2 - 10)

  // "STADIUM" — on an orange banner below
  ctx.letterSpacing = '3px'
  ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'

  // Orange banner rectangle behind STADIUM text
  const bannerY = PIN_H / 2 + 18
  const bannerH = 22
  ctx.fillStyle = `rgba(255,89,16,${0.9 * a})`
  ctx.beginPath()
  ctx.roundRect(PIN_W / 2 - 72, bannerY - bannerH / 2, 144, bannerH, 3)
  ctx.fill()

  // STADIUM text in white on the orange banner
  ctx.font = 'bold 13px "Inter",sans-serif'
  ctx.fillStyle = `rgba(255,255,255,${a})`
  ctx.fillText('STADIUM', PIN_W / 2, bannerY + 1)

  // Small diamond separator dot between the words (like "1964 ◆ 2008")
  ctx.fillStyle = `rgba(255,255,255,${0.5 * a})`
  ctx.save()
  ctx.translate(PIN_W / 2, PIN_H / 2 + 4)
  ctx.rotate(Math.PI / 4)
  ctx.fillRect(-2, -2, 4, 4)
  ctx.restore()

  ctx.letterSpacing = '0px'

  return ctx.getImageData(0, 0, PIN_W, PIN_H)
}

// ─── TOWN HALL PIN (Georgian Marquee) ────────────────────────────────────────

function createTownHallPin(isActive: boolean): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = PIN_W; canvas.height = PIN_H
  const ctx = canvas.getContext('2d')!
  const a = isActive ? 1 : 0.7

  // Reset shadow state
  ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'

  // Black background — matches the logo
  ctx.fillStyle = `rgba(5,5,8,${0.95 * a})`
  ctx.beginPath(); ctx.roundRect(0, 0, PIN_W, PIN_H, 12); ctx.fill()

  // "THE" small above
  ctx.font = '400 12px "Playfair Display",Georgia,serif'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.letterSpacing = '4px'
  ctx.fillStyle = `rgba(255,255,255,${0.7 * a})`
  ctx.fillText('THE', PIN_W / 2, PIN_H / 2 - 22)

  // "TOWN ◁ HALL" — main text with triangle separator
  ctx.font = '400 30px "Playfair Display",Georgia,serif'
  ctx.letterSpacing = '3px'
  ctx.fillStyle = `rgba(255,255,255,${0.95 * a})`
  ctx.fillText('TOWN HALL', PIN_W / 2, PIN_H / 2 + 8)

  ctx.letterSpacing = '0px'

  return ctx.getImageData(0, 0, PIN_W, PIN_H)
}

// ─── RADIO CITY PIN (Neon Vertical) ──────────────────────────────────────────

function createRadioCityPin(isActive: boolean, flickerIntensity = 1): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = PIN_W; canvas.height = PIN_H
  const ctx = canvas.getContext('2d')!
  const gm = 0.4 + flickerIntensity * 0.6
  const a = isActive ? 1 : 0.7

  // Reset shadow state
  ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'

  // Consistent dark bg
  ctx.fillStyle = 'rgba(8,8,14,0.88)'
  ctx.beginPath(); ctx.roundRect(0, 0, PIN_W, PIN_H, 12); ctx.fill()

  // Blue neon frame (outer)
  ctx.strokeStyle = `rgba(60,80,200,${0.7 * a * gm})`
  ctx.lineWidth = 3; ctx.shadowColor = '#3c50c8'; ctx.shadowBlur = (isActive ? 16 : 8) * gm
  ctx.beginPath(); ctx.roundRect(6, 6, PIN_W - 12, PIN_H - 12, 8); ctx.stroke()
  // Inner bright hairline
  ctx.strokeStyle = `rgba(140,160,255,${0.3 * a * gm})`
  ctx.lineWidth = 1.5; ctx.shadowColor = '#8ca0ff'; ctx.shadowBlur = 4 * gm
  ctx.beginPath(); ctx.roundRect(10, 10, PIN_W - 20, PIN_H - 20, 6); ctx.stroke()

  // Art Deco corner accents — tightened geometry
  ctx.strokeStyle = `rgba(218,180,50,${0.5 * a * gm})`
  ctx.lineWidth = 1.5; ctx.shadowColor = '#dab432'; ctx.shadowBlur = 6 * gm
  const ci = 12, co = 24
  ctx.beginPath(); ctx.moveTo(ci, co); ctx.lineTo(ci, ci); ctx.lineTo(co, ci); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(PIN_W - ci, co); ctx.lineTo(PIN_W - ci, ci); ctx.lineTo(PIN_W - co, ci); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(ci, PIN_H - co); ctx.lineTo(ci, PIN_H - ci); ctx.lineTo(co, PIN_H - ci); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(PIN_W - ci, PIN_H - co); ctx.lineTo(PIN_W - ci, PIN_H - ci); ctx.lineTo(PIN_W - co, PIN_H - ci); ctx.stroke()

  // "RADIO CITY" — 3-pass neon text
  ctx.font = 'bold 38px "Inter","Helvetica Neue",sans-serif'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'

  // Outer red glow
  ctx.shadowColor = '#ff2244'; ctx.shadowBlur = (isActive ? 28 : 14) * gm
  ctx.fillStyle = `rgba(255,34,68,${0.5 * a * gm})`
  ctx.fillText('RADIO CITY', PIN_W / 2, PIN_H / 2 - 4)

  // Inner bright
  ctx.shadowColor = '#ff6688'; ctx.shadowBlur = 12 * gm
  ctx.fillStyle = `rgba(255,200,210,${a * gm})`
  ctx.fillText('RADIO CITY', PIN_W / 2, PIN_H / 2 - 4)

  // Bright center
  ctx.shadowColor = '#fff'; ctx.shadowBlur = 4 * gm
  ctx.fillStyle = isActive ? `rgba(255,255,255,${gm})` : `rgba(255,220,225,${0.9 * gm})`
  ctx.fillText('RADIO CITY', PIN_W / 2, PIN_H / 2 - 4)

  // "MUSIC HALL" subtitle
  ctx.font = '500 13px "Inter",sans-serif'
  ctx.shadowColor = '#ff2244'; ctx.shadowBlur = 8 * gm
  ctx.fillStyle = `rgba(255,100,130,${0.9 * a * gm})`
  ctx.fillText('MUSIC HALL', PIN_W / 2, PIN_H / 2 + 24)

  return ctx.getImageData(0, 0, PIN_W, PIN_H)
}

// ─── HENDRIX APARTMENT PIN (Psychedelic) ──────────────────────────────────────

function createHendrixPin(isActive: boolean): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = PIN_W; canvas.height = PIN_H
  const ctx = canvas.getContext('2d')!
  const a = isActive ? 1 : 0.7

  // Reset shadow state
  ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'

  // Black background — brand primary
  ctx.fillStyle = `rgba(0,0,0,${0.95 * a})`
  ctx.beginPath(); ctx.roundRect(0, 0, PIN_W, PIN_H, 12); ctx.fill()

  // Warm yellow (#FDEC9C) border — brand primary
  ctx.strokeStyle = `rgba(253,236,156,${0.7 * a})`
  ctx.lineWidth = 2; ctx.shadowBlur = 0
  ctx.beginPath(); ctx.roundRect(6, 6, PIN_W - 12, PIN_H - 12, 8); ctx.stroke()

  // "HENDRIX" — warm yellow text on black
  ctx.font = 'bold 44px "Playfair Display",Georgia,serif'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.letterSpacing = '4px'
  // Subtle warm glow
  ctx.shadowColor = '#FDEC9C'; ctx.shadowBlur = isActive ? 16 : 6
  ctx.fillStyle = `rgba(253,236,156,${0.3 * a})`
  ctx.fillText('HENDRIX', PIN_W / 2, PIN_H / 2)
  // Bright warm yellow core
  ctx.shadowColor = '#FDEC9C'; ctx.shadowBlur = isActive ? 4 : 1
  ctx.fillStyle = `rgba(253,236,156,${a})`
  ctx.fillText('HENDRIX', PIN_W / 2, PIN_H / 2)

  ctx.letterSpacing = '0px'

  return ctx.getImageData(0, 0, PIN_W, PIN_H)
}

// ─── APOLLO THEATRE PIN (Neon Marquee) ────────────────────────────────────────

function createApolloPin(isActive: boolean, flickerIntensity = 1): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = PIN_W; canvas.height = PIN_H
  const ctx = canvas.getContext('2d')!
  const gm = 0.4 + flickerIntensity * 0.6
  const a = isActive ? 1 : 0.7

  // Reset shadow state
  ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'

  // Dark exterior background
  ctx.fillStyle = `rgba(10,10,18,${0.92 * a})`
  ctx.beginPath(); ctx.roundRect(0, 0, PIN_W, PIN_H, 12); ctx.fill()

  // Blue neon border — 2-pass glow + bright core (framing the whole pin)
  ctx.strokeStyle = `rgba(20,50,255,${0.6 * a * gm})`
  ctx.lineWidth = 3.5; ctx.shadowColor = '#1432ff'; ctx.shadowBlur = (isActive ? 18 : 8) * gm
  ctx.beginPath(); ctx.roundRect(6, 6, PIN_W - 12, PIN_H - 12, 8); ctx.stroke()
  ctx.strokeStyle = `rgba(100,140,255,${0.8 * a * gm})`
  ctx.lineWidth = 1.5; ctx.shadowColor = '#648cff'; ctx.shadowBlur = 6 * gm
  ctx.beginPath(); ctx.roundRect(6, 6, PIN_W - 12, PIN_H - 12, 8); ctx.stroke()

  // Black interior panel
  ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'
  const lx = 14, ly = 14, lw = PIN_W - 28, lh = PIN_H - 28
  ctx.fillStyle = `rgba(5,5,8,${0.95 * a})`
  ctx.beginPath(); ctx.roundRect(lx, ly, lw, lh, 4); ctx.fill()

  // "APOLLO" — red neon tube outlines on top of the white lightbox
  ctx.font = '400 52px "Tilt Prism","Inter","Helvetica Neue",sans-serif'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.letterSpacing = '5px'
  const tx = PIN_W / 2, ty = PIN_H / 2

  // Wide red glow halo — spills onto the white surface
  ctx.shadowColor = '#ff0000'; ctx.shadowBlur = (isActive ? 30 : 14) * gm
  ctx.fillStyle = `rgba(255,0,0,${0.2 * a * gm})`
  ctx.fillText('APOLLO', tx, ty)

  // Outer red neon stroke — the visible tube outline
  ctx.shadowColor = '#ff1100'; ctx.shadowBlur = 10 * gm
  ctx.strokeStyle = `rgba(220,15,0,${0.9 * a * gm})`
  ctx.lineWidth = 3
  ctx.strokeText('APOLLO', tx, ty)

  // Inner bright core stroke — the hot center of the neon tube
  ctx.shadowColor = '#ff8866'; ctx.shadowBlur = 3 * gm
  ctx.strokeStyle = isActive ? `rgba(255,200,180,${gm})` : `rgba(255,180,160,${0.85 * gm})`
  ctx.lineWidth = 1.5
  ctx.strokeText('APOLLO', tx, ty)

  return ctx.getImageData(0, 0, PIN_W, PIN_H)
}

// ─── BELMONT PARK PIN (Racing Green) ─────────────────────────────────────────

function createBelmontPin(isActive: boolean): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = PIN_W; canvas.height = PIN_H
  const ctx = canvas.getContext('2d')!
  const a = isActive ? 1 : 0.7

  // Reset shadow state
  ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'

  // Consistent dark bg with green tint
  ctx.fillStyle = 'rgba(4,12,8,0.88)'
  ctx.beginPath(); ctx.roundRect(0, 0, PIN_W, PIN_H, 12); ctx.fill()

  // Two-pass border — outer white glow
  ctx.strokeStyle = `rgba(255,255,255,${0.5 * a})`
  ctx.lineWidth = 3; ctx.shadowColor = '#ffffff'; ctx.shadowBlur = isActive ? 12 : 5
  ctx.beginPath(); ctx.roundRect(6, 6, PIN_W - 12, PIN_H - 12, 8); ctx.stroke()
  // Inner bright green-tinted hairline
  ctx.strokeStyle = `rgba(180,220,180,${0.3 * a})`
  ctx.lineWidth = 1.5; ctx.shadowColor = '#b4dcb4'; ctx.shadowBlur = isActive ? 3 : 1
  ctx.beginPath(); ctx.roundRect(10, 10, PIN_W - 20, PIN_H - 20, 6); ctx.stroke()

  // Subtle turf texture — thin horizontal lines
  ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'
  ctx.strokeStyle = `rgba(60,120,60,${0.12 * a})`
  ctx.lineWidth = 0.5
  for (let y = 20; y < PIN_H - 20; y += 6) {
    ctx.beginPath()
    ctx.moveTo(16, y)
    ctx.lineTo(PIN_W - 16, y)
    ctx.stroke()
  }

  // "BELMONT PARK" — centered, 2-pass glow + bright
  ctx.font = '600 30px "Playfair Display",Georgia,serif'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.shadowColor = '#80ff80'; ctx.shadowBlur = isActive ? 14 : 6
  ctx.fillStyle = `rgba(120,200,120,${0.4 * a})`
  ctx.fillText('BELMONT PARK', PIN_W / 2, PIN_H / 2 - 4)
  ctx.shadowColor = '#fff'; ctx.shadowBlur = isActive ? 4 : 2
  ctx.fillStyle = `rgba(255,255,255,${a})`
  ctx.fillText('BELMONT PARK', PIN_W / 2, PIN_H / 2 - 4)

  // "TRIPLE CROWN" subtitle — 2-pass dimmer
  ctx.font = '400 11px "Inter",sans-serif'
  ctx.shadowColor = '#80ff80'; ctx.shadowBlur = isActive ? 6 : 3
  ctx.fillStyle = `rgba(180,220,180,${0.4 * a})`
  ctx.fillText('TRIPLE CROWN', PIN_W / 2, PIN_H / 2 + 24)
  ctx.shadowBlur = 0
  ctx.fillStyle = `rgba(180,220,180,${0.8 * a})`
  ctx.fillText('TRIPLE CROWN', PIN_W / 2, PIN_H / 2 + 24)

  return ctx.getImageData(0, 0, PIN_W, PIN_H)
}

// ─── NASSAU COLISEUM PIN (Brutalist Concrete) ────────────────────────────────

function createNassauPin(isActive: boolean): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = PIN_W; canvas.height = PIN_H
  const ctx = canvas.getContext('2d')!
  const a = isActive ? 1 : 0.7

  // Reset shadow state
  ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'

  // Concrete/off-white background — like the real brutalist sign
  ctx.fillStyle = `rgba(210,205,195,${0.92 * a})`
  ctx.beginPath(); ctx.roundRect(0, 0, PIN_W, PIN_H, 12); ctx.fill()

  // Subtle concrete texture — faint noise lines
  ctx.strokeStyle = `rgba(0,0,0,${0.04 * a})`
  ctx.lineWidth = 0.5
  for (let y = 8; y < PIN_H - 8; y += 4) {
    ctx.beginPath()
    ctx.moveTo(10, y)
    ctx.lineTo(PIN_W - 10, y)
    ctx.stroke()
  }

  // Thin dark border — like the sign's metal frame
  ctx.strokeStyle = `rgba(60,55,50,${0.4 * a})`
  ctx.lineWidth = 2; ctx.shadowBlur = 0
  ctx.beginPath(); ctx.roundRect(6, 6, PIN_W - 12, PIN_H - 12, 8); ctx.stroke()

  // "NASSAU COUNTY" small text above — like the real sign
  ctx.font = '500 11px "Inter","Helvetica Neue",sans-serif'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.letterSpacing = '1px'
  ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'
  ctx.fillStyle = `rgba(50,45,40,${0.7 * a})`
  ctx.fillText('NASSAU COUNTY', PIN_W / 2, PIN_H / 2 - 24)

  // "COLISEUM" — big bold dark text, matching the brutalist sign
  ctx.font = 'bold 42px "Inter","Helvetica Neue",sans-serif'
  // Subtle shadow for depth like engraved lettering
  ctx.shadowColor = `rgba(0,0,0,${isActive ? 0.25 : 0.1})`
  ctx.shadowBlur = isActive ? 4 : 2
  ctx.shadowOffsetX = 1; ctx.shadowOffsetY = 1
  ctx.fillStyle = `rgba(40,35,30,${0.9 * a})`
  ctx.fillText('COLISEUM', PIN_W / 2, PIN_H / 2 + 10)

  // Reset shadow offset
  ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0
  ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'

  return ctx.getImageData(0, 0, PIN_W, PIN_H)
}

// ─── CHRISTIE'S PIN (Logo Image) ─────────────────────────────────────────────

function createChristiesPin(isActive: boolean): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = PIN_W; canvas.height = PIN_H
  const ctx = canvas.getContext('2d')!
  const a = isActive ? 1 : 0.7

  // Draw the logo as a square centered in the pin canvas
  const size = PIN_H // square: 120×120
  const x = (PIN_W - size) / 2
  const y = 0
  const r = 12

  ctx.globalAlpha = a
  ctx.save()
  ctx.beginPath(); ctx.roundRect(x, y, size, size, r); ctx.clip()

  if (christiesLogo.complete && christiesLogo.naturalWidth > 0) {
    ctx.drawImage(christiesLogo, x, y, size, size)
  } else {
    // Fallback if image hasn't loaded yet — solid red square with "C"
    ctx.fillStyle = 'rgba(180,10,20,0.92)'
    ctx.fillRect(x, y, size, size)
    ctx.fillStyle = '#fff'
    ctx.font = '700 72px Georgia, serif'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText('C', PIN_W / 2, PIN_H / 2)
  }

  ctx.restore()
  ctx.globalAlpha = 1

  return ctx.getImageData(0, 0, PIN_W, PIN_H)
}

// ─── PIN FACTORY ─────────────────────────────────────────────────────────────

export type PinCreator = (isActive: boolean, flickerIntensity?: number) => ImageData

export { PIN_W, PIN_H }

export const PIN_CREATORS: Record<string, PinCreator> = {
  'mannys-music': createMannysNeonSign,
  'rko-theatre': createRKOPin,
  'carnegie-hall': createCarnegieHallPin,
  'madison-square-garden': createMSGPin,
  'shea-stadium': createSheaPin,
  'town-hall': createTownHallPin,
  'radio-city': createRadioCityPin,
  'hendrix-apartment': createHendrixPin,
  'apollo-theatre': createApolloPin,
  'belmont-park': createBelmontPin,
  'nassau-coliseum': createNassauPin,
  'christies': createChristiesPin
}

// Locations that get neon-style animated flicker
// NOTE: mannys-music uses the WebGL custom layer, NOT the symbol layer,
// so it must NOT be included here (updateImage calls would churn the atlas for nothing)
const ANIMATED_PIN_IDS = ['radio-city', 'apollo-theatre']

// ─── WebGL Neon Layer for Manny's ────────────────────────────────────────────

function createNeonGlowLayer(coordinates: [number, number]): mapboxgl.CustomLayerInterface {
  const vertexSource = `
    uniform vec2 u_screenPos;
    uniform vec2 u_size;
    attribute vec2 a_offset;
    attribute vec2 a_uv;
    varying vec2 v_uv;
    void main() {
      vec2 ndcCenter = u_screenPos * 2.0 - 1.0;
      vec2 ndcOffset = a_offset * u_size;
      gl_Position = vec4(ndcCenter + ndcOffset, 0.0, 1.0);
      v_uv = a_uv;
    }
  `

  const fragmentSource = `
    precision mediump float;
    uniform sampler2D u_texture;
    varying vec2 v_uv;
    void main() {
      gl_FragColor = texture2D(u_texture, v_uv);
    }
  `

  let program: WebGLProgram | null = null
  let buffer: WebGLBuffer | null = null
  let texture: WebGLTexture | null = null
  let aOffset: number
  let aUv: number
  let uScreenPos: WebGLUniformLocation | null
  let uSize: WebGLUniformLocation | null
  let uTexture: WebGLUniformLocation | null
  const FLICKER_PATTERN = [1, 1, 0.6, 1, 1, 0.4, 1, 0.7, 1, 0.5, 1, 1, 1, 0.3, 1, 1]
  const FLICKER_INTERVAL_MS = 300
  let lastFlickerTime = 0
  let flickerIndex = 0
  let repaintInterval: ReturnType<typeof setInterval> | null = null
  let lastActiveState = false
  let needsRepaint = false
  const renderCanvas = document.createElement('canvas')
  renderCanvas.width = PIN_W
  renderCanvas.height = PIN_H
  const renderCtx = renderCanvas.getContext('2d')!
  let mapRef: mapboxgl.Map | null = null
  const lngLat: [number, number] = coordinates

  const isMannysActive = () => state.currentLocationIndex === MANNYS_LOCATION_INDEX

  const stopRepaintLoop = () => {
    if (repaintInterval !== null) {
      clearInterval(repaintInterval)
      repaintInterval = null
    }
  }

  const startRepaintLoop = () => {
    if (
      repaintInterval !== null ||
      !isMannysActive() ||
      document.hidden
    ) return

    repaintInterval = setInterval(() => {
      if (document.hidden || !mapRef) return
      if (!isMannysActive()) {
        stopRepaintLoop()
        return
      }
      mapRef.triggerRepaint()
    }, FLICKER_INTERVAL_MS)
  }

  return {
    id: 'neon-glow-layer',
    type: 'custom',
    renderingMode: '2d',

    onAdd(map: mapboxgl.Map, gl: WebGLRenderingContext) {
      mapRef = map

      const vs = gl.createShader(gl.VERTEX_SHADER)!
      gl.shaderSource(vs, vertexSource); gl.compileShader(vs)
      if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
        console.error('Vertex shader error:', gl.getShaderInfoLog(vs))
      }

      const fs = gl.createShader(gl.FRAGMENT_SHADER)!
      gl.shaderSource(fs, fragmentSource); gl.compileShader(fs)
      if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
        console.error('Fragment shader error:', gl.getShaderInfoLog(fs))
      }

      program = gl.createProgram()!
      gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program)
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program))
      }

      aOffset = gl.getAttribLocation(program, 'a_offset')
      aUv = gl.getAttribLocation(program, 'a_uv')
      uScreenPos = gl.getUniformLocation(program, 'u_screenPos')
      uSize = gl.getUniformLocation(program, 'u_size')
      uTexture = gl.getUniformLocation(program, 'u_texture')

      const vertices = new Float32Array([
        -1, -1, 0, 1, 1, -1, 1, 1, -1, 1, 0, 0, 1, 1, 1, 0,
      ])
      buffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

      const isActive = state.currentLocationIndex === MANNYS_LOCATION_INDEX
      lastActiveState = isActive
      renderCtx.putImageData(createMannysNeonSign(isActive), 0, 0)

      texture = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, renderCanvas)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    },

    onRemove() {
      if (repaintInterval !== null) {
        clearInterval(repaintInterval)
        repaintInterval = null
      }
    },

    render(gl: WebGLRenderingContext, _matrix: number[]) {
      if (!program || !buffer || !texture || !mapRef) return

      const isActive = state.currentLocationIndex === MANNYS_LOCATION_INDEX
      const now = performance.now()
      const shouldFlicker = now - lastFlickerTime >= FLICKER_INTERVAL_MS
      const activeChanged = isActive !== lastActiveState

      if (activeChanged || (isActive && shouldFlicker)) {
        if (shouldFlicker) {
          lastFlickerTime = now
          flickerIndex += 1
        }

        const flicker = activeChanged ? 1 : (FLICKER_PATTERN[flickerIndex % FLICKER_PATTERN.length] ?? 1)
        renderCtx.putImageData(createMannysNeonSign(isActive, flicker), 0, 0)
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, renderCanvas)
        needsRepaint = true
        lastActiveState = isActive
      }

      const screenPoint = mapRef.project(lngLat)
      const canvas = mapRef.getCanvas()
      const width = canvas.clientWidth
      const height = canvas.clientHeight

      const normalizedX = screenPoint.x / width
      const normalizedY = 1.0 - (screenPoint.y / height)
      const sizeX = 140 / width
      const sizeY = 52 / height

      // ── Save ALL GL state that we touch (Mapbox uses stencil for tile
      //    clipping — failing to restore it makes nearby symbols vanish) ──
      const prevProgram = gl.getParameter(gl.CURRENT_PROGRAM)
      const prevActiveTexture = gl.getParameter(gl.ACTIVE_TEXTURE)
      const prevTexture = gl.getParameter(gl.TEXTURE_BINDING_2D)
      const prevBuffer = gl.getParameter(gl.ARRAY_BUFFER_BINDING)
      const prevBlend = gl.getParameter(gl.BLEND)
      const prevBlendSrc = gl.getParameter(gl.BLEND_SRC_RGB)
      const prevBlendDst = gl.getParameter(gl.BLEND_DST_RGB)
      const prevBlendSrcA = gl.getParameter(gl.BLEND_SRC_ALPHA)
      const prevBlendDstA = gl.getParameter(gl.BLEND_DST_ALPHA)
      const prevDepthTest = gl.getParameter(gl.DEPTH_TEST)
      const prevStencilTest = gl.getParameter(gl.STENCIL_TEST)

      gl.useProgram(program)
      gl.uniform2f(uScreenPos, normalizedX, normalizedY)
      gl.uniform2f(uSize, sizeX, sizeY)
      gl.uniform1i(uTexture, 0)

      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.enableVertexAttribArray(aOffset)
      gl.vertexAttribPointer(aOffset, 2, gl.FLOAT, false, 16, 0)
      gl.enableVertexAttribArray(aUv)
      gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 16, 8)

      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
      gl.disable(gl.DEPTH_TEST)
      gl.disable(gl.STENCIL_TEST)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

      gl.disableVertexAttribArray(aOffset)
      gl.disableVertexAttribArray(aUv)

      // ── Restore ALL state exactly as Mapbox left it ──
      if (prevStencilTest) gl.enable(gl.STENCIL_TEST)
      else gl.disable(gl.STENCIL_TEST)
      if (prevDepthTest) gl.enable(gl.DEPTH_TEST)
      else gl.disable(gl.DEPTH_TEST)
      if (prevBlend) gl.enable(gl.BLEND)
      else gl.disable(gl.BLEND)
      gl.blendFuncSeparate(prevBlendSrc, prevBlendDst, prevBlendSrcA, prevBlendDstA)
      gl.bindBuffer(gl.ARRAY_BUFFER, prevBuffer)
      gl.activeTexture(prevActiveTexture)
      gl.bindTexture(gl.TEXTURE_2D, prevTexture)
      gl.useProgram(prevProgram)

      if (needsRepaint) {
        mapRef.triggerRepaint()
        needsRepaint = false
      }

      if (isMannysActive()) {
        startRepaintLoop()
      } else {
        stopRepaintLoop()
      }
    }
  }
}

// ─── STATE & DOM ─────────────────────────────────────────────────────────────

interface MapState {
  map: mapboxgl.Map | null
  currentLocationIndex: number
}

const state: MapState = {
  map: null,
  currentLocationIndex: 0
}

const elements = {
  mapContainer: document.getElementById('map-container') as HTMLElement,
  locationTitle: document.getElementById('current-location') as HTMLElement,
  locationDesc: document.getElementById('current-description') as HTMLElement,
  locationCoords: document.getElementById('current-coords') as HTMLElement,
  locationPanel: document.querySelector('.location-panel') as HTMLElement,
  locationNav: document.getElementById('location-nav') as HTMLElement,
  loadingOverlay: document.getElementById('loading') as HTMLElement
}

// ─── WebGL CUSTOM LAYER FOR ALL PINS (except Manny's) ───────────────────────
// Renders pin textures directly in Mapbox's WebGL canvas — no jiggle during
// camera rotation, no occlusion by 3D buildings, always visible at any zoom.

const flickerPattern = [1, 1, 0.6, 1, 1, 0.4, 1, 0.7, 1, 0.5, 1, 1, 1, 0.3, 1, 1]

interface PinGLData {
  texture: WebGLTexture
  lngLat: [number, number]
  locationId: string
  locationIndex: number
  lastActiveState: boolean
}

function createAllPinsGLLayer(): mapboxgl.CustomLayerInterface {
  const vertexSource = `
    uniform vec2 u_screenPos;
    uniform vec2 u_size;
    attribute vec2 a_offset;
    attribute vec2 a_uv;
    varying vec2 v_uv;
    void main() {
      vec2 ndcCenter = u_screenPos * 2.0 - 1.0;
      vec2 ndcOffset = a_offset * u_size;
      gl_Position = vec4(ndcCenter + ndcOffset, 0.0, 1.0);
      v_uv = a_uv;
    }
  `

  const fragmentSource = `
    precision mediump float;
    uniform sampler2D u_texture;
    varying vec2 v_uv;
    void main() {
      gl_FragColor = texture2D(u_texture, v_uv);
    }
  `

  let program: WebGLProgram | null = null
  let buffer: WebGLBuffer | null = null
  let aOffset: number
  let aUv: number
  let uScreenPos: WebGLUniformLocation | null
  let uSize: WebGLUniformLocation | null
  let uTexture: WebGLUniformLocation | null
  let mapRef: mapboxgl.Map | null = null
  const pins: PinGLData[] = []

  // Shared canvas for rendering pin imagery before uploading to GL textures
  const renderCanvas = document.createElement('canvas')
  renderCanvas.width = PIN_W; renderCanvas.height = PIN_H
  const renderCtx = renderCanvas.getContext('2d')!

  let lastFlickerTime = 0
  let flickerIndex = 0
  const FLICKER_INTERVAL = 300
  let repaintInterval: ReturnType<typeof setInterval> | null = null

  const isAnimatedPinActive = () => {
    const activeLocation = NYC_LOCATIONS[state.currentLocationIndex]
    return activeLocation ? ANIMATED_PIN_IDS.includes(activeLocation.id) : false
  }

  const stopRepaintLoop = () => {
    if (repaintInterval) {
      clearInterval(repaintInterval)
      repaintInterval = null
    }
  }

  const startRepaintLoop = () => {
    if (repaintInterval || !isAnimatedPinActive() || document.hidden) return
    repaintInterval = setInterval(() => {
      if (document.hidden || !mapRef) return
      if (!isAnimatedPinActive()) {
        stopRepaintLoop()
        return
      }
      mapRef.triggerRepaint()
    }, FLICKER_INTERVAL)
  }

  function uploadPinTexture(gl: WebGLRenderingContext, pin: PinGLData, isActive: boolean, flickerIntensity?: number) {
    const creator = PIN_CREATORS[pin.locationId]
    if (!creator) return
    renderCtx.clearRect(0, 0, PIN_W, PIN_H)
    renderCtx.putImageData(creator(isActive, flickerIntensity), 0, 0)
    gl.bindTexture(gl.TEXTURE_2D, pin.texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, renderCanvas)
  }

  return {
    id: 'all-pins-layer',
    type: 'custom',
    renderingMode: '2d',

    onAdd(map: mapboxgl.Map, gl: WebGLRenderingContext) {
      mapRef = map

      const vs = gl.createShader(gl.VERTEX_SHADER)!
      gl.shaderSource(vs, vertexSource); gl.compileShader(vs)
      const fs = gl.createShader(gl.FRAGMENT_SHADER)!
      gl.shaderSource(fs, fragmentSource); gl.compileShader(fs)

      program = gl.createProgram()!
      gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program)

      aOffset = gl.getAttribLocation(program, 'a_offset')
      aUv = gl.getAttribLocation(program, 'a_uv')
      uScreenPos = gl.getUniformLocation(program, 'u_screenPos')
      uSize = gl.getUniformLocation(program, 'u_size')
      uTexture = gl.getUniformLocation(program, 'u_texture')

      // Quad: two triangles covering [-1,-1] to [1,1] with UVs
      const vertices = new Float32Array([
        -1, -1, 0, 1,  1, -1, 1, 1,  -1, 1, 0, 0,  1, 1, 1, 0,
      ])
      buffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

      // Create a GL texture for each non-Manny's pin
      for (let i = 0; i < NYC_LOCATIONS.length; i++) {
        const loc = NYC_LOCATIONS[i]!
        if (loc.id === 'mannys-music') continue
        if (!PIN_CREATORS[loc.id]) continue

        const isActive = i === state.currentLocationIndex
        renderCtx.clearRect(0, 0, PIN_W, PIN_H)
        renderCtx.putImageData(PIN_CREATORS[loc.id]!(isActive), 0, 0)

        const tex = gl.createTexture()!
        gl.bindTexture(gl.TEXTURE_2D, tex)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, renderCanvas)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

        pins.push({ texture: tex, lngLat: loc.coordinates, locationId: loc.id, locationIndex: i, lastActiveState: isActive })
      }

      if (isAnimatedPinActive()) startRepaintLoop()
    },

    onRemove() {
      if (repaintInterval) {
        clearInterval(repaintInterval)
        repaintInterval = null
      }
    },

    render(gl: WebGLRenderingContext, _matrix: number[]) {
      if (!program || !buffer || !mapRef) return

      // ── Flicker timing for animated pins ──
      const now = performance.now()
      const shouldFlicker = now - lastFlickerTime >= FLICKER_INTERVAL
      let currentFlicker = 1
      if (shouldFlicker) {
        lastFlickerTime = now
        currentFlicker = flickerPattern[flickerIndex % flickerPattern.length]!
        flickerIndex++
      }

      // Re-upload textures only when active state changed or animated flicker advanced
      let needsRepaint = false
      for (const pin of pins) {
        const isActive = pin.locationIndex === state.currentLocationIndex
        const activeChanged = isActive !== pin.lastActiveState
        const isAnimated = ANIMATED_PIN_IDS.includes(pin.locationId)

        if (activeChanged || (isAnimated && shouldFlicker)) {
          uploadPinTexture(gl, pin, isActive, isAnimated ? currentFlicker : undefined)
          pin.lastActiveState = isActive
          needsRepaint = true
        }
      }

      // ── Save ALL GL state (Mapbox uses stencil etc.) ──
      const prevProgram = gl.getParameter(gl.CURRENT_PROGRAM)
      const prevActiveTexture = gl.getParameter(gl.ACTIVE_TEXTURE)
      const prevTexture = gl.getParameter(gl.TEXTURE_BINDING_2D)
      const prevBuffer = gl.getParameter(gl.ARRAY_BUFFER_BINDING)
      const prevBlend = gl.getParameter(gl.BLEND)
      const prevBlendSrc = gl.getParameter(gl.BLEND_SRC_RGB)
      const prevBlendDst = gl.getParameter(gl.BLEND_DST_RGB)
      const prevBlendSrcA = gl.getParameter(gl.BLEND_SRC_ALPHA)
      const prevBlendDstA = gl.getParameter(gl.BLEND_DST_ALPHA)
      const prevDepthTest = gl.getParameter(gl.DEPTH_TEST)
      const prevStencilTest = gl.getParameter(gl.STENCIL_TEST)

      gl.useProgram(program)
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
      gl.disable(gl.DEPTH_TEST)
      gl.disable(gl.STENCIL_TEST)

      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.enableVertexAttribArray(aOffset)
      gl.vertexAttribPointer(aOffset, 2, gl.FLOAT, false, 16, 0)
      gl.enableVertexAttribArray(aUv)
      gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 16, 8)

      gl.uniform1i(uTexture, 0)
      gl.activeTexture(gl.TEXTURE0)

      const cvs = mapRef.getCanvas()
      const width = cvs.clientWidth
      const height = cvs.clientHeight

      // Draw inactive pins first, then active on top
      for (let pass = 0; pass < 2; pass++) {
        for (const pin of pins) {
          const isActive = pin.locationIndex === state.currentLocationIndex
          if (pass === 0 && isActive) continue   // skip active on first pass
          if (pass === 1 && !isActive) continue   // skip inactive on second pass

          const screenPoint = mapRef.project(pin.lngLat)
          const normalizedX = screenPoint.x / width
          const normalizedY = 1.0 - (screenPoint.y / height)

          const scale = isActive ? 0.85 : 0.7
          const sizeX = (PIN_W / 2 * scale) / width
          const sizeY = (PIN_H / 2 * scale) / height

          gl.uniform2f(uScreenPos, normalizedX, normalizedY)
          gl.uniform2f(uSize, sizeX, sizeY)
          gl.bindTexture(gl.TEXTURE_2D, pin.texture)
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
        }
      }

      gl.disableVertexAttribArray(aOffset)
      gl.disableVertexAttribArray(aUv)

      // ── Restore ALL state exactly as Mapbox left it ──
      if (prevStencilTest) gl.enable(gl.STENCIL_TEST)
      else gl.disable(gl.STENCIL_TEST)
      if (prevDepthTest) gl.enable(gl.DEPTH_TEST)
      else gl.disable(gl.DEPTH_TEST)
      if (prevBlend) gl.enable(gl.BLEND)
      else gl.disable(gl.BLEND)
      gl.blendFuncSeparate(prevBlendSrc, prevBlendDst, prevBlendSrcA, prevBlendDstA)
      gl.bindBuffer(gl.ARRAY_BUFFER, prevBuffer)
      gl.activeTexture(prevActiveTexture)
      gl.bindTexture(gl.TEXTURE_2D, prevTexture)
      gl.useProgram(prevProgram)

      if (needsRepaint) {
        mapRef.triggerRepaint()
      }

      const activeAnimatedPin = NYC_LOCATIONS[state.currentLocationIndex]
      const isAnimatedActive = activeAnimatedPin ? ANIMATED_PIN_IDS.includes(activeAnimatedPin.id) : false
      if (isAnimatedActive) {
        startRepaintLoop()
      } else {
        stopRepaintLoop()
      }
    }
  }
}

// ─── GEOJSON & UI ────────────────────────────────────────────────────────────

function createLocationsGeoJSON(): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: NYC_LOCATIONS.map((location, index) => ({
      type: 'Feature' as const,
      properties: {
        id: location.id,
        name: location.name,
        index: index,
        active: index === state.currentLocationIndex,
        isMannys: location.id === 'mannys-music'
      },
      geometry: {
        type: 'Point' as const,
        coordinates: location.coordinates
      }
    }))
  }
}

function updatePanelPill(): void {
  const pillText = document.querySelector('.location-panel__pill-text')
  if (pillText) {
    pillText.textContent = NYC_LOCATIONS[state.currentLocationIndex]?.name ?? 'Open'
  }
}

function updateLocationUI(index: number, skipTransition = false): void {
  const location = NYC_LOCATIONS[index]
  if (!location) return

  const learnMoreBtn = document.getElementById('learn-more-btn') as HTMLElement | null
  if (learnMoreBtn) {
    learnMoreBtn.style.display = location.id === 'christies' ? 'none' : ''
  }

  if (skipTransition) {
    elements.locationTitle.textContent = location.name
    elements.locationDesc.textContent = location.description
    if (elements.locationCoords) elements.locationCoords.textContent = formatCoords(location.coordinates)
    updatePanelPill()
  } else {
    elements.locationPanel.classList.add('transitioning')
    setTimeout(() => {
      elements.locationTitle.textContent = location.name
      elements.locationDesc.textContent = location.description
      if (elements.locationCoords) elements.locationCoords.textContent = formatCoords(location.coordinates)
      elements.locationPanel.classList.remove('transitioning')
      updatePanelPill()
    }, 200)
  }

  const navButtons = elements.locationNav.querySelectorAll('.location-nav__btn')
  navButtons.forEach((btn, i) => {
    btn.classList.toggle('active', i === index)
  })

  if (state.map && state.map.getSource('locations')) {
    const source = state.map.getSource('locations') as mapboxgl.GeoJSONSource
    source.setData(createLocationsGeoJSON())
  }

  showRouteToChristies(location.id)
}

function goToLocation(index: number, skipTransition = false): void {
  if (!state.map) return

  const isSameLocation = index === state.currentLocationIndex

  state.map.stop()

  state.currentLocationIndex = index

  if (!isSameLocation) {
    updateLocationUI(index, skipTransition)
  }

  const location = NYC_LOCATIONS[index]!

  state.map.flyTo({
    center: location.coordinates,
    zoom: getZoom(),
    pitch: PITCH,
    bearing: 0,
    offset: getOffset(),
    duration: 2500,
    essential: !prefersReducedMotion.matches
  })
}

// ─── MAP INITIALIZATION ─────────────────────────────────────────────────────

export function initMap(): void {
  mapboxgl.accessToken = MAPBOX_TOKEN

  const center = getLocationCenter()

  // Calculate bounds - expanded for Long Island / Harlem spread
  const lngs = NYC_LOCATIONS.map(l => l.coordinates[0])
  const lats = NYC_LOCATIONS.map(l => l.coordinates[1])
  const lngRange = Math.max(...lngs) - Math.min(...lngs)
  const latRange = Math.max(...lats) - Math.min(...lats)
  const lngPad = Math.max(0.03, lngRange * 0.3)
  const latPad = Math.max(0.03, latRange * 0.3)
  const bounds: [[number, number], [number, number]] = [
    [Math.min(...lngs) - lngPad, Math.min(...lats) - latPad],
    [Math.max(...lngs) + lngPad, Math.max(...lats) + latPad]
  ]

  state.map = new mapboxgl.Map({
    container: elements.mapContainer,
    style: 'mapbox://styles/mapbox/standard',
    center: center,
    zoom: 12,
    pitch: PITCH,
    bearing: 0,
    antialias: true,
    interactive: true,
    minZoom: 10,
    maxZoom: 19,
    maxBounds: bounds,
    logoPosition: 'bottom-right',
    attributionControl: false
  })

  state.map.on('style.load', () => {
    state.map!.setConfigProperty('basemap', 'lightPreset', 'dusk')
    state.map!.setConfigProperty('basemap', 'showPointOfInterestLabels', false)
    state.map!.setConfigProperty('basemap', 'showTransitLabels', false)
    state.map!.setConfigProperty('basemap', 'showPlaceLabels', false)
    state.map!.setConfigProperty('basemap', 'showRoadLabels', false)
  })

  state.map.on('load', () => {
    state.map!.addSource('locations', {
      type: 'geojson',
      data: createLocationsGeoJSON()
    })

    // ─── Add WebGL neon layer for Manny's ─────────────────────────────

    const mannysLocation = NYC_LOCATIONS.find(l => l.id === 'mannys-music')
    if (mannysLocation) {
      state.map!.addLayer(createNeonGlowLayer(mannysLocation.coordinates))
    }

    // Filter to exclude Manny's from symbol layers (it uses WebGL layer)
    const excludeMannysFilter: mapboxgl.FilterSpecification = ['!=', ['get', 'id'], 'mannys-music']

    // ─── Glow layers ──────────────────────────────────────────────────

    state.map!.addLayer({
      id: 'location-markers-outer-glow',
      type: 'circle',
      source: 'locations',
      filter: excludeMannysFilter,
      slot: 'top',
      paint: {
        'circle-radius': [
          'interpolate', ['linear'], ['zoom'],
          10, ['case', ['get', 'active'], 18, 14],
          13, ['case', ['get', 'active'], 30, 24],
          16, ['case', ['get', 'active'], 45, 35]
        ],
        'circle-color': '#006838',
        'circle-opacity': ['case', ['get', 'active'], 0.2, 0.1],
        'circle-blur': 1
      }
    })

    state.map!.addLayer({
      id: 'location-markers-inner-glow',
      type: 'circle',
      source: 'locations',
      filter: excludeMannysFilter,
      slot: 'top',
      paint: {
        'circle-radius': [
          'interpolate', ['linear'], ['zoom'],
          10, ['case', ['get', 'active'], 12, 9],
          13, ['case', ['get', 'active'], 20, 15],
          16, ['case', ['get', 'active'], 28, 22]
        ],
        'circle-color': ['case', ['get', 'active'], '#ffffff', '#006838'],
        'circle-opacity': ['case', ['get', 'active'], 0.3, 0.15],
        'circle-blur': 0.8
      }
    })

    // ─── WebGL pin layer for all non-Manny's pins ──────────────────────

    state.map!.addLayer(createAllPinsGLLayer())

    // ─── Unified click / hover for ALL pins (Manny's + WebGL pins) ───

    const hitTestPinAtPoint = (point: mapboxgl.PointLike) => {
      const testPoint = mapboxgl.Point.convert(point)

      for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < NYC_LOCATIONS.length; i++) {
          const isActive = i === state.currentLocationIndex
          if (pass === 0 && !isActive) continue // active first (on top)
          if (pass === 1 && isActive) continue

          const loc = NYC_LOCATIONS[i]!
          const screenPos = state.map!.project(loc.coordinates)

          // Manny's WebGL layer is 140×52 px; other pins use scale-based size
          const halfW = loc.id === 'mannys-music'
            ? 70
            : (PIN_W / 4) * (isActive ? 0.85 : 0.7)
          const halfH = loc.id === 'mannys-music'
            ? 26
            : (PIN_H / 4) * (isActive ? 0.85 : 0.7)

          if (Math.abs(testPoint.x - screenPos.x) <= halfW && Math.abs(testPoint.y - screenPos.y) <= halfH) {
            return i
          }
        }
      }

      return -1
    }

    const goToPinIfHit = (point: mapboxgl.PointLike) => {
      const hitIndex = hitTestPinAtPoint(point)
      if (hitIndex >= 0) {
        goToLocation(hitIndex)
      }
    }

    state.map!.on('click', e => {
      goToPinIfHit(e.point)
    })

    let moveRaf = 0
    let pendingMovePoint: mapboxgl.PointLike | null = null

    const updateCursorForPinHover = (point: mapboxgl.PointLike) => {
      const hit = hitTestPinAtPoint(point) >= 0
      state.map!.getCanvas().style.cursor = hit ? 'pointer' : ''
    }

    state.map!.on('mousemove', e => {
      pendingMovePoint = e.point
      if (moveRaf) return

      moveRaf = requestAnimationFrame(() => {
        moveRaf = 0
        if (pendingMovePoint) {
          updateCursorForPinHover(pendingMovePoint)
        }
      })
    })

    state.map!.on('mouseout', () => {
      if (moveRaf) {
        cancelAnimationFrame(moveRaf)
        moveRaf = 0
      }
      pendingMovePoint = null
      state.map!.getCanvas().style.cursor = ''
    })

 

    // ─── Start ────────────────────────────────────────────────────────

    elements.loadingOverlay.classList.add('hidden')

    const firstLocation = NYC_LOCATIONS[0]!
    state.map!.flyTo({
      center: firstLocation.coordinates,
      zoom: getZoom(),
      pitch: PITCH,
      bearing: 0,
      offset: getOffset(),
      duration: 3000,
      essential: !prefersReducedMotion.matches
    })

    showRouteToChristies(firstLocation.id)
  })

  // ─── Event listeners ──────────────────────────────────────────────────

  const navButtons = elements.locationNav.querySelectorAll('.location-nav__btn')
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt((btn as HTMLElement).dataset.index || '0', 10)
      goToLocation(index)
    })
  })

  // ─── Collapsible panel (≤1280px) ─────────────────────────────────────
  const panelPill = document.getElementById('panel-pill')
  const panelCollapse = document.getElementById('panel-collapse')

  if (window.innerWidth <= 1280) {
    elements.locationPanel.classList.add('collapsed')
    updatePanelPill()
  }

  // Expand: fade out pill, swap to panel, fade in
  panelPill?.addEventListener('click', () => {
    elements.locationPanel.style.opacity = '0'
    setTimeout(() => {
      elements.locationPanel.classList.remove('collapsed')
      void elements.locationPanel.offsetHeight
      elements.locationPanel.style.opacity = ''
    }, 250)
  })

  // Collapse: fade out panel, swap to pill, fade in
  panelCollapse?.addEventListener('click', () => {
    updatePanelPill()
    elements.locationPanel.style.opacity = '0'
    setTimeout(() => {
      elements.locationPanel.classList.add('collapsed')
      void elements.locationPanel.offsetHeight
      elements.locationPanel.style.opacity = ''
    }, 250)
  })

  // Swipe left/right on location panel to navigate locations (mobile)
  let touchStartX = 0
  let touchStartY = 0
  let swiping = false
  elements.locationPanel.addEventListener('touchstart', (e: TouchEvent) => {
    touchStartX = e.changedTouches[0]!.clientX
    touchStartY = e.changedTouches[0]!.clientY
  }, { passive: true })
  elements.locationPanel.addEventListener('touchend', (e: TouchEvent) => {
    const dx = e.changedTouches[0]!.clientX - touchStartX
    const dy = e.changedTouches[0]!.clientY - touchStartY
    if (swiping || !(Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50)) return
    swiping = true
    const goLeft = dx < 0 // swipe left = next
    const nextIndex = goLeft
      ? (state.currentLocationIndex + 1) % NYC_LOCATIONS.length
      : (state.currentLocationIndex - 1 + NYC_LOCATIONS.length) % NYC_LOCATIONS.length

    // Slide panel out in swipe direction
    elements.locationPanel.classList.add(goLeft ? 'swipe-out-left' : 'swipe-out-right')

    setTimeout(() => {
      // Update content while offscreen
      elements.locationPanel.classList.remove('swipe-out-left', 'swipe-out-right')
      // Position on opposite side for entrance (with transition: none)
      elements.locationPanel.classList.add(goLeft ? 'swipe-in-left' : 'swipe-in-right')
      goToLocation(nextIndex, true)
      // Force reflow then remove class to animate back to default position
      void elements.locationPanel.offsetHeight
      elements.locationPanel.classList.remove('swipe-in-left', 'swipe-in-right')
      // Unlock after slide-in transition completes
      const onEnd = () => {
        swiping = false
        elements.locationPanel.removeEventListener('transitionend', onEnd)
      }
      elements.locationPanel.addEventListener('transitionend', onEnd)
    }, 250)
  }, { passive: true })
}

// ─── CLEANUP ─────────────────────────────────────────────────────────────────

export function destroyMap(): void {
  state.map?.remove()
}

export function getCurrentLocationId(): string | null {
  const location = NYC_LOCATIONS[state.currentLocationIndex]
  return location ? location.id : null
}

export function getMap(): mapboxgl.Map | null {
  return state.map
}
