import * as THREE from 'three'

const vertexShader = `
void main() {
  gl_Position = vec4(position, 1.0);
}
`

const fragmentShader = `
precision highp float;

uniform vec3  uColor;
uniform vec2  uResolution;
uniform float uTime;
uniform float uPixelSize;

const int MAX_CLICKS = 10;
uniform vec2  uClickPos[MAX_CLICKS];
uniform float uClickTimes[MAX_CLICKS];

out vec4 fragColor;

// Bayer matrix helpers (ordered dithering thresholds)
float Bayer2(vec2 a) {
    a = floor(a);
    return fract(a.x / 2. + a.y * a.y * .75);
}

#define Bayer4(a) (Bayer2(.5*(a))*0.25 + Bayer2(a))
#define Bayer8(a) (Bayer4(.5*(a))*0.25 + Bayer2(a))

#define FBM_OCTAVES     5
#define FBM_LACUNARITY  1.25
#define FBM_GAIN        1.
#define FBM_SCALE       4.0

float hash11(float n) { return fract(sin(n)*43758.5453); }

float vnoise(vec3 p) {
    vec3 ip = floor(p);
    vec3 fp = fract(p);

    float n000 = hash11(dot(ip + vec3(0.0,0.0,0.0), vec3(1.0,57.0,113.0)));
    float n100 = hash11(dot(ip + vec3(1.0,0.0,0.0), vec3(1.0,57.0,113.0)));
    float n010 = hash11(dot(ip + vec3(0.0,1.0,0.0), vec3(1.0,57.0,113.0)));
    float n110 = hash11(dot(ip + vec3(1.0,1.0,0.0), vec3(1.0,57.0,113.0)));
    float n001 = hash11(dot(ip + vec3(0.0,0.0,1.0), vec3(1.0,57.0,113.0)));
    float n101 = hash11(dot(ip + vec3(1.0,0.0,1.0), vec3(1.0,57.0,113.0)));
    float n011 = hash11(dot(ip + vec3(0.0,1.0,1.0), vec3(1.0,57.0,113.0)));
    float n111 = hash11(dot(ip + vec3(1.0,1.0,1.0), vec3(1.0,57.0,113.0)));

    vec3 w = fp*fp*fp*(fp*(fp*6.0-15.0)+10.0);

    float x00 = mix(n000, n100, w.x);
    float x10 = mix(n010, n110, w.x);
    float x01 = mix(n001, n101, w.x);
    float x11 = mix(n011, n111, w.x);

    float y0  = mix(x00, x10, w.y);
    float y1  = mix(x01, x11, w.y);

    return mix(y0, y1, w.z) * 2.0 - 1.0;
}

float fbm2(vec2 uv, float t) {
    vec3 p   = vec3(uv * FBM_SCALE, t);
    float amp  = 1.;
    float freq = 1.;
    float sum  = 1.;

    for (int i = 0; i < FBM_OCTAVES; ++i) {
        sum  += amp * vnoise(p * freq);
        freq *= FBM_LACUNARITY;
        amp  *= FBM_GAIN;
    }

    return sum * 0.5 + 0.5;
}

void main() {
    float pixelSize = uPixelSize;
    vec2 fragCoord = gl_FragCoord.xy - uResolution * .5;

    float aspectRatio = uResolution.x / uResolution.y;

    vec2 pixelId = floor(fragCoord / pixelSize);
    vec2 pixelUV = fract(fragCoord / pixelSize);

    float cellPixelSize = 8. * pixelSize;
    vec2 cellId = floor(fragCoord / cellPixelSize);

    vec2 cellCoord = cellId * cellPixelSize;

    vec2 uv = cellCoord / uResolution * vec2(aspectRatio, 1.0);

    float feed = fbm2(uv, uTime * 0.05);
    feed = feed * 0.5 - 0.65;

    // Ripple clicks
    const float speed     = 0.30;
    const float thickness = 0.10;
    const float dampT     = 1.0;
    const float dampR     = 10.0;

    for (int i = 0; i < MAX_CLICKS; ++i) {
        vec2 pos = uClickPos[i];
        if (pos.x < 0.0) continue;

        vec2 cuv = (((pos - uResolution * .5 - cellPixelSize * .5) / (uResolution) )) * vec2(aspectRatio, 1.0);

        float t = max(uTime - uClickTimes[i], 0.0);
        float r = distance(uv, cuv);

        float waveR = speed * t;
        float ring  = exp(-pow((r - waveR) / thickness, 2.0));
        float atten = exp(-dampT * t) * exp(-dampR * r);
        feed = max(feed, ring * atten);
    }

    float bayer = Bayer8(fragCoord / uPixelSize) - 0.5;
    float bw    = step(0.5, feed + bayer);

    // Square mask (default)
    float M = bw;

    vec3 color = uColor;
    fragColor = vec4(color, M);
}
`

interface BayerShaderOptions {
  container: HTMLElement
  color?: string
  pixelSize?: number
}

interface BayerUniforms {
  uResolution: { value: THREE.Vector2 }
  uTime: { value: number }
  uColor: { value: THREE.Color }
  uClickPos: { value: THREE.Vector2[] }
  uClickTimes: { value: Float32Array }
  uPixelSize: { value: number }
}

export class BayerShaderBackground {
  private renderer: THREE.WebGLRenderer | null = null
  private scene!: THREE.Scene
  private camera!: THREE.OrthographicCamera
  private material: THREE.ShaderMaterial | null = null
  private uniforms!: BayerUniforms
  private clock!: THREE.Clock
  private canvas: HTMLCanvasElement
  private container: HTMLElement
  private animationId: number | null = null
  private clickIndex = 0
  private readonly MAX_CLICKS = 10

  constructor(options: BayerShaderOptions) {
    this.container = options.container
    const color = options.color || '#3f87ab'
    const pixelSize = options.pixelSize || 4

    // Create canvas - append to container, positioned behind content
    this.canvas = document.createElement('canvas')
    this.canvas.className = 'webgl-background-canvas'
    this.container.appendChild(this.canvas)

    // Get WebGL2 context
    const gl = this.canvas.getContext('webgl2')
    if (!gl) {
      console.warn('WebGL2 not supported, Bayer shader disabled')
      return
    }
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      context: gl,
      antialias: false,
      alpha: true
    })

    // Setup uniforms
    this.uniforms = {
      uResolution: { value: new THREE.Vector2() },
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uClickPos: { value: Array.from({ length: this.MAX_CLICKS }, () => new THREE.Vector2(-1, -1)) },
      uClickTimes: { value: new Float32Array(this.MAX_CLICKS) },
      uPixelSize: { value: pixelSize },
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
    })

    this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material))

    // Clock
    this.clock = new THREE.Clock()

    // Bind events
    this.handleResize = this.handleResize.bind(this)
    this.handleClick = this.handleClick.bind(this)
    this.animate = this.animate.bind(this)

    window.addEventListener('resize', this.handleResize)
    this.canvas.addEventListener('pointerdown', this.handleClick)

    // Initial resize
    this.handleResize()

    // Start animation
    this.animate()
  }

  private handleResize() {
    const w = window.innerWidth
    const h = window.innerHeight
    const dpr = Math.min(window.devicePixelRatio, 2)

    // Set canvas size explicitly
    this.canvas.width = w * dpr
    this.canvas.height = h * dpr
    this.canvas.style.width = w + 'px'
    this.canvas.style.height = h + 'px'

    if (!this.renderer) return
    this.renderer.setSize(w, h, false)
    this.renderer.setPixelRatio(dpr)
    this.uniforms.uResolution.value.set(w * dpr, h * dpr)
  }

  private handleClick(e: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio
    const fx = (e.clientX - rect.left) * dpr
    const fy = (rect.height - (e.clientY - rect.top)) * dpr

    const clickVec = this.uniforms.uClickPos.value[this.clickIndex]
    if (clickVec) {
      clickVec.set(fx, fy)
      this.uniforms.uClickTimes.value[this.clickIndex] = this.uniforms.uTime.value
    }
    this.clickIndex = (this.clickIndex + 1) % this.MAX_CLICKS
  }

  private animate() {
    if (document.hidden) {
      this.animationId = requestAnimationFrame(this.animate)
      return
    }

    if (!this.renderer || !this.material) return

    this.uniforms.uTime.value = this.clock.getElapsedTime()
    this.renderer.render(this.scene, this.camera)
    this.animationId = requestAnimationFrame(this.animate)
  }

  setColor(color: string) {
    this.uniforms.uColor.value.set(color)
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    window.removeEventListener('resize', this.handleResize)
    this.canvas.removeEventListener('pointerdown', this.handleClick)
    if (this.renderer) {
      this.renderer.dispose()
      this.renderer = null
    }
    if (this.material) {
      this.material.dispose()
      this.material = null
    }
    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas)
    }
  }
}
