import mapboxgl from 'mapbox-gl'
import { NYC_LOCATIONS, getLocationCenter, formatCoords } from './locations'
import { showRouteToChristies } from './routeService'

// Configuration
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'YOUR_MAPBOX_TOKEN_HERE'
const ROTATION_DURATION = 180000 // Duration per location in ms (3 minutes for full rotation - very slow)
const PITCH = 65
const ZOOM = 17
const ROTATION_SPEED = 360 / ROTATION_DURATION // degrees per ms

// Location image mapping (location ID → image filename in /public)
const LOCATION_IMAGES: Record<string, string> = {
  'ed-sullivan': '/edsullivan.png',
  'cbs-studios': '/CBS.png',
  'carnegie-hall': '/carnegiehall.png',
  'rko-theatre': '/RKO.png',
  'madison-square-garden': '/MSG.png',
  'christies': '/christies.png'
  // mannys-music will use custom neon sign
}

// Create canvas-based neon sign for Manny's Music Store
// Classic script style like the original storefront sign
// flickerIntensity: 0-1, where 1 is full brightness, 0 is dimmed
function createMannysNeonSign(isActive: boolean, flickerIntensity: number = 1): ImageData {
  const width = 320
  const height = 120
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  // Apply flicker to glow values
  const glowMultiplier = 0.3 + (flickerIntensity * 0.7)
  const baseBlur = isActive ? 25 : 18

  // Transparent/dark background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.beginPath()
  ctx.roundRect(0, 0, width, height, 12)
  ctx.fill()

  // Neon border - outer glow
  ctx.strokeStyle = `rgba(255, 26, 75, ${0.5 * flickerIntensity})`
  ctx.lineWidth = 6
  ctx.shadowColor = '#ff1a4b'
  ctx.shadowBlur = baseBlur * 1.2 * glowMultiplier
  ctx.beginPath()
  ctx.roundRect(8, 8, width - 16, height - 16, 8)
  ctx.stroke()

  // Neon border - bright inner line
  ctx.strokeStyle = `rgba(255, 200, 210, ${0.8 * flickerIntensity})`
  ctx.lineWidth = 2
  ctx.shadowColor = '#ffffff'
  ctx.shadowBlur = 8 * glowMultiplier
  ctx.beginPath()
  ctx.roundRect(8, 8, width - 16, height - 16, 8)
  ctx.stroke()

  // Script font for "Manny's" - red/pink neon like classic signs
  ctx.font = 'italic 58px "Brush Script MT", "Segoe Script", cursive'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const textY = height / 2 - 8

  // Outer glow layer - red/pink
  ctx.shadowColor = '#ff1a4b'
  ctx.shadowBlur = baseBlur * 1.5 * glowMultiplier
  ctx.fillStyle = `rgba(255, 26, 75, ${0.6 * flickerIntensity})`
  ctx.fillText("Manny's", width / 2, textY)

  // Middle glow layer
  ctx.shadowColor = '#ff6b8a'
  ctx.shadowBlur = baseBlur * glowMultiplier
  ctx.fillStyle = `rgba(255, 107, 138, ${0.8 * flickerIntensity})`
  ctx.fillText("Manny's", width / 2, textY)

  // Inner bright layer
  ctx.shadowColor = '#ffffff'
  ctx.shadowBlur = (isActive ? 8 : 5) * glowMultiplier
  ctx.fillStyle = isActive ? '#ffffff' : '#ffccd5'
  ctx.fillText("Manny's", width / 2, textY)

  // Swooping underline
  ctx.beginPath()
  ctx.moveTo(60, textY + 30)
  ctx.quadraticCurveTo(width / 2, textY + 45, width - 50, textY + 25)
  ctx.strokeStyle = `rgba(255, 107, 138, ${flickerIntensity})`
  ctx.lineWidth = 3
  ctx.shadowColor = '#ff1a4b'
  ctx.shadowBlur = baseBlur * glowMultiplier
  ctx.stroke()

  // Bright underline on top
  ctx.strokeStyle = isActive ? '#ffffff' : '#ffccd5'
  ctx.lineWidth = 2
  ctx.shadowBlur = 5 * glowMultiplier
  ctx.shadowColor = '#ffffff'
  ctx.stroke()

  return ctx.getImageData(0, 0, width, height)
}

// Custom WebGL Neon Layer for Manny's Music - Billboard style (always faces camera)
function createNeonGlowLayer(coordinates: [number, number]): mapboxgl.CustomLayerInterface {
  // Vertex shader - uses pre-computed screen position from CPU
  const vertexSource = `
    uniform vec2 u_screenPos;    // Screen position (0-1 normalized)
    uniform vec2 u_size;         // Size in NDC units
    attribute vec2 a_offset;     // Corner offset (-1 to 1)
    attribute vec2 a_uv;
    varying vec2 v_uv;

    void main() {
      // Convert screen pos (0-1) to NDC (-1 to 1)
      vec2 ndcCenter = u_screenPos * 2.0 - 1.0;

      // Apply corner offset
      vec2 ndcOffset = a_offset * u_size;

      // Final position in NDC
      gl_Position = vec4(ndcCenter + ndcOffset, 0.0, 1.0);
      v_uv = a_uv;
    }
  `

  // Fragment shader with animated border light
  const fragmentSource = `
    precision mediump float;
    uniform sampler2D u_texture;
    uniform float u_time;
    varying vec2 v_uv;

    void main() {
      vec2 uv = v_uv;
      vec4 color = texture2D(u_texture, uv);

      // Subtle flicker for the text
      float flicker = 0.92 + 0.08 * sin(u_time * 6.0) * sin(u_time * 9.0);

      // Detect if we're near the border (edge of the sign)
      float borderThickness = 0.08;
      float distFromEdge = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
      float isBorder = 1.0 - smoothstep(0.0, borderThickness, distFromEdge);

      // Detect red/pink border color (high red, lower green/blue)
      float isRedBorder = step(0.3, color.r) * step(color.g, color.r * 0.8) * isBorder;

      // Calculate position along the border perimeter (0 to 1)
      float perimeter = 0.0;
      float totalPerim = 2.0 * (1.0 + 0.375);

      if (uv.y < borderThickness) {
        perimeter = uv.x;
      } else if (uv.x > 1.0 - borderThickness) {
        perimeter = 1.0 + uv.y * 0.375;
      } else if (uv.y > 1.0 - borderThickness) {
        perimeter = 1.0 + 0.375 + (1.0 - uv.x);
      } else if (uv.x < borderThickness) {
        perimeter = 2.0 + 0.375 + (1.0 - uv.y) * 0.375;
      }

      float perimPos = perimeter / totalPerim;

      // Two traveling lights going opposite directions
      float lightPos1 = fract(u_time * 0.4);
      float lightPos2 = fract(-u_time * 0.3 + 0.5);

      // Distance from traveling lights (with wrap-around)
      float dist1 = min(abs(perimPos - lightPos1), min(abs(perimPos - lightPos1 + 1.0), abs(perimPos - lightPos1 - 1.0)));
      float dist2 = min(abs(perimPos - lightPos2), min(abs(perimPos - lightPos2 + 1.0), abs(perimPos - lightPos2 - 1.0)));

      // Light intensity with tail effect
      float light1 = 1.0 - smoothstep(0.0, 0.2, dist1);
      float light2 = 1.0 - smoothstep(0.0, 0.15, dist2);
      float combinedLight = max(light1, light2 * 0.7);

      // Base color with flicker
      vec3 finalColor = color.rgb * flicker;

      // Animate the red border - brighten where light passes
      if (isRedBorder > 0.1) {
        // Intensify the red/pink neon where light is
        vec3 neonBoost = vec3(1.0, 0.3, 0.5) * combinedLight * 1.5;
        finalColor += neonBoost * isRedBorder;

        // Add white-hot center to the traveling light
        finalColor += vec3(1.0, 0.9, 0.95) * combinedLight * combinedLight * isRedBorder * 0.6;
      }

      // Add bright spot traveling light on all border areas
      if (isBorder > 0.1) {
        finalColor += vec3(1.0, 0.7, 0.8) * light1 * isBorder * 0.4;
      }

      // Slight bloom
      float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      finalColor += color.rgb * brightness * 0.1;

      gl_FragColor = vec4(finalColor, color.a * flicker);
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
  let uTime: WebGLUniformLocation | null
  let startTime = Date.now()
  let mapRef: mapboxgl.Map | null = null

  // Store the LngLat for projection
  const lngLat: [number, number] = coordinates

  return {
    id: 'neon-glow-layer',
    type: 'custom',
    renderingMode: '2d',

    onAdd(map: mapboxgl.Map, gl: WebGLRenderingContext) {
      mapRef = map

      // Compile shaders
      const vertexShader = gl.createShader(gl.VERTEX_SHADER)!
      gl.shaderSource(vertexShader, vertexSource)
      gl.compileShader(vertexShader)

      // Check for vertex shader errors
      if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error('Vertex shader error:', gl.getShaderInfoLog(vertexShader))
      }

      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!
      gl.shaderSource(fragmentShader, fragmentSource)
      gl.compileShader(fragmentShader)

      // Check for fragment shader errors
      if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error('Fragment shader error:', gl.getShaderInfoLog(fragmentShader))
      }

      // Create program
      program = gl.createProgram()!
      gl.attachShader(program, vertexShader)
      gl.attachShader(program, fragmentShader)
      gl.linkProgram(program)

      // Check for linking errors
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program))
      }

      // Get locations
      aOffset = gl.getAttribLocation(program, 'a_offset')
      aUv = gl.getAttribLocation(program, 'a_uv')
      uScreenPos = gl.getUniformLocation(program, 'u_screenPos')
      uSize = gl.getUniformLocation(program, 'u_size')
      uTexture = gl.getUniformLocation(program, 'u_texture')
      uTime = gl.getUniformLocation(program, 'u_time')

      // Quad vertices: offset (-1 to 1) + UV coordinates
      const vertices = new Float32Array([
        // offset (x, y), UV (u, v)
        -1, -1,  0, 1,  // bottom-left
         1, -1,  1, 1,  // bottom-right
        -1,  1,  0, 0,  // top-left
         1,  1,  1, 0,  // top-right
      ])

      buffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

      // Create texture from canvas
      const canvas = document.createElement('canvas')
      canvas.width = 320
      canvas.height = 120
      const ctx = canvas.getContext('2d')!

      // Draw the neon sign to canvas
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'
      ctx.beginPath()
      ctx.roundRect(0, 0, 320, 120, 12)
      ctx.fill()

      // Neon border - outer glow
      ctx.strokeStyle = 'rgba(255, 26, 75, 0.6)'
      ctx.lineWidth = 6
      ctx.shadowColor = '#ff1a4b'
      ctx.shadowBlur = 25
      ctx.beginPath()
      ctx.roundRect(8, 8, 304, 104, 8)
      ctx.stroke()

      // Neon border - bright inner
      ctx.strokeStyle = 'rgba(255, 200, 210, 0.9)'
      ctx.lineWidth = 2
      ctx.shadowColor = '#ffffff'
      ctx.shadowBlur = 10
      ctx.stroke()

      // Text - "Manny's" in script
      ctx.font = 'italic 58px "Brush Script MT", "Segoe Script", cursive'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // Outer glow
      ctx.shadowColor = '#ff1a4b'
      ctx.shadowBlur = 35
      ctx.fillStyle = 'rgba(255, 26, 75, 0.7)'
      ctx.fillText("Manny's", 160, 52)

      // Middle glow
      ctx.shadowColor = '#ff6b8a'
      ctx.shadowBlur = 20
      ctx.fillStyle = 'rgba(255, 107, 138, 0.9)'
      ctx.fillText("Manny's", 160, 52)

      // Bright center
      ctx.shadowColor = '#ffffff'
      ctx.shadowBlur = 8
      ctx.fillStyle = '#ffffff'
      ctx.fillText("Manny's", 160, 52)

      // Underline swoosh
      ctx.beginPath()
      ctx.moveTo(60, 82)
      ctx.quadraticCurveTo(160, 100, 270, 77)
      ctx.strokeStyle = 'rgba(255, 107, 138, 1)'
      ctx.lineWidth = 3
      ctx.shadowColor = '#ff1a4b'
      ctx.shadowBlur = 20
      ctx.stroke()

      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.shadowBlur = 5
      ctx.stroke()

      // Create WebGL texture
      texture = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

      startTime = Date.now()
    },

    render(gl: WebGLRenderingContext, _matrix: number[]) {
      if (!program || !buffer || !texture || !mapRef) return

      // Use Mapbox's project() for stable screen coordinates
      // project() returns CSS pixels, so use canvas client dimensions
      const screenPoint = mapRef.project(lngLat)
      const canvas = mapRef.getCanvas()
      const width = canvas.clientWidth
      const height = canvas.clientHeight

      // Normalize to 0-1 range (note: Y is flipped in WebGL)
      const normalizedX = screenPoint.x / width
      const normalizedY = 1.0 - (screenPoint.y / height)

      // Size in NDC units (pixels / viewport)
      const sizeX = 140 / width
      const sizeY = 52 / height

      // Save WebGL state
      const prevProgram = gl.getParameter(gl.CURRENT_PROGRAM)
      const prevActiveTexture = gl.getParameter(gl.ACTIVE_TEXTURE)
      const prevTexture = gl.getParameter(gl.TEXTURE_BINDING_2D)
      const prevBuffer = gl.getParameter(gl.ARRAY_BUFFER_BINDING)
      const prevBlend = gl.getParameter(gl.BLEND)
      const prevDepthTest = gl.getParameter(gl.DEPTH_TEST)

      gl.useProgram(program)

      // Set uniforms
      gl.uniform2f(uScreenPos, normalizedX, normalizedY)
      gl.uniform2f(uSize, sizeX, sizeY)
      gl.uniform1i(uTexture, 0)
      gl.uniform1f(uTime, (Date.now() - startTime) / 1000)

      // Bind texture
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, texture)

      // Bind buffer and set attributes
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.enableVertexAttribArray(aOffset)
      gl.vertexAttribPointer(aOffset, 2, gl.FLOAT, false, 16, 0)
      gl.enableVertexAttribArray(aUv)
      gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 16, 8)

      // Set up blending and disable depth test for billboard
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
      gl.disable(gl.DEPTH_TEST)

      // Draw quad
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

      // Restore WebGL state for Mapbox
      gl.disableVertexAttribArray(aOffset)
      gl.disableVertexAttribArray(aUv)

      if (prevDepthTest) gl.enable(gl.DEPTH_TEST)
      else gl.disable(gl.DEPTH_TEST)

      if (prevBlend) gl.enable(gl.BLEND)
      else gl.disable(gl.BLEND)

      gl.bindBuffer(gl.ARRAY_BUFFER, prevBuffer)
      gl.activeTexture(prevActiveTexture)
      gl.bindTexture(gl.TEXTURE_2D, prevTexture)
      gl.useProgram(prevProgram)

      // Request continuous rendering for animation
      mapRef.triggerRepaint()
    }
  }
}

// Track if using WebGL neon layer
const useWebGLNeon = true

// Neon flicker animation state (fallback when not using WebGL)
let neonFlickerInterval: number | null = null

function startNeonFlicker(): void {
  if (neonFlickerInterval) return
  const flickerPattern = [1, 1, 0.6, 1, 1, 0.4, 1, 1, 0.7, 1, 0.5, 1, 1, 1, 0.3, 1]
  let patternIndex = 0

  neonFlickerInterval = window.setInterval(() => {
    if (!state.map) return
    const intensity = flickerPattern[patternIndex]
    patternIndex = (patternIndex + 1) % flickerPattern.length
    state.map.updateImage('mannys-neon', createMannysNeonSign(false, intensity))
    state.map.updateImage('mannys-neon-active', createMannysNeonSign(true, intensity))
    state.map.triggerRepaint()
  }, 150)
}

function stopNeonFlicker(): void {
  if (neonFlickerInterval) {
    clearInterval(neonFlickerInterval)
    neonFlickerInterval = null
  }
}

// State
interface MapState {
  map: mapboxgl.Map | null
  currentLocationIndex: number
  isPlaying: boolean
  animationId: number | null
  flyToTimeoutId: number | null
  lastTimestamp: number
  rotationAngle: number
}

const state: MapState = {
  map: null,
  currentLocationIndex: 0,
  isPlaying: true,
  animationId: null,
  flyToTimeoutId: null,
  lastTimestamp: 0,
  rotationAngle: 0
}

// DOM Elements cache
const elements = {
  mapContainer: document.getElementById('map-container') as HTMLElement,
  locationTitle: document.getElementById('current-location') as HTMLElement,
  locationDesc: document.getElementById('current-description') as HTMLElement,
  locationCoords: document.getElementById('current-coords') as HTMLElement,
  locationPanel: document.querySelector('.location-panel') as HTMLElement,
  locationNav: document.getElementById('location-nav') as HTMLElement,
  playPauseBtn: document.getElementById('play-pause') as HTMLElement,
  loadingOverlay: document.getElementById('loading') as HTMLElement
}

// Create GeoJSON for all locations
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
        hasImage: location.id in LOCATION_IMAGES,
        hasNeonSign: location.id === 'mannys-music'
      },
      geometry: {
        type: 'Point' as const,
        coordinates: location.coordinates
      }
    }))
  }
}

// Update UI for current location
function updateLocationUI(index: number): void {
  const location = NYC_LOCATIONS[index]
  if (!location) return

  // Animate panel transition
  elements.locationPanel.classList.add('transitioning')

  setTimeout(() => {
    elements.locationTitle.textContent = location.name
    elements.locationDesc.textContent = location.description
    elements.locationCoords.textContent = formatCoords(location.coordinates)
    elements.locationPanel.classList.remove('transitioning')
  }, 200)

  // Update navigation
  const navButtons = elements.locationNav.querySelectorAll('.location-nav__btn')
  navButtons.forEach((btn, i) => {
    btn.classList.toggle('active', i === index)
  })

  // Update GeoJSON source to reflect active marker
  if (state.map && state.map.getSource('locations')) {
    const geojson = createLocationsGeoJSON()
    const source = state.map.getSource('locations') as mapboxgl.GeoJSONSource
    source.setData(geojson)
  }

  // Show route to Christie's from this location
  showRouteToChristies(location.id)
}

// Animate camera rotation - smooth continuous rotation
function animateCamera(timestamp: number): void {
  if (!state.map || !state.isPlaying) return

  const deltaTime = state.lastTimestamp ? timestamp - state.lastTimestamp : 0
  state.lastTimestamp = timestamp

  // Update rotation angle (bearing) - very slow continuous rotation
  state.rotationAngle += deltaTime * ROTATION_SPEED

  // Normalize bearing to 0-360
  if (state.rotationAngle >= 360) {
    state.rotationAngle -= 360
    // Move to next location after full rotation
    state.currentLocationIndex = (state.currentLocationIndex + 1) % NYC_LOCATIONS.length
    updateLocationUI(state.currentLocationIndex)

    const nextLocation = NYC_LOCATIONS[state.currentLocationIndex]!

    // Smoothly fly to next location
    state.map.flyTo({
      center: nextLocation.coordinates,
      zoom: ZOOM,
      pitch: PITCH,
      bearing: state.rotationAngle,
      duration: 4000,
      essential: true
    })
  } else {
    // Direct bearing update for smooth rotation (no animation conflicts)
    state.map.setBearing(state.rotationAngle)
  }

  state.animationId = requestAnimationFrame(animateCamera)
}

// Go to specific location
function goToLocation(index: number): void {
  if (!state.map) return

  // Allow clicking same location to re-center on it
  const isSameLocation = index === state.currentLocationIndex

  // Stop any in-progress camera animation (including initial flyTo)
  state.map.stop()

  // Stop rotation animation
  if (state.animationId) {
    cancelAnimationFrame(state.animationId)
    state.animationId = null
  }

  // Clear any pending flyTo timeout
  if (state.flyToTimeoutId) {
    clearTimeout(state.flyToTimeoutId)
    state.flyToTimeoutId = null
  }

  state.currentLocationIndex = index
  state.rotationAngle = 0
  state.lastTimestamp = 0

  if (!isSameLocation) {
    updateLocationUI(index)
  }

  const location = NYC_LOCATIONS[index]!

  // Smooth fly to new location
  state.map.flyTo({
    center: location.coordinates,
    zoom: ZOOM,
    pitch: PITCH,
    bearing: 0,
    duration: 2500,
    essential: true
  })

  // Resume animation after flyTo completes
  state.flyToTimeoutId = window.setTimeout(() => {
    state.flyToTimeoutId = null
    if (state.isPlaying) {
      state.lastTimestamp = 0
      state.animationId = requestAnimationFrame(animateCamera)
    }
  }, 2600) // Slightly longer than flyTo to ensure it completes
}

// Toggle play/pause
function togglePlayPause(): void {
  state.isPlaying = !state.isPlaying

  const pauseIcon = elements.playPauseBtn.querySelector('.controls__icon--pause') as HTMLElement
  const playIcon = elements.playPauseBtn.querySelector('.controls__icon--play') as HTMLElement

  pauseIcon.classList.toggle('hidden', !state.isPlaying)
  playIcon.classList.toggle('hidden', state.isPlaying)

  if (state.isPlaying) {
    state.lastTimestamp = 0
    state.animationId = requestAnimationFrame(animateCamera)
  } else {
    if (state.animationId) {
      cancelAnimationFrame(state.animationId)
      state.animationId = null
    }
  }
}

// Initialize map
export function initMap(): void {
  mapboxgl.accessToken = MAPBOX_TOKEN

  const center = getLocationCenter()

  // Calculate bounds from locations with padding
  const lngs = NYC_LOCATIONS.map(l => l.coordinates[0])
  const lats = NYC_LOCATIONS.map(l => l.coordinates[1])
  const padding = 0.015 // ~1.5km padding
  const bounds: [[number, number], [number, number]] = [
    [Math.min(...lngs) - padding, Math.min(...lats) - padding], // SW
    [Math.max(...lngs) + padding, Math.max(...lats) + padding]  // NE
  ]

  state.map = new mapboxgl.Map({
    container: elements.mapContainer,
    style: 'mapbox://styles/mapbox/standard',
    center: center,
    zoom: 14,
    pitch: PITCH,
    bearing: 0,
    antialias: true,
    interactive: true,
    minZoom: 14,
    maxZoom: 19,
    maxBounds: bounds,
    logoPosition: 'bottom-right',
    attributionControl: false
  })

  state.map.on('style.load', () => {
    // Configure the Standard style for dusk mode with 3D buildings
    state.map!.setConfigProperty('basemap', 'lightPreset', 'dusk')
    state.map!.setConfigProperty('basemap', 'showPointOfInterestLabels', false)
    state.map!.setConfigProperty('basemap', 'showTransitLabels', false)
    state.map!.setConfigProperty('basemap', 'showPlaceLabels', false)
    state.map!.setConfigProperty('basemap', 'showRoadLabels', false)
  })

  state.map.on('load', () => {

    // Add GeoJSON source for location markers
    state.map!.addSource('locations', {
      type: 'geojson',
      data: createLocationsGeoJSON()
    })

    // Function to create fallback diamond marker
    function createDiamondMarker(isActive: boolean): ImageData {
      const markerSize = 64
      const canvas = document.createElement('canvas')
      canvas.width = markerSize
      canvas.height = markerSize
      const ctx = canvas.getContext('2d')!

      if (isActive) {
        // Brighter glow for active
        const activeGlow = ctx.createRadialGradient(
          markerSize / 2, markerSize / 2, 0,
          markerSize / 2, markerSize / 2, markerSize / 2
        )
        activeGlow.addColorStop(0, 'rgba(255, 255, 255, 0.9)')
        activeGlow.addColorStop(0.3, 'rgba(201, 162, 39, 0.6)')
        activeGlow.addColorStop(1, 'rgba(201, 162, 39, 0)')
        ctx.fillStyle = activeGlow
        ctx.fillRect(0, 0, markerSize, markerSize)

        // Diamond shape - white/gold
        ctx.beginPath()
        ctx.moveTo(markerSize / 2, 8)
        ctx.lineTo(markerSize - 12, markerSize / 2)
        ctx.lineTo(markerSize / 2, markerSize - 8)
        ctx.lineTo(12, markerSize / 2)
        ctx.closePath()

        const gradient = ctx.createLinearGradient(0, 0, markerSize, markerSize)
        gradient.addColorStop(0, '#ffffff')
        gradient.addColorStop(0.5, '#f0e6c8')
        gradient.addColorStop(1, '#c9a227')
        ctx.fillStyle = gradient
        ctx.fill()

        ctx.strokeStyle = '#c9a227'
        ctx.lineWidth = 3
        ctx.stroke()
      } else {
        // Regular gold glow
        const glow = ctx.createRadialGradient(
          markerSize / 2, markerSize / 2, 0,
          markerSize / 2, markerSize / 2, markerSize / 2
        )
        glow.addColorStop(0, 'rgba(201, 162, 39, 0.8)')
        glow.addColorStop(0.5, 'rgba(201, 162, 39, 0.3)')
        glow.addColorStop(1, 'rgba(201, 162, 39, 0)')
        ctx.fillStyle = glow
        ctx.fillRect(0, 0, markerSize, markerSize)

        // Diamond shape
        ctx.beginPath()
        ctx.moveTo(markerSize / 2, 8)
        ctx.lineTo(markerSize - 12, markerSize / 2)
        ctx.lineTo(markerSize / 2, markerSize - 8)
        ctx.lineTo(12, markerSize / 2)
        ctx.closePath()

        const gradient = ctx.createLinearGradient(0, 0, markerSize, markerSize)
        gradient.addColorStop(0, '#e8d5a3')
        gradient.addColorStop(0.5, '#c9a227')
        gradient.addColorStop(1, '#8b7220')
        ctx.fillStyle = gradient
        ctx.fill()

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
        ctx.lineWidth = 2
        ctx.stroke()
      }

      return ctx.getImageData(0, 0, markerSize, markerSize)
    }

    // Add fallback diamond markers
    state.map!.addImage('location-marker', createDiamondMarker(false), { pixelRatio: 2 })
    state.map!.addImage('location-marker-active', createDiamondMarker(true), { pixelRatio: 2 })

    // Add Manny's neon sign markers (canvas-based)
    state.map!.addImage('mannys-neon', createMannysNeonSign(false), { pixelRatio: 2 })
    state.map!.addImage('mannys-neon-active', createMannysNeonSign(true), { pixelRatio: 2 })

    // Load location images
    const imageEntries = Object.entries(LOCATION_IMAGES)
    let imagesLoaded = 0
    const totalImages = imageEntries.length

    function addLayers() {
      // Add custom WebGL neon layer for Manny's Music
      if (useWebGLNeon) {
        const mannysLocation = NYC_LOCATIONS.find(l => l.id === 'mannys-music')
        if (mannysLocation) {
          state.map!.addLayer(createNeonGlowLayer(mannysLocation.coordinates))
        }
      }

      // Filter to exclude Manny's from standard layers when using WebGL neon
      const excludeMannysFilter: mapboxgl.FilterSpecification = useWebGLNeon
        ? ['!=', ['get', 'id'], 'mannys-music']
        : ['literal', true]

      // Outer glow layer (larger, more diffuse)
      state.map!.addLayer({
        id: 'location-markers-outer-glow',
        type: 'circle',
        source: 'locations',
        filter: excludeMannysFilter,
        paint: {
          'circle-radius': [
            'case',
            ['get', 'active'],
            45,
            35
          ],
          'circle-color': '#c9a227',
          'circle-opacity': [
            'case',
            ['get', 'active'],
            0.2,
            0.1
          ],
          'circle-blur': 1
        }
      })

      // Inner glow layer
      state.map!.addLayer({
        id: 'location-markers-inner-glow',
        type: 'circle',
        source: 'locations',
        filter: excludeMannysFilter,
        paint: {
          'circle-radius': [
            'case',
            ['get', 'active'],
            28,
            22
          ],
          'circle-color': [
            'case',
            ['get', 'active'],
            '#ffffff',
            '#c9a227'
          ],
          'circle-opacity': [
            'case',
            ['get', 'active'],
            0.3,
            0.15
          ],
          'circle-blur': 0.8
        }
      })

      // Symbol layer with location images, neon signs, or fallback diamond
      state.map!.addLayer({
        id: 'location-markers',
        type: 'symbol',
        source: 'locations',
        filter: excludeMannysFilter,
        layout: {
          'icon-image': [
            'case',
            // Manny's neon sign
            ['get', 'hasNeonSign'],
            [
              'case',
              ['get', 'active'],
              'mannys-neon-active',
              'mannys-neon'
            ],
            // Location images
            ['get', 'hasImage'],
            [
              'case',
              ['get', 'active'],
              ['concat', 'loc-', ['get', 'id'], '-active'],
              ['concat', 'loc-', ['get', 'id']]
            ],
            // Fallback diamond
            [
              'case',
              ['get', 'active'],
              'location-marker-active',
              'location-marker'
            ]
          ],
          'icon-size': [
            'case',
            // Neon sign size
            ['get', 'hasNeonSign'],
            [
              'case',
              ['get', 'active'],
              0.85,
              0.7
            ],
            // Image size
            ['get', 'hasImage'],
            [
              'case',
              ['get', 'active'],
              0.12,
              0.09
            ],
            // Diamond size
            [
              'case',
              ['get', 'active'],
              1.2,
              0.9
            ]
          ],
          'icon-allow-overlap': true,
          'icon-ignore-placement': true
        }
      })

      // Text labels below markers
      state.map!.addLayer({
        id: 'location-labels',
        type: 'symbol',
        source: 'locations',
        filter: excludeMannysFilter,
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
          'text-size': [
            'case',
            ['get', 'active'],
            14,
            11
          ],
          'text-offset': [0, 3.5],
          'text-anchor': 'top',
          'text-allow-overlap': false,
          'text-letter-spacing': 0.05
        },
        paint: {
          'text-color': [
            'case',
            ['get', 'active'],
            '#ffffff',
            'rgba(255, 255, 255, 0.85)'
          ],
          'text-halo-color': 'rgba(0, 0, 0, 0.9)',
          'text-halo-width': 2
        }
      })

      // Handle click on markers
      state.map!.on('click', 'location-markers', e => {
        if (e.features && e.features[0]) {
          const index = e.features[0].properties?.index
          if (typeof index === 'number') {
            goToLocation(index)
          }
        }
      })

      // Change cursor on marker hover
      state.map!.on('mouseenter', 'location-markers', () => {
        state.map!.getCanvas().style.cursor = 'pointer'
      })

      state.map!.on('mouseleave', 'location-markers', () => {
        state.map!.getCanvas().style.cursor = ''
      })

      // Hide loading overlay
      elements.loadingOverlay.classList.add('hidden')

      // Start neon sign flicker animation (only if not using WebGL neon)
      if (!useWebGLNeon) {
        startNeonFlicker()
      }

      // Start with first location view
      const firstLocation = NYC_LOCATIONS[0]!
      state.map!.flyTo({
        center: firstLocation.coordinates,
        zoom: ZOOM,
        pitch: PITCH,
        bearing: 0,
        duration: 3000,
        essential: true
      })

      // Show route to Christie's for the initial location
      showRouteToChristies(firstLocation.id)

      // Start animation after initial flyTo
      state.flyToTimeoutId = window.setTimeout(() => {
        state.flyToTimeoutId = null
        state.lastTimestamp = 0
        state.animationId = requestAnimationFrame(animateCamera)
      }, 3500)
    } // end addLayers function

    // Load all location images, then add layers
    if (totalImages === 0) {
      addLayers()
    } else {
      imageEntries.forEach(([locationId, imageUrl]) => {
        state.map!.loadImage(imageUrl, (error, image) => {
          if (error) {
            console.warn(`Failed to load image for ${locationId}:`, error)
          } else if (image) {
            // Add normal version
            state.map!.addImage(`loc-${locationId}`, image)
            // Add active version (same image, will be scaled differently)
            state.map!.addImage(`loc-${locationId}-active`, image)
          }

          imagesLoaded++
          if (imagesLoaded === totalImages) {
            addLayers()
          }
        })
      })
    }
  })

  // Event listeners
  elements.playPauseBtn.addEventListener('click', togglePlayPause)

  // Navigation button listeners
  const navButtons = elements.locationNav.querySelectorAll('.location-nav__btn')
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt((btn as HTMLElement).dataset.index || '0', 10)
      goToLocation(index)
    })
  })

  // Pause on user interaction, resume on idle
  state.map.on('mousedown', () => {
    if (state.isPlaying && state.animationId) {
      cancelAnimationFrame(state.animationId)
      state.animationId = null
    }
  })

  state.map.on('mouseup', () => {
    if (state.isPlaying && !state.animationId) {
      state.lastTimestamp = 0
      setTimeout(() => {
        state.animationId = requestAnimationFrame(animateCamera)
      }, 1000)
    }
  })

  // Handle touch events for mobile
  state.map.on('touchstart', () => {
    if (state.isPlaying && state.animationId) {
      cancelAnimationFrame(state.animationId)
      state.animationId = null
    }
  })

  state.map.on('touchend', () => {
    if (state.isPlaying && !state.animationId) {
      state.lastTimestamp = 0
      setTimeout(() => {
        state.animationId = requestAnimationFrame(animateCamera)
      }, 1500)
    }
  })
}

// Cleanup
export function destroyMap(): void {
  stopNeonFlicker()
  if (state.animationId) {
    cancelAnimationFrame(state.animationId)
  }
  if (state.flyToTimeoutId) {
    clearTimeout(state.flyToTimeoutId)
  }
  state.map?.remove()
}

// Get current location ID for external use
export function getCurrentLocationId(): string | null {
  const location = NYC_LOCATIONS[state.currentLocationIndex]
  return location ? location.id : null
}

// Get map instance for external use (e.g., route display)
export function getMap(): mapboxgl.Map | null {
  return state.map
}
