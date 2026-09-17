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
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 3. Studio Lighting System (Soft Warm Gold & Burgundy Palette)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xfff8ee, 2.4);
    mainLight.position.set(5, 6, 6);
    scene.add(mainLight);

    const accentLight = new THREE.PointLight(0x9e241d, 2.2, 12);
    accentLight.position.set(-4, -3, 3);
    scene.add(accentLight);

    const goldFillLight = new THREE.PointLight(0xfde047, 2.0, 10);
    goldFillLight.position.set(4, -2, 2);
    scene.add(goldFillLight);

    // 4. Realistic Materials
    const goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.9,
      roughness: 0.18,
    });

    const crimsonMaterial = new THREE.MeshStandardMaterial({
      color: 0x9e241d,
      metalness: 0.6,
      roughness: 0.28,
    });

    const acrylicMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xfdfbf7,
      metalness: 0.08,
      roughness: 0.12,
      transmission: 0.75,
      opacity: 0.95,
      transparent: true,
      thickness: 0.25,
    });

    // 5. Main 3D Composition Group
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // A. 3D Floating Gold Circles with Embossed Text
    const coinTextures = [];
    const createCoinTexture = (symbol, textLine1, textLine2) => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");

      // Premium Metallic Gold Surface Gradient
      const grad = ctx.createRadialGradient(256, 256, 20, 256, 256, 250);
      grad.addColorStop(0, "#fffbeb");
      grad.addColorStop(0.35, "#fde047");
      grad.addColorStop(0.7, "#d4af37");
      grad.addColorStop(1, "#854d0e");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(256, 256, 250, 0, Math.PI * 2);
      ctx.fill();

      // Outer Maroon & Gold Coin Border Ring
      ctx.lineWidth = 16;
      ctx.strokeStyle = "#9e241d";
      ctx.beginPath();
      ctx.arc(256, 256, 238, 0, Math.PI * 2);
      ctx.stroke();

      ctx.lineWidth = 6;
      ctx.strokeStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(256, 256, 222, 0, Math.PI * 2);
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Center Symbol (₹ / ★ / 📈)
      if (symbol) {
        ctx.font = "900 130px 'Segoe UI', Arial, sans-serif";
        ctx.fillStyle = "#78350f";
        ctx.fillText(symbol, 256, 195);
      }

      // Line 1: Primary Text
      if (textLine1) {
        ctx.font = "900 42px 'Segoe UI', Arial, sans-serif";
        ctx.fillStyle = "#9e241d";
        ctx.fillText(textLine1, 256, 310);
      }

      // Line 2: Subtitle Text
      if (textLine2) {
        ctx.font = "800 32px 'Segoe UI', Arial, sans-serif";
        ctx.fillStyle = "#1e293b";
        ctx.fillText(textLine2, 256, 365);
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      coinTextures.push(texture);
      return texture;
    };

    const coinData = [
      {
        x: -1.9,
        y: 1.3,
        z: 0.8,
        rx: 0.2,
        ry: 0.3,
        symbol: "₹",
        line1: "SINCE 1991",
        line2: "TRUSTED",
      },
      {
        x: 2.2,
        y: -0.9,
        z: 1.1,
        rx: 0.1,
        ry: -0.3,
        symbol: "★",
        line1: "100% SECURE",
        line2: "WEALTH",
      },
      {
        x: 1.0,
        y: 1.7,
        z: -0.5,
        rx: 0.3,
        ry: 0.2,
        symbol: "📈",
        line1: "GROWTH",
        line2: "EXPERT",
      },
    ];

    const coins = [];
    const coinGeo = new THREE.CylinderGeometry(0.75, 0.75, 0.12, 36);

    coinData.forEach((c) => {
      const tex = createCoinTexture(c.symbol, c.line1, c.line2);
      const capMat = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.2,
        metalness: 0.6,
      });

      const materials = [goldMaterial, capMat, capMat];
      const coin = new THREE.Mesh(coinGeo, materials);
      coin.position.set(c.x, c.y, c.z);
      // Set rotation so flat circular cap faces forward towards camera with subtle 3D tilt
      coin.rotation.set(Math.PI / 2 + c.rx, c.ry, 0);
      mainGroup.add(coin);
      coins.push(coin);
    });

    // B. BSE & NSE Share Certificate Texture Stamp
    const createBseNseTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");

      ctx.clearRect(0, 0, 512, 512);

      // Gold & Maroon Double Frame
      ctx.lineWidth = 12;
      ctx.strokeStyle = "#9e241d";
      ctx.strokeRect(18, 18, 476, 476);

      ctx.lineWidth = 6;
      ctx.strokeStyle = "#d4af37";
      ctx.strokeRect(34, 34, 444, 444);

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Header Label
      ctx.font = "800 36px 'Segoe UI', Arial, sans-serif";
      ctx.fillStyle = "#475569";
      ctx.fillText("PARSHWA CONSULTANCY", 256, 80);

      // BSE Stamp Text
      ctx.font = "900 115px 'Segoe UI', Arial, sans-serif";
      ctx.fillStyle = "#9e241d";
      ctx.fillText("BSE", 256, 175);

      // Gold Separator Line
      ctx.beginPath();
      ctx.moveTo(60, 256);
      ctx.lineTo(452, 256);
      ctx.lineWidth = 6;
      ctx.strokeStyle = "#d4af37";
      ctx.stroke();

      // NSE Stamp Text
      ctx.font = "900 115px 'Segoe UI', Arial, sans-serif";
      ctx.fillStyle = "#b8860b";
      ctx.fillText("NSE", 256, 345);

      // Subtitle
      ctx.font = "800 32px 'Segoe UI', Arial, sans-serif";
      ctx.fillStyle = "#475569";
      ctx.fillText("EQUITY & DEMAT VAULT", 256, 435);

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return texture;
    };

    const bseNseTexture = createBseNseTexture();
    const bseNseMaterial = new THREE.MeshBasicMaterial({
      map: bseNseTexture,
      transparent: true,
      opacity: 0.96,
      side: THREE.DoubleSide,
    });

    // C. Floating Share Certificate Document Panel
    const docGroup = new THREE.Group();
    const docGeo = new THREE.BoxGeometry(1.65, 2.25, 0.05);
    const docMesh = new THREE.Mesh(docGeo, acrylicMaterial);
    docGroup.add(docMesh);

    const stampGeo = new THREE.PlaneGeometry(1.25, 1.45);
    const stampMesh = new THREE.Mesh(stampGeo, bseNseMaterial);
    stampMesh.position.set(0, 0.15, 0.035);
    docGroup.add(stampMesh);

    // Official Seal on Document
    const sealGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.07, 32);
    const sealMesh = new THREE.Mesh(sealGeo, goldMaterial);
    sealMesh.rotation.x = Math.PI / 2;
    sealMesh.position.set(0.42, -0.62, 0.045);
    docGroup.add(sealMesh);

    docGroup.position.set(-0.6, 0.1, 0.2);
    docGroup.rotation.set(0.15, -0.25, 0.08);
    mainGroup.add(docGroup);

    // D. Wealth Growth Dual Torus Rings
    const torusGeo = new THREE.TorusGeometry(2.35, 0.06, 16, 100);
    const torusRing = new THREE.Mesh(torusGeo, crimsonMaterial);
    torusRing.rotation.x = Math.PI / 3;
    torusRing.rotation.y = 0.2;
    mainGroup.add(torusRing);

    const innerTorusGeo = new THREE.TorusGeometry(1.75, 0.035, 16, 80);
    const innerTorusRing = new THREE.Mesh(innerTorusGeo, goldMaterial);
    innerTorusRing.rotation.x = -Math.PI / 4;
    innerTorusRing.rotation.y = -0.3;
    mainGroup.add(innerTorusRing);

    // E. Financial Growth Bar Chart Blocks
    const barGroup = new THREE.Group();
    const barHeights = [0.65, 1.15, 1.65, 2.25];
    barHeights.forEach((h, i) => {
      const barGeo = new THREE.BoxGeometry(0.32, h, 0.32);
      const barMat = i % 2 === 0 ? crimsonMaterial : goldMaterial;
      const bar = new THREE.Mesh(barGeo, barMat);
      bar.position.set(1.45 + i * 0.45, -1.0 + h / 2, -0.4);
      barGroup.add(bar);
    });
    mainGroup.add(barGroup);

    // F. Ambient Floating Gold Dust Particles
    const particleCount = 140;
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
      size: 0.045,
      color: 0xfde047,
      transparent: true,
      opacity: 0.7,
    });

    const particlePoints = new THREE.Points(particleGeo, particleMat);
    scene.add(particlePoints);

    // 6. Smooth Mouse Parallax Interaction
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

      // Smooth Lerp Interpolation
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      // Group Tilt Parallax
      mainGroup.rotation.y = elapsedTime * 0.08 + mouseX * 0.28;
      mainGroup.rotation.x = Math.sin(elapsedTime * 0.05) * 0.08 - mouseY * 0.18;

      // Coins Bobbing & Spin
      coins.forEach((coin, idx) => {
        coin.rotation.y += 0.015 * (idx % 2 === 0 ? 1 : -1);
        coin.position.y += Math.sin(elapsedTime * 1.5 + idx) * 0.0015;
      });

      // Share Document Float
      docGroup.position.y = 0.1 + Math.sin(elapsedTime * 1.2) * 0.08;
      docGroup.rotation.z = 0.08 + Math.cos(elapsedTime * 0.8) * 0.03;

      // Wealth Torus Rings
      torusRing.rotation.z += 0.003;
      innerTorusRing.rotation.z -= 0.005;

      // Ambient Dust Drift
      particlePoints.rotation.y = elapsedTime * 0.02;

      renderer.render(scene, camera);
    };

    animate();

    // 8. Responsive Resize Handler
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

      coinGeo.dispose();
      docGeo.dispose();
      sealGeo.dispose();
      stampGeo.dispose();
      torusGeo.dispose();
      innerTorusGeo.dispose();
      particleGeo.dispose();

      bseNseTexture.dispose();
      coinTextures.forEach((t) => t.dispose());

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
        <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxHeight: '380px' }}>
          <circle cx="200" cy="150" r="110" stroke="#D4AF37" strokeWidth="2" strokeDasharray="6 6" />
          <circle cx="200" cy="150" r="80" stroke="#9E241D" strokeWidth="3" />
          <rect x="140" y="100" width="120" height="100" rx="8" fill="#FDFBF7" stroke="#D4AF37" strokeWidth="2" />
          <rect x="160" y="120" width="80" height="10" rx="3" fill="#9E241D" />
          <rect x="160" y="140" width="60" height="6" rx="2" fill="#64748B" />
          <circle cx="200" cy="170" r="12" fill="#D4AF37" />
        </svg>
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
