import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default function HeroScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x050505, 10, 50);

    const isMobile = window.innerWidth <= 768;
    const camera = new THREE.PerspectiveCamera(
      isMobile ? 60 : 50,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 2, 15);
    camera.lookAt(0, 2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x030303);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 8;
    controls.maxDistance = 25;
    controls.maxPolarAngle = Math.PI / 1.8;
    controls.minPolarAngle = 0.3;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableRotate = false;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(5, 15, 8);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    directionalLight.shadow.bias = -0.001;
    scene.add(directionalLight);
    scene.add(directionalLight.target);

    const pointLight = new THREE.PointLight(0xD4A853, 0.8, 30);
    pointLight.position.set(-5, 5, 5);
    scene.add(pointLight);

    // Room enclosure
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x0A0A0A,
      roughness: 0.9,
      metalness: 0.05,
    });

    // Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(24, 16), wallMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    // Back wall
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(24, 13), wallMaterial);
    backWall.position.set(0, 6.5, -8);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Left wall
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(16, 13), wallMaterial);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-12, 6.5, 0);
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(16, 13), wallMaterial);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(12, 6.5, 0);
    rightWall.receiveShadow = true;
    scene.add(rightWall);

    // Ceiling with opening (two planes)
    const leftCeiling = new THREE.Mesh(new THREE.PlaneGeometry(10.5, 16), wallMaterial);
    leftCeiling.rotation.x = Math.PI / 2;
    leftCeiling.position.set(-6.75, 13, 0);
    scene.add(leftCeiling);

    const rightCeiling = new THREE.Mesh(new THREE.PlaneGeometry(10.5, 16), wallMaterial);
    rightCeiling.rotation.x = Math.PI / 2;
    rightCeiling.position.set(6.75, 13, 0);
    scene.add(rightCeiling);

    // Vehicle model
    const vehicle = new THREE.Group();
    const vehicleMaterial = new THREE.MeshStandardMaterial({
      color: 0x1C1C1C,
      roughness: 0.3,
      metalness: 0.7,
    });
    const glassMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.1,
      metalness: 0.9,
    });
    const wheelMaterial = new THREE.MeshStandardMaterial({
      color: 0x0A0A0A,
      roughness: 0.9,
      metalness: 0.1,
    });

    // Chassis
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, 5), vehicleMaterial);
    chassis.position.set(0, 1.1, 0);
    chassis.castShadow = true;
    vehicle.add(chassis);

    // Cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.6, 2.5), vehicleMaterial);
    cabin.position.set(0, 1.75, -0.3);
    cabin.castShadow = true;
    vehicle.add(cabin);

    // Windshield
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 0.1), glassMaterial);
    windshield.rotation.x = Math.PI / 6;
    windshield.position.set(0, 1.85, 0.95);
    vehicle.add(windshield);

    // Wheels
    const wheelPositions = [
      [-1.1, 0.45, 1.6],
      [1.1, 0.45, 1.6],
      [-1.1, 0.45, -1.6],
      [1.1, 0.45, -1.6],
    ];
    wheelPositions.forEach((pos) => {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.45, 0.45, 0.35, 24),
        wheelMaterial
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos[0], pos[1], pos[2]);
      wheel.castShadow = true;
      vehicle.add(wheel);
    });

    vehicle.position.set(0, 22, 0);
    scene.add(vehicle);

    // Particles
    const particleCount = 200;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = Math.random() * 25;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.05,
      transparent: true,
      opacity: 0.4,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Animation
    let time = 0;
    const animate = () => {
      time += 0.008;

      // Vehicle descent
      const descentProgress = Math.min((time - 2) / 4, 1);
      const easeOut = 1 - Math.pow(1 - descentProgress, 3);
      vehicle.position.y = 22 - (22 - 3) * easeOut;

      // Vehicle rotation
      vehicle.rotation.y = Math.sin(time * 0.3) * 0.15;
      vehicle.rotation.x = Math.sin(time * 0.2) * 0.03;

      // Spotlight tracking
      directionalLight.position.x = vehicle.position.x + 3;
      directionalLight.position.z = vehicle.position.z + 8;
      directionalLight.target.position.copy(vehicle.position);
      directionalLight.target.updateMatrixWorld();

      // Particle drift
      const posArray = particleGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        posArray[i * 3 + 1] += 0.005;
        if (posArray[i * 3 + 1] > 25) {
          posArray[i * 3 + 1] = 0;
        }
      }
      particleGeometry.attributes.position.needsUpdate = true;

      controls.update();
      renderer.render(scene, camera);
      frameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Resize
    const onResize = () => {
      const aspect = window.innerWidth / window.innerHeight;
      camera.aspect = aspect;
      camera.fov = window.innerWidth <= 768 ? 60 : 50;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      renderer.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      wallMaterial.dispose();
      vehicleMaterial.dispose();
      glassMaterial.dispose();
      wheelMaterial.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

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
