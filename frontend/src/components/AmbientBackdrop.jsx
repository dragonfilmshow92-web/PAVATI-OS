import React, { useEffect, useRef } from 'react';

/**
 * AmbientBackdrop.jsx
 * High-performance hardware-accelerated Canvas particle & aurora ambient glow.
 * Built strictly according to the ui-ux-design and webgl-creative skill guidelines:
 * - Fluid celestial particle nodes with soft velocity drift
 * - Deep multi-layered Aurora radial blooms (Electric Indigo, Cyber Emerald, Aurora Violet)
 * - Gentle mouse aura and responsive particle repulsion
 * - Zero CPU waste: halts rendering if window tab is hidden
 */
export default function AmbientBackdrop() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Mouse coordinates for gentle interactive aura
    const mouse = { x: -1000, y: -1000, radius: 140 };
    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // 48 Ambient light nodes in Indigo, Cyan, Emerald, and Violet
    const colors = [
      'rgba(99, 102, 241, 0.45)', // Electric Indigo
      'rgba(56, 189, 248, 0.40)', // Electric Cyan
      'rgba(16, 185, 129, 0.38)', // Cyber Emerald
      'rgba(139, 92, 246, 0.42)'  // Aurora Violet
    ];

    const particles = Array.from({ length: 46 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      baseRadius: Math.random() * 2.2 + 1.2,
      radius: Math.random() * 2.2 + 1.2,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));

    let isVisible = true;
    const handleVisibility = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const render = () => {
      if (!isVisible) {
        animId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Deep atmospheric ambient radial gradients
      const grad1 = ctx.createRadialGradient(width * 0.15, height * 0.2, 20, width * 0.15, height * 0.2, 500);
      grad1.addColorStop(0, 'rgba(99, 102, 241, 0.16)');
      grad1.addColorStop(1, 'rgba(99, 102, 241, 0)');
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      const grad2 = ctx.createRadialGradient(width * 0.85, height * 0.75, 20, width * 0.85, height * 0.75, 550);
      grad2.addColorStop(0, 'rgba(16, 185, 129, 0.14)');
      grad2.addColorStop(1, 'rgba(16, 185, 129, 0)');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      const grad3 = ctx.createRadialGradient(width * 0.5, height * 0.5, 20, width * 0.5, height * 0.5, 420);
      grad3.addColorStop(0, 'rgba(139, 92, 246, 0.12)');
      grad3.addColorStop(1, 'rgba(139, 92, 246, 0)');
      ctx.fillStyle = grad3;
      ctx.fillRect(0, 0, width, height);

      // Gentle interactive cursor glow
      if (mouse.x > 0 && mouse.y > 0) {
        const mouseGlow = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 160);
        mouseGlow.addColorStop(0, 'rgba(99, 102, 241, 0.20)');
        mouseGlow.addColorStop(1, 'rgba(99, 102, 241, 0)');
        ctx.fillStyle = mouseGlow;
        ctx.fillRect(0, 0, width, height);
      }

      // Draw subtle constellation web between close particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.16 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Update and draw particles with gentle mouse repulsion
      particles.forEach(p => {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius && dist > 0) {
          const force = (mouse.radius - dist) / mouse.radius;
          p.x -= (dx / dist) * force * 1.8;
          p.y -= (dy / dist) * force * 1.8;
        }

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.shadowBlur = 0; // reset
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="ambient-canvas-background"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.85
      }}
    />
  );
}
