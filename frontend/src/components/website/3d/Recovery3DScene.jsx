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

    // Scene & Camera Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 7.5);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // Bright Soft Lighting (Optimized for Light Theme & Zero Dark Shadows)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
    dirLight.position.set(5, 6, 5);
    scene.add(dirLight);

    const goldPoint = new THREE.PointLight(0xfff3c7, 2.0, 12);
    goldPoint.position.set(-3, 2, 3);
    scene.add(goldPoint);

    const fillLight = new THREE.DirectionalLight(0xfff8ee, 1.5);
    fillLight.position.set(-4, -4, 3);
    scene.add(fillLight);

    // Premium Bright Light-Theme Materials
    const goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xfde047,
      metalness: 0.35,
      roughness: 0.2,
    });

    const darkGoldMaterial = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      metalness: 0.3,
      roughness: 0.22,
    });

    const crimsonMaterial = new THREE.MeshStandardMaterial({
      color: 0x9e241d,
      metalness: 0.3,
      roughness: 0.25,
    });

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.05,
      roughness: 0.1,
      transmission: 0.85,
      transparent: true,
      opacity: 0.94,
      thickness: 0.25,
    });

    // Positions for 4 Stock Market Objects
    const scatteredPositions = [
      { x: -1.8, y: 1.4, z: -0.4, rx: 0.4, ry: -0.5, rz: 0.2 },
      { x: 1.8, y: 1.3, z: 0.2, rx: -0.3, ry: 0.6, rz: -0.2 },
      { x: -1.6, y: -1.3, z: 0.3, rx: 0.5, ry: 0.3, rz: -0.4 },
      { x: 1.7, y: -1.2, z: -0.5, rx: -0.4, ry: -0.5, rz: 0.3 },
    ];

    const organizedPositions = [
      { x: -0.6, y: 0.6, z: 0.3, rx: 0.1, ry: -0.1, rz: 0.05 },
      { x: 0.6, y: 0.6, z: 0.1, rx: 0.08, ry: -0.08, rz: -0.05 },
      { x: -0.6, y: -0.6, z: -0.1, rx: -0.05, ry: 0.05, rz: 0.03 },
      { x: 0.6, y: -0.6, z: -0.3, rx: -0.08, ry: 0.08, rz: -0.03 },
    ];

    const stockObjects = [];

    // Helper Builder 1: Stock Market Growth Bar Chart
    const createStockChartMesh = () => {
      const group = new THREE.Group();
      const heights = [0.5, 0.9, 1.4];
      heights.forEach((h, i) => {
        const barGeo = new THREE.BoxGeometry(0.24, h, 0.24);
        const barMat = i === 2 ? goldMaterial : i === 1 ? darkGoldMaterial : crimsonMaterial;
        const bar = new THREE.Mesh(barGeo, barMat);
        bar.position.set((i - 1) * 0.32, h / 2 - 0.7, 0);
        group.add(bar);
      });
      // Growth Arrow Line
      const lineGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.6, 12);
      const lineMesh = new THREE.Mesh(lineGeo, goldMaterial);
      lineMesh.rotation.z = -Math.PI / 4;
      lineMesh.position.set(0, 0.1, 0.15);
      group.add(lineMesh);
      return group;
    };

    // Helper Builder 2: 3D Gold Investment Coin
    const createGoldCoinMesh = () => {
      const group = new THREE.Group();
      const coinGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.12, 36);
      const coinMesh = new THREE.Mesh(coinGeo, goldMaterial);
      coinMesh.rotation.x = Math.PI / 2;
      group.add(coinMesh);

      // Milled Rim
      const rimGeo = new THREE.TorusGeometry(0.85, 0.05, 16, 40);
      const rimMesh = new THREE.Mesh(rimGeo, darkGoldMaterial);
      group.add(rimMesh);

      // Center Emblem Octahedron Star
      const starGeo = new THREE.OctahedronGeometry(0.3, 0);
      const starMesh = new THREE.Mesh(starGeo, crimsonMaterial);
      starMesh.position.z = 0.08;
      group.add(starMesh);
      return group;
    };

    // Helper Builder 3: 3D Stock Share Certificate Badge
    const createShareBadgeMesh = () => {
      const group = new THREE.Group();
      const panelGeo = new THREE.BoxGeometry(1.3, 1.7, 0.06);
      const panelMesh = new THREE.Mesh(panelGeo, glassMaterial);
      group.add(panelMesh);

      const frameGeo = new THREE.TorusGeometry(0.45, 0.04, 16, 40);
      const frameMesh = new THREE.Mesh(frameGeo, goldMaterial);
      frameMesh.position.set(0, 0.2, 0.04);
      group.add(frameMesh);

      const sealGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.06, 20);
      const sealMesh = new THREE.Mesh(sealGeo, crimsonMaterial);
      sealMesh.rotation.x = Math.PI / 2;
      sealMesh.position.set(0.35, -0.45, 0.04);
      group.add(sealMesh);
      return group;
    };

    // Helper Builder 4: 3D Golden Vault Protection Shield
    const createGoldShieldMesh = () => {
      const group = new THREE.Group();
      const shieldGeo = new THREE.IcosahedronGeometry(0.7, 1);
      const shieldMesh = new THREE.Mesh(shieldGeo, goldMaterial);
      group.add(shieldMesh);

      const ringGeo = new THREE.TorusGeometry(1.0, 0.04, 16, 60);
      const ringMesh = new THREE.Mesh(ringGeo, crimsonMaterial);
      ringMesh.rotation.x = Math.PI / 3;
      group.add(ringMesh);
      return group;
    };

    const builders = [
      createStockChartMesh,
      createGoldCoinMesh,
      createShareBadgeMesh,
      createGoldShieldMesh,
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

    // Central Wealth Growth Ring
    const centerRingGeo = new THREE.TorusGeometry(2.0, 0.05, 16, 90);
    const centerRing = new THREE.Mesh(centerRingGeo, goldMaterial);
    centerRing.rotation.x = Math.PI / 3;
    scene.add(centerRing);

    // Scroll Progress Interpolation
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

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Interpolate stock objects positions based on scrollProgress
      stockObjects.forEach((obj, i) => {
        const p = scrollProgress;
        const targetX = THREE.MathUtils.lerp(obj.scattered.x, obj.organized.x, p);
        const targetY = THREE.MathUtils.lerp(obj.scattered.y, obj.organized.y, p);
        const targetZ = THREE.MathUtils.lerp(obj.scattered.z, obj.organized.z, p);

        const targetRx = THREE.MathUtils.lerp(obj.scattered.rx, obj.organized.rx, p);
        const targetRy = THREE.MathUtils.lerp(obj.scattered.ry, obj.organized.ry, p);
        const targetRz = THREE.MathUtils.lerp(obj.scattered.rz, obj.organized.rz, p);

        // Add floating bobbing motion
        const floatY = Math.sin(time * 1.5 + i) * 0.12;
        const floatRot = Math.cos(time * 1.2 + i) * 0.06;

        obj.group.position.set(targetX, targetY + floatY, targetZ);
        obj.group.rotation.set(targetRx + floatRot, targetRy + time * 0.2, targetRz);
      });

      centerRing.rotation.z = time * 0.12;
      centerRing.rotation.x = Math.PI / 3 + Math.sin(time * 0.5) * 0.1;

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
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }

      centerRingGeo.dispose();
      goldMaterial.dispose();
      darkGoldMaterial.dispose();
      crimsonMaterial.dispose();
      glassMaterial.dispose();
      renderer.dispose();
    };
  }, [isWebGLSupported, prefersReduced, displaySteps]);

  return (
    <div className="recovery-3d-wrapper">
      <div ref={containerRef} className="recovery-3d-canvas" />

      {/* Interactive Storyteller Step Bar */}
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
