import * as THREE from "three";

function createSoftCircleTexture(size) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const center = size / 2;
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0, "rgba(255,255,255,0.3)");
  gradient.addColorStop(0.15, "rgba(255,255,255,0.18)");
  gradient.addColorStop(0.4, "rgba(255,255,255,0.07)");
  gradient.addColorStop(0.65, "rgba(255,255,255,0.02)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

const DEFAULT_SPRITE_COUNT = 28;

export function createFogVolume(count = DEFAULT_SPRITE_COUNT) {
  const group = new THREE.Group();
  const texture = createSoftCircleTexture(256);

  const sprites = [];
  for (let i = 0; i < count; i++) {
    const material = new THREE.SpriteMaterial({
      map: texture,
      color: new THREE.Color("#ead7b8"),
      transparent: true,
      opacity: 0.04 + Math.random() * 0.05,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
      rotation: Math.random() * Math.PI * 2,
    });
    const sprite = new THREE.Sprite(material);
    sprite.renderOrder = 100;
    sprite.frustumCulled = false;

    const spread = 7;
    sprite.position.set(
      (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * spread * 0.7,
      (Math.random() - 0.5) * spread,
    );
    const baseScale = 4 + Math.random() * 10;
    sprite.scale.set(baseScale, baseScale, 1);
    sprite.userData.baseOpacity = material.opacity;
    sprite.userData.phase = Math.random() * Math.PI * 2;
    sprite.userData.speed = 0.15 + Math.random() * 0.2;
    sprite.userData.rotSpeed = (Math.random() - 0.5) * 0.08;
    sprite.userData.baseRotation = material.rotation;
    sprite.userData.drift = {
      x: (Math.random() - 0.5) * 0.3,
      y: (Math.random() - 0.5) * 0.15,
      z: (Math.random() - 0.5) * 0.3,
    };
    sprite.userData.basePosition = sprite.position.clone();
    sprite.userData.baseScale = baseScale;

    sprites.push(sprite);
    group.add(sprite);
  }

  let intensity = 1.0;
  let scale = 1.0;
  let driftSpeed = 1.0;
  let turbulence = 1.0;
  let riseFactor = 0;
  let pulseAmount = 0.3;
  const hazeColor = new THREE.Color("#ead7b8");

  function update(time) {
    for (const sprite of sprites) {
      const t = time * sprite.userData.speed * driftSpeed + sprite.userData.phase;

      // Drift with turbulence scaling
      const dx = Math.sin(t) * sprite.userData.drift.x * turbulence;
      const dy = Math.sin(t * 0.7) * sprite.userData.drift.y * turbulence;
      const dz = Math.cos(t * 0.8) * sprite.userData.drift.z * turbulence;

      // Rising mist effect (smooth sine instead of sawtooth)
      const rise = riseFactor * Math.sin(time * sprite.userData.speed * 0.3 + sprite.userData.phase) * 2.0;

      sprite.position.x = (sprite.userData.basePosition.x + dx) * scale;
      sprite.position.y = (sprite.userData.basePosition.y + dy + rise) * scale;
      sprite.position.z = (sprite.userData.basePosition.z + dz) * scale;

      // Scale
      const s = sprite.userData.baseScale * scale;
      sprite.scale.set(s, s, 1);

      // Slow rotation
      sprite.material.rotation = sprite.userData.baseRotation + time * sprite.userData.rotSpeed * driftSpeed;

      // Opacity pulsing
      const pulse = 1.0 - pulseAmount + pulseAmount * Math.sin(t * 1.3);
      sprite.material.opacity = sprite.userData.baseOpacity * intensity * pulse;
    }
  }

  function setIntensity(value) {
    intensity = value;
  }

  function setScale(value) {
    scale = value;
  }

  function setDriftSpeed(value) {
    driftSpeed = value;
  }

  function setTurbulence(value) {
    turbulence = value;
  }

  function setRise(value) {
    riseFactor = value;
  }

  function setPulse(value) {
    pulseAmount = value;
  }

  function setColor(hex) {
    hazeColor.set(hex);
    for (const sprite of sprites) {
      sprite.material.color.copy(hazeColor);
    }
  }

  return {
    mesh: group,
    update,
    setIntensity,
    setScale,
    setDriftSpeed,
    setTurbulence,
    setRise,
    setPulse,
    setColor,
  };
}
