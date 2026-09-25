import React, { useEffect, useState } from 'react';

const CursorGlow = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event) => {
      setMousePos({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      className="pointer-events-none fixed left-0 top-0 z-[9998] rounded-full blur-3xl"
      style={{
        width: '700px',
        height: '700px',
        transform: `translate(${mousePos.x - 350}px, ${mousePos.y - 350}px)`,
        background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, rgba(96,165,250,0.08) 35%, rgba(15,23,42,0) 70%)',
      }}
    />
  );
};

export default CursorGlow;
