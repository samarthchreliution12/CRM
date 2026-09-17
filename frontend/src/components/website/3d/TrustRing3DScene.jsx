import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useReducedMotion } from "../../../hooks/website/useReducedMotion";
import { useWebGLSupport } from "../../../hooks/website/useWebGLSupport";

export const TrustRing3DScene = () => {
  const containerRef = useRef(null);
  const isWebGLSupported = useWebGLSupport();
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (!isWebGLSupported || prefersReduced || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 6.5);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xfff5e6, 2.5);
    mainLight.position.set(4, 5, 5);
    scene.add(mainLight);

    const accentLight = new THREE.PointLight(0x9e241d, 2.2, 10);
    accentLight.position.set(-3, -2, 3);
    scene.add(accentLight);

    // Materials
    const goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.88,
      roughness: 0.22,
    });

    const crimsonMaterial = new THREE.MeshStandardMaterial({
      color: 0x9e241d,
      metalness: 0.75,
      roughness: 0.28,
    });

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.1,
      roughness: 0.15,
      transmission: 0.7,
      transparent: true,
      opacity: 0.85,
    });

    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // Ring 1: TRUST (Outer Gold Ring)
    const ring1Geo = new THREE.TorusGeometry(1.8, 0.05, 16, 90);
    const ring1 = new THREE.Mesh(ring1Geo, goldMaterial);
    ring1.rotation.x = Math.PI / 3;
    mainGroup.add(ring1);

    // Ring 2: INTEGRITY (Crimson Ring)
    const ring2Geo = new THREE.TorusGeometry(1.4, 0.04, 16, 80);
    const ring2 = new THREE.Mesh(ring2Geo, crimsonMaterial);
    ring2.rotation.y = Math.PI / 4;
    mainGroup.add(ring2);

    // Ring 3: EXPERIENCE (Glass Ring)
    const ring3Geo = new THREE.TorusGeometry(1.0, 0.03, 16, 70);
    const ring3 = new THREE.Mesh(ring3Geo, glassMaterial);
    ring3.rotation.x = -Math.PI / 4;
    mainGroup.add(ring3);

    // Center Emblem: LONG-TERM RELATIONSHIP (Gold Octahedron Core)
    const coreGeo = new THREE.OctahedronGeometry(0.4, 0);
    const coreMesh = new THREE.Mesh(coreGeo, goldMaterial);
    mainGroup.add(coreMesh);

    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Multi-axis elegant slow rotation
      ring1.rotation.z = time * 0.12;
      ring2.rotation.x = time * 0.15;
      ring3.rotation.y = time * 0.18;
      coreMesh.rotation.y = time * 0.25;

      mainGroup.rotation.y = Math.sin(time * 0.1) * 0.15;

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
      window.removeEventListener("resize", handleResize);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }

      ring1Geo.dispose();
      ring2Geo.dispose();
      ring3Geo.dispose();
      coreGeo.dispose();
      goldMaterial.dispose();
      crimsonMaterial.dispose();
      glassMaterial.dispose();
      renderer.dispose();
    };
  }, [isWebGLSupported, prefersReduced]);

  if (!isWebGLSupported || prefersReduced) return null;

  return (
    <div
      ref={containerRef}
      className="trust-ring-3d-container"
      style={{ width: "100%", height: "350px", position: "relative" }}
    />
  );
};

export default TrustRing3DScene;
