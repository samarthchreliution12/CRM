import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useReducedMotion } from "../../../hooks/website/useReducedMotion";
import { useWebGLSupport } from "../../../hooks/website/useWebGLSupport";

const DEFAULT_STEPS = [
  { title: "LOST INVESTMENT", desc: "Unclaimed dividends, physical share certificates, forgotten accounts" },
  { title: "DOCUMENTATION", desc: "IEPF verification, legal affidavits, signature validation" },
  { title: "RECOVERY PROCESS", desc: "Liaison with RTA, company registrar, and IEPF authority" },
  { title: "SECURED WEALTH", desc: "Dematerialization into your active demat account safely" },
];

export const Recovery3DScene = ({ steps = DEFAULT_STEPS }) => {
  const containerRef = useRef(null);
  const isWebGLSupported = useWebGLSupport();
  const prefersReduced = useReducedMotion();
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const displaySteps = Array.isArray(steps) && steps.length > 0 ? steps : DEFAULT_STEPS;

  useEffect(() => {
    if (!isWebGLSupported || prefersReduced || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 450;
    const height = container.clientHeight || 450;

    // 1. Scene & Camera Setup (Clean Light Perspective)
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(0, 0, 7.2);

    // 2. WebGL Renderer (Bright, Anti-Aliased, Off-White Tone)
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);

    // 3. Clean Light Studio Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.2);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 3.0);
    mainLight.position.set(5, 7, 5);
    scene.add(mainLight);

    const goldPoint = new THREE.PointLight(0xfff5d6, 2.2, 12);
    goldPoint.position.set(-3, 3, 4);
    scene.add(goldPoint);

    const fillLight = new THREE.DirectionalLight(0xfffdfa, 1.8);
    fillLight.position.set(-4, -4, 3);
    scene.add(fillLight);

    // 4. Bright Premium Materials (White, Light Gold & Light Warm Rose Accent)
    const brightWhitePaper = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.05,
      roughness: 0.12,
    });

    const warmIvoryBase = new THREE.MeshStandardMaterial({
      color: 0xfdfbf7,
      metalness: 0.08,
      roughness: 0.15,
    });

    const polishedGold = new THREE.MeshStandardMaterial({
      color: 0xfde047,
      metalness: 0.92,
      roughness: 0.12,
    });

    const subtleGold = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.85,
      roughness: 0.18,
    });

    const lightRoseAccent = new THREE.MeshStandardMaterial({
      color: 0xd97771,
      metalness: 0.35,
      roughness: 0.2,
    });

    const crystalGlass = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.02,
      roughness: 0.05,
      transmission: 0.95,
      transparent: true,
      opacity: 0.95,
      thickness: 0.2,
    });

    // Texture 1: NSE Certificate Texture for Card 1
    const createNseTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 680;
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, 512, 680);

      // Soft Rose & Gold Double Frame
      ctx.lineWidth = 14;
      ctx.strokeStyle = "#d97771";
      ctx.strokeRect(20, 20, 472, 640);

      ctx.lineWidth = 6;
      ctx.strokeStyle = "#d4af37";
      ctx.strokeRect(36, 36, 440, 608);

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Top Header
      ctx.font = "800 32px 'Segoe UI', Arial, sans-serif";
      ctx.fillStyle = "#b8860b";
      ctx.fillText("NATIONAL STOCK EXCHANGE", 256, 85);

      // Gold Separator
      ctx.beginPath();
      ctx.moveTo(60, 120);
      ctx.lineTo(452, 120);
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#d4af37";
      ctx.stroke();

      // Bold NSE Emblem
      ctx.font = "900 135px 'Segoe UI', Arial, sans-serif";
      ctx.fillStyle = "#d97771";
      ctx.fillText("NSE", 256, 260);

      // Subtitle
      ctx.font = "800 28px 'Segoe UI', Arial, sans-serif";
      ctx.fillStyle = "#475569";
      ctx.fillText("REGISTERED SHARES", 256, 370);

      // Document Lines
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 3;
      for (let y = 430; y <= 540; y += 35) {
        ctx.beginPath();
        ctx.moveTo(80, y);
        ctx.lineTo(432, y);
        ctx.stroke();
      }

      // Verification Badge Footer
      ctx.font = "800 24px 'Segoe UI', Arial, sans-serif";
      ctx.fillStyle = "#b8860b";
      ctx.fillText("PARSHWA CONSULTANCY", 256, 610);

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
      return texture;
    };

    // Texture 2: BSE Certificate Texture for Card 2
    const createBseTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 680;
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "#FDFBF7";
      ctx.fillRect(0, 0, 512, 680);

      // Gold & Soft Rose Double Frame
      ctx.lineWidth = 14;
      ctx.strokeStyle = "#d4af37";
      ctx.strokeRect(20, 20, 472, 640);

      ctx.lineWidth = 6;
      ctx.strokeStyle = "#d97771";
      ctx.strokeRect(36, 36, 440, 608);

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Top Header
      ctx.font = "800 32px 'Segoe UI', Arial, sans-serif";
      ctx.fillStyle = "#d97771";
      ctx.fillText("BOMBAY STOCK EXCHANGE", 256, 85);

      // Gold Separator
      ctx.beginPath();
      ctx.moveTo(60, 120);
      ctx.lineTo(452, 120);
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#d97771";
      ctx.stroke();

      // Bold BSE Emblem
      ctx.font = "900 135px 'Segoe UI', Arial, sans-serif";
      ctx.fillStyle = "#b8860b";
      ctx.fillText("BSE", 256, 260);

      // Subtitle
      ctx.font = "800 28px 'Segoe UI', Arial, sans-serif";
      ctx.fillStyle = "#475569";
      ctx.fillText("DEMAT RECOVERY VAULT", 256, 370);

      // Document Lines
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 3;
      for (let y = 430; y <= 540; y += 35) {
        ctx.beginPath();
        ctx.moveTo(80, y);
        ctx.lineTo(432, y);
        ctx.stroke();
      }

      // Verification Badge Footer
      ctx.font = "800 24px 'Segoe UI', Arial, sans-serif";
      ctx.fillStyle = "#d97771";
      ctx.fillText("PARSHWA CONSULTANCY", 256, 610);

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
      return texture;
    };

    const nseTex = createNseTexture();
    const bseTex = createBseTexture();

    const nseFrontMat = new THREE.MeshStandardMaterial({
      map: nseTex,
      roughness: 0.15,
      metalness: 0.05,
    });

    const bseFrontMat = new THREE.MeshStandardMaterial({
      map: bseTex,
      roughness: 0.15,
      metalness: 0.05,
    });

    // 5. Object Positions: Transitioning from Scattered -> Organized Alignment
    const scatteredPositions = [
      { x: -1.7, y: 1.4, z: -0.3, rx: 0.35, ry: -0.45, rz: 0.15 },
      { x: 1.7, y: 1.3, z: 0.2, rx: -0.25, ry: 0.5, rz: -0.15 },
      { x: -1.5, y: -1.3, z: 0.3, rx: 0.4, ry: 0.25, rz: -0.3 },
      { x: 1.6, y: -1.2, z: -0.4, rx: -0.3, ry: -0.45, rz: 0.25 },
    ];

    const organizedPositions = [
      { x: -0.6, y: 0.6, z: 0.3, rx: 0.08, ry: -0.08, rz: 0.04 },
      { x: 0.6, y: 0.6, z: 0.1, rx: 0.06, ry: -0.06, rz: -0.04 },
      { x: -0.6, y: -0.6, z: -0.1, rx: -0.04, ry: 0.04, rz: 0.02 },
      { x: 0.6, y: -0.6, z: -0.3, rx: -0.06, ry: 0.06, rz: -0.02 },
    ];

    const stockObjects = [];

    // OBJECT 1: NSE Share Certificate Card (Card 1)
    const createPhysicalShareMesh = () => {
      const group = new THREE.Group();

      // Card Geometry with 6 materials: side materials + nseFrontMat on front (+Z) and back (-Z)
      const docGeo = new THREE.BoxGeometry(1.4, 1.8, 0.06);
      const materials = [
        brightWhitePaper,
        brightWhitePaper,
        brightWhitePaper,
        brightWhitePaper,
        nseFrontMat,
        nseFrontMat,
      ];
      const docMesh = new THREE.Mesh(docGeo, materials);
      group.add(docMesh);

      // 3D Outer Gold Rail Border Frame
      const topRailGeo = new THREE.BoxGeometry(1.24, 0.04, 0.08);
      const topRail = new THREE.Mesh(topRailGeo, polishedGold);
      topRail.position.set(0, 0.76, 0.01);
      group.add(topRail);

      const bottomRail = new THREE.Mesh(topRailGeo, polishedGold);
      bottomRail.position.set(0, -0.76, 0.01);
      group.add(bottomRail);

      const sideRailGeo = new THREE.BoxGeometry(0.04, 1.48, 0.08);
      const leftRail = new THREE.Mesh(sideRailGeo, polishedGold);
      leftRail.position.set(-0.58, 0, 0.01);
      group.add(leftRail);

      const rightRail = new THREE.Mesh(sideRailGeo, polishedGold);
      rightRail.position.set(0.58, 0, 0.01);
      group.add(rightRail);

      // 3D Official Wax Seal Emblem at bottom right corner
      const sealGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.08, 24);
      const sealMesh = new THREE.Mesh(sealGeo, polishedGold);
      sealMesh.rotation.x = Math.PI / 2;
      sealMesh.position.set(0.35, -0.5, 0.035);
      group.add(sealMesh);

      const sealCoreGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.09, 20);
      const sealCore = new THREE.Mesh(sealCoreGeo, lightRoseAccent);
      sealCore.rotation.x = Math.PI / 2;
      sealCore.position.set(0.35, -0.5, 0.04);
      group.add(sealCore);

      return group;
    };

    // OBJECT 2: BSE Share Certificate Card (Card 2)
    const createDematPortfolioMesh = () => {
      const group = new THREE.Group();

      // Card Geometry with 6 materials: side materials + bseFrontMat on front (+Z) and back (-Z)
      const cardGeo = new THREE.BoxGeometry(1.4, 1.8, 0.06);
      const materials = [
        warmIvoryBase,
        warmIvoryBase,
        warmIvoryBase,
        warmIvoryBase,
        bseFrontMat,
        bseFrontMat,
      ];
      const cardMesh = new THREE.Mesh(cardGeo, materials);
      group.add(cardMesh);

      // 3D Outer Light Rose Rail Border
      const topRailGeo = new THREE.BoxGeometry(1.24, 0.04, 0.08);
      const topRail = new THREE.Mesh(topRailGeo, lightRoseAccent);
      topRail.position.set(0, 0.76, 0.01);
      group.add(topRail);

      const bottomRail = new THREE.Mesh(topRailGeo, lightRoseAccent);
      bottomRail.position.set(0, -0.76, 0.01);
      group.add(bottomRail);

      const sideRailGeo = new THREE.BoxGeometry(0.04, 1.48, 0.08);
      const leftRail = new THREE.Mesh(sideRailGeo, lightRoseAccent);
      leftRail.position.set(-0.58, 0, 0.01);
      group.add(leftRail);

      const rightRail = new THREE.Mesh(sideRailGeo, lightRoseAccent);
      rightRail.position.set(0.58, 0, 0.01);
      group.add(rightRail);

      // Polished 3D Magnifying Verification Lens
      const lensRimGeo = new THREE.TorusGeometry(0.42, 0.035, 16, 50);
      const lensRim = new THREE.Mesh(lensRimGeo, polishedGold);
      lensRim.position.set(0.12, -0.15, 0.09);
      group.add(lensRim);

      const glassLensGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.02, 32);
      const glassLens = new THREE.Mesh(glassLensGeo, crystalGlass);
      glassLens.rotation.x = Math.PI / 2;
      glassLens.position.set(0.12, -0.15, 0.09);
      group.add(glassLens);

      const handleGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.75, 16);
      const handleMesh = new THREE.Mesh(handleGeo, lightRoseAccent);
      handleMesh.rotation.z = -Math.PI / 4;
      handleMesh.position.set(-0.22, -0.48, 0.09);
      group.add(handleMesh);

      return group;
    };

    // OBJECT 3: Stock Market Growth Bars & Upward Arrow (Stock Market & Growth)
    const createStockGrowthChartMesh = () => {
      const group = new THREE.Group();
      const heights = [0.55, 0.95, 1.45];
      heights.forEach((h, i) => {
        const barGeo = new THREE.BoxGeometry(0.26, h, 0.26);
        const barMat = i === 2 ? polishedGold : i === 1 ? subtleGold : lightRoseAccent;
        const bar = new THREE.Mesh(barGeo, barMat);
        bar.position.set((i - 1) * 0.35, h / 2 - 0.75, 0);
        group.add(bar);
      });

      // Upward Stock Market Arrow
      const arrowShaftGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.6, 16);
      const arrowShaft = new THREE.Mesh(arrowShaftGeo, polishedGold);
      arrowShaft.rotation.z = -Math.PI / 3.8;
      arrowShaft.position.set(0, 0.15, 0.18);
      group.add(arrowShaft);

      const arrowHeadGeo = new THREE.ConeGeometry(0.12, 0.25, 16);
      const arrowHead = new THREE.Mesh(arrowHeadGeo, polishedGold);
      arrowHead.rotation.z = -Math.PI / 3.8;
      arrowHead.position.set(0.62, 0.62, 0.18);
      group.add(arrowHead);

      return group;
    };

    // OBJECT 4: Gold Coin Stack & Secured Vault Seal (Investment Recovery & Wealth)
    const createGoldCoinsVaultMesh = () => {
      const group = new THREE.Group();
      // Stack of 3 Shiny Gold Coins
      for (let c = 0; c < 3; c++) {
        const coinGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.1, 36);
        const coinMesh = new THREE.Mesh(coinGeo, polishedGold);
        coinMesh.position.set(-0.2, -0.5 + c * 0.12, 0);
        group.add(coinMesh);

        const coinRimGeo = new THREE.TorusGeometry(0.65, 0.035, 16, 40);
        const coinRim = new THREE.Mesh(coinRimGeo, subtleGold);
        coinRim.position.set(-0.2, -0.5 + c * 0.12, 0.05);
        group.add(coinRim);
      }

      // Elegant Secured Financial Emblem
      const shieldGeo = new THREE.IcosahedronGeometry(0.65, 1);
      const shieldMesh = new THREE.Mesh(shieldGeo, polishedGold);
      shieldMesh.position.set(0.2, 0.3, 0);
      group.add(shieldMesh);

      const ringGeo = new THREE.TorusGeometry(0.9, 0.035, 16, 50);
      const ringMesh = new THREE.Mesh(ringGeo, lightRoseAccent);
      ringMesh.rotation.x = Math.PI / 3;
      ringMesh.position.set(0.2, 0.3, 0);
      group.add(ringMesh);

      return group;
    };

    const builders = [
      createPhysicalShareMesh,
      createDematPortfolioMesh,
      createStockGrowthChartMesh,
      createGoldCoinsVaultMesh,
    ];

    scatteredPositions.forEach((pos, idx) => {
      const group = builders[idx]();
      group.position.set(pos.x, pos.y, pos.z);
      group.rotation.set(pos.rx, pos.ry, pos.rz);
      scene.add(group);

      stockObjects.push({
        group,
        scattered: pos,
        organized: organizedPositions[idx],
      });
    });

    // Elegant Light Background Wealth Halo Ring
    const centerRingGeo = new THREE.TorusGeometry(2.15, 0.035, 16, 90);
    const centerRing = new THREE.Mesh(centerRingGeo, polishedGold);
    centerRing.rotation.x = Math.PI / 3.2;
    scene.add(centerRing);

    // 6. Mouse Parallax & Scroll Interpolation
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      targetMouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 1.5;
      targetMouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 1.5;
    };

    container.addEventListener("mousemove", handleMouseMove, { passive: true });

    let scrollProgress = 0;
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      const totalDistance = windowHeight + rect.height;
      const currentPos = windowHeight - rect.top;
      const rawProgress = Math.max(0, Math.min(1, currentPos / totalDistance));

      scrollProgress = rawProgress;
      const stepIdx = Math.min(displaySteps.length - 1, Math.floor(rawProgress * displaySteps.length));
      setActiveStepIndex(stepIdx);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    let animationFrameId;
    let clock = new THREE.Clock();

    // 7. Smooth Animation Loop
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Smooth mouse lerp
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      // Lerp positions from scattered to organized
      stockObjects.forEach((obj, i) => {
        const p = scrollProgress;
        const targetX = THREE.MathUtils.lerp(obj.scattered.x, obj.organized.x, p);
        const targetY = THREE.MathUtils.lerp(obj.scattered.y, obj.organized.y, p);
        const targetZ = THREE.MathUtils.lerp(obj.scattered.z, obj.organized.z, p);

        const targetRx = THREE.MathUtils.lerp(obj.scattered.rx, obj.organized.rx, p);
        const targetRy = THREE.MathUtils.lerp(obj.scattered.ry, obj.organized.ry, p);
        const targetRz = THREE.MathUtils.lerp(obj.scattered.rz, obj.organized.rz, p);

        // Gentle floating bobbing
        const floatY = Math.sin(time * 1.4 + i) * 0.08;
        const floatRot = Math.cos(time * 1.1 + i) * 0.04;

        obj.group.position.set(targetX + mouseX * 0.15, targetY + floatY - mouseY * 0.1, targetZ);
        obj.group.rotation.set(targetRx + floatRot + mouseY * 0.1, targetRy + time * 0.12 + mouseX * 0.15, targetRz);
      });

      centerRing.rotation.z = time * 0.08;
      centerRing.rotation.x = Math.PI / 3.2 + Math.sin(time * 0.4) * 0.06;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }

      centerRingGeo.dispose();
      nseTex.dispose();
      bseTex.dispose();
      nseFrontMat.dispose();
      bseFrontMat.dispose();

      brightWhitePaper.dispose();
      warmIvoryBase.dispose();
      polishedGold.dispose();
      subtleGold.dispose();
      lightRoseAccent.dispose();
      crystalGlass.dispose();
      renderer.dispose();
    };
  }, [isWebGLSupported, prefersReduced, displaySteps]);

  // Clean vector SVG fallback for WebGL disabled or SSG pre-rendering
  if (!isWebGLSupported || prefersReduced) {
    return (
      <div className="recovery-3d-wrapper">
        <div className="recovery-3d-fallback-clean">
          <svg viewBox="0 0 400 360" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxHeight: '380px' }}>
            {/* Background Halo Ring */}
            <circle cx="200" cy="180" r="140" stroke="#FDE047" strokeWidth="2" strokeDasharray="6 6" opacity="0.6" />
            <circle cx="200" cy="180" r="100" stroke="#D97771" strokeWidth="2" opacity="0.3" />

            {/* 1. NSE Share Certificate */}
            <g transform="translate(50, 60)">
              <rect x="0" y="0" width="105" height="135" rx="6" fill="#FFFFFF" stroke="#D4AF37" strokeWidth="2" />
              <rect x="8" y="12" width="89" height="18" rx="3" fill="#D97771" />
              <text x="52" y="25" fontSize="12" fontWeight="900" fill="#FFFFFF" textAnchor="middle">NSE</text>
              <rect x="12" y="42" width="80" height="5" rx="2" fill="#94A3B8" />
              <rect x="12" y="54" width="70" height="5" rx="2" fill="#CBD5E1" />
              <rect x="12" y="66" width="75" height="5" rx="2" fill="#CBD5E1" />
              <circle cx="80" cy="100" r="12" fill="#FDE047" />
            </g>

            {/* 2. BSE Share Certificate */}
            <g transform="translate(180, 50)">
              <rect x="0" y="0" width="105" height="135" rx="6" fill="#FDFBF7" stroke="#D97771" strokeWidth="2" />
              <rect x="8" y="12" width="89" height="18" rx="3" fill="#D4AF37" />
              <text x="52" y="25" fontSize="12" fontWeight="900" fill="#FFFFFF" textAnchor="middle">BSE</text>
              <rect x="12" y="42" width="80" height="5" rx="2" fill="#94A3B8" />
              <rect x="12" y="54" width="70" height="5" rx="2" fill="#CBD5E1" />
              <rect x="12" y="66" width="75" height="5" rx="2" fill="#CBD5E1" />
              <circle cx="80" cy="100" r="12" fill="#D97771" />
            </g>

            {/* 3. Stock Growth Bars & Upward Arrow */}
            <g transform="translate(240, 180)">
              <rect x="0" y="70" width="18" height="40" rx="3" fill="#D97771" />
              <rect x="26" y="45" width="18" height="65" rx="3" fill="#D4AF37" />
              <rect x="52" y="20" width="18" height="90" rx="3" fill="#FDE047" />
              {/* Upward Stock Arrow */}
              <path d="M-10 80L65 10" stroke="#FDE047" strokeWidth="4" strokeLinecap="round" />
              <path d="M65 10L48 12M65 10L63 27" stroke="#FDE047" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            </g>

            {/* 4. Gold Coins Stack & Magnifying Lens */}
            <g transform="translate(100, 220)">
              <ellipse cx="40" cy="40" rx="28" ry="10" fill="#FDE047" stroke="#D4AF37" strokeWidth="1" />
              <ellipse cx="40" cy="32" rx="28" ry="10" fill="#FDE047" stroke="#D4AF37" strokeWidth="1" />
              <ellipse cx="40" cy="24" rx="28" ry="10" fill="#FDE047" stroke="#D4AF37" strokeWidth="1" />
              {/* Lens */}
              <circle cx="90" cy="20" r="22" stroke="#D4AF37" strokeWidth="4" fill="none" />
              <line x1="75" y1="35" x2="55" y2="55" stroke="#D97771" strokeWidth="5" strokeLinecap="round" />
            </g>
          </svg>
        </div>

        {/* Step Indicator */}
        <div className="recovery-step-indicator">
          {displaySteps.map((s, idx) => (
            <div key={idx} className={`recovery-step-item ${idx === 0 ? "active" : ""}`}>
              <div className="step-badge">{idx + 1}</div>
              <div className="step-content">
                <span className="step-title">{s.title}</span>
                <span className="step-desc">{s.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="recovery-3d-wrapper">
      <div ref={containerRef} className="recovery-3d-canvas" />

      {/* Interactive Storytelling Step Bar */}
      <div className="recovery-step-indicator">
        {displaySteps.map((s, idx) => {
          const isActive = idx === activeStepIndex;
          const isPassed = idx < activeStepIndex;
          return (
            <div
              key={idx}
              className={`recovery-step-item ${isActive ? "active" : ""} ${isPassed ? "passed" : ""}`}
            >
              <div className="step-badge">{idx + 1}</div>
              <div className="step-content">
                <span className="step-title">{s.title}</span>
                <span className="step-desc">{s.desc}</span>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .recovery-3d-wrapper {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          align-items: center;
          width: 100%;
          min-height: 440px;
        }

        .recovery-3d-canvas {
          width: 100%;
          height: 100%;
          min-height: 400px;
        }

        .recovery-3d-fallback-clean {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        .recovery-step-indicator {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .recovery-step-item {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1rem 1.25rem;
          background-color: var(--color-white, #ffffff);
          border: 1px solid var(--color-border, #e2e2df);
          border-radius: var(--radius-md, 8px);
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .recovery-step-item.active {
          border-color: var(--color-primary, #9e241d);
          box-shadow: 0 8px 24px rgba(158, 36, 29, 0.12);
          transform: translateX(8px);
        }

        .recovery-step-item.passed {
          background-color: rgba(158, 36, 29, 0.03);
        }

        .step-badge {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: var(--color-light, #f7f7f5);
          color: var(--color-secondary, #64748b);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.9rem;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }

        .recovery-step-item.active .step-badge {
          background-color: var(--color-primary, #9e241d);
          color: #ffffff;
        }

        .recovery-step-item.passed .step-badge {
          background-color: #d4af37;
          color: #ffffff;
        }

        .step-title {
          display: block;
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--color-dark, #0f172a);
          margin-bottom: 2px;
        }

        .step-desc {
          display: block;
          font-size: 0.85rem;
          color: var(--color-secondary, #64748b);
          line-height: 1.4;
        }

        @media (max-width: 992px) {
          .recovery-3d-wrapper {
            grid-template-columns: 1fr;
          }
          .recovery-3d-canvas {
            min-height: 320px;
          }
        }
      `}</style>
    </div>
  );
};

export default Recovery3DScene;
