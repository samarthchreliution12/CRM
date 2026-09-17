import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useReducedMotion } from "../../../hooks/website/useReducedMotion";
import { useWebGLSupport } from "../../../hooks/website/useWebGLSupport";

export const Hero3DScene = () => {
  const containerRef = useRef(null);
  const isWebGLSupported = useWebGLSupport();
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (!isWebGLSupported || prefersReduced || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 8.5);

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 3. Lighting System
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xfff5e6, 2.2);
    mainLight.position.set(5, 6, 6);
    scene.add(mainLight);

    const accentLight = new THREE.PointLight(0x9e241d, 2.5, 12);
    accentLight.position.set(-4, -3, 3);
    scene.add(accentLight);

    const goldFillLight = new THREE.PointLight(0xd4af37, 1.8, 10);
    goldFillLight.position.set(4, -2, 2);
    scene.add(goldFillLight);

    // 4. Materials
    const goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.88,
      roughness: 0.22,
    });

    const crimsonMaterial = new THREE.MeshStandardMaterial({
      color: 0x9e241d,
      metalness: 0.65,
      roughness: 0.35,
    });

    const acrylicMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xfdfdfd,
      metalness: 0.1,
      roughness: 0.2,
      transmission: 0.6,
      opacity: 0.92,
      transparent: true,
      thickness: 0.2,
    });

    // 5. 3D Elements Group
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // A. Floating Gold Coins
    const coins = [];
    const coinGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.1, 32);
    const coinPositions = [
      { x: -1.8, y: 1.2, z: 0.8, rx: 0.4, ry: 0.5 },
      { x: 2.1, y: -0.9, z: 1.1, rx: 0.8, ry: 0.2 },
      { x: 0.9, y: 1.6, z: -0.5, rx: 0.2, ry: 0.9 },
    ];

    coinPositions.forEach((pos) => {
      const coin = new THREE.Mesh(coinGeo, goldMaterial);
      coin.position.set(pos.x, pos.y, pos.z);
      coin.rotation.set(pos.rx, pos.ry, 0);
      mainGroup.add(coin);
      coins.push(coin);
    });

    // Extended & Larger BSE & NSE Stamp Texture for Document Card
    const createBseNseTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");

      ctx.clearRect(0, 0, 512, 512);

      // Dual Gold & Crimson Frame
      ctx.lineWidth = 10;
      ctx.strokeStyle = "rgba(158, 36, 29, 0.75)";
      ctx.strokeRect(20, 20, 472, 472);

      ctx.lineWidth = 5;
      ctx.strokeStyle = "rgba(212, 175, 55, 0.85)";
      ctx.strokeRect(34, 34, 444, 444);

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Header Label
      ctx.font = "800 38px 'Segoe UI', Arial, sans-serif";
      ctx.fillStyle = "#64748b";
      ctx.fillText("REGISTERED", 256, 82);

      // BSE Text
      ctx.font = "900 120px 'Segoe UI', Arial, sans-serif";
      ctx.fillStyle = "#9e241d";
      ctx.fillText("BSE", 256, 175);

      // Gold Separator Line
      ctx.beginPath();
      ctx.moveTo(60, 256);
      ctx.lineTo(452, 256);
      ctx.lineWidth = 6;
      ctx.strokeStyle = "rgba(212, 175, 55, 0.9)";
      ctx.stroke();

      // NSE Text
      ctx.font = "900 120px 'Segoe UI', Arial, sans-serif";
      ctx.fillStyle = "#b8860b";
      ctx.fillText("NSE", 256, 345);

      // Subtitle
      ctx.font = "800 34px 'Segoe UI', Arial, sans-serif";
      ctx.fillStyle = "#64748b";
      ctx.fillText("SHARES & STOCKS", 256, 435);

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return texture;
    };

    const bseNseTexture = createBseNseTexture();

    const bseNseMaterial = new THREE.MeshBasicMaterial({
      map: bseNseTexture,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
    });

    // B. Floating Share Certificate Document Panel
    const docGroup = new THREE.Group();
    const docGeo = new THREE.BoxGeometry(1.6, 2.2, 0.05);
    const docMesh = new THREE.Mesh(docGeo, acrylicMaterial);
    docGroup.add(docMesh);

    // Extended Larger BSE and NSE Text Stamp on Card
    const stampGeo = new THREE.PlaneGeometry(1.2, 1.4);
    const stampMesh = new THREE.Mesh(stampGeo, bseNseMaterial);
    stampMesh.position.set(0, 0.15, 0.03);
    docGroup.add(stampMesh);

    // Seal on Document
    const sealGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.07, 24);
    const sealMesh = new THREE.Mesh(sealGeo, goldMaterial);
    sealMesh.rotation.x = Math.PI / 2;
    sealMesh.position.set(0.4, -0.6, 0.04);
    docGroup.add(sealMesh);

    docGroup.position.set(-0.6, 0.1, 0.2);
    docGroup.rotation.set(0.15, -0.25, 0.08);
    mainGroup.add(docGroup);

    // C. Wealth Growth Torus Ring
    const torusGeo = new THREE.TorusGeometry(2.3, 0.06, 16, 100);
    const torusRing = new THREE.Mesh(torusGeo, crimsonMaterial);
    torusRing.rotation.x = Math.PI / 3;
    torusRing.rotation.y = 0.2;
    mainGroup.add(torusRing);

    const innerTorusGeo = new THREE.TorusGeometry(1.7, 0.03, 16, 80);
    const innerTorusRing = new THREE.Mesh(innerTorusGeo, goldMaterial);
    innerTorusRing.rotation.x = -Math.PI / 4;
    innerTorusRing.rotation.y = -0.3;
    mainGroup.add(innerTorusRing);

    // D. Abstract Bar Chart Blocks
    const barGroup = new THREE.Group();
    const barHeights = [0.6, 1.1, 1.6, 2.2];
    barHeights.forEach((h, i) => {
      const barGeo = new THREE.BoxGeometry(0.3, h, 0.3);
      const barMat = i % 2 === 0 ? crimsonMaterial : goldMaterial;
      const bar = new THREE.Mesh(barGeo, barMat);
      bar.position.set(1.4 + i * 0.45, -1.0 + h / 2, -0.4);
      barGroup.add(bar);
    });
    mainGroup.add(barGroup);

    // E. Ambient Floating Particles
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 10;
      posArray[i + 1] = (Math.random() - 0.5) * 8;
      posArray[i + 2] = (Math.random() - 0.5) * 6;
    }

    particleGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(posArray, 3)
    );

    const particleMat = new THREE.PointsMaterial({
      size: 0.04,
      color: 0xd4af37,
      transparent: true,
      opacity: 0.65,
    });

    const particlePoints = new THREE.Points(particleGeo, particleMat);
    scene.add(particlePoints);

    // 6. Interaction & Motion Tracking
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handleMouseMove = (e) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    let animationFrameId;
    let clock = new THREE.Clock();

    // 7. Animation Loop
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth Mouse Interpolation (Lerp)
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      // Group Parallax & Tilt
      mainGroup.rotation.y = elapsedTime * 0.08 + mouseX * 0.3;
      mainGroup.rotation.x = Math.sin(elapsedTime * 0.05) * 0.08 - mouseY * 0.2;

      // Coins Gentle Spin & Bobbing
      coins.forEach((coin, idx) => {
        coin.rotation.y += 0.015 * (idx % 2 === 0 ? 1 : -1);
        coin.position.y += Math.sin(elapsedTime * 1.5 + idx) * 0.0015;
      });

      // Document Float
      docGroup.position.y = 0.1 + Math.sin(elapsedTime * 1.2) * 0.08;
      docGroup.rotation.z = 0.08 + Math.cos(elapsedTime * 0.8) * 0.03;

      // Torus Rings
      torusRing.rotation.z += 0.003;
      innerTorusRing.rotation.z -= 0.005;

      // Particles Slow Drift
      particlePoints.rotation.y = elapsedTime * 0.02;

      renderer.render(scene, camera);
    };

    animate();

    // 8. Resize Handler
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // 9. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }

      // Dispose Geometries & Materials
      coinGeo.dispose();
      docGeo.dispose();
      sealGeo.dispose();
      stampGeo.dispose();
      torusGeo.dispose();
      innerTorusGeo.dispose();
      particleGeo.dispose();

      bseNseTexture.dispose();

      goldMaterial.dispose();
      crimsonMaterial.dispose();
      acrylicMaterial.dispose();
      bseNseMaterial.dispose();
      particleMat.dispose();
      renderer.dispose();
    };
  }, [isWebGLSupported, prefersReduced]);

  if (!isWebGLSupported || prefersReduced) {
    return (
      <div className="hero-3d-fallback">
        <div className="hero-3d-fallback-ring" />
        <div className="hero-3d-fallback-coin" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="hero-3d-canvas-container"
      style={{
        width: "100%",
        height: "100%",
        minHeight: "450px",
        position: "relative",
      }}
    />
  );
};

export default Hero3DScene;
