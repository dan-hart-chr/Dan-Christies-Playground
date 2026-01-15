import * as THREE from 'three'

const vertexShader = `
void main() {
  gl_Position = vec4(position, 1.0);
}
`

const fragmentShader = `
precision highp float;

uniform vec2 uResolution;
uniform float uTime;

// Effect intensity controls
uniform float uGrainIntensity;
uniform float uScanlineIntensity;
uniform float uVignetteIntensity;
uniform float uChromaticAberration;
uniform float uVSyncRoll;

out vec4 fragColor;

// High quality noise
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

// Film grain with temporal variation - more visible
float filmGrain(vec2 uv, float t) {
  // Multiple layers of grain for richer texture
  float grain1 = hash(uv * 500.0 + fract(t * 24.0) * 100.0);
  float grain2 = hash(uv * 800.0 + fract(t * 18.0) * 80.0);
  float grain3 = hash(uv * 1200.0 + fract(t * 30.0) * 60.0);
  return (grain1 + grain2 + grain3) / 3.0;
}

// Scanlines - CRT style with VSync roll
float scanlines(vec2 uv, float t, float vsync) {
  // Horizontal scanlines
  float scan = sin(uv.y * uResolution.y * 0.5) * 0.5 + 0.5;
  scan = pow(scan, 0.6);

  // VSync roll - horizontal band that moves down
  float rollSpeed = 0.15;
  float rollPos = fract(t * rollSpeed);
  float rollBand = smoothstep(0.0, 0.05, abs(uv.y - rollPos)) *
                   smoothstep(0.0, 0.05, abs(uv.y - rollPos - 1.0));
  scan *= mix(1.0, rollBand, vsync * 0.15);

  return scan;
}

// Vignette - strong edge darkening
float vignette(vec2 uv, float intensity) {
  uv = uv * 2.0 - 1.0;
  float dist = length(uv * vec2(0.8, 1.0)); // Slightly oval
  // Stronger falloff for more dramatic vignette
  return 1.0 - pow(dist, 1.5) * intensity * 0.4;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;

  // Start with neutral gray (overlay blend: 0.5 = no change)
  float brightness = 0.5;

  // Film grain - stronger random variation
  float grain = filmGrain(uv, uTime);
  brightness += (grain - 0.5) * uGrainIntensity * 0.8;

  // Scanlines with VSync roll
  float scan = scanlines(uv, uTime, uVSyncRoll);
  brightness -= (1.0 - scan) * uScanlineIntensity * 0.25;

  // Vignette - strong edge darkening
  float vig = vignette(uv, uVignetteIntensity);
  brightness *= vig;

  // Color bleeding / chromatic aberration
  float dist = length(uv - 0.5);
  vec3 col = vec3(brightness);

  if (dist > 0.1) {
    float aberr = (dist - 0.1) * uChromaticAberration * 3.0;
    col.r += aberr * 0.4;
    col.g -= aberr * 0.1;
    col.b -= aberr * 0.3;
  }

  // Clamp to valid range
  col = clamp(col, 0.0, 1.0);

  fragColor = vec4(col, 1.0);
}
`

interface AnalogEffectsOptions {
  container: HTMLElement
  grainIntensity?: number
  scanlineIntensity?: number
  vignetteIntensity?: number
  chromaticAberration?: number
  vSyncRoll?: number
  initialClipPath?: string
}

interface AnalogUniforms {
  uResolution: { value: THREE.Vector2 }
  uTime: { value: number }
  uGrainIntensity: { value: number }
  uScanlineIntensity: { value: number }
  uVignetteIntensity: { value: number }
  uChromaticAberration: { value: number }
  uVSyncRoll: { value: number }
}

export class AnalogEffects {
  private renderer: THREE.WebGLRenderer
  private scene: THREE.Scene
  private camera: THREE.OrthographicCamera
  private material: THREE.ShaderMaterial
  private uniforms: AnalogUniforms
  private clock: THREE.Clock
  private canvas: HTMLCanvasElement
  private container: HTMLElement
  private animationId: number | null = null

  constructor(options: AnalogEffectsOptions) {
    this.container = options.container

    // Create canvas - sits on top of everything with overlay blend
    this.canvas = document.createElement('canvas')
    this.canvas.className = 'webgl-overlay-canvas'

    // Apply initial clip-path if provided (for masking during transitions)
    if (options.initialClipPath) {
      this.canvas.style.clipPath = options.initialClipPath
    }

    this.container.appendChild(this.canvas)

    // Get WebGL2 context
    const gl = this.canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: false
    })!

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      context: gl,
      antialias: false,
      alpha: true
    })

    // Setup uniforms with sensible defaults
    this.uniforms = {
      uResolution: { value: new THREE.Vector2() },
      uTime: { value: 0 },
      uGrainIntensity: { value: options.grainIntensity ?? 0.5 },
      uScanlineIntensity: { value: options.scanlineIntensity ?? 1.9 },
      uVignetteIntensity: { value: options.vignetteIntensity ?? 2.2 },
      uChromaticAberration: { value: options.chromaticAberration ?? 0.1 },
      uVSyncRoll: { value: options.vSyncRoll ?? 1.8 },
    }

    // Scene setup
    this.scene = new THREE.Scene()
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: this.uniforms as unknown as Record<string, THREE.IUniform>,
      glslVersion: THREE.GLSL3,
      transparent: true,
      blending: THREE.NormalBlending,
      depthTest: false,
      depthWrite: false,
    })

    this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material))

    // Clock
    this.clock = new THREE.Clock()

    // Bind events
    this.handleResize = this.handleResize.bind(this)
    this.animate = this.animate.bind(this)

    window.addEventListener('resize', this.handleResize)

    // Initial resize
    this.handleResize()

    // Start animation
    this.animate()
  }

  private handleResize() {
    const w = window.innerWidth
    const h = window.innerHeight
    const dpr = Math.min(window.devicePixelRatio, 2)

    this.canvas.width = w * dpr
    this.canvas.height = h * dpr
    this.canvas.style.width = w + 'px'
    this.canvas.style.height = h + 'px'

    this.renderer.setSize(w, h, false)
    this.renderer.setPixelRatio(dpr)
    this.uniforms.uResolution.value.set(w * dpr, h * dpr)
  }

  private animate() {
    this.uniforms.uTime.value = this.clock.getElapsedTime()
    this.renderer.render(this.scene, this.camera)
    this.animationId = requestAnimationFrame(this.animate)
  }

  setIntensity(type: 'grain' | 'scanline' | 'vignette' | 'chromatic' | 'vsync', value: number) {
    switch (type) {
      case 'grain':
        this.uniforms.uGrainIntensity.value = value
        break
      case 'scanline':
        this.uniforms.uScanlineIntensity.value = value
        break
      case 'vignette':
        this.uniforms.uVignetteIntensity.value = value
        break
      case 'chromatic':
        this.uniforms.uChromaticAberration.value = value
        break
      case 'vsync':
        this.uniforms.uVSyncRoll.value = value
        break
    }
  }

  /**
   * Get the canvas element for GSAP animation
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas
  }

  /**
   * Set clip-path for masking effect
   */
  setClipPath(clipPath: string) {
    this.canvas.style.clipPath = clipPath
  }

  /**
   * Remove clip-path (full viewport visible)
   */
  clearClipPath() {
    this.canvas.style.clipPath = 'none'
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    window.removeEventListener('resize', this.handleResize)
    this.renderer.dispose()
    this.material.dispose()
    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas)
    }
  }
}
