import React, { useRef, useState, useEffect } from "react";
import { useReducedMotion } from "../../../hooks/website/useReducedMotion";

export const Tilt3DCard = ({
  children,
  className = "",
  maxTilt = 10,
  scale = 1.02,
  perspective = 1000,
  style = {},
  disabled = false,
}) => {
  const cardRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [tiltStyle, setTiltStyle] = useState({});
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const isTouch =
      window.matchMedia("(hover: none)").matches || window.innerWidth <= 768;
    setIsTouchDevice(isTouch);
  }, []);

  const shouldDisable = disabled || reducedMotion || isTouchDevice;

  const handleMouseMove = (e) => {
    if (shouldDisable || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const centerX = width / 2;
    const centerY = height / 2;

    const rotateX = ((mouseY - centerY) / centerY) * -maxTilt;
    const rotateY = ((mouseX - centerX) / centerX) * maxTilt;

    const shadowX = ((mouseX - centerX) / centerX) * -12;
    const shadowY = ((mouseY - centerY) / centerY) * 12 + 10;

    setTiltStyle({
      transform: `perspective(${perspective}px) rotateX(${rotateX.toFixed(
        2
      )}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`,
      boxShadow: `${shadowX.toFixed(1)}px ${shadowY.toFixed(
        1
      )}px 24px rgba(139, 35, 29, 0.14)`,
      transition: "transform 0.08s ease-out, box-shadow 0.08s ease-out",
    });
  };

  const handleMouseEnter = () => {
    if (shouldDisable) return;
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (shouldDisable) return;
    setIsHovered(false);
    setTiltStyle({
      transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
      transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease",
    });
  };

  return (
    <div
      ref={cardRef}
      className={`tilt-3d-card-wrapper ${isHovered ? "is-hovered" : ""} ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: "preserve-3d",
        willChange: "transform",
        ...tiltStyle,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export default Tilt3DCard;
