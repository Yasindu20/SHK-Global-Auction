import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

interface CarRevealSceneProps {
  progressRef: React.MutableRefObject<number>;
}

interface SceneState {
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  composer: EffectComposer;
  scene: THREE.Scene;
  planes: THREE.Mesh[];
  frames: THREE.LineSegments[];
  particles: THREE.Points;
  curve: THREE.CatmullRomCurve3;
  spotLights: THREE.SpotLight[];
  rafId: number;
  time: number;
  targetCameraPos: THREE.Vector3;
  targetLookAt: THREE.Vector3;
}

const CAR_IMAGES = [
  "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=2048&h=1365&q=90&auto=format&fit=crop&crop=center",
  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=2048&h=1365&q=90&auto=format&fit=crop&crop=center",
  "https://images.unsplash.com/photo-1580427331730-b38f8dc1f355?w=2048&h=1365&q=90&auto=format&fit=crop&crop=center",
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=2048&h=1365&q=90&auto=format&fit=crop&crop=center",
  "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=2048&h=1365&q=90&auto=format&fit=crop&crop=center",
  "https://images.unsplash.com/photo-1605907153179-8b364644a241?w=2048&h=1365&q=90&auto=format&fit=crop&crop=center",
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=2048&h=1365&q=90&auto=format&fit=crop&crop=center",
];

export default function CarRevealScene({ progressRef }: CarRevealSceneProps) {
  // ── Fixed: single `<` instead of `<<` ──
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<SceneState | null>(null);

  const init = useCallback(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ── Scene ──
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030303);
    scene.fog = new THREE.FogExp2(0x030303, 0.015);

    // ── Camera ──
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      150
    );

    // ── Renderer ──
    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: "high-performance",
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    // ── Post-Processing (Bloom) ──
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.35,
      0.6,
      0.75
    );
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());

    // ── Lighting (Studio Setup) ──
    const ambient = new THREE.AmbientLight(0x1a1a2e, 0.8);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xfff5e6, 2.0);
    keyLight.position.set(6, 12, 8);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x4455aa, 0.6);
    fillLight.position.set(-8, 6, -4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffd4a0, 1.0);
    rimLight.position.set(0, 4, -12);
    scene.add(rimLight);

    // Spotlights for image planes
    const spotLights: THREE.SpotLight[] = [];
    for (let i = 0; i < 4; i++) {
      const spot = new THREE.SpotLight(0xfff5e8, 0, 30, Math.PI / 4, 0.3, 1.5);
      spot.position.set(0, 8, 0);
      scene.add(spot);
      scene.add(spot.target);
      spotLights.push(spot);
    }

    // ── Image Planes ──
    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = "anonymous";

    const planeConfigs: {
      pos: [number, number, number];
      rot: [number, number, number];
      scale: [number, number, number];
    }[] = [
      { pos: [0, 0.5, -4],   rot: [0, 0, 0],              scale: [10, 6.67, 1] },
      { pos: [4.5, 0, 2],    rot: [0, -Math.PI / 6, 0],   scale: [10, 6.67, 1] },
      { pos: [0, 0.5, 8],    rot: [0, Math.PI, 0],         scale: [10, 6.67, 1] },
      { pos: [-3, 0.8, 3],   rot: [0.05, Math.PI / 8, 0], scale: [8, 5.33, 1]  },
      { pos: [3, 0.3, -1],   rot: [0, -Math.PI / 10, 0],  scale: [8, 5.33, 1]  },
      { pos: [-5, 0, 5],     rot: [0, Math.PI / 4, 0],    scale: [8, 5.33, 1]  },
      { pos: [0, 1.5, 0],    rot: [0.1, 0, 0],             scale: [7, 4.67, 1]  },
    ];

    const planes: THREE.Mesh[] = [];
    const frames: THREE.LineSegments[] = [];

    CAR_IMAGES.forEach((url, i) => {
      const texture = textureLoader.load(url);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      texture.generateMipmaps = true;

      const geo = new THREE.PlaneGeometry(1, 1);
      const mat = new THREE.MeshPhysicalMaterial({
        map: texture,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        emissive: new THREE.Color(0xffffff),
        emissiveMap: texture,
        emissiveIntensity: 0.15,
        roughness: 0.4,
        metalness: 0.1,
        clearcoat: 0.3,
        clearcoatRoughness: 0.25,
      });

      const mesh = new THREE.Mesh(geo, mat);
      const cfg = planeConfigs[i];
      mesh.position.set(...cfg.pos);
      mesh.rotation.set(...cfg.rot);
      mesh.scale.set(...cfg.scale);
      scene.add(mesh);
      planes.push(mesh);

      // Edge glow frame
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
      frame.position.copy(mesh.position);
      frame.rotation.copy(mesh.rotation);
      frame.position.z += 0.02;
      scene.add(frame);
      frames.push(frame);
    });

    // ── Reflective Floor ──
    const floorMat = new THREE.MeshPhysicalMaterial({
      color: 0x050505,
      roughness: 0.05,
      metalness: 0.98,
      transparent: true,
      opacity: 0.45,
      envMapIntensity: 1.0,
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -3.5;
    scene.add(floor);

    // ── Floating Particles (Custom Shader) ──
    const particleCount = 1200;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    const pSizes = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      pPos[i * 3]     = (Math.random() - 0.5) * 50;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 20 + 4;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 50;
      pSizes[i] = Math.random() * 0.04 + 0.01;
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute("size",     new THREE.BufferAttribute(pSizes, 1));

    const pMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime:  { value: 0 },
        uColor: { value: new THREE.Color(0xd4a853) },
      },
      vertexShader: `
        attribute float size;
        varying float vAlpha;
        uniform float uTime;
        void main() {
          vec3 pos = position;
          pos.y += sin(uTime * 0.5 + position.x * 0.3) * 0.4;
          pos.x += cos(uTime * 0.3 + position.z * 0.2) * 0.2;
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
          vAlpha = 0.25 + 0.15 * sin(uTime + position.x);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float glow = 1.0 - (d * 2.0);
          glow = pow(glow, 2.0);
          gl_FragColor = vec4(uColor, vAlpha * glow);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // ── Light Shafts ──
    const shaftGeo = new THREE.PlaneGeometry(0.6, 18);
    const shaftMat = new THREE.MeshBasicMaterial({
      color: 0xd4a853,
      transparent: true,
      opacity: 0.02,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    for (let i = 0; i < 8; i++) {
      const shaft = new THREE.Mesh(shaftGeo, shaftMat.clone());
      shaft.position.set(
        (Math.random() - 0.5) * 20,
        2,
        (Math.random() - 0.5) * 20
      );
      shaft.rotation.x = Math.PI / 2;
      shaft.rotation.z = Math.random() * Math.PI;
      scene.add(shaft);
    }

    // ── Camera Path ──
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0,  2.0, 14),
      new THREE.Vector3(1.5, 1.2, 10),
      new THREE.Vector3(3,  0.6,  6),
      new THREE.Vector3(5,  0.2,  3),
      new THREE.Vector3(4,  0,    0),
      new THREE.Vector3(2,  0,   -3),
      new THREE.Vector3(0,  0.2, -3),
      new THREE.Vector3(-2, 0.5,  0),
      new THREE.Vector3(-1, 0.8,  3),
      new THREE.Vector3(0,  1.5,  7),
      new THREE.Vector3(0,  2.2, 14),
    ]);
    curve.tension = 0.35;

    const state: SceneState = {
      camera,
      renderer,
      composer,
      scene,
      planes,
      frames,
      particles,
      curve,
      spotLights,
      rafId: 0,
      time: 0,
      targetCameraPos: new THREE.Vector3(),
      targetLookAt: new THREE.Vector3(),
    };
    stateRef.current = state;

    // ── Animation Loop ──
    const clock = new THREE.Clock();
    const animate = () => {
      state.rafId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      state.time += delta;

      const raw = progressRef.current;
      const t     = Math.min(Math.max(raw, 0), 0.999);
      const tLook = Math.min(t + 0.015, 0.999);

      const target     = state.curve.getPointAt(t);
      const lookTarget = state.curve.getPointAt(tLook);

      state.targetCameraPos.copy(target);
      state.targetLookAt.copy(lookTarget);

      state.camera.position.lerp(state.targetCameraPos, 0.12);
      state.camera.lookAt(state.targetLookAt);

      // Update shader uniforms
      (state.particles.material as THREE.ShaderMaterial).uniforms.uTime.value = state.time;

      // Image visibility with distance-based opacity + frame glow
      let spotIdx = 0;
      state.planes.forEach((plane, i) => {
        const dist = state.camera.position.distanceTo(plane.position);
        let targetOpacity = 0;
        if (dist < 11) {
          targetOpacity = Math.max(0, 1 - Math.pow(dist / 10, 2.5));
          targetOpacity = Math.min(targetOpacity, 0.98);
        }

        const mat = plane.material as THREE.MeshPhysicalMaterial;
        mat.opacity += (targetOpacity - mat.opacity) * 0.08;

        // Gentle billboard rotation
        const targetRot = planeConfigs[i].rot[1];
        const lookAtRot = Math.atan2(
          state.camera.position.x - plane.position.x,
          state.camera.position.z - plane.position.z
        );
        const blend = 0.03;
        plane.rotation.y +=
          (targetRot + (lookAtRot - targetRot) * 0.3 - plane.rotation.y) * blend;

        // Frame glow follows image opacity
        const fm = state.frames[i].material as THREE.LineBasicMaterial;
        fm.opacity = mat.opacity * 0.55;

        // Dynamic spotlight on nearby images
        if (spotIdx < 4 && dist < 13 && mat.opacity > 0.08) {
          const spot = state.spotLights[spotIdx];
          spot.intensity = (1 - dist / 13) * 3.5;
          spot.position.set(
            plane.position.x + 3,
            plane.position.y + 8,
            plane.position.z + 5
          );
          spot.target.position.copy(plane.position);
          spot.target.updateMatrixWorld();
          spotIdx++;
        }
      });

      for (let k = spotIdx; k < state.spotLights.length; k++) {
        state.spotLights[k].intensity *= 0.9;
      }

      state.composer.render();
    };
    animate();

    // ── Resize ──
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
      bloomPass.resolution.set(w, h);
    };
    window.addEventListener("resize", handleResize);

    // ── Cleanup ──
    return () => {
      window.removeEventListener("resize", handleResize);
      if (stateRef.current) cancelAnimationFrame(stateRef.current.rafId);
      composer.dispose();
      renderer.dispose();
      scene.traverse((obj) => {
        if (
          obj instanceof THREE.Mesh ||
          obj instanceof THREE.LineSegments ||
          obj instanceof THREE.Points
        ) {
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
  }, [progressRef]);

  useEffect(() => {
    const cleanup = init();
    return cleanup;
  }, [init]);

  return (
    <div
      ref={mountRef}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 1,
      }}
    />
  );
}