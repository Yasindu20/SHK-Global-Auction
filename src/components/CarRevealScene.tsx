import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";

interface CarRevealSceneProps {
  progressRef: React.MutableRefObject<number>;
}

// High-quality Unsplash car images with proper sizing
const CAR_IMAGES = [
  "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1920&h=1280&q=95&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1920&h=1280&q=95&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1580427331730-b38f8dc1f355?w=1920&h=1280&q=95&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1920&h=1280&q=95&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1920&h=1280&q=95&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1920&h=1280&q=95&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1920&h=1280&q=95&auto=format&fit=crop",
];

// Fixed plane layout — no per-frame rotation changes (eliminates jitter)
const PLANE_CONFIGS: {
  pos: [number, number, number];
  rot: [number, number, number];
  scale: [number, number];
}[] = [
  { pos: [0,   0.5, -4],  rot: [0,  0,            0],          scale: [10, 6.67] },
  { pos: [4.5, 0,    2],  rot: [0, -Math.PI / 6,  0],          scale: [10, 6.67] },
  { pos: [0,   0.5,  8],  rot: [0,  Math.PI,      0],          scale: [10, 6.67] },
  { pos: [-3,  0.8,  3],  rot: [0.05,  Math.PI / 8, 0],        scale: [8,  5.33] },
  { pos: [3,   0.3, -1],  rot: [0, -Math.PI / 10, 0],          scale: [8,  5.33] },
  { pos: [-5,  0,    5],  rot: [0,  Math.PI / 4,  0],          scale: [8,  5.33] },
  { pos: [0,   1.5,  0],  rot: [0.1, 0,           0],          scale: [7,  4.67] },
];

interface SceneState {
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  planes: THREE.Mesh[];
  frames: THREE.LineSegments[];
  particles: THREE.Points;
  curve: THREE.CatmullRomCurve3;
  rafId: number;
  time: number;
  // Smoothed camera state
  smoothPos: THREE.Vector3;
  smoothTarget: THREE.Vector3;
}

export default function CarRevealScene({ progressRef }: CarRevealSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<SceneState | null>(null);

  const init = useCallback(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ── Scene ────────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030303);
    scene.fog = new THREE.FogExp2(0x030303, 0.012);

    // ── Camera ───────────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(
      42,
      window.innerWidth / window.innerHeight,
      0.1,
      150
    );

    // ── Renderer — direct render, NO post-processing (sharper images) ────────
    const renderer = new THREE.WebGLRenderer({
      antialias: true,          // smoother edges
      powerPreference: "high-performance",
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    // ── Minimal lighting (planes use MeshBasicMaterial so light is decorative) ─
    scene.add(new THREE.AmbientLight(0x1a1a2e, 0.6));
    const keyLight = new THREE.DirectionalLight(0xfff5e6, 1.2);
    keyLight.position.set(6, 12, 8);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0x334488, 0.4);
    fillLight.position.set(-8, 4, -4);
    scene.add(fillLight);

    // ── Image Planes ── MeshBasicMaterial for maximum clarity (unlit, no glow) ─
    const textureLoader = new THREE.TextureLoader();
    const planes: THREE.Mesh[] = [];
    const frames: THREE.LineSegments[] = [];

    CAR_IMAGES.forEach((url, i) => {
      const cfg = PLANE_CONFIGS[i];

      const texture = textureLoader.load(url, (tex) => {
        // Ensure texture is sharp once loaded
        tex.needsUpdate = true;
      });
      texture.colorSpace = THREE.SRGBColorSpace;
      // Sharper texture filtering
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;
      // Max anisotropy for crisp images at angles
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

      // MeshBasicMaterial = unlit, no bloom artifacts, pure image clarity
      const mat = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
      });

      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
      mesh.position.set(...cfg.pos);
      mesh.rotation.set(...cfg.rot);
      mesh.scale.set(cfg.scale[0], cfg.scale[1], 1);
      scene.add(mesh);
      planes.push(mesh);

      // Thin gold border frame
      const frameGeo = new THREE.EdgesGeometry(
        new THREE.PlaneGeometry(cfg.scale[0], cfg.scale[1])
      );
      const frameMat = new THREE.LineBasicMaterial({
        color: 0xd4a853,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const frame = new THREE.LineSegments(frameGeo, frameMat);
      frame.position.copy(mesh.position);
      frame.rotation.copy(mesh.rotation);
      frame.position.z += 0.015;
      scene.add(frame);
      frames.push(frame);
    });

    // ── Reflective floor ──────────────────────────────────────────────────────
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 120),
      new THREE.MeshStandardMaterial({
        color: 0x050505,
        roughness: 0.04,
        metalness: 0.97,
        transparent: true,
        opacity: 0.4,
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -3.5;
    scene.add(floor);

    // ── Particles ─────────────────────────────────────────────────────────────
    const COUNT = 900;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(COUNT * 3);
    const pSizes = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      pPos[i * 3]     = (Math.random() - 0.5) * 50;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 20 + 4;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 50;
      pSizes[i] = Math.random() * 0.035 + 0.008;
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute("size", new THREE.BufferAttribute(pSizes, 1));

    const pMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0xd4a853) },
      },
      vertexShader: `
        attribute float size;
        uniform float uTime;
        varying float vAlpha;
        void main() {
          vec3 pos = position;
          pos.y += sin(uTime * 0.45 + position.x * 0.25) * 0.35;
          pos.x += cos(uTime * 0.3 + position.z * 0.18) * 0.18;
          vec4 mv = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (280.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
          vAlpha = 0.2 + 0.12 * sin(uTime + position.x);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float g = pow(1.0 - d * 2.0, 2.0);
          gl_FragColor = vec4(uColor, vAlpha * g);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // ── Camera path ───────────────────────────────────────────────────────────
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0,   2.2, 14),
      new THREE.Vector3(1.5, 1.4, 10),
      new THREE.Vector3(3,   0.7,  6),
      new THREE.Vector3(5,   0.3,  3),
      new THREE.Vector3(4,   0.1,  0),
      new THREE.Vector3(2,   0,   -3),
      new THREE.Vector3(0,   0.2, -3),
      new THREE.Vector3(-2,  0.5,  0),
      new THREE.Vector3(-1,  0.9,  3),
      new THREE.Vector3(0,   1.6,  7),
      new THREE.Vector3(0,   2.2, 14),
    ]);
    curve.tension = 0.4;

    // ── State ────────────────────────────────────────────────────────────────
    const state: SceneState = {
      camera,
      renderer,
      scene,
      planes,
      frames,
      particles,
      curve,
      rafId: 0,
      time: 0,
      smoothPos: new THREE.Vector3(0, 2.2, 14),
      smoothTarget: new THREE.Vector3(0, 2.2, 13),
    };
    stateRef.current = state;

    // ── Animation loop ────────────────────────────────────────────────────────
    const clock = new THREE.Clock();

    const animate = () => {
      state.rafId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05); // cap delta to avoid jumps
      state.time += delta;

      const raw = progressRef.current;
      const t     = Math.max(0, Math.min(raw, 0.999));
      const tLook = Math.min(t + 0.012, 0.999);

      const targetPos  = state.curve.getPointAt(t);
      const lookTarget = state.curve.getPointAt(tLook);

      // Smooth exponential lerp — lower factor = smoother but more responsive
      const lerpFactor = 1 - Math.pow(0.05, delta);
      state.smoothPos.lerp(targetPos, lerpFactor);
      state.smoothTarget.lerp(lookTarget, lerpFactor);

      state.camera.position.copy(state.smoothPos);
      state.camera.lookAt(state.smoothTarget);

      // Update shader time
      (state.particles.material as THREE.ShaderMaterial).uniforms.uTime.value = state.time;

      // Smooth opacity fade for planes based on camera distance
      state.planes.forEach((plane, i) => {
        const dist = state.camera.position.distanceTo(plane.position);
        
        // Gentler falloff — visible from further, clearer at close range
        let target = 0;
        if (dist < 12) {
          const t = 1 - dist / 12;
          // Smooth step for gradual reveal, peak clarity at close range
          target = t * t * (3 - 2 * t); // smoothstep
          target = Math.min(target * 1.1, 0.97);
        }

        const mat = plane.material as THREE.MeshBasicMaterial;
        // Smooth opacity lerp — delta-based for frame-rate independence
        const opacityLerp = 1 - Math.pow(0.04, delta);
        mat.opacity += (target - mat.opacity) * opacityLerp;

        // Frame border follows image opacity
        const fm = state.frames[i].material as THREE.LineBasicMaterial;
        fm.opacity = mat.opacity * 0.5;
      });

      // Direct render — no post-processing, max clarity
      state.renderer.render(state.scene, state.camera);
    };

    animate();

    // ── Resize ────────────────────────────────────────────────────────────────
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      window.removeEventListener("resize", onResize);
      if (stateRef.current) cancelAnimationFrame(stateRef.current.rafId);
      renderer.dispose();
      scene.traverse((obj) => {
        if (
          obj instanceof THREE.Mesh ||
          obj instanceof THREE.LineSegments ||
          obj instanceof THREE.Points
        ) {
          obj.geometry.dispose();
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m: THREE.Material) => m.dispose());
        }
      });
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [progressRef]);

  useEffect(() => {
    const cleanup = init();
    return cleanup;
  }, [init]);

  return (
    <div
      ref={mountRef}
      style={{ position: "absolute", inset: 0, zIndex: 1 }}
    />
  );
}