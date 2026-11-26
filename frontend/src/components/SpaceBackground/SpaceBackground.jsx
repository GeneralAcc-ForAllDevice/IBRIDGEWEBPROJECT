import React, { useEffect, useRef } from "react";

const SpaceBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let isMobile = width < 768;

    const starCount = isMobile ? 35 : 70;
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      z: Math.random() * 2 + 0.5,
      size: Math.random() * 1.6 + 0.6,
      color: Math.random() > 0.7 ? "#00ff88" : "#38bdf8",
    }));

    const numSegments = isMobile ? 22 : 32;
    const segLength = isMobile ? 12 : 14;
    const segments = Array.from({ length: numSegments }, (_, i) => ({
      x: width / 2 - i * segLength,
      y: height / 2,
      angle: 0,
    }));

    const pointer = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      active: false,
      boost: 0,
    };

    let autoAngle = 0;
    let isPageVisible = true;

    const handlePointerMove = (e) => {
      pointer.targetX = e.clientX;
      pointer.targetY = e.clientY;
      pointer.active = true;
    };

    const handlePointerDown = (e) => {
      pointer.targetX = e.clientX;
      pointer.targetY = e.clientY;
      pointer.active = true;
      pointer.boost = 12;
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      isMobile = width < 768;
      bgGradient = createBgGradient();
    };

    const handleVisibilityChange = () => {
      isPageVisible = !document.hidden;
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const createBgGradient = () => {
      const grad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.35,
        10,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.85
      );
      grad.addColorStop(0, "#07192f");
      grad.addColorStop(1, "#030712");
      return grad;
    };
    let bgGradient = createBgGradient();

    const strokeFastGlow = (lineWidth, glowColor, coreColor) => {
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = lineWidth + 2.5;
      ctx.stroke();

      ctx.strokeStyle = coreColor;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    };

    const drawDragonSkull = (x, y, angle) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      ctx.moveTo(14, -6);
      ctx.bezierCurveTo(28, -28, 45, -18, 56, -34);
      ctx.moveTo(14, 6);
      ctx.bezierCurveTo(28, 28, 45, 18, 56, 34);
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.3;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-6, -8);
      ctx.lineTo(-26, -24);
      ctx.lineTo(-42, -20);
      ctx.moveTo(-22, -20);
      ctx.lineTo(-30, -32);
      ctx.moveTo(-6, 8);
      ctx.lineTo(-26, 24);
      ctx.lineTo(-42, 20);
      ctx.moveTo(-22, 20);
      ctx.lineTo(-30, 32);
      strokeFastGlow(1.9, "rgba(56, 189, 248, 0.3)", "#e2e8f0");

      ctx.beginPath();
      ctx.moveTo(26, 0);
      ctx.lineTo(10, -10);
      ctx.lineTo(-12, -13);
      ctx.lineTo(-18, 0);
      ctx.lineTo(-12, 13);
      ctx.lineTo(10, 10);
      ctx.closePath();
      ctx.fillStyle = "#090d1c";
      ctx.fill();
      strokeFastGlow(2, "rgba(56, 189, 248, 0.4)", "#f8fafc");

      ctx.fillStyle = pointer.boost > 1 ? "#00ff88" : "#38bdf8";
      ctx.beginPath();
      ctx.arc(2, -6, 2.8, 0, Math.PI * 2);
      ctx.arc(2, 6, 2.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const drawSegment = (seg, index) => {
      const progress = index / numSegments;
      const size = (1 - progress * 0.78) * (isMobile ? 11 : 14);

      ctx.save();
      ctx.translate(seg.x, seg.y);
      ctx.rotate(seg.angle);

      const coreWidth = Math.max(1, 2 - progress * 1.2);

      ctx.beginPath();
      ctx.ellipse(0, 0, segLength * 0.45, size * 0.35, 0, 0, Math.PI * 2);
      strokeFastGlow(coreWidth, "rgba(56, 189, 248, 0.22)", "#e2e8f0");

      if (index >= 2 && index <= numSegments - 7) {
        const ribLen = size * 1.65;
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.25);
        ctx.quadraticCurveTo(-4, -ribLen * 0.7, -9, -ribLen);
        ctx.moveTo(0, size * 0.25);
        ctx.quadraticCurveTo(-4, ribLen * 0.7, -9, ribLen);
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = coreWidth;
        ctx.stroke();
      }

      if (index === 6 || index === Math.floor(numSegments * 0.55)) {
        const legLen = size * 2.3;
        ctx.beginPath();
        [-1, 1].forEach((side) => {
          ctx.moveTo(0, side * size * 0.3);
          ctx.lineTo(-10, side * legLen * 0.6);
          ctx.lineTo(-2, side * legLen);
          ctx.lineTo(6, side * (legLen + 6));
          ctx.moveTo(-2, side * legLen);
          ctx.lineTo(2, side * (legLen + 8));
          ctx.moveTo(-2, side * legLen);
          ctx.lineTo(-6, side * (legLen + 6));
        });
        strokeFastGlow(1.5, "rgba(56, 189, 248, 0.28)", "#e2e8f0");
      }

      ctx.restore();
    };

    let animationId;
    const render = (now) => {
      animationId = requestAnimationFrame(render);
      if (!isPageVisible) return;

      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      const parallaxX = (pointer.x - width * 0.5) * 0.03;
      const parallaxY = (pointer.y - height * 0.5) * 0.03;

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.y -= 0.25 * s.z;
        if (s.y < 0) s.y = height;

        const drawX = (s.x - parallaxX * s.z + width) % width;
        const drawY = (s.y - parallaxY * s.z + height) % height;

        ctx.fillStyle = s.color;
        ctx.globalAlpha = 0.25 + s.z * 0.2;
        ctx.fillRect(drawX, drawY, s.size, s.size);
      }
      ctx.globalAlpha = 1;

      if (!pointer.active) {
        autoAngle += 0.022;
        pointer.targetX = width * 0.5 + Math.cos(autoAngle) * (width * 0.28);
        pointer.targetY = height * 0.5 + Math.sin(autoAngle * 2) * (height * 0.18);
      }

      pointer.x += (pointer.targetX - pointer.x) * 0.12;
      pointer.y += (pointer.targetY - pointer.y) * 0.12;
      if (pointer.boost > 0) pointer.boost *= 0.92;

      const head = segments[0]; // <--- အမှန်ပြင်ပြီးသား (segments[0])
      const dx = pointer.x - head.x;
      const dy = pointer.y - head.y;
      const targetAngle = Math.atan2(dy, dx);

      let diff = targetAngle - head.angle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      head.angle += diff * 0.14;

      const dist = Math.hypot(dx, dy);
      const baseSpeed = Math.min(dist * 0.08, isMobile ? 6.5 : 8.5) + pointer.boost;
      if (dist > 4) {
        head.x += Math.cos(head.angle) * baseSpeed;
        head.y += Math.sin(head.angle) * baseSpeed;
      }

      const timeWave = now * 0.008;
      for (let i = 1; i < numSegments; i++) {
        const prev = segments[i - 1];
        const curr = segments[i];
        const angle = Math.atan2(prev.y - curr.y, prev.x - curr.x);
        const wave = Math.sin(timeWave - i * 0.45) * 0.06;

        curr.angle = angle + wave;
        curr.x = prev.x - Math.cos(curr.angle) * segLength;
        curr.y = prev.y - Math.sin(curr.angle) * segLength;
      }

      for (let i = numSegments - 1; i >= 1; i--) {
        drawSegment(segments[i], i);
      }
      drawDragonSkull(head.x, head.y, head.angle);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        willChange: "transform",
      }}
    />
  );
};

export default SpaceBackground;
