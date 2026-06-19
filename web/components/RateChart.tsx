import { useRef, useState } from "react";
import type { RateObservation } from "../types/rate-observation";
import { pct } from "../format";

const COLOR = "#2563eb";

export const RateChart = ({ rates }: { rates: RateObservation[] }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  if (rates.length === 0) {
    return <p className="muted">Aucune donnée de taux. Lance la collecte (`npm run collect`).</p>;
  }

  const width = 640;
  const height = 220;
  const pad = 36;
  const sorted = [...rates].sort((a, b) => a.date.localeCompare(b.date));
  const values = sorted.map((r) => r.rateBp);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (i: number) => pad + (i * (width - 2 * pad)) / Math.max(1, sorted.length - 1);
  const y = (v: number) => height - pad - ((v - min) / span) * (height - 2 * pad);
  const points = sorted.map((r, i) => `${x(i)},${y(r.rateBp)}`).join(" ");

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const vbX = ((e.clientX - rect.left) / rect.width) * width;
    const step = (width - 2 * pad) / Math.max(1, sorted.length - 1);
    const i = Math.round((vbX - pad) / step);
    setHover(Math.max(0, Math.min(sorted.length - 1, i)));
  };

  const hovered = hover === null ? null : sorted[hover];
  const px = hover === null ? 0 : x(hover);
  const py = hovered ? y(hovered.rateBp) : 0;
  const boxW = 86;
  const flip = px > width - boxW - 12;
  const boxX = flip ? px - boxW - 8 : px + 8;
  const boxY = Math.max(2, py - 46);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      role="img"
      aria-label="Évolution des taux de marché"
      onMouseMove={onMove}
      onMouseLeave={() => setHover(null)}
    >
      <polyline fill="none" stroke={COLOR} strokeWidth={2} points={points} />
      <text x={pad} y={16} fontSize={12} fill="#888">
        {pct(max)}
      </text>
      <text x={pad} y={height - pad + 16} fontSize={12} fill="#888">
        {pct(min)}
      </text>

      {hovered && (
        <g>
          <line x1={px} y1={pad} x2={px} y2={height - pad} stroke="#cbd5e1" strokeDasharray="3 3" />
          <circle cx={px} cy={py} r={5} fill={COLOR} />
          <g transform={`translate(${boxX},${boxY})`}>
            <rect width={boxW} height={40} rx={4} fill="#1f2937" opacity={0.92} />
            <text x={8} y={16} fontSize={11} fill="#cbd5e1">
              {hovered.date}
            </text>
            <text x={8} y={32} fontSize={13} fontWeight="bold" fill="#ffffff">
              {pct(hovered.rateBp)}
            </text>
          </g>
        </g>
      )}

      {/* transparent overlay to capture the cursor across the whole plot area */}
      <rect
        x={pad}
        y={pad}
        width={width - 2 * pad}
        height={height - 2 * pad}
        fill="transparent"
        pointerEvents="all"
      />
    </svg>
  );
};
