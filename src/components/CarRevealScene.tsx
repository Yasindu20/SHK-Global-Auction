import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface CarRevealSceneProps {
  scrollProgress: number;
}

interface SceneState {
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  planes: THREE.Mesh[];
  particles: THREE.Points;
  curve: THREE.CatmullRomCurve3;
  spotLights: THREE.SpotLight[];
  rafId: number;
  time: number;
}

/**
 * Real car photography from Unsplash (free, CORS-enabled CDN).
 * Cropped to 16:10 to match our plane aspect ratio.
 *
 * FIX: photo-1605559424843-9073c6e5e19b returned 404 — replaced with
 *      photo-1492144534655-ae79c964c9d7 (working interior/dashboard shot).
 */
const CAR_IMAGES = [
  // 1 — Dark studio exterior, hero front angle
  'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1920&h=1200&q=85&auto=format&fit=crop&crop=center',
  // 2 — Night road, dynamic driving shot
  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1920&h=1200&q=85&auto=format&fit=crop&crop=center',
  // 3 — JDM exterior action
  'https://images.unsplash.com/photo-1580427331730-b38f8dc1f355?w=1920&h=1200&q=85&auto=format&fit=crop&crop=center',
  // 4 — Interior / cockpit (replaced broken URL)
  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1920&h=1200&q=85&auto=format&fit=crop&crop=center',
  // 5 — Steering wheel & cockpit detail
  'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1920&h=1200&q=85&auto=format&fit=crop&crop=center',
  // 6 — JDM exterior second angle
  'https://images.unsplash.com/photo-1605907153179-8b364644a241?w=1920&h=1200&q=85&auto=format&fit=crop&crop=center',
  // 7 — Sports SUV, open road
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1920&h=1200&q=85&auto=format&fit=crop&crop=center',
];

export default function CarRevealScene({ scrollProgress }: CarRevealSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<SceneState | null>(null);
  const scrollProgressRef = useRef(scrollProgress);

  useEffect(() => {
    scrollProgressRef.current = scrollProgress;
  }, [scrollProgress]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    /* ─── Scene ─────────────────────────────────────────────── */
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040404);
    scene.fog = new THREE.FogExp2(0x040404, 0.018);

    /* ─── Camera ─────────────────────────────────────────────── */
    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      120
    );

    /* ─── Renderer ───────────────────────────────────────────── */
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    /* ─── Lights ─────────────────────────────────────────────── */
    const ambient = new THREE.AmbientLight(0x111111, 1);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xfff0dd, 1.6);
    keyLight.position.set(8, 10, 6);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x3355aa, 0.5);
    fillLight.position.set(-8, 4, -4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xd4a853, 0.8);
    rimLight.position.set(0, -2, -10);
    scene.add(rimLight);

    const spotLights: THREE.SpotLight[] = [];
    for (let i = 0; i < 3; i++) {
      const spot = new THREE.SpotLight(0xfff5e8, 0, 25, Math.PI / 3.5, 0.25, 1.8);
      scene.add(spot);
      scene.add(spot.target);
      spotLights.push(spot);
    }

    /* ─── Image Planes ──────────────────────────────────────── */
    const P = Math.PI;
    const planeConfigs: {
      pos: [number, number, number];
      rot: [number, number, number];
      scale: [number, number, number];
    }[] = [
      { pos: [0, 0, -5],   rot: [0, 0, 0],         scale: [12.8, 8, 1] },
      { pos: [6, 0, 1],    rot: [0, P / 2, 0],     scale: [12.8, 8, 1] },
      { pos: [0, 0, 7],    rot: [0, P, 0],          scale: [12.8, 8, 1] },
      { pos: [0, 0.3, -2], rot: [0, 0, 0],          scale: [10, 6.25, 1] },
      { pos: [0, 0.1, 1],  rot: [0, 0, 0],          scale: [10, 6.25, 1] },
      { pos: [-6, 0, 3],   rot: [0, -P / 5, 0],    scale: [10, 6.25, 1] },
      { pos: [3, 1.2, -1], rot: [0.15, -P / 5, 0], scale: [8, 5, 1] },
    ];

    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = 'anonymous';
    const planes: THREE.Mesh[] = [];

    CAR_IMAGES.forEach((url, i) => {
      const texture = textureLoader.load(url);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

      const geo = new THREE.PlaneGeometry(1, 1);
      const mat = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
      });

      const mesh = new THREE.Mesh(geo, mat);
      const cfg = planeConfigs[i];
      mesh.position.set(...cfg.pos);
      mesh.rotation.set(...cfg.rot);
      mesh.scale.set(...cfg.scale);
      scene.add(mesh);
      planes.push(mesh);
    });

    /* ─── Edge glow frames ────────────────────────────────────── */
    const frames: THREE.LineSegments[] = [];
    planeConfigs.forEach((cfg, i) => {
      const [sw, sh] = cfg.scale;
      const frameGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(sw, sh));
      const frameMat = new THREE.LineBasicMaterial({
        color: 0xd4a853,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const frame = new THREE.LineSegments(frameGeo, frameMat);
      frame.position.set(...cfg.pos);
      frame.rotation.set(...cfg.rot);
      if (cfg.rot[1] === 0) frame.position.z += 0.01;
      scene.add(frame);
      frames.push(frame);
      void i;
    });

    /* ─── Reflective floor ───────────────────────────────────── */
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x080808,
      roughness: 0.04,
      metalness: 0.96,
      transparent: true,
      opacity: 0.55,
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -4.2;
    scene.add(floor);

    /* ─── Floating dust particles ────────────────────────────── */
    const particleCount = 700;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 40;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 18 + 2;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xd4a853,
      size: 0.022,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    /* ─── Light shafts ───────────────────────────────────────── */
    const shaftGeo = new THREE.PlaneGeometry(0.4, 14);
    const shaftMat = new THREE.MeshBasicMaterial({
      color: 0xd4a853,
      transparent: true,
      opacity: 0.025,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    for (let i = 0; i < 6; i++) {
      const shaft = new THREE.Mesh(shaftGeo, shaftMat.clone());
      shaft.position.set(
        (Math.random() - 0.5) * 16,
        0,
        (Math.random() - 0.5) * 16
      );
      shaft.rotation.x = Math.PI / 2;
      shaft.rotation.z = Math.random() * Math.PI;
      scene.add(shaft);
    }

    /* ─── Camera path ────────────────────────────────────────── */
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 2.5, 13),
      new THREE.Vector3(2, 1.5, 10),
      new THREE.Vector3(5, 0.8, 7),
      new THREE.Vector3(7, 0, 3),
      new THREE.Vector3(6, 0, -1),
      new THREE.Vector3(3, 0, -4),
      new THREE.Vector3(0, 0, -4),
      new THREE.Vector3(-1, 0.4, -1),
      new THREE.Vector3(0, 0.3, 1.5),
      new THREE.Vector3(-3, 1, 4),
      new THREE.Vector3(0, 2, 8),
      new THREE.Vector3(0, 2.8, 13),
    ]);
    curve.tension = 0.4;

    const state: SceneState = {
      camera,
      renderer,
      scene,
      planes,
      particles,
      curve,
      spotLights,
      rafId: 0,
      time: 0,
    };
    stateRef.current = state;

    /* ─── Animation loop ─────────────────────────────────────── */
    const animate = () => {
      state.rafId = requestAnimationFrame(animate);
      state.time += 0.004;

      const raw = scrollProgressRef.current;
      const t = Math.min(Math.max(raw, 0), 0.999);
      const tLook = Math.min(t + 0.018, 0.999);

      const target = state.curve.getPointAt(t);
      const lookTarget = state.curve.getPointAt(tLook);

      state.camera.position.lerp(target, 0.09);
      state.camera.lookAt(lookTarget);

      state.particles.rotation.y += 0.00015;

      let spotIdx = 0;
      state.planes.forEach((plane, i) => {
        const dist = state.camera.position.distanceTo(plane.position);
        const mat = plane.material as THREE.MeshBasicMaterial;

        const raw = dist < 9 ? Math.max(0, 1 - dist / 9) : 0;
        const targetOpacity = raw * 0.96;
        mat.opacity += (targetOpacity - mat.opacity) * 0.055;

        const fm = frames[i].material as THREE.LineBasicMaterial;
        fm.opacity = mat.opacity * 0.45;

        if (spotIdx < 3 && dist < 12 && mat.opacity > 0.05) {
          const spot = state.spotLights[spotIdx];
          spot.intensity = (1 - dist / 12) * 2.8;
          spot.position.set(
            plane.position.x + 4,
            plane.position.y + 6,
            plane.position.z + 4
          );
          spot.target.position.copy(plane.position);
          spot.target.updateMatrixWorld();
          spotIdx++;
        }
      });

      for (let k = spotIdx; k < state.spotLights.length; k++) {
        state.spotLights[k].intensity *= 0.92;
      }

      state.renderer.render(state.scene, state.camera);
    };
    animate();

    /* ─── Resize ─────────────────────────────────────────────── */
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    /* ─── Cleanup ────────────────────────────────────────────── */
    return () => {
      window.removeEventListener('resize', handleResize);
      if (stateRef.current) cancelAnimationFrame(stateRef.current.rafId);
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            (obj.material as THREE.Material).dispose();
          }
        }
      });
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
    />
  );
}