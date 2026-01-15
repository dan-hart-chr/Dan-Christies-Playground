import * as THREE from 'three'
import Hls from 'hls.js'

// Vertex shader
const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

// Buffer A - Simple circular mask
const bufferAFragmentShader = `
uniform float uTime;
uniform vec2 uResolution;
uniform int uFrame;
uniform sampler2D uNoiseTexture;
uniform sampler2D uPrevFrame;

varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  vec2 centered = (uv - 0.5) * 2.0;
  float dist = length(centered);

  // Simple circle with soft edge
  float mask = 1.0 - smoothstep(0.75, 0.85, dist);

  gl_FragColor = vec4(vec3(mask), 1.0);
}
`

// Final composite - applies mask to video
const compositeFragmentShader = `
uniform sampler2D uMask;
uniform sampler2D uVideo;
uniform vec2 uResolution;

varying vec2 vUv;

void main() {
  // Get mask value
  float mask = texture2D(uMask, vUv).r;

  // Sample video
  vec4 video = texture2D(uVideo, vUv);

  // Output video with alpha from mask
  gl_FragColor = vec4(video.rgb, mask);
}
`

export class FlowImageEffect {
  private scene: THREE.Scene
  private camera: THREE.OrthographicCamera
  private renderer: THREE.WebGLRenderer
  private bufferAMaterial: THREE.ShaderMaterial
  private compositeMaterial: THREE.ShaderMaterial
  private renderTargetA: THREE.WebGLRenderTarget
  private renderTargetB: THREE.WebGLRenderTarget
  private quad: THREE.Mesh
  private animationId: number | null = null
  private startTime: number = 0
  private canvas: HTMLCanvasElement
  private frame = 0
  private currentTarget = 0

  // Video elements
  private video: HTMLVideoElement
  private videoTexture: THREE.VideoTexture
  private hls: Hls | null = null

  constructor(canvas: HTMLCanvasElement, videoUrl: string) {
    this.canvas = canvas

    // Scene setup
    this.scene = new THREE.Scene()
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    // Renderer with alpha
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      premultipliedAlpha: false
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setClearColor(0x000000, 0)

    // Use fixed size for reliability
    const width = 700
    const height = 700
    canvas.width = width
    canvas.height = height

    this.renderer.setSize(width, height, false)

    // Create video element
    this.video = document.createElement('video')
    this.video.crossOrigin = 'anonymous'
    this.video.loop = true
    this.video.muted = true
    this.video.playsInline = true
    this.video.autoplay = true

    // Setup HLS if needed
    if (videoUrl.includes('.m3u8')) {
      if (Hls.isSupported()) {
        this.hls = new Hls()
        this.hls.loadSource(videoUrl)
        this.hls.attachMedia(this.video)
      } else if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS
        this.video.src = videoUrl
      }
    } else {
      this.video.src = videoUrl
    }

    // Create video texture
    this.videoTexture = new THREE.VideoTexture(this.video)
    this.videoTexture.minFilter = THREE.LinearFilter
    this.videoTexture.magFilter = THREE.LinearFilter
    this.videoTexture.format = THREE.RGBAFormat

    // Render targets for ping-pong feedback
    const rtOptions = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType
    }
    this.renderTargetA = new THREE.WebGLRenderTarget(width, height, rtOptions)
    this.renderTargetB = new THREE.WebGLRenderTarget(width, height, rtOptions)

    // Create noise texture
    const noiseTexture = this.createNoiseTexture(256)

    // Buffer A material (flow mask)
    this.bufferAMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: bufferAFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(width, height) },
        uFrame: { value: 0 },
        uNoiseTexture: { value: noiseTexture },
        uPrevFrame: { value: null }
      }
    })

    // Composite material
    this.compositeMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: compositeFragmentShader,
      uniforms: {
        uResolution: { value: new THREE.Vector2(width, height) },
        uMask: { value: null },
        uVideo: { value: this.videoTexture }
      },
      transparent: true,
      depthWrite: false
    })

    // Create fullscreen quad
    const geometry = new THREE.PlaneGeometry(2, 2)
    this.quad = new THREE.Mesh(geometry, this.bufferAMaterial)
    this.scene.add(this.quad)

    // Handle resize
    window.addEventListener('resize', () => this.updateSize())
  }

  private createNoiseTexture(size: number): THREE.DataTexture {
    const data = new Uint8Array(size * size * 4)
    for (let i = 0; i < size * size * 4; i++) {
      data[i] = Math.random() * 255
    }
    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.needsUpdate = true
    return texture
  }

  private updateSize() {
    const width = this.canvas.clientWidth || 600
    const height = this.canvas.clientHeight || 600

    this.renderer.setSize(width, height, false)

    const bufferRes = this.bufferAMaterial.uniforms.uResolution as THREE.IUniform<THREE.Vector2>
    const compRes = this.compositeMaterial.uniforms.uResolution as THREE.IUniform<THREE.Vector2>
    bufferRes.value.set(width, height)
    compRes.value.set(width, height)

    this.renderTargetA.setSize(width, height)
    this.renderTargetB.setSize(width, height)
  }

  start() {
    this.startTime = performance.now() / 1000
    this.frame = 0

    // Start video playback
    this.video.play().catch(() => {})

    this.animate()
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
    this.video.pause()
  }

  private animate = () => {
    this.animationId = requestAnimationFrame(this.animate)

    const time = performance.now() / 1000 - this.startTime
    this.frame++

    // Update video texture
    if (this.video.readyState >= this.video.HAVE_CURRENT_DATA) {
      this.videoTexture.needsUpdate = true
    }

    // Ping-pong targets
    const readTarget = this.currentTarget === 0 ? this.renderTargetA : this.renderTargetB
    const writeTarget = this.currentTarget === 0 ? this.renderTargetB : this.renderTargetA

    // Pass 1: Render flow mask
    ;(this.bufferAMaterial.uniforms.uTime as THREE.IUniform<number>).value = time
    ;(this.bufferAMaterial.uniforms.uFrame as THREE.IUniform<number>).value = this.frame
    ;(this.bufferAMaterial.uniforms.uPrevFrame as THREE.IUniform<THREE.Texture | null>).value = readTarget.texture

    this.quad.material = this.bufferAMaterial
    this.renderer.setRenderTarget(writeTarget)
    this.renderer.render(this.scene, this.camera)

    // Pass 2: Composite video with mask
    ;(this.compositeMaterial.uniforms.uMask as THREE.IUniform<THREE.Texture | null>).value = writeTarget.texture

    this.quad.material = this.compositeMaterial
    this.renderer.setRenderTarget(null)
    this.renderer.render(this.scene, this.camera)

    // Swap targets
    this.currentTarget = 1 - this.currentTarget
  }

  dispose() {
    this.stop()

    if (this.hls) {
      this.hls.destroy()
    }

    this.video.src = ''
    this.videoTexture.dispose()
    this.renderTargetA.dispose()
    this.renderTargetB.dispose()
    this.bufferAMaterial.dispose()
    this.compositeMaterial.dispose()
    this.renderer.dispose()
  }
}

export function initFlowImageEffect(canvas: HTMLCanvasElement, videoUrl: string): FlowImageEffect {
  return new FlowImageEffect(canvas, videoUrl)
}
