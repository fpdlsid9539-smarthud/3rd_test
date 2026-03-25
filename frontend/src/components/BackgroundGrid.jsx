import { useEffect, useRef } from "react";
import "./BackgroundGrid.css";

const BackgroundGrid = () => {
  const gridRef = useRef(null);

  useEffect(() => {
    const canvas = gridRef.current;
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

    // ── Grid ─────────────────────────────────────────────
    const drawGrid = () => {
      const W = canvas.width, H = canvas.height;
      const cols = 12, rows = 8;
      ctx.strokeStyle = "#0b153210";
      ctx.lineWidth = 1;
      for (let c = 0; c <= cols; c++) {
        ctx.beginPath();
        ctx.moveTo((c / cols) * W, 0);
        ctx.lineTo((c / cols) * W, H);
        ctx.stroke();
      }
      for (let r = 0; r <= rows; r++) {
        ctx.beginPath();
        ctx.moveTo(0, (r / rows) * H);
        ctx.lineTo(W, (r / rows) * H);
        ctx.stroke();
      }
    };

    // ── Vignette ──────────────────────────────────────────
    const drawVignette = () => {
      const W = canvas.width, H = canvas.height;
      const grad = ctx.createRadialGradient(W / 2, H / 2, H * 0.1, W / 2, H / 2, H);
      grad.addColorStop(0, "#00000000");
      grad.addColorStop(1, "#0B15321f");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    };

    const draw = () => {
      t += 0.012;
      drawGrid();
      drawVignette();
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={gridRef} className="bg-canvas" />;
};

export default BackgroundGrid;