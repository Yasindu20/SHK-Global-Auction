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
  rafId: number;
}

export default function CarRevealScene({ scrollProgress }: CarRevealSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<SceneState | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.FogExp2(0x0a0a0a, 0.035);

    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffeedd, 2.0);
    dirLight.position.set(5, 8, 5);
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x4455ff, 0.5);
    fillLight.position.set(-5, 3, -5);
    scene.add(fillLight);

    const rimLight = new THREE.SpotLight(0xd4a853, 3.0, 20, Math.PI / 4, 0.5, 1);
    rimLight.position.set(0, 5, -8);
    rimLight.target.position.set(0, 0, 0);
    scene.add(rimLight);
    scene.add(rimLight.target);

    // Image paths
    const imagePaths = [
      '/images/car-reveal/exterior-front.jpg',
      '/images/car-reveal/exterior-side.jpg',
      '/images/car-reveal/exterior-rear.jpg',
      '/images/car-reveal/interior-dash.jpg',
      '/images/car-reveal/interior-seats.jpg',
      '/images/car-reveal/interior-trunk.jpg',
      '/images/car-reveal/interior-gear.jpg',
    ];

    const planeConfigs = [
      { pos: [0, 0, -4] as [number, number, number], rot: [0, 0, 0] as [number, number, number], scale: [5.5, 3.5, 1] as [number, number, number] },
      { pos: [4, -0.3, -1] as [number, number, number], rot: [0, -Math.PI / 2.5, 0] as [number, number, number], scale: [5, 3, 1] as [number, number, number] },
      { pos: [0, 0.2, 3] as [number, number, number], rot: [0, Math.PI, 0] as [number, number, number], scale: [5.5, 3.5, 1] as [number, number, number] },
      { pos: [0, 1.1, 0.5] as [number, number, number], rot: [0, 0, 0] as [number, number, number], scale: [4.5, 2.8, 1] as [number, number, number] },
      { pos: [0, 0.8, -1.5] as [number, number, number], rot: [0, 0, 0] as [number, number, number], scale: [4.5, 2.8, 1] as [number, number, number] },
      { pos: [0, 0.6, -3] as [number, number, number], rot: [0, 0, 0] as [number, number, number], scale: [4.5, 2.8, 1] as [number, number, number] },
      { pos: [0.3, 0.4, 0.8] as [number, number, number], rot: [0.2, -0.3, 0] as [number, number, number], scale: [2.5, 1.8, 1] as [number, number, number] },
    ];

    const textureLoader = new THREE.TextureLoader();
    const planes: THREE.Mesh[] = [];

    imagePaths.forEach((path, i) => {
      const texture = textureLoader.load(path);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;

      const geometry = new THREE.PlaneGeometry(1, 1);
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95,
        roughness: 0.6,
        metalness: 0.1,
      });

      const mesh = new THREE.Mesh(geometry, material);
      const cfg = planeConfigs[i];
      mesh.position.set(...cfg.pos);
      mesh.rotation.set(...cfg.rot);
      mesh.scale.set(...cfg.scale);
      scene.add(mesh);
      planes.push(mesh);
    });

    // Floor
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.3,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.5;
    scene.add(floor);

    // Particles
    const particleCount = 400;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10 + 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xd4a853,
      size: 0.03,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Camera fly-through path
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.5, 10),
      new THREE.Vector3(2, 1.2, 6),
      new THREE.Vector3(3, 0.8, 2),
      new THREE.Vector3(1.5, 0.6, -1),
      new THREE.Vector3(0, 0.5, -3),
      new THREE.Vector3(0, 0.8, -2),
      new THREE.Vector3(0, 1.0, -0.5),
      new THREE.Vector3(0.2, 1.15, 0.5),
      new THREE.Vector3(0.1, 1.1, 1.2),
      new THREE.Vector3(0.3, 0.6, 0.9),
    ]);

    const state: SceneState = {
      camera,
      renderer,
      scene,
      planes,
      particles,
      curve,
      rafId: 0,
    };

    stateRef.current = state;

    let lastProgress = -1;

    const animate = () => {
      const rafId = requestAnimationFrame(animate);
      state.rafId = rafId;

      // Only update if progress changed
      if (Math.abs(scrollProgress - lastProgress) > 0.0001 || lastProgress === -1) {
        lastProgress = scrollProgress;

        const t = Math.min(scrollProgress, 0.999);
        const point = state.curve.getPointAt(t);
        const lookAtPoint = state.curve.getPointAt(Math.min(t + 0.02, 0.999));

        state.camera.position.lerp(point, 0.12);
        state.camera.lookAt(lookAtPoint);

        // Particle drift
        state.particles.rotation.y += 0.0003;
        state.particles.rotation.x += 0.0001;

        // Distance-based plane fade
        state.planes.forEach((plane: THREE.Mesh) => {
          const dist = state.camera.position.distanceTo(plane.position);
          const mat = plane.material as THREE.MeshStandardMaterial;
          const target = dist < 8 ? Math.max(0, 1 - dist / 8) * 0.95 : 0;
          mat.opacity += (target - mat.opacity) * 0.05;
        });
      }

      state.renderer.render(state.scene, state.camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (stateRef.current) {
        cancelAnimationFrame(stateRef.current.rafId);
      }
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    // scrollProgress is read inside the rAF loop via closure
  }, [scrollProgress]);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
      }}
    />
  );
}