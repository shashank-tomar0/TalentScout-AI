"use client";

import {
  Radar,
  RadarChart as ReRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface RadarChartProps {
  data: {
    subject: string;
    A: number;
    B?: number;
    fullMark: number;
  }[];
}

export default function RadarChart({ data }: RadarChartProps) {
  return (
    <div className="w-full h-80 bg-black/20 rounded-3xl border border-white/5 p-4 backdrop-blur-sm relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--cyan)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
      <ResponsiveContainer width="100%" height="100%">
        <ReRadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 9, fontWeight: "800", letterSpacing: "0.05em" }}
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />

          <Radar
            name="Winner"
            dataKey="A"
            stroke="var(--cyan)"
            strokeWidth={3}
            fill="var(--cyan)"
            fillOpacity={0.2}
            animationBegin={0}
            animationDuration={1500}
          />

          {data[0]?.B !== undefined && (
            <Radar
              name="Runner Up"
              dataKey="B"
              stroke="var(--rose)"
              strokeWidth={2}
              strokeDasharray="4 4"
              fill="var(--rose)"
              fillOpacity={0.15}
              animationBegin={500}
              animationDuration={1500}
            />
          )}

          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(2, 6, 23, 0.9)",
              borderColor: "rgba(255,255,255,0.1)",
              borderRadius: "12px",
              fontSize: "10px",
              fontWeight: "bold",
              color: "#fff"
            }}
            itemStyle={{ color: "var(--cyan)" }}
          />
        </ReRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
