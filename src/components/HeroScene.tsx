import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface HeroSceneProps {
  mousePos: { x: number; y: number };
}

export default function HeroScene({ mousePos }: HeroSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number>(0);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene setup with fog for depth
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050505, 0.035);

    const isMobile = window.innerWidth <= 768;
    const camera = new THREE.PerspectiveCamera(
      isMobile ? 65 : 55,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 2.5, 18);
    camera.lookAt(0, 2.5, 0);

    // Performance-optimized WebGL renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: 'high-performance',
      failIfMajorPerformanceCaveat: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x030303);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls with smooth damping
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 28;
    controls.maxPolarAngle = Math.PI / 1.9;
    controls.minPolarAngle = 0.35;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableRotate = false;

    // Optimized lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.4);
    directionalLight.position.set(6, 18, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 60;
    directionalLight.shadow.camera.left = -12;
    directionalLight.shadow.camera.right = 12;
    directionalLight.shadow.camera.top = 12;
    directionalLight.shadow.camera.bottom = -12;
    directionalLight.shadow.bias = -0.0005;
    scene.add(directionalLight);
    scene.add(directionalLight.target);

    const pointLight = new THREE.PointLight(0xD4A853, 1, 35);
    pointLight.position.set(-6, 6, 6);
    scene.add(pointLight);

    const rimLight = new THREE.SpotLight(0x4ecdc4, 0.6);
    rimLight.position.set(8, 4, -8);
    rimLight.lookAt(0, 2, 0);
    scene.add(rimLight);

    // Reusable wall material for performance
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x0A0A0A,
      roughness: 0.85,
      metalness: 0.08,
    });

    // Floor with grid pattern
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(28, 18), wallMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    // Grid helper for depth perception
    const gridHelper = new THREE.GridHelper(28, 28, 0x333333, 0x1a1a1a);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // Back wall
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(28, 15), wallMaterial);
    backWall.position.set(0, 7.5, -10);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Side walls
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(18, 15), wallMaterial);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-14, 7.5, 0);
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(18, 15), wallMaterial);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(14, 7.5, 0);
    rightWall.receiveShadow = true;
    scene.add(rightWall);

    // Ceiling with opening
    const leftCeiling = new THREE.Mesh(new THREE.PlaneGeometry(12, 18), wallMaterial);
    leftCeiling.rotation.x = Math.PI / 2;
    leftCeiling.position.set(-8, 15, 0);
    scene.add(leftCeiling);

    const rightCeiling = new THREE.Mesh(new THREE.PlaneGeometry(12, 18), wallMaterial);
    rightCeiling.rotation.x = Math.PI / 2;
    rightCeiling.position.set(8, 15, 0);
    scene.add(rightCeiling);

    // Enhanced vehicle model with more detail
    const vehicle = new THREE.Group();
    const vehicleMaterial = new THREE.MeshStandardMaterial({
      color: 0x1C1C1C,
      roughness: 0.25,
      metalness: 0.75,
      envMapIntensity: 1.2,
    });
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x111111,
      roughness: 0.08,
      metalness: 0.95,
      transparent: true,
      opacity: 0.65,
      transmission: 0.2,
      thickness: 0.5,
    });
    const wheelMaterial = new THREE.MeshStandardMaterial({
      color: 0x0A0A0A,
      roughness: 0.85,
      metalness: 0.15,
    });
    const accentMaterial = new THREE.MeshStandardMaterial({
      color: 0xD4A853,
      roughness: 0.35,
      metalness: 0.85,
      emissive: 0xD4A853,
      emissiveIntensity: 0.25,
    });

    // Chassis with beveled edges
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.75, 5.2), vehicleMaterial);
    chassis.position.set(0, 1.15, 0);
    chassis.castShadow = true;
    vehicle.add(chassis);

    // Cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2, 0.65, 2.7), vehicleMaterial);
    cabin.position.set(0, 1.85, -0.35);
    cabin.castShadow = true;
    vehicle.add(cabin);

    // Windshield
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.55, 0.12), glassMaterial);
    windshield.rotation.x = Math.PI / 6;
    windshield.position.set(0, 1.95, 1.05);
    vehicle.add(windshield);

    // Rear window
    const rearWindow = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.45, 0.12), glassMaterial);
    rearWindow.rotation.x = -Math.PI / 8;
    rearWindow.position.set(0, 1.92, -1.65);
    vehicle.add(rearWindow);

    // Headlights (accent glow)
    const headlightLeft = new THREE.Mesh(new THREE.SphereGeometry(0.18, 20, 20), accentMaterial);
    headlightLeft.position.set(-0.75, 1.15, 2.6);
    vehicle.add(headlightLeft);
    
    const headlightRight = new THREE.Mesh(new THREE.SphereGeometry(0.18, 20, 20), accentMaterial);
    headlightRight.position.set(0.75, 1.15, 2.6);
    vehicle.add(headlightRight);

    // Wheels with detailed rims
    const wheelPositions = [
      [-1.15, 0.48, 1.7],
      [1.15, 0.48, 1.7],
      [-1.15, 0.48, -1.7],
      [1.15, 0.48, -1.7],
    ];
    wheelPositions.forEach((pos) => {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.48, 0.48, 0.38, 28),
        wheelMaterial
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos[0], pos[1], pos[2]);
      wheel.castShadow = true;
      
      // Detailed rim
      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(0.28, 0.06, 10, 20),
        accentMaterial
      );
      rim.rotation.y = Math.PI / 2;
      rim.position.set(pos[0] + (pos[0] > 0 ? 0.2 : -0.2), pos[1], pos[2]);
      vehicle.add(rim);
      
      vehicle.add(wheel);
    });

    vehicle.position.set(0, 25, 0);
    vehicle.rotation.y = Math.PI / 4;
    scene.add(vehicle);

    // Floating particles with instanced geometry for performance
    const particleCount = 180;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 35;
      positions[i * 3 + 1] = Math.random() * 28;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 25;
      velocities[i * 3] = (Math.random() - 0.5) * 0.025;
      velocities[i * 3 + 1] = Math.random() * 0.025 + 0.012;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.025;
    }
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xD4A853,
      size: 0.07,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Ambient floating orbs for atmospheric depth
    const orbGeometry = new THREE.SphereGeometry(0.35, 20, 20);
    const orbMaterial = new THREE.MeshStandardMaterial({
      color: 0xD4A853,
      emissive: 0xD4A853,
      emissiveIntensity: 0.35,
      roughness: 0.15,
      metalness: 0.85,
      transparent: true,
      opacity: 0.65,
    });
    const orbs: THREE.Mesh[] = [];
    for (let i = 0; i < 6; i++) {
      const orb = new THREE.Mesh(orbGeometry, orbMaterial);
      orb.position.set(
        (Math.random() - 0.5) * 24,
        Math.random() * 18 + 6,
        (Math.random() - 0.5) * 18
      );
      scene.add(orb);
      orbs.push(orb);
    }

    // Animation loop with delta time for smooth performance
    let time = 0;
    const clock = new THREE.Clock();
    
    const animate = () => {
      const delta = Math.min(clock.getDelta(), 0.1);
      time += delta;

      // Vehicle descent with cubic easing
      const descentProgress = Math.min((time - 2) / 4, 1);
      const easeOut = 1 - Math.pow(1 - descentProgress, 3);
      vehicle.position.y = 25 - (25 - 3.5) * easeOut;

      // Mouse-based parallax rotation (subtle but noticeable)
      const targetRotY = mousePos.x * 0.18;
      const targetRotX = mousePos.y * 0.12;
      vehicle.rotation.y += (targetRotY - vehicle.rotation.y) * 0.06;
      vehicle.rotation.x += (targetRotX - vehicle.rotation.x) * 0.06;
      
      // Subtle idle animation
      vehicle.rotation.z = Math.sin(time * 0.35) * 0.025;

      // Spotlight tracking vehicle
      directionalLight.position.x = vehicle.position.x + 3.5;
      directionalLight.position.z = vehicle.position.z + 9;
      directionalLight.target.position.copy(vehicle.position);
      directionalLight.target.updateMatrixWorld();

      // Particle drift with velocity
      const posArray = particleGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        posArray[i * 3] += velocities[i * 3];
        posArray[i * 3 + 1] += velocities[i * 3 + 1];
        posArray[i * 3 + 2] += velocities[i * 3 + 2];
        
        // Wrap around boundaries
        if (posArray[i * 3 + 1] > 28) {
          posArray[i * 3 + 1] = 0;
        }
        if (posArray[i * 3] > 18) posArray[i * 3] = -18;
        if (posArray[i * 3] < -18) posArray[i * 3] = 18;
      }
      particleGeometry.attributes.position.needsUpdate = true;

      // Orb animation with sine waves
      orbs.forEach((orb, i) => {
        orb.position.y += Math.sin(time * 0.6 + i) * 0.025;
        orb.rotation.y += delta * 0.35;
      });

      controls.update();
      renderer.render(scene, camera);
      frameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Resize handler with debounce for performance
    let resizeTimeout: number;
    const onResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(() => {
        const aspect = window.innerWidth / window.innerHeight;
        camera.aspect = aspect;
        camera.fov = isMobile ? 65 : 55;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }, 100);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameRef.current);
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      renderer.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      wallMaterial.dispose();
      vehicleMaterial.dispose();
      glassMaterial.dispose();
      wheelMaterial.dispose();
      accentMaterial.dispose();
      orbGeometry.dispose();
      orbMaterial.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [mousePos]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
      }}
    />
  );
}
