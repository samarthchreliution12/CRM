import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useReducedMotion } from "../../../hooks/website/useReducedMotion";
import { useWebGLSupport } from "../../../hooks/website/useWebGLSupport";

export const Shield3DScene = () => {
  const containerRef = useRef(null);
  const isWebGLSupported = useWebGLSupport();
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (!isWebGLSupported || prefersReduced || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 300;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5.5);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xfff8ee, 2.2);
    mainLight.position.set(3, 4, 3);
    scene.add(mainLight);

    // Gold & Crimson Materials
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.9,
      roughness: 0.18,
    });

    const crimsonMat = new THREE.MeshStandardMaterial({
      color: 0x9e241d,
      metalness: 0.65,
      roughness: 0.28,
    });

    const group = new THREE.Group();
    scene.add(group);

    // Outer Protective Torus Ring
    const outerRingGeo = new THREE.TorusGeometry(1.65, 0.045, 16, 80);
    const outerRing = new THREE.Mesh(outerRingGeo, goldMat);
    outerRing.rotation.x = Math.PI / 4;
    group.add(outerRing);

    // Inner Protective Ring
    const innerRingGeo = new THREE.TorusGeometry(1.22, 0.035, 16, 60);
    const innerRing = new THREE.Mesh(innerRingGeo, crimsonMat);
    innerRing.rotation.x = -Math.PI / 4;
    group.add(innerRing);

    // Protective Emblem Core Shield
    const coreGeo = new THREE.IcosahedronGeometry(0.38, 1);
    const coreMesh = new THREE.Mesh(coreGeo, goldMat);
    group.add(coreMesh);

    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      outerRing.rotation.z = time * 0.1;
      innerRing.rotation.z = -time * 0.15;
      coreMesh.rotation.y = time * 0.2;

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

      outerRingGeo.dispose();
      innerRingGeo.dispose();
      coreGeo.dispose();
      goldMat.dispose();
      crimsonMat.dispose();
      renderer.dispose();
    };
  }, [isWebGLSupported, prefersReduced]);

  if (!isWebGLSupported || prefersReduced) return null;

  return (
    <div
      ref={containerRef}
      className="cta-shield-3d"
      style={{
        position: "absolute",
        top: "-50px",
        right: "-30px",
        width: "280px",
        height: "280px",
        pointerEvents: "none",
        zIndex: 1,
        opacity: 0.65,
      }}
    />
  );
};

export default Shield3DScene;
