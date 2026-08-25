import React, { useState, useRef } from 'react';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  maxTilt?: number; // Maximum tilt angle in degrees
  glareEffect?: boolean;
  scale?: number;
}

export const TiltCard: React.FC<TiltCardProps> = ({
  children,
  className = '',
  onClick,
  maxTilt = 16, // Stronger prestigious 3D tilt
  glareEffect = true,
  scale = 1.04
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({
    transform: 'perspective(1200px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale3d(1, 1, 1)',
    transition: 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.5s ease'
  });
  const [glarePosition, setGlarePosition] = useState<{ x: number; y: number; opacity: number }>({
    x: 50,
    y: 50,
    opacity: 0
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Mouse offset from center (-0.5 to +0.5)
    const mouseX = (e.clientX - rect.left) / width - 0.5;
    const mouseY = (e.clientY - rect.top) / height - 0.5;

    const rotateY = (mouseX * maxTilt * 2.2).toFixed(2);
    const rotateX = (-mouseY * maxTilt * 2.2).toFixed(2);
    const translateZ = 12;

    setTiltStyle({
      transform: `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${translateZ}px) scale3d(${scale}, ${scale}, ${scale})`,
      transition: 'transform 0.08s ease-out, box-shadow 0.15s ease',
      boxShadow: `${-mouseX * 28}px ${-mouseY * 28}px 45px rgba(225, 29, 72, 0.25), 0 25px 50px rgba(0,0,0,0.75)`
    });

    if (glareEffect) {
      setGlarePosition({
        x: ((e.clientX - rect.left) / width) * 100,
        y: ((e.clientY - rect.top) / height) * 100,
        opacity: 0.42
      });
    }
  };

  const handleMouseLeave = () => {
    setTiltStyle({
      transform: 'perspective(1200px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale3d(1, 1, 1)',
      transition: 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.6s ease',
      boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
    });
    setGlarePosition(prev => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={tiltStyle}
      className={`relative will-change-transform transform-gpu ${className}`}
    >
      {children}
      {glareEffect && (
        <div
          className="absolute inset-0 pointer-events-none rounded-[inherit] transition-opacity duration-300 overflow-hidden"
          style={{
            opacity: glarePosition.opacity,
            background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,0.28) 0%, rgba(225,29,72,0.12) 40%, rgba(0,0,0,0) 70%)`
          }}
        />
      )}
    </div>
  );
};
