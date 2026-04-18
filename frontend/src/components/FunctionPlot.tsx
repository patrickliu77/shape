import { useEffect, useRef } from "react";

type Props = {
  fn: (x: number) => number;
  xRange: [number, number];
  yRange?: [number, number];
  xLabel?: string;
  yLabel?: string;
  samples?: number;
  highlightX?: number;
};

const PAD = { top: 20, right: 20, bottom: 32, left: 40 };

export function FunctionPlot({
  fn,
  xRange,
  yRange,
  xLabel = "x",
  yLabel = "y",
  samples = 600,
  highlightX,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement!;
    const cssW = parent.clientWidth;
    const cssH = parent.clientHeight || 320;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    const plotW = cssW - PAD.left - PAD.right;
    const plotH = cssH - PAD.top - PAD.bottom;

    const [x0, x1] = xRange;
    const xs: number[] = [];
    const ys: number[] = [];
    for (let i = 0; i <= samples; i++) {
      const x = x0 + ((x1 - x0) * i) / samples;
      const y = fn(x);
      xs.push(x);
      ys.push(y);
    }
    let [y0, y1] = yRange ?? [Infinity, -Infinity];
    if (!yRange) {
      for (const y of ys) {
        if (!isFinite(y)) continue;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
      if (!isFinite(y0) || !isFinite(y1) || y0 === y1) {
        y0 = -1;
        y1 = 1;
      }
      const pad = (y1 - y0) * 0.1;
      y0 -= pad;
      y1 += pad;
    }

    const toPx = (x: number, y: number): [number, number] => [
      PAD.left + ((x - x0) / (x1 - x0)) * plotW,
      PAD.top + (1 - (y - y0) / (y1 - y0)) * plotH,
    ];

    // grid
    ctx.strokeStyle = "#e7e4d8";
    ctx.lineWidth = 1;
    ctx.font = "11px Inter, sans-serif";
    ctx.fillStyle = "#9a9788";
    for (let i = 0; i <= 6; i++) {
      const gx = x0 + ((x1 - x0) * i) / 6;
      const [px] = toPx(gx, 0);
      ctx.beginPath();
      ctx.moveTo(px, PAD.top);
      ctx.lineTo(px, PAD.top + plotH);
      ctx.stroke();
      ctx.fillText(gx.toFixed(1), px - 10, PAD.top + plotH + 16);
    }
    for (let i = 0; i <= 4; i++) {
      const gy = y0 + ((y1 - y0) * i) / 4;
      const [, py] = toPx(0, gy);
      ctx.beginPath();
      ctx.moveTo(PAD.left, py);
      ctx.lineTo(PAD.left + plotW, py);
      ctx.stroke();
      ctx.fillText(gy.toFixed(1), 4, py + 4);
    }

    // axes (x=0, y=0) if in range
    ctx.strokeStyle = "#888070";
    ctx.lineWidth = 1.25;
    if (x0 <= 0 && 0 <= x1) {
      const [px] = toPx(0, 0);
      ctx.beginPath();
      ctx.moveTo(px, PAD.top);
      ctx.lineTo(px, PAD.top + plotH);
      ctx.stroke();
    }
    if (y0 <= 0 && 0 <= y1) {
      const [, py] = toPx(0, 0);
      ctx.beginPath();
      ctx.moveTo(PAD.left, py);
      ctx.lineTo(PAD.left + plotW, py);
      ctx.stroke();
    }

    // curve
    ctx.strokeStyle = "#7c3aed";
    ctx.lineWidth = 2.25;
    ctx.lineJoin = "round";
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < xs.length; i++) {
      const y = ys[i];
      if (!isFinite(y) || y < y0 - 1e6 || y > y1 + 1e6) {
        started = false;
        continue;
      }
      const [px, py] = toPx(xs[i], Math.max(y0 - 10, Math.min(y1 + 10, y)));
      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();

    // highlight
    if (highlightX !== undefined && highlightX >= x0 && highlightX <= x1) {
      const yh = fn(highlightX);
      const [px, py] = toPx(highlightX, yh);
      ctx.fillStyle = "#7c3aed";
      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // axis labels
    ctx.fillStyle = "#55513f";
    ctx.font = "11px Inter, sans-serif";
    ctx.fillText(xLabel, PAD.left + plotW - 8, PAD.top + plotH + 28);
    ctx.fillText(yLabel, 6, PAD.top - 6);
  }, [fn, xRange, yRange, xLabel, yLabel, samples, highlightX]);

  return (
    <div className="relative w-full h-80 rounded-lg bg-white border border-stone-200 overflow-hidden">
      <canvas ref={canvasRef} />
    </div>
  );
}
