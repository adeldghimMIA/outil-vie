"use client";

import {
  ResponsiveContainer,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";

interface RadarDataPoint {
  axis: string;
  value: number;
  fullMark: number;
  color: string;
}

interface RadarChartProps {
  data: RadarDataPoint[];
}

export function RadarChart({ data }: RadarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        Aucune donnee disponible
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsRadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
        <PolarGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <PolarAngleAxis
          dataKey="axis"
          tick={{ fontSize: 12, fill: "#d1d5db" }}
          className="[.recharts-text]:fill-foreground dark:[.recharts-text]:fill-[#d1d5db]"
        />
        <Radar
          name="Progression"
          dataKey="value"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.35}
          strokeWidth={2}
        />
      </RechartsRadarChart>
    </ResponsiveContainer>
  );
}
