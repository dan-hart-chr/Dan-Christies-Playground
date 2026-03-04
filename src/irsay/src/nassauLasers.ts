import * as THREE from 'three'

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uResolution;

  // Simplex-style noise for atmospheric haze
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  // Beam parameters: originX (0-1), color, angle offset, sway freq, sway phase, width, intensity
  struct Beam {
    float originX;
    vec3 color;
    float swayFreq;
    float swayPhase;
    float width;
    float intensity;
    float pulseFreq;
    float pulsePhase;
  };

  float beamContribution(Beam b, vec2 uv, float time) {
    // Beam origin above screen to avoid visible convergence point
    float originY = 1.2;

    // Sway angle
    float angle = sin(time * b.swayFreq + b.swayPhase) * 0.15;
    // Secondary sway for organic feel
    angle += sin(time * b.swayFreq * 0.7 + b.swayPhase * 1.3) * 0.05;

    // Direction from origin
    float dx = sin(angle);
    float dy = -cos(angle);

    // Point relative to beam origin
    float px = uv.x - b.originX;
    float py = uv.y - originY;

    // Project point onto beam axis
    float t = px * dx + py * dy;
    if (t < 0.0) return 0.0; // Behind the origin

    // Perpendicular distance from beam axis
    float perpDist = abs(px * dy - py * dx);

    // Cone spread: beam gets wider as it travels
    float coneWidth = b.width * (1.0 + t * 0.6);

    // Gaussian falloff from beam center
    float gaussian = exp(-perpDist * perpDist / (2.0 * coneWidth * coneWidth));

    // Intensity falloff along beam length
    float lengthFalloff = exp(-t * 0.8);

    // Pulsing intensity
    float pulse = 0.7 + 0.3 * sin(time * b.pulseFreq + b.pulsePhase);

    return gaussian * lengthFalloff * b.intensity * pulse;
  }

  void main() {
    vec2 uv = vUv;
    // Correct for aspect ratio
    float aspect = uResolution.x / uResolution.y;

    // Define 12 beams with different colors and behaviors
    Beam beams[12];

    // Cyan beam - left
    beams[0] = Beam(0.08, vec3(0.0, 0.8, 1.0), 0.8, 0.0, 0.012, 0.8, 1.2, 0.0);
    // Magenta beam
    beams[1] = Beam(0.18, vec3(1.0, 0.0, 0.8), 0.6, 1.2, 0.018, 0.9, 0.9, 0.5);
    // Green beam
    beams[2] = Beam(0.28, vec3(0.0, 1.0, 0.4), 0.9, 2.5, 0.014, 0.7, 1.1, 1.0);
    // Gold beam
    beams[3] = Beam(0.38, vec3(1.0, 0.8, 0.0), 0.7, 0.8, 0.010, 0.6, 1.4, 1.5);
    // White beam - wide and bright
    beams[4] = Beam(0.48, vec3(1.0, 1.0, 1.0), 0.5, 3.5, 0.022, 1.0, 0.7, 2.0);
    // Red beam
    beams[5] = Beam(0.55, vec3(1.0, 0.2, 0.2), 0.85, 1.5, 0.015, 0.75, 1.0, 2.5);
    // Blue-violet beam - wide, blurred
    beams[6] = Beam(0.65, vec3(0.53, 0.27, 1.0), 0.75, 4.2, 0.020, 0.85, 0.8, 3.0);
    // Cyan beam - right side
    beams[7] = Beam(0.72, vec3(0.0, 0.8, 1.0), 0.65, 2.0, 0.011, 0.65, 1.3, 3.5);
    // Magenta beam - wide
    beams[8] = Beam(0.82, vec3(1.0, 0.0, 0.8), 0.55, 5.0, 0.024, 0.8, 0.85, 4.0);
    // Green beam - right
    beams[9] = Beam(0.88, vec3(0.0, 1.0, 0.4), 0.95, 3.0, 0.013, 0.7, 1.15, 4.5);
    // Warm white beam
    beams[10] = Beam(0.13, vec3(1.0, 0.95, 0.85), 0.72, 0.5, 0.016, 0.6, 1.05, 5.0);
    // Gold beam - right edge
    beams[11] = Beam(0.94, vec3(1.0, 0.8, 0.0), 0.82, 4.8, 0.010, 0.55, 1.25, 5.5);

    vec3 col = vec3(0.0);

    for (int i = 0; i < 12; i++) {
      float contrib = beamContribution(beams[i], uv, uTime);
      col += beams[i].color * contrib;
    }

    // Atmospheric fog/haze — denser near bottom
    float fogDensity = (1.0 - uv.y) * 0.4;
    float noise = snoise(uv * 3.0 + vec2(uTime * 0.1, uTime * 0.05)) * 0.5 + 0.5;
    float noise2 = snoise(uv * 6.0 - vec2(uTime * 0.08, uTime * 0.12)) * 0.5 + 0.5;
    float fog = fogDensity * mix(noise, noise2, 0.5);

    // Fog scatters beam colors
    vec3 fogColor = col * 0.3 + vec3(0.02, 0.01, 0.04);
    col += fogColor * fog;

    // Overall intensity control
    col *= 0.85;

    // Output with premultiplied alpha for screen blend
    float alpha = clamp(length(col) * 1.2, 0.0, 1.0);
    gl_FragColor = vec4(col, alpha);
  }
`

export class NassauLaserEffect {
  private renderer: THREE.WebGLRenderer
  private scene: THREE.Scene
  private camera: THREE.Camera
  private material: THREE.ShaderMaterial
  private animationId: number | null = null
  private startTime: number = 0
  private frameIntervalMs = 1000 / 24
  private lastFrameTime = 0

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      premultipliedAlpha: false,
      antialias: false
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    this.renderer.setClearColor(0x000000, 0)

    this.scene = new THREE.Scene()
    this.camera = new THREE.Camera()

    this.material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2() }
      },
      transparent: true,
      depthTest: false,
      depthWrite: false
    })

    const geometry = new THREE.PlaneGeometry(2, 2)
    const mesh = new THREE.Mesh(geometry, this.material)
    this.scene.add(mesh)

    this.handleResize()
    this.resizeHandler = this.handleResize.bind(this)
    window.addEventListener('resize', this.resizeHandler)
  }

  private resizeHandler: () => void

  private handleResize() {
    const w = window.innerWidth
    const h = window.innerHeight
    this.renderer.setSize(w, h)
    ;(this.material.uniforms['uResolution'] as THREE.IUniform<THREE.Vector2>).value.set(w, h)
  }

  start() {
    if (prefersReducedMotion.matches) return
    if (this.animationId !== null) return
    this.startTime = performance.now()
    this.lastFrameTime = 0
    this.handleResize()
    const animate = () => {
      if (this.animationId === null) return

      const now = performance.now()
      if (now - this.lastFrameTime < this.frameIntervalMs) {
        this.animationId = requestAnimationFrame(animate)
        return
      }

      const elapsed = (now - this.startTime) / 1000
      this.lastFrameTime = now
      ;(this.material.uniforms['uTime'] as THREE.IUniform<number>).value = elapsed
      if (!document.hidden) {
        this.renderer.render(this.scene, this.camera)
      }
      this.animationId = requestAnimationFrame(animate)
    }
    animate()
  }

  stop() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  destroy() {
    this.stop()
    window.removeEventListener('resize', this.resizeHandler)
    this.material.dispose()
    this.scene.children.forEach(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
      }
    })
    this.renderer.dispose()
  }
}
