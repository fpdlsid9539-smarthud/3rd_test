import { useEffect, useRef } from "react";
import "./MarketBackground.css";

const MarketBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animId;
    let t = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const { innerWidth: width, innerHeight: height } = window;

      // Set the internal resolution (drawing buffer)
      canvas.width = width * dpr;
      canvas.height = height * dpr;

      // Scale the context so your drawing coordinates (0 to innerWidth) still work
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    // ── Candlestick columns ──────────────────────────────
    const COLS = 64;
    const candles = Array.from({ length: COLS }, (_, i) => ({
      x: (i / COLS) * window.innerWidth,
      phase: Math.random() * Math.PI * 2,
      speed: 0.4 + Math.random() * 0.4,
      amp: 60 + Math.random() * 60,
      base: 0.1 + Math.random() * 0.4,   // vertical position (0–1)
    }));

    // ── Flowing price line ───────────────────────────────
    const LINES = 2;
    const lineSeeds = Array.from({ length: LINES }, (_, i) => ({
      color: i === 0 ? [255, 71, 102] : [71, 117, 255],   // sky-blue / red
      offset: Math.random() * 100,
      opacity: 0.28 + i * 0.1,
      yBase: 0.35 + i * 0.15,
    }));

    // ── Floating ticker particles ────────────────────────
    const PARTICLES = 28;
    const particles = Array.from({ length: PARTICLES }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vy: -(0.2 + Math.random() * 0.5),
      vx: (Math.random() - 0.5) * 0.3,
      size: 1 + Math.random() * 2,
      opacity: 0.25 + Math.random() * 0.3,
      life: Math.random(),
    }));

    // ── Candlesticks ──────────────────────────────────────
    const drawCandles = () => {
      const W = window.innerWidth, H = window.innerHeight;
      const colW = W / COLS;

      candles.forEach((c) => {
        const wickOscillation = Math.sin(t * (c.speed * 0.2) + c.phase);
        const wickVariation = (wickOscillation + 1) * 40;
        const cy = c.base * H + Math.sin(t * c.speed + c.phase) * c.amp;
        const bodyH = 8 + Math.abs(Math.sin(t * c.speed * 1.5 + c.phase)) * 50;
        const open = cy - bodyH / 1;
        const close = cy + bodyH / 1;
        const high = open - (10 + wickVariation);
        const low = close + (10 + wickVariation);
        const bullish = Math.sin(t * c.speed + c.phase) > 0;
        const col = bullish ? "rgba(71, 117, 255," : "rgba(255,71,102,";
        const alpha = 0.48 + Math.abs(Math.sin(t * 0.3 + c.phase)) * 0.15;

        // wick
        ctx.strokeStyle = col + alpha + ")";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(c.x + colW / 2, high);
        ctx.lineTo(c.x + colW / 2, low);
        ctx.stroke();

        // body
        ctx.fillStyle = col + alpha + ")";
        ctx.fillRect(c.x + colW * 0.2, open, colW * 0.6, bodyH);
      });
    };

    // ── Price lines ───────────────────────────────────────
    const drawLines = () => {
      const W = window.innerWidth, H = window.innerHeight;
      const PTS = 120;

      lineSeeds.forEach(({ color, offset, opacity, yBase }) => {
        ctx.beginPath();
        for (let i = 0; i <= PTS; i++) {
          const px = (i / PTS) * W;
          const py =
            yBase * H +
            Math.sin(t * 0.15 + i * 0.18 + offset) * 55 +
            Math.sin(t * 0.23 + i * 0.09 + offset * 2) * 30 +
            Math.sin(t * 0.11 + i * 0.05) * 20;

          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.strokeStyle = `rgba(${color.join(",")},${opacity})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // glow pass
        ctx.strokeStyle = `rgba(${color.join(",")},${opacity * 0.4})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    };

    // ── Particles ─────────────────────────────────────────
    const drawParticles = () => {
      const W = window.innerWidth, H = window.innerHeight;

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life += 0.003;

        if (p.y < -10 || p.life > 1) {
          p.x = Math.random() * W;
          p.y = H + 10;
          p.life = 0;
        }

        const fade = Math.sin(p.life * Math.PI);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(71,117,255,${p.opacity * fade})`;
        ctx.fill();
      });
    };

    const draw = () => {
      t += 0.012;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawCandles();
      drawLines();
      drawParticles();
      animId = requestAnimationFrame(draw);
    };

    draw();

    const handleScroll = () => {
      canvas.style.transform = `translateY(${88 + window.scrollY * 1.1}px)`;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return <canvas ref={canvasRef} className="market-bg-canvas" />;
};

export default MarketBackground;